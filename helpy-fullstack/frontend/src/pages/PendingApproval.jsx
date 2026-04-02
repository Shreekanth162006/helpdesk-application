import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Heading,
  Text,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';


export default function PendingApproval() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login-type');
        return;
      }
      // If user is approved, redirect to home
      if (user.approvalStatus === 'approved' && user.active) {
        navigate('/');
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  const isCustomer = user?.role === 'Customer';
  const auroraBg = 'linear-gradient(135deg, #0f172a 0%, #115e59 50%, #064e3b 100%)';
  const phantomBg = useColorModeValue('linear-gradient(135deg, #eff6ff, #e0f2fe)', 'linear-gradient(135deg, #0f172a, #1e293b)');

  const mainBg = isCustomer ? auroraBg : phantomBg;
  const boxBg = isCustomer ? "whiteAlpha.200" : useColorModeValue('white', 'gray.900');
  const headingColor = isCustomer ? "white" : useColorModeValue('blue.700', 'blue.200');

  return (
    <Box minH="100vh" py="16" bg={mainBg} bgAttachment="fixed">
      <Box
        maxW="md"
        mx="auto"
        p="8"
        bg={boxBg}
        borderRadius="lg"
        shadow="2xl"
        backdropFilter={isCustomer ? "blur(10px)" : "none"}
        border={isCustomer ? "1px solid" : "none"}
        borderColor="whiteAlpha.300"
      >
        <VStack align="stretch" gap="6">
          <Heading size="lg" color={headingColor} textAlign="center">
            Account Pending Approval
          </Heading>

          {user.approvalStatus === 'pending' && (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Waiting for Approval</AlertTitle>
                <AlertDescription>
                  Your account ({user.email}) has been created and is waiting for super admin approval.
                  You will be able to access the system once your account is approved.
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {user.approvalStatus === 'rejected' && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Account Rejected</AlertTitle>
                <AlertDescription>
                  Your account registration has been rejected. Please contact the administrator for more information.
                </AlertDescription>
              </Box>
            </Alert>
          )}

          <Box p="4" bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="md" borderWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} mb="2">
              <strong>Email:</strong> {user.email}
            </Text>
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} mb="2">
              <strong>Name:</strong> {user.name || '—'}
            </Text>
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
              <strong>Role:</strong> {user.role}
            </Text>
          </Box>

          <Button
            colorScheme="blue"
            onClick={() => {
              // Check status by trying to refresh user data
              window.location.reload();
            }}
          >
            Refresh Status
          </Button>

          <Text fontSize="sm" color="gray.400" textAlign="center">
            You can close this page. Once approved, you'll be able to log in normally.
          </Text>
        </VStack>
      </Box>
    </Box>
  );
}

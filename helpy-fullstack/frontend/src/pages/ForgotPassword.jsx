import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../api/client';
import PasswordInput from '../components/PasswordInput';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('enter_email'); // enter_email | pending | approved
  const [requestId, setRequestId] = useState(null);
  const [role, setRole] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const submitEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: 'Enter your registered email', status: 'error', isClosable: true });
      return;
    }
    setLoading(true);
    try {
      const res = await auth.requestResetPassword(email.trim());
      setRequestId(res.data.requestId);
      setRole(res.data.role);
      setStep('pending');
      toast({
        title: 'Request sent',
        description: 'Wait for super admin approval. You can check status below.',
        status: 'success',
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: err.response?.data?.error || 'Request failed',
        status: 'error',
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    const emailToCheck = email.trim();
    if (!emailToCheck) {
      toast({ title: 'Enter your email first', status: 'warning', isClosable: true });
      return;
    }
    setStatusLoading(true);
    try {
      const res = await auth.getResetPasswordStatus(emailToCheck);
      if (res.data.approved) {
        setRequestId(res.data.requestId);
        setRole(res.data.role);
        setStep('approved');
        toast({ title: 'Approved', description: 'You can set your new password now.', status: 'success', isClosable: true });
      } else if (res.data.status === 'rejected') {
        toast({ title: 'Request rejected', status: 'error', isClosable: true });
      } else {
        toast({ title: 'Still pending', description: 'Super admin has not approved yet.', status: 'info', isClosable: true });
      }
    } catch (err) {
      toast({ title: err.response?.data?.error || 'Could not check status', status: 'error', isClosable: true });
    } finally {
      setStatusLoading(false);
    }
  };

  const submitNewPassword = async (e) => {
    e.preventDefault();
    if (!email || !requestId || !newPassword || newPassword.length < 6) {
      toast({ title: 'New password must be at least 6 characters', status: 'error', isClosable: true });
      return;
    }
    setLoading(true);
    try {
      await auth.resetPassword(email.trim(), requestId, newPassword);
      toast({ title: 'Password reset successfully', status: 'success', isClosable: true });
      navigate('/login');
    } catch (err) {
      toast({
        title: err.response?.data?.error || 'Password reset failed',
        status: 'error',
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt="20" p="6" bg={useColorModeValue('white', 'gray.700')} borderRadius="lg" shadow="md">
      <Heading size="lg" mb="4">
        Reset Password
      </Heading>

      {/* Step 1: Enter registered email */}
      {(step === 'enter_email' || step === 'pending') && (
        <>
          <form onSubmit={submitEmail}>
            <VStack align="stretch" gap="4">
              <FormControl isRequired>
                <FormLabel>Registered Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  autoComplete="off"
                />
              </FormControl>
              <Button type="submit" colorScheme="blue" isLoading={loading} w="full" isDisabled={step === 'pending'}>
                {step === 'pending' ? 'Request sent' : 'Verify & request password reset'}
              </Button>
            </VStack>
          </form>
          {step === 'enter_email' && (
            <Button mt="2" size="sm" variant="ghost" onClick={checkStatus} isLoading={statusLoading} w="full">
              Already requested? Check approval status
            </Button>
          )}
        </>
      )}

      {/* After request: show role and wait for approval */}
      {step === 'pending' && (
        <Box mt="6">
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Waiting for approval</AlertTitle>
              <AlertDescription>
                Your role: <strong>{role}</strong>. A notification has been sent to super admins. Once they approve, you can set a new password below.
              </AlertDescription>
            </Box>
          </Alert>
          <Button mt="4" size="sm" variant="outline" onClick={checkStatus} isLoading={statusLoading} w="full">
            Check if approved
          </Button>
        </Box>
      )}

      {/* New password section — only enabled after approval */}
      {step === 'approved' && (
        <Box mt="6">
          <Alert status="success" borderRadius="md" mb="4">
            <AlertIcon />
            <Box>
              <AlertTitle>Approved</AlertTitle>
              <AlertDescription>You can now set your new password.</AlertDescription>
            </Box>
          </Alert>
          <form onSubmit={submitNewPassword}>
            <VStack align="stretch" gap="4">
              <FormControl isRequired>
                <FormLabel>New Password</FormLabel>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  autoComplete="off"
                  minLength={6}
                />
              </FormControl>
              <Button type="submit" colorScheme="green" isLoading={loading} w="full">
                Set new password
              </Button>
            </VStack>
          </form>
        </Box>
      )}

      {/* If user had already requested and comes back: allow checking status by email again */}
      {step === 'enter_email' && (
        <Text mt="4" fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} textAlign="center">
          Already requested? Enter the same email and submit again to get a new request, or use the status check after requesting.
        </Text>
      )}

      <Divider my="6" />
      <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} textAlign="center">
        <Link to="/login">Back to Login</Link>
      </Text>
    </Box>
  );
}

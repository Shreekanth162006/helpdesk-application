import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  VStack,
  Heading,
  Text,
  Container,
  useColorModeValue,
} from '@chakra-ui/react';

export default function LoginType() {
  const navigate = useNavigate();
  const bg = useColorModeValue('white', 'gray.800');

  const handleSelectType = (type) => {
    navigate(`/login?type=${type}`);
  };

  const auroraBg = 'linear-gradient(135deg, #0f172a 0%, #115e59 50%, #064e3b 100%)';

  return (
    <Box minH="100vh" bg={auroraBg} bgAttachment="fixed" display="flex" alignItems="center">
      <Container maxW="md">
        <Box
          p="8"
          bg="whiteAlpha.200"
          borderRadius="xl"
          shadow="2xl"
          textAlign="center"
          backdropFilter="blur(10px)"
          border="1px solid"
          borderColor="whiteAlpha.300"
        >
          <Heading size="xl" mb="2" color="white">
            Welcome to Helpy
          </Heading>
          <Text fontSize="lg" color="whiteAlpha.800" mb="8">
            Choose how you want to sign in.
          </Text>

          <VStack gap="4" align="stretch">
            <Button
              size="lg"
              colorScheme="blue"
              onClick={() => handleSelectType('official')}
              py="6"
              fontSize="lg"
            >
              Official Login
            </Button>
            <Button
              size="lg"
              colorScheme="gray"
              variant="outline"
              onClick={() => handleSelectType('customer')}
              py="6"
              fontSize="lg"
            >
              Customer Login
            </Button>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}

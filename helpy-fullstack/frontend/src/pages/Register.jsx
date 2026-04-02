import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  useColorModeValue,
} from '@chakra-ui/react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Register as Customer only
      await register(email, password, name, 'Customer');
      toast({ title: 'Account created successfully', status: 'success', isClosable: true });
      navigate('/');
    } catch (err) {
      toast({
        title: err.response?.data?.error || 'Registration failed',
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
        Register
      </Heading>
      <form onSubmit={submit}>
        <VStack align="stretch" gap="4">
          <FormControl isRequired>
            <FormLabel>Name</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="off"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="off"
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="off"
            />
          </FormControl>
          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} textAlign="center" mt="-2">
            Creating a Customer account. Official accounts are created by administrators.
          </Text>
          <Button type="submit" colorScheme="blue" isLoading={loading} w="full">
            Create account
          </Button>
        </VStack>
      </form>
      <Text mt="4" fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} textAlign="center">
        You already have an account? <Link to="/login">Log in</Link>
      </Text>
    </Box>
  );
}

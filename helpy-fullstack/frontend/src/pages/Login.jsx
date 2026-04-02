import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  VStack,
  Heading,
  Text,
  useToast,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
} from '@chakra-ui/react';
// Simple eye icons as SVG components
const ViewIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
  </svg>
);

const ViewOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745A10.029 10.029 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.97 4.97a2.5 2.5 0 113.536 3.536l-3.536-3.536z" clipRule="evenodd" />
    <path d="M10 6.5a2.5 2.5 0 00-2.5 2.5c0 .667.26 1.273.687 1.727L10 6.5zm-4.78 2.72a4 4 0 005.56 5.56l-1.94-1.94A2.5 2.5 0 016.5 10c0-.54.146-1.04.404-1.47l-1.724-1.724zM15.12 12.88a4 4 0 01-1.44 1.44L10 11.5l-3.68-3.68A4 4 0 0110 6.5c1.38 0 2.5 1.12 2.5 2.5 0 .54-.146 1.04-.404 1.47l1.024 1.024z" />
  </svg>
);

export default function Login() {
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type'); // 'official' or 'customer'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { login, registerOfficial } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Redirect to landing page if no type is specified
  useEffect(() => {
    if (!userType) {
      navigate('/login-type');
    }
  }, [userType, navigate]);

  const isOfficial = userType === 'official';
  const isCustomer = userType === 'customer';
  const mainBg = isOfficial
    ? 'linear-gradient(135deg, #0f172a, #1e293b)'
    : useColorModeValue('linear-gradient(135deg, #eff6ff, #e0f2fe)', 'linear-gradient(135deg, #0f172a, #1e293b)');
  const headingColor = isOfficial ? useColorModeValue('blue.600', 'blue.200') : useColorModeValue('blue.700', 'blue.200');

  const submit = async (e) => {
    e.preventDefault();

    // Validate role is selected for officials
    if (isOfficial && !role) {
      toast({
        title: 'Please select your role',
        status: 'error',
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      await login(email, password, isOfficial ? role : undefined);
      toast({ title: 'Logged in', status: 'success', isClosable: true });
      navigate('/');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Login failed';
      toast({
        title: 'Login attempt failed',
        description: errorMsg,
        status: 'error',
        isClosable: true,
        duration: 5000,
      });
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!email || !password || !name || !role) {
      toast({
        title: 'All fields are required',
        status: 'error',
        isClosable: true,
      });
      return;
    }
    setCreating(true);
    try {
      await registerOfficial(email, password, name, role);
      toast({
        title: 'Account created',
        description: 'Waiting for super admin approval. You will be notified once approved.',
        status: 'success',
        isClosable: true,
        duration: 5000,
      });
      // (Removed redirect to keep notification on this page as requested)
      // navigate('/pending-approval');
    } catch (err) {
      toast({
        title: err.response?.data?.error || 'Account creation failed',
        status: 'error',
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  if (!userType) {
    return null; // Will redirect via useEffect
  }

  return (
    <Box
      minH="100vh"
      py="16"
      bg={mainBg}
    >
      <Box
        maxW="md"
        mx="auto"
        p="8"
        bg={isOfficial ? useColorModeValue('white', 'gray.900') : useColorModeValue('white', 'gray.700')}
        borderRadius="lg"
        shadow="2xl"
      >
        <VStack mb="4" align="stretch">
          <Heading size="lg" color={headingColor}>
            {isOfficial ? 'Official Login' : 'Customer Login'}
          </Heading>
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate('/login-type')}
            alignSelf="flex-start"
            colorScheme="blue"
          >
            ← Change login type
          </Button>
        </VStack>

        {/* Top visual section differs for customer vs official */}
        {isCustomer && (
          <Box
            mb="6"
            p="4"
            borderRadius="lg"
            bgGradient={useColorModeValue('linear(to-r, blue.50, blue.100)', 'linear(to-r, blue.900, blue.800)')}
          >
            <Heading size="sm" mb="1" color="blue.700">
              Fast customer support
            </Heading>
            <Text fontSize="sm" color="blue.800">
              Track your tickets, get updates in real time, and stay connected with our service team.
            </Text>
          </Box>
        )}

        {isOfficial && (
          <Box
            mb="6"
            p="4"
            borderRadius="lg"
            bg={useColorModeValue('white', 'gray.800')}
            borderWidth="1px"
            borderColor={useColorModeValue('gray.200', 'gray.700')}
          >
            <Heading size="sm" mb="1" color={headingColor}>
              Helpy agent workspace
            </Heading>
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
              Secure portal for Super Admins and agents to manage tickets, users, and knowledge base.
            </Text>
          </Box>
        )}

        {isOfficial ? (
          <Tabs colorScheme="blue" defaultIndex={0}>
            <TabList>
              <Tab color={useColorModeValue('gray.600', 'gray.300')}>Login</Tab>
              <Tab color={useColorModeValue('gray.600', 'gray.300')}>Create Account</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px="0">
                <form onSubmit={submit}>
                  <VStack align="stretch" gap="4">
                    <FormControl isRequired>
                      <FormLabel color={useColorModeValue('gray.700', 'gray.200')}>Email</FormLabel>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="off"
                        bg={useColorModeValue('white', 'gray.800')}
                        borderColor={useColorModeValue('gray.200', 'gray.700')}
                        color={useColorModeValue('gray.800', 'gray.100')}
                        _placeholder={{ color: useColorModeValue('gray.500', 'gray.500') }}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel color={useColorModeValue('gray.700', 'gray.200')}>Password</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="off"
                          bg={useColorModeValue('white', 'gray.800')}
                          borderColor={useColorModeValue('gray.200', 'gray.700')}
                          color={useColorModeValue('gray.800', 'gray.100')}
                          _placeholder={{ color: useColorModeValue('gray.500', 'gray.500') }}
                        />
                        <InputRightElement width="4.5rem">
                          <IconButton
                            h="1.75rem"
                            size="sm"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                            onClick={() => setShowPassword(!showPassword)}
                            variant="ghost"
                          />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel color={useColorModeValue('gray.700', 'gray.200')}>Role</FormLabel>
                      <Select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Select Role"
                        bg={useColorModeValue('white', 'gray.800')}
                        borderColor={useColorModeValue('gray.200', 'gray.700')}
                        color={useColorModeValue('gray.700', 'gray.300')}
                        iconColor={useColorModeValue('gray.700', 'gray.300')}
                        sx={{
                          option: {
                            backgroundColor: '#020617',
                            color: '#E5E7EB',
                          },
                        }}
                      >
                        <option value="Super Admin">Super Admin</option>
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Agent">Agent</option>
                        <option value="Light Agent">Light Agent</option>
                      </Select>
                    </FormControl>
                    <Button type="submit" colorScheme="blue" isLoading={loading} w="full">
                      Log in
                    </Button>
                  </VStack>
                </form>
              </TabPanel>
              <TabPanel px="0">
                <form onSubmit={submitCreate}>
                  <VStack align="stretch" gap="4">
                    <FormControl isRequired>
                      <FormLabel color={useColorModeValue('gray.700', 'gray.200')}>Name</FormLabel>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        autoComplete="off"
                        bg={useColorModeValue('white', 'gray.800')}
                        borderColor={useColorModeValue('gray.200', 'gray.700')}
                        color={useColorModeValue('gray.800', 'gray.100')}
                        _placeholder={{ color: useColorModeValue('gray.500', 'gray.500') }}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel color={useColorModeValue('gray.700', 'gray.200')}>Email</FormLabel>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="off"
                        bg={useColorModeValue('white', 'gray.800')}
                        borderColor={useColorModeValue('gray.200', 'gray.700')}
                        color={useColorModeValue('gray.800', 'gray.100')}
                        _placeholder={{ color: useColorModeValue('gray.500', 'gray.500') }}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel color={useColorModeValue('gray.700', 'gray.200')}>Password</FormLabel>
                      <PasswordInput
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        autoComplete="off"
                        bg={useColorModeValue('white', 'gray.800')}
                        borderColor={useColorModeValue('gray.200', 'gray.700')}
                        color={useColorModeValue('gray.800', 'gray.100')}
                        _placeholder={{ color: useColorModeValue('gray.500', 'gray.500') }}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel color={useColorModeValue('gray.700', 'gray.200')}>Role</FormLabel>
                      <Select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Select Role"
                        bg={useColorModeValue('white', 'gray.800')}
                        borderColor={useColorModeValue('gray.200', 'gray.700')}
                        color={useColorModeValue('gray.700', 'gray.300')}
                        iconColor={useColorModeValue('gray.700', 'gray.300')}
                        sx={{
                          option: {
                            backgroundColor: '#020617',
                            color: '#E5E7EB',
                          },
                        }}
                      >
                        <option value="Super Admin">Super Admin</option>
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Agent">Agent</option>
                        <option value="Light Agent">Light Agent</option>
                      </Select>
                    </FormControl>
                    <Button type="submit" colorScheme="green" isLoading={creating} w="full">
                      Create Account
                    </Button>
                    <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')} textAlign="center">
                      Your account will be created and sent for super admin approval. You'll be notified once approved.
                    </Text>
                  </VStack>
                </form>
              </TabPanel>
            </TabPanels>
          </Tabs>
        ) : (
          <form onSubmit={submit}>
            <VStack align="stretch" gap="4">
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
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="off"
                  />
                  <InputRightElement width="4.5rem">
                    <IconButton
                      h="1.75rem"
                      size="sm"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <Button type="submit" colorScheme="blue" isLoading={loading} w="full">
                Log in
              </Button>
            </VStack>
          </form>
        )}
        <VStack mt="4" gap="2" align="stretch">
          <Text
            fontSize="sm"
            color={useColorModeValue('gray.600', 'gray.300')}
            textAlign="center"
          >
            <Link to="/forgot-password">Forgot Password?</Link>
          </Text>
          {!isOfficial && (
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')} textAlign="center">
              You don't have an account? <Link to="/register">Create account</Link>
            </Text>
          )}
        </VStack>
      </Box>
    </Box>
  );
}

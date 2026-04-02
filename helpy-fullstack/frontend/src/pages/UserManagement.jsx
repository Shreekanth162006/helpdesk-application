import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { users as usersApi, notifications as notificationsApi, auth as authApi } from '../api/client';
import { Navigate } from 'react-router-dom';
import AutocompleteInput from '../components/AutocompleteInput';
import { saveEntry } from '../utils/autocompleteStorage';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Select,
  Input,
  Button,
  TableContainer,
  HStack,
  useToast,
  Text,
  VStack,
  useColorModeValue,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { ViewIcon } from '@chakra-ui/icons';

export default function UserManagement() {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Customer');
  const [creating, setCreating] = useState(false);
  const [pendingResets, setPendingResets] = useState([]);
  const [loadingResets, setLoadingResets] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      if (user?.role === 'Super Admin') {
        loadPendingResets();
      }
    }
  }, [isAdmin]);

  const loadPendingResets = async () => {
    setLoadingResets(true);
    try {
      const res = await authApi.pendingResetRequests();
      setPendingResets(res.data || []);
    } catch (err) {
      setPendingResets([]);
    } finally {
      setLoadingResets(false);
    }
  };

  const approveReset = async (requestId) => {
    try {
      await authApi.approveResetPassword(requestId);
      toast({ title: 'Password reset approved', status: 'success', isClosable: true });
      loadPendingResets();
    } catch (err) {
      toast({ title: err.response?.data?.error || 'Failed to approve', status: 'error', isClosable: true });
    }
  };

  const rejectReset = async (requestId) => {
    try {
      await authApi.rejectResetPassword(requestId);
      toast({ title: 'Password reset rejected', status: 'success', isClosable: true });
      loadPendingResets();
    } catch (err) {
      toast({ title: err.response?.data?.error || 'Failed to reject', status: 'error', isClosable: true });
    }
  };

  const approveAccount = async (userId) => {
    try {
      await usersApi.approve(userId);
      toast({ title: 'Account approved', status: 'success', isClosable: true });
      loadUsers();
    } catch (err) {
      toast({ title: err.response?.data?.error || 'Failed to approve', status: 'error', isClosable: true });
    }
  };

  const rejectAccount = async (userId) => {
    try {
      await usersApi.reject(userId);
      toast({ title: 'Account rejected', status: 'success', isClosable: true });
      loadUsers();
    } catch (err) {
      toast({ title: err.response?.data?.error || 'Failed to reject', status: 'error', isClosable: true });
    }
  };

  const loadUsers = async () => {
    try {
      const res = await usersApi.list();
      setUsers(res.data);
    } catch (err) {
      toast({
        title: err.response?.data?.error || 'Failed to load users',
        status: 'error',
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!email || !role) {
      toast({
        title: 'Email and role are required',
        status: 'error',
        isClosable: true,
      });
      return;
    }
    setCreating(true);
    try {
      await usersApi.create({ email, role, name: email.split('@')[0] });
      // Save email to autocomplete suggestions
      saveEntry('email', email);
      toast({ title: 'User created', status: 'success', isClosable: true });
      setEmail('');
      setRole('Customer');
      loadUsers();
      if (user?.role === 'Super Admin') loadNotifications();
    } catch (err) {
      toast({
        title: err.response?.data?.error || 'Failed to create user',
        status: 'error',
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleUser = async (userId) => {
    try {
      const user = users.find((u) => u.id === userId);
      await usersApi.update(userId, { active: !user.active });
      toast({ title: 'User status updated', status: 'success', isClosable: true });
      loadUsers();
    } catch (err) {
      toast({
        title: err.response?.data?.error || 'Failed to update user',
        status: 'error',
        isClosable: true,
      });
    }
  };

  const resetPassword = async (userId) => {
    try {
      await usersApi.resetPassword(userId);
      toast({ title: 'Password reset to 123456', status: 'success', isClosable: true });
    } catch (err) {
      toast({
        title: err.response?.data?.error || 'Failed to reset password',
        status: 'error',
        isClosable: true,
      });
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <Box>
        <Heading size="lg" mb="4">
          Access Denied
        </Heading>
        <p>You need Admin or Super Admin privileges to access this page.</p>
      </Box>
    );
  }

  const isCustomer = user?.role === 'Customer';
  const headingColor = isCustomer ? "white" : "inherit";
  const boxBg = isCustomer ? "whiteAlpha.200" : useColorModeValue('white', 'gray.700');
  const boxBorder = isCustomer ? "1px solid" : "none";
  const borderColor = isCustomer ? "whiteAlpha.300" : "transparent";

  const roles = ['Super Admin', 'Admin', 'Manager', 'Agent', 'Light Agent', 'Customer'];

  const UserTable = ({ userList, title }) => (
    <TableContainer borderRadius="lg" shadow="sm" border="1px solid" borderColor={useColorModeValue('gray.100', 'gray.700')}>
      <Table size="sm">
        <Thead bg={useColorModeValue('gray.50', 'gray.800')}>
          <Tr>
            <Th>Email</Th>
            <Th>Name</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {userList.map((u) => (
            <Tr key={u.id}>
              <Td>{u.email}</Td>
              <Td>{u.name || '—'}</Td>
              <Td>
                <Badge colorScheme={u.active ? 'green' : 'red'}>{u.active ? 'Active' : 'Inactive'}</Badge>
              </Td>
              <Td>
                <HStack gap="2">
                  <Button
                    size="xs"
                    colorScheme="orange"
                    onClick={() => toggleUser(u.id)}
                  >
                    {u.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="xs"
                    colorScheme="red"
                    onClick={() => resetPassword(u.id)}
                  >
                    Reset Pass
                  </Button>
                </HStack>
              </Td>
            </Tr>
          ))}
          {userList.length === 0 && (
            <Tr><Td colSpan={4} textAlign="center" py={4} color="gray.500">No {title.toLowerCase()} found.</Td></Tr>
          )}
        </Tbody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <Heading size="lg" mb="4" color={headingColor}>
        User Management
      </Heading>

      {user?.role === 'Super Admin' && (
        <>
          <Box mb="6" p="4" bg={useColorModeValue('white', 'gray.700')} borderRadius="lg" shadow="sm">
            <HStack justify="space-between" mb="2">
              <Heading size="md">Pending account approvals</Heading>
              <Button size="sm" variant="outline" onClick={loadUsers}>
                Refresh
              </Button>
            </HStack>
            {users.filter((u) => u.approvalStatus === 'pending').length === 0 ? (
              <Text color={useColorModeValue('gray.500', 'gray.300')} fontSize="sm">
                No pending account approvals.
              </Text>
            ) : (
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Email</Th>
                      <Th>Role</Th>
                      <Th>Created</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {users
                      .filter((u) => u.approvalStatus === 'pending')
                      .map((u) => (
                        <Tr key={u.id}>
                          <Td>{u.name || '—'}</Td>
                          <Td>{u.email}</Td>
                          <Td>
                            <Badge>{u.role}</Badge>
                          </Td>
                          <Td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}</Td>
                          <Td>
                            <HStack gap="2">
                              <Button size="xs" colorScheme="green" onClick={() => approveAccount(u.id)}>
                                Approve
                              </Button>
                              <Button size="xs" colorScheme="red" variant="outline" onClick={() => rejectAccount(u.id)}>
                                Reject
                              </Button>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </Box>

          <Box mb="6" p="4" bg={useColorModeValue('white', 'gray.700')} borderRadius="lg" shadow="sm">
            <HStack justify="space-between" mb="2">
              <Heading size="md">Password reset requests</Heading>
              <Button size="sm" variant="outline" onClick={loadPendingResets} isLoading={loadingResets}>
                Refresh
              </Button>
            </HStack>
            {pendingResets.length === 0 ? (
              <Text color={useColorModeValue('gray.500', 'gray.300')} fontSize="sm">
                No pending password reset requests.
              </Text>
            ) : (
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Email</Th>
                      <Th>Role</Th>
                      <Th>Requested</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {pendingResets.map((r) => (
                      <Tr key={r.id}>
                        <Td>{r.email}</Td>
                        <Td>
                          <Badge>{r.role}</Badge>
                        </Td>
                        <Td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</Td>
                        <Td>
                          <HStack gap="2">
                            <Button size="xs" colorScheme="green" onClick={() => approveReset(r.id)}>
                              Approve
                            </Button>
                            <Button size="xs" colorScheme="red" variant="outline" onClick={() => rejectReset(r.id)}>
                              Reject
                            </Button>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </>
      )}

      <Box mb="6" p="4" bg={boxBg} borderRadius="lg" shadow="sm" backdropFilter={isCustomer ? "blur(10px)" : "none"} border={boxBorder} borderColor={borderColor}>
        <Heading size="md" mb="4" color={headingColor}>
          Create User
        </Heading>
        <HStack gap="4" mb="4">
          <AutocompleteInput
            fieldType="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            flex="1"
            bg={isCustomer ? "whiteAlpha.200" : "inherit"}
            color={isCustomer ? "white" : "inherit"}
          />
          <Select value={role} onChange={(e) => setRole(e.target.value)} maxW="200px">
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Agent">Agent</option>
            <option value="Light Agent">Light Agent</option>
            <option value="Customer">Customer</option>
          </Select>
          <Button colorScheme="green" onClick={createUser} isLoading={creating}>
            Create User
          </Button>
        </HStack>
      </Box>

      {loading ? (
        <Spinner color={isCustomer ? "white" : "purple.500"} />
      ) : (
        <Tabs variant="enclosed" colorScheme="purple">
          <TabList mb="1em" overflowX="auto" overflowY="hidden" py={2}>
            {roles.map(r => (
              <Tab
                key={r}
                fontWeight="bold"
                _selected={{ color: 'white', bg: 'purple.500' }}
                borderRadius="md"
                mr={2}
              >
                {r} ({users.filter(u => u.role === r).length})
              </Tab>
            ))}
          </TabList>
          <TabPanels bg={boxBg} borderRadius="lg" p={4} border={boxBorder} borderColor={borderColor} backdropFilter={isCustomer ? "blur(10px)" : "none"}>
            {roles.map(r => (
              <TabPanel key={r} p={0}>
                <UserTable
                  userList={users.filter(u => u.role === r)}
                  title={r}
                />
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
}

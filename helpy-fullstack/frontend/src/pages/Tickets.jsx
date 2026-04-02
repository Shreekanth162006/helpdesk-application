import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  useColorModeValue,
  Text,
} from '@chakra-ui/react';
import { tickets } from '../api/client';

const statusColors = {
  new: 'blue',
  open: 'blue',
  'In Progress': 'yellow',
  'Waiting for Customer': 'purple',
  Resolved: 'green',
  Closed: 'gray',
  trash: 'red',
  'Customer Cancelled': 'red',
};

const priorityColors = {
  LOW: 'green',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red',
};

const statusFlow = ['Open', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed'];

export default function Tickets() {
  const { user } = useAuth();
  const isCustomer = user?.role === 'Customer';
  const navigate = useNavigate();
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter, searchText]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (searchText) params.search = searchText;
      const res = await tickets.list(params);
      setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast({
        title: err.response?.data?.error || 'Failed to load tickets',
        status: 'error',
        isClosable: true,
      });
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const advanceStatus = async (ticketId) => {
    try {
      const ticket = list.find((t) => t.id === ticketId);
      if (!ticket) return;
      const currentIndex = statusFlow.indexOf(ticket.currentStatus);
      if (currentIndex < statusFlow.length - 1) {
        const newStatus = statusFlow[currentIndex + 1];
        await tickets.update(ticketId, { currentStatus: newStatus });
        toast({ title: 'Status updated', status: 'success', isClosable: true });
        loadTickets();
      }
    } catch (err) {
      toast({
        title: err.response?.data?.error || 'Failed to update status',
        status: 'error',
        isClosable: true,
      });
    }
  };

  const assignToMe = async (ticketId) => {
    try {
      await tickets.update(ticketId, { assignedUserId: user.id });
      toast({ title: 'Ticket assigned to you', status: 'success', isClosable: true });
      loadTickets();
    } catch (err) {
      toast({
        title: err.response?.data?.error || 'Failed to assign ticket',
        status: 'error',
        isClosable: true,
      });
    }
  };

  const cancelTicket = async (ticketId) => {
    try {
      await tickets.update(ticketId, { currentStatus: 'Customer Cancelled' });
      toast({ title: 'Ticket cancelled', status: 'success', isClosable: true });
      loadTickets();
    } catch (err) {
      toast({
        title: err.response?.data?.error || 'Failed to cancel ticket',
        status: 'error',
        isClosable: true,
      });
    }
  };

  const closeTicket = async (ticketId) => {
    try {
      await tickets.update(ticketId, { currentStatus: 'Closed' });
      toast({ title: 'Ticket closed', status: 'success', isClosable: true });
      loadTickets();
    } catch (err) {
      toast({
        title: err.response?.data?.error || 'Failed to close ticket',
        status: 'error',
        isClosable: true,
      });
    }
  };

  const getStatusDisplay = (status) => {
    if (user?.role === 'Customer') {
      if (status === 'new') return 'Pending';
      if (status === 'open') return 'Opened';
      if (status === 'Customer Cancelled') return 'Deleted';
    } else {
      if (status === 'Customer Cancelled') return 'Customer Cancelled';
    }
    return status;
  };

  const isOfficial = user && ['Super Admin', 'Admin', 'Manager', 'Agent'].includes(user.role);

  return (
    <Box>
      <HStack justify="space-between" mb="4">
        <Heading size="lg" color={isCustomer ? useColorModeValue('teal.600', "white") : "inherit"}>Ticket List</Heading>
        <Button as={Link} to="/tickets/create" colorScheme="blue">
          Create Ticket
        </Button>
      </HStack>

      <HStack gap="4" mb="4">
        <Select
          maxW="200px"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="Open">Open/Opened</option>
          <option value="In Progress">In Progress</option>
          <option value="Waiting for Customer">Waiting for Customer</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
          <option value="Customer Cancelled">{user?.role === 'Customer' ? 'Deleted' : 'Customer Cancelled'}</option>
        </Select>
        <Select
          maxW="200px"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="ALL">All Priority</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="CRITICAL">CRITICAL</option>
        </Select>
        <Input
          placeholder="Search subject..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          maxW="300px"
        />
      </HStack>

      {loading ? (
        <Spinner size="xl" color="white" />
      ) : (
        <TableContainer
          bg={isCustomer ? useColorModeValue('whiteAlpha.900', 'whiteAlpha.200') : useColorModeValue('white', 'gray.700')}
          borderRadius="xl"
          shadow="xl"
          backdropFilter={isCustomer ? "blur(12px)" : "none"}
          border={isCustomer ? "1px solid" : "none"}
          borderColor={useColorModeValue('gray.100', 'whiteAlpha.300')}
        >
          <Table size="sm" variant={isCustomer ? 'simple' : 'simple'}>
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Subject</Th>
                <Th>Status</Th>
                {isOfficial && <Th>Priority</Th>}
                {isOfficial && <Th>SLA</Th>}
                <Th>Assigned</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {list.map((t) => (
                <Tr key={t.id}>
                  <Td color={isCustomer ? useColorModeValue('gray.800', 'white') : "inherit"}>{t.id}</Td>
                  <Td
                    cursor="pointer"
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    _hover={{ textDecoration: 'underline' }}
                    color={isCustomer ? useColorModeValue('teal.600', 'teal.200') : "inherit"}
                    fontWeight={isCustomer ? "medium" : "normal"}
                  >
                    {t.name}
                  </Td>
                  <Td>
                    <Badge colorScheme={statusColors[t.currentStatus] || 'gray'} variant={isCustomer ? "solid" : "subtle"}>
                      {getStatusDisplay(t.currentStatus)}
                    </Badge>
                  </Td>
                  {isOfficial && (
                    <Td>
                      <Badge colorScheme={priorityColors[t.priority] || 'gray'}>
                        {t.priority}
                      </Badge>
                    </Td>
                  )}
                  {isOfficial && (
                    <Td>
                      {t.isSlaBreached ? (
                        <Badge colorScheme="red">Breached</Badge>
                      ) : t.resolutionDueAt ? (
                        new Date(t.resolutionDueAt).toLocaleDateString()
                      ) : (
                        '—'
                      )}
                    </Td>
                  )}
                  <Td color={isCustomer ? useColorModeValue('gray.700', 'whiteAlpha.800') : "inherit"}>
                    {t.assignedUser ? (
                      <HStack spacing={2}>
                        <Text color={isCustomer ? "whiteAlpha.800" : "inherit"}>
                          {t.assignedUser.name || t.assignedUser.email}
                        </Text>
                        {isOfficial && t.assignedUser.role && (
                          <Badge
                            colorScheme={
                              t.assignedUser.role === 'Super Admin' ? 'purple' :
                                t.assignedUser.role === 'Manager' ? 'blue' :
                                  t.assignedUser.role === 'Agent' ? 'green' : 'gray'
                            }
                            size="sm"
                          >
                            {t.assignedUser.role}
                          </Badge>
                        )}
                      </HStack>
                    ) : (
                      <Text color={isCustomer ? "whiteAlpha.800" : "gray.500"}>Unassigned</Text>
                    )}
                  </Td>
                  <Td>
                    <HStack gap="2">
                      {isOfficial && t.currentStatus !== 'Closed' && t.currentStatus !== 'Customer Cancelled' && (
                        <>
                          {t.currentStatus !== 'Resolved' && (
                            <>
                              <Button
                                size="xs"
                                colorScheme="orange"
                                onClick={() => advanceStatus(t.id)}
                                isDisabled={statusFlow.indexOf(t.currentStatus) >= statusFlow.length - 1}
                              >
                                Next Status
                              </Button>
                              <Button
                                size="xs"
                                colorScheme="green"
                                onClick={() => assignToMe(t.id)}
                                variant="outline"
                              >
                                Assign Me
                              </Button>
                            </>
                          )}
                          {t.currentStatus === 'Resolved' && (
                            <Button
                              size="xs"
                              colorScheme="green"
                              onClick={() => closeTicket(t.id)}
                            >
                              Close Ticket
                            </Button>
                          )}
                          {['Super Admin', 'Manager'].includes(user.role) && t.isSlaBreached && t.assignedUserId !== user.id && (
                            <Button
                              size="xs"
                              colorScheme="red"
                              onClick={() => assignToMe(t.id)}
                              variant="solid"
                            >
                              Take Over
                            </Button>
                          )}
                        </>
                      )}
                      {user?.role === 'Customer' && (
                        <>
                          {t.currentStatus === 'Closed' ? (
                            <Text fontSize="xs" color="green.500" fontWeight="bold">Done</Text>
                          ) : t.currentStatus !== 'Customer Cancelled' && (
                            <Button
                              size="xs"
                              colorScheme="red"
                              variant="outline"
                              onClick={() => cancelTicket(t.id)}
                            >
                              Cancel / Delete
                            </Button>
                          )}
                        </>
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          {list.length === 0 && (
            <Box p="8" textAlign="center" color={useColorModeValue('gray.500', 'gray.300')}>
              No tickets found.
            </Box>
          )}
        </TableContainer>
      )}
    </Box>
  );
}

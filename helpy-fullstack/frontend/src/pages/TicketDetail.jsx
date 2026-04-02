import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Badge,
  Spinner,
  Button,
  Textarea,
  VStack,
  HStack,
  Divider,
  Link,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { ExternalLinkIcon, CloseIcon } from '@chakra-ui/icons';
import { IconButton } from '@chakra-ui/react';
import { topics, posts } from '../api/client';
import { useAuth } from '../context/AuthContext';

const statusColors = {
  new: 'blue',
  open: 'blue',
  'In Progress': 'yellow',
  'Waiting for Customer': 'orange',
  Resolved: 'green',
  Closed: 'gray',
  trash: 'red',
  'Customer Cancelled': 'red'
};

const getStatusDisplay = (status, userRole) => {
  if (userRole === 'Customer') {
    if (status === 'new') return 'Pending';
    if (status === 'open') return 'Opened';
    if (status === 'Customer Cancelled') return 'Deleted';
  } else {
    if (status === 'Customer Cancelled') return 'Customer Cancelled';
  }
  return status;
};

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!id) return;
    topics
      .get(id)
      .then((r) => setTicket(r.data))
      .catch(() => setTicket(null))
      .finally(() => setLoading(false));
  }, [id]);

  const sendReply = async (kind) => {
    if (!reply.trim() || !id) return;
    if (!user) return;

    const role = user.role;
    const isLightAgent = role === 'Light Agent';
    const isCustomer = role === 'Customer';
    const canReplyToCustomer = ['Super Admin', 'Admin', 'Manager', 'Agent'].includes(role);

    if (kind === 'reply' && !canReplyToCustomer && !isCustomer) {
      toast({
        title: 'You are not allowed to send customer replies.',
        status: 'error',
        isClosable: true,
      });
      return;
    }

    if (kind === 'note' && !['Super Admin', 'Admin', 'Manager', 'Agent', 'Light Agent'].includes(role)) {
      toast({
        title: 'You are not allowed to add internal notes.',
        status: 'error',
        isClosable: true,
      });
      return;
    }

    setSending(true);
    try {
      await posts.create({ topicId: parseInt(id, 10), body: reply.trim(), kind });
      setReply('');
      const { data } = await topics.get(id);
      setTicket(data);
      toast({
        title: kind === 'reply' ? 'Reply sent' : 'Internal note added',
        status: 'success',
        isClosable: true,
      });
    } catch (e) {
      toast({ title: e.response?.data?.error || 'Failed to send', status: 'error', isClosable: true });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Spinner size="lg" />;
  if (!ticket) return <Text>Ticket not found.</Text>;

  const isCustomer = user?.role === 'Customer';
  const headingColor = isCustomer ? "white" : "inherit";
  const subtextColor = isCustomer ? "whiteAlpha.800" : "gray.600";

  return (
    <Box>
      <Button size="sm" variant="ghost" mb="4" onClick={() => navigate('/tickets')} color={isCustomer ? "white" : "inherit"} _hover={{ bg: "whiteAlpha.200" }}>
        ← Back
      </Button>
      <HStack justify="space-between" mb="4">
        <HStack spacing={3}>
          <Heading size="md" color={headingColor}>
            #{ticket.id} {ticket.name}
          </Heading>
        </HStack>
        <IconButton
          icon={<CloseIcon />}
          aria-label="Close"
          variant="ghost"
          onClick={() => navigate('/tickets')}
          color={isCustomer ? "white" : "inherit"}
          _hover={{ bg: "whiteAlpha.200" }}
        />
      </HStack>
      <Badge colorScheme={statusColors[ticket.currentStatus] || 'gray'} mb="4" variant={isCustomer ? "solid" : "subtle"}>
        {getStatusDisplay(ticket.currentStatus, user?.role)}
      </Badge>
      <HStack spacing={2} mb="2">
        <Text fontSize="sm" color={subtextColor}>
          From {ticket.user?.name || ticket.user?.email} · {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : ''}
        </Text>
        {ticket.assignedUser && (
          <HStack spacing={2}>
            <Text fontSize="sm" color={subtextColor}>
              · Assigned to: {ticket.assignedUser.name || ticket.assignedUser.email}
            </Text>
            {ticket.assignedUser.role && (
              <Badge
                colorScheme={
                  ticket.assignedUser.role === 'Super Admin' ? 'purple' :
                    ticket.assignedUser.role === 'Manager' ? 'blue' :
                      ticket.assignedUser.role === 'Agent' ? 'green' : 'gray'
                }
                size="sm"
              >
                {ticket.assignedUser.role}
              </Badge>
            )}
          </HStack>
        )}
      </HStack>
      {(ticket.resolutionDueAt || ticket.isSlaBreached) && (
        <HStack gap="2" mb="4">
          {ticket.isSlaBreached && <Badge colorScheme="red">SLA Breached</Badge>}
          {ticket.resolutionDueAt && (
            <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.300')}>
              Resolution due: {new Date(ticket.resolutionDueAt).toLocaleString()}
            </Text>
          )}
        </HStack>
      )}
      <Divider my="4" />
      {/* Show attachments to officials only */}
      {(() => {
        const isOfficial = user && ['Super Admin', 'Admin', 'Manager', 'Agent'].includes(user.role);
        return (
          <>
            {isOfficial && ticket.attachment && (
              <Box mb="4" p="3" bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="md">
                <Text fontSize="sm" fontWeight="medium" color={isCustomer ? "teal.200" : "inherit"}>
                  Attachment
                </Text>
                <Link as="a" href={`/uploads/${ticket.attachment}`} download color="blue.500" mt="1">
                  {ticket.attachment} <ExternalLinkIcon mx="2px" />
                </Link>
              </Box>
            )}
            <VStack align="stretch" gap="4">
              {ticket.posts?.map((p) => (
                <Box
                  key={p.id}
                  p="4"
                  bg={isCustomer ? "whiteAlpha.200" : useColorModeValue('gray.50', 'gray.800')}
                  borderRadius="lg"
                  border={isCustomer ? "1px solid" : "none"}
                  borderColor="whiteAlpha.300"
                  backdropFilter={isCustomer ? "blur(5px)" : "none"}
                >
                  <Text fontSize="sm" fontWeight="medium" color={isCustomer ? "teal.200" : useColorModeValue('gray.600', 'gray.300')}>
                    {p.user?.name || p.user?.email} · {p.kind} · {p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}
                  </Text>
                  <Text mt="2" whiteSpace="pre-wrap" color={isCustomer ? "white" : "inherit"}>
                    {p.body}
                  </Text>

                  {isOfficial && p.attachments?.length > 0 && (
                    <Box mt="3">
                      <Text fontSize="sm" fontWeight="medium">
                        Attachments
                      </Text>
                      {p.attachments.map((a) => (
                        <Link key={a} as="a" href={`/uploads/${a}`} download color="blue.500" display="block" mt="1">
                          {a} <ExternalLinkIcon mx="2px" />
                        </Link>
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
            </VStack>
          </>
        );
      })()}
      <Box mt="6">
        <Textarea
          placeholder="Write a reply or internal note..."
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={4}
          mb="2"
        />
        <HStack gap="3">
          {(user && ['Super Admin', 'Admin', 'Manager', 'Agent'].includes(user.role)) || (user?.role === 'Customer' && ticket.userId === user.id) ? (
            <Button
              colorScheme="blue"
              onClick={() => sendReply('reply')}
              isLoading={sending}
              isDisabled={!reply.trim() || ticket.currentStatus === 'Customer Cancelled'}
            >
              {user?.role === 'Customer' ? 'Send Reply' : 'Send reply to customer'}
            </Button>
          ) : null}
          {user && ['Super Admin', 'Admin', 'Manager', 'Agent', 'Light Agent'].includes(user.role) && (
            <Button
              variant="outline"
              colorScheme="gray"
              onClick={() => sendReply('note')}
              isLoading={sending}
              isDisabled={!reply.trim()}
            >
              Add internal note
            </Button>
          )}
          {user?.role === 'Customer' && ticket.userId === user.id && ticket.currentStatus !== 'Customer Cancelled' && (
            <Button
              variant="outline"
              colorScheme="red"
              onClick={async () => {
                try {
                  await topics.update(id, { currentStatus: 'Customer Cancelled' });
                  toast({ title: 'Ticket cancelled', status: 'success' });
                  const { data } = await topics.get(id);
                  setTicket(data);
                } catch (e) {
                  toast({ title: 'Failed to cancel', status: 'error' });
                }
              }}
            >
              Cancel / Delete Ticket
            </Button>
          )}
        </HStack>
      </Box>
    </Box>
  );
}

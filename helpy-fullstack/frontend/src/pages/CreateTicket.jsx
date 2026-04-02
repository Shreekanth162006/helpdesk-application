import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tickets, upload } from '../api/client';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  Heading,
  useToast,
  useColorModeValue,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { ArrowBackIcon, CloseIcon } from '@chakra-ui/icons';


export default function CreateTicket() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('LOW');
  const [department, setDepartment] = useState('IT');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!subject || !description) {
      toast({
        title: 'Subject and description are required',
        status: 'error',
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    let attachment = null;

    // Upload file if present
    if (file) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await upload.file(file);
        attachment = uploadRes.data.filename;
      } catch (err) {
        toast({
          title: err.response?.data?.error || 'File upload failed',
          status: 'error',
          isClosable: true,
        });
        setUploading(false);
        setLoading(false);
        return;
      }
      setUploading(false);
    }

    try {
      await tickets.create({
        name: subject,
        body: description,
        priority,
        department,
        attachment: attachment || null,
        kind: 'ticket',
        forumId: 1,
      });
      toast({ title: 'Ticket created', status: 'success', isClosable: true });
      navigate('/tickets');
    } catch (err) {
      toast({
        title: err.response?.data?.error || 'Failed to create ticket',
        status: 'error',
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="900px" mx="auto">
      <HStack justify="space-between" mb="6">
        <HStack spacing={3}>
          <IconButton
            icon={<ArrowBackIcon />}
            aria-label="Go back"
            variant="ghost"
            onClick={() => navigate('/tickets')}
          />
          <Heading size="lg">Create Ticket</Heading>
        </HStack>
        <IconButton
          icon={<CloseIcon />}
          aria-label="Close"
          variant="ghost"
          onClick={() => navigate('/tickets')}
        />
      </HStack>
      <Box bg={useColorModeValue('white', 'gray.700')} p="6" borderRadius="lg" shadow="sm">
        <form onSubmit={submit}>
          <VStack align="stretch" gap="4">
            <FormControl isRequired>
              <FormLabel>Subject</FormLabel>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ticket subject"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your issue..."
                rows={4}
              />
            </FormControl>
            <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap="4">
              <FormControl>
                <FormLabel>Priority</FormLabel>
                <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Department</FormLabel>
                <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="IT">IT</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Support">Support</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Attachment</FormLabel>
                <Input type="file" onChange={handleFileChange} />
              </FormControl>
            </Box>
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={loading || uploading}
              w="full"
            >
              Submit Ticket
            </Button>
          </VStack>
        </form>
      </Box>
    </Box>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Spinner,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  IconButton,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  FormHelperText,
  useToast,
} from '@chakra-ui/react';
import { categories } from '../api/client';
import { useAuth } from '../context/AuthContext';

const getCategoryEmoji = (categoryName) => {
  const name = categoryName.toLowerCase();
  if (name.includes('faq') || name.includes('question')) return '❓';
  if (name.includes('troubleshoot') || name.includes('problem') || name.includes('issue')) return '🔧';
  if (name.includes('guide') || name.includes('tutorial') || name.includes('how to')) return '📖';
  if (name.includes('start') || name.includes('getting started')) return '🚀';
  if (name.includes('security') || name.includes('privacy')) return '🔒';
  if (name.includes('account') || name.includes('profile')) return '👤';
  if (name.includes('payment') || name.includes('billing')) return '💳';
  if (name.includes('api') || name.includes('developer')) return '💻';
  if (name.includes('feature') || name.includes('update')) return '✨';
  if (name.includes('help') || name.includes('support')) return '💡';
  return '📁'; // default
};

export default function Knowledge() {
  const [list, setList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [catKeywords, setCatKeywords] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    categories
      .list({ docs: 'true' })
      .then((r) => setList(Array.isArray(r.data) ? r.data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const { user } = useAuth();
  const isCustomer = user?.role === 'Customer';
  const isAdmin = ['Super Admin', 'Admin'].includes(user?.role);

  const headingColor = "white";
  const heroBg = useColorModeValue('linear(to-br, blue.600, purple.700)', 'linear(to-br, blue.900, gray.900)');
  const cardBg = useColorModeValue('white', 'gray.700');
  const cardHoverBg = useColorModeValue('gray.50', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const filteredList = list.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.keywords && c.keywords.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenModal = (cat = null) => {
    setEditingCategory(cat);
    setCatName(cat ? cat.name : '');
    setCatKeywords(cat ? cat.keywords || '' : '');
    onOpen();
  };

  const saveCategory = async () => {
    if (!catName.trim()) return;
    setSaving(true);
    try {
      if (editingCategory) {
        const res = await categories.update(editingCategory.id, { name: catName, keywords: catKeywords });
        setList(list.map(c => c.id === editingCategory.id ? { ...c, ...res.data } : c));
        toast({ title: 'Category updated', status: 'success' });
      } else {
        const res = await categories.create({ name: catName, keywords: catKeywords });
        setList([...list, res.data]);
        toast({ title: 'Category created', status: 'success' });
      }
      onClose();
    } catch (err) {
      toast({ title: 'Operation failed', description: err.message, status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box mt="-8" mx="-8">
      {/* Hero Section */}
      <Box
        bgGradient={heroBg}
        py="20"
        px="8"
        textAlign="center"
        color="white"
        mb="10"
      >
        <VStack spacing="6" maxW="3xl" mx="auto">
          <Heading size="2xl" fontWeight="bold">How can we help you today?</Heading>
          <Text fontSize="xl" opacity="0.9">Search our knowledge base for answers to your questions.</Text>
          <Box w="full" maxW="2xl" pos="relative">
            <Input
              size="lg"
              bg="white"
              color="gray.800"
              placeholder="Search for categories or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              _placeholder={{ color: 'gray.400' }}
              borderRadius="full"
              pl="12"
              height="14"
              shadow="2xl"
            />
            <Box pos="absolute" left="4" top="4" color="gray.400">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </Box>
          </Box>
        </VStack>
      </Box>

      {/* Categories Grid */}
      <Box px="8" pb="12">
        <HStack justify="space-between" mb="8">
          <Heading size="lg">Browse Categories</Heading>
          {isAdmin && (
            <Button colorScheme="blue" leftIcon={<span>+</span>} onClick={() => handleOpenModal()}>Add Category</Button>
          )}
        </HStack>

        {loading ? (
          <Spinner size="xl" color="purple.500" />
        ) : filteredList.length === 0 ? (
          <Box
            p="20"
            textAlign="center"
            bg={cardBg}
            borderRadius="xl"
            shadow="sm"
            color="gray.500"
          >
            <VStack spacing="4">
              <Text fontSize="4xl">🔍</Text>
              <Heading size="md">No results found</Heading>
              <Text>We couldn't find any category matching "{searchQuery}"</Text>
              <Button variant="link" colorScheme="blue" onClick={() => setSearchQuery('')}>Clear search</Button>
            </VStack>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="8">
            {filteredList.map((c) => (
              <Box
                key={c.id}
                p="8"
                bg={cardBg}
                borderRadius="2xl"
                shadow="sm"
                cursor="pointer"
                transition="all 0.3s"
                _hover={{ transform: 'translateY(-8px)', shadow: '2xl', bg: cardHoverBg }}
                onClick={() => navigate(`/knowledge/${c.id}`)}
                borderWidth="1px"
                borderColor={useColorModeValue('gray.100', 'gray.600')}
                pos="relative"
              >
                {isAdmin && (
                  <IconButton
                    pos="absolute"
                    top="2"
                    right="2"
                    size="sm"
                    variant="ghost"
                    aria-label="Edit Category"
                    icon={<span>✎</span>}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenModal(c);
                    }}
                  />
                )}
                <VStack spacing="5" align="center">
                  <Box
                    p="4"
                    bg={useColorModeValue('blue.50', 'whiteAlpha.100')}
                    borderRadius="2xl"
                    fontSize="5xl"
                  >
                    {getCategoryEmoji(c.name)}
                  </Box>
                  <VStack spacing="1">
                    <Heading size="sm" textAlign="center">
                      {c.name}
                    </Heading>
                    <Text fontSize="xs" fontWeight="bold" color="blue.500" textTransform="uppercase" letterSpacing="widest">
                      {c.docs?.length || 0} Articles
                    </Text>
                  </VStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>

      {/* Still need help section */}
      <Box bg={useColorModeValue('gray.50', 'gray.800')} py="16" px="8" mt="10" textAlign="center">
        <VStack spacing="6" maxW="2xl" mx="auto">
          <Heading size="xl">Still need help?</Heading>
          <Text fontSize="lg" color={textColor}>
            If you can't find what you're looking for, our support team is happy to assist you personally.
          </Text>
          <HStack spacing="4">
            <Button
              size="lg"
              colorScheme="blue"
              px="10"
              onClick={() => navigate('/tickets/create')}
            >
              Contact Support
            </Button>
            <Button
              size="lg"
              variant="outline"
              colorScheme="blue"
              onClick={() => window.location.href = 'mailto:support@helpy.local'}
            >
              Email Us
            </Button>
          </HStack>
        </VStack>
      </Box>

      {/* Category Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingCategory ? 'Edit Category' : 'Add New Category'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Category Name</FormLabel>
                <Input
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Getting Started"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Keywords</FormLabel>
                <Input
                  value={catKeywords}
                  onChange={(e) => setCatKeywords(e.target.value)}
                  placeholder="Comma separated search terms"
                />
                <FormHelperText>Helps users find articles in this category via search.</FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={saveCategory} isLoading={saving}>
              Save
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

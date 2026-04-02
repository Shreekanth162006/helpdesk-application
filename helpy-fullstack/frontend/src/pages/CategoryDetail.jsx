import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Heading,
    Text,
    Spinner,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Button,
    VStack,
    HStack,
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
    Input,
    Textarea,
    useToast,
    FormHelperText,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { categories, docs } from '../api/client';
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
    return '📁';
};

export default function CategoryDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    // Category Modal State
    const { isOpen: isCatOpen, onOpen: onCatOpen, onClose: onCatClose } = useDisclosure();
    const [catName, setCatName] = useState('');
    const [catKeywords, setCatKeywords] = useState('');

    // Article Modal State
    const { isOpen: isDocOpen, onOpen: onDocOpen, onClose: onDocClose } = useDisclosure();
    const [editingDoc, setEditingDoc] = useState(null);
    const [docTitle, setDocTitle] = useState('');
    const [docBody, setDocBody] = useState('');
    const [docKeywords, setDocKeywords] = useState('');

    const isCustomer = user?.role === 'Customer';
    const isAdmin = ['Super Admin', 'Admin'].includes(user?.role);
    const headingColor = isCustomer ? "white" : "inherit";
    const subtextColor = isCustomer ? "whiteAlpha.800" : "gray.600";
    const accordionBg = isCustomer ? "whiteAlpha.100" : useColorModeValue('white', 'gray.700');

    useEffect(() => {
        if (!id) return;
        loadCategory();
    }, [id]);

    const loadCategory = () => {
        setLoading(true);
        categories
            .get(id, { docs: 'true' })
            .then((r) => setCategory(r.data))
            .catch(() => setCategory(null))
            .finally(() => setLoading(false));
    }

    const handleOpenCatModal = () => {
        setCatName(category.name);
        setCatKeywords(category.keywords || '');
        onCatOpen();
    };

    const handleSaveCategory = async () => {
        if (!catName.trim()) return;
        setSaving(true);
        try {
            await categories.update(id, { name: catName, keywords: catKeywords });
            setCategory({ ...category, name: catName, keywords: catKeywords });
            toast({ title: 'Category updated', status: 'success' });
            onCatClose();
        } catch (err) {
            toast({ title: 'Failed to update category', description: err.message, status: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleOpenDocModal = (doc = null) => {
        setEditingDoc(doc);
        setDocTitle(doc ? doc.title : '');
        setDocBody(doc ? (doc.body || doc.content || '') : '');
        setDocKeywords(doc ? doc.keywords || '' : '');
        onDocOpen();
    };

    const handleSaveDoc = async () => {
        if (!docTitle.trim() || !docBody.trim()) return;
        setSaving(true);
        try {
            if (editingDoc) {
                await docs.update(editingDoc.id, { title: docTitle, body: docBody, keywords: docKeywords });
                toast({ title: 'Article updated', status: 'success' });
            } else {
                await docs.create({ title: docTitle, body: docBody, categoryId: id, keywords: docKeywords });
                toast({ title: 'Article created', status: 'success' });
            }
            onDocClose();
            loadCategory(); // Reload to see changes
        } catch (err) {
            toast({ title: 'Failed to save article', description: err.message, status: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Spinner size="xl" mt="8" />;
    if (!category) return <Text mt="8">Category not found.</Text>;

    return (
        <Box>
            {/* Breadcrumbs / Header Section */}
            <HStack mb="8" spacing={4}>
                <IconButton
                    icon={<ArrowBackIcon />}
                    aria-label="Back to Knowledge Base"
                    variant="ghost"
                    onClick={() => navigate('/knowledge')}
                    color={isCustomer ? "white" : "inherit"}
                    _hover={{ bg: isCustomer ? "whiteAlpha.200" : "gray.100" }}
                />
                <VStack align="start" spacing={0}>
                    <HStack spacing={2} fontSize="sm" color={subtextColor} mb="1">
                        <Text cursor="pointer" onClick={() => navigate('/knowledge')} _hover={{ color: 'blue.500' }}>Knowledge Base</Text>
                        <Text>/</Text>
                        <Text fontWeight="bold">{category.name}</Text>
                    </HStack>
                    <HStack spacing={3}>
                        <Text fontSize="2xl">{getCategoryEmoji(category.name)}</Text>
                        <Heading size="lg" color={headingColor}>{category.name}</Heading>
                        {isAdmin && (
                            <Button size="xs" colorScheme="blue" variant="ghost" onClick={handleOpenCatModal}>Edit Category</Button>
                        )}
                    </HStack>
                    <Text fontSize="sm" color={subtextColor}>
                        {category.docs?.length || 0} Help Articles
                    </Text>
                </VStack>
            </HStack>

            <Box maxW="4xl" mx="auto" mb="12">
                <HStack justify="space-between" mb="4">
                    <Heading size="md" color={isCustomer ? "white" : "gray.700"}>Popular Articles</Heading>
                    {isAdmin && (
                        <Button size="sm" colorScheme="blue" leftIcon={<span>+</span>} onClick={() => handleOpenDocModal()}>Add Article</Button>
                    )}
                </HStack>

                {category.docs?.length === 0 ? (
                    <Box
                        p="12"
                        bg={accordionBg}
                        borderRadius="2xl"
                        textAlign="center"
                        color={subtextColor}
                        borderWidth="1px"
                        borderStyle="dashed"
                        borderColor={isCustomer ? "whiteAlpha.300" : "gray.200"}
                    >
                        <VStack spacing="3">
                            <Text fontSize="3xl">📄</Text>
                            <Text fontWeight="medium">No articles in this category yet.</Text>
                            {isAdmin && <Button size="sm" colorScheme="blue" onClick={() => handleOpenDocModal()}>Create first article</Button>}
                        </VStack>
                    </Box>
                ) : (
                    <Accordion allowMultiple>
                        {category.docs.map((doc, index) => (
                            <AccordionItem
                                key={doc.id}
                                border="none"
                                mb="4"
                                bg={accordionBg}
                                borderRadius="2xl"
                                overflow="hidden"
                                shadow="sm"
                                borderWidth={isCustomer ? "1px" : "1px"}
                                borderColor={isCustomer ? "whiteAlpha.200" : "gray.100"}
                                _hover={{ borderColor: 'blue.400' }}
                            >
                                <h2>
                                    <AccordionButton py="6" _hover={{ bg: isCustomer ? "whiteAlpha.200" : "gray.50" }}>
                                        <Box flex="1" textAlign="left">
                                            <HStack spacing={6}>
                                                <Text fontWeight="bold" color="blue.500" fontSize="xl">
                                                    {(index + 1).toString().padStart(2, '0')}
                                                </Text>
                                                <VStack align="start" spacing="0">
                                                    <Text fontWeight="bold" fontSize="lg" color={isCustomer ? "white" : "gray.800"}>
                                                        {doc.title}
                                                    </Text>
                                                    {doc.keywords && (
                                                        <Text fontSize="2xs" color="gray.500" textTransform="uppercase">
                                                            Tags: {doc.keywords}
                                                        </Text>
                                                    )}
                                                </VStack>
                                            </HStack>
                                        </Box>
                                        <HStack spacing="4">
                                            {isAdmin && (
                                                <Button size="xs" colorScheme="blue" variant="ghost" onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenDocModal(doc);
                                                }}>Edit</Button>
                                            )}
                                            <AccordionIcon color={isCustomer ? "white" : "inherit"} />
                                        </HStack>
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel pb="8" pt="2" px="16" color={isCustomer ? "whiteAlpha.900" : "gray.700"}>
                                    <Box borderLeftWidth="4px" borderLeftColor="blue.500" pl="6">
                                        <Text whiteSpace="pre-wrap" lineHeight="tall" fontSize="md">
                                            {doc.content || doc.body || "No content provided for this article."}
                                        </Text>
                                    </Box>
                                </AccordionPanel>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </Box>

            {/* Need Help CTA */}
            <Box
                bgGradient={isCustomer ? "linear(to-r, blue.900, purple.900)" : "linear(to-r, blue.50, indigo.50)"}
                p="10"
                borderRadius="3xl"
                textAlign="center"
                borderWidth="1px"
                borderColor={isCustomer ? "whiteAlpha.200" : "blue.100"}
            >
                <VStack spacing="4">
                    <Heading size="md" color={isCustomer ? "white" : "blue.800"}>Still need more information?</Heading>
                    <Text color={isCustomer ? "whiteAlpha.800" : "gray.600"}>Our support team is available to help with any specific questions you may have.</Text>
                    <Button colorScheme="blue" size="lg" onClick={() => navigate('/tickets/create')}>
                        Contact Support Team
                    </Button>
                </VStack>
            </Box>

            {/* Category Edit Modal */}
            <Modal isOpen={isCatOpen} onClose={onCatClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Update Category</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Category Name</FormLabel>
                                <Input value={catName} onChange={(e) => setCatName(e.target.value)} />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Keywords</FormLabel>
                                <Input value={catKeywords} onChange={(e) => setCatKeywords(e.target.value)} placeholder="Search tags" />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={handleSaveCategory} isLoading={saving}>Save</Button>
                        <Button onClick={onCatClose}>Cancel</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Article Modal */}
            <Modal isOpen={isDocOpen} onClose={onDocClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{editingDoc ? 'Edit Article' : 'Add New Article'}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Article Title</FormLabel>
                                <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel>Content</FormLabel>
                                <Textarea value={docBody} onChange={(e) => setDocBody(e.target.value)} rows={10} />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Keywords</FormLabel>
                                <Input value={docKeywords} onChange={(e) => setDocKeywords(e.target.value)} placeholder="Helpful for search" />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={handleSaveDoc} isLoading={saving}>Save</Button>
                        <Button onClick={onDocClose}>Cancel</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

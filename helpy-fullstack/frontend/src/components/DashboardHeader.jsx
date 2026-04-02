import React, { useEffect, useState } from 'react';
import {
    Flex,
    IconButton,
    HStack,
    Box,
    Input,
    InputGroup,
    InputLeftElement,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Text,
    Avatar,
    VStack,
    useColorMode,
    useColorModeValue,
    useToast,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverBody,
    PopoverArrow,
    PopoverCloseButton,
    Badge,
    Spinner,
    Button,
    Divider,
} from '@chakra-ui/react';
import {
    SearchIcon,
    BellIcon,
    MoonIcon,
    SunIcon,
    ChevronDownIcon,
} from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';
import { notifications as notificationsApi } from '../api/client';

const DashboardHeader = ({ onOpen, ...rest }) => {
    const { colorMode, toggleColorMode } = useColorMode();
    const { user, logout } = useAuth();
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const toast = useToast();

    const isCustomer = user?.role === 'Customer';
    const bg = isCustomer
        ? useColorModeValue('whiteAlpha.900', 'blackAlpha.900')
        : useColorModeValue('white', 'gray.800');
    const borderColor = isCustomer ? useColorModeValue('gray.100', 'whiteAlpha.100') : useColorModeValue('gray.200', 'gray.700');

    const loadNotifications = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await notificationsApi.list();
            const newNotifs = res.data;

            // If already loaded once, check for brand new unread notifications
            if (hasLoaded) {
                const unreadNew = newNotifs.filter(n => !n.readAt && !notifs.some(old => old.id === n.id));
                unreadNew.forEach(n => {
                    toast({
                        title: n.title,
                        description: n.message,
                        status: n.kind === 'error' ? 'error' : 'info',
                        duration: 5000,
                        isClosable: true,
                        position: 'top-right',
                    });
                });
            }

            setNotifs(newNotifs);
            setHasLoaded(true);
        } catch (err) {
            console.error('Failed to load notifications', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            setNotifs([]);
            setHasLoaded(false);
            return;
        }

        loadNotifications();

        // Start polling every 30 seconds
        const interval = setInterval(() => {
            loadNotifications(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [user]);

    const markAllRead = async () => {
        const unreadIds = notifs.filter(n => !n.readAt).map(n => n.id);
        if (unreadIds.length === 0) return;
        try {
            await notificationsApi.markRead(unreadIds);
            loadNotifications(true);
        } catch (err) {
            toast({ title: "Failed to mark as read", status: "error" });
        }
    };

    const unreadCount = notifs.filter(n => !n.readAt).length;

    return (
        <Flex
            px="8"
            height="20"
            alignItems="center"
            bg={bg}
            backdropFilter={isCustomer ? "blur(12px)" : "none"}
            borderBottom="1px"
            borderBottomColor={borderColor}
            justifyContent="space-between"
            pos="sticky"
            top="0"
            zIndex="docked"
            shadow={isCustomer ? "sm" : "none"}
            {...rest}
        >
            <InputGroup w="400px" display={{ base: 'none', md: 'flex' }}>
                <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                    type="text"
                    placeholder="Search for tickets, users..."
                    bg={useColorModeValue('gray.50', 'whiteAlpha.100')}
                    border="none"
                    _focus={{ bg: useColorModeValue('white', 'whiteAlpha.200'), boxShadow: 'outline' }}
                />
            </InputGroup>

            <HStack spacing={{ base: '0', md: '6' }}>
                <IconButton
                    size="lg"
                    variant="ghost"
                    aria-label="Toggle color mode"
                    icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                    onClick={toggleColorMode}
                />

                <Popover placement="bottom-end">
                    <PopoverTrigger>
                        <Box pos="relative">
                            <IconButton
                                size="lg"
                                variant="ghost"
                                aria-label="open notifications"
                                icon={<BellIcon />}
                            />
                            {unreadCount > 0 && (
                                <Badge
                                    pos="absolute"
                                    top="2"
                                    right="2"
                                    colorScheme="red"
                                    borderRadius="full"
                                    px="1.5"
                                    fontSize="xs"
                                >
                                    {unreadCount}
                                </Badge>
                            )}
                        </Box>
                    </PopoverTrigger>
                    <PopoverContent w="350px" _focus={{ boxShadow: 'lg' }}>
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverHeader fontWeight="bold" display="flex" justifyContent="space-between" alignItems="center">
                            Notifications
                            {unreadCount > 0 && (
                                <Button size="xs" variant="ghost" colorScheme="blue" onClick={markAllRead}>
                                    Mark all read
                                </Button>
                            )}
                        </PopoverHeader>
                        <PopoverBody p={0} maxH="400px" overflowY="auto">
                            {loading ? (
                                <Flex p={4} justify="center"><Spinner size="sm" /></Flex>
                            ) : notifs.length === 0 ? (
                                <Box p={4} textAlign="center"><Text color="gray.500" fontSize="sm">No notifications</Text></Box>
                            ) : (
                                <VStack align="stretch" spacing={0} divider={<Divider />}>
                                    {notifs.map(n => (
                                        <Box key={n.id} p={3} bg={n.readAt ? 'transparent' : useColorModeValue('blue.50', 'whiteAlpha.50')}>
                                            <HStack justify="space-between">
                                                <Text fontWeight="semibold" fontSize="sm">{n.title}</Text>
                                                {!n.readAt && <Badge colorScheme="blue" variant="solid" fontSize="2xs">New</Badge>}
                                            </HStack>
                                            <Text fontSize="xs" mt={1} color={useColorModeValue('gray.600', 'gray.400')}>{n.message}</Text>
                                        </Box>
                                    ))}
                                </VStack>
                            )}
                        </PopoverBody>
                    </PopoverContent>
                </Popover>

                <Flex alignItems={'center'}>
                    <Menu>
                        <MenuButton
                            as={Box}
                            cursor="pointer"
                            py={2}
                            transition="all 0.3s"
                            _focus={{ boxShadow: 'none' }}>
                            <HStack>
                                <Avatar
                                    size={'sm'}
                                    name={user?.name}
                                    src={user?.avatar}
                                />
                                <VStack
                                    display={{ base: 'none', md: 'flex' }}
                                    alignItems="flex-start"
                                    spacing="1px"
                                    ml="2">
                                    <Text fontSize="sm" color={isCustomer ? useColorModeValue('gray.800', 'white') : "inherit"}>{user?.name || user?.email}</Text>
                                    <Text fontSize="xs" color={isCustomer ? useColorModeValue('gray.600', 'whiteAlpha.700') : "gray.600"}>
                                        {user?.role}
                                    </Text>
                                </VStack>
                                <Box display={{ base: 'none', md: 'flex' }}>
                                    <ChevronDownIcon />
                                </Box>
                            </HStack>
                        </MenuButton>
                        <MenuList
                            bg={bg}
                            borderColor={borderColor}>
                            <MenuItem>Profile</MenuItem>
                            <MenuItem onClick={logout}>Sign out</MenuItem>
                        </MenuList>
                    </Menu>
                </Flex>
            </HStack>
        </Flex>
    );
};

export default DashboardHeader;

import React from 'react';
import {
    Box,
    Flex,
    Icon,
    Link,
    Text,
    VStack,
    useColorModeValue,
    Spacer,
} from '@chakra-ui/react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    ChatIcon,
    InfoIcon,
    SettingsIcon,
    ViewIcon,
} from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ icon, children, to, ...rest }) => {
    const location = useLocation();
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

    const activeBg = useColorModeValue('purple.500', 'purple.500');
    const activeColor = 'white';
    const hoverBg = useColorModeValue('purple.50', 'whiteAlpha.100');

    return (
        <Link
            as={NavLink}
            to={to}
            style={{ textDecoration: 'none' }}
            _focus={{ boxShadow: 'none' }}
            w="full"
        >
            <Flex
                align="center"
                p="4"
                mx="4"
                borderRadius="lg"
                role="group"
                cursor="pointer"
                bg={isActive ? activeBg : 'transparent'}
                color={isActive ? activeColor : useColorModeValue('gray.600', 'whiteAlpha.900')}
                _hover={{
                    bg: isActive ? activeBg : hoverBg,
                    color: isActive ? activeColor : useColorModeValue('purple.600', 'teal.200'),
                }}
                transition="all 0.2s"
                {...rest}
            >
                {icon && (
                    <Icon
                        mr="4"
                        fontSize="18"
                        as={icon}
                    />
                )}
                <Text fontSize="md" fontWeight={isActive ? "semibold" : "medium"}>
                    {children}
                </Text>
            </Flex>
        </Link>
    );
};

const Sidebar = ({ ...props }) => {
    const { isAdmin } = useAuth();
    const bg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    return (
        <Box
            transition="3s ease"
            bg={bg}
            borderRight="1px"
            borderRightColor={borderColor}
            w={{ base: 'full', md: 60 }}
            pos="fixed"
            h="full"
            {...props}
        >
            <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
                <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                    Helpy Desk
                </Text>
            </Flex>
            <Flex direction="column" h="calc(100% - 80px)" pb={4}>
                <VStack spacing={1} align="stretch" mt={4}>
                    <NavItem to="/" icon={ViewIcon}>
                        Dashboard
                    </NavItem>
                    <NavItem to="/tickets" icon={ChatIcon}>
                        Tickets
                    </NavItem>
                    {isAdmin && (
                        <NavItem to="/users" icon={SettingsIcon}>
                            Users
                        </NavItem>
                    )}
                </VStack>
                <Spacer />
                <VStack spacing={1} align="stretch">
                    <NavItem to="/knowledge" icon={InfoIcon}>
                        Knowledge
                    </NavItem>
                </VStack>
            </Flex>
        </Box>
    );
};

export default Sidebar;

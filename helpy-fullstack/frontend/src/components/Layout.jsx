import React from 'react';
import {
    Box,
    useColorModeValue,
    Drawer,
    DrawerContent,
    useDisclosure,
} from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';

const Layout = () => {
    const { user } = useAuth();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const isCustomer = user?.role === 'Customer';

    // Theme gradients
    const auroraGradient = 'linear-gradient(135deg, #0f172a 0%, #115e59 50%, #064e3b 100%)';
    const phantomGradient = useColorModeValue('gray.50', 'gray.900');

    const mainBg = isCustomer ? auroraGradient : phantomGradient;
    const contentBg = isCustomer
        ? useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(23, 25, 35, 0.9)')
        : 'transparent';
    const contentBlur = isCustomer ? 'blur(8px)' : 'none';

    return (
        <Box
            minH="100vh"
            bg={mainBg}
            bgAttachment="fixed"
        >
            {/* Sidebar for Desktop */}
            <Sidebar
                display={{ base: 'none', md: 'block' }}
            />

            {/* Sidebar for Mobile */}
            <Drawer
                autoFocus={false}
                isOpen={isOpen}
                placement="left"
                onClose={onClose}
                returnFocusOnClose={false}
                onOverlayClick={onClose}
                size="full"
            >
                <DrawerContent>
                    <Sidebar onClose={onClose} />
                </DrawerContent>
            </Drawer>

            <Box ml={{ base: 0, md: 60 }} transition=".3s ease">
                <DashboardHeader onOpen={onOpen} />
                <Box
                    p="4"
                    m={isCustomer ? "4" : "0"}
                    borderRadius={isCustomer ? "xl" : "0"}
                    bg={contentBg}
                    backdropFilter={contentBlur}
                    minH="calc(100vh - 100px)"
                    shadow={isCustomer ? "2xl" : "none"}
                    border={isCustomer ? "1px solid" : "none"}
                    borderColor={useColorModeValue('whiteAlpha.400', 'whiteAlpha.200')}
                >
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default Layout;

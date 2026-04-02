import React, { useEffect, useState } from 'react';
import {
    Box,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    Flex,
    Text,
    useColorModeValue,
    Spinner,
    Center,
    Heading,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Avatar,
    HStack,
    Badge,
    VStack,
} from '@chakra-ui/react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
} from 'recharts';
import { analytics } from '../api/client';
import { useAuth } from '../context/AuthContext';

const StatsCard = ({ title, stat, isCustomer }) => {
    const bg = isCustomer
        ? useColorModeValue('whiteAlpha.400', 'whiteAlpha.100')
        : useColorModeValue('white', 'gray.800');
    const color = isCustomer ? 'teal.300' : 'purple.500';

    return (
        <Stat
            px={{ base: 4, md: 8 }}
            py={'5'}
            shadow={'xl'}
            border={'1px solid'}
            borderColor={useColorModeValue('whiteAlpha.300', 'whiteAlpha.200')}
            rounded={'lg'}
            bg={bg}
            backdropFilter="blur(5px)"
        >
            <StatLabel fontWeight={'semibold'} isTruncated color={isCustomer ? "whiteAlpha.900" : "gray.600"}>
                {title}
            </StatLabel>
            <StatNumber fontSize={'2xl'} fontWeight={'bold'} color={isCustomer ? "teal.200" : color}>
                {stat}
            </StatNumber>
        </Stat>
    );
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

const Dashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const cardBg = useColorModeValue('white', 'gray.800');
    const glassBg = useColorModeValue('whiteAlpha.400', 'whiteAlpha.100');
    const borderColor = useColorModeValue('whiteAlpha.300', 'whiteAlpha.200');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await analytics.dashboard();
                setData(res.data);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const isCustomer = user?.role === 'Customer';

    if (loading) return <Center h="60vh"><Spinner size="xl" color="purple.500" thickness="4px" /></Center>;
    if (error) return <Center h="60vh"><Text color="red.500">API Error: {error}</Text></Center>;

    const openTickets = data ? data.totalTickets - (data.resolvedCount || 0) : 0;
    const priorityData = Object.entries(data?.ticketsByPriority || {}).map(([name, value]) => ({ name, value }));

    // Map backend trend data to Recharts format
    const trendData = data?.trendData?.map(d => ({
        name: d.date.split('-').slice(1).join('/'), // Match MM/DD
        inbound: d.created,
        outbound: d.resolved
    })) || [];

    if (isCustomer) {
        return (
            <Box>
                <Heading size="lg" mb={6} color={useColorModeValue('teal.600', 'white')}>
                    My Dashboard
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} mb={8}>
                    <StatsCard title="My Total Tickets" stat={data?.totalTickets || 0} isCustomer />
                    <StatsCard title="Open / Pending" stat={openTickets || 0} isCustomer />
                    <StatsCard title="Resolved" stat={data?.resolvedCount || 0} isCustomer />
                </SimpleGrid>
                <Box bg={isCustomer ? useColorModeValue('white', glassBg) : glassBg} p={6} rounded="xl" shadow="md" backdropFilter="blur(5px)" border="1px solid" borderColor={borderColor}>
                    <Heading size="md" mb={4} color={isCustomer ? useColorModeValue('gray.800', 'white') : "white"}>Welcome Back!</Heading>
                    <Text color={isCustomer ? useColorModeValue('gray.700', 'whiteAlpha.900') : "whiteAlpha.900"}>You can view and manage your tickets in the Tickets section.</Text>
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            <Heading size="lg" mb={6} color="purple.600">
                Dashboard Overview
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 5, lg: 8 }} mb={8}>
                <StatsCard
                    title={'Open Tickets'}
                    stat={openTickets || 0}
                    helpText="Updated just now"
                    type="increase"
                />
                <StatsCard
                    title={'Avg. Resolution'}
                    stat={`${data?.averageResolutionHours || 0}h`}
                    helpText="System average"
                    type="increase"
                />
                <StatsCard
                    title={'Total Tickets'}
                    stat={data?.totalTickets || 0}
                    helpText="Cumulative volume"
                />
                <StatsCard
                    title={'SLA Breached'}
                    stat={data?.slaBreachedCount || 0}
                    type="decrease"
                    helpText="Immediate attention"
                />
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} mb={8}>
                {/* Ticket Volume Chart - REAL DATA */}
                <Box bg={cardBg} p={6} rounded="xl" shadow="md">
                    <Text fontWeight="bold" mb={4}>Ticket Volume Trend (Last 7 Days)</Text>
                    <Box h="300px">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" fontSize={12} stroke="#a0aec0" />
                                <YAxis fontSize={12} stroke="#a0aec0" />
                                <Tooltip />
                                <Bar dataKey="inbound" name="Created" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="outbound" name="Resolved" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </Box>

                {/* Resolution Trend Chart - REAL DATA */}
                <Box bg={cardBg} p={6} rounded="xl" shadow="md">
                    <Text fontWeight="bold" mb={4}>Activity Level</Text>
                    <Box h="300px">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" fontSize={12} stroke="#a0aec0" />
                                <YAxis fontSize={12} stroke="#a0aec0" />
                                <Tooltip />
                                <Area type="monotone" dataKey="inbound" name="Tickets Created" stroke="#8884d8" fillOpacity={1} fill="url(#colorInbound)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Box>
                </Box>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8} mb={8}>
                {/* Priority Chart */}
                <Box bg={cardBg} p={6} rounded="xl" shadow="md" colSpan={1}>
                    <Text fontWeight="bold" mb={4}>Ticket Priority</Text>
                    <Box h="250px">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={priorityData.length > 0 ? priorityData : [{ name: 'None', value: 1 }]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {priorityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                    <VStack align="stretch" mt={4} spacing={2}>
                        {priorityData.map((d, i) => (
                            <Flex key={i} justify="space-between" align="center">
                                <HStack>
                                    <Box boxSize="3" bg={COLORS[i % COLORS.length]} rounded="full" />
                                    <Text fontSize="sm">{d.name}</Text>
                                </HStack>
                                <Text fontWeight="bold">{d.value}</Text>
                            </Flex>
                        ))}
                    </VStack>
                </Box>

                {/* Agent Leaderboard */}
                <Box bg={cardBg} p={6} rounded="xl" shadow="md" colSpan={{ base: 1, lg: 2 }} gridColumn={{ lg: '2 / span 2' }}>
                    <Text fontWeight="bold" mb={4}>Agent Performance</Text>
                    <Table variant="simple" size="sm">
                        <Thead>
                            <Tr>
                                <Th>Agent</Th>
                                <Th isNumeric>Tickets</Th>
                                <Th>Status</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {data?.ticketsByAgentList?.map((agent, i) => (
                                <Tr key={i}>
                                    <Td>
                                        <HStack>
                                            <Avatar size="xs" name={agent.name} />
                                            <Text fontSize="sm" fontWeight="medium">{agent.name}</Text>
                                        </HStack>
                                    </Td>
                                    <Td isNumeric fontWeight="bold">{agent.count}</Td>
                                    <Td>
                                        <Badge colorScheme={agent.count > 10 ? 'green' : 'gray'}>
                                            {agent.count > 10 ? 'High' : 'Normal'}
                                        </Badge>
                                    </Td>
                                </Tr>
                            ))}
                            {(!data?.ticketsByAgentList || data.ticketsByAgentList.length === 0) && (
                                <Tr><Td colSpan={3} textAlign="center">No agent data available</Td></Tr>
                            )}
                        </Tbody>
                    </Table>
                </Box>
            </SimpleGrid>
        </Box>
    );
};

export default Dashboard;

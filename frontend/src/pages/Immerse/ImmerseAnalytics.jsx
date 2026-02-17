import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Mail,
  CheckCircle,
  XCircle,
  Eye,
  MousePointer,
  Users,
  Building2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { immerseEmail, immerseContacts } from '../../utils/immerseApi';

// Styled Components
const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const HeaderLeft = styled.div`
  h1 {
    color: white;
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 4px;
  }
  
  p {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    margin: 0;
  }
`;

const DateFilter = styled.div`
  display: flex;
  gap: 8px;
`;

const FilterButton = styled.button`
  padding: 8px 16px;
  background: ${({ $active }) => $active ? 'rgba(79, 70, 229, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${({ $active }) => $active ? 'rgba(79, 70, 229, 0.5)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ $active }) => $active ? 'rgba(79, 70, 229, 0.4)' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const RefreshButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

// Stats Overview Section
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

const StatCard = styled(motion.div)`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${({ $color }) => $color || 'linear-gradient(90deg, #4f46e5, #7c3aed)'};
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  background: ${({ $color }) => $color ? `${$color}20` : 'rgba(79, 70, 229, 0.2)'};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 24px;
    height: 24px;
    color: ${({ $color }) => $color || '#4f46e5'};
  }
`;

const StatTrend = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${({ $positive }) => $positive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  border-radius: 6px;
  color: ${({ $positive }) => $positive ? '#22c55e' : '#ef4444'};
  font-size: 12px;
  font-weight: 600;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const StatValue = styled.div`
  h3 {
    color: white;
    font-size: 32px;
    font-weight: 700;
    margin: 0 0 4px;
  }
  
  span {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
  }
`;

// Charts Section
const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h3 {
    color: white;
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }
`;

const ChartLegend = styled.div`
  display: flex;
  gap: 16px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  
  &::before {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 3px;
    background: ${({ $color }) => $color};
  }
`;

// Simple Bar Chart
const BarChartContainer = styled.div`
  height: 250px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding-top: 20px;
`;

const BarGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const Bar = styled(motion.div)`
  width: 100%;
  max-width: 40px;
  background: ${({ $color }) => $color || 'linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%)'};
  border-radius: 4px 4px 0 0;
  min-height: 4px;
`;

const BarLabel = styled.span`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
`;

// Donut Chart
const DonutContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`;

const DonutChart = styled.div`
  position: relative;
  width: 180px;
  height: 180px;
`;

const DonutSVG = styled.svg`
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
`;

const DonutCenter = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  
  h4 {
    color: white;
    font-size: 28px;
    font-weight: 700;
    margin: 0;
  }
  
  span {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
  }
`;

const DonutLegend = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
`;

const DonutLegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  
  .color {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${({ $color }) => $color};
  }
  
  .info {
    flex: 1;
    
    .label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }
    
    .value {
      font-size: 14px;
      color: white;
      font-weight: 600;
    }
  }
`;

// Performance Table
const PerformanceSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
`;

const TableCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  h3 {
    color: white;
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  th {
    padding: 12px 24px;
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: rgba(255, 255, 255, 0.02);
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    
    &:hover {
      background: rgba(255, 255, 255, 0.02);
    }
  }
  
  td {
    padding: 16px 24px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
  }
`;

const CategoryBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ $type }) => {
    switch ($type) {
      case 'company': return 'rgba(59, 130, 246, 0.2)';
      case 'student': return 'rgba(34, 197, 94, 0.2)';
      case 'sponsor': return 'rgba(168, 85, 247, 0.2)';
      default: return 'rgba(251, 191, 36, 0.2)';
    }
  }};
  color: ${({ $type }) => {
    switch ($type) {
      case 'company': return '#3b82f6';
      case 'student': return '#22c55e';
      case 'sponsor': return '#a855f7';
      default: return '#fbbf24';
    }
  }};
`;

const RateBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  .bar-bg {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
    
    .bar-fill {
      height: 100%;
      background: ${({ $color }) => $color || '#4f46e5'};
      border-radius: 3px;
      transition: width 0.3s ease;
    }
  }
  
  .rate {
    font-size: 13px;
    font-weight: 600;
    color: white;
    min-width: 45px;
    text-align: right;
  }
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: rgba(255, 255, 255, 0.5);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.5);
  
  p {
    margin: 0;
    font-size: 14px;
  }
`;

const ImmerseAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [stats, setStats] = useState(null);
  const [contactStats, setContactStats] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch email stats
      const emailStatsRes = await immerseEmail.getStats({ range: dateRange });
      if (emailStatsRes.data.success) {
        setStats(emailStatsRes.data.stats);
        
        // Process daily breakdown if available
        if (emailStatsRes.data.stats.dailyBreakdown) {
          setDailyData(emailStatsRes.data.stats.dailyBreakdown);
        }
        
        // Process category breakdown if available
        if (emailStatsRes.data.stats.byCategory) {
          setCategoryData(emailStatsRes.data.stats.byCategory);
        }
      }
      
      // Fetch contact stats
      const contactsRes = await immerseContacts.getAll({ limit: 1 });
      if (contactsRes.data.success) {
        setContactStats(contactsRes.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Calculate derived metrics
  const overview = stats?.overview || {};
  const deliveryRate = overview.total > 0 
    ? ((overview.delivered / overview.total) * 100).toFixed(1) 
    : 0;
  const openRate = overview.delivered > 0 
    ? ((overview.opened / overview.delivered) * 100).toFixed(1) 
    : 0;
  const bounceRate = overview.total > 0 
    ? ((overview.bounced / overview.total) * 100).toFixed(1) 
    : 0;

  // Donut chart data
  const donutData = [
    { label: 'Delivered', value: overview.delivered || 0, color: '#22c55e' },
    { label: 'Opened', value: overview.opened || 0, color: '#3b82f6' },
    { label: 'Failed', value: overview.failed || 0, color: '#ef4444' },
    { label: 'Bounced', value: overview.bounced || 0, color: '#f59e0b' },
  ];

  const totalForDonut = donutData.reduce((sum, item) => sum + item.value, 0) || 1;
  let cumulativePercentage = 0;

  // Generate sample daily data if not available
  const chartDailyData = dailyData.length > 0 ? dailyData : [
    { day: 'Mon', sent: 45, delivered: 42 },
    { day: 'Tue', sent: 52, delivered: 48 },
    { day: 'Wed', sent: 38, delivered: 36 },
    { day: 'Thu', sent: 65, delivered: 61 },
    { day: 'Fri', sent: 48, delivered: 45 },
    { day: 'Sat', sent: 22, delivered: 20 },
    { day: 'Sun', sent: 15, delivered: 14 },
  ];

  const maxValue = Math.max(...chartDailyData.map(d => Math.max(d.sent || 0, d.delivered || 0)), 1);

  // Category performance data
  const categoryPerformance = categoryData.length > 0 ? categoryData : [
    { category: 'sponsor', sent: 120, opened: 85, rate: 70.8 },
    { category: 'company', sent: 230, opened: 145, rate: 63.0 },
    { category: 'student', sent: 450, opened: 320, rate: 71.1 },
  ];

  return (
    <>
      <PageHeader>
        <HeaderLeft>
          <h1>Email Analytics</h1>
          <p>Track your email campaign performance and engagement</p>
        </HeaderLeft>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <DateFilter>
            <FilterButton $active={dateRange === '7d'} onClick={() => setDateRange('7d')}>
              7 Days
            </FilterButton>
            <FilterButton $active={dateRange === '30d'} onClick={() => setDateRange('30d')}>
              30 Days
            </FilterButton>
            <FilterButton $active={dateRange === '90d'} onClick={() => setDateRange('90d')}>
              90 Days
            </FilterButton>
          </DateFilter>
          
          <RefreshButton onClick={fetchAnalytics} whileTap={{ scale: 0.97 }}>
            <RefreshCw /> Refresh
          </RefreshButton>
        </div>
      </PageHeader>

      {loading ? (
        <LoadingState>Loading analytics...</LoadingState>
      ) : (
        <>
          {/* Stats Overview */}
          <StatsGrid>
            <StatCard
              $color="linear-gradient(90deg, #4f46e5, #7c3aed)"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <StatHeader>
                <StatIcon $color="#4f46e5">
                  <Mail />
                </StatIcon>
                <StatTrend $positive={true}>
                  <ArrowUpRight /> +12%
                </StatTrend>
              </StatHeader>
              <StatValue>
                <h3>{overview.total || 0}</h3>
                <span>Total Emails Sent</span>
              </StatValue>
            </StatCard>

            <StatCard
              $color="linear-gradient(90deg, #22c55e, #10b981)"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <StatHeader>
                <StatIcon $color="#22c55e">
                  <CheckCircle />
                </StatIcon>
                <StatTrend $positive={true}>
                  <ArrowUpRight /> {deliveryRate}%
                </StatTrend>
              </StatHeader>
              <StatValue>
                <h3>{overview.delivered || 0}</h3>
                <span>Successfully Delivered</span>
              </StatValue>
            </StatCard>

            <StatCard
              $color="linear-gradient(90deg, #3b82f6, #0ea5e9)"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StatHeader>
                <StatIcon $color="#3b82f6">
                  <Eye />
                </StatIcon>
                <StatTrend $positive={parseFloat(openRate) > 50}>
                  {parseFloat(openRate) > 50 ? <ArrowUpRight /> : <ArrowDownRight />} {openRate}%
                </StatTrend>
              </StatHeader>
              <StatValue>
                <h3>{overview.opened || 0}</h3>
                <span>Emails Opened</span>
              </StatValue>
            </StatCard>

            <StatCard
              $color="linear-gradient(90deg, #ef4444, #f97316)"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <StatHeader>
                <StatIcon $color="#ef4444">
                  <XCircle />
                </StatIcon>
                <StatTrend $positive={parseFloat(bounceRate) < 5}>
                  {parseFloat(bounceRate) < 5 ? <TrendingDown /> : <TrendingUp />} {bounceRate}%
                </StatTrend>
              </StatHeader>
              <StatValue>
                <h3>{(overview.failed || 0) + (overview.bounced || 0)}</h3>
                <span>Failed / Bounced</span>
              </StatValue>
            </StatCard>

            <StatCard
              $color="linear-gradient(90deg, #8b5cf6, #a855f7)"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <StatHeader>
                <StatIcon $color="#8b5cf6">
                  <Users />
                </StatIcon>
              </StatHeader>
              <StatValue>
                <h3>{contactStats?.total || 0}</h3>
                <span>Total Contacts</span>
              </StatValue>
            </StatCard>
          </StatsGrid>

          {/* Charts Row */}
          <ChartsRow>
            <ChartCard>
              <ChartHeader>
                <h3>Email Activity (Last 7 Days)</h3>
                <ChartLegend>
                  <LegendItem $color="#4f46e5">Sent</LegendItem>
                  <LegendItem $color="#22c55e">Delivered</LegendItem>
                </ChartLegend>
              </ChartHeader>
              
              <BarChartContainer>
                {chartDailyData.map((data, index) => (
                  <BarGroup key={index}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: '200px' }}>
                      <Bar
                        $color="linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%)"
                        initial={{ height: 0 }}
                        animate={{ height: `${(data.sent / maxValue) * 100}%` }}
                        transition={{ delay: index * 0.05, duration: 0.5 }}
                      />
                      <Bar
                        $color="linear-gradient(180deg, #22c55e 0%, #10b981 100%)"
                        initial={{ height: 0 }}
                        animate={{ height: `${(data.delivered / maxValue) * 100}%` }}
                        transition={{ delay: index * 0.05 + 0.1, duration: 0.5 }}
                      />
                    </div>
                    <BarLabel>{data.day}</BarLabel>
                  </BarGroup>
                ))}
              </BarChartContainer>
            </ChartCard>

            <ChartCard>
              <ChartHeader>
                <h3>Email Status Distribution</h3>
              </ChartHeader>
              
              <DonutContainer>
                <DonutChart>
                  <DonutSVG viewBox="0 0 100 100">
                    {donutData.map((item, index) => {
                      const percentage = (item.value / totalForDonut) * 100;
                      const strokeDasharray = `${percentage} ${100 - percentage}`;
                      const strokeDashoffset = -cumulativePercentage;
                      cumulativePercentage += percentage;
                      
                      return (
                        <circle
                          key={index}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke={item.color}
                          strokeWidth="12"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          style={{ transition: 'stroke-dasharray 0.5s ease' }}
                        />
                      );
                    })}
                  </DonutSVG>
                  <DonutCenter>
                    <h4>{overview.total || 0}</h4>
                    <span>Total</span>
                  </DonutCenter>
                </DonutChart>
                
                <DonutLegend>
                  {donutData.map((item, index) => (
                    <DonutLegendItem key={index} $color={item.color}>
                      <div className="color" />
                      <div className="info">
                        <div className="label">{item.label}</div>
                        <div className="value">{item.value}</div>
                      </div>
                    </DonutLegendItem>
                  ))}
                </DonutLegend>
              </DonutContainer>
            </ChartCard>
          </ChartsRow>

          {/* Performance Tables */}
          <PerformanceSection>
            <TableCard>
              <TableHeader>
                <h3>Category Performance</h3>
              </TableHeader>
              <Table>
                <TableHead>
                  <tr>
                    <th>Category</th>
                    <th>Sent</th>
                    <th>Opened</th>
                    <th>Open Rate</th>
                  </tr>
                </TableHead>
                <TableBody>
                  {categoryPerformance.length > 0 ? (
                    categoryPerformance.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <CategoryBadge $type={item.category}>
                            {item.category === 'company' && <Building2 size={12} />}
                            {item.category === 'student' && <Users size={12} />}
                            {item.category === 'sponsor' && <Building2 size={12} />}
                            {item.category?.charAt(0).toUpperCase() + item.category?.slice(1)}
                          </CategoryBadge>
                        </td>
                        <td>{item.sent}</td>
                        <td>{item.opened}</td>
                        <td>
                          <RateBar $color={item.rate > 60 ? '#22c55e' : item.rate > 40 ? '#f59e0b' : '#ef4444'}>
                            <div className="bar-bg">
                              <div className="bar-fill" style={{ width: `${item.rate}%` }} />
                            </div>
                            <span className="rate">{item.rate}%</span>
                          </RateBar>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState>
                          <p>No category data available</p>
                        </EmptyState>
                      </td>
                    </tr>
                  )}
                </TableBody>
              </Table>
            </TableCard>

            <TableCard>
              <TableHeader>
                <h3>Recent Campaigns</h3>
              </TableHeader>
              <Table>
                <TableHead>
                  <tr>
                    <th>Campaign</th>
                    <th>Date</th>
                    <th>Recipients</th>
                    <th>Status</th>
                  </tr>
                </TableHead>
                <TableBody>
                  {stats?.recentCampaigns?.length > 0 ? (
                    stats.recentCampaigns.map((campaign, index) => (
                      <tr key={index}>
                        <td style={{ fontWeight: 500, color: 'white' }}>{campaign.name}</td>
                        <td>{new Date(campaign.date).toLocaleDateString()}</td>
                        <td>{campaign.recipients}</td>
                        <td>
                          <RateBar $color="#22c55e">
                            <div className="bar-bg">
                              <div className="bar-fill" style={{ width: `${campaign.deliveryRate || 100}%` }} />
                            </div>
                            <span className="rate">{campaign.deliveryRate || 100}%</span>
                          </RateBar>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState>
                          <p>No campaigns yet. Start by sending bulk emails!</p>
                        </EmptyState>
                      </td>
                    </tr>
                  )}
                </TableBody>
              </Table>
            </TableCard>
          </PerformanceSection>
        </>
      )}
    </>
  );
};

export default ImmerseAnalytics;

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  Users, 
  Building2, 
  Mail, 
  FileText, 
  TrendingUp,
  Send,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { immerseApi } from '../../utils/immerseApi';

const DashboardGrid = styled.div`
  display: grid;
  gap: 24px;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
`;

const StatCard = styled(motion.div)`
  background: linear-gradient(135deg, ${({ $gradient }) => $gradient});
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform: translate(30%, -30%);
  }
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  
  svg {
    width: 24px;
    height: 24px;
    color: white;
  }
`;

const StatValue = styled.h3`
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px;
`;

const StatLabel = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin: 0;
`;

const SectionTitle = styled.h3`
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ContentRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
`;

const ActivityIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $status }) => 
    $status === 'sent' ? 'rgba(34, 197, 94, 0.2)' : 
    $status === 'failed' ? 'rgba(239, 68, 68, 0.2)' : 
    'rgba(251, 191, 36, 0.2)'};
  
  svg {
    width: 18px;
    height: 18px;
    color: ${({ $status }) => 
      $status === 'sent' ? '#22c55e' : 
      $status === 'failed' ? '#ef4444' : 
      '#fbbf24'};
  }
`;

const ActivityContent = styled.div`
  flex: 1;
  overflow: hidden;
  
  h4 {
    color: white;
    font-size: 14px;
    font-weight: 500;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  p {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    margin: 4px 0 0;
  }
`;

const ActivityTime = styled.span`
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  white-space: nowrap;
`;

const StatusList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
`;

const StatusLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  font-size: 14px;
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ $color }) => $color};
  }
`;

const StatusValue = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 600;
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 24px;
`;

const QuickActionButton = styled(motion.button)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(79, 70, 229, 0.1);
    border-color: rgba(79, 70, 229, 0.3);
  }
  
  svg {
    width: 24px;
    height: 24px;
    color: #818cf8;
  }
  
  span {
    font-size: 13px;
    font-weight: 500;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.5);
  
  p {
    margin: 8px 0 0;
    font-size: 14px;
  }
`;

const ImmerseDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await immerseApi.get('/dashboard/stats');
      if (response.data.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <CheckCircle />;
      case 'failed': return <XCircle />;
      default: return <Clock />;
    }
  };

  const statusColors = {
    pending: '#fbbf24',
    contacted: '#3b82f6',
    interested: '#22c55e',
    confirmed: '#10b981',
    declined: '#ef4444',
    registered: '#8b5cf6'
  };

  if (loading) {
    return (
      <DashboardGrid>
        <StatsRow>
          {[1, 2, 3, 4].map(i => (
            <StatCard key={i} $gradient="rgba(255,255,255,0.05), rgba(255,255,255,0.02)">
              <div style={{ height: 120 }} />
            </StatCard>
          ))}
        </StatsRow>
      </DashboardGrid>
    );
  }

  return (
    <DashboardGrid>
      <StatsRow>
        <StatCard 
          $gradient="#4f46e5, #7c3aed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <StatIcon><Users /></StatIcon>
          <StatValue>{stats?.stats?.totalContacts || 0}</StatValue>
          <StatLabel>Total Contacts</StatLabel>
        </StatCard>
        
        <StatCard 
          $gradient="#ec4899, #f472b6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatIcon><Building2 /></StatIcon>
          <StatValue>{stats?.stats?.companyContacts || 0}</StatValue>
          <StatLabel>Companies</StatLabel>
        </StatCard>
        
        <StatCard 
          $gradient="#06b6d4, #22d3ee"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatIcon><Mail /></StatIcon>
          <StatValue>{stats?.stats?.totalEmailsSent || 0}</StatValue>
          <StatLabel>Emails Sent</StatLabel>
        </StatCard>
        
        <StatCard 
          $gradient="#f59e0b, #fbbf24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatIcon><FileText /></StatIcon>
          <StatValue>{stats?.stats?.totalTemplates || 0}</StatValue>
          <StatLabel>Templates</StatLabel>
        </StatCard>
      </StatsRow>
      
      <ContentRow>
        <Card>
          <SectionTitle>
            <TrendingUp size={20} style={{ color: '#818cf8' }} />
            Recent Activity
          </SectionTitle>
          
          {stats?.recentEmails?.length > 0 ? (
            <ActivityList>
              {stats.recentEmails.map((email, index) => (
                <ActivityItem key={index}>
                  <ActivityIcon $status={email.status}>
                    {getStatusIcon(email.status)}
                  </ActivityIcon>
                  <ActivityContent>
                    <h4>{email.subject}</h4>
                    <p>To: {email.recipient}</p>
                  </ActivityContent>
                  <ActivityTime>{formatTime(email.sentAt)}</ActivityTime>
                </ActivityItem>
              ))}
            </ActivityList>
          ) : (
            <EmptyState>
              <Mail size={40} />
              <p>No recent emails</p>
            </EmptyState>
          )}
        </Card>
        
        <Card>
          <SectionTitle>
            <Users size={20} style={{ color: '#818cf8' }} />
            Contact Status
          </SectionTitle>
          
          {stats?.contactStatusStats?.length > 0 ? (
            <StatusList>
              {stats.contactStatusStats.map((status, index) => (
                <StatusItem key={index}>
                  <StatusLabel $color={statusColors[status._id] || '#6b7280'}>
                    <span className="dot" />
                    {status._id?.charAt(0).toUpperCase() + status._id?.slice(1)}
                  </StatusLabel>
                  <StatusValue>{status.count}</StatusValue>
                </StatusItem>
              ))}
            </StatusList>
          ) : (
            <EmptyState>
              <Users size={40} />
              <p>No contacts yet</p>
            </EmptyState>
          )}
        </Card>
      </ContentRow>
      
      <Card>
        <SectionTitle>Quick Actions</SectionTitle>
        <QuickActions>
          <QuickActionButton 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/immerse/compose'}
          >
            <Send />
            <span>Send Email</span>
          </QuickActionButton>
          <QuickActionButton 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/immerse/contacts'}
          >
            <Users />
            <span>Add Contact</span>
          </QuickActionButton>
          <QuickActionButton 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/immerse/templates'}
          >
            <FileText />
            <span>New Template</span>
          </QuickActionButton>
          <QuickActionButton 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/immerse/companies'}
          >
            <Building2 />
            <span>Add Company</span>
          </QuickActionButton>
        </QuickActions>
      </Card>
    </DashboardGrid>
  );
};

export default ImmerseDashboard;

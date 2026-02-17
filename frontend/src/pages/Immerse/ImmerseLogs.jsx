import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { immerseEmail } from '../../utils/immerseApi';

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SearchInput = styled.div`
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0 16px;
  width: 300px;
  
  input {
    flex: 1;
    background: none;
    border: none;
    padding: 12px 0;
    color: white;
    font-size: 14px;
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
    
    &:focus {
      outline: none;
    }
  }
  
  svg {
    color: rgba(255, 255, 255, 0.4);
    width: 18px;
    height: 18px;
  }
`;

const FilterSelect = styled.select`
  padding: 11px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  
  option {
    background: #1e293b;
  }
`;

const Button = styled(motion.button)`
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
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  
  h4 {
    color: ${({ $color }) => $color || 'white'};
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 4px;
  }
  
  p {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    margin: 0;
  }
`;

const Table = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 150px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  span {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  @media (max-width: 1024px) {
    display: none;
  }
`;

const TableRow = styled(motion.div)`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 150px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  align-items: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const EmailInfo = styled.div`
  h4 {
    color: white;
    font-size: 14px;
    font-weight: 500;
    margin: 0 0 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
  }
  
  p {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    margin: 0;
  }
`;

const TableCell = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  
  @media (max-width: 1024px) {
    display: flex;
    gap: 8px;
    
    &::before {
      content: attr(data-label);
      color: rgba(255, 255, 255, 0.4);
      font-size: 12px;
      min-width: 80px;
    }
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ $status }) => {
    switch ($status) {
      case 'sent': return 'rgba(34, 197, 94, 0.2)';
      case 'delivered': return 'rgba(16, 185, 129, 0.2)';
      case 'opened': return 'rgba(59, 130, 246, 0.2)';
      case 'failed': return 'rgba(239, 68, 68, 0.2)';
      case 'bounced': return 'rgba(236, 72, 153, 0.2)';
      default: return 'rgba(251, 191, 36, 0.2)';
    }
  }};
  color: ${({ $status }) => {
    switch ($status) {
      case 'sent': return '#22c55e';
      case 'delivered': return '#10b981';
      case 'opened': return '#3b82f6';
      case 'failed': return '#ef4444';
      case 'bounced': return '#ec4899';
      default: return '#fbbf24';
    }
  }};
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const PageInfo = styled.span`
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
`;

const PageButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const PageButton = styled.button`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $active }) => $active ? 'rgba(79, 70, 229, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${({ $active }) => $active ? 'rgba(79, 70, 229, 0.5)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.5);
  
  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  h4 {
    color: white;
    font-size: 16px;
    margin: 0 0 8px;
  }
  
  p {
    font-size: 14px;
    margin: 0;
  }
`;

const ImmerseLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter) params.status = filter;
      
      const response = await immerseEmail.getLogs(params);
      if (response.data.success) {
        setLogs(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await immerseEmail.getStats();
      if (response.data.success) {
        setStats(response.data.stats.overview);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle />;
      case 'failed':
      case 'bounced':
        return <XCircle />;
      default:
        return <Clock />;
    }
  };

  return (
    <>
      <StatsRow>
        <StatCard>
          <h4>{stats?.total || 0}</h4>
          <p>Total Emails</p>
        </StatCard>
        <StatCard $color="#22c55e">
          <h4>{stats?.sent || 0}</h4>
          <p>Sent</p>
        </StatCard>
        <StatCard $color="#10b981">
          <h4>{stats?.delivered || 0}</h4>
          <p>Delivered</p>
        </StatCard>
        <StatCard $color="#ef4444">
          <h4>{stats?.failed || 0}</h4>
          <p>Failed</p>
        </StatCard>
        <StatCard $color="#3b82f6">
          <h4>{stats?.opened || 0}</h4>
          <p>Opened</p>
        </StatCard>
      </StatsRow>
      
      <PageHeader>
        <SearchBar>
          <FilterSelect value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="opened">Opened</option>
            <option value="failed">Failed</option>
            <option value="bounced">Bounced</option>
          </FilterSelect>
        </SearchBar>
        
        <Button onClick={() => { fetchLogs(); fetchStats(); }} whileTap={{ scale: 0.98 }}>
          <RefreshCw /> Refresh
        </Button>
      </PageHeader>
      
      <Table>
        <TableHeader>
          <span>Email</span>
          <span>Recipient</span>
          <span>Category</span>
          <span>Status</span>
          <span>Sent At</span>
        </TableHeader>
        
        {loading ? (
          <EmptyState>
            <p>Loading...</p>
          </EmptyState>
        ) : logs.length === 0 ? (
          <EmptyState>
            <Mail />
            <h4>No emails found</h4>
            <p>Email logs will appear here after sending emails</p>
          </EmptyState>
        ) : (
          logs.map((log, index) => (
            <TableRow
              key={log._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.02 }}
            >
              <EmailInfo>
                <h4>{log.subject}</h4>
                {log.campaignName && (
                  <p>Campaign: {log.campaignName}</p>
                )}
              </EmailInfo>
              
              <TableCell data-label="To:">
                <div>
                  {log.recipientName && <span style={{ color: 'white' }}>{log.recipientName}</span>}
                  <br />
                  <span style={{ fontSize: 12 }}>{log.recipient}</span>
                </div>
              </TableCell>
              
              <TableCell data-label="Category:" style={{ textTransform: 'capitalize' }}>
                {log.category?.replace('_', ' ')}
              </TableCell>
              
              <TableCell data-label="Status:">
                <StatusBadge $status={log.status}>
                  {getStatusIcon(log.status)}
                  {log.status}
                </StatusBadge>
              </TableCell>
              
              <TableCell data-label="Sent:">
                {formatDate(log.sentAt)}
              </TableCell>
            </TableRow>
          ))
        )}
        
        {logs.length > 0 && (
          <Pagination>
            <PageInfo>
              Page {page} of {pagination.pages} ({pagination.total} total)
            </PageInfo>
            
            <PageButtons>
              <PageButton
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
              >
                <ChevronLeft size={18} />
              </PageButton>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <PageButton
                    key={pageNum}
                    $active={page === pageNum}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </PageButton>
                );
              })}
              
              <PageButton
                onClick={() => setPage(p => p + 1)}
                disabled={page === pagination.pages}
              >
                <ChevronRight size={18} />
              </PageButton>
            </PageButtons>
          </Pagination>
        )}
      </Table>
    </>
  );
};

export default ImmerseLogs;

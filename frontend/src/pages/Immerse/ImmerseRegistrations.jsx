import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Download,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  Eye,
  Trash2,
  RefreshCw,
  AlertTriangle,
  X,
  Send,
  Phone,
  School,
  Calendar,
  Loader2
} from 'lucide-react';
import { immerseRegistrations, immerseAdminEvents } from '../../utils/immerseApi';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  svg {
    color: #4285f4;
  }
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  margin-top: 0.25rem;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: ${props => props.variant === 'primary' 
    ? 'linear-gradient(135deg, #4285f4, #34a853)' 
    : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.variant === 'primary' 
    ? 'transparent' 
    : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 10px;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-2px);
    background: ${props => props.variant === 'primary' 
      ? 'linear-gradient(135deg, #7c7eff, #9d8cff)' 
      : 'rgba(255, 255, 255, 0.1)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: ${props => props.bg || 'rgba(66, 133, 244, 0.1)'};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    color: ${props => props.color || '#4285f4'};
  }
`;

const StatContent = styled.div``;

const StatValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
`;

const StatLabel = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
`;

const FiltersBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const SearchBox = styled.div`
  position: relative;
  flex: 1;
  min-width: 250px;
  
  svg {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 255, 255, 0.4);
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: white;
  font-size: 0.9rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  &:focus {
    outline: none;
    border-color: #4285f4;
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  min-width: 150px;
  
  &:focus {
    outline: none;
    border-color: #4285f4;
  }
  
  option {
    background: #1a1a2e;
  }
`;

const TableCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const TableTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: white;
`;



const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 1rem;
  text-align: left;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
`;

const RegistrationRow = styled.tr`
  transition: background 0.3s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
  
  ${props => {
    switch (props.status) {
      case 'confirmed':
        return `
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        `;
      case 'pending':
        return `
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        `;
      case 'attended':
        return `
          background: rgba(66, 133, 244, 0.1);
          color: #4285f4;
        `;
      case 'cancelled':
      case 'no-show':
        return `
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        `;
      default:
        return `
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
        `;
    }
  }}
`;

const EventTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  background: ${props => props.bg || 'rgba(66, 133, 244, 0.1)'};
  color: white;
`;

const ActionButton = styled.button`
  background: ${props => props.bg || 'rgba(255, 255, 255, 0.05)'};
  border: none;
  color: ${props => props.color || 'white'};
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: ${props => props.hoverBg || 'rgba(255, 255, 255, 0.1)'};
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #4285f4;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const PageInfo = styled.span`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
`;

const PageButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const PageButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${props => props.active ? '#4285f4' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.active ? '#4285f4' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover:not(:disabled) {
    background: ${props => props.active ? '#4285f4' : 'rgba(255, 255, 255, 0.1)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Modal styles
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const ModalContent = styled(motion.div)`
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  width: 100%;
  max-width: ${props => props.size === 'lg' ? '800px' : '500px'};
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: rgba(255, 255, 255, 0.6);
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  
  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const DetailItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 1rem;
`;

const DetailLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const DetailValue = styled.div`
  font-size: 0.95rem;
  color: white;
`;

const TeamMembersList = styled.div`
  margin-top: 1.5rem;
`;

const TeamMemberCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.75rem;
`;

const TeamMemberHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const TeamMemberName = styled.div`
  font-weight: 600;
  color: white;
`;

const LeaderBadge = styled.span`
  padding: 0.25rem 0.5rem;
  background: linear-gradient(135deg, #4285f4, #34a853);
  border-radius: 6px;
  font-size: 0.7rem;
  color: white;
  text-transform: uppercase;
`;

const TeamMemberInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  
  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.5);
  
  svg {
    margin-bottom: 1rem;
    opacity: 0.3;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  
  svg {
    animation: spin 1s linear infinite;
    color: #4285f4;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 0.95rem;
  resize: vertical;
  min-height: 150px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  
  &:focus {
    outline: none;
    border-color: #4285f4;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
  
  label {
    display: block;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 0.5rem;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: white;
  font-size: 0.9rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  
  &:focus {
    outline: none;
    border-color: #4285f4;
  }
`;

const ImmerseRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    eventSlug: '',
    status: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20
  });

  // Modals
  const [viewModal, setViewModal] = useState(null);
  const [emailModal, setEmailModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);

  // Email form
  const [emailForm, setEmailForm] = useState({
    subject: '',
    content: ''
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [filters, pagination.page]);

  const fetchEvents = async () => {
    try {
      const response = await immerseAdminEvents.getAll();
      if (response.data.success) {
        setEvents(response.data.events);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await immerseRegistrations.getStats();
      if (response.data.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const response = await immerseRegistrations.getAll({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      if (response.data.success) {
        setRegistrations(response.data.registrations);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination
        }));
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(registrations.map(r => r._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await immerseRegistrations.update(id, { status });
      fetchRegistrations();
      fetchStats();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedIds.length === 0) return;
    try {
      await immerseRegistrations.bulkUpdate({ ids: selectedIds, status });
      setSelectedIds([]);
      fetchRegistrations();
      fetchStats();
    } catch (error) {
      console.error('Failed to bulk update:', error);
    }
  };

  const handleCheckIn = async (id) => {
    try {
      await immerseRegistrations.checkIn(id);
      fetchRegistrations();
      fetchStats();
    } catch (error) {
      console.error('Failed to check in:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await immerseRegistrations.delete(deleteModal);
      setDeleteModal(null);
      fetchRegistrations();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleExport = async (eventSlug) => {
    try {
      const slug = eventSlug || filters.eventSlug;
      if (!slug) {
        alert('Please select an event to export');
        return;
      }
      const response = await immerseRegistrations.export(slug);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `registrations-${slug}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const handleSendEmail = async () => {
    if (selectedIds.length === 0 || !emailForm.subject || !emailForm.content) return;
    setSending(true);
    try {
      await immerseRegistrations.sendEmail({
        registrationIds: selectedIds,
        subject: emailForm.subject,
        content: emailForm.content
      });
      setEmailModal(false);
      setEmailForm({ subject: '', content: '' });
      setSelectedIds([]);
      alert('Emails sent successfully!');
    } catch (error) {
      console.error('Failed to send emails:', error);
      alert('Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventGradient = (slug) => {
    const event = events.find(e => e.slug === slug);
    if (event?.gradientColors) {
      return `linear-gradient(135deg, ${event.gradientColors.from}, ${event.gradientColors.to})`;
    }
    return 'rgba(66, 133, 244, 0.2)';
  };

  return (
    <PageContainer>
      <Header>
        <div>
          <Title>
            <Users size={28} />
            Registrations
          </Title>
          <Subtitle>Manage event registrations and participants</Subtitle>
        </div>
        <HeaderActions>
          <Button onClick={() => fetchRegistrations()}>
            <RefreshCw size={18} />
            Refresh
          </Button>
          <Button onClick={() => handleExport()} disabled={!filters.eventSlug}>
            <Download size={18} />
            Export CSV
          </Button>
          {selectedIds.length > 0 && (
            <Button variant="primary" onClick={() => setEmailModal(true)}>
              <Mail size={18} />
              Email Selected ({selectedIds.length})
            </Button>
          )}
        </HeaderActions>
      </Header>

      {/* Stats */}
      <StatsGrid>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <StatIcon bg="rgba(66, 133, 244, 0.1)" color="#4285f4">
            <Users size={24} />
          </StatIcon>
          <StatContent>
            <StatValue>{stats?.summary?.totalRegistrations || 0}</StatValue>
            <StatLabel>Total Registrations</StatLabel>
          </StatContent>
        </StatCard>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatIcon bg="rgba(34, 197, 94, 0.1)" color="#22c55e">
            <CheckCircle size={24} />
          </StatIcon>
          <StatContent>
            <StatValue>{stats?.summary?.totalConfirmed || 0}</StatValue>
            <StatLabel>Confirmed</StatLabel>
          </StatContent>
        </StatCard>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatIcon bg="rgba(245, 158, 11, 0.1)" color="#f59e0b">
            <Clock size={24} />
          </StatIcon>
          <StatContent>
            <StatValue>{stats?.summary?.totalPending || 0}</StatValue>
            <StatLabel>Pending</StatLabel>
          </StatContent>
        </StatCard>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatIcon bg="rgba(52, 168, 83, 0.1)" color="#34a853">
            <UserCheck size={24} />
          </StatIcon>
          <StatContent>
            <StatValue>{stats?.summary?.totalAttended || 0}</StatValue>
            <StatLabel>Attended</StatLabel>
          </StatContent>
        </StatCard>
      </StatsGrid>

      {/* Filters */}
      <FiltersBar>
        <SearchBox>
          <Search size={18} />
          <SearchInput
            type="text"
            placeholder="Search by name, email, team, or registration ID..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </SearchBox>
        <Select
          value={filters.eventSlug}
          onChange={(e) => handleFilterChange('eventSlug', e.target.value)}
        >
          <option value="">All Events</option>
          {events.map(event => (
            <option key={event._id} value={event.slug}>
              {event.icon} {event.name}
            </option>
          ))}
        </Select>
        <Select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="attended">Attended</option>
          <option value="cancelled">Cancelled</option>
          <option value="no-show">No Show</option>
        </Select>
      </FiltersBar>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            background: 'rgba(66, 133, 244, 0.1)',
            borderRadius: '12px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          <span style={{ color: 'white', marginRight: '0.5rem' }}>
            {selectedIds.length} selected:
          </span>
          <Button onClick={() => handleBulkStatusUpdate('confirmed')}>
            <CheckCircle size={16} /> Confirm
          </Button>
          <Button onClick={() => handleBulkStatusUpdate('cancelled')}>
            <XCircle size={16} /> Cancel
          </Button>
          <Button onClick={() => setSelectedIds([])}>
            Clear Selection
          </Button>
        </motion.div>
      )}

      {/* Table */}
      <TableCard>
        <TableHeader>
          <TableTitle>
            {pagination.total} Registration{pagination.total !== 1 ? 's' : ''}
          </TableTitle>
        </TableHeader>

        {loading ? (
          <LoadingState>
            <Loader2 size={32} />
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Loading registrations...</span>
          </LoadingState>
        ) : registrations.length === 0 ? (
          <EmptyState>
            <Users size={48} />
            <p>No registrations found</p>
          </EmptyState>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <thead>
                  <tr>
                    <Th style={{ width: '40px' }}>
                      <Checkbox
                        type="checkbox"
                        checked={selectedIds.length === registrations.length && registrations.length > 0}
                        onChange={handleSelectAll}
                      />
                    </Th>
                    <Th>Registration ID</Th>
                    <Th>Name / Team</Th>
                    <Th>Event</Th>
                    <Th>Type</Th>
                    <Th>Status</Th>
                    <Th>Date</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(reg => (
                    <RegistrationRow key={reg._id}>
                      <Td>
                        <Checkbox
                          type="checkbox"
                          checked={selectedIds.includes(reg._id)}
                          onChange={() => handleSelect(reg._id)}
                        />
                      </Td>
                      <Td>
                        <code style={{ 
                          fontSize: '0.8rem', 
                          color: '#4285f4',
                          background: 'rgba(66, 133, 244, 0.1)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          {reg.registrationId}
                        </code>
                      </Td>
                      <Td>
                        <div style={{ fontWeight: 500, color: 'white' }}>
                          {reg.teamName || reg.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                          {reg.registrationType === 'team' 
                            ? `${reg.teamMembers?.length || 0} members`
                            : reg.email}
                        </div>
                      </Td>
                      <Td>
                        <EventTag bg={getEventGradient(reg.eventSlug)}>
                          {reg.event?.icon} {reg.event?.name || reg.eventSlug}
                        </EventTag>
                      </Td>
                      <Td style={{ textTransform: 'capitalize' }}>
                        {reg.registrationType}
                      </Td>
                      <Td>
                        <StatusBadge status={reg.status}>
                          {reg.status === 'confirmed' && <CheckCircle size={12} />}
                          {reg.status === 'pending' && <Clock size={12} />}
                          {reg.status === 'attended' && <UserCheck size={12} />}
                          {(reg.status === 'cancelled' || reg.status === 'no-show') && <XCircle size={12} />}
                          {reg.status}
                        </StatusBadge>
                      </Td>
                      <Td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {formatDate(reg.createdAt)}
                        </div>
                      </Td>
                      <Td>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <ActionButton 
                            title="View Details"
                            onClick={() => setViewModal(reg)}
                          >
                            <Eye size={16} />
                          </ActionButton>
                          {!reg.checkedIn && reg.status !== 'cancelled' && (
                            <ActionButton
                              title="Check In"
                              bg="rgba(34, 197, 94, 0.1)"
                              hoverBg="rgba(34, 197, 94, 0.2)"
                              onClick={() => handleCheckIn(reg._id)}
                            >
                              <UserCheck size={16} style={{ color: '#22c55e' }} />
                            </ActionButton>
                          )}
                          <ActionButton
                            title="Delete"
                            bg="rgba(239, 68, 68, 0.1)"
                            hoverBg="rgba(239, 68, 68, 0.2)"
                            onClick={() => setDeleteModal(reg._id)}
                          >
                            <Trash2 size={16} style={{ color: '#ef4444' }} />
                          </ActionButton>
                        </div>
                      </Td>
                    </RegistrationRow>
                  ))}
                </tbody>
              </Table>
            </div>

            <Pagination>
              <PageInfo>
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </PageInfo>
              <PageButtons>
                <PageButton
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </PageButton>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <PageButton
                      key={page}
                      active={page === pagination.page}
                      onClick={() => setPagination(prev => ({ ...prev, page }))}
                    >
                      {page}
                    </PageButton>
                  );
                })}
                <PageButton
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </PageButton>
              </PageButtons>
            </Pagination>
          </>
        )}
      </TableCard>

      {/* View Modal */}
      <AnimatePresence>
        {viewModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewModal(null)}
          >
            <ModalContent
              size="lg"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>
                  <Users size={22} />
                  Registration Details
                </ModalTitle>
                <CloseButton onClick={() => setViewModal(null)}>
                  <X size={20} />
                </CloseButton>
              </ModalHeader>
              <ModalBody>
                <DetailGrid>
                  <DetailItem>
                    <DetailLabel>Registration ID</DetailLabel>
                    <DetailValue style={{ fontFamily: 'monospace', color: '#4285f4' }}>
                      {viewModal.registrationId}
                    </DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>Status</DetailLabel>
                    <DetailValue>
                      <StatusBadge status={viewModal.status}>{viewModal.status}</StatusBadge>
                    </DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>Event</DetailLabel>
                    <DetailValue>{viewModal.event?.name || viewModal.eventSlug}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>Type</DetailLabel>
                    <DetailValue style={{ textTransform: 'capitalize' }}>
                      {viewModal.registrationType}
                    </DetailValue>
                  </DetailItem>
                  {viewModal.teamName && (
                    <DetailItem style={{ gridColumn: 'span 2' }}>
                      <DetailLabel>Team Name</DetailLabel>
                      <DetailValue>{viewModal.teamName}</DetailValue>
                    </DetailItem>
                  )}
                  <DetailItem>
                    <DetailLabel><Calendar size={14} /> Registered At</DetailLabel>
                    <DetailValue>{formatDate(viewModal.createdAt)}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>Checked In</DetailLabel>
                    <DetailValue>
                      {viewModal.checkedIn ? (
                        <span style={{ color: '#22c55e' }}>✓ Yes ({formatDate(viewModal.checkedInAt)})</span>
                      ) : (
                        <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>No</span>
                      )}
                    </DetailValue>
                  </DetailItem>
                </DetailGrid>

                {viewModal.registrationType === 'team' && viewModal.teamMembers?.length > 0 && (
                  <TeamMembersList>
                    <h4 style={{ 
                      color: 'white', 
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Users size={18} />
                      Team Members ({viewModal.teamMembers.length})
                    </h4>
                    {viewModal.teamMembers.map((member, idx) => (
                      <TeamMemberCard key={idx}>
                        <TeamMemberHeader>
                          <TeamMemberName>{member.name}</TeamMemberName>
                          {member.isLeader && <LeaderBadge>Leader</LeaderBadge>}
                        </TeamMemberHeader>
                        <TeamMemberInfo>
                          <span><Mail size={14} style={{ marginRight: '0.25rem' }} />{member.email}</span>
                          <span><Phone size={14} style={{ marginRight: '0.25rem' }} />{member.phone}</span>
                          <span><School size={14} style={{ marginRight: '0.25rem' }} />{member.college}</span>
                        </TeamMemberInfo>
                      </TeamMemberCard>
                    ))}
                  </TeamMembersList>
                )}

                {viewModal.registrationType === 'individual' && (
                  <DetailGrid style={{ marginTop: '1.5rem' }}>
                    <DetailItem>
                      <DetailLabel><Mail size={14} /> Email</DetailLabel>
                      <DetailValue>{viewModal.email}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel><Phone size={14} /> Phone</DetailLabel>
                      <DetailValue>{viewModal.phone}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel><School size={14} /> College</DetailLabel>
                      <DetailValue>{viewModal.college}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <DetailLabel>Year / Branch</DetailLabel>
                      <DetailValue>{viewModal.year} - {viewModal.branch}</DetailValue>
                    </DetailItem>
                  </DetailGrid>
                )}

                {viewModal.projectIdea && (
                  <DetailItem style={{ marginTop: '1.5rem' }}>
                    <DetailLabel>Project Idea</DetailLabel>
                    <DetailValue>{viewModal.projectIdea}</DetailValue>
                  </DetailItem>
                )}
              </ModalBody>
              <ModalFooter>
                <Select
                  value={viewModal.status}
                  onChange={(e) => {
                    handleStatusUpdate(viewModal._id, e.target.value);
                    setViewModal(prev => ({ ...prev, status: e.target.value }));
                  }}
                  style={{ minWidth: '150px' }}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="attended">Attended</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </Select>
                <Button onClick={() => setViewModal(null)}>Close</Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Email Modal */}
      <AnimatePresence>
        {emailModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEmailModal(false)}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>
                  <Mail size={22} />
                  Send Email to Selected
                </ModalTitle>
                <CloseButton onClick={() => setEmailModal(false)}>
                  <X size={20} />
                </CloseButton>
              </ModalHeader>
              <ModalBody>
                <FormGroup>
                  <label>Subject</label>
                  <Input
                    type="text"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Email subject..."
                  />
                </FormGroup>
                <FormGroup>
                  <label>Content (Use {'{{name}}'} and {'{{registrationId}}'} for personalization)</label>
                  <TextArea
                    value={emailForm.content}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Email content..."
                  />
                </FormGroup>
              </ModalBody>
              <ModalFooter>
                <Button onClick={() => setEmailModal(false)}>Cancel</Button>
                <Button 
                  variant="primary" 
                  onClick={handleSendEmail}
                  disabled={sending || !emailForm.subject || !emailForm.content}
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {sending ? 'Sending...' : 'Send Email'}
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteModal(null)}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle style={{ color: '#ef4444' }}>
                  <AlertTriangle size={22} />
                  Delete Registration
                </ModalTitle>
                <CloseButton onClick={() => setDeleteModal(null)}>
                  <X size={20} />
                </CloseButton>
              </ModalHeader>
              <ModalBody>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Are you sure you want to delete this registration? This action cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button onClick={() => setDeleteModal(null)}>Cancel</Button>
                <Button 
                  style={{ 
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    borderColor: 'transparent'
                  }}
                  onClick={handleDelete}
                >
                  <Trash2 size={18} />
                  Delete
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default ImmerseRegistrations;

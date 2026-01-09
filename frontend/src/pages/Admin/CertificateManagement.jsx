import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Plus, Trash2, Eye, FileSpreadsheet } from 'lucide-react';
import { apiClient } from '../../utils/apiUtils';
import IssueCertificateModal from './components/IssueCertificateModal';
import BulkIssueModal from './components/BulkIssueModal';

const Container = styled.div`
  padding: 24px;
`;
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;
const Title = styled.h1`
  font-size: 24px;
  color: ${({ theme }) => theme.colors.text.primary};
`;
const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
`;
const AddButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  &:hover { opacity: 0.9; }
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;
const Th = styled.th`
  text-align: left;
  padding: 16px;
  background: ${({ theme }) => theme.colors.background.tertiary || '#f5f5f5'};
  color: ${({ theme }) => theme.colors.text.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;
const Td = styled.td`
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  vertical-align: middle;
  color: ${({ theme }) => theme.colors.text.primary};
`;
const ActionButton = styled.button`
  padding: 8px;
  margin-right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ color }) => color};
  &:hover { opacity: 0.7; }
`;

export default function CertificateManagement() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const fetchCerts = async () => {
    try {
      const res = await apiClient.get('/api/certificates');
      if (res.data.success) {
        setCerts(res.data.certificates || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchCerts(); }, []);

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure?")) return;
    try {
        await apiClient.delete(`/api/certificates/${id}`);
        fetchCerts();
    } catch(err) {
        console.error(err);
        alert("Delete failed. " + (err.response?.data?.message || ""));
    }
  };

  if (loading) return <Container>Loading...</Container>;

  return (
    <Container>
      <Header>
        <Title>Certificate Management</Title>
        <ButtonGroup>
          <AddButton onClick={() => setIsBulkModalOpen(true)}>
            <FileSpreadsheet size={20} /> Bulk Issue
          </AddButton>
          <AddButton onClick={() => setIsModalOpen(true)}>
            <Plus size={20} /> Issue Certificate
          </AddButton>
        </ButtonGroup>
      </Header>
      <Table>
        <thead>
          <tr>
            <Th>Code</Th>
            <Th>Recipient</Th>
            <Th>Event</Th>
            <Th>Date</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {certs.length === 0 ? <tr><Td colSpan="5" style={{textAlign: 'center'}}>No certificates found</Td></tr> : certs.map(cert => (
            <tr key={cert._id}>
              <Td>{cert.certificateCode}</Td>
              <Td>{cert.recipientName || cert.user?.name || 'Unknown'}</Td>
              <Td>{cert.event?.name || 'Unknown'}</Td>
              <Td>{new Date(cert.issuedAt).toLocaleDateString()}</Td>
              <Td>
                <ActionButton color="green" onClick={() => window.open(cert.isDynamic ? `/verification/${cert.certificateCode}` : (cert.certificateUrl || `/verification/${cert.certificateCode}`), '_blank')}><Eye size={18} /></ActionButton>
                <ActionButton color="red" onClick={() => handleDelete(cert._id)}><Trash2 size={18} /></ActionButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      <IssueCertificateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchCerts} 
      />
      <BulkIssueModal 
        isOpen={isBulkModalOpen} 
        onClose={() => setIsBulkModalOpen(false)} 
        onSuccess={fetchCerts} 
      />
    </Container>
  );
}

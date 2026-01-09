import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { apiClient } from '../../utils/apiUtils';
import TeamMemberModal from './components/TeamMemberModal';

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
const ImgPreview = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

export default function TeamManagement() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const fetchMembers = async () => {
    try {
      // Use the admin endpoint if available (needs auth middleware)
      // Assuming apiClient handles token.
      // But coreTeamController.js has getAllMembers (public) and getAllMembersAdmin (all).
      // Let's try to get all including hidden ones if possible. The public one filters visible=true.
      // We should ideally use /api/core-team/admin/all
      const res = await apiClient.get('/api/core-team/admin/all');
      if (Array.isArray(res.data)) setMembers(res.data);
      else if (res.data.success) setMembers(res.data.data);
    } catch (error) {
       console.error("Admin fetch failed, falling back to public", error);
       // Fallback to public if admin endpoint issues
       try {
         const publicRes = await apiClient.get('/api/core-team');
         if(publicRes.data.success) setMembers(publicRes.data.data);
       } catch(e) { console.error(e); }
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this member?")) return;
    try {
        await apiClient.delete(`/api/core-team/${id}`);
        // Optimistic update
        setMembers(prev => prev.filter(m => m._id !== id));
    } catch(err) {
        console.error(err);
        alert("Failed to delete");
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleSave = async (data) => {
    try {
      if (editingMember) {
        await apiClient.put(`/api/core-team/${editingMember._id}`, data);
      } else {
        await apiClient.post('/api/core-team', data);
      }
      setIsModalOpen(false);
      setEditingMember(null);
      fetchMembers(); // Refresh list
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save member: " + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <Container>Loading...</Container>;

  return (
    <Container>
      <Header>
        <Title>Team Management</Title>
        <AddButton onClick={handleAddNew}>
          <Plus size={20} /> Add Member
        </AddButton>
      </Header>
      <Table>
        <thead>
          <tr>
            <Th>Image</Th>
            <Th>Name</Th>
            <Th>Role</Th>
            <Th>Year</Th>
            <Th>Visibility</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {members.map(member => (
            <tr key={member._id}>
              <Td><ImgPreview src={member.image || '/GDG_Logo.svg'} alt={member.name} /></Td>
              <Td>{member.name}</Td>
              <Td>{member.role}</Td>
              <Td>{member.year}</Td>
              <Td>{member.visible === false ? 'Hidden' : 'Visible'}</Td>
              <Td>
                <ActionButton color="blue" onClick={() => handleEdit(member)}><Edit size={18} /></ActionButton>
                <ActionButton color="red" onClick={() => handleDelete(member._id)}><Trash2 size={18} /></ActionButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      {isModalOpen && (
        <TeamMemberModal 
          member={editingMember} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
        />
      )}
    </Container>
  );
}

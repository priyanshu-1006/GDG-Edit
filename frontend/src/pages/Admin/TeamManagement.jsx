import { useState, useEffect } from "react";
import styled from "styled-components";
import { Plus, Edit, Trash2 } from "lucide-react";
import { apiClient } from "../../utils/apiUtils";
import TeamMemberModal from "./components/TeamMemberModal";

const Container = styled.div`
  padding: 24px;
  max-width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;

  .dark & {
    color: white;
  }
`;

const AddButton = styled.button`
  background: linear-gradient(135deg, #4285f4, #3b82f6);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(66, 133, 244, 0.2);
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;

  .dark & {
    background: #1e293b;
    border-color: #334155;
  }
`;

const Th = styled.th`
  text-align: left;
  padding: 16px;
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  border-bottom: 1px solid #e2e8f0;

  .dark & {
    background: #0f172a;
    color: #94a3b8;
    border-color: #334155;
  }
`;

const Td = styled.td`
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  color: #334155;
  font-size: 14px;

  .dark & {
    color: #e2e8f0;
    border-color: #334155;
  }

  tr:last-child & {
    border-bottom: none;
  }
`;

const ActionButton = styled.button`
  padding: 8px;
  margin-right: 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  color: ${(props) => (props.color === "red" ? "#ef4444" : "#3b82f6")};
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.color === "red" ? "#fef2f2" : "#eff6ff")};
  }

  .dark & {
    &:hover {
      background: ${(props) => (props.color === "red" ? "#7f1d1d" : "#172554")};
    }
  }
`;

const ImgPreview = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
      const res = await apiClient.get("/api/core-team/admin/all");
      if (Array.isArray(res.data)) setMembers(res.data);
      else if (res.data.success) setMembers(res.data.data);
    } catch (error) {
      console.error("Admin fetch failed, falling back to public", error);
      // Fallback to public if admin endpoint issues
      try {
        const publicRes = await apiClient.get("/api/core-team");
        if (publicRes.data.success) setMembers(publicRes.data.data);
      } catch (e) {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this member?")) return;
    try {
      await apiClient.delete(`/api/core-team/${id}`);
      // Optimistic update
      setMembers((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
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
        await apiClient.post("/api/core-team", data);
      }
      setIsModalOpen(false);
      setEditingMember(null);
      fetchMembers(); // Refresh list
    } catch (error) {
      console.error("Save failed", error);
      alert(
        "Failed to save member: " +
          (error.response?.data?.message || error.message),
      );
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
          {members.map((member) => (
            <tr key={member._id}>
              <Td>
                <ImgPreview
                  src={member.image || "/GDG_Logo.svg"}
                  alt={member.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/GDG_Logo.svg";
                  }}
                />
              </Td>
              <Td>{member.name}</Td>
              <Td>{member.role}</Td>
              <Td>{member.year}</Td>
              <Td>{member.visible === false ? "Hidden" : "Visible"}</Td>
              <Td>
                <ActionButton color="blue" onClick={() => handleEdit(member)}>
                  <Edit size={18} />
                </ActionButton>
                <ActionButton
                  color="red"
                  onClick={() => handleDelete(member._id)}
                >
                  <Trash2 size={18} />
                </ActionButton>
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

import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import {
  Search,
  Download,
  UserPlus,
  MoreVertical,
  Ban,
  UserCheck,
  Shield,
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../../utils/apiUtils";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
  });
  const [roleChangeModal, setRoleChangeModal] = useState({
    open: false,
    user: null,
    newRole: "",
  });
  const [changingRole, setChangingRole] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: getAuthHeaders(),
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          role: filterRole,
        },
      });
      setUsers(response.data.users);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
      }));
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, filterRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSuspendUser = async (userId, suspend) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/admin/users/${userId}/suspend`,
        { suspend, reason: "Suspended by admin" },
        { headers: getAuthHeaders() },
      );
      fetchUsers();
    } catch (error) {
      console.error("Failed to suspend user:", error);
      alert(error.response?.data?.message || "Failed to suspend user");
    }
  };

  const handleOpenRoleChange = (user) => {
    setRoleChangeModal({ open: true, user, newRole: user.role });
  };

  const handleCloseRoleModal = () => {
    setRoleChangeModal({ open: false, user: null, newRole: "" });
    setChangingRole(false);
  };

  const handleRoleChange = async () => {
    if (!roleChangeModal.user || !roleChangeModal.newRole) return;

    if (roleChangeModal.newRole === roleChangeModal.user.role) {
      alert("Please select a different role");
      return;
    }

    try {
      setChangingRole(true);
      await axios.patch(
        `${API_BASE_URL}/api/admin/users/${roleChangeModal.user._id}/role`,
        { role: roleChangeModal.newRole },
        { headers: getAuthHeaders() },
      );

      alert("User role updated successfully!");
      handleCloseRoleModal();
      fetchUsers();
    } catch (error) {
      console.error("Failed to change user role:", error);
      alert(
        error.response?.data?.message ||
          "Failed to change user role. You may need super admin privileges.",
      );
    } finally {
      setChangingRole(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/users/export`,
        {
          headers: getAuthHeaders(),
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `users-${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to export users:", error);
    }
  };

  return (
    <Container>
      <Header>
        <Title>User Management</Title>
        <HeaderActions>
          <ExportButton onClick={handleExportUsers}>
            <Download size={20} />
            Export CSV
          </ExportButton>
          <AddButton>
            <UserPlus size={20} />
            Add User
          </AddButton>
        </HeaderActions>
      </Header>

      <FilterBar>
        <SearchBox>
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBox>

        <Select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="event_manager">Event Manager</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </Select>
      </FilterBar>

      {loading ? (
        <LoadingContainer>Loading users...</LoadingContainer>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>College</Th>
                <Th>Year</Th>
                <Th>Role</Th>
                <Th>Events</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <Td>
                    <UserName>{user.name}</UserName>
                  </Td>
                  <Td>{user.email}</Td>
                  <Td>{user.college || "N/A"}</Td>
                  <Td>{user.year || "N/A"}</Td>
                  <Td>
                    <RoleBadge $role={user.role}>
                      {user.role?.replace("_", " ")}
                    </RoleBadge>
                  </Td>
                  <Td>{user.stats?.eventsRegistered || 0}</Td>
                  <Td>
                    <StatusBadge $suspended={user.suspended}>
                      {user.suspended ? "Suspended" : "Active"}
                    </StatusBadge>
                  </Td>
                  <Td>
                    <ActionButtons>
                      <IconButton
                        title="Change Role"
                        onClick={() => handleOpenRoleChange(user)}
                      >
                        <Shield size={16} />
                      </IconButton>
                      {user.suspended ? (
                        <IconButton
                          title="Unsuspend User"
                          onClick={() => handleSuspendUser(user._id, false)}
                        >
                          <UserCheck size={16} />
                        </IconButton>
                      ) : (
                        <IconButton
                          title="Suspend User"
                          onClick={() => handleSuspendUser(user._id, true)}
                        >
                          <Ban size={16} />
                        </IconButton>
                      )}
                      <IconButton title="More Actions">
                        <MoreVertical size={16} />
                      </IconButton>
                    </ActionButtons>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Pagination>
            <PaginationInfo>
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} users
            </PaginationInfo>
            <PaginationButtons>
              <PageButton
                disabled={pagination.page === 1}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
              >
                Previous
              </PageButton>
              <PageButton
                disabled={
                  pagination.page * pagination.limit >= pagination.total
                }
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Next
              </PageButton>
            </PaginationButtons>
          </Pagination>
        </>
      )}

      {/* Role Change Modal */}
      {roleChangeModal.open && (
        <ModalOverlay onClick={handleCloseRoleModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Change User Role</ModalTitle>
              <CloseButton onClick={handleCloseRoleModal}>&times;</CloseButton>
            </ModalHeader>

            <ModalBody>
              <UserInfo>
                <InfoLabel>User:</InfoLabel>
                <InfoValue>{roleChangeModal.user?.name}</InfoValue>
                <InfoEmail>{roleChangeModal.user?.email}</InfoEmail>
              </UserInfo>

              <UserInfo>
                <InfoLabel>Current Role:</InfoLabel>
                <RoleBadge $role={roleChangeModal.user?.role}>
                  {roleChangeModal.user?.role?.replace("_", " ")}
                </RoleBadge>
              </UserInfo>

              <FormGroup>
                <Label>New Role:</Label>
                <RoleSelect
                  value={roleChangeModal.newRole}
                  onChange={(e) =>
                    setRoleChangeModal((prev) => ({
                      ...prev,
                      newRole: e.target.value,
                    }))
                  }
                  disabled={changingRole}
                >
                  <option value="student">Student</option>
                  <option value="event_manager">Event Manager</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </RoleSelect>
              </FormGroup>

              <RoleDescription>
                {roleChangeModal.newRole === "student" &&
                  "Students can register for events and view their profile."}
                {roleChangeModal.newRole === "event_manager" &&
                  "Event Managers can create and manage events, approve registrations."}
                {roleChangeModal.newRole === "admin" &&
                  "Admins have full access to user management and event operations."}
                {roleChangeModal.newRole === "super_admin" &&
                  "Super Admins have complete system access including role management."}
              </RoleDescription>

              <WarningBox>
                <strong>⚠️ Warning:</strong> Changing user roles affects their
                system permissions. This action requires super admin privileges.
              </WarningBox>
            </ModalBody>

            <ModalFooter>
              <CancelButton
                onClick={handleCloseRoleModal}
                disabled={changingRole}
              >
                Cancel
              </CancelButton>
              <ConfirmButton
                onClick={handleRoleChange}
                disabled={
                  changingRole ||
                  roleChangeModal.newRole === roleChangeModal.user?.role
                }
              >
                {changingRole ? "Changing..." : "Change Role"}
              </ConfirmButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

const Container = styled.div`
  max-width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;

const Title = styled.h1.attrs({
  className: "text-gray-900 dark:text-white",
})`
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ExportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    color: #0f172a;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #4285f4, #3b82f6);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 8px -1px rgba(59, 130, 246, 0.3);
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const SearchBox = styled.div`
  flex: 1;
  min-width: 300px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s;

  .dark & {
    background: #1e293b;
    border-color: #334155;
  }

  &:focus-within {
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  }

  svg {
    color: #94a3b8;
  }

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
    background: transparent;
    color: inherit;

    &::placeholder {
      color: #94a3b8;
    }
  }
`;

const Select = styled.select`
  padding: 10px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
  color: #475569;
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: #4285f4;
  }

  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #e2e8f0;
  }
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 64px;
  color: #64748b;
  font-weight: 500;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.05);

  .dark & {
    background: #1e293b;
    border-color: rgba(255, 255, 255, 0.05);
  }
`;

const Th = styled.th`
  text-align: left;
  padding: 16px 24px;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e2e8f0;

  .dark & {
    background: #0f172a;
    color: #94a3b8;
    border-color: rgba(255, 255, 255, 0.05);
  }
`;

const Td = styled.td`
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  color: #334155;
  transition: background 0.1s;

  .dark & {
    color: #e2e8f0;
    border-color: rgba(255, 255, 255, 0.05);
  }

  tr:last-child & {
    border-bottom: none;
  }

  /* Row Hover Effect via Parent TR */
  ${Table} tr:hover & {
    background: #f8fafc;
  }

  .dark & tr:hover & {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const UserName = styled.div`
  font-weight: 600;
  color: #0f172a;

  .dark & {
    color: #f1f5f9;
  }
`;

const RoleBadge = styled.span`
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  line-height: 1.4;

  ${(props) => {
    switch (props.$role) {
      case "super_admin":
        return `
          background: #fee2e2; color: #b91c1c;
          .dark & { background: #7f1d1d; color: #fecaca; }
        `;
      case "admin":
        return `
          background: #dbeafe; color: #1d4ed8;
          .dark & { background: #1e3a8a; color: #bfdbfe; }
        `;
      case "event_manager":
        return `
          background: #fef3c7; color: #b45309;
          .dark & { background: #78350f; color: #fde68a; }
        `;
      default:
        return `
          background: #dcfce7; color: #15803d;
          .dark & { background: #14532d; color: #bbf7d0; }
        `;
    }
  }}
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;

  &::before {
    content: "";
    display: block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  ${(props) =>
    props.$suspended
      ? `
    background: #fee2e2; color: #b91c1c;
    .dark & { background: #7f1d1d; color: #fecaca; }
  `
      : `
    background: #dcfce7; color: #15803d;
    .dark & { background: #14532d; color: #bbf7d0; }
  `}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
  padding: 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    color: #0f172a;
    border-color: #e2e8f0;
  }

  .dark & {
    color: #94a3b8;
    &:hover {
      background: #334155;
      color: #f1f5f9;
      border-color: #475569;
    }
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding: 16px 24px;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;

  .dark & {
    background: #1e293b;
    border-color: #334155;
  }
`;

const PaginationInfo = styled.div`
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const PageButton = styled.button`
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f8fafc;
    color: #0f172a;
    border-color: #cbd5e1;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f1f5f9;
  }

  .dark & {
    background: #0f172a;
    border-color: #334155;
    color: #cbd5e1;

    &:hover:not(:disabled) {
      background: #1e293b;
      color: #f1f5f9;
    }

    &:disabled {
      background: #0f172a;
      opacity: 0.3;
    }
  }
`;

// Modal Styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 60px -10px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(0, 0, 0, 0.1);

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .dark & {
    background: #1e293b;
    border-color: rgba(255, 255, 255, 0.05);
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #f0f0f0;

  .dark & {
    border-color: rgba(255, 255, 255, 0.05);
  }
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;

  .dark & {
    color: white;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    color: #ef4444;
  }

  .dark & {
    color: #94a3b8;
    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #fca5a5;
    }
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const UserInfo = styled.div`
  margin-bottom: 24px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #f1f5f9;

  .dark & {
    background: #0f172a;
    border-color: #334155;
  }
`;

const InfoLabel = styled.div`
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  .dark & {
    color: #94a3b8;
  }
`;

const InfoValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;

  .dark & {
    color: white;
  }
`;

const InfoEmail = styled.div`
  font-size: 14px;
  color: #64748b;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 8px;

  .dark & {
    color: #cbd5e1;
  }
`;

const RoleSelect = styled.select`
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  color: #0f172a;

  &:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #f1f5f9;
  }

  .dark & {
    background: #0f172a;
    border-color: #334155;
    color: white;

    &:disabled {
      background: #1e293b;
    }
  }
`;

const RoleDescription = styled.p`
  font-size: 13px;
  color: #64748b;
  margin: 16px 0;
  padding: 12px;
  background: #eff6ff;
  border-radius: 8px;
  line-height: 1.5;
  border: 1px solid #dbeafe;
  color: #1e40af;
`;

const WarningBox = styled.div`
  background: #fffcee;
  border: 1px solid #fef08a;
  border-radius: 8px;
  padding: 12px;
  margin-top: 16px;
  font-size: 13px;
  color: #854d0e;
  line-height: 1.5;

  strong {
    display: block;
    margin-bottom: 4px;
    color: #713f12;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #f0f0f0;
  background: #fcfcfc;
  border-radius: 0 0 20px 20px;

  .dark & {
    background: #0f172a;
    border-color: rgba(255, 255, 255, 0.05);
  }
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f1f5f9;
    color: #475569;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;

    &:hover:not(:disabled) {
      background: #334155;
      color: white;
    }
  }
`;

const ConfirmButton = styled.button`
  padding: 10px 20px;
  background: linear-gradient(135deg, #4285f4, #3b82f6);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 10px -1px rgba(59, 130, 246, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

export default Users;

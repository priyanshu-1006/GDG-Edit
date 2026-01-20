import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import {
  Search,
  Download,
  CheckCircle,
  XCircle,
  UserCheck,
} from "lucide-react";
import axios from "axios";

const Registrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
  });
  const [selectedRegistrations, setSelectedRegistrations] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(
        `${window.location.origin.includes("localhost") ? "http://localhost:5000" : "https://gdg-backend-ten.vercel.app"}/api/admin/events`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          params: { limit: 100 },
        },
      );
      setEvents(response.data.events);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${window.location.origin.includes("localhost") ? "http://localhost:5000" : "https://gdg-backend-ten.vercel.app"}/api/admin/registrations`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          params: {
            page: pagination.page,
            limit: pagination.limit,
            search: searchTerm,
            status: filterStatus,
            eventId: selectedEvent,
          },
        },
      );
      setRegistrations(response.data.registrations);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination.total,
      }));
    } catch (error) {
      console.error("Failed to fetch registrations:", error);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    searchTerm,
    filterStatus,
    selectedEvent,
  ]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleApprove = async (registrationId) => {
    try {
      const API_URL = window.location.origin.includes("localhost")
        ? "http://localhost:5000"
        : "https://gdg-backend-ten.vercel.app";
      await axios.patch(
        `${API_URL}/api/admin/registrations/${registrationId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      fetchRegistrations();
    } catch (error) {
      console.error("Failed to approve registration:", error);
    }
  };

  const handleReject = async (registrationId) => {
    const reason = prompt("Enter rejection reason (optional):");
    try {
      const API_URL = window.location.origin.includes("localhost")
        ? "http://localhost:5000"
        : "https://gdg-backend-ten.vercel.app";
      await axios.patch(
        `${API_URL}/api/admin/registrations/${registrationId}/reject`,
        { reason },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      fetchRegistrations();
    } catch (error) {
      console.error("Failed to reject registration:", error);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRegistrations.length === 0) {
      alert("Please select registrations to approve");
      return;
    }

    try {
      const API_URL = window.location.origin.includes("localhost")
        ? "http://localhost:5000"
        : "https://gdg-backend-ten.vercel.app";
      await axios.post(
        `${API_URL}/api/admin/registrations/bulk-approve`,
        { registrationIds: selectedRegistrations },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      setSelectedRegistrations([]);
      fetchRegistrations();
    } catch (error) {
      console.error("Failed to bulk approve:", error);
    }
  };

  const handleMarkAttendance = async (registrationId, attended) => {
    try {
      const API_URL = window.location.origin.includes("localhost")
        ? "http://localhost:5000"
        : "https://gdg-backend-ten.vercel.app";
      await axios.patch(
        `${API_URL}/api/admin/registrations/${registrationId}/attendance`,
        { attended },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      fetchRegistrations();
    } catch (error) {
      console.error("Failed to mark attendance:", error);
    }
  };

  const handleExport = async () => {
    try {
      const API_URL = window.location.origin.includes("localhost")
        ? "http://localhost:5000"
        : "https://gdg-backend-ten.vercel.app";
      const response = await axios.get(
        `${API_URL}/api/admin/registrations/export`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          params: { eventId: selectedEvent },
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `registrations-${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to export registrations:", error);
    }
  };

  const toggleSelection = (id) => {
    setSelectedRegistrations((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id],
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "#fbbc04",
      approved: "#34a853",
      rejected: "#ea4335",
    };
    return colors[status] || "#666";
  };

  return (
    <Container>
      <Header>
        <div>
          <Title>Registration Management</Title>
          <Subtitle>Manage event registrations and approvals</Subtitle>
        </div>
        <HeaderActions>
          {selectedRegistrations.length > 0 && (
            <BulkButton onClick={handleBulkApprove}>
              <CheckCircle size={20} />
              Approve Selected ({selectedRegistrations.length})
            </BulkButton>
          )}
          <ExportButton onClick={handleExport}>
            <Download size={20} />
            Export CSV
          </ExportButton>
        </HeaderActions>
      </Header>

      <FilterBar>
        <SearchBox>
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBox>

        <FilterGroup>
          <Select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            <option value="">All Events</option>
            {events.map((event) => (
              <option key={event._id} value={event._id}>
                {event.name}
              </option>
            ))}
          </Select>

          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </FilterGroup>
      </FilterBar>

      {loading ? (
        <LoadingContainer>Loading registrations...</LoadingContainer>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>
                  <input
                    type="checkbox"
                    checked={
                      selectedRegistrations.length === registrations.length &&
                      registrations.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRegistrations(
                          registrations.map((r) => r._id),
                        );
                      } else {
                        setSelectedRegistrations([]);
                      }
                    }}
                  />
                </Th>
                <Th>Student</Th>
                <Th>Event</Th>
                <Th>College</Th>
                <Th>Year</Th>
                <Th>Status</Th>
                <Th>Attended</Th>
                <Th>Registered</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => (
                <tr key={reg._id}>
                  <Td>
                    <input
                      type="checkbox"
                      checked={selectedRegistrations.includes(reg._id)}
                      onChange={() => toggleSelection(reg._id)}
                    />
                  </Td>
                  <Td>
                    <UserInfo>
                      <UserName>{reg.user?.name}</UserName>
                      <UserEmail>{reg.user?.email}</UserEmail>
                    </UserInfo>
                  </Td>
                  <Td>{reg.event?.name}</Td>
                  <Td>{reg.user?.college || "N/A"}</Td>
                  <Td>{reg.user?.year || "N/A"}</Td>
                  <Td>
                    <StatusBadge $color={getStatusColor(reg.status)}>
                      {reg.status}
                    </StatusBadge>
                  </Td>
                  <Td>
                    <AttendanceToggle>
                      <input
                        type="checkbox"
                        checked={reg.attended || false}
                        onChange={(e) =>
                          handleMarkAttendance(reg._id, e.target.checked)
                        }
                      />
                      <span>{reg.attended ? "Yes" : "No"}</span>
                    </AttendanceToggle>
                  </Td>
                  <Td>{new Date(reg.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    <ActionButtons>
                      {reg.status === "pending" && (
                        <>
                          <ActionButton
                            $success
                            onClick={() => handleApprove(reg._id)}
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </ActionButton>
                          <ActionButton
                            $danger
                            onClick={() => handleReject(reg._id)}
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </ActionButton>
                        </>
                      )}
                      {reg.status === "approved" && !reg.attended && (
                        <ActionButton
                          onClick={() => handleMarkAttendance(reg._id, true)}
                          title="Mark Attended"
                        >
                          <UserCheck size={16} />
                        </ActionButton>
                      )}
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
              of {pagination.total} registrations
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

const Subtitle = styled.p.attrs({
  className: "text-gray-500 dark:text-gray-400",
})`
  font-size: 15px;
  margin-top: 6px;
  line-height: 1.5;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const BulkButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #22c55e;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.2);
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 8px -1px rgba(34, 197, 94, 0.3);
  }
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
    color: #0f172a;
  }

  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;

    &:hover {
      background: #334155;
      color: white;
    }
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

const FilterGroup = styled.div`
  display: flex;
  gap: 12px;
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
  min-width: 150px;
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

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #0f172a;

  .dark & {
    color: #f1f5f9;
  }
`;

const UserEmail = styled.div`
  font-size: 13px;
  color: #64748b;
`;

const StatusBadge = styled.span`
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;

  ${(props) => {
    switch (props.children.toLowerCase()) {
      case "approved":
        return `background: #dcfce7; color: #15803d; .dark & { background: #14532d; color: #bbf7d0; }`;
      case "rejected":
        return `background: #fee2e2; color: #b91c1c; .dark & { background: #7f1d1d; color: #fecaca; }`;
      default:
        return `background: #fef9c3; color: #854d0e; .dark & { background: #713f12; color: #fef08a; }`;
    }
  }}
`;

const AttendanceToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;

  input {
    cursor: pointer;
    width: 16px;
    height: 16px;
    accent-color: #22c55e;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  ${(props) =>
    props.$success
      ? `
    background: #dcfce7;
    border: 1px solid #bbf7d0;
    color: #15803d;
    
    &:hover {
      background: #bbf7d0;
      color: #14532d;
    }
  `
      : props.$danger
        ? `
    background: #fee2e2;
    border: 1px solid #fecaca;
    color: #b91c1c;
    
    &:hover {
      background: #fecaca;
      color: #7f1d1d;
    }
  `
        : `
    background: white;
    border: 1px solid #e2e8f0;
    color: #64748b;
    
      background: #f8fafc;
      color: #0f172a;
    }

    .dark & {
      background: #1e293b;
      border-color: #334155;
      color: #94a3b8;
      
      &:hover {
        background: #334155;
        color: #f1f5f9;
      }
    }
  `}
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

export default Registrations;

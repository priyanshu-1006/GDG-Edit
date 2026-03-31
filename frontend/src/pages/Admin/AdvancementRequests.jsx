import { useState, useEffect } from "react";
import styled from "styled-components";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  AlertCircle,
  Trash2,
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";

const API = `${API_BASE_URL}/api`;

const AdvancementRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [reviewingId, setReviewingId] = useState("");
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${API}/induction/advancement-requests?status=${filter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm("Approve this advancement request? Student will be moved to the next round.")) return;

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.patch(
        `${API}/induction/advancement-requests/${requestId}/approve`,
        { reviewNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        alert("Request approved successfully!");
        setReviewNote("");
        setReviewingId("");
        fetchRequests();
      }
    } catch (err) {
      console.error("Failed to approve request:", err);
      alert(err.response?.data?.message || "Failed to approve request.");
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm("Reject this advancement request?")) return;

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.patch(
        `${API}/induction/advancement-requests/${requestId}/reject`,
        { reviewNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        alert("Request rejected.");
        setReviewNote("");
        setReviewingId("");
        fetchRequests();
      }
    } catch (err) {
      console.error("Failed to reject request:", err);
      alert(err.response?.data?.message || "Failed to reject request.");
    }
  };

  const getStatusLabel = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'shortlisted_online':
        return '#3b82f6';
      case 'shortlisted_offline':
        return '#8b5cf6';
      case 'selected':
        return '#22c55e';
      case 'rejected':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  return (
    <Container>
      <Header>
        <Title>Advancement Requests</Title>
        <FilterTabs>
          <FilterTab $active={filter === "pending"} onClick={() => setFilter("pending")}>
            <Clock size={16} />
            Pending
          </FilterTab>
          <FilterTab $active={filter === "approved"} onClick={() => setFilter("approved")}>
            <CheckCircle size={16} />
            Approved
          </FilterTab>
          <FilterTab $active={filter === "rejected"} onClick={() => setFilter("rejected")}>
            <XCircle size={16} />
            Rejected
          </FilterTab>
        </FilterTabs>
      </Header>

      {loading ? (
        <LoadingState>Loading requests...</LoadingState>
      ) : requests.length === 0 ? (
        <EmptyState>
          <AlertCircle size={48} />
          <p>No {filter} requests found.</p>
        </EmptyState>
      ) : (
        <RequestsGrid>
          {requests.map((req) => (
            <RequestCard key={req._id}>
              <CardHeader>
                <StudentInfo>
                  <StudentName>
                    {req.student?.firstName} {req.student?.lastName}
                  </StudentName>
                  <StudentMeta>
                    {req.student?.rollNumber} • {req.student?.branch}
                  </StudentMeta>
                </StudentInfo>
                <StatusBadge $color={getStatusColor(req.targetStatus)}>
                  {getStatusLabel(req.targetStatus)}
                </StatusBadge>
              </CardHeader>

              <CardBody>
                <InfoRow>
                  <InfoLabel>
                    <User size={14} />
                    Requested by:
                  </InfoLabel>
                  <InfoValue>
                    {req.requestedByName} ({req.requestedByRole})
                  </InfoValue>
                </InfoRow>

                <InfoRow>
                  <InfoLabel>
                    <Calendar size={14} />
                    Requested on:
                  </InfoLabel>
                  <InfoValue>
                    {new Date(req.createdAt).toLocaleString()}
                  </InfoValue>
                </InfoRow>

                <InfoRow>
                  <InfoLabel>Current Status:</InfoLabel>
                  <InfoValue>{getStatusLabel(req.currentStatus)}</InfoValue>
                </InfoRow>

                {req.reason && (
                  <ReasonBox>
                    <strong>Reason:</strong>
                    <p>{req.reason}</p>
                  </ReasonBox>
                )}

                {req.status === "pending" ? (
                  <Actions>
                    {reviewingId === req._id ? (
                      <>
                        <ReviewNoteInput
                          placeholder="Add review note (optional)"
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                        />
                        <ActionButton $variant="approve" onClick={() => handleApprove(req._id)}>
                          <CheckCircle size={16} />
                          Approve
                        </ActionButton>
                        <ActionButton $variant="reject" onClick={() => handleReject(req._id)}>
                          <XCircle size={16} />
                          Reject
                        </ActionButton>
                        <ActionButton onClick={() => { setReviewingId(""); setReviewNote(""); }}>
                          Cancel
                        </ActionButton>
                      </>
                    ) : (
                      <ActionButton onClick={() => setReviewingId(req._id)}>
                        Review Request
                      </ActionButton>
                    )}
                  </Actions>
                ) : (
                  <ReviewedInfo>
                    <ReviewStatus $approved={req.status === "approved"}>
                      {req.status === "approved" ? (
                        <CheckCircle size={16} />
                      ) : (
                        <XCircle size={16} />
                      )}
                      {req.status === "approved" ? "Approved" : "Rejected"} by {req.reviewedByName}
                    </ReviewStatus>
                    {req.reviewNote && (
                      <ReviewNote>
                        <strong>Review Note:</strong> {req.reviewNote}
                      </ReviewNote>
                    )}
                  </ReviewedInfo>
                )}
              </CardBody>
            </RequestCard>
          ))}
        </RequestsGrid>
      )}
    </Container>
  );
};

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`;

const Title = styled.h1.attrs({
  className: "text-gray-900 dark:text-white",
})`
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 8px;
  background: rgba(0, 0, 0, 0.03);
  padding: 4px;
  border-radius: 12px;

  .dark & {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const FilterTab = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: ${(props) => (props.$active ? "#ffffff" : "transparent")};
  color: ${(props) => (props.$active ? "#1e293b" : "#64748b")};
  font-weight: ${(props) => (props.$active ? "600" : "500")};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.$active ? "#ffffff" : "rgba(0, 0, 0, 0.05)")};
  }

  .dark & {
    background: ${(props) => (props.$active ? "#1e293b" : "transparent")};
    color: ${(props) => (props.$active ? "#e2e8f0" : "#94a3b8")};

    &:hover {
      background: ${(props) =>
        props.$active ? "#1e293b" : "rgba(255, 255, 255, 0.05)"};
    }
  }
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #64748b;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #64748b;
  gap: 16px;

  p {
    font-size: 16px;
    margin: 0;
  }
`;

const RequestsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const RequestCard = styled.div.attrs({
  className: "bg-white dark:bg-gray-800",
})`
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  .dark & {
    border-color: rgba(255, 255, 255, 0.08);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

  .dark & {
    border-color: rgba(255, 255, 255, 0.05);
  }
`;

const StudentInfo = styled.div`
  flex: 1;
`;

const StudentName = styled.div.attrs({
  className: "text-gray-900 dark:text-white",
})`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const StudentMeta = styled.div.attrs({
  className: "text-gray-500 dark:text-gray-400",
})`
  font-size: 13px;
`;

const StatusBadge = styled.div`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  background: ${(props) => props.$color};
`;

const CardBody = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
`;

const InfoLabel = styled.div.attrs({
  className: "text-gray-600 dark:text-gray-400",
})`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
`;

const InfoValue = styled.div.attrs({
  className: "text-gray-900 dark:text-white",
})`
  font-weight: 600;
`;

const ReasonBox = styled.div.attrs({
  className: "bg-gray-50 dark:bg-gray-900",
})`
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;

  strong {
    color: #64748b;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  p {
    margin: 4px 0 0;
    color: #1e293b;
    line-height: 1.5;
  }

  .dark & p {
    color: #e2e8f0;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const ReviewNoteInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;

  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #e2e8f0;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid ${(props) =>
    props.$variant === "approve"
      ? "#22c55e"
      : props.$variant === "reject"
        ? "#ef4444"
        : "#cbd5e1"};
  background: ${(props) =>
    props.$variant === "approve"
      ? "#22c55e"
      : props.$variant === "reject"
        ? "#ef4444"
        : "white"};
  color: ${(props) => (props.$variant ? "white" : "#475569")};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .dark & {
    background: ${(props) =>
      props.$variant === "approve"
        ? "#22c55e"
        : props.$variant === "reject"
          ? "#ef4444"
          : "#1e293b"};
    border-color: ${(props) =>
      props.$variant === "approve"
        ? "#22c55e"
        : props.$variant === "reject"
          ? "#ef4444"
          : "#334155"};
    color: ${(props) => (props.$variant ? "white" : "#cbd5e1")};
  }
`;

const ReviewedInfo = styled.div`
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);

  .dark & {
    border-color: rgba(255, 255, 255, 0.05);
  }
`;

const ReviewStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => (props.$approved ? "#22c55e" : "#ef4444")};
  margin-bottom: 8px;
`;

const ReviewNote = styled.div`
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;

  strong {
    display: block;
    margin-bottom: 4px;
  }
`;

export default AdvancementRequests;

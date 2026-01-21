import { useState, useEffect } from "react";
import styled from "styled-components";
import {
  Users,
  Calendar,
  ClipboardCheck,
  Award,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../../utils/apiUtils";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/dashboard/stats`,
        {
          headers: getAuthHeaders(),
        },
      );
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingContainer>Loading dashboard...</LoadingContainer>;
  }

  if (!stats) {
    return (
      <Container>
        <LoadingContainer>
          <div style={{ textAlign: "center" }}>
            <p>Failed to load dashboard data.</p>
            <ActionButton
              onClick={fetchDashboardStats}
              style={{ marginTop: 20, justifyContent: "center" }}
            >
              Retry
            </ActionButton>
          </div>
        </LoadingContainer>
      </Container>
    );
  }

  const statsObj = stats?.stats || {};

  const statsCards = [
    {
      title: "Total Users",
      value: statsObj.totalUsers?.count || 0,
      icon: Users,
      color: "#4285f4",
      growth: statsObj.totalUsers?.change || 0,
    },
    {
      title: "Total Events",
      value: statsObj.activeEvents?.total || 0,
      icon: Calendar,
      color: "#ea4335",
      growth: 0,
    },
    {
      title: "Pending Registrations",
      value: statsObj.pendingRegistrations?.count || 0,
      icon: ClipboardCheck,
      color: "#fbbc04",
      growth: 0,
    },
    {
      title: "Certificates Issued",
      value: statsObj.certificatesIssued?.count || 0,
      icon: Award,
      color: "#34a853",
      growth: 0,
    },
  ];

  return (
    <Container>
      <Header>
        <Title>Dashboard Overview</Title>
        <Subtitle>Welcome to GDG Admin Portal</Subtitle>
      </Header>

      <StatsGrid>
        {statsCards.map((card, index) => (
          <StatsCard key={index} $color={card.color}>
            <CardIcon color={card.color}>
              <card.icon size={32} color={card.color} />
            </CardIcon>
            <CardContent>
              <CardTitle>{card.title}</CardTitle>
              <CardValue>{card.value.toLocaleString()}</CardValue>
              {card.growth !== 0 && (
                <Growth $positive={card.growth > 0}>
                  {card.growth > 0 ? (
                    <TrendingUp size={16} />
                  ) : (
                    <TrendingDown size={16} />
                  )}
                  {Math.abs(card.growth)}%
                </Growth>
              )}
            </CardContent>
          </StatsCard>
        ))}
      </StatsGrid>

      <InfoGrid>
        <InfoCard>
          <InfoTitle>Quick Stats</InfoTitle>
          <InfoList>
            <InfoItem>
              <InfoLabel>Active Events</InfoLabel>
              <InfoValue>{stats?.stats?.activeEvents?.count || 0}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>New Users This Week</InfoLabel>
              <InfoValue>
                {stats?.stats?.newUsersThisWeek?.count || 0}
              </InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Certificates This Month</InfoLabel>
              <InfoValue>
                {stats?.stats?.certificatesIssued?.count || 0}
              </InfoValue>
            </InfoItem>
          </InfoList>
        </InfoCard>

        <InfoCard>
          <InfoTitle>Quick Actions</InfoTitle>
          <ActionButton
            onClick={() => (window.location.href = "/admin/events/create")}
          >
            Create New Event
          </ActionButton>
          <ActionButton
            onClick={() => (window.location.href = "/admin/notifications")}
          >
            Send Notification
          </ActionButton>
          <ActionButton
            onClick={() =>
              (window.location.href = "/admin/registrations?status=pending")
            }
          >
            Review Registrations
          </ActionButton>
        </InfoCard>
      </InfoGrid>
    </Container>
  );
};

const Container = styled.div`
  max-width: 100%;
`;

const Header = styled.div`
  margin-bottom: 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;

const Title = styled.h1.attrs({
  className: "text-gray-900 dark:text-white",
})`
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -1px;
  margin-bottom: 8px;
`;

const Subtitle = styled.p.attrs({
  className: "text-gray-500 dark:text-gray-400",
})`
  font-size: 16px;
  max-width: 600px;
  line-height: 1.5;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 16px;
  font-weight: 500;
  color: #64748b;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
`;

const StatsCard = styled.div.attrs({
  className: "bg-white dark:bg-gray-800",
})`
  border-radius: 20px;
  padding: 24px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03);
  display: flex;
  gap: 20px;
  transition:
    margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.2s ease;
  min-width: 0;
  background: ${(props) => props.theme.colors.surfaceElevated || "#ffffff"};
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${(props) => props.$color};
    opacity: 0.8;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .dark & {
    border-color: rgba(255, 255, 255, 0.05);
  }
`;

const CardIcon = styled.div`
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: ${(props) => props.color}15; /* 15% opacity */
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    stroke-width: 2.5px;
  }
`;

const CardContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const CardTitle = styled.div.attrs({
  className: "text-gray-500 dark:text-gray-400",
})`
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const CardValue = styled.div.attrs({
  className: "text-gray-900 dark:text-white",
})`
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1;
`;

const Growth = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: ${(props) => (props.$positive ? "#10b981" : "#ef4444")};
  margin-top: 8px;
  background: ${(props) => (props.$positive ? "#10b98115" : "#ef444415")};
  padding: 2px 8px;
  border-radius: 99px;
  align-self: flex-start;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 32px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const InfoCard = styled.div.attrs({
  className: "bg-white dark:bg-gray-800",
})`
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);

  .dark & {
    border-color: rgba(255, 255, 255, 0.05);
  }
`;

const InfoTitle = styled.h3.attrs({
  className: "text-gray-900 dark:text-white",
})`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;

  &::before {
    content: "";
    display: block;
    width: 6px;
    height: 24px;
    background: linear-gradient(to bottom, #4285f4, #3b82f6);
    border-radius: 3px;
  }
`;

const InfoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.2s;

  &:last-child {
    border-bottom: none;
  }

  .dark & {
    border-color: rgba(255, 255, 255, 0.05);
  }
`;

const InfoLabel = styled.span.attrs({
  className: "text-gray-600 dark:text-gray-300",
})`
  font-size: 15px;
  font-weight: 500;
`;

const InfoValue = styled.span.attrs({
  className: "text-gray-900 dark:text-white",
})`
  font-size: 18px;
  font-weight: 700;
  font-feature-settings: "tnum";
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 16px;
  background: white;
  color: #333;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-2px);
    border-color: #4285f4;
    color: #4285f4;
    box-shadow: 0 8px 16px rgba(66, 133, 244, 0.1);
  }

  &::after {
    content: "→";
    opacity: 0;
    transform: translateX(-10px);
    transition: all 0.2s;
  }

  &:hover::after {
    opacity: 1;
    transform: translateX(0);
  }

  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;

    &:hover {
      border-color: #4285f4;
      color: #4285f4;
    }
  }

  &:last-child {
    margin-bottom: 0;
  }

  /* Primary Action Variant */
  &:first-of-type {
    background: linear-gradient(135deg, #4285f4, #3b82f6);
    color: white;
    border: none;
    box-shadow: 0 4px 12px rgba(66, 133, 244, 0.25);

    &:hover {
      box-shadow: 0 8px 20px rgba(66, 133, 244, 0.35);
      border-color: transparent;
      color: white;
    }
  }
`;

export default AdminDashboard;

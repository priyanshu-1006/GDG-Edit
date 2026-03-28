import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useAuth } from '../../contexts/useAuth';
import { FiCalendar, FiAward, FiUsers, FiTrendingUp, FiClock, FiMapPin } from 'react-icons/fi';
import { API_BASE_URL } from '../../config/api';

const OverviewContainer = styled.div`
  animation: fadeIn 0.5s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const WelcomeText = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 2rem;
  margin-bottom: 0.5rem;
  font-weight: 700;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const SubText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1.1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const StatCard = styled.div`
  background: #1c1c1c;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }

  @media (max-width: 768px) {
    padding: 1rem;
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const StatIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: ${props => props.$color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }

  @media (max-width: 480px) {
    width: 45px;
    height: 45px;
    font-size: 1.1rem;
  }
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 0.25rem;

  @media (max-width: 768px) {
    font-size: 1.75rem;
  }

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const StatLabel = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.95rem;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: #1c1c1c;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const CardTitle = styled.h2`
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 700;
`;

const ViewAllButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: black;
    text-decoration: underline;
  }
`;

const EventList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const EventItem = styled.div`
  padding: 1rem;
  background: #1c1c1c;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    background: #222222;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const EventTitle = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 0.5rem;
  font-size: 1.05rem;
`;

const EventDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.9rem;
`;

const EventDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ActivityItem = styled.div`
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
`;

const ActivityDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$color || '#667eea'};
  margin-top: 0.5rem;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityText = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
`;

const ActivityTime = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.85rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  
  &::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Overview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    eventsRegistered: 0,
    certificatesEarned: 0,
    teamsJoined: 0,
    studyJamsProgress: 0
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch user registrations
      const registrationsRes = await axios.get(
        `${API_BASE_URL}/api/registrations/user`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch user certificates
      const certificatesRes = await axios.get(
        `${API_BASE_URL}/api/certificates/user`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch user teams
      const teamsRes = await axios.get(
        `${API_BASE_URL}/api/teams/user`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch Study Jams progress
      const studyJamsRes = await axios.get(
        `${API_BASE_URL}/api/studyjams/progress`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch upcoming events
      const eventsRes = await axios.get(
        `${API_BASE_URL}/api/events?status=upcoming&limit=3`
      );

      setStats({
        eventsRegistered: registrationsRes.data.length || 0,
        certificatesEarned: certificatesRes.data.length || 0,
        teamsJoined: teamsRes.data.length || 0,
        studyJamsProgress: studyJamsRes.data.completionPercentage || 0
      });

      setUpcomingEvents(eventsRes.data.events || eventsRes.data || []);

      // Generate recent activity from registrations and certificates
      const activities = [];
      
      certificatesRes.data.slice(0, 2).forEach(cert => {
        activities.push({
          text: `Earned certificate for ${cert.eventName}`,
          time: new Date(cert.issuedDate).toLocaleDateString(),
          color: '#10b981'
        });
      });

      registrationsRes.data.slice(0, 3).forEach(reg => {
        activities.push({
          text: `Registered for ${reg.eventId?.title || 'an event'}`,
          time: new Date(reg.registeredAt).toLocaleDateString(),
          color: '#667eea'
        });
      });

      setRecentActivity(activities.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <OverviewContainer>
      <Header>
        <WelcomeText>Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋</WelcomeText>
        <SubText>Here's what's happening with your GDG journey</SubText>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatIcon $color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
            <FiCalendar />
          </StatIcon>
          <StatInfo>
            <StatValue>{stats.eventsRegistered}</StatValue>
            <StatLabel>Events Registered</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon $color="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
            <FiAward />
          </StatIcon>
          <StatInfo>
            <StatValue>{stats.certificatesEarned}</StatValue>
            <StatLabel>Certificates Earned</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon $color="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
            <FiUsers />
          </StatIcon>
          <StatInfo>
            <StatValue>{stats.teamsJoined}</StatValue>
            <StatLabel>Teams Joined</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon $color="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
            <FiTrendingUp />
          </StatIcon>
          <StatInfo>
            <StatValue>{stats.studyJamsProgress}%</StatValue>
            <StatLabel>Study Jams Progress</StatLabel>
          </StatInfo>
        </StatCard>
      </StatsGrid>

      <ContentGrid>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <ViewAllButton onClick={() => window.location.href = '/dashboard/events'}>
              View All
            </ViewAllButton>
          </CardHeader>
          <EventList>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <EventItem key={event._id}>
                  <EventTitle>{event.title}</EventTitle>
                  <EventDetails>
                    <EventDetail>
                      <FiClock />
                      <span>{formatDate(event.startDate)}</span>
                    </EventDetail>
                    <EventDetail>
                      <FiMapPin />
                      <span>{event.location || 'Online'}</span>
                    </EventDetail>
                  </EventDetails>
                </EventItem>
              ))
            ) : (
              <EmptyState>No upcoming events at the moment</EmptyState>
            )}
          </EventList>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <ActivityList>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <ActivityItem key={index}>
                  <ActivityDot $color={activity.color} />
                  <ActivityContent>
                    <ActivityText>{activity.text}</ActivityText>
                    <ActivityTime>{activity.time}</ActivityTime>
                  </ActivityContent>
                </ActivityItem>
              ))
            ) : (
              <EmptyState>No recent activity</EmptyState>
            )}
          </ActivityList>
        </Card>
      </ContentGrid>
    </OverviewContainer>
  );
};

export default Overview;

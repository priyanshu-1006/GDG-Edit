import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { FiUsers, FiCalendar, FiLogOut, FiUserPlus } from 'react-icons/fi';
import { API_BASE_URL } from '../../config/api';

const Container = styled.div`
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

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 2rem;
  margin-bottom: 0.5rem;
  font-weight: 700;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1.1rem;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const TeamsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.25rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const TeamCard = styled.div`
  background: ${({ theme }) => theme.colors.surfaceElevated};
  border: 1px solid ${({ theme }) => theme.colors.divider};
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: ${({ theme }) => theme.colors.shadows.medium};
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

const TeamCardHeader = styled.div`
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.divider};
`;

const TeamName = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const TeamEvent = styled.div`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 0.95rem;
  font-weight: 600;
`;

const TeamMembers = styled.div`
  margin-bottom: 1rem;
`;

const MemberCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
`;

const MembersList = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.$color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1rem;

  @media (max-width: 768px) {
    width: 35px;
    height: 35px;
    font-size: 0.9rem;
  }
`;

const MoreMembers = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.background.tertiary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  font-size: 0.85rem;

  @media (max-width: 768px) {
    width: 35px;
    height: 35px;
    font-size: 0.8rem;
  }
`;

const TeamInfo = styled.div`
  margin-bottom: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.9rem;

  svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const TeamActions = styled.div`
  display: flex;
  gap: 0.75rem;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: ${({ theme, $variant }) =>
    $variant === 'primary' ? theme.colors.primary : 'transparent'};
  color: ${({ theme, $variant }) =>
    $variant === 'primary' ? theme.colors.text.inverse : theme.colors.primary};
  border: ${({ theme, $variant }) =>
    $variant === 'primary' ? 'none' : `2px solid ${theme.colors.primary}`};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  background: ${({ theme }) => theme.colors.surfaceElevated};
  border: 1px solid ${({ theme }) => theme.colors.divider};
  border-radius: 16px;
`;

const EmptyIcon = styled(FiUsers)`
  font-size: 3.5rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
  margin-bottom: 1rem;
`;

const EmptyText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
`;

const LoadingSpinner = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  
  &::after {
    content: '';
    width: 50px;
    height: 50px;
    border: 5px solid ${({ theme }) => theme.colors.divider};
    border-top-color: ${({ theme }) => theme.colors.primary};
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get(
        `${API_BASE_URL}/api/teams/user`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTeams(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
      setLoading(false);
    }
  };

  const handleLeaveTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to leave this team?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      await axios.delete(
        `${API_BASE_URL}/api/teams/${teamId}/leave`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh teams list
      fetchTeams();
    } catch (error) {
      console.error('Error leaving team:', error);
      alert('Failed to leave team. Please try again.');
    }
  };

  const getRandomColor = () => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <Container>
      <Header>
        <Title>My Teams</Title>
        <Subtitle>Collaborate with other developers</Subtitle>
      </Header>

      <TeamsGrid>
        {loading ? (
          <LoadingSpinner />
        ) : teams.length > 0 ? (
          teams.map((team) => (
            <TeamCard key={team._id}>
              <TeamCardHeader>
                <TeamName>{team.teamName}</TeamName>
                <TeamEvent>{team.eventId?.title || 'Event'}</TeamEvent>
              </TeamCardHeader>

              <TeamMembers>
                <MemberCount>
                  <FiUsers />
                  <span>{team.members?.length || 0} Members</span>
                </MemberCount>
                <MembersList>
                  {team.members?.slice(0, 5).map((member, index) => (
                    <Avatar key={index} $color={getRandomColor()}>
                      {member.userId?.name?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                  ))}
                  {team.members?.length > 5 && (
                    <MoreMembers>+{team.members.length - 5}</MoreMembers>
                  )}
                </MembersList>
              </TeamMembers>

              <TeamInfo>
                <InfoItem>
                  <FiCalendar />
                  <span>Created {new Date(team.createdAt).toLocaleDateString()}</span>
                </InfoItem>
              </TeamInfo>

              <TeamActions>
                <Button $variant="primary">
                  <FiUserPlus />
                  View Details
                </Button>
                <Button onClick={() => handleLeaveTeam(team._id)}>
                  <FiLogOut />
                  Leave
                </Button>
              </TeamActions>
            </TeamCard>
          ))
        ) : (
          <EmptyState>
            <EmptyIcon />
            <EmptyText>You haven't joined any teams yet</EmptyText>
            <Button $variant="primary" onClick={() => window.location.href = '/events'}>
              <FiUserPlus />
              Browse Events to Join Teams
            </Button>
          </EmptyState>
        )}
      </TeamsGrid>
    </Container>
  );
};

export default Teams;

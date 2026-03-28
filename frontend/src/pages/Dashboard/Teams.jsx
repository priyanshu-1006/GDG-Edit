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
  color: white;
  font-size: 2rem;
  margin-bottom: 0.5rem;
  font-weight: 700;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.8);
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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
`;

const TeamName = styled.h3`
  color: #333;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const TeamEvent = styled.div`
  color: #667eea;
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
  color: #666;
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
  background: rgba(102, 126, 234, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
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
  color: #666;
  font-size: 0.9rem;

  svg {
    color: #667eea;
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
  background: ${props => props.$variant === 'primary' 
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    : 'transparent'};
  color: ${props => props.$variant === 'primary' ? 'white' : '#667eea'};
  border: ${props => props.$variant === 'primary' ? 'none' : '2px solid #667eea'};
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
  background: #1c1c1c;
  border-radius: 16px;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyText = styled.p`
  color: #666;
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
    border: 5px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
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
        <Title>My Teams 👥</Title>
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
            <EmptyIcon>👥</EmptyIcon>
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

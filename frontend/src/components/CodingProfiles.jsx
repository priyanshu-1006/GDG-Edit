import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Code2, Trophy, Star, TrendingUp, RefreshCw, Edit, Plus, X } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Button = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $variant, theme }) => {
    if ($variant === 'primary') {
      return `
        background: ${theme.googleColors.blue.primary};
        color: white;
        &:hover { background: ${theme.googleColors.blue.darker}; }
      `;
    } else if ($variant === 'secondary') {
      return `
        background: ${theme.colors.background.secondary};
        color: ${theme.colors.text.primary};
        border: 1px solid ${theme.colors.border};
        &:hover { background: ${theme.colors.background.tertiary}; }
      `;
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    flex: 1;
    justify-content: center;
  }
`;

const ProfilesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProfileCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.surfaceElevated};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px;
  padding: 2rem;
  box-shadow: ${({ theme }) => theme.colors.shadows.small};
  position: relative;
  
  ${({ $platform }) => {
    if ($platform === 'leetcode') {
      return `border-top: 4px solid #FFA116;`;
    } else if ($platform === 'codechef') {
      return `border-top: 4px solid #5B4638;`;
    }
  }}
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const PlatformInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PlatformLogo = styled.img`
  width: 40px;
  height: 40px;
  object-fit: contain;
`;

const PlatformName = styled.div`
  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0;
  }
  
  p {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.text.secondary};
    margin: 0.25rem 0 0 0;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled(motion.button)`
  padding: 0.5rem;
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: ${({ theme }) => theme.colors.background.tertiary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.background.secondary};
  padding: 1rem;
  border-radius: 12px;
  
  h4 {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.secondary};
    margin: 0 0 0.5rem 0;
    font-weight: 600;
  }
  
  p {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const ProblemsBreakdown = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const ProblemStat = styled.div`
  background: ${({ theme }) => theme.colors.background.secondary};
  padding: 0.75rem;
  border-radius: 8px;
  text-align: center;
  
  h5 {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 0.5rem 0;
    font-weight: 600;
    
    ${({ $difficulty }) => {
      if ($difficulty === 'easy') return `color: #00b8a3;`;
      if ($difficulty === 'medium') return `color: #ffc01e;`;
      if ($difficulty === 'hard') return `color: #ef4743;`;
    }}
  }
  
  p {
    font-size: 1.25rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0;
  }
`;

const StarsDisplay = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const StarIcon = styled(Star)`
  ${({ $filled }) => $filled && `fill: #FFC107; color: #FFC107;`}
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  
  /* Keep paragraph centered, but header will handle icon/text layout */
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: ${({ theme }) => theme.colors.text.primary};
  }
  
  p {
    margin: 0 0 1.5rem 0;
  }
`;

const EmptyHeader = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;

  svg {
    margin: 0; /* remove bottom margin to align vertically */
    opacity: 0.5;
  }
`;

const LastUpdated = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: right;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const LoadingSpinner = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const CodingProfiles = ({ onAddProfile, onEditProfile }) => {
  const [profiles, setProfiles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState({ leetcode: false, codechef: false });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/coding-profiles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfiles(response.data.profiles);
    } catch (error) {
      console.error('Failed to fetch coding profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (platform) => {
    try {
      setRefreshing(prev => ({ ...prev, [platform]: true }));
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/coding-profiles/refresh/${platform}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the specific profile
      setProfiles(prev => ({
        ...prev,
        [platform]: response.data.profile
      }));
    } catch (error) {
      console.error(`Failed to refresh ${platform}:`, error);
      alert(error.response?.data?.message || `Failed to refresh ${platform} profile`);
    } finally {
      setRefreshing(prev => ({ ...prev, [platform]: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasAnyProfile = profiles?.leetcode?.username || profiles?.codechef?.username;

  if (loading) {
    return (
      <Container>
        <EmptyState>
          <LoadingSpinner
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw size={48} />
          </LoadingSpinner>
          <h3>Loading your coding profiles...</h3>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <Code2 size={28} />
          Competitive Programming
        </Title>
        <ButtonGroup>
          {hasAnyProfile && (
            <Button
              $variant="secondary"
              onClick={() => onEditProfile && onEditProfile()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Edit size={18} />
              Edit Profiles
            </Button>
          )}
          <Button
            $variant="primary"
            onClick={() => onAddProfile && onAddProfile()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={18} />
            Add Platform
          </Button>
        </ButtonGroup>
      </Header>

      {!hasAnyProfile ? (
        <EmptyState>
          <EmptyHeader>
            <Trophy size={64} />
            <h3>No Coding Profiles Yet</h3>
          </EmptyHeader>
          <p>Add your LeetCode or CodeChef username to showcase your competitive programming skills!</p>
        </EmptyState>
      ) : (
        <ProfilesGrid>
          {/* LeetCode Profile */}
          {profiles?.leetcode?.username && (
            <ProfileCard
              $platform="leetcode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardHeader>
                <PlatformInfo>
                  <PlatformLogo 
                    src="https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png" 
                    alt="LeetCode"
                  />
                  <PlatformName>
                    <h3>LeetCode</h3>
                    <p>@{profiles.leetcode.username}</p>
                  </PlatformName>
                </PlatformInfo>
                <ActionButtons>
                  <IconButton
                    onClick={() => handleRefresh('leetcode')}
                    disabled={refreshing.leetcode}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <LoadingSpinner
                      animate={refreshing.leetcode ? { rotate: 360 } : {}}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw size={18} />
                    </LoadingSpinner>
                  </IconButton>
                </ActionButtons>
              </CardHeader>

              <StatsGrid>
                <StatCard>
                  <h4>Global Rank</h4>
                  <p>
                    <Trophy size={20} />
                    #{profiles.leetcode.rank?.toLocaleString() || 'N/A'}
                  </p>
                </StatCard>
                <StatCard>
                  <h4>Rating</h4>
                  <p>
                    <TrendingUp size={20} />
                    {profiles.leetcode.rating || 'N/A'}
                  </p>
                </StatCard>
              </StatsGrid>

              <ProblemsBreakdown>
                <ProblemStat $difficulty="easy">
                  <h5>Easy</h5>
                  <p>{profiles.leetcode.problemsSolved?.easy || 0}</p>
                </ProblemStat>
                <ProblemStat $difficulty="medium">
                  <h5>Medium</h5>
                  <p>{profiles.leetcode.problemsSolved?.medium || 0}</p>
                </ProblemStat>
                <ProblemStat $difficulty="hard">
                  <h5>Hard</h5>
                  <p>{profiles.leetcode.problemsSolved?.hard || 0}</p>
                </ProblemStat>
              </ProblemsBreakdown>

              <StatCard>
                <h4>Total Solved</h4>
                <p>{profiles.leetcode.problemsSolved?.total || 0} problems</p>
              </StatCard>

              <LastUpdated>
                Last updated: {formatDate(profiles.leetcode.lastUpdated)}
              </LastUpdated>
            </ProfileCard>
          )}

          {/* CodeChef Profile */}
          {profiles?.codechef?.username && (
            <ProfileCard
              $platform="codechef"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <CardHeader>
                <PlatformInfo>
                  <PlatformLogo 
                    src="https://cdn.codechef.com/images/cc-logo.svg" 
                    alt="CodeChef"
                  />
                  <PlatformName>
                    <h3>CodeChef</h3>
                    <p>@{profiles.codechef.username}</p>
                  </PlatformName>
                </PlatformInfo>
                <ActionButtons>
                  <IconButton
                    onClick={() => handleRefresh('codechef')}
                    disabled={refreshing.codechef}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <LoadingSpinner
                      animate={refreshing.codechef ? { rotate: 360 } : {}}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw size={18} />
                    </LoadingSpinner>
                  </IconButton>
                </ActionButtons>
              </CardHeader>

              <StatsGrid>
                <StatCard>
                  <h4>Current Rating</h4>
                  <p>
                    <TrendingUp size={20} />
                    {profiles.codechef.rating || 'Unrated'}
                  </p>
                </StatCard>
                <StatCard>
                  <h4>Highest Rating</h4>
                  <p>
                    <Trophy size={20} />
                    {profiles.codechef.highestRating || 'N/A'}
                  </p>
                </StatCard>
              </StatsGrid>

              <StatCard style={{ marginBottom: '1rem' }}>
                <h4>Stars</h4>
                <p>
                  <StarsDisplay>
                    {[...Array(7)].map((_, i) => (
                      <StarIcon key={i} $filled={i < (profiles.codechef.stars || 0)} size={20} />
                    ))}
                  </StarsDisplay>
                </p>
              </StatCard>

              <StatsGrid>
                {profiles.codechef.globalRank && (
                  <StatCard>
                    <h4>Global Rank</h4>
                    <p>#{profiles.codechef.globalRank.toLocaleString()}</p>
                  </StatCard>
                )}
                {profiles.codechef.countryRank && (
                  <StatCard>
                    <h4>Country Rank</h4>
                    <p>#{profiles.codechef.countryRank.toLocaleString()}</p>
                  </StatCard>
                )}
              </StatsGrid>

              <LastUpdated>
                Last updated: {formatDate(profiles.codechef.lastUpdated)}
              </LastUpdated>
            </ProfileCard>
          )}
        </ProfilesGrid>
      )}
    </Container>
  );
};

export default CodingProfiles;

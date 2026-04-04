import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { FiBook, FiCheckCircle, FiClock, FiTrendingUp, FiPlay } from 'react-icons/fi';
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

const ProgressCard = styled.div`
  background: ${({ theme }) => theme.colors.surfaceElevated};
  border: 1px solid ${({ theme }) => theme.colors.divider};
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: ${({ theme }) => theme.colors.shadows.medium};

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const ProgressHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;

  h3 {
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 1.5rem;
    font-weight: 700;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;

    h3 {
      font-size: 1.25rem;
    }
  }
`;

const ProgressValue = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 16px;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    height: 12px;
  }
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 8px;
  transition: width 0.5s ease;
`;

const ProgressStats = styled.div`
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1rem;

  svg {
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1.25rem;
  }

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const ModulesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const ModuleCard = styled.div`
  background: ${({ theme }) => theme.colors.surfaceElevated};
  border: 1px solid ${({ theme }) => theme.colors.divider};
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: ${({ theme }) => theme.colors.shadows.medium};
  transition: transform 0.3s ease;
  opacity: ${props => props.$completed ? 0.8 : 1};

  &:hover {
    transform: translateY(-5px);
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

const ModuleIcon = styled.div`
  font-size: 2.25rem;
  color: ${({ theme, $completed }) =>
    $completed ? theme.colors.success : theme.colors.primary};
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const ModuleTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.75rem;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const ModuleDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const ModuleFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.divider};

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ModuleDuration = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.9rem;

  svg {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${({ theme, $variant }) =>
    $variant === 'primary' ? theme.colors.primary : theme.colors.background.tertiary};
  color: ${({ theme, $variant }) =>
    $variant === 'primary' ? theme.colors.text.inverse : theme.colors.primary};
  border: none;
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

  @media (max-width: 480px) {
    width: 100%;
    padding: 0.65rem 1rem;
    font-size: 0.9rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background: ${({ theme }) => theme.colors.surfaceElevated};
  border: 1px solid ${({ theme }) => theme.colors.divider};
  border-radius: 16px;
`;

const EmptyIcon = styled(FiBook)`
  font-size: 3.5rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
  margin-bottom: 1rem;
`;

const EmptyText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1.1rem;
`;

const LoadingSpinner = styled.div`
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

const StudyJams = () => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudyJamsData();
  }, []);

  const fetchStudyJamsData = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get(
        `${API_BASE_URL}/api/studyjams/progress`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProgress(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Study Jams data:', error);
      // Set default empty state
      setProgress({
        completionPercentage: 0,
        completedModules: 0,
        totalModules: 0,
        modules: []
      });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>Study Jams</Title>
          <Subtitle>Track your learning progress</Subtitle>
        </Header>
        <LoadingSpinner />
      </Container>
    );
  }

  const modules = progress?.modules || [];
  const completionPercentage = progress?.completionPercentage || 0;
  const completedModules = progress?.completedModules || 0;
  const totalModules = progress?.totalModules || modules.length;

  return (
    <Container>
      <Header>
        <Title>Study Jams</Title>
        <Subtitle>Track your learning progress</Subtitle>
      </Header>

      {totalModules > 0 ? (
        <>
          <ProgressCard>
            <ProgressHeader>
              <h3>Overall Progress</h3>
              <ProgressValue>{completionPercentage}%</ProgressValue>
            </ProgressHeader>
            <ProgressBar>
              <ProgressFill style={{ width: `${completionPercentage}%` }} />
            </ProgressBar>
            <ProgressStats>
              <StatItem>
                <FiCheckCircle />
                <span>{completedModules} Completed</span>
              </StatItem>
              <StatItem>
                <FiBook />
                <span>{totalModules} Total Modules</span>
              </StatItem>
              <StatItem>
                <FiTrendingUp />
                <span>{completionPercentage}% Complete</span>
              </StatItem>
            </ProgressStats>
          </ProgressCard>

          <ModulesGrid>
            {modules.map((module, index) => (
              <ModuleCard key={index} $completed={module.completed}>
                <ModuleIcon $completed={module.completed}>
                  {module.completed ? <FiCheckCircle /> : <FiBook />}
                </ModuleIcon>
                <ModuleTitle>{module.title || `Module ${index + 1}`}</ModuleTitle>
                <ModuleDescription>
                  {module.description || 'Complete this module to enhance your skills'}
                </ModuleDescription>
                <ModuleFooter>
                  <ModuleDuration>
                    <FiClock />
                    {module.duration || '2 hours'}
                  </ModuleDuration>
                  <Button $variant={module.completed ? 'default' : 'primary'}>
                    {module.completed ? (
                      <>
                        <FiCheckCircle />
                        Review
                      </>
                    ) : (
                      <>
                        <FiPlay />
                        Start
                      </>
                    )}
                  </Button>
                </ModuleFooter>
              </ModuleCard>
            ))}
          </ModulesGrid>
        </>
      ) : (
        <EmptyState>
          <EmptyIcon />
          <EmptyText>No Study Jams modules available at the moment</EmptyText>
        </EmptyState>
      )}
    </Container>
  );
};

export default StudyJams;

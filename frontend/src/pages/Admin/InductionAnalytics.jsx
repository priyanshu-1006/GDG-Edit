import { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { useAuth } from "../../contexts/useAuth";
import { API_BASE_URL } from "../../config/api";
import { 
  BarChart3, 
  Users, 
  ClipboardCheck, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  AlertCircle,
  Award
} from "lucide-react";

const API = `${API_BASE_URL}/api`;

export default function InductionAnalytics() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/induction/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data?.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Container><LoadingCard>Loading analytics...</LoadingCard></Container>;
  }

  if (!analytics) {
    return <Container><LoadingCard>No analytics data available</LoadingCard></Container>;
  }

  const { panels, systemStats, piControl } = analytics;

  return (
    <Container>
      <Header>
        <div>
          <h1>📊 Induction Analytics</h1>
          <StatusBadge $started={piControl.isPiStarted}>
            {piControl.isPiStarted ? '✅ PI Round Active' : '⏸️ PI Not Started'}
            {piControl.isPiStarted && ` - ${piControl.piRound?.replace('_', ' ').toUpperCase()}`}
          </StatusBadge>
        </div>
      </Header>

      {isSuperAdmin && systemStats && (
        <>
          <SectionTitle>🎯 System Overview</SectionTitle>
          <StatsGrid>
            <StatCard>
              <StatIcon><Users size={24} color="#3b82f6" /></StatIcon>
              <StatContent>
                <StatValue>{systemStats.totalPanels}</StatValue>
                <StatLabel>Total Panels</StatLabel>
              </StatContent>
            </StatCard>

            <StatCard>
              <StatIcon><ClipboardCheck size={24} color="#8b5cf6" /></StatIcon>
              <StatContent>
                <StatValue>{systemStats.totalStudents}</StatValue>
                <StatLabel>Students in Panels</StatLabel>
              </StatContent>
            </StatCard>

            <StatCard>
              <StatIcon><CheckCircle2 size={24} color="#10b981" /></StatIcon>
              <StatContent>
                <StatValue>{systemStats.studentsEvaluated}</StatValue>
                <StatLabel>Students Evaluated</StatLabel>
                <ProgressBar>
                  <ProgressFill $width={systemStats.evaluationProgress} $color="#10b981" />
                </ProgressBar>
                <ProgressText>{systemStats.evaluationProgress}% Complete</ProgressText>
              </StatContent>
            </StatCard>

            <StatCard>
              <StatIcon><Award size={24} color="#f59e0b" /></StatIcon>
              <StatContent>
                <StatValue>{systemStats.studentsFinalized}</StatValue>
                <StatLabel>Students Finalized</StatLabel>
                <ProgressBar>
                  <ProgressFill $width={systemStats.finalizationProgress} $color="#f59e0b" />
                </ProgressBar>
                <ProgressText>{systemStats.finalizationProgress}% Complete</ProgressText>
              </StatContent>
            </StatCard>

            <StatCard>
              <StatIcon><BarChart3 size={24} color="#06b6d4" /></StatIcon>
              <StatContent>
                <StatValue>{systemStats.totalEvaluations}</StatValue>
                <StatLabel>Total Evaluations</StatLabel>
              </StatContent>
            </StatCard>

            <StatCard>
              <StatIcon><Clock size={24} color="#ef4444" /></StatIcon>
              <StatContent>
                <StatValue>{systemStats.studentsPending}</StatValue>
                <StatLabel>Pending Evaluations</StatLabel>
              </StatContent>
            </StatCard>
          </StatsGrid>

          <SectionTitle>📈 Recommendations Breakdown</SectionTitle>
          <RecommendationsGrid>
            <RecommendationCard $color="#10b981">
              <RecommendationValue>{systemStats.aggregatedRecommendations.selected}</RecommendationValue>
              <RecommendationLabel>✅ Recommended Selected</RecommendationLabel>
            </RecommendationCard>
            <RecommendationCard $color="#3b82f6">
              <RecommendationValue>{systemStats.aggregatedRecommendations.shortlisted_offline}</RecommendationValue>
              <RecommendationLabel>📋 Shortlisted Offline</RecommendationLabel>
            </RecommendationCard>
            <RecommendationCard $color="#f59e0b">
              <RecommendationValue>{systemStats.aggregatedRecommendations.hold}</RecommendationValue>
              <RecommendationLabel>⏸️ Hold</RecommendationLabel>
            </RecommendationCard>
            <RecommendationCard $color="#ef4444">
              <RecommendationValue>{systemStats.aggregatedRecommendations.rejected}</RecommendationValue>
              <RecommendationLabel>❌ Recommended Rejected</RecommendationLabel>
            </RecommendationCard>
          </RecommendationsGrid>

          <SectionTitle>📊 Induction Applications</SectionTitle>
          <ApplicationsGrid>
            {Object.entries(systemStats.inductionApplications || {}).map(([status, count]) => (
              <ApplicationCard key={status}>
                <span className="status">{status.replace('_', ' ').toUpperCase()}</span>
                <span className="count">{count}</span>
              </ApplicationCard>
            ))}
          </ApplicationsGrid>
        </>
      )}

      <SectionTitle>{isSuperAdmin ? '📋 Panel Details' : '📋 Your Panels'}</SectionTitle>
      
      {panels.length === 0 ? (
        <EmptyState>
          <AlertCircle size={48} color="#94a3b8" />
          <p>No panels found</p>
        </EmptyState>
      ) : (
        <PanelsGrid>
          {panels.map((panel) => (
            <PanelCard key={panel.panelId}>
              <PanelHeader>
                <h3>{panel.panelName}</h3>
                {panel.piStarted && <PiBadge>🟢 PI Started</PiBadge>}
              </PanelHeader>
              
              {panel.description && <PanelDescription>{panel.description}</PanelDescription>}

              <PanelMembers>
                <strong>Panel Members:</strong> {panel.members.map(m => m.name).join(', ') || 'None'}
              </PanelMembers>

              <MetricsRow>
                <Metric>
                  <MetricIcon><Users size={18} color="#3b82f6" /></MetricIcon>
                  <div>
                    <MetricValue>{panel.totalStudents}</MetricValue>
                    <MetricLabel>Students</MetricLabel>
                  </div>
                </Metric>

                <Metric>
                  <MetricIcon><CheckCircle2 size={18} color="#10b981" /></MetricIcon>
                  <div>
                    <MetricValue>{panel.studentsEvaluated}</MetricValue>
                    <MetricLabel>Evaluated</MetricLabel>
                  </div>
                </Metric>

                <Metric>
                  <MetricIcon><Clock size={18} color="#f59e0b" /></MetricIcon>
                  <div>
                    <MetricValue>{panel.studentsPending}</MetricValue>
                    <MetricLabel>Pending</MetricLabel>
                  </div>
                </Metric>

                <Metric>
                  <MetricIcon><Award size={18} color="#8b5cf6" /></MetricIcon>
                  <div>
                    <MetricValue>{panel.finalizedStudents}</MetricValue>
                    <MetricLabel>Finalized</MetricLabel>
                  </div>
                </Metric>
              </MetricsRow>

              <ProgressSection>
                <ProgressLabel>
                  <span>Evaluation Progress</span>
                  <span>{panel.evaluationProgress}%</span>
                </ProgressLabel>
                <ProgressBar>
                  <ProgressFill $width={panel.evaluationProgress} $color="#10b981" />
                </ProgressBar>

                <ProgressLabel style={{ marginTop: '10px' }}>
                  <span>Finalization Progress</span>
                  <span>{panel.finalizationProgress}%</span>
                </ProgressLabel>
                <ProgressBar>
                  <ProgressFill $width={panel.finalizationProgress} $color="#8b5cf6" />
                </ProgressBar>
              </ProgressSection>

              {panel.averageRatings.overall > 0 && (
                <RatingsSection>
                  <h4>Average Ratings</h4>
                  <RatingsList>
                    <RatingItem>
                      <span>Overall:</span>
                      <RatingBadge $color="#3b82f6">{panel.averageRatings.overall}/10</RatingBadge>
                    </RatingItem>
                    <RatingItem>
                      <span>Technical:</span>
                      <RatingBadge $color="#10b981">{panel.averageRatings.technical}/10</RatingBadge>
                    </RatingItem>
                    <RatingItem>
                      <span>Soft Skills:</span>
                      <RatingBadge $color="#f59e0b">{panel.averageRatings.soft}/10</RatingBadge>
                    </RatingItem>
                  </RatingsList>
                </RatingsSection>
              )}

              <RecommendationsSection>
                <h4>Recommendations</h4>
                <RecommendationsList>
                  <RecommendationItem $color="#10b981">
                    <span>Selected:</span>
                    <span>{panel.recommendations.selected}</span>
                  </RecommendationItem>
                  <RecommendationItem $color="#3b82f6">
                    <span>Shortlist Offline:</span>
                    <span>{panel.recommendations.shortlisted_offline}</span>
                  </RecommendationItem>
                  <RecommendationItem $color="#f59e0b">
                    <span>Hold:</span>
                    <span>{panel.recommendations.hold}</span>
                  </RecommendationItem>
                  <RecommendationItem $color="#ef4444">
                    <span>Rejected:</span>
                    <span>{panel.recommendations.rejected}</span>
                  </RecommendationItem>
                </RecommendationsList>
              </RecommendationsSection>
            </PanelCard>
          ))}
        </PanelsGrid>
      )}
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 30px;
  
  h1 {
    margin: 0 0 10px 0;
    color: #1e293b;
    font-size: 28px;
  }

  .dark & h1 {
    color: #e2e8f0;
  }
`;

const StatusBadge = styled.div`
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  background: ${props => props.$started ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.$started ? '#166534' : '#991b1b'};

  .dark & {
    background: ${props => props.$started ? '#14532d' : '#7f1d1d'};
    color: ${props => props.$started ? '#bbf7d0' : '#fecaca'};
  }
`;

const LoadingCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  color: #64748b;

  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #94a3b8;
  }
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin: 30px 0 15px 0;
  color: #1e293b;

  .dark & {
    color: #e2e8f0;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 15px;

  .dark & {
    background: #1e293b;
    border-color: #334155;
  }
`;

const StatIcon = styled.div`
  padding: 10px;
  background: #f1f5f9;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  .dark & {
    background: #334155;
  }
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;

  .dark & {
    color: #e2e8f0;
  }
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;

  .dark & {
    color: #94a3b8;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  margin-top: 8px;
  overflow: hidden;

  .dark & {
    background: #334155;
  }
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${props => props.$width || 0}%;
  background: ${props => props.$color || '#3b82f6'};
  border-radius: 3px;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;

  .dark & {
    color: #94a3b8;
  }
`;

const RecommendationsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
`;

const RecommendationCard = styled.div`
  background: white;
  border: 2px solid ${props => props.$color};
  border-radius: 12px;
  padding: 20px;
  text-align: center;

  .dark & {
    background: #1e293b;
  }
`;

const RecommendationValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;

  .dark & {
    color: #e2e8f0;
  }
`;

const RecommendationLabel = styled.div`
  font-size: 13px;
  color: #64748b;
  margin-top: 8px;

  .dark & {
    color: #94a3b8;
  }
`;

const ApplicationsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 30px;
`;

const ApplicationCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .status {
    font-size: 11px;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
  }

  .count {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
  }

  .dark & {
    background: #1e293b;
    border-color: #334155;

    .count {
      color: #e2e8f0;
    }

    .status {
      color: #94a3b8;
    }
  }
`;

const EmptyState = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 60px;
  text-align: center;
  color: #64748b;

  p {
    margin-top: 16px;
    font-size: 16px;
  }

  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #94a3b8;
  }
`;

const PanelsGrid = styled.div`
  display: grid;
  gap: 20px;
`;

const PanelCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 24px;

  .dark & {
    background: #1e293b;
    border-color: #334155;
  }
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  h3 {
    margin: 0;
    font-size: 20px;
    color: #1e293b;
  }

  .dark & h3 {
    color: #e2e8f0;
  }
`;

const PiBadge = styled.span`
  padding: 6px 12px;
  background: #dcfce7;
  color: #166534;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;

  .dark & {
    background: #14532d;
    color: #bbf7d0;
  }
`;

const PanelDescription = styled.p`
  margin: 0 0 12px 0;
  color: #64748b;
  font-size: 14px;

  .dark & {
    color: #94a3b8;
  }
`;

const PanelMembers = styled.div`
  font-size: 13px;
  color: #64748b;
  margin-bottom: 20px;

  strong {
    color: #1e293b;
  }

  .dark & {
    color: #94a3b8;

    strong {
      color: #e2e8f0;
    }
  }
`;

const MetricsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`;

const Metric = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;

  .dark & {
    background: #0f172a;
  }
`;

const MetricIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MetricValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;

  .dark & {
    color: #e2e8f0;
  }
`;

const MetricLabel = styled.div`
  font-size: 11px;
  color: #64748b;

  .dark & {
    color: #94a3b8;
  }
`;

const ProgressSection = styled.div`
  margin: 20px 0;
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 6px;

  .dark & {
    color: #94a3b8;
  }
`;

const RatingsSection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;

  h4 {
    margin: 0 0 12px 0;
    font-size: 15px;
    color: #1e293b;
  }

  .dark & {
    border-top-color: #334155;

    h4 {
      color: #e2e8f0;
    }
  }
`;

const RatingsList = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const RatingItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;

  .dark & {
    color: #94a3b8;
  }
`;

const RatingBadge = styled.span`
  padding: 4px 12px;
  background: ${props => props.$color};
  color: white;
  border-radius: 12px;
  font-weight: 600;
  font-size: 13px;
`;

const RecommendationsSection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;

  h4 {
    margin: 0 0 12px 0;
    font-size: 15px;
    color: #1e293b;
  }

  .dark & {
    border-top-color: #334155;

    h4 {
      color: #e2e8f0;
    }
  }
`;

const RecommendationsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
`;

const RecommendationItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f8fafc;
  border-left: 3px solid ${props => props.$color};
  border-radius: 6px;
  font-size: 13px;
  color: #64748b;

  span:last-child {
    font-weight: 700;
    color: #1e293b;
  }

  .dark & {
    background: #0f172a;
    color: #94a3b8;

    span:last-child {
      color: #e2e8f0;
    }
  }
`;

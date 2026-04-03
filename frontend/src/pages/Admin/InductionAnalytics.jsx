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
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'students'
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (activeTab === 'students' && isSuperAdmin && students.length === 0) {
      fetchStudents();
    }
  }, [activeTab, isSuperAdmin]);

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

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/induction/evaluated-students`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data?.success) {
        setStudents(data.data.students || []);
      }
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoadingStudents(false);
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

      {/* Tabs for Super Admin */}
      {isSuperAdmin && (
        <TabsContainer>
          <Tab $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            <BarChart3 size={18} /> Overview & Stats
          </Tab>
          <Tab $active={activeTab === 'students'} onClick={() => setActiveTab('students')}>
            <Users size={18} /> All Students & Evaluations
          </Tab>
        </TabsContainer>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
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
        </>
      )}

      {/* Students Tab - Super Admin Only */}
      {activeTab === 'students' && isSuperAdmin && (
        <>
          <SectionTitle>👥 All Students with Evaluations</SectionTitle>
          {loadingStudents ? (
            <LoadingCard>Loading students...</LoadingCard>
          ) : students.length === 0 ? (
            <LoadingCard>No evaluated students found</LoadingCard>
          ) : (
            <>
              <StudentsHeader>
                <span>{students.length} Students Evaluated</span>
                <span>Sorted by Average Score</span>
              </StudentsHeader>
              <StudentsTable>
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Branch</th>
                    <th>Status</th>
                    <th>Evaluations</th>
                    <th>Avg Overall</th>
                    <th>Avg Tech</th>
                    <th>Avg Soft</th>
                    <th>Top Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    // Find most common recommendation
                    const topRec = Object.entries(student.recommendations).sort((a, b) => b[1] - a[1])[0];
                    const topRecommendation = topRec ? topRec[0] : 'none';
                    
                    return (
                      <tr key={student._id}>
                        <td><strong>{student.rollNumber}</strong></td>
                        <td>
                          <StudentName>
                            {student.firstName} {student.lastName}
                            <StudentEmail>{student.email}</StudentEmail>
                          </StudentName>
                        </td>
                        <td>{student.branch} - {student.section}</td>
                        <td>
                          <StatusBadgeSmall $status={student.status}>
                            {student.status?.replace('_', ' ')}
                          </StatusBadgeSmall>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <EvalCount>{student.evaluationCount}</EvalCount>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <ScoreBadge $score={student.averageScores.overall}>
                            {student.averageScores.overall}/10
                          </ScoreBadge>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {student.averageScores.technical}/10
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {student.averageScores.soft}/10
                        </td>
                        <td>
                          <RecommendationBadgeSmall $recommendation={topRecommendation}>
                            {topRecommendation}
                          </RecommendationBadgeSmall>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </StudentsTable>
            </>
          )}
        </>
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

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e2e8f0;

  .dark & {
    border-bottom-color: #334155;
  }
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: ${props => props.$active ? '#3b82f6' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  border: none;
  border-bottom: 3px solid ${props => props.$active ? '#3b82f6' : 'transparent'};
  cursor: pointer;
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$active ? '#3b82f6' : '#f1f5f9'};
    color: ${props => props.$active ? 'white' : '#1e293b'};
  }

  .dark & {
    background: ${props => props.$active ? '#3b82f6' : 'transparent'};
    color: ${props => props.$active ? 'white' : '#94a3b8'};

    &:hover {
      background: ${props => props.$active ? '#3b82f6' : '#1e293b'};
      color: ${props => props.$active ? 'white' : '#e2e8f0'};
    }
  }
`;

const StudentsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px 12px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;

  span:last-child {
    font-size: 13px;
    font-weight: 400;
    color: #64748b;
  }

  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #e2e8f0;

    span:last-child {
      color: #94a3b8;
    }
  }
`;

const StudentsTable = styled.table`
  width: 100%;
  background: white;
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 12px 12px;
  border-collapse: collapse;
  overflow: hidden;

  thead {
    background: #f8fafc;
    
    th {
      padding: 12px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e2e8f0;
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid #e2e8f0;
      transition: background 0.15s;

      &:hover {
        background: #f8fafc;
      }

      &:last-child {
        border-bottom: none;
      }
    }

    td {
      padding: 14px 16px;
      font-size: 13px;
      color: #334155;
    }
  }

  .dark & {
    background: #1e293b;
    border-color: #334155;

    thead {
      background: #0f172a;

      th {
        color: #94a3b8;
        border-bottom-color: #334155;
      }
    }

    tbody {
      tr {
        border-bottom-color: #334155;

        &:hover {
          background: #0f172a;
        }
      }

      td {
        color: #cbd5e1;
      }
    }
  }
`;

const StudentName = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StudentEmail = styled.span`
  font-size: 11px;
  color: #94a3b8;
  font-weight: 400;
`;

const StatusBadgeSmall = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
  background: ${props => {
    if (props.$status === 'selected') return '#d1fae5';
    if (props.$status?.includes('shortlisted')) return '#dbeafe';
    if (props.$status === 'rejected') return '#fee2e2';
    return '#f3f4f6';
  }};
  color: ${props => {
    if (props.$status === 'selected') return '#065f46';
    if (props.$status?.includes('shortlisted')) return '#1e40af';
    if (props.$status === 'rejected') return '#991b1b';
    return '#374151';
  }};
`;

const EvalCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #dbeafe;
  color: #1e40af;
  font-weight: 700;
  font-size: 13px;
`;

const ScoreBadge = styled.span`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  background: ${props => {
    const score = props.$score;
    if (score >= 8) return '#d1fae5';
    if (score >= 6) return '#dbeafe';
    if (score >= 4) return '#fef3c7';
    return '#fee2e2';
  }};
  color: ${props => {
    const score = props.$score;
    if (score >= 8) return '#065f46';
    if (score >= 6) return '#1e40af';
    if (score >= 4) return '#92400e';
    return '#991b1b';
  }};
`;

const RecommendationBadgeSmall = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
  background: ${props => {
    if (props.$recommendation === 'selected') return '#d1fae5';
    if (props.$recommendation === 'shortlisted_offline') return '#dbeafe';
    if (props.$recommendation === 'rejected') return '#fee2e2';
    return '#f3f4f6';
  }};
  color: ${props => {
    if (props.$recommendation === 'selected') return '#065f46';
    if (props.$recommendation === 'shortlisted_offline') return '#1e40af';
    if (props.$recommendation === 'rejected') return '#991b1b';
    return '#374151';
  }};
`;

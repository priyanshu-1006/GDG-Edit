import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowLeft, Users, Monitor, MapPin, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #0a0a0a 100%);
  position: relative;
  overflow: hidden;
  color: white;
  padding-bottom: 4rem;
`;

const BackgroundOrbs = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  
  &::before {
    content: '';
    position: absolute;
    top: 10%;
    left: -5%;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(66, 133, 244, 0.12) 0%, transparent 70%);
    animation: ${float} 8s ease-in-out infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 10%;
    right: -5%;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(52, 168, 83, 0.1) 0%, transparent 70%);
    animation: ${float} 10s ease-in-out infinite reverse;
  }
`;

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  position: relative;
  z-index: 1;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255,255,255,0.5);
  font-size: 0.9rem;
  text-decoration: none;
  margin-bottom: 2rem;
  transition: color 0.2s;
  
  &:hover { color: #4285f4; }
`;

const Header = styled(motion.div)`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.8rem;
  font-weight: 800;
  background: linear-gradient(135deg, #4285f4, #34a853, #fbbc04, #ea4335);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
  
  @media (max-width: 480px) { font-size: 2rem; }
`;

const Subtitle = styled.p`
  color: rgba(255,255,255,0.6);
  font-size: 1.1rem;
  line-height: 1.6;
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: ${props => props.$active ? 'rgba(66, 133, 244, 0.15)' : 'rgba(255,255,255,0.03)'};
  border: 1px solid ${props => props.$active ? '#4285f4' : 'rgba(255,255,255,0.08)'};
  color: ${props => props.$active ? '#4285f4' : 'rgba(255,255,255,0.6)'};
  border-radius: 30px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    background: ${props => props.$active ? 'rgba(66, 133, 244, 0.2)' : 'rgba(255,255,255,0.08)'};
    color: ${props => props.$active ? '#8ab4f8' : '#fff'};
    transform: translateY(-2px);
  }

  svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 400px) {
    padding: 10px 16px;
    font-size: 0.85rem;
  }
`;

const ResultsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
`;

const CandidateCard = styled(motion.div)`
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  backdrop-filter: blur(10px);
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.1);
    transform: translateY(-2px);
  }
`;

const AvatarCircle = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(66, 133, 244, 0.2), rgba(52, 168, 83, 0.2));
  color: #8ab4f8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 700;
  border: 1px solid rgba(66, 133, 244, 0.3);
`;

const CandidateInfo = styled.div`
  h3 {
    margin: 0 0 4px 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
  }
  p {
    margin: 0;
    font-size: 0.85rem;
    color: #9aa0a6;
    font-family: monospace;
    letter-spacing: 1px;
  }
`;

const EmptyState = styled(motion.div)`
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(255,255,255,0.02);
  border: 1px dashed rgba(255,255,255,0.1);
  border-radius: 20px;

  svg {
    color: #5f6368;
    margin-bottom: 1rem;
  }
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: #e8eaed;
    font-size: 1.2rem;
  }
  
  p {
    margin: 0;
    color: #9aa0a6;
  }
`;

const LoadingDots = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 4rem 0;
  
  span {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    animation: ${pulse} 1.4s ease-in-out infinite;
    
    &:nth-child(1) { background: #4285f4; animation-delay: 0s; }
    &:nth-child(2) { background: #ea4335; animation-delay: 0.2s; }
    &:nth-child(3) { background: #fbbc04; animation-delay: 0.4s; }
    &:nth-child(4) { background: #34a853; animation-delay: 0.6s; }
  }
`;

const InductionResults = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('online');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/induction/results`);
        const data = await response.json();
        if (data.success) {
          setCandidates(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch results:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const getFilteredCandidates = () => {
    switch(activeTab) {
      case 'online':
        return candidates.filter(c => c.status === 'shortlisted_online');
      case 'offline':
        return candidates.filter(c => c.status === 'shortlisted_offline');
      case 'selected':
        return candidates.filter(c => c.status === 'selected');
      default:
        return [];
    }
  };

  const getTabContent = () => {
    if (activeTab === 'online') return { icon: <Monitor />, text: "Online PI Shortlist" };
    if (activeTab === 'offline') return { icon: <MapPin />, text: "Offline PI Shortlist" };
    return { icon: <Trophy />, text: "Selected Core Team" };
  };

  const filtered = getFilteredCandidates();
  const currentTabInfo = getTabContent();

  if (loading) {
    return (
      <PageWrapper>
        <BackgroundOrbs />
        <Container>
          <Header initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Title>GDG Induction Results</Title>
            <Subtitle>Fetching the latest shortlists...</Subtitle>
          </Header>
          <LoadingDots><span /><span /><span /><span /></LoadingDots>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <BackgroundOrbs />
      <Container>
        <BackLink to="/">
          <ArrowLeft size={18} /> Back to Home
        </BackLink>
        
        <Header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Title>Selection Results</Title>
          <Subtitle>Congratulations to everyone who made it to the next rounds!</Subtitle>
        </Header>

        <TabsContainer>
          <Tab 
            $active={activeTab === 'online'} 
            onClick={() => setActiveTab('online')}
          >
            <Monitor /> Online PI
          </Tab>
          <Tab 
            $active={activeTab === 'offline'} 
            onClick={() => setActiveTab('offline')}
          >
            <MapPin /> Offline PI
          </Tab>
          <Tab 
            $active={activeTab === 'selected'} 
            onClick={() => setActiveTab('selected')}
          >
            <Trophy /> Final Selection
          </Tab>
        </TabsContainer>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <h2 style={{ 
              fontSize: '1.2rem', 
              color: '#e8eaed', 
              marginBottom: '1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px' 
            }}>
              {currentTabInfo.icon} {currentTabInfo.text}
              <span style={{ 
                background: 'rgba(66, 133, 244, 0.2)', 
                color: '#8ab4f8', 
                padding: '4px 10px', 
                borderRadius: '20px', 
                fontSize: '0.85rem' 
              }}>
                {filtered.length} candidate{filtered.length !== 1 ? 's' : ''}
              </span>
            </h2>

            {filtered.length > 0 ? (
              <ResultsGrid>
                {filtered.map((c, i) => (
                  <CandidateCard 
                    key={c.rollNumber + i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <AvatarCircle>
                      {c.firstName.charAt(0)}{c.lastName ? c.lastName.charAt(0) : ''}
                    </AvatarCircle>
                    <CandidateInfo>
                      <h3>{c.firstName} {c.lastName}</h3>
                      <p>{c.rollNumber}</p>
                    </CandidateInfo>
                    {activeTab === 'selected' && (
                      <CheckCircle style={{ marginLeft: 'auto', color: '#34a853', opacity: 0.8 }} size={24} />
                    )}
                  </CandidateCard>
                ))}
              </ResultsGrid>
            ) : (
              <EmptyState>
                <Users size={48} />
                <h3>No candidates found</h3>
                <p>Results for this round have not been announced yet.</p>
              </EmptyState>
            )}
          </motion.div>
        </AnimatePresence>

      </Container>
    </PageWrapper>
  );
};

export default InductionResults;

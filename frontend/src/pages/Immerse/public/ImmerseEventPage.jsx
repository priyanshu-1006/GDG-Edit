import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  ArrowLeft,
  Users,
  Target,
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
  Loader2,
  Trophy,
  Zap,
  Star,
  Clock,
  Mail,
  Phone,
  School,
  User,
  Code,
  FileText,
  Send
} from 'lucide-react';
import { immerseEvents } from '../../../utils/immerseApi';

// Animations
const twinkle = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
  50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.6); }
`;



// Styled Components
const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #0d1b2a 0%, #1b263b 25%, #0a1628 50%, #050a12 75%, #000000 100%);
  position: relative;
  overflow-x: hidden;
`;

const StarField = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
`;

const StarLayer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  
  &::before {
    content: '';
    position: absolute;
    width: ${props => props.size || '2px'};
    height: ${props => props.size || '2px'};
    background: white;
    border-radius: 50%;
    box-shadow: ${props => props.stars};
    animation: ${twinkle} ${props => props.duration || '3s'} ease-in-out infinite;
  }
`;

const Navbar = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 1rem 2rem;
  background: rgba(10, 10, 26, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const NavContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.95rem;
  transition: color 0.3s;
  
  &:hover {
    color: white;
  }
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  
  svg {
    color: #6366f1;
  }
`;

const LogoText = styled.span`
  font-size: 1.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const MainContent = styled.main`
  padding: 6rem 2rem 4rem;
  position: relative;
  z-index: 1;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;

const EventIcon = styled(motion.div)`
  width: 100px;
  height: 100px;
  border-radius: 28px;
  background: linear-gradient(135deg, ${props => props.gradient});
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  margin: 0 auto 2rem;
`;

const EventType = styled.span`
  display: inline-block;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1rem;
`;

const EventTitle = styled(motion.h1)`
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 900;
  color: white;
  margin-bottom: 0.75rem;
`;

const EventTagline = styled(motion.p)`
  font-size: 1.25rem;
  color: ${props => props.color || '#818cf8'};
  margin-bottom: 1rem;
`;

const EventDescription = styled(motion.p)`
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
  line-height: 1.8;
  max-width: 800px;
  margin: 0 auto;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const InfoSection = styled.div``;

const InfoCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const CardTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1.5rem;
  
  svg {
    color: ${props => props.iconColor || '#6366f1'};
  }
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ListItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 0.75rem;
  
  svg {
    color: ${props => props.color || '#22c55e'};
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`;

const MetaItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  
  svg {
    color: ${props => props.color || '#6366f1'};
    margin-bottom: 0.5rem;
  }
`;

const MetaLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.25rem;
`;

const MetaValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
`;

const FormSection = styled.div``;

const RegistrationCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 2rem;
  position: sticky;
  top: 100px;
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
`;

const FormSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  margin-bottom: 2rem;
`;

const Form = styled.form``;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
  
  svg {
    width: 16px;
    height: 16px;
    color: #6366f1;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 0.95rem;
  transition: all 0.3s;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  
  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
  
  &:focus {
    outline: none;
    border-color: #6366f1;
  }
  
  option {
    background: #1a1a2e;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 0.95rem;
  resize: vertical;
  min-height: 100px;
  transition: all 0.3s;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  
  &:focus {
    outline: none;
    border-color: #6366f1;
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: ${props => props.cols || '1fr 1fr'};
  gap: 1rem;
  
  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const TeamMemberCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const TeamMemberHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const TeamMemberTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LeaderBadge = styled.span`
  padding: 0.25rem 0.5rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 6px;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const IconButton = styled.button`
  background: rgba(239, 68, 68, 0.1);
  border: none;
  color: #ef4444;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: rgba(239, 68, 68, 0.2);
  }
`;

const AddMemberButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  background: rgba(99, 102, 241, 0.1);
  border: 1px dashed rgba(99, 102, 241, 0.3);
  border-radius: 12px;
  color: #818cf8;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 1.5rem;
  
  &:hover {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.5);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, ${props => props.gradient || '#6366f1, #8b5cf6'});
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  animation: ${pulse} 2s ease-in-out infinite;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    animation: none;
  }
`;

const Alert = styled(motion.div)`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  background: ${props => props.type === 'success' 
    ? 'rgba(34, 197, 94, 0.1)' 
    : props.type === 'error' 
    ? 'rgba(239, 68, 68, 0.1)' 
    : 'rgba(245, 158, 11, 0.1)'};
  border: 1px solid ${props => props.type === 'success' 
    ? 'rgba(34, 197, 94, 0.2)' 
    : props.type === 'error' 
    ? 'rgba(239, 68, 68, 0.2)' 
    : 'rgba(245, 158, 11, 0.2)'};
  
  svg {
    flex-shrink: 0;
    color: ${props => props.type === 'success' 
      ? '#22c55e' 
      : props.type === 'error' 
      ? '#ef4444' 
      : '#f59e0b'};
  }
`;

const AlertContent = styled.div`
  flex: 1;
`;

const AlertTitle = styled.div`
  font-weight: 600;
  color: ${props => props.type === 'success' 
    ? '#22c55e' 
    : props.type === 'error' 
    ? '#ef4444' 
    : '#f59e0b'};
  margin-bottom: 0.25rem;
`;

const AlertMessage = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
`;

const ClosedBanner = styled(motion.div)`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
`;

const ClosedTitle = styled.h3`
  color: #f87171;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const ClosedText = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
`;

const SuccessCard = styled(motion.div)`
  text-align: center;
  padding: 2rem;
`;

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  
  svg {
    color: #22c55e;
  }
`;

const SuccessTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
`;

const SuccessText = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
`;

const RegistrationIdBox = styled.div`
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
`;

const RegistrationIdLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.25rem;
`;

const RegistrationId = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #818cf8;
  font-family: monospace;
`;

const LoadingOverlay = styled.div`
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  
  svg {
    animation: spin 1s linear infinite;
    color: #6366f1;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: rgba(255, 255, 255, 0.5);
`;

// Generate stars
const generateStars = (count) => {
  let stars = '';
  for (let i = 0; i < count; i++) {
    const x = Math.random() * 2000;
    const y = Math.random() * 2000;
    stars += `${x}px ${y}px rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})${i < count - 1 ? ',' : ''}`;
  }
  return stars;
};

const emptyMember = {
  name: '',
  email: '',
  phone: '',
  college: '',
  year: '',
  branch: '',
  isLeader: false
};

const ImmerseEventPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    registrationType: 'team',
    teamName: '',
    teamMembers: [{ ...emptyMember, isLeader: true }],
    // Individual fields
    name: '',
    email: '',
    phone: '',
    college: '',
    year: '',
    branch: '',
    experience: 'beginner',
    projectIdea: '',
    techStack: ''
  });

  useEffect(() => {
    fetchEvent();
  }, [slug]);

  const fetchEvent = async () => {
    try {
      const response = await immerseEvents.getBySlug(slug);
      if (response.data.success) {
        setEvent(response.data.event);
        // Set default registration type based on event
        if (response.data.event.participationType === 'individual') {
          setFormData(prev => ({ ...prev, registrationType: 'individual' }));
        }
      }
    } catch (err) {
      if (err.response?.status === 404) {
        navigate('/immerse-2026');
      }
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, memberIndex = null) => {
    const { name, value } = e.target;
    
    if (memberIndex !== null) {
      setFormData(prev => ({
        ...prev,
        teamMembers: prev.teamMembers.map((member, idx) => 
          idx === memberIndex ? { ...member, [name]: value } : member
        )
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addTeamMember = () => {
    if (formData.teamMembers.length < (event?.teamSize?.max || 5)) {
      setFormData(prev => ({
        ...prev,
        teamMembers: [...prev.teamMembers, { ...emptyMember }]
      }));
    }
  };

  const removeTeamMember = (index) => {
    if (formData.teamMembers.length > (event?.teamSize?.min || 1) && index > 0) {
      setFormData(prev => ({
        ...prev,
        teamMembers: prev.teamMembers.filter((_, idx) => idx !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        registrationType: formData.registrationType,
        experience: formData.experience,
        projectIdea: formData.projectIdea,
        techStack: formData.techStack ? formData.techStack.split(',').map(s => s.trim()) : []
      };

      if (formData.registrationType === 'team') {
        payload.teamName = formData.teamName;
        payload.teamMembers = formData.teamMembers;
      } else {
        payload.name = formData.name;
        payload.email = formData.email;
        payload.phone = formData.phone;
        payload.college = formData.college;
        payload.year = formData.year;
        payload.branch = formData.branch;
      }

      const response = await immerseEvents.register(slug, payload);
      
      if (response.data.success) {
        setSuccess(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTeamSize = (teamSize) => {
    if (!teamSize) return 'Individual';
    if (teamSize.min === teamSize.max) return `Team of ${teamSize.min}`;
    return `${teamSize.min}-${teamSize.max} Members`;
  };

  if (loading) {
    return (
      <PageWrapper>
        <StarField>
          <StarLayer stars={generateStars(50)} size="2px" duration="4s" />
        </StarField>
        <MainContent>
          <LoadingOverlay>
            <Loader2 size={48} />
            <LoadingText>Loading event details...</LoadingText>
          </LoadingOverlay>
        </MainContent>
      </PageWrapper>
    );
  }

  if (!event) {
    return (
      <PageWrapper>
        <MainContent>
          <Container>
            <Alert type="error">
              <AlertCircle />
              <AlertContent>
                <AlertTitle type="error">Event Not Found</AlertTitle>
                <AlertMessage>The event you are looking for does not exist.</AlertMessage>
              </AlertContent>
            </Alert>
            <Link to="/immerse-2026" style={{ color: '#818cf8' }}>← Back to Events</Link>
          </Container>
        </MainContent>
      </PageWrapper>
    );
  }

  const gradient = `${event.gradientColors?.from || '#6366f1'}, ${event.gradientColors?.to || '#8b5cf6'}`;

  return (
    <PageWrapper>
      <StarField>
        <StarLayer stars={generateStars(80)} size="1px" duration="4s" />
        <StarLayer stars={generateStars(40)} size="2px" duration="5s" />
      </StarField>

      <Navbar>
        <NavContent>
          <BackLink to="/immerse-2026">
            <ArrowLeft size={20} />
            Back to Events
          </BackLink>
          <Logo to="/immerse-2026">
            <Rocket size={24} />
            <LogoText>IMMERSE 2026</LogoText>
          </Logo>
        </NavContent>
      </Navbar>

      <MainContent>
        <Container>
          <HeroSection>
            <EventIcon
              gradient={gradient}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.8 }}
            >
              {event.icon}
            </EventIcon>
            <EventType>{event.eventType}</EventType>
            <EventTitle
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {event.name}
            </EventTitle>
            <EventTagline
              color={event.gradientColors?.from}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {event.tagline}
            </EventTagline>
            <EventDescription
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {event.description}
            </EventDescription>
          </HeroSection>

          <ContentGrid>
            <InfoSection>
              {/* Objectives */}
              {event.objectives?.length > 0 && (
                <InfoCard
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <CardTitle iconColor={event.gradientColors?.from}>
                    <Target />
                    Objectives
                  </CardTitle>
                  <List>
                    {event.objectives.map((obj, idx) => (
                      <ListItem key={idx}>
                        <CheckCircle size={18} />
                        {obj}
                      </ListItem>
                    ))}
                  </List>
                </InfoCard>
              )}

              {/* Focus Areas or Challenge Scope */}
              {(event.focusAreas?.length > 0 || event.challengeScope?.length > 0) && (
                <InfoCard
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <CardTitle iconColor={event.gradientColors?.to}>
                    <Zap />
                    {event.focusAreas?.length > 0 ? 'Focus Areas' : 'Challenge Scope'}
                  </CardTitle>
                  <List>
                    {(event.focusAreas || event.challengeScope || []).map((item, idx) => (
                      <ListItem key={idx} color={event.gradientColors?.from}>
                        <Star size={18} />
                        {item}
                      </ListItem>
                    ))}
                  </List>
                </InfoCard>
              )}

              {/* Evaluation Criteria */}
              {event.evaluationCriteria?.length > 0 && (
                <InfoCard
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <CardTitle iconColor="#f59e0b">
                    <Trophy />
                    Evaluation Criteria
                  </CardTitle>
                  <List>
                    {event.evaluationCriteria.map((criteria, idx) => (
                      <ListItem key={idx} color="#f59e0b">
                        <CheckCircle size={18} />
                        {criteria}
                      </ListItem>
                    ))}
                  </List>
                </InfoCard>
              )}

              {/* Quick Info */}
              <InfoCard
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <CardTitle>
                  <Clock />
                  Event Details
                </CardTitle>
                <MetaGrid>
                  <MetaItem color={event.gradientColors?.from}>
                    <Users size={24} />
                    <MetaLabel>Team Size</MetaLabel>
                    <MetaValue>{formatTeamSize(event.teamSize)}</MetaValue>
                  </MetaItem>
                  <MetaItem color={event.gradientColors?.to}>
                    <Target size={24} />
                    <MetaLabel>Event Type</MetaLabel>
                    <MetaValue style={{ textTransform: 'capitalize' }}>{event.eventType}</MetaValue>
                  </MetaItem>
                </MetaGrid>
              </InfoCard>
            </InfoSection>

            <FormSection>
              <RegistrationCard
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                {success ? (
                  <SuccessCard
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <SuccessIcon>
                      <CheckCircle size={40} />
                    </SuccessIcon>
                    <SuccessTitle>Registration Successful!</SuccessTitle>
                    <SuccessText>
                      Welcome aboard, space explorer! You have secured your spot in {event.name}.
                    </SuccessText>
                    <RegistrationIdBox>
                      <RegistrationIdLabel>Your Registration ID</RegistrationIdLabel>
                      <RegistrationId>{success.registrationId}</RegistrationId>
                    </RegistrationIdBox>
                    <SuccessText>
                      A confirmation email has been sent. Please save your registration ID for check-in.
                    </SuccessText>
                    <Link 
                      to="/immerse-2026" 
                      style={{ color: '#818cf8', textDecoration: 'none' }}
                    >
                      ← Explore More Events
                    </Link>
                  </SuccessCard>
                ) : !event.registrationOpen ? (
                  <ClosedBanner
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <AlertCircle size={48} style={{ color: '#f87171', marginBottom: '1rem' }} />
                    <ClosedTitle>Registration Closed</ClosedTitle>
                    <ClosedText>
                      Registration for this event is currently closed. Please check back later or explore other events.
                    </ClosedText>
                  </ClosedBanner>
                ) : (
                  <>
                    <FormTitle>Register Now</FormTitle>
                    <FormSubtitle>Fill in the details to secure your spot</FormSubtitle>

                    <AnimatePresence>
                      {error && (
                        <Alert 
                          type="error"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <AlertCircle />
                          <AlertContent>
                            <AlertTitle type="error">Registration Failed</AlertTitle>
                            <AlertMessage>{error}</AlertMessage>
                          </AlertContent>
                        </Alert>
                      )}
                    </AnimatePresence>

                    <Form onSubmit={handleSubmit}>
                      {/* Registration Type */}
                      {event.participationType === 'both' && (
                        <FormGroup>
                          <Label>
                            <Users />
                            Registration Type
                          </Label>
                          <Select
                            name="registrationType"
                            value={formData.registrationType}
                            onChange={handleInputChange}
                          >
                            <option value="team">Team Registration</option>
                            <option value="individual">Individual Registration</option>
                          </Select>
                        </FormGroup>
                      )}

                      {/* Team Registration */}
                      {formData.registrationType === 'team' ? (
                        <>
                          <FormGroup>
                            <Label>
                              <Users />
                              Team Name
                            </Label>
                            <Input
                              type="text"
                              name="teamName"
                              value={formData.teamName}
                              onChange={handleInputChange}
                              placeholder="Enter your team name"
                              required
                            />
                          </FormGroup>

                          {formData.teamMembers.map((member, idx) => (
                            <TeamMemberCard
                              key={idx}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <TeamMemberHeader>
                                <TeamMemberTitle>
                                  <User size={18} />
                                  {idx === 0 ? 'Team Leader' : `Member ${idx + 1}`}
                                  {idx === 0 && <LeaderBadge>Leader</LeaderBadge>}
                                </TeamMemberTitle>
                                {idx > 0 && formData.teamMembers.length > (event?.teamSize?.min || 1) && (
                                  <IconButton 
                                    type="button"
                                    onClick={() => removeTeamMember(idx)}
                                  >
                                    <Minus size={16} />
                                  </IconButton>
                                )}
                              </TeamMemberHeader>

                              <Row>
                                <FormGroup style={{ marginBottom: '0.75rem' }}>
                                  <Label><User /> Name</Label>
                                  <Input
                                    type="text"
                                    name="name"
                                    value={member.name}
                                    onChange={(e) => handleInputChange(e, idx)}
                                    placeholder="Full name"
                                    required
                                  />
                                </FormGroup>
                                <FormGroup style={{ marginBottom: '0.75rem' }}>
                                  <Label><Mail /> Email</Label>
                                  <Input
                                    type="email"
                                    name="email"
                                    value={member.email}
                                    onChange={(e) => handleInputChange(e, idx)}
                                    placeholder="Email address"
                                    required
                                  />
                                </FormGroup>
                              </Row>

                              <Row>
                                <FormGroup style={{ marginBottom: '0.75rem' }}>
                                  <Label><Phone /> Phone</Label>
                                  <Input
                                    type="tel"
                                    name="phone"
                                    value={member.phone}
                                    onChange={(e) => handleInputChange(e, idx)}
                                    placeholder="Phone number"
                                    required
                                  />
                                </FormGroup>
                                <FormGroup style={{ marginBottom: '0.75rem' }}>
                                  <Label><School /> College</Label>
                                  <Input
                                    type="text"
                                    name="college"
                                    value={member.college}
                                    onChange={(e) => handleInputChange(e, idx)}
                                    placeholder="College name"
                                    required
                                  />
                                </FormGroup>
                              </Row>

                              <Row>
                                <FormGroup style={{ marginBottom: 0 }}>
                                  <Label>Year</Label>
                                  <Select
                                    name="year"
                                    value={member.year}
                                    onChange={(e) => handleInputChange(e, idx)}
                                    required
                                  >
                                    <option value="">Select Year</option>
                                    <option value="1st">1st Year</option>
                                    <option value="2nd">2nd Year</option>
                                    <option value="3rd">3rd Year</option>
                                    <option value="4th">4th Year</option>
                                    <option value="5th">5th Year</option>
                                  </Select>
                                </FormGroup>
                                <FormGroup style={{ marginBottom: 0 }}>
                                  <Label>Branch</Label>
                                  <Input
                                    type="text"
                                    name="branch"
                                    value={member.branch}
                                    onChange={(e) => handleInputChange(e, idx)}
                                    placeholder="e.g., CSE, ECE"
                                    required
                                  />
                                </FormGroup>
                              </Row>
                            </TeamMemberCard>
                          ))}

                          {formData.teamMembers.length < (event?.teamSize?.max || 5) && (
                            <AddMemberButton type="button" onClick={addTeamMember}>
                              <Plus size={18} />
                              Add Team Member
                            </AddMemberButton>
                          )}
                        </>
                      ) : (
                        /* Individual Registration */
                        <>
                          <Row>
                            <FormGroup>
                              <Label><User /> Full Name</Label>
                              <Input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Your full name"
                                required
                              />
                            </FormGroup>
                            <FormGroup>
                              <Label><Mail /> Email</Label>
                              <Input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Your email address"
                                required
                              />
                            </FormGroup>
                          </Row>

                          <Row>
                            <FormGroup>
                              <Label><Phone /> Phone</Label>
                              <Input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="Your phone number"
                                required
                              />
                            </FormGroup>
                            <FormGroup>
                              <Label><School /> College</Label>
                              <Input
                                type="text"
                                name="college"
                                value={formData.college}
                                onChange={handleInputChange}
                                placeholder="Your college name"
                                required
                              />
                            </FormGroup>
                          </Row>

                          <Row>
                            <FormGroup>
                              <Label>Year</Label>
                              <Select
                                name="year"
                                value={formData.year}
                                onChange={handleInputChange}
                                required
                              >
                                <option value="">Select Year</option>
                                <option value="1st">1st Year</option>
                                <option value="2nd">2nd Year</option>
                                <option value="3rd">3rd Year</option>
                                <option value="4th">4th Year</option>
                                <option value="5th">5th Year</option>
                              </Select>
                            </FormGroup>
                            <FormGroup>
                              <Label>Branch</Label>
                              <Input
                                type="text"
                                name="branch"
                                value={formData.branch}
                                onChange={handleInputChange}
                                placeholder="e.g., CSE, ECE"
                                required
                              />
                            </FormGroup>
                          </Row>
                        </>
                      )}

                      {/* Common Fields */}
                      <FormGroup>
                        <Label>
                          <Zap />
                          Experience Level
                        </Label>
                        <Select
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </Select>
                      </FormGroup>

                      {(event.eventType === 'hackathon' || event.eventType === 'ideathon') && (
                        <>
                          <FormGroup>
                            <Label>
                              <FileText />
                              Project Idea (Optional)
                            </Label>
                            <TextArea
                              name="projectIdea"
                              value={formData.projectIdea}
                              onChange={handleInputChange}
                              placeholder="Briefly describe your project idea..."
                            />
                          </FormGroup>

                          <FormGroup>
                            <Label>
                              <Code />
                              Tech Stack (Optional)
                            </Label>
                            <Input
                              type="text"
                              name="techStack"
                              value={formData.techStack}
                              onChange={handleInputChange}
                              placeholder="e.g., React, Node.js, MongoDB"
                            />
                          </FormGroup>
                        </>
                      )}

                      <SubmitButton 
                        type="submit" 
                        disabled={submitting}
                        gradient={gradient}
                      >
                        {submitting ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            Registering...
                          </>
                        ) : (
                          <>
                            <Send size={20} />
                            Complete Registration
                          </>
                        )}
                      </SubmitButton>
                    </Form>
                  </>
                )}
              </RegistrationCard>
            </FormSection>
          </ContentGrid>
        </Container>
      </MainContent>
    </PageWrapper>
  );
};

export default ImmerseEventPage;

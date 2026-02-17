import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  Star, 
  Calendar, 
  Users, 
  ArrowRight,
  Sparkles,
  Globe,
  Zap
} from 'lucide-react';
import { immersePublicApi } from '../../../utils/immerseApi';

// Animations
const twinkle = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
`;

const shootingStar = keyframes`
  0% { transform: translateX(0) translateY(0); opacity: 1; }
  100% { transform: translateX(-500px) translateY(500px); opacity: 0; }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
  50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.6); }
`;

// Styled Components
const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #0d1b2a 0%, #1b263b 25%, #0a1628 50%, #050a12 75%, #000000 100%);
  overflow: hidden;
  position: relative;
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
  
  &::before, &::after {
    content: '';
    position: absolute;
    width: ${props => props.size || '2px'};
    height: ${props => props.size || '2px'};
    background: white;
    border-radius: 50%;
    box-shadow: ${props => props.stars};
    animation: ${twinkle} ${props => props.duration || '3s'} ease-in-out infinite;
    animation-delay: ${props => props.delay || '0s'};
  }
`;

const ShootingStar = styled.div`
  position: absolute;
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, white, transparent);
  top: ${props => props.top};
  right: -100px;
  animation: ${shootingStar} ${props => props.duration || '3s'} linear infinite;
  animation-delay: ${props => props.delay || '0s'};
  opacity: 0;
`;

const Navbar = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 1rem 2rem;
  background: rgba(10, 10, 26, 0.8);
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
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled.a`
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.95rem;
  transition: color 0.3s;
  
  &:hover {
    color: white;
  }
`;

const HeroSection = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 8rem 2rem 4rem;
  position: relative;
  z-index: 1;
`;

const HeroBadge = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 50px;
  color: #818cf8;
  font-size: 0.9rem;
  margin-bottom: 2rem;
`;

const HeroTitle = styled(motion.h1)`
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 900;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  
  span.gradient {
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899, #f43f5e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-size: 200% auto;
  }
  
  span.white {
    color: white;
  }
`;

const HeroSubtitle = styled(motion.p)`
  font-size: clamp(1.1rem, 2vw, 1.4rem);
  color: rgba(255, 255, 255, 0.6);
  max-width: 700px;
  line-height: 1.6;
  margin-bottom: 3rem;
`;

const HeroButtons = styled(motion.div)`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const PrimaryButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s;
  animation: ${pulse} 2s ease-in-out infinite;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
  }
`;

const SecondaryButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-3px);
  }
`;

const StatsSection = styled(motion.div)`
  display: flex;
  justify-content: center;
  gap: 4rem;
  margin-top: 5rem;
  flex-wrap: wrap;
  
  @media (max-width: 640px) {
    gap: 2rem;
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const StatLabel = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  margin-top: 0.25rem;
`;

const EventsSection = styled.section`
  padding: 6rem 2rem;
  position: relative;
  z-index: 1;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;

const SectionTitle = styled(motion.h2)`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  color: white;
  margin-bottom: 1rem;
  
  span {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const SectionSubtitle = styled(motion.p)`
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
`;

const EventsGrid = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 2rem;
`;

const EventCard = styled(motion.div)`
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 2rem;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${props => props.gradient});
  }
  
  &:hover {
    transform: translateY(-8px);
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    
    .event-icon {
      transform: scale(1.1) rotate(5deg);
    }
  }
`;

const EventIcon = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 20px;
  background: linear-gradient(135deg, ${props => props.gradient});
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: 1.5rem;
  transition: transform 0.4s;
`;

const EventType = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 1rem;
`;

const EventName = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
`;

const EventTagline = styled.p`
  color: ${props => props.color || '#818cf8'};
  font-size: 0.95rem;
  margin-bottom: 1rem;
`;

const EventDescription = styled.p`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const EventMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`;

const TeamSize = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const EventLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: gap 0.3s;
  
  &:hover {
    gap: 0.75rem;
  }
`;

const AboutSection = styled.section`
  padding: 6rem 2rem;
  position: relative;
  z-index: 1;
`;

const AboutContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

const AboutText = styled.div``;

const AboutTitle = styled(motion.h2)`
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: 1.5rem;
  
  span {
    background: linear-gradient(135deg, #6366f1, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const AboutDescription = styled(motion.p)`
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 2rem;
`;

const FeatureList = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  svg {
    width: 24px;
    height: 24px;
    color: #6366f1;
  }
  
  span {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1rem;
  }
  
  @media (max-width: 900px) {
    justify-content: center;
  }
`;

const AboutVisual = styled(motion.div)`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const GlowOrb = styled.div`
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
  animation: ${float} 6s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '🚀';
    font-size: 5rem;
  }
`;

const FooterSection = styled.footer`
  padding: 4rem 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  z-index: 1;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
    text-align: center;
  }
`;

const FooterLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  svg {
    color: #6366f1;
  }
`;

const FooterText = styled.p`
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.9rem;
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 2rem;
  
  a {
    color: rgba(255, 255, 255, 0.5);
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.3s;
    
    &:hover {
      color: white;
    }
  }
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

const ImmerseLanding = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await immersePublicApi.get('/events');
      if (response.data.success) {
        setEvents(response.data.events);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTeamSize = (teamSize) => {
    if (!teamSize) return 'Individual';
    if (teamSize.min === teamSize.max) return `Team of ${teamSize.min}`;
    return `${teamSize.min}-${teamSize.max} Members`;
  };

  return (
    <PageWrapper>
      {/* Star Background */}
      <StarField>
        <StarLayer stars={generateStars(100)} size="1px" duration="4s" />
        <StarLayer stars={generateStars(50)} size="2px" duration="5s" delay="1s" />
        <StarLayer stars={generateStars(25)} size="3px" duration="6s" delay="2s" />
        <ShootingStar top="20%" duration="3s" delay="0s" />
        <ShootingStar top="40%" duration="4s" delay="2s" />
        <ShootingStar top="60%" duration="3.5s" delay="5s" />
      </StarField>

      {/* Navbar */}
      <Navbar>
        <NavContent>
          <Logo to="/immerse-2026">
            <Rocket size={28} />
            <LogoText>IMMERSE 2026</LogoText>
          </Logo>
          <NavLinks>
            <NavLink href="#events">Events</NavLink>
            <NavLink href="#about">About</NavLink>
            <NavLink href="https://gdg.mmmut.app" target="_blank">GDG MMMUT</NavLink>
          </NavLinks>
        </NavContent>
      </Navbar>

      {/* Hero Section */}
      <HeroSection>
        <HeroBadge
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Star size={16} />
          GDG On Campus MMMUT Presents
        </HeroBadge>
        
        <HeroTitle
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <span className="gradient">IMMERSE</span>
          <br />
          <span className="white">2026</span>
        </HeroTitle>
        
        <HeroSubtitle
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <strong style={{ color: '#818cf8' }}>INTERSTELLAR</strong> — Innovation Beyond Space & Time. 
          Join us for an extraordinary journey through technology, creativity, and innovation.
        </HeroSubtitle>

        <HeroButtons
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <PrimaryButton to="#events">
            <Rocket size={20} />
            Explore Events
          </PrimaryButton>
          <SecondaryButton href="https://gdg.mmmut.app" target="_blank">
            <Globe size={20} />
            Learn More
          </SecondaryButton>
        </HeroButtons>

        <StatsSection
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <StatItem>
            <StatNumber>7</StatNumber>
            <StatLabel>Stellar Events</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>500+</StatNumber>
            <StatLabel>Expected Participants</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>₹50K+</StatNumber>
            <StatLabel>Prize Pool</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>3</StatNumber>
            <StatLabel>Days of Innovation</StatLabel>
          </StatItem>
        </StatsSection>
      </HeroSection>

      {/* Events Section */}
      <EventsSection id="events">
        <SectionHeader>
          <SectionTitle
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Stellar <span>Events</span>
          </SectionTitle>
          <SectionSubtitle
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Seven unique challenges designed to push boundaries and ignite your potential
          </SectionSubtitle>
        </SectionHeader>

        <EventsGrid>
          {loading ? (
            [...Array(6)].map((_, i) => (
              <EventCard
                key={i}
                gradient="#333, #444"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div style={{ height: 200 }} />
              </EventCard>
            ))
          ) : (
            events.map((event, index) => (
              <EventCard
                key={event._id}
                gradient={`${event.gradientColors?.from || '#6366f1'}, ${event.gradientColors?.to || '#8b5cf6'}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <EventIcon 
                  className="event-icon"
                  gradient={`${event.gradientColors?.from || '#6366f1'}, ${event.gradientColors?.to || '#8b5cf6'}`}
                >
                  {event.icon}
                </EventIcon>
                <EventType>{event.eventType}</EventType>
                <EventName>{event.name}</EventName>
                <EventTagline color={event.gradientColors?.from}>{event.tagline}</EventTagline>
                <EventDescription>
                  {event.description?.substring(0, 150)}...
                </EventDescription>
                <EventMeta>
                  <TeamSize>
                    <Users />
                    {formatTeamSize(event.teamSize)}
                  </TeamSize>
                  <EventLink to={`/immerse-2026/${event.slug}`}>
                    Register Now <ArrowRight size={16} />
                  </EventLink>
                </EventMeta>
              </EventCard>
            ))
          )}
        </EventsGrid>
      </EventsSection>

      {/* About Section */}
      <AboutSection id="about">
        <AboutContent>
          <AboutText>
            <AboutTitle
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              About <span>IMMERSE 2026</span>
            </AboutTitle>
            <AboutDescription
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              IMMERSE 2026 is the flagship tech fest of GDG On Campus MMMUT, themed 
              <strong style={{ color: '#818cf8' }}> INTERSTELLAR</strong>. It is a celebration 
              of innovation, creativity, and the spirit of exploration. From hackathons to 
              AI challenges, we have crafted seven unique events that will push the boundaries
              of what is possible.
            </AboutDescription>
            <FeatureList
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <FeatureItem>
                <Zap />
                <span>Hands-on technical workshops and competitions</span>
              </FeatureItem>
              <FeatureItem>
                <Users />
                <span>Network with industry professionals</span>
              </FeatureItem>
              <FeatureItem>
                <Sparkles />
                <span>Win exciting prizes and recognition</span>
              </FeatureItem>
              <FeatureItem>
                <Calendar />
                <span>Three days of non-stop innovation</span>
              </FeatureItem>
            </FeatureList>
          </AboutText>
          <AboutVisual
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <GlowOrb />
          </AboutVisual>
        </AboutContent>
      </AboutSection>

      {/* Footer */}
      <FooterSection>
        <FooterContent>
          <FooterLogo>
            <Rocket size={24} />
            <LogoText style={{ fontSize: '1.25rem' }}>IMMERSE 2026</LogoText>
          </FooterLogo>
          <FooterText>
            © 2026 GDG On Campus MMMUT. All rights reserved.
          </FooterText>
          <FooterLinks>
            <a href="https://gdg.mmmut.app" target="_blank" rel="noopener noreferrer">Website</a>
            <a href="mailto:gdsc.mmmut@gmail.com">Contact</a>
          </FooterLinks>
        </FooterContent>
      </FooterSection>
    </PageWrapper>
  );
};

export default ImmerseLanding;

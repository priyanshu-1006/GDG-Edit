import { useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion, useInView } from 'framer-motion';
import gsap from 'gsap';

const AboutSectionContainer = styled.section`
  padding: 6rem 2rem;
  background-color: ${({ theme }) => theme.colors.background.primary};
  position: relative;
  overflow: hidden;
`;

const AboutWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const AboutContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  position: relative;
  display: inline-block;
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -0.5rem;
    height: 4px;
    width: 60px;
    background-color: ${({ theme }) => theme.colors.primary};
  }
`;

const AboutText = styled.p`
  font-size: 1.125rem;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 1.5rem;
  
  @media (max-width: 500px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatItem = styled(motion.div)`
  text-align: left;
`;

const StatNumber = styled.h3`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(
    135deg,
    ${({ theme, $color }) => {
      switch($color) {
        case 'blue': return theme.googleColors.blue.primary;
        case 'red': return theme.googleColors.red.primary;
        case 'green': return theme.googleColors.green.primary;
        case 'yellow': return theme.googleColors.yellow.primary;
        default: return theme.colors.primary;
      }
    }},
    ${({ theme, $color }) => {
      switch($color) {
        case 'blue': return theme.googleColors.blue.dark;
        case 'red': return theme.googleColors.red.dark;
        case 'green': return theme.googleColors.green.dark;
        case 'yellow': return theme.googleColors.yellow.dark;
        default: return theme.googleColors.blue.dark;
      }
    }}
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const StatLabel = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const IllustrationContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const AboutSection = () => {
  const statsRef = useRef(null);
  const isInView = useInView(statsRef, { once: false, amount: 0.3 });
  const illustrationRef = useRef(null);
  
  useEffect(() => {
    if (illustrationRef.current) {
      gsap.fromTo(
        illustrationRef.current,
        { 
          y: 20,
          opacity: 0.8
        },
        {
          y: -20,
          opacity: 1,
          duration: 2,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1
        }
      );
    }
    
    return () => {
      if (illustrationRef.current) {
        gsap.killTweensOf(illustrationRef.current);
      }
    };
  }, []);
  
  const statVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 * i,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };
  
  return (
    <AboutSectionContainer id="about" className="animate-section">
      <AboutWrapper>
        <AboutContent>
          <SectionTitle>About  GDG On Campus MMMUT</SectionTitle>
          <AboutText>
            <p>
              Founded on 26th September 2020 by our esteemed alumnus Abhishek Kumar Yadav, we
            began as Developer Student Clubs (DSC), as a part of the Google Developers Program. Over
            the period of time we have developed, expanded and evolved to become the largest developer
            based community of our campus and in the region as well. Our mission has always been to
            promote technology, foster innovation, and nurture skill development within the tech
            community. Through workshops, hackathons, and expert sessions, we cover a diverse range
            of domains, including:
            </p>
            <div className='flex flex-col items-start flex-1/6 justify-center'>
              <p>💻 Web Development</p>
              <p>📱 Android Development</p>
              <p>🤖 Artificial Intelligence & Machine Learning</p>
              <p>📊 Cybersecurity & Cryptography</p>
              <p>🔗 Blockchain & Web 3.0</p>
              <p>🌐 Open Source & Cloud Computing</p>
            </div>
          </AboutText>
          
          <Stats ref={statsRef}>
            <StatItem
              custom={0}
              variants={statVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              <StatNumber $color="blue">
                {
                  // Animated counter would be implemented with GSAP in a real app
                  "1000+"
                }
              </StatNumber>
              <StatLabel>Community Members</StatLabel>
            </StatItem>
            
            <StatItem
              custom={1}
              variants={statVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              <StatNumber $color="red">
                {
                  // Animated counter would be implemented with GSAP in a real app
                  "40+"
                }
              </StatNumber>
              <StatLabel>Events Organized</StatLabel>
            </StatItem>
            
            <StatItem
              custom={2}
              variants={statVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              <StatNumber $color="green">
                {
                  // Animated counter would be implemented with GSAP in a real app
                  "10+"
                }
              </StatNumber>
              <StatLabel>Speakers</StatLabel>
            </StatItem>
            
            <StatItem
              custom={3}
              variants={statVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              <StatNumber $color="yellow">
                {
                  // Animated counter would be implemented with GSAP in a real app
                  "10+"
                }
              </StatNumber>
              <StatLabel>Workshops</StatLabel>
            </StatItem>
            
            <StatItem
              custom={4}
              variants={statVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
            >
              <StatNumber $color="blue">
                {
                  // Animated counter would be implemented with GSAP in a real app
                  "2+"
                }
              </StatNumber>
              <StatLabel>Hackathons</StatLabel>
            </StatItem>
          </Stats>
        </AboutContent>
        
        <IllustrationContainer>
          <motion.img
            ref={illustrationRef}
            src="https://res.cloudinary.com/dfstpdwih/image/upload/v1747379399/Codehelp/tmp-1-1747379399376.jpg"
            alt="GDG Illustration"
            style={{ width: '80%', maxWidth: '400px' }}
          />
        </IllustrationContainer>
      </AboutWrapper>
      <IllustrationContainer>
        <motion.button ref={illustrationRef} style={{position:"absolute", left:"65%",  padding:"1rem", backgroundColor:"#4285F4", color:"#fff", border:"none", borderRadius:"5px", cursor:"pointer"  }} onClick={() => { window.location.href = 'https://gdg.community.dev/events/details/google-gdg-on-campus-madan-mohan-malaviya-university-of-technology-gorakhpur-india-presents-techsprint-hackathon-info-session/';}}>Learn more about Us</motion.button>
      </IllustrationContainer>
   
    </AboutSectionContainer>
  );
};

export default AboutSection;
import { useRef, useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Rocket, X, Sparkles } from 'lucide-react';
import HeroSection from '../sections/HeroSection';
import AboutSection from '../sections/AboutSection';
import SponsorsSection from '../sections/SponsorsSection';
import EventsSection from '../sections/EventsSection';
import ContactSection from '../sections/ContactSection';
import "../styles/Hero.css"
import { PreviousEventsSection } from '../sections/PreviousEventsSection';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Glowing animation
const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(66, 133, 244, 0.4), 0 0 40px rgba(66, 133, 244, 0.2), 0 0 60px rgba(66, 133, 244, 0.1);
  }
  50% {
    box-shadow: 0 0 30px rgba(66, 133, 244, 0.6), 0 0 60px rgba(66, 133, 244, 0.4), 0 0 90px rgba(66, 133, 244, 0.2);
  }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

// Promo Modal Styled Components
const PromoModal = styled(motion.div)`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 50;
  background: linear-gradient(135deg, #0d1b2a 0%, #1b263b 50%, #0a1628 100%);
  border: 1px solid rgba(66, 133, 244, 0.3);
  border-radius: 16px;
  padding: 20px 24px;
  max-width: 320px;
  animation: ${glow} 3s ease-in-out infinite, ${float} 4s ease-in-out infinite;
  
  @media (max-width: 480px) {
    bottom: 16px;
    right: 16px;
    left: 16px;
    max-width: none;
  }
`;

const PromoContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const PromoIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #4285f4;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
`;

const PromoText = styled.div`
  flex: 1;
`;

const PromoTitle = styled.h4`
  color: white;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const PromoSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  margin-bottom: 12px;
  line-height: 1.4;
`;

const PromoButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #4285f4;
  color: white;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
    background: #3367d6;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
  }
`;

const HomePageContainer = styled.div`
  position: relative;
  overflow: hidden;
`;
const HomePage = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const [showPromo, setShowPromo] = useState(true);
  
  // Use Framer Motion to create a smooth opacity transition based on scroll position
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  useEffect(() => {
    // GSAP animations setup
    const sections = gsap.utils.toArray('.animate-section');
    sections.forEach((section) => {
      gsap.fromTo(
        section,
        {
          y: 50,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });
    return () => {
      // Clean up ScrollTriggers
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);
  return (
    <HomePageContainer ref={containerRef}>
      <motion.div style={{ opacity }}>
        <HeroSection />
      </motion.div>
      <AboutSection />
      <EventsSection />
      {/* <WinnersSection /> */}
      <PreviousEventsSection/>
      <SponsorsSection />
      <ContactSection />
      
      {/* GDG Induction Promo Modal */}
      <AnimatePresence>
        {showPromo && (
          <PromoModal
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <CloseButton onClick={() => setShowPromo(false)}>
              <X size={16} />
            </CloseButton>
            <PromoContent>
              <PromoIcon>
                <Rocket size={24} />
              </PromoIcon>
              <PromoText>
                <PromoTitle>
                  GDG MMMUT Induction <Sparkles size={14} />
                </PromoTitle>
                <PromoSubtitle>
                  Applications are now open! Join our community of developers and innovators.
                </PromoSubtitle>
                <PromoButton to="/induction">
                  Apply Now
                  <Sparkles size={14} />
                </PromoButton>
              </PromoText>
            </PromoContent>
          </PromoModal>
        )}
      </AnimatePresence>
    </HomePageContainer>
  );
};
export default HomePage;
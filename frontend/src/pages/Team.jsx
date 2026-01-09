import { useEffect, useRef, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { motion, useInView, useScroll } from 'framer-motion';
import { FaGit, FaLinkedin, FaTwitter } from 'react-icons/fa';
import Uploadbox from '../../Upload/Uploadbox';
import { useAuth } from "../contexts/useAuth"
import { apiClient } from '../utils/apiUtils';

const TeamSectionContainer = styled.section`
  padding: 6rem 2rem;
  background-color: ${({ theme }) => theme.colors.background.primary};
  position: relative;
  overflow: hidden;
`;
const SectionContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;
const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;
const SectionTitle = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  position: relative;
  display: inline-block;
  &::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: -0.5rem;
    height: 4px;
    width: 60px;
    background-color: ${({ theme }) => theme.colors.primary};
  }
`;
const SectionDescription = styled.p`
  font-size: 1.125rem;
  max-width: 700px;
  margin: 0 auto;
  color: ${({ theme }) => theme.colors.text.secondary};
`;
const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
`;
const TeamMemberCard = styled(motion.div)`
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.6s ease;
  height: ${({ $isLead }) => $isLead ? '400px' : '450px'};
  display: flex;
  flex-direction: column;
  &:hover {
    transform: translateY(-8px);
  }
`;
const MemberImage = styled.div`
  height: 250px;
  overflow: hidden;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(
      to bottom,
      transparent,
      ${({ theme }) => theme.colors.background.secondary}
    );
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    transition: transform 0.75s ease;
    will-change: transform;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
  }
  ${TeamMemberCard}:hover & img {
    transform: scale(1.05);
  }
`;
const MemberContent = styled.div`
  padding: 1.5rem;
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const RoleBadge = styled.span`
  display: inline-block;
  background-color: ${({ theme, $role }) => {
    switch ($role) {
      case 'lead': return theme.googleColors.blue.light;
      case 'core': return theme.googleColors.red.light;
      case 'organizer': return theme.googleColors.green.light;
      case 'volunteer': return theme.googleColors.yellow.light;
      default: return theme.colors.primary;
    }
  }};
  color: ${({ theme, $role }) => {
    switch ($role) {
      case 'lead': return theme.googleColors.blue.darker;
      case 'core': return theme.googleColors.red.darker;
      case 'organizer': return theme.googleColors.green.darker;
      case 'volunteer': return theme.googleColors.yellow.darker;
      default: return theme.colors.text.inverse;
    }
  }};
  padding: 0.25rem 0.75rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
`;
const MemberName = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;
const MemberRole = styled.h4`
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.primary};
`;
const SocialLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
`;
const SocialLink = styled(motion.a)`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1.25rem;
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;
const FilterButton = styled.button`
  padding: 10px 20px;
  border-radius: 25px;
  // border: 2px solid ${props => props.theme.primary};
  background: ${props => props.$active 
    ? props.theme.primary 
    : (props.theme.name === 'dark' ? '#2b2b2b9c' : '#e7e5e5bf')};
  color: ${props => props.$active ? 'white' : props.theme.colors.text.primary};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.theme.primary};
    color: white;
  }
`;
const FilterContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
`;

// Cloudinary helpers
function isCloudinaryUrl(url) {
  return typeof url === 'string' && url.includes('res.cloudinary.com');
}

function buildCloudinaryUrl(url, width) {
  try {
    if (!isCloudinaryUrl(url)) return url;
    // Insert transformation after "/upload/"
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url;

    const prefix = url.slice(0, uploadIndex + '/upload/'.length);
    const suffix = url.slice(uploadIndex + '/upload/'.length);
    // If width is provided, cap it; otherwise omit
    const widthPart = width ? `,w_${width}` : '';
    const transformation = `f_auto,q_auto,dpr_auto,c_limit${widthPart}`;

    // Avoid duplicating transformations
    if (suffix.startsWith('f_auto') || suffix.startsWith('q_auto')) {
      return url; // assume already transformed
    }
    return `${prefix}${transformation}/${suffix}`;
  } catch (e) {
    console.warn('Error building Cloudinary URL:', e);
    return url;
  }
}

function buildResponsiveSrcSet(url) {
  if (!isCloudinaryUrl(url)) return undefined;
  const widths = [200, 300, 400, 600, 800];
  return widths.map(w => `${buildCloudinaryUrl(url, w)} ${w}w`).join(', ');
}

export default function Team() {
  const { fileUrl } = useAuth();
  const [upload, setUpload] = useState(false);
  const [selectedYear, setSelectedYear] = useState("GDG Lead");
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const response = await apiClient.get('/api/core-team');
        if (response.data.success) {
          setTeamData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };
  
  // Lightweight 3D tilt + scale wrapper using Tailwind for smooth transitions
  function TiltWrapper({ children }) {
    const innerRef = useRef(null);
    const theme = useTheme();
    const [isHovered, setIsHovered] = useState(false);
  
    function handleMouseMove(e) {
      const target = innerRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = (x / rect.width) - 0.5; // -0.5 to 0.5
      const py = (y / rect.height) - 0.5;
      const rotateY = px * 12; // max ~12deg
      const rotateX = -py * 12;
      target.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    }
  
    function handleMouseEnter() {
      setIsHovered(true);
    }
  
    function handleMouseLeave() {
      const target = innerRef.current;
      if (!target) return;
      target.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
      setIsHovered(false);
    }
  
    // Unified black shadow (light and dark themes)
    const shadowStyle = isHovered
      ? '0 25px 60px -12px rgba(0, 0, 0, 0.35)'
      : '0 4px 20px rgba(0, 0, 0, 0.10)';
  
    return (
      <div className="group [perspective:1000px]">
        <div
          ref={innerRef}
          className="transform-gpu will-change-transform"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ 
            transformStyle: 'preserve-3d',
            boxShadow: shadowStyle,
            transition: 'transform 150ms ease-out, box-shadow 300ms ease'
          }}
        >
          {children}
        </div>
      </div>
    );
  }
  function handleUpload() {
    setUpload(true);
  }
  // Normalize role to a category key for ordering
  function getTeamCategory(member) {
    const role = (member?.role || '').toLowerCase();
    if (role.includes('content') || role.includes('management')) return 'content';
    if (role.includes('web')) return 'web';
    if (role.includes('ai/ml') || role.includes('ai') || role.includes('machine') || role.includes('ml') || role.includes('cyber')) return 'ai';
    if (role.includes('android')) return 'android';
    if (role.includes('ui/ux') || role.includes('ui') || role.includes('ux') || role.includes('design')) return 'uiux';
    if (role.includes('dsa') || role.includes('cp')) return 'dsa';
    return 'other';
  }

  const orderRank = {
    content: 1,
    web: 2,
    ai: 3,
    android: 4,
    uiux: 5,
    dsa: 6,
    other: 999
  };

  let filteredMembers = selectedYear?.includes('GDG Lead')
    ? teamData.filter(member => member?.position?.includes("GDG Lead"))
    : teamData?.filter(member => member?.year === selectedYear);

  // For 2025, sort by the specified category order
  if (selectedYear === '2025') {
    filteredMembers = [...filteredMembers].sort((a, b) => {
      // Keep Shaurya Srivastava (id: 100) always first
      if (a.id === 100 && b.id !== 100) return -1;
      if (b.id === 100 && a.id !== 100) return 1;
      const ra = orderRank[getTeamCategory(a)] || 999;
      const rb = orderRank[getTeamCategory(b)] || 999;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
  }

  return (
    <>
      <TeamSectionContainer id="team" className="animate-section">
        <SectionContent ref={sectionRef}>
          <SectionHeader>
            <SectionTitle>Our Team</SectionTitle>
            <SectionDescription>
              Meet the passionate individuals who make GDG MMMUT possible. Our team is dedicated to fostering a vibrant tech community and organizing impactful events.
            </SectionDescription>
          </SectionHeader>
          <FilterContainer>
            <FilterButton
              $active={selectedYear === "GDG Lead"}
              onClick={() => setSelectedYear('GDG Lead')}
            >
              Our Leads
            </FilterButton>
            <FilterButton
              $active={selectedYear === '2025'}
              onClick={() => setSelectedYear('2025')}
            >
              2025
            </FilterButton>
            <FilterButton
              $active={selectedYear === '2024'}
              onClick={() => setSelectedYear('2024')}
            >
              2024
            </FilterButton>
            <FilterButton
              $active={selectedYear === '2023'}
              onClick={() => setSelectedYear('2023')}
            >
              2023
            </FilterButton>
            <FilterButton
              $active={selectedYear === '2022'}
              onClick={() => setSelectedYear('2022')}
            >
              2022
            </FilterButton>
            <FilterButton
              $active={selectedYear === '2021'}
              onClick={() => setSelectedYear('2021')}
            >
              2021
            </FilterButton>
          </FilterContainer>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : undefined}
          >
            <TeamGrid>
              {filteredMembers?.map((member) => (
                <TiltWrapper key={member.id || member._id}>
                  <TeamMemberCard 
                    variants={itemVariants} 
                    className="transition-transform duration-700 ease-in-out"
                    $isLead={selectedYear === "GDG Lead"}
                  >
                  <MemberImage>
                    <img 
                      src={buildCloudinaryUrl(member?.image, 600)} 
                      srcSet={buildResponsiveSrcSet(member?.image)}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
                      alt={member.name}
                      loading={(member.id || member._id) <= 104 ? 'eager' : 'lazy'}
                      fetchPriority={(member.id || member._id) <= 104 ? 'high' : 'auto'}
                      referrerPolicy={!isCloudinaryUrl(member?.image) ? 'no-referrer' : undefined}
                      decoding="async"
                      style={{
                        opacity: 0,
                        transition: 'opacity 0.3s ease-in-out'
                      }}
                      onLoad={(e) => {
                        if (e.target.dataset.placeholder === 'true') {
                          return; // keep reduced opacity for placeholder
                        }
                        e.target.style.opacity = '1';
                      }}
                      onError={(e) => {
                        // fallback to original or a placeholder to avoid broken images
                        if (isCloudinaryUrl(member?.image)) {
                          const original = member?.image;
                          if (e.target.src !== original) {
                            e.target.src = original;
                          }
                          e.target.style.opacity = '1';
                        } else {
                          // Use local logo as placeholder with reduced opacity for subtlety
                          e.target.dataset.placeholder = 'true';
                          e.target.src = '/GDG_Logo.svg';
                          e.target.style.opacity = '0.35';
                        }
                      }}
                    />
                    <button onClick={handleUpload}>Upload</button>
                  </MemberImage>

                  <MemberContent>
                    <>
                      {
                        selectedYear != 'GDG Lead' ? <><RoleBadge $role={member.badge}>
                          {member.badge ? member.badge.charAt(0).toUpperCase() + member.badge.slice(1) : ''}
                        </RoleBadge></> :
                          <></>
                      }
                    </>

                    <MemberName>{member.name}</MemberName>
                    <MemberRole>{member.role}</MemberRole>
                    <SocialLinks>
                      <SocialLink
                        href={member.social?.linkedin || '#'}
                        target="_ blank"
                        whileHover={{ y: -3 }}
                        aria-label={`${member.name}'s LinkedIn`}
                      >
                        <i className="fab fa-linkedin"><FaLinkedin /></i>
                      </SocialLink>
                      <SocialLink
                        href={member.social?.twitter || '#'}
                        target="_blank"
                        whileHover={{ y: -3 }}
                        aria-label={`${member.name}'s Twitter`}
                      >
                        <i className="fab fa-twitter"><FaTwitter /></i>
                      </SocialLink>
                      <SocialLink
                        href={member.social?.github || '#'}
                        target="_blank"
                        whileHover={{ y: -3 }}
                        aria-label={`${member.name}'s GitHub`}
                      >
                        <i className="fab fa-github"><FaGit /></i>
                      </SocialLink>
                    </SocialLinks>
                  </MemberContent>
                  </TeamMemberCard>
                </TiltWrapper>
              ))}
            </TeamGrid>
          </motion.div>
        </SectionContent>
      </TeamSectionContainer>
      {upload && <motion.div style={{
        position: "fixed",
        top: "0",
        left: "0",
        right: "0",
        bottom: "0",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(5px)",
        display: "flex",
        justifyContent: " center",
        alignItems: "center",
        zIndex: "1000"
      }}
      >
        <Uploadbox setUpload={setUpload} />
      </motion.div>}
    </>
  );
};

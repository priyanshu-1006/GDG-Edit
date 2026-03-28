import { useRef } from 'react';
import styled from 'styled-components';
import { motion, useInView } from 'framer-motion';

const FALLBACK_SPONSOR_LOGO = '/gdg_logo.svg';

const handleSponsorLogoError = (event) => {
  const img = event.currentTarget;
  if (img.dataset.fallbackApplied === 'true') return;
  img.dataset.fallbackApplied = 'true';
  img.src = FALLBACK_SPONSOR_LOGO;
};

const SponsorsSectionContainer = styled.section`
  padding: 6rem 2rem;
  background-color: ${({ theme }) => theme.colors.background.primary};
  position: relative;
  overflow: hidden;

  /* Soft gradient backdrop to avoid cards blending in */
  background-image:
    radial-gradient(1200px 600px at 10% -10%, rgba(66, 133, 244, 0.12), transparent 60%),
    radial-gradient(1000px 500px at 110% 10%, rgba(234, 67, 53, 0.10), transparent 60%),
    radial-gradient(900px 500px at 50% 120%, rgba(52, 168, 83, 0.10), transparent 60%);

  &:before {
    content: '';
    position: absolute;
    inset: -40% -20% auto -20%;
    height: 60%;
    background: radial-gradient(closest-side, rgba(255,255,255,0.08), transparent 60%);
    pointer-events: none;
    filter: blur(40px);
  }
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

const SponsorsGrid = styled.div`
  display: grid;
  gap: 3rem;
`;

const SponsorTier = styled.div`
  margin-bottom: 3rem;
  text-align: center;
`;

const TierTitle = styled.h3`
  font-size: 1.75rem;
  margin-bottom: 2rem;
  text-align: center;
  color: transparent;
  background: ${({ theme, $type }) => {
    switch($type) {
      case 'platinum': return `linear-gradient(90deg, ${theme.googleColors.blue.dark}, ${theme.googleColors.blue.primary})`;
      case 'gold': return `linear-gradient(90deg, ${theme.googleColors.yellow.dark}, ${theme.googleColors.yellow.primary})`;
      case 'silver': return `linear-gradient(90deg, ${theme.googleColors.grey[600]}, ${theme.googleColors.grey[400]})`;
      default: return `linear-gradient(90deg, ${theme.colors.text.primary}, ${theme.colors.text.primary})`;
    }
  }};
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.5px;
  position: relative;
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background-color: transparent;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.06) inset;
  transition: transform 0.25s ease, filter 0.25s ease;

  &::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: -8px;
    height: 4px;
    width: 120px;
    border-radius: 999px;
    background: ${({ theme, $type }) => {
      switch($type) {
        case 'platinum': return `linear-gradient(90deg, ${theme.googleColors.blue.dark}, ${theme.googleColors.blue.primary})`;
        case 'gold': return `linear-gradient(90deg, ${theme.googleColors.yellow.dark}, ${theme.googleColors.yellow.primary})`;
        case 'silver': return `linear-gradient(90deg, ${theme.googleColors.grey[600]}, ${theme.googleColors.grey[400]})`;
        default: return theme.colors.primary;
      }
    }};
    box-shadow: 0 6px 16px rgba(0,0,0,0.25);
    opacity: 0.9;
  }

  &:hover {
    transform: translateY(-2px);
    filter: drop-shadow(0 6px 16px rgba(0,0,0,0.25));
  }
`;

const SponsorsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 2rem;
  justify-items: center;
`;

const SponsorCard = styled(motion.div)`
  position: relative;
  width: 100%;
  max-width: 320px;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
  box-shadow: 0 8px 30px rgba(0,0,0,0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.12);
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;

  &:before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(120px 60px at 20% -10%, rgba(66,133,244,0.18), transparent 60%),
                radial-gradient(140px 70px at 120% 10%, rgba(234,67,53,0.16), transparent 60%);
    opacity: 0.75;
  }

  &:hover {
    transform: translateY(-10px) scale(1.01);
    box-shadow: 0 16px 40px rgba(0,0,0,0.35);
    border-color: rgba(255,255,255,0.22);
  }
`;

const SponsorLogo = styled.div`
  height: 200px;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0.00));
  border-bottom: 1px dashed rgba(255,255,255,0.10);

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    transition: transform 0.35s ease, filter 0.35s ease;
    will-change: transform;
  }
  
  ${SponsorCard}:hover & img {
    transform: scale(1.06) translateZ(0);
    filter: drop-shadow(0 6px 14px rgba(0,0,0,0.25));
  }
`;

const SponsorContent = styled.div`
  padding: 1.5rem;
  text-align: center;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.00));
`;

const SponsorName = styled.h4`
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const SponsorDescription = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 1rem;
`;

const SponsorLink = styled.a`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  text-decoration: none;
  padding: 0.5rem 0.875rem;
  border-radius: 10px;
  display: inline-block;
  background: rgba(66, 133, 244, 0.12);
  border: 1px solid rgba(66, 133, 244, 0.25);
  transition: background 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
  
  &:hover {
    transform: translateY(-2px);
    background: rgba(66, 133, 244, 0.18);
    box-shadow: 0 8px 16px rgba(66, 133, 244, 0.20);
  }
`;

// Dummy sponsors data
const sponsorsData = {
  platinum: [
    {
      id: 1,
      name: "Google Cloud",
      description: "Cloud computing services and APIs",
      logo: "https://res.cloudinary.com/dfstpdwih/image/upload/v1747640809/Codehelp/tmp-4-1747640809293.png",
      website: "https://cloud.google.com"
    },
    {
      id: 2,
      name: "Firebase",
      description: "App development platform",
      logo: "https://res.cloudinary.com/dfstpdwih/image/upload/v1747640084/Codehelp/tmp-2-1747640083929.png",
      website: "https://firebase.google.com"
    }
  ],
  gold: [
    {
      id: 3,
      name: "Android",
      description: "Mobile operating system",
      logo: "https://upload.wikimedia.org/wikipedia/commons/d/d7/Android_robot.svg",
      website: "https://android.com"
    },
    {
      id: 4,
      name: "TensorFlow",
      description: "Machine learning framework",
      logo: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Tensorflow_logo.svg",
      website: "https://tensorflow.org"
    },
    {
      id: 5,
      name: "Chrome",
      description: "Web browser and platform",
      logo: "https://upload.wikimedia.org/wikipedia/commons/8/87/Google_Chrome_icon_%282011%29.png",
      website: "https://www.google.com/chrome"
    }
  ],
  silver: [
    {
      id: 6,
      name: "Flutter",
      description: "UI toolkit for mobile apps",
      logo: "https://storage.googleapis.com/cms-storage-bucket/6a07d8a62f4308d2b854.svg",
      website: "https://flutter.dev"
    },
    {
      id: 7,
      name: "Angular",
      description: "Web application framework",
      logo: "https://angular.io/assets/images/logos/angular/angular.svg",
      website: "https://angular.io"
    },
    {
      id: 8,
      name: "Google Maps Platform",
      description: "Location-based services",
      logo: "https://upload.wikimedia.org/wikipedia/commons/a/aa/Google_Maps_icon_%282020%29.svg",
      website: "https://developers.google.com/maps"
    }
  ]
};

const SponsorsSection = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.1 });
  
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
  
  return (
    <SponsorsSectionContainer id="sponsors" className="animate-section">
      <SectionContent ref={sectionRef}>
        <SectionHeader>
          <SectionTitle>Our Previous Sponsors</SectionTitle>
          <SectionDescription>
            We're proud to partner with leading technology companies who share our vision of fostering innovation and learning in the developer community.
          </SectionDescription>
        </SectionHeader>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <SponsorsGrid>
            {/* Platinum Sponsors */}
            <SponsorTier>
              <TierTitle $type="platinum">Platinum Sponsors</TierTitle>
              <SponsorsList>
                {sponsorsData.platinum.map((sponsor) => (
                  <SponsorCard key={sponsor.id} variants={itemVariants}>
                    <SponsorLogo>
                      <img
                        src={sponsor.logo || FALLBACK_SPONSOR_LOGO}
                        alt={`${sponsor.name} logo`}
                        loading="lazy"
                        decoding="async"
                        onError={handleSponsorLogoError}
                      />
                    </SponsorLogo>
                    <SponsorContent>
                      <SponsorName>{sponsor.name}</SponsorName>
                      <SponsorDescription>{sponsor.description}</SponsorDescription>
                      <SponsorLink href={sponsor.website} target="_blank" rel="noopener noreferrer">
                        Visit Website
                      </SponsorLink>
                    </SponsorContent>
                  </SponsorCard>
                ))}
              </SponsorsList>
            </SponsorTier>
            
            {/* Gold Sponsors */}
            <SponsorTier>
              <TierTitle $type="gold">Gold Sponsors</TierTitle>
              <SponsorsList>
                {sponsorsData.gold.map((sponsor) => (
                  <SponsorCard key={sponsor.id} variants={itemVariants}>
                    <SponsorLogo>
                      <img
                        src={sponsor.logo || FALLBACK_SPONSOR_LOGO}
                        alt={`${sponsor.name} logo`}
                        loading="lazy"
                        decoding="async"
                        onError={handleSponsorLogoError}
                      />
                    </SponsorLogo>
                    <SponsorContent>
                      <SponsorName>{sponsor.name}</SponsorName>
                      <SponsorDescription>{sponsor.description}</SponsorDescription>
                      <SponsorLink href={sponsor.website} target="_blank" rel="noopener noreferrer">
                        Visit Website
                      </SponsorLink>
                    </SponsorContent>
                  </SponsorCard>
                ))}
              </SponsorsList>
            </SponsorTier>
            
            {/* Silver Sponsors */}
            <SponsorTier>
              <TierTitle $type="silver">Silver Sponsors</TierTitle>
              <SponsorsList>
                {sponsorsData.silver.map((sponsor) => (
                  <SponsorCard key={sponsor.id} variants={itemVariants}>
                    <SponsorLogo>
                      <img
                        src={sponsor.logo || FALLBACK_SPONSOR_LOGO}
                        alt={`${sponsor.name} logo`}
                        loading="lazy"
                        decoding="async"
                        onError={handleSponsorLogoError}
                      />
                    </SponsorLogo>
                    <SponsorContent>
                      <SponsorName>{sponsor.name}</SponsorName>
                      <SponsorDescription>{sponsor.description}</SponsorDescription>
                      <SponsorLink href={sponsor.website} target="_blank" rel="noopener noreferrer">
                        Visit Website
                      </SponsorLink>
                    </SponsorContent>
                  </SponsorCard>
                ))}
              </SponsorsList>
            </SponsorTier>
          </SponsorsGrid>
        </motion.div>
      </SectionContent>
    </SponsorsSectionContainer>
  );
};

export default SponsorsSection;
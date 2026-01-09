import { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ParticlesBackground from '../components/Particles';

// Reusing container styles slightly modified
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background.primary};
  display: flex;
  flex-direction: column;
  position: relative;
`;

const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8rem 2rem 4rem;
  z-index: 2;
`;

const VerificationCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  padding: 3rem;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.2);
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.text.primary};
  
  span {
    color: ${({ theme }) => theme.googleColors.blue.primary};
  }
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 2.5rem;
  line-height: 1.6;
`;

const InputGroup = styled.div`
  margin-bottom: 2rem;
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  border: 2px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1.1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.googleColors.blue.primary};
    box-shadow: 0 0 0 4px ${({ theme }) => `${theme.googleColors.blue.primary}20`};
  }
`;

const Button = styled.button`
  background: ${({ theme }) => theme.googleColors.blue.primary};
  color: white;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1.1rem;
  transition: transform 0.2s, box-shadow 0.2s;
  width: 100%;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(66, 133, 244, 0.3);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ResultCard = styled(motion.div)`
  margin-top: 2rem;
  padding: 2rem;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme, $success }) => 
    $success ? theme.googleColors.green.primary : theme.googleColors.red.primary};
`;

const CertificateVerification = () => {
  const [serial, setSerial] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!serial.trim()) return;

    setLoading(true);
    setError(null);
    
    // For now, simpler redirect to the display page if that's how it works
    // Or we could fetch here to pre-validate
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/certificates/verify/${serial}`);
        const data = await response.json();
        
        if (response.ok) {
            navigate(`/verification/${serial}`);
        } else {
            setError(data.message || 'Certificate not found');
        }
    } catch (err) {
        setError("Failed to verify certificate. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <PageContainer>
      <Header />
      <ParticlesBackground />
      <ContentWrapper>
        <VerificationCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Title>Verify <span>Certificate</span></Title>
          <Description>
            Enter your unique certificate serial number to verify its authenticity and view the details.
          </Description>
          
          <form onSubmit={handleVerify}>
            <InputGroup>
              <Input 
                type="text" 
                placeholder="Enter Serial Number (e.g. GDG-2024-XXX)" 
                value={serial} 
                onChange={(e) => setSerial(e.target.value)}
              />
            </InputGroup>
            
            <Button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Certificate'}
            </Button>
          </form>

          <AnimatePresence>
            {error && (
              <ResultCard
                $success={false}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p style={{ color: 'red' }}>{error}</p>
              </ResultCard>
            )}
          </AnimatePresence>
        </VerificationCard>
      </ContentWrapper>
      <Footer />
    </PageContainer>
  );
};

export default CertificateVerification;

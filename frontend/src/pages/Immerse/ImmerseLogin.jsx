import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { immersePublicApi } from '../../utils/immerseApi';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px;
`;

const GlowingOrb = styled.div`
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.3) 0%, transparent 70%);
  filter: blur(60px);
  animation: float 8s ease-in-out infinite;
  
  &:nth-child(1) { top: 10%; left: 10%; animation-delay: 0s; }
  &:nth-child(2) { bottom: 10%; right: 10%; animation-delay: 4s; background: radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%); }
  
  @keyframes float {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-30px) scale(1.1); }
  }
`;

const LoginCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 48px;
  width: 100%;
  max-width: 440px;
  position: relative;
  z-index: 10;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const LogoText = styled.h1`
  font-size: 42px;
  font-weight: 800;
  background: linear-gradient(135deg, #4f46e5 0%, #ec4899 50%, #f59e0b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -1px;
  margin: 0;
`;

const LogoSubtext = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin-top: 8px;
`;

const Title = styled.h2`
  color: white;
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 32px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  position: relative;
`;

const InputLabel = styled.label`
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  font-size: 16px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const SubmitButton = styled(motion.button)`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(79, 70, 229, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled(motion.div)`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 14px 16px;
  color: #f87171;
  font-size: 14px;
  text-align: center;
`;

const Footer = styled.div`
  text-align: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const FooterText = styled.p`
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  margin: 0;
`;

const ImmerseLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('credentials'); // 'credentials' or 'otp'
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpTimer, setOtpTimer] = useState(120); // 2 minutes
  const [canResendOtp, setCanResendOtp] = useState(false);

  // Handle OTP timer
  React.useEffect(() => {
    if (step === 'otp' && otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (otpTimer === 0 && step === 'otp') {
      setCanResendOtp(true);
    }
  }, [otpTimer, step]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
  };

  const handleInitiateLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await immersePublicApi.post('/auth/initiate-login', formData);
      
      if (response.data.success) {
        setStep('otp');
        setOtpTimer(120);
        setCanResendOtp(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await immersePublicApi.post('/auth/verify-otp', {
        email: formData.email,
        otp
      });
      
      if (response.data.success) {
        localStorage.setItem('immerseToken', response.data.token);
        localStorage.setItem('immerseAdmin', JSON.stringify(response.data.admin));
        navigate('/immerse/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setCanResendOtp(false);
    setOtpTimer(120);
    setOtp('');
    setError('');
    
    try {
      const response = await immersePublicApi.post('/auth/initiate-login', formData);
      if (response.data.success) {
        // OTP resent successfully
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
      setCanResendOtp(true);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setOtp('');
    setError('');
    setOtpTimer(120);
    setCanResendOtp(false);
  };

  return (
    <PageContainer>
      <GlowingOrb />
      <GlowingOrb />
      
      <LoginCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Logo>
          <LogoText>IMMERSE</LogoText>
          <LogoSubtext>Administration Portal</LogoSubtext>
        </Logo>
        
        <Title>{step === 'credentials' ? 'Welcome Back' : 'Verify OTP'}</Title>
        
        <Form onSubmit={step === 'credentials' ? handleInitiateLogin : handleVerifyOtp}>
          {error && (
            <ErrorMessage
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </ErrorMessage>
          )}
          
          {step === 'credentials' ? (
            <>
              <InputGroup>
                <InputLabel>Email Address</InputLabel>
                <Input
                  type="email"
                  name="email"
                  placeholder="priyanshudlw1@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </InputGroup>
              
              <InputGroup>
                <InputLabel>Password</InputLabel>
                <Input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </InputGroup>
            </>
          ) : (
            <>
              <InputGroup>
                <InputLabel>One-Time Password (OTP)</InputLabel>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={otp}
                  onChange={handleOtpChange}
                  maxLength="6"
                  required
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginTop: '8px',
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  <span>🔒 Expires in {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResendOtp}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: canResendOtp ? '#4f46e5' : 'rgba(255, 255, 255, 0.3)',
                      cursor: canResendOtp ? 'pointer' : 'not-allowed',
                      fontSize: '12px',
                      textDecoration: 'underline'
                    }}
                  >
                    Resend OTP
                  </button>
                </div>
              </InputGroup>

              <button
                type="button"
                onClick={handleBackToCredentials}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginTop: '12px',
                  transition: 'all 0.3s ease',
                  marginBottom: '12px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                ← Back to Login
              </button>
            </>
          )}
          
          <SubmitButton
            type="submit"
            disabled={loading || (step === 'otp' && otp.length !== 6)}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Processing...' : (step === 'credentials' ? 'Continue' : 'Verify OTP')}
          </SubmitButton>
        </Form>
        
        <Footer>
          <FooterText>
            IMMERSE 2026 • MMMUT, Gorakhpur
          </FooterText>
        </Footer>
      </LoginCard>
    </PageContainer>
  );
};

export default ImmerseLogin;

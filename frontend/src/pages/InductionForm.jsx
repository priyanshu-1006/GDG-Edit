import { useState, useEffect } from 'react';
import styled, { keyframes, useTheme } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Hash, Code, Layers, 
  Github, Linkedin, MessageSquare, Users,
  Trophy, FileText, Send, CheckCircle, AlertCircle, ArrowLeft, LogOut, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../contexts/useAuth';

// Animations
const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
`;

// Styled Components
const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${p => p.theme.name === 'dark'
    ? 'linear-gradient(135deg, #05070f 0%, #0c1730 50%, #05070f 100%)'
    : 'linear-gradient(135deg, #f8fbff 0%, #eef4ff 45%, #f7faff 100%)'};
  position: relative;
  overflow: hidden;
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
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  position: relative;
  z-index: 1;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${p => p.theme.name === 'dark' ? 'rgba(255,255,255,0.58)' : 'rgba(0,0,0,0.58)'};
  font-size: 0.9rem;
  text-decoration: none;
  margin-bottom: 2rem;
  transition: color 0.2s;
  
  &:hover { color: ${p => p.theme.colors.primary}; }
`;

const Header = styled(motion.div)`
  text-align: center;
  margin-bottom: 3rem;
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 1rem;
`;

const GoogleDots = styled.div`
  display: flex;
  gap: 6px;
`;

const Dot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${p => p.color};
  animation: ${pulse} 2s ease-in-out infinite;
  animation-delay: ${p => p.delay || '0s'};
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #4285f4, #34a853, #fbbc04, #ea4335);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${gradientShift} 4s ease infinite;
  margin-bottom: 0.5rem;
  
  @media (max-width: 480px) { font-size: 1.8rem; }
`;

const Subtitle = styled.p`
  color: ${p => p.theme.colors.text.secondary};
  font-size: 1.05rem;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
`;

const FormCard = styled(motion.form)`
  background: ${p => p.theme.name === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.92)'};
  backdrop-filter: blur(16px);
  border: 1px solid ${p => p.theme.name === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(32,33,36,0.12)'};
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: ${p => p.theme.colors.shadows?.medium || '0 8px 24px rgba(0,0,0,0.12)'};
  
  @media (max-width: 480px) { padding: 1.5rem; }
`;

const SectionTitle = styled.h3`
  color: ${p => p.theme.colors.text.primary};
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  margin-top: ${p => p.$mt ? '2rem' : '0'};
  display: flex;
  align-items: center;
  gap: 10px;
  
  svg { color: #4285f4; }
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const FieldGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  color: ${p => p.theme.colors.text.secondary};
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 6px;
  
  span { color: #ea4335; }
`;

const InputWrapper = styled.div`
  position: relative;
  
  svg {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: ${p => p.theme.name === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'};
    width: 18px;
    height: 18px;
    pointer-events: none;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px 12px ${p => p.$hasIcon ? '44px' : '14px'};
  background: ${p => p.theme.name === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)'};
  border: 1px solid ${p => p.theme.name === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(32,33,36,0.14)'};
  border-radius: 12px;
  color: ${p => p.theme.colors.text.primary};
  font-size: 0.95rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
  
  &::placeholder { color: ${p => p.theme.colors.text.tertiary}; }
  &:focus {
    outline: none;
    border-color: #4285f4;
    background: rgba(66,133,244,0.06);
    box-shadow: 0 0 0 3px rgba(66,133,244,0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 14px;
  background: ${p => p.theme.name === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)'};
  border: 1px solid ${p => p.theme.name === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(32,33,36,0.14)'};
  border-radius: 12px;
  color: ${p => p.theme.colors.text.primary};
  font-size: 0.95rem;
  font-family: 'Inter', sans-serif;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s;
  
  &::placeholder { color: ${p => p.theme.colors.text.tertiary}; }
  &:focus {
    outline: none;
    border-color: #4285f4;
    background: rgba(66,133,244,0.06);
    box-shadow: 0 0 0 3px rgba(66,133,244,0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 14px;
  background: ${p => p.theme.name === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)'};
  border: 1px solid ${p => p.theme.name === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(32,33,36,0.14)'};
  border-radius: 12px;
  color: ${p => p.theme.colors.text.primary};
  font-size: 0.95rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
  cursor: pointer;
  
  option {
    background: ${p => p.theme.name === 'dark' ? '#1f2937' : '#ffffff'};
    color: ${p => p.theme.name === 'dark' ? '#ffffff' : '#202124'};
  }
  &:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66,133,244,0.1);
  }
`;

const CheckboxGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  
  @media (max-width: 560px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: ${p => p.$checked
    ? 'rgba(66,133,244,0.15)'
    : (p.theme.name === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')};
  border: 1px solid ${p => p.$checked
    ? 'rgba(66,133,244,0.4)'
    : (p.theme.name === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(32,33,36,0.1)')};
  border-radius: 10px;
  color: ${p => p.$checked ? '#8ab4f8' : p.theme.colors.text.secondary};
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(66,133,244,0.1);
    border-color: rgba(66,133,244,0.3);
  }
  
  input { display: none; }
`;



const Divider = styled.div`
  height: 1px;
  background: linear-gradient(to right, transparent, ${p => p.theme.name === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(32,33,36,0.14)'}, transparent);
  margin: 2rem 0;
`;

const SubmitButton = styled(motion.button)`
  width: 100%;
  padding: 16px 32px;
  background: linear-gradient(135deg, #4285f4, #34a853);
  background-size: 200% 200%;
  border: none;
  border-radius: 14px;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 2rem;
  animation: ${gradientShift} 3s ease infinite;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(66,133,244,0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatusMessage = styled(motion.div)`
  padding: 16px 20px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  margin-top: 1.5rem;
  
  ${p => p.$type === 'success' && `
    background: rgba(52,168,83,0.1);
    border: 1px solid rgba(52,168,83,0.3);
    color: #81c995;
  `}
  ${p => p.$type === 'error' && `
    background: rgba(234,67,53,0.1);
    border: 1px solid rgba(234,67,53,0.3);
    color: #f28b82;
  `}
`;

const SuccessCard = styled(motion.div)`
  text-align: center;
  padding: 3rem 2rem;
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(52,168,83,0.2);
  border-radius: 20px;
`;

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(52,168,83,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: #34a853;
`;

// Domain options
const DOMAIN_OPTIONS = [
  'Web Dev', 'AI/ML', 'Cybersecurity', 'Management', 'UI/UX', 'Competitive Programming'
];

const BRANCH_OPTIONS = [
  'Computer Science and Engineering (CSE)',
  'Information Technology (IT)',
  'Electronics and Communication Engineering (ECE)',
  'Electrical Engineering (EE)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CE)',
  'Chemical Engineering (CHE)'
];

// Map CSV department names to dropdown option values
const mapDepartmentToBranch = (department) => {
  if (!department) return '';
  // Direct match first
  const exact = BRANCH_OPTIONS.find(b => b === department);
  if (exact) return exact;
  // Fuzzy match: CSV stores "Computer Science and Engineering", dropdown uses "Computer Science and Engineering (CSE)"
  const match = BRANCH_OPTIONS.find(b => b.toLowerCase().startsWith(department.toLowerCase()));
  if (match) return match;
  // Reverse: check if department contains option base name
  const reverseMatch = BRANCH_OPTIONS.find(b => department.toLowerCase().includes(b.split(' (')[0].toLowerCase()));
  if (reverseMatch) return reverseMatch;
  return department;
};
const InfoCard = styled(motion.div)`
  background: ${p => p.theme.name === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.94)'};
  backdrop-filter: blur(16px);
  border: 1px solid ${p => p.theme.name === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(32,33,36,0.12)'};
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  text-align: left;

  @media (max-width: 768px) {
    padding: 1.35rem;
    border-radius: 16px;
  }
`;

const InfoHeading = styled.h2`
  color: ${p => p.theme.colors.text.primary};
  font-size: 1.45rem;
  margin: 0 0 0.4rem 0;
`;

const InfoQuote = styled.p`
  color: ${p => p.theme.colors.text.secondary};
  font-style: italic;
  margin: 0 0 1.2rem 0;
  line-height: 1.6;
`;

const InfoBody = styled.div`
  color: ${p => p.theme.colors.text.secondary};
  line-height: 1.7;
  font-size: 0.95rem;

  p {
    margin: 0 0 0.9rem 0;
  }
`;

const RoundList = styled.ul`
  margin: 0.7rem 0 1rem 1.1rem;
  padding: 0;
  color: ${p => p.theme.colors.text.secondary};

  li { margin-bottom: 0.6rem; }
`;

const HighlightNotice = styled.div`
  background: ${p => p.theme.name === 'dark' ? 'rgba(251, 188, 4, 0.12)' : 'rgba(251, 188, 4, 0.2)'};
  border: 1px solid rgba(251, 188, 4, 0.35);
  color: ${p => p.theme.name === 'dark' ? '#fdd663' : '#7c4a00'};
  border-radius: 12px;
  padding: 12px 14px;
  margin-top: 1rem;
  font-size: 0.92rem;
  line-height: 1.5;
`;

const AuthDivider = styled.div`
  height: 1px;
  margin: 1.35rem 0 1.1rem;
  background: linear-gradient(
    to right,
    transparent,
    ${p => p.theme.name === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(32,33,36,0.18)'},
    transparent
  );
`;

const AuthActionWrap = styled.div`
  max-width: 560px;
  margin: 0 auto;
  text-align: center;
`;

const ShieldWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 0.8rem;
`;

const LoginTitle = styled.h2`
  color: ${p => p.theme.colors.text.primary};
  font-size: 1.4rem;
  margin: 0 0 0.5rem 0;
`;

const LoginText = styled.p`
  color: ${p => p.theme.colors.text.secondary};
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
`;

const NoteBox = styled.div`
  background: ${p => p.theme.name === 'dark' ? 'rgba(234, 67, 53, 0.1)' : 'rgba(234, 67, 53, 0.12)'};
  border: 1px solid rgba(234, 67, 53, 0.26);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const NoteText = styled.p`
  color: ${p => p.theme.name === 'dark' ? '#f28b82' : '#b3261e'};
  font-size: 0.9rem;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const GoogleButton = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 14px 32px;
  background: ${p => p.theme.name === 'dark' ? '#fff' : '#ffffff'};
  border: none;
  border-radius: 12px;
  color: #3c4043;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  cursor: pointer;
  margin-top: 1.5rem;
  transition: all 0.2s;
  box-shadow: ${p => p.theme.name === 'dark' ? '0 2px 8px rgba(0,0,0,0.15)' : '0 2px 12px rgba(0,0,0,0.12)'};
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    transform: translateY(-2px);
  }
  
  img { width: 20px; height: 20px; }

  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
    margin-top: 0.9rem;
    padding: 13px 20px;
  }
`;

const UserBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(52,168,83,0.08);
  border: 1px solid rgba(52,168,83,0.2);
  border-radius: 14px;
  margin-bottom: 2rem;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(52,168,83,0.4);
`;

const UserEmail = styled.span`
  color: rgba(255,255,255,0.8);
  font-size: 0.9rem;
  font-weight: 500;
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  color: rgba(255,255,255,0.6);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
  
  &:hover {
    background: rgba(234,67,53,0.1);
    border-color: rgba(234,67,53,0.3);
    color: #f28b82;
  }
`;


const LoadingDots = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 3rem 0;
  
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



const InductionForm = () => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', branch: '', section: '', rollNumber: '',
    techStack: '', domains: [], projects: '', githubId: '', linkedinUrl: '',
    whyJoin: '', interestingFact: '', otherClubs: '', residenceType: '',
    codeforcesId: '', codechefId: '', hackerrankId: '', resumeUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Form Open Status
  const [isInductionOpen, setIsInductionOpen] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);

  // Auth state
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const { login: globalLogin } = useAuth();
  
  // Resume Parsing state
  const [resumeChoice, setResumeChoice] = useState(null); // 'with' or 'without'
  const theme = useTheme();
  const [resumeUploading, setResumeUploading] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/induction/status`);
        const data = await response.json();
        if (data.success) {
          setIsInductionOpen(data.isInductionOpen);
        }
      } catch (err) {
        console.error("Failed to fetch induction status:", err);
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();

    const checkAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');
      const mainTokenFromUrl = params.get('mainToken');
      const errorFromUrl = params.get('error');

      if (errorFromUrl) {
        setAuthError(decodeURIComponent(errorFromUrl));
        setAuthLoading(false);
        window.history.replaceState({}, '', '/induction');
        return;
      }

      const token = tokenFromUrl || sessionStorage.getItem('inductionToken');

      if (tokenFromUrl) {
        sessionStorage.setItem('inductionToken', tokenFromUrl);
        // Also store the main app token for global site-wide auth
        if (mainTokenFromUrl) {
          localStorage.setItem('token', mainTokenFromUrl);
          globalLogin(); // Notify AuthContext to fetch user profile
        }
        window.history.replaceState({}, '', '/induction');
      }

      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/induction/auth/verify`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success) {
          setAuthenticated(true);
          setAuthUser(data.user);
          
          setFormData(prev => ({
            ...prev,
            email: data.user.email || '',
            firstName: data.user.firstName || '',
            lastName: data.user.lastName || '',
            branch: mapDepartmentToBranch(data.user.department) || prev.branch,
            section: data.user.section || '',
            rollNumber: data.user.rollNo || ''
          }));
        } else {
          sessionStorage.removeItem('inductionToken');
          setAuthError('Session expired. Please sign in again.');
        }
      } catch {
        sessionStorage.removeItem('inductionToken');
        setAuthError('Failed to verify session. Please try again.');
      }

      setAuthLoading(false);
    };

    checkAuth();
  }, [globalLogin]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/induction/auth/google`;
  };

  const handleLogout = () => {
    sessionStorage.removeItem('inductionToken');
    setAuthenticated(false);
    setAuthError(null);
    setFormData(prev => ({ ...prev, email: '', firstName: '', lastName: '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setResumeUploading(true);
    setAuthError(null);

    const form = new FormData();
    form.append('resume', file);

    try {
      const token = sessionStorage.getItem('inductionToken');
      const response = await fetch(`${API_BASE_URL}/api/induction/parse-resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form
      });

      const data = await response.json();
      if (data.success) {
         if (data.parsedData) {
            setFormData(prev => ({
              ...prev,
              techStack: data.parsedData.techStack || prev.techStack,
              projects: data.parsedData.projects || prev.projects,
              githubId: data.parsedData.githubId || prev.githubId,
              linkedinUrl: data.parsedData.linkedinUrl || prev.linkedinUrl,
              resumeUrl: data.resumeUrl || prev.resumeUrl
            }));
         } else {
            setFormData(prev => ({ ...prev, resumeUrl: data.resumeUrl || prev.resumeUrl }));
         }
         setResumeChoice('with');
      } else {
         setAuthError(data.message || 'Failed to parse resume');
      }
    } catch {
       setAuthError('Failed to upload resume. Please try again or skip.');
    } finally {
       setResumeUploading(false);
    }
  };

  const handleDownloadResume = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('inductionToken');
      const response = await fetch(`${API_BASE_URL}/api/induction/download-resume?url=${encodeURIComponent(formData.resumeUrl)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to download');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'uploaded_resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to securely download the resume preview');
    }
  };

  const handleDomainToggle = (domain) => {
    setFormData(prev => ({
      ...prev,
      domains: prev.domains.includes(domain)
        ? prev.domains.filter(d => d !== domain)
        : [...prev.domains, domain]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const token = sessionStorage.getItem('inductionToken');
      const response = await fetch(`${API_BASE_URL}/api/induction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        sessionStorage.removeItem('inductionToken');
      } else {
        setStatus({ type: 'error', message: data.message });
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Status block gate
  if (statusLoading) {
    return (
      <PageWrapper>
        <BackgroundOrbs />
        <Container>
          <Header initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Title>GDG MMMUT Induction</Title>
            <Subtitle>Checking form availability...</Subtitle>
          </Header>
          <LoadingDots>
            <span /><span /><span /><span />
          </LoadingDots>
        </Container>
      </PageWrapper>
    );
  }

  if (!isInductionOpen) {
    return (
      <PageWrapper>
        <BackgroundOrbs />
        <Container>
          <Header 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(234, 67, 53, 0.1)', padding: '16px', borderRadius: '50%' }}>
                <Shield size={48} color="#ea4335" />
              </div>
            </div>
            <Title>Applications Closed</Title>
            <Subtitle style={{ fontSize: '1.1rem', marginTop: '1rem', maxWidth: '500px' }}>
              Thank you for your interest in GDG MMMUT. The induction process is currently closed. 
              Please stay tuned to our social media for future opportunities!
            </Subtitle>
          </Header>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
            <BackLink to="/" style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <ArrowLeft size={18} /> Return to Home
            </BackLink>
          </div>
        </Container>
      </PageWrapper>
    );
  }

  // Auth loading state
  if (authLoading) {
    return (
      <PageWrapper>
        <BackgroundOrbs />
        <Container>
          <Header initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Title>GDG MMMUT Induction</Title>
            <Subtitle>Checking authentication...</Subtitle>
          </Header>
          <LoadingDots>
            <span /><span /><span /><span />
          </LoadingDots>
        </Container>
      </PageWrapper>
    );
  }

  // Login gate — show Google Sign-In
  if (!authenticated) {
    return (
      <PageWrapper>
        <BackgroundOrbs />
        <Container>
          <BackLink to="/">
            <ArrowLeft size={18} /> Back to Home
          </BackLink>

          <Header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <LogoRow>
              <GoogleDots>
                <Dot color="#4285f4" delay="0s" />
                <Dot color="#ea4335" delay="0.2s" />
                <Dot color="#fbbc04" delay="0.4s" />
                <Dot color="#34a853" delay="0.6s" />
              </GoogleDots>
            </LogoRow>
            <Title>GDG MMMUT Induction</Title>
            <Subtitle>
              INDUCTION 2026
            </Subtitle>
          </Header>

          <InfoCard
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <InfoHeading>INDUCTION 2026</InfoHeading>
            <InfoQuote>
              &quot;Every new beginning is an opportunity to build something greater than before.&quot; — Immanuel Kant
            </InfoQuote>

            <InfoBody>
              <p>
                Hey Tech Enthusiasts! Step into a community where innovation meets collaboration.
                GDG On Campus MMMUT invites passionate individuals to be a part of a vibrant tech ecosystem.
                Whether you love coding, designing, problem-solving, or exploring new technologies,
                this is your chance to learn, grow, and create meaningful impact alongside like-minded peers.
              </p>
              <p><strong>Induction Process:</strong></p>
              <RoundList>
                <li><strong>Round 1 – Registration &amp; Shortlisting:</strong> Registrations open from <strong>24th March to 30th March 2026</strong>. Applicants are shortlisted based on form responses.</li>
                <li><strong>Round 2 – Online Personal Interview:</strong> Shortlisted candidates are evaluated on technical understanding and overall approach.</li>
                <li><strong>Round 3 – Offline Personal Interview:</strong> Final shortlisted candidates appear for an offline interview with the GDG team.</li>
              </RoundList>
              <p><strong>Registration:</strong> Fill the form on this page during the registration window.</p>
            </InfoBody>

            <HighlightNotice>
              <strong>Important:</strong> For registration, you need to use your college mail (@mmmut.ac.in) first,
              then click <strong>Continue with Google</strong>.
            </HighlightNotice>

            <AuthDivider />

            <AuthActionWrap>
              <ShieldWrap>
                <Shield size={44} style={{ color: '#4285f4' }} />
              </ShieldWrap>

              <LoginTitle>Login to Continue</LoginTitle>

              <LoginText>
                Use your college email first, then continue with Google.
              </LoginText>

              <NoteBox>
                <NoteText>
                  <AlertCircle size={16} />
                  <strong>Note:</strong> Login can be done only through college email (@mmmut.ac.in)
                </NoteText>
              </NoteBox>

              <GoogleButton
                onClick={handleGoogleLogin}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                Sign in with Google
              </GoogleButton>

              {authError && (
                <StatusMessage
                  $type="error"
                  style={{ marginTop: '1.1rem', justifyContent: 'center' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <AlertCircle size={18} />
                  {authError}
                </StatusMessage>
              )}
            </AuthActionWrap>
          </InfoCard>
        </Container>
      </PageWrapper>
    );
  }

  // Intermediate Step: Choose to upload resume or skip
  if (authenticated && !resumeChoice) {
    return (
      <PageWrapper>
        <BackgroundOrbs />
        <Container>
          <Header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <LogoRow>
              <GoogleDots>
                <Dot color="#4285f4" delay="0s" />
                <Dot color="#ea4335" delay="0.2s" />
                <Dot color="#fbbc04" delay="0.4s" />
                <Dot color="#34a853" delay="0.6s" />
              </GoogleDots>
            </LogoRow>
            <Title>Smart Auto-Fill ⚡</Title>
            <Subtitle>Save time by letting AI fill out your application!</Subtitle>
          </Header>
          
          <FormCard as="div" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {authError && <StatusMessage $type="error"><AlertCircle size={18} /> {authError}</StatusMessage>}
            
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              {resumeUploading ? (
                <>
                  <LoadingDots><span></span><span></span><span></span><span></span></LoadingDots>
                  <p style={{ color: theme.colors.text.secondary, marginTop: '1rem' }}>Reading resume and extracting skills using AI...</p>
                </>
              ) : (
                <>
                  <FileText size={48} color="#fbbc04" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                  <h3 style={{ color: theme.colors.text.primary, fontSize: '1.25rem', marginBottom: '1rem' }}>Upload your Resume (Optional)</h3>
                  <p style={{ color: theme.colors.text.secondary, lineHeight: '1.6', marginBottom: '2rem' }}>
                    We can automatically extract your <strong>Programming Languages</strong>, <strong>Projects</strong>, <strong>GitHub</strong>, and <strong>LinkedIn</strong> links.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto' }}>
                    <input type="file" id="resume-upload" hidden accept=".pdf" onChange={handleResumeUpload} />
                    <GoogleButton as="label" htmlFor="resume-upload" style={{ width: '100%', justifyContent: 'center', background: '#4285f4', color: 'white', margin: 0 }}>
                      Upload PDF Resume
                    </GoogleButton>
                    
                    <GoogleButton 
                      onClick={(e) => { e.preventDefault(); setResumeChoice('without'); }} 
                      type="button"
                      style={{ width: '100%', justifyContent: 'center', background: theme.name === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)', color: theme.colors.text.primary, margin: 0 }}
                    >
                      Skip Resume
                    </GoogleButton>
                  </div>
                </>
              )}
            </div>
          </FormCard>
        </Container>
      </PageWrapper>
    );
  }

  if (submitted) {
    return (
      <PageWrapper>
        <BackgroundOrbs />
        <Container>
          <BackLink to="/">
            <ArrowLeft size={18} /> Back to Home
          </BackLink>
          <SuccessCard
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <SuccessIcon>
              <CheckCircle size={40} />
            </SuccessIcon>
            <Title style={{ fontSize: '2rem' }}>Application Submitted!</Title>
            <Subtitle style={{ marginTop: '0.5rem' }}>
              Thank you for your interest in joining GDG MMMUT! We&apos;ll review your application and get back to you soon. Keep building! 🚀
            </Subtitle>
            <Link to="/" style={{ display: 'inline-block', marginTop: '2rem' }}>
              <SubmitButton
                as="span"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ width: 'auto', padding: '14px 40px' }}
              >
                <ArrowLeft size={18} /> Back to Home
              </SubmitButton>
            </Link>
          </SuccessCard>
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

        <Header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <LogoRow>
            <GoogleDots>
              <Dot color="#4285f4" delay="0s" />
              <Dot color="#ea4335" delay="0.2s" />
              <Dot color="#fbbc04" delay="0.4s" />
              <Dot color="#34a853" delay="0.6s" />
            </GoogleDots>
          </LogoRow>
          <Title>GDG MMMUT Induction</Title>
          <Subtitle>
            Join the Google Developer Group at MMMUT! Fill out this form and we&apos;ll review your application.
          </Subtitle>
        </Header>

        <FormCard
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Authenticated User Bar */}
          <UserBar>
            <UserInfo>
              {authUser?.avatar && (
                <Avatar 
                  src={authUser.avatar} 
                  alt="" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = `https://ui-avatars.com/api/?name=${formData.email}&background=34a853&color=fff`; 
                  }} 
                />
              )}
              <UserEmail>{formData.email}</UserEmail>
            </UserInfo>
            <LogoutButton onClick={handleLogout}>
              <LogOut size={14} /> Sign out
            </LogoutButton>
          </UserBar>

          {/* Personal Info */}
          <SectionTitle><User size={20} /> Personal Information</SectionTitle>
          
          <FieldRow>
            <FieldGroup>
              <Label>First Name <span>*</span></Label>
              <InputWrapper>
                <User />
                <Input $hasIcon name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Enter first name" required />
              </InputWrapper>
            </FieldGroup>
            <FieldGroup>
              <Label>Last Name <span>*</span></Label>
              <InputWrapper>
                <User />
                <Input $hasIcon name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Enter last name" required />
              </InputWrapper>
            </FieldGroup>
          </FieldRow>

          <FieldGroup>
            <Label>Email Address <span>*</span> (verified via Google)</Label>
            <InputWrapper>
              <Mail />
              <Input $hasIcon type="email" name="email" value={formData.email} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </InputWrapper>
          </FieldGroup>

          <FieldGroup>
            <Label>Phone Number <span>*</span></Label>
            <InputWrapper>
              <Hash />
              <Input $hasIcon type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" required />
            </InputWrapper>
          </FieldGroup>

          <FieldRow>
            <FieldGroup>
              <Label>Branch <span>*</span></Label>
              <Select 
                name="branch" 
                value={formData.branch} 
                onChange={handleChange} 
                required
                disabled={!!authUser?.department}
                style={authUser?.department ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                <option value="">Select Branch</option>
                {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
              </Select>
            </FieldGroup>
            
            <FieldGroup>
              <Label>Section <span>*</span></Label>
              <Select 
                name="section" 
                value={formData.section} 
                onChange={handleChange} 
                required
                disabled={!!authUser?.section}
                style={authUser?.section ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                <option value="">Select Section</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </Select>
            </FieldGroup>
          </FieldRow>
          
          <FieldRow>
            <FieldGroup>
              <Label>Roll No. <span>*</span></Label>
              <InputWrapper>
                <Hash />
                <Input 
                  $hasIcon 
                  name="rollNumber" 
                  value={formData.rollNumber} 
                  onChange={handleChange} 
                  placeholder="202XXXXXXX" 
                  required 
                  readOnly={!!authUser?.rollNo}
                  style={authUser?.rollNo ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                />
              </InputWrapper>
            </FieldGroup>
            <FieldGroup>
              <Label>Hosteler / Day Scholar <span>*</span></Label>
              <Select name="residenceType" value={formData.residenceType} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="Hosteler">Hosteler</option>
                <option value="Day Scholar">Day Scholar</option>
              </Select>
            </FieldGroup>
          </FieldRow>


          <Divider />

          {/* Technical Info */}
          <SectionTitle $mt><Code size={20} /> Technical Background</SectionTitle>

          <FieldGroup>
            <Label>Known Programming Languages</Label>
            <InputWrapper>
              <Code />
              <Input $hasIcon name="techStack" value={formData.techStack} onChange={handleChange} placeholder="C, C++, Java, Python, JavaScript, etc." />
            </InputWrapper>
          </FieldGroup>

          <FieldGroup>
            <Label>Domains of Interest</Label>
            <CheckboxGrid>
              {DOMAIN_OPTIONS.map(domain => (
                <CheckboxLabel key={domain} $checked={formData.domains.includes(domain)}>
                  <input type="checkbox" checked={formData.domains.includes(domain)} onChange={() => handleDomainToggle(domain)} />
                  {domain}
                </CheckboxLabel>
              ))}
            </CheckboxGrid>
          </FieldGroup>

          <FieldGroup>
            <Label>Projects (describe briefly)</Label>
            <TextArea name="projects" value={formData.projects} onChange={handleChange} placeholder="Describe your notable projects..." />
          </FieldGroup>

          <Divider />

          {/* Profiles */}
          <SectionTitle $mt><Layers size={20} /> Online Profiles</SectionTitle>
          
          <FieldRow>
            <FieldGroup>
              <Label>GitHub ID <span>*</span></Label>
              <InputWrapper>
                <Github />
                <Input $hasIcon name="githubId" value={formData.githubId} onChange={handleChange} placeholder="username" required />
              </InputWrapper>
            </FieldGroup>
            <FieldGroup>
              <Label>LinkedIn URL <span>*</span></Label>
              <InputWrapper>
                <Linkedin />
                <Input $hasIcon name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} placeholder="linkedin.com/in/username" required />
              </InputWrapper>
            </FieldGroup>
          </FieldRow>

          <FieldRow>
            <FieldGroup>
              <Label>Codeforces ID (optional)</Label>
              <InputWrapper>
                <Trophy />
                <Input $hasIcon name="codeforcesId" value={formData.codeforcesId} onChange={handleChange} placeholder="codeforces_handle" />
              </InputWrapper>
            </FieldGroup>
            <FieldGroup>
              <Label>CodeChef ID (optional)</Label>
              <InputWrapper>
                <Trophy />
                <Input $hasIcon name="codechefId" value={formData.codechefId} onChange={handleChange} placeholder="codechef_handle" />
              </InputWrapper>
            </FieldGroup>
          </FieldRow>

          <FieldGroup>
            <Label>HackerRank ID (optional)</Label>
            <InputWrapper>
              <Trophy />
              <Input $hasIcon name="hackerrankId" value={formData.hackerrankId} onChange={handleChange} placeholder="hackerrank_handle" />
            </InputWrapper>
          </FieldGroup>

          <Divider />

          {/* About You */}
          <SectionTitle $mt><MessageSquare size={20} /> About You</SectionTitle>

          <FieldGroup>
            <Label>Why do you want to join GDG MMMUT? <span>*</span></Label>
            <TextArea name="whyJoin" value={formData.whyJoin} onChange={handleChange} placeholder="Tell us your motivation..." required />
          </FieldGroup>

          <FieldGroup>
            <Label>Tell us something interesting about yourself <span>*</span></Label>
            <TextArea name="interestingFact" value={formData.interestingFact} onChange={handleChange} placeholder="A fun fact, hobby, or achievement..." rows={3} required />
          </FieldGroup>

          <FieldGroup>
            <Label>Any other clubs you&apos;re part of? <span>*</span></Label>
            <InputWrapper>
              <Users />
              <Input $hasIcon name="otherClubs" value={formData.otherClubs} onChange={handleChange} placeholder="e.g., Coding Club, Robotics Club" required />
            </InputWrapper>
          </FieldGroup>

          {resumeChoice === 'with' && formData.resumeUrl && (
            <FieldGroup style={{ background: 'rgba(52, 168, 83, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(52, 168, 83, 0.2)' }}>
              <Label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34a853', margin: 0 }}>
                <CheckCircle size={16} /> Resume Uploaded & Parsed Successfully
              </Label>
              <a href="#" onClick={handleDownloadResume} style={{ color: theme.colors.text.secondary, fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.75rem', transition: 'color 0.2s', cursor: 'pointer' }} onMouseOver={e => e.target.style.color = theme.colors.text.primary} onMouseOut={e => e.target.style.color = theme.colors.text.secondary}>
                <FileText size={16} /> Click here to view uploaded PDF
              </a>
            </FieldGroup>
          )}

          <SubmitButton
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? (
              <>Submitting...</>
            ) : (
              <>
                <Send size={20} />
                Submit Application
              </>
            )}
          </SubmitButton>

          <AnimatePresence>
            {status && (
              <StatusMessage
                $type={status.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {status.message}
              </StatusMessage>
            )}
          </AnimatePresence>
        </FormCard>
      </Container>
    </PageWrapper>
  );
};

export default InductionForm;

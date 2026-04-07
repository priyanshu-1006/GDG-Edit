import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Github as GitHub, Twitter, Mail, Camera, ChevronLeft, ChevronRight, Calendar, MapPin } from "lucide-react";
import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "../config/api";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../contexts/useAuth";
import {
  FormContainer,
  FormHeader,
  Title,
  Subtitle,
  Form,
  FormGroup,
  Label,
  Input,
  ErrorMessage,
  Button,
  CheckboxContainer,
  Checkbox,
  CheckboxLabel,
  PasswordWrapper,
  PasswordToggle,
  Divider,
  SwitchText,
  SocialButton,
  SocialButtonsContainer,
} from "../components/FormElements";

 
import PasswordStrengthMeter from "../components/PasswordStrength";
import ThemeToggle from "../components/ThemeToggle";
import AnimatedParticles from "../components/AnimatedParticles";
import { fetchEvents } from "../utils/eventService";

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: stretch;
  justify-content: center;
  position: relative;
  padding: 24px;
  overflow: hidden;
  gap: 24px;
  
  @media (max-width: 768px) {
    padding: 16px;
    gap: 12px;
  }
`;

const LeftPanel = styled.div`
  flex: 1 1 0;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  overflow: hidden;
  border-radius: 16px;
  background: transparent; /* removed blue background */
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const CarouselContainer = styled.div`
  width: 100%;
  max-width: 600px;
  position: relative;
  z-index: 1;
  margin-top: 12px; /* nudge the image/card a bit down */
`;

const CarouselCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.background.primary};
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  display: flex;
  flex-direction: column;
`;

const CarouselImage = styled.div`
  width: 100%;
  height: 200px;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(to top, ${({ theme }) => theme.colors.background.primary}, transparent);
  }
`;

const CarouselContent = styled.div`
  padding: 2rem;
  /* Let content size naturally and remove scrollbars */
  overflow: visible;
`;

const CarouselTitle = styled.h3`
  font-family: 'Google Sans', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 0.75rem;
`;

const CarouselMeta = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
  
  svg {
    color: ${({ theme }) => theme.googleColors.blue.main};
  }
`;

const CarouselDescription = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.95rem;
  line-height: 1.6;
`;

const CarouselTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const Tag = styled.span`
  background: ${({ theme }) => theme.googleColors.blue.light}20;
  color: ${({ theme }) => theme.googleColors.blue.main};
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const CarouselControls = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: center;
  align-items: center;
`;

const CarouselButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.background.primary};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: ${({ theme }) => theme.googleColors.blue.main};
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CarouselDots = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Dot = styled.button`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ active, theme }) => 
    active ? theme.colors.background.primary : 'rgba(255, 255, 255, 0.4)'};
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.2);
  }
`;

const RightPanel = styled.div`
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 768px) {
    flex: 1 1 auto;
  }
`;

const AuthCard = styled.div`
  width: 70%;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border: none;
  border-radius: 14px;
  padding: 20px 40px; /* increased left/right padding */
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  
  @media (max-width: 1024px) {
    width: 85%;
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 16px;
  }
`;

const FieldLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 8px;
`;

const AuthInput = styled.input`
  width: 100%;
  height: 48px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.secondary};
    opacity: 0.9;
  }

  &:focus {
    border-color: ${({ theme }) => theme.googleColors.blue.primary};
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.25);
  }
`;

const EmailDisplay = styled.div`
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 4px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.95rem;
`;

const InlineActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const BackLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
  text-decoration: none; /* no hover effect */
`;

const BackRow = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.95rem;
  cursor: pointer;
  padding: 6px 0;
`;

const PrimaryButton = styled.button`
  width: 100%;
  height: 44px;
  border-radius: 10px;
  background: #ffffff;
  color: #111;
  font-weight: 600;
  border: 1px solid ${({ theme }) => theme.colors.border};
  transition: transform 0.15s ease, box-shadow 0.2s ease;

  &:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(0,0,0,0.15); }
  &:active { transform: translateY(0); }
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
  margin: 16px 0;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }
`;

const SocialBtn = styled.button`
  width: 100%;
  height: 44px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 500;
  transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;

  &:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(0,0,0,0.12); }
`;

const ThemeToggleWrapper = styled.div`
  position: absolute;
  top: 2rem;
  right: 2rem;
  z-index: 100;
  
  @media (max-width: 768px) {
    top: 0.75rem;
    right: 0.75rem;
  }
`;

const BrandWrapper = styled.div`
  position: absolute;
  top: 2rem;
  left: 2rem;
  z-index: 100;

  @media (max-width: 768px) {
    top: 0.75rem;
    left: 0.75rem;
  }
`;

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z"
      fill="#FFC107"
    />
    <path
      d="M3.15295 7.3455L6.43845 9.755C7.32745 7.554 9.48045 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15895 2 4.82795 4.1685 3.15295 7.3455Z"
      fill="#FF3D00"
    />
    <path
      d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5718 17.5742 13.3038 18.001 12 18C9.39903 18 7.19053 16.3415 6.35853 14.027L3.09753 16.5395C4.75253 19.778 8.11353 22 12 22Z"
      fill="#4CAF50"
    />
    <path
      d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z"
      fill="#1976D2"
    />
  </svg>
);

const AuthPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nextFromQuery = new URLSearchParams(location.search).get('next');
  const redirectAfterAuth =
    (typeof location.state?.redirectTo === 'string' && location.state.redirectTo.startsWith('/'))
      ? location.state.redirectTo
      : (typeof nextFromQuery === 'string' && nextFromQuery.startsWith('/'))
        ? nextFromQuery
        : '/';
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    profilePhoto: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [events, setEvents] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  
  // Provide instant default slides so the carousel shows immediately
  const defaultSlides = [
    {
      id: "default-1",
      title: "Welcome to GDG",
      date: "",
      location: "",
      description: "Discover events, connect with developers, and grow your skills.",
      image: "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&h=480",
      tags: ["Community", "Events", "Learning"],
    },
    {
      id: "default-2",
      title: "Build with Us",
      date: "",
      location: "",
      description: "From web to AI, explore hands-on sessions and workshops.",
      image: "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&h=480",
      tags: ["Web", "Cloud", "AI"],
    },
  ];

  // Fetch events for carousel
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsData = await fetchEvents();
        setEvents(eventsData); // Show all events instead of limiting to 5
      } catch (error) {
        console.error("Error loading events:", error);
      }
    };
    loadEvents();
  }, []);

  // Determine slides (defaults shown instantly until events load)
  const slides = events.length > 0 ? events : defaultSlides;

  // Preload slide images and auto-play
  useEffect(() => {
    if (slides.length === 0) return;

    // Preload all images for smooth transitions
    slides.forEach((s) => {
      const src = s.image || s.images?.[0];
      if (!src) return;
      const img = new Image();
      img.src = src;
    });

    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentEventIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides, isAutoPlaying]);

  const nextEvent = () => {
    setCurrentEventIndex((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  const prevEvent = () => {
    setCurrentEventIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  const goToEvent = (index) => {
    setCurrentEventIndex(index);
    setIsAutoPlaying(false);
  };

  const toggleAuthMode = () => {
    console.log('Toggling auth mode from', isLogin ? 'login' : 'register', 'to', !isLogin ? 'login' : 'register');
    setIsLogin(!isLogin);
    setErrors({});
    setForm({
      name: "",
      email: "",
      password: "",
      profilePhoto: "",
      rememberMe: false,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isLogin && !form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8 && !isLogin) {
      newErrors.password = "Password must be at least 8 characters";
    }

    // Profile photo is optional for registration
    // if (!isLogin && !form.profilePhoto) {
    //   newErrors.profilePhoto = "Profile photo is required";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOAuthLogin = (provider) => {
    console.log('OAuth login initiated for:', provider);
    const endpoint = provider === 'google' ? API_ENDPOINTS.GOOGLE_AUTH : API_ENDPOINTS.GITHUB_AUTH;
    window.location.href = `${API_BASE_URL}${endpoint}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted, isLogin:', isLogin);
    console.log('Form data:', { email: form.email, hasPassword: !!form.password });
    
    if (!validateForm()) {
      console.log('Validation failed, errors:', errors);
      return;
    }

    console.log('Validation passed, sending request...');

    try {
      setLoading(true);
      
      if (isLogin) {
        // Login - send JSON
        const endpoint = `${API_BASE_URL}/api/auth/login`;
        console.log('Sending login request to:', endpoint);
        
        const response = await axios.post(endpoint, {
          email: form.email,
          password: form.password,
        }, {
          headers: { "Content-Type": "application/json" },
        });

        console.log('Login successful, token received');
        localStorage.setItem("token", response.data.token);
        login(response.data.token);
        navigate(redirectAfterAuth, { replace: true });
      } else {
        // Register - send FormData for file upload
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("email", form.email);
        formData.append("password", form.password);
        if (form.profilePhoto) formData.append("profilePhoto", form.profilePhoto);

        const endpoint = `${API_BASE_URL}/api/auth/register`;
        console.log('Sending register request to:', endpoint);
        
        const response = await axios.post(endpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        console.log('Registration successful, token received');
        localStorage.setItem("token", response.data.token);
        login(response.data.token);
        navigate(redirectAfterAuth, { replace: true });
      }
    } catch (err) {
      console.error("Auth error:", err);
      console.error("Error response:", err.response?.data);
      setErrors({ api: err.response?.data?.message || "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const currentEvent = slides[currentEventIndex];
  const isEmailValid = /\S+@\S+\.\S+/.test(form.email);
  const backToEmail = () => {
    setEmailConfirmed(false);
    setForm({ ...form, password: "" });
  };

  return (
    <PageContainer>
      <BrandWrapper>
        <Logo />
      </BrandWrapper>
      <ThemeToggleWrapper>
        <ThemeToggle />
      </ThemeToggleWrapper>

      {/* Left side image/carousel section */}
      <LeftPanel>
        <AnimatedParticles count={60} speed="medium" />
        <CarouselContainer>
          <AnimatePresence mode="wait">
            {currentEvent && (
              <CarouselCard
                key={currentEvent.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
              >
                <CarouselImage src={currentEvent.image || currentEvent.images?.[0] || 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'} />
                <CarouselContent>
                  <CarouselTitle>{currentEvent.title}</CarouselTitle>
                  <CarouselMeta>
                    <MetaItem>
                      <Calendar size={16} />
                      <span>{currentEvent.date}</span>
                    </MetaItem>
                    <MetaItem>
                      <MapPin size={16} />
                      <span>{currentEvent.location}</span>
                    </MetaItem>
                  </CarouselMeta>
                  <CarouselDescription>
                    {currentEvent.description}
                  </CarouselDescription>
                  {currentEvent.tags && (
                    <CarouselTags>
                      {currentEvent.tags.map((tag, index) => (
                        <Tag key={index}>{tag}</Tag>
                      ))}
                    </CarouselTags>
                  )}
                </CarouselContent>
              </CarouselCard>
            )}
          </AnimatePresence>
          
          <CarouselControls>
            <CarouselButton onClick={prevEvent} disabled={slides.length === 0}>
              <ChevronLeft size={20} />
            </CarouselButton>
            <CarouselButton onClick={nextEvent} disabled={slides.length === 0}>
              <ChevronRight size={20} />
            </CarouselButton>
          </CarouselControls>
        </CarouselContainer>
      </LeftPanel>

      {/* Right side auth card */}
      <RightPanel>
        <AuthCard>
          <FormHeader>
            <Title>Welcome back!!</Title>
          </FormHeader>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div style={{ marginBottom: 14 }}>
                <FieldLabel>Full Name</FieldLabel>
                <AuthInput
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleChange}
                />
                {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
              </div>
            )}

            <AnimatePresence initial={false}>
              {!emailConfirmed ? (
                <motion.div key="email-input" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ marginBottom: 14 }}>
                  <InlineActions>
                    <FieldLabel>Email</FieldLabel>
                    <span />
                  </InlineActions>
                  <AuthInput
                    type="email"
                    name="email"
                    placeholder="Your email address"
                    value={form.email}
                    onChange={handleChange}
                  />
                  {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
                </motion.div>
              ) : (
                <motion.div key="email-static" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ marginBottom: 14 }}>
                  <InlineActions>
                    <FieldLabel>Email</FieldLabel>
                    <span />
                  </InlineActions>
                  <EmailDisplay>{form.email}</EmailDisplay>
                </motion.div>
              )}
            </AnimatePresence>

            {isLogin && emailConfirmed && (
              <motion.div key="password-field" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <FieldLabel>Password</FieldLabel>
                  <a style={{ color: '#9aa0a6', fontSize: '0.875rem' }}>Forgot your password?</a>
                </div>
                <div style={{ position: 'relative' }}>
                  <AuthInput
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Your password"
                    value={form.password}
                    onChange={handleChange}
                  />
                  <PasswordToggle
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{ right: 10 }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </PasswordToggle>
                </div>
                {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
              </motion.div>
            )}

            {errors.api && (
              <ErrorMessage style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                {errors.api}
              </ErrorMessage>
            )}

            {!emailConfirmed ? (
              <PrimaryButton type="button" disabled={loading || !isEmailValid} onClick={() => isEmailValid && setEmailConfirmed(true)}>
                {loading ? 'Please wait...' : 'Continue'}
              </PrimaryButton>
            ) : (
              <PrimaryButton type="submit" disabled={loading}>
                {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
              </PrimaryButton>
            )}

            <OrDivider>OR</OrDivider>

            {!emailConfirmed ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <SocialBtn type="button" onClick={() => handleOAuthLogin('google')}>
                  <GoogleIcon /> Continue with Google
                </SocialBtn>
                <SocialBtn type="button" onClick={() => handleOAuthLogin('github')}>
                  <GitHub size={18} /> Continue with GitHub
                </SocialBtn>
                <SocialBtn type="button" onClick={() => handleOAuthLogin('twitter')}>
                  <Twitter size={18} color="#1DA1F2" /> Continue with Twitter
                </SocialBtn>
              </div>
            ) : (
              <div>
                <SocialBtn type="button">
                  <Mail size={18} /> Email sign-in code
                </SocialBtn>
              </div>
            )}

            {emailConfirmed && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                <BackRow type="button" onClick={backToEmail}>
                  <ChevronLeft size={16} />
                  Go back
                </BackRow>
              </div>
            )}

            <SwitchText>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <a onClick={toggleAuthMode} style={{ cursor: 'pointer' }}>
                {isLogin ? 'Sign up' : 'Sign in'}
              </a>
            </SwitchText>
          </form>
        </AuthCard>
      </RightPanel>
    </PageContainer>
  );
};

export default AuthPage;

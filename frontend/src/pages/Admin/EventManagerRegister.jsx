import { useState, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { Mail, Shield, Lock, ArrowRight, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

const API = `${API_BASE_URL}/api`;

const EventManagerRegister = () => {
  const [step, setStep] = useState(1); // 1=Email, 2=OTP, 3=Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef([]);
  const navigate = useNavigate();
  // useAuth removed because auto-login is disabled for pending approvals

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 2 && countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, step]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.endsWith("@mmmut.ac.in")) {
      setError("Only @mmmut.ac.in email addresses are allowed");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/event-manager/send-otp`, { email });
      if (data.success) {
        setSuccess(data.message);
        setStep(2);
        setCountdown(120);
        setCanResend(false);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    setCanResend(false);
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/event-manager/send-otp`, { email });
      if (data.success) {
        setSuccess("New OTP sent to your email!");
        setCountdown(120);
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
      setCanResend(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // On backspace, move to previous input
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);
    if (pasted.length >= 6) {
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/event-manager/verify-otp`, {
        email,
        otp: otpString,
      });
      if (data.success) {
        setTempToken(data.tempToken);
        setSuccess(data.message);
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/event-manager/register`, {
        tempToken,
        name: name.trim(),
        password,
      });
      if (data.success) {
        setStep(4); // Success screen
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <PageWrapper>
      <BackgroundOrbs />
      <Container>
        <Card>
          {/* Google-style dots */}
          <DotsRow>
            <Dot color="#4285f4" $delay="0s" />
            <Dot color="#ea4335" $delay="0.15s" />
            <Dot color="#fbbc04" $delay="0.3s" />
            <Dot color="#34a853" $delay="0.45s" />
          </DotsRow>

          <CardTitle>Event Manager Registration</CardTitle>
          <CardSubtitle>GDG MMMUT — Exclusive Team Access</CardSubtitle>

          {/* Step indicator */}
          <StepIndicator>
            <StepDot $active={step >= 1} $done={step > 1}>
              {step > 1 ? <CheckCircle size={14} /> : "1"}
            </StepDot>
            <StepLine $active={step > 1} />
            <StepDot $active={step >= 2} $done={step > 2}>
              {step > 2 ? <CheckCircle size={14} /> : "2"}
            </StepDot>
            <StepLine $active={step > 2} />
            <StepDot $active={step >= 3} $done={step > 3}>
              {step > 3 ? <CheckCircle size={14} /> : "3"}
            </StepDot>
          </StepIndicator>

          {error && <ErrorBox>{error}</ErrorBox>}
          {success && <SuccessBox>{success}</SuccessBox>}

          {/* STEP 1: Email */}
          {step === 1 && (
            <StepContent as="form" onSubmit={handleSendOtp}>
              <StepTitle><Mail size={20} /> Enter Your College Email</StepTitle>
              <StepDesc>Only @mmmut.ac.in emails are eligible for Event Manager access.</StepDesc>
              <InputGroup>
                <InputIcon><Mail size={18} /></InputIcon>
                <StyledInput
                  type="email"
                  placeholder="yourname@mmmut.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </InputGroup>
              <PrimaryButton type="submit" disabled={loading}>
                {loading ? <><Loader2 size={18} className="spin" /> Sending...</> : <>Send OTP <ArrowRight size={18} /></>}
              </PrimaryButton>
            </StepContent>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 2 && (
            <StepContent as="form" onSubmit={handleVerifyOtp}>
              <StepTitle><Shield size={20} /> Verify Your Email</StepTitle>
              <StepDesc>Enter the 6-digit code sent to <strong>{email}</strong></StepDesc>
              
              <OtpRow onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <OtpInput
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </OtpRow>

              <TimerRow>
                {countdown > 0 ? (
                  <Timer>⏱ Code expires in <strong>{formatTime(countdown)}</strong></Timer>
                ) : (
                  <Timer style={{ color: "#ea4335" }}>⚠ Code has expired</Timer>
                )}
                {canResend && (
                  <ResendButton type="button" onClick={handleResendOtp} disabled={loading}>
                    Resend OTP
                  </ResendButton>
                )}
              </TimerRow>

              <ButtonRow>
                <SecondaryButton type="button" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} /> Back
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={loading || otp.join("").length !== 6}>
                  {loading ? <><Loader2 size={18} className="spin" /> Verifying...</> : <>Verify <ArrowRight size={18} /></>}
                </PrimaryButton>
              </ButtonRow>
            </StepContent>
          )}

          {/* STEP 3: Password Creation */}
          {step === 3 && (
            <StepContent as="form" onSubmit={handleRegister}>
              <StepTitle><Lock size={20} /> Create Your Account</StepTitle>
              <StepDesc>Set your name and password to complete registration.</StepDesc>
              
              <InputGroup>
                <InputIcon><Mail size={18} /></InputIcon>
                <StyledInput type="email" value={email} disabled />
              </InputGroup>

              <InputGroup>
                <InputIcon style={{ fontSize: "18px" }}>👤</InputIcon>
                <StyledInput
                  type="text"
                  placeholder="Your Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </InputGroup>

              <InputGroup>
                <InputIcon><Lock size={18} /></InputIcon>
                <StyledInput
                  type="password"
                  placeholder="Create Password (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </InputGroup>

              <InputGroup>
                <InputIcon><Lock size={18} /></InputIcon>
                <StyledInput
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </InputGroup>

              <PrimaryButton type="submit" disabled={loading}>
                {loading ? <><Loader2 size={18} className="spin" /> Creating Account...</> : <>Complete Registration <CheckCircle size={18} /></>}
              </PrimaryButton>
            </StepContent>
          )}

          {/* STEP 4: Success */}
          {step === 4 && (
            <StepContent>
              <SuccessIconWrapper>
                <CheckCircle size={48} />
              </SuccessIconWrapper>
              <StepTitle style={{ justifyContent: "center" }}>Registration Complete! 🎉</StepTitle>
              <StepDesc style={{ textAlign: "center" }}>
                Your Event Manager account has been successfully created.<br /><br />
                However, it is currently <strong>Pending Super Admin Approval</strong>. You will receive an email once your account is verified and ready for login!
              </StepDesc>
            </StepContent>
          )}
        </Card>

        <FooterLink onClick={() => navigate("/event-manager/login")}>
          Already have an account? <strong>Login here</strong>
        </FooterLink>
      </Container>
    </PageWrapper>
  );
};

/* ═══════════════ Styled Components ═══════════════ */

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f36 50%, #0d1225 100%);
  padding: 2rem;
  position: relative;
  overflow: hidden;
`;

const BackgroundOrbs = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;

  &::before, &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.15;
    animation: ${float} 8s ease-in-out infinite;
  }

  &::before {
    width: 400px;
    height: 400px;
    background: #4285f4;
    top: -100px;
    right: -100px;
  }

  &::after {
    width: 300px;
    height: 300px;
    background: #34a853;
    bottom: -80px;
    left: -80px;
    animation-delay: 4s;
  }
`;

const Container = styled.div`
  width: 100%;
  max-width: 480px;
  position: relative;
  z-index: 1;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 2.5rem;
  
  @media (max-width: 480px) { padding: 1.5rem; }
`;

const DotsRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 1.5rem;
`;

const Dot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${p => p.color};
  animation: ${pulse} 2s ease-in-out infinite;
  animation-delay: ${p => p.$delay};
`;

const CardTitle = styled.h1`
  text-align: center;
  font-size: 1.8rem;
  font-weight: 800;
  color: #fff;
  margin: 0 0 0.5rem;
  
  @media (max-width: 480px) { font-size: 1.4rem; }
`;

const CardSubtitle = styled.p`
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  margin: 0 0 2rem;
`;

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 2rem;
`;

const StepDot = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  transition: all 0.3s;
  color: ${p => p.$active ? "#fff" : "rgba(255,255,255,0.3)"};
  background: ${p => p.$done ? "#34a853" : p.$active ? "#4285f4" : "rgba(255,255,255,0.08)"};
  border: 2px solid ${p => p.$done ? "#34a853" : p.$active ? "#4285f4" : "rgba(255,255,255,0.15)"};
`;

const StepLine = styled.div`
  width: 48px;
  height: 2px;
  background: ${p => p.$active ? "#4285f4" : "rgba(255,255,255,0.1)"};
  transition: background 0.3s;
`;

const StepContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StepTitle = styled.h2`
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;

  svg { color: #4285f4; }
`;

const StepDesc = styled.p`
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;

  strong { color: rgba(255, 255, 255, 0.85); }
`;

const InputGroup = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 14px 14px 14px 44px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 0.95rem;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s;
  box-sizing: border-box;

  &::placeholder { color: rgba(255, 255, 255, 0.25); }
  &:focus {
    outline: none;
    border-color: #4285f4;
    background: rgba(66, 133, 244, 0.06);
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const OtpRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 0.5rem 0;
`;

const OtpInput = styled.input`
  width: 48px;
  height: 56px;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  transition: all 0.2s;
  font-family: 'Inter', monospace;

  &:focus {
    outline: none;
    border-color: #4285f4;
    background: rgba(66, 133, 244, 0.08);
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.15);
  }

  @media (max-width: 400px) {
    width: 40px;
    height: 48px;
    font-size: 1.2rem;
  }
`;

const TimerRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
`;

const Timer = styled.span`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;

  strong { color: #fbbc04; }
`;

const ResendButton = styled.button`
  background: none;
  border: none;
  color: #4285f4;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  
  &:hover { color: #5a9cf5; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
`;

const PrimaryButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  background: linear-gradient(135deg, #4285f4, #356ac3);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(66, 133, 244, 0.3);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .spin { animation: ${spin} 1s linear infinite; }
`;

const SecondaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const ErrorBox = styled.div`
  background: rgba(234, 67, 53, 0.1);
  border: 1px solid rgba(234, 67, 53, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  color: #ea4335;
  font-size: 0.9rem;
  text-align: center;
`;

const SuccessBox = styled.div`
  background: rgba(52, 168, 83, 0.1);
  border: 1px solid rgba(52, 168, 83, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  color: #34a853;
  font-size: 0.9rem;
  text-align: center;
`;

const SuccessIconWrapper = styled.div`
  display: flex;
  justify-content: center;
  color: #34a853;
  margin-bottom: 1rem;
`;

const FooterLink = styled.p`
  text-align: center;
  margin-top: 1.5rem;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.9rem;
  cursor: pointer;

  strong {
    color: #4285f4;
    &:hover { text-decoration: underline; }
  }
`;

export default EventManagerRegister;

import { useState, useEffect } from "react";
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Lock, Mail, ArrowRight, Shield } from "lucide-react";
import { useAuth } from "../../contexts/useAuth";

const AdminLogin = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [step, setStep] = useState('credentials'); // 'credentials' or 'otp'
    const [otp, setOtp] = useState('');
    const [otpTimer, setOtpTimer] = useState(120); // 2 minutes
    const [canResendOtp, setCanResendOtp] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { user } = useAuth();

    // Handle OTP timer
    useEffect(() => {
        if (step === 'otp' && otpTimer > 0) {
            const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
            return () => clearTimeout(timer);
        } else if (otpTimer === 0 && step === 'otp') {
            setCanResendOtp(true);
        }
    }, [otpTimer, step]);

    useEffect(() => {
        if (user && ["admin", "super_admin", "event_manager"].includes(user.role)) {
            const currentPath = window.location.pathname;

            // Only auto-redirect if the user's role matches this portal
            if (currentPath.includes("super-admin") && user.role === 'super_admin') {
                navigate("/super-admin");
            } else if (currentPath.includes("event-manager") && user.role === 'event_manager') {
                navigate("/event-manager");
            } else if (currentPath.includes("/admin") && !currentPath.includes("super-admin") && !currentPath.includes("event-manager")) {
                if (user.role === 'admin' || user.role === 'super_admin') {
                    navigate(user.role === 'super_admin' ? "/super-admin" : "/admin");
                }
            }
        }
    }, [user, navigate]);

    const handleInitiateLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/auth/admin/initiate-login`,
                { email, password }
            );

            if (response.data.success) {
                setStep('otp');
                setOtpTimer(120);
                setCanResendOtp(false);
                setOtp('');
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
        setError("");

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/auth/admin/verify-otp`,
                { email, otp }
            );

            if (response.data.success) {
                const { token, user } = response.data;

                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));

                if (user.role === 'super_admin') {
                    window.location.href = "/super-admin";
                } else if (user.role === 'event_manager') {
                    window.location.href = "/event-manager";
                } else {
                    window.location.href = "/admin";
                }
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
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/auth/admin/initiate-login`,
                { email, password }
            );
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

    const path = window.location.pathname;
    let portalName = "Admin Portal";
    if (path.includes("super-admin")) portalName = "Super Admin Portal";
    else if (path.includes("event-manager")) portalName = "Event Manager Portal";

    return (
        <Container>
            <LoginCard>
                <Header>
                    <Shield size={48} color="#4285f4" />
                    <Title>{portalName}</Title>
                    <Subtitle>Secure access for GDG MMMUT Organizers</Subtitle>
                </Header>

                <Form onSubmit={step === 'credentials' ? handleInitiateLogin : handleVerifyOtp}>
                    {error && (
                        <ErrorAlert>
                            <AlertIcon>⚠️</AlertIcon>
                            {error}
                        </ErrorAlert>
                    )}

                    {step === 'credentials' ? (
                        <>
                            <InputGroup>
                                <Label>Email Address</Label>
                                <InputWrapper>
                                    <Mail size={18} />
                                    <Input
                                        type="email"
                                        placeholder="admin@gdg.mmmut.app"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setError(""); }}
                                        required
                                    />
                                </InputWrapper>
                            </InputGroup>

                            <InputGroup>
                                <Label>Password</Label>
                                <InputWrapper>
                                    <Lock size={18} />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => { setPassword(e.target.value); setError(""); }}
                                        required
                                    />
                                </InputWrapper>
                            </InputGroup>
                        </>
                    ) : (
                        <>
                            <InputGroup>
                                <Label>Enter OTP</Label>
                                <InputWrapper>
                                    <Lock size={18} />
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="000000"
                                        value={otp}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setOtp(val);
                                            setError("");
                                        }}
                                        maxLength="6"
                                        required
                                    />
                                </InputWrapper>
                                <OtpHint>
                                    🔒 Expires in {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}
                                    {canResendOtp && (
                                        <ResendButton onClick={handleResendOtp} type="button">
                                            Resend OTP
                                        </ResendButton>
                                    )}
                                </OtpHint>
                            </InputGroup>

                            <BackButton onClick={handleBackToCredentials} type="button">
                                ← Back to Login
                            </BackButton>
                        </>
                    )}

                    <SubmitButton type="submit" disabled={loading || (step === 'otp' && otp.length !== 6)}>
                        {loading ? "Processing..." : (step === 'credentials' ? "Continue" : "Verify OTP")}
                        {!loading && <ArrowRight size={18} />}
                    </SubmitButton>
                </Form>

                <BackLink to="/auth">
                    Not an admin? Login as User
                </BackLink>
            </LoginCard>
        </Container>
    );
};

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  padding: 24px;

  .dark & {
    background: #0f172a;
  }
`;

const LoginCard = styled.div`
  background: white;
  width: 100%;
  max-width: 440px;
  padding: 48px;
  border-radius: 24px;
  box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
  border: 1px solid #e2e8f0;

  .dark & {
    background: #1e293b;
    border-color: #334155;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.5px;
  margin: 0;

  .dark & {
    color: white;
  }
`;

const Subtitle = styled.p`
  font-size: 15px;
  color: #64748b;
  margin: 0;

  .dark & {
    color: #94a3b8;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #334155;

  .dark & {
    color: #cbd5e1;
  }
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  
  svg {
    position: absolute;
    left: 14px;
    color: #94a3b8;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px 12px 42px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.2s;
  background: white;
  color: #1e293b;

  .dark & {
    background: #0f172a;
    border-color: #334155;
    color: white;
  }

  &:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #4285f4, #1a73e8);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(66, 133, 244, 0.2);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const BackLink = styled(Link)`
  display: block;
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #64748b;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    color: #4285f4;
    text-decoration: underline;
  }
`;

const ErrorAlert = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  color: #dc2626;
  font-size: 14px;
  font-weight: 500;

  .dark & {
    background: rgba(220, 38, 38, 0.15);
    border-color: rgba(220, 38, 38, 0.3);
    color: #fca5a5;
  }
`;

const AlertIcon = styled.span`
  font-size: 16px;
  flex-shrink: 0;
`;

const OtpHint = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;

  .dark & {
    color: #94a3b8;
  }
`;

const ResendButton = styled.button`
  background: none;
  border: none;
  color: #4285f4;
  cursor: pointer;
  font-size: 12px;
  text-decoration: underline;
  padding: 0;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: #1a73e8;
  }

  &:disabled {
    color: #94a3b8;
    cursor: not-allowed;
    text-decoration: none;
  }
`;

const BackButton = styled.button`
  width: 100%;
  padding: 12px;
  background: rgba(66, 133, 244, 0.1);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #4285f4;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  .dark & {
    background: rgba(66, 133, 244, 0.15);
    border-color: #334155;
    color: #60a5fa;
  }

  &:hover {
    background: rgba(66, 133, 244, 0.15);
    border-color: #4285f4;
  }

  &:active {
    transform: scale(0.98);
  }
`;

export default AdminLogin;

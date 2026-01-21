import { useState } from "react";
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Lock, Mail, ArrowRight, Shield } from "lucide-react";

// You can copy Logo/Brand components from AuthPage if needed, or use text
const AdminLogin = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Standard login, but we'll check role after
            // Alternatively, use a specific admin-login endpoint if created
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                email,
                password
            });

            const { token, user } = response.data;

            if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'event_manager') {
                alert("Access Denied: You do not have admin privileges.");
                setLoading(false);
                return;
            }

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            navigate("/admin");
        } catch (error) {
            console.error("Login failed", error);
            alert(error.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <LoginCard>
                <Header>
                    <Shield size={48} color="#4285f4" />
                    <Title>Admin Portal</Title>
                    <Subtitle>Secure access for GDG MMMUT Organizers</Subtitle>
                </Header>

                <Form onSubmit={handleLogin}>
                    <InputGroup>
                        <Label>Email Address</Label>
                        <InputWrapper>
                            <Mail size={18} />
                            <Input
                                type="email"
                                placeholder="admin@gdg.mmmut.app"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
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
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </InputWrapper>
                    </InputGroup>

                    <SubmitButton type="submit" disabled={loading}>
                        {loading ? "Verifying..." : "Access Dashboard"}
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

export default AdminLogin;

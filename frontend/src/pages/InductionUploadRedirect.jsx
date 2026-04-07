import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import Spinner from "../components/GDG-Spinner";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../contexts/useAuth";

const Wrapper = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.25rem;
`;

const Card = styled.div`
  width: min(680px, 100%);
  border-radius: 18px;
  padding: 1.5rem;
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.divider};
  box-shadow: ${({ theme }) => theme.colors.shadows.medium};
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Body = styled.p`
  margin: 0.9rem 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.55;
`;

const Notice = styled.div`
  margin-top: 1rem;
  padding: 0.8rem 0.95rem;
  border-radius: 10px;
  background: rgba(66, 133, 244, 0.12);
  border: 1px solid rgba(66, 133, 244, 0.24);
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.95rem;
`;

const Alert = styled.div`
  margin-top: 1rem;
  padding: 0.8rem 0.95rem;
  border-radius: 10px;
  background: ${({ $type }) => ($type === "error" ? "rgba(220, 38, 38, 0.14)" : "rgba(22, 163, 74, 0.14)")};
  border: 1px solid ${({ $type }) => ($type === "error" ? "rgba(220, 38, 38, 0.32)" : "rgba(22, 163, 74, 0.32)")};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.92rem;
`;

const MetaGrid = styled.div`
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const MetaItem = styled.div`
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.divider};
  padding: 0.65rem 0.8rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.9rem;
`;

const MetaValue = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
`;

const Form = styled.form`
  margin-top: 1rem;
  display: grid;
  gap: 0.8rem;
`;

const Label = styled.label`
  display: grid;
  gap: 0.3rem;
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
  font-size: 0.95rem;
`;

const Input = styled.input`
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.divider};
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 0.72rem 0.85rem;
  font-size: 0.96rem;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const FileHint = styled.div`
  margin-top: -0.1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.85rem;
`;

const Actions = styled.div`
  margin-top: 0.4rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
`;

const PrimaryButton = styled.button`
  border: none;
  border-radius: 10px;
  padding: 0.72rem 1rem;
  cursor: pointer;
  font-weight: 700;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

const SecondaryButton = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.divider};
  border-radius: 10px;
  padding: 0.72rem 1rem;
  cursor: pointer;
  font-weight: 600;
  background: transparent;
  color: ${({ theme }) => theme.colors.text.primary};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

const HomeLink = styled(Link)`
  margin-top: 0.9rem;
  display: inline-block;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const STEPS = {
  REQUEST_OTP: "request_otp",
  VERIFY_OTP: "verify_otp",
  CREATE_PASSWORD: "create_password",
  LOGIN: "login",
  FORGOT_REQUEST_OTP: "forgot_request_otp",
  FORGOT_VERIFY_OTP: "forgot_verify_otp",
  FORGOT_RESET_PASSWORD: "forgot_reset_password",
};

const INITIAL_AUTH_STATE = {
  email: "",
  otp: "",
  tempToken: "",
  resetToken: "",
  name: "",
  password: "",
  confirmPassword: "",
};

const INITIAL_TEAM_META = {
  email: "",
  inductionStatus: "",
  hasSubmitted: false,
  remainingEdits: 1,
  isApproved: false,
};

const INITIAL_UPLOAD_FORM = {
  linkedinId: "",
  githubId: "",
  xAccount: "",
  photo: null,
};

const InductionUploadRedirect = () => {
  const { login, logout } = useAuth();

  const [checkingLogin, setCheckingLogin] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [teamMeta, setTeamMeta] = useState(INITIAL_TEAM_META);

  const [step, setStep] = useState(STEPS.REQUEST_OTP);
  const [authForm, setAuthForm] = useState(INITIAL_AUTH_STATE);
  const [loading, setLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [uploadForm, setUploadForm] = useState(INITIAL_UPLOAD_FORM);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const updateAuthField = (name, value) => {
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  };

  const clearAuthAlerts = () => {
    setError("");
    setSuccessMessage("");
  };

  const clearUploadAlerts = () => {
    setUploadError("");
    setUploadSuccess("");
  };

  const loadUploadContext = async (showLoader = true) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      setTeamMeta(INITIAL_TEAM_META);
      return false;
    }

    if (showLoader) {
      setProfileLoading(true);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/induction/upload-context`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          localStorage.removeItem("token");
          sessionStorage.removeItem("inductionToken");
          setStep(STEPS.REQUEST_OTP);
          setAuthForm(INITIAL_AUTH_STATE);
          setError(data?.message || "Only selected users can access Team 2026 upload page.");
        }
        throw new Error(data?.message || "Unable to verify session.");
      }

      const uploadData = data?.data || {};
      const team2026 = uploadData?.team2026 || {};

      setIsAuthenticated(true);
      setTeamMeta({
        email: String(uploadData?.email || "").trim(),
        inductionStatus: String(uploadData?.status || "selected").trim().toLowerCase(),
        hasSubmitted: !!team2026?.hasSubmitted,
        remainingEdits: Number(team2026?.remainingEdits ?? 1),
        isApproved: !!team2026?.isApproved,
      });

      setUploadForm({
        linkedinId: "",
        githubId: "",
        xAccount: "",
        photo: null,
      });

      return true;
    } catch (fetchError) {
      setIsAuthenticated(false);
      setTeamMeta(INITIAL_TEAM_META);
      return false;
    } finally {
      if (showLoader) {
        setProfileLoading(false);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        await loadUploadContext(true);
      }
      if (mounted) {
        setCheckingLogin(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (otpCountdown <= 0) {
      if (step === STEPS.VERIFY_OTP || step === STEPS.FORGOT_VERIFY_OTP) {
        setCanResendOtp(true);
      }
      return;
    }

    const timer = setTimeout(() => {
      setOtpCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [otpCountdown, step]);

  const resetAuthSensitiveFields = () => {
    setAuthForm((prev) => ({
      ...prev,
      otp: "",
      tempToken: "",
      resetToken: "",
      password: "",
      confirmPassword: "",
    }));
  };

  const completeLogin = async (data) => {
    if (data?.token) {
      localStorage.setItem("token", data.token);
      login();
    }
    if (data?.inductionToken) {
      sessionStorage.setItem("inductionToken", data.inductionToken);
    }

    await loadUploadContext(true);
    clearAuthAlerts();
  };

  const handleSendOtp = async (event, isResend = false) => {
    event.preventDefault();
    clearAuthAlerts();

    const email = String(authForm.email || "").trim().toLowerCase();
    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/induction/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (response.status === 409) {
          setStep(STEPS.LOGIN);
          setSuccessMessage(data.message || "Account already exists. Login with your password.");
          return;
        }
        throw new Error(data.message || "Failed to send OTP.");
      }

      setAuthForm((prev) => ({ ...prev, email, otp: "" }));
      setStep(STEPS.VERIFY_OTP);
      setOtpCountdown(120);
      setCanResendOtp(false);
      setSuccessMessage(isResend ? "OTP resent successfully." : "OTP sent from team@gdg.mmmut.app.");
    } catch (sendError) {
      setError(sendError.message || "Failed to send OTP.");
      if (isResend) {
        setCanResendOtp(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    clearAuthAlerts();

    const email = String(authForm.email || "").trim().toLowerCase();
    const otp = String(authForm.otp || "").trim();

    if (!email || !otp) {
      setError("Please enter email and OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("OTP must be exactly 6 digits.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/induction/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "OTP verification failed.");
      }

      setAuthForm((prev) => ({ ...prev, tempToken: data.tempToken }));
      setStep(STEPS.CREATE_PASSWORD);
      setOtpCountdown(0);
      setCanResendOtp(false);
      setSuccessMessage("OTP verified. Create your password to continue.");
    } catch (verifyError) {
      setError(verifyError.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePassword = async (event) => {
    event.preventDefault();
    clearAuthAlerts();

    const name = String(authForm.name || "").trim();
    const password = String(authForm.password || "");
    const confirmPassword = String(authForm.confirmPassword || "");

    if (!name) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/induction/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempToken: authForm.tempToken,
          name,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create account.");
      }

      await completeLogin(data);
    } catch (createError) {
      setError(createError.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    clearAuthAlerts();

    const email = String(authForm.email || "").trim().toLowerCase();
    const password = String(authForm.password || "");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/induction/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed.");
      }

      await completeLogin(data);
    } catch (loginError) {
      setError(loginError.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSendOtp = async (event, isResend = false) => {
    event.preventDefault();
    clearAuthAlerts();

    const email = String(authForm.email || "").trim().toLowerCase();
    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/induction/auth/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send OTP.");
      }

      setAuthForm((prev) => ({
        ...prev,
        email,
        otp: "",
        resetToken: "",
      }));
      setStep(STEPS.FORGOT_VERIFY_OTP);
      setOtpCountdown(120);
      setCanResendOtp(false);
      setSuccessMessage(isResend ? "OTP resent successfully." : "Password reset OTP sent from team@gdg.mmmut.app.");
    } catch (forgotError) {
      setError(forgotError.message || "Failed to send OTP.");
      if (isResend) {
        setCanResendOtp(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerifyOtp = async (event) => {
    event.preventDefault();
    clearAuthAlerts();

    const email = String(authForm.email || "").trim().toLowerCase();
    const otp = String(authForm.otp || "").trim();

    if (!email || !otp) {
      setError("Please enter email and OTP.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("OTP must be exactly 6 digits.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/induction/auth/forgot-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "OTP verification failed.");
      }

      setAuthForm((prev) => ({ ...prev, resetToken: data.resetToken }));
      setStep(STEPS.FORGOT_RESET_PASSWORD);
      setOtpCountdown(0);
      setCanResendOtp(false);
      setSuccessMessage("OTP verified. Set your new password.");
    } catch (forgotVerifyError) {
      setError(forgotVerifyError.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotResetPassword = async (event) => {
    event.preventDefault();
    clearAuthAlerts();

    const password = String(authForm.password || "");
    const confirmPassword = String(authForm.confirmPassword || "");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/induction/auth/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetToken: authForm.resetToken,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to reset password.");
      }

      await completeLogin(data);
    } catch (resetError) {
      setError(resetError.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFieldChange = (name, value) => {
    setUploadForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (event) => {
    clearUploadAlerts();

    const file = event.target.files?.[0] || null;
    if (!file) {
      setUploadForm((prev) => ({ ...prev, photo: null }));
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    setUploadForm((prev) => ({ ...prev, photo: file }));
  };

  const handleUploadSubmit = async (event) => {
    event.preventDefault();
    clearUploadAlerts();

    const linkedinId = String(uploadForm.linkedinId || "").trim();
    const githubId = String(uploadForm.githubId || "").trim();
    const xAccount = String(uploadForm.xAccount || "").trim();

    const isSelectedCandidate = teamMeta.inductionStatus === "selected";
    const hasEditLeft = !teamMeta.hasSubmitted || Number(teamMeta.remainingEdits) > 0;

    if (!isSelectedCandidate) {
      setUploadError("Only selected students can submit Team 2026 details.");
      return;
    }

    if (!hasEditLeft) {
      setUploadError("You have already used your one allowed update.");
      return;
    }

    if (!linkedinId || !githubId) {
      setUploadError("LinkedIn ID and GitHub ID are required.");
      return;
    }

    if (!teamMeta.hasSubmitted && !uploadForm.photo) {
      setUploadError("Profile photo is required for first submission.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      setUploadError("Session expired. Please login again.");
      return;
    }

    setUploading(true);
    try {
      const payload = new FormData();
      payload.append("linkedinId", linkedinId);
      payload.append("githubId", githubId);
      payload.append("xAccount", xAccount);
      if (uploadForm.photo) {
        payload.append("photo", uploadForm.photo);
      }

      const response = await fetch(`${API_BASE_URL}/api/induction/upload-details`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save Team 2026 details.");
      }

      setUploadSuccess(data.message || "Details saved successfully.");
      await loadUploadContext(false);
    } catch (submitError) {
      setUploadError(submitError.message || "Failed to save Team 2026 details.");
    } finally {
      setUploading(false);
    }
  };

  const handleSwitchAccount = () => {
    logout();
    sessionStorage.removeItem("inductionToken");

    setIsAuthenticated(false);
    setTeamMeta(INITIAL_TEAM_META);
    setUploadForm(INITIAL_UPLOAD_FORM);
    setStep(STEPS.REQUEST_OTP);
    setAuthForm(INITIAL_AUTH_STATE);
    setOtpCountdown(0);
    setCanResendOtp(false);
    clearAuthAlerts();
    clearUploadAlerts();
  };

  const formatCountdown = () => {
    const minutes = String(Math.floor(otpCountdown / 60)).padStart(2, "0");
    const seconds = String(otpCountdown % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const isSelectedCandidate = teamMeta.inductionStatus === "selected";
  const hasEditLeft = !teamMeta.hasSubmitted || Number(teamMeta.remainingEdits) > 0;

  if (checkingLogin || profileLoading) {
    return <Spinner />;
  }

  return (
    <Wrapper>
      <Card>
        {!isAuthenticated ? (
          <>
            <Title>Team 2026 Upload Login</Title>
            <Body>
              Login with the same email used in your induction submission. After login, this same page shows a simple form where you can submit details directly.
            </Body>

            <Notice>
              Flow: login with email, verify OTP, create or reset password if needed, then submit Team 2026 details.
            </Notice>

            {error ? <Alert $type="error">{error}</Alert> : null}
            {successMessage ? <Alert $type="success">{successMessage}</Alert> : null}

            {step === STEPS.REQUEST_OTP && (
              <Form onSubmit={(event) => handleSendOtp(event, false)}>
                <Label>
                  Induction Email
                  <Input
                    type="email"
                    placeholder="Enter the same induction form email"
                    value={authForm.email}
                    onChange={(event) => updateAuthField("email", event.target.value)}
                    required
                  />
                </Label>
                <Actions>
                  <PrimaryButton type="submit" disabled={loading}>
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </PrimaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={() => {
                      clearAuthAlerts();
                      setStep(STEPS.LOGIN);
                    }}
                  >
                    I Already Have Password
                  </SecondaryButton>
                </Actions>
              </Form>
            )}

            {step === STEPS.VERIFY_OTP && (
              <Form onSubmit={handleVerifyOtp}>
                <Label>
                  Email
                  <Input
                    type="email"
                    value={authForm.email}
                    onChange={(event) => updateAuthField("email", event.target.value)}
                    required
                  />
                </Label>
                <Label>
                  OTP
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={authForm.otp}
                    onChange={(event) => updateAuthField("otp", event.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                  />
                </Label>
                <Actions>
                  <PrimaryButton type="submit" disabled={loading}>
                    {loading ? "Verifying..." : "Verify OTP"}
                  </PrimaryButton>
                  <SecondaryButton
                    type="button"
                    disabled={!canResendOtp || loading}
                    onClick={(event) => handleSendOtp(event, true)}
                  >
                    {canResendOtp ? "Resend OTP" : `Resend in ${formatCountdown()}`}
                  </SecondaryButton>
                </Actions>
              </Form>
            )}

            {step === STEPS.CREATE_PASSWORD && (
              <Form onSubmit={handleCreatePassword}>
                <Label>
                  Full Name
                  <Input
                    type="text"
                    placeholder="Your full name"
                    value={authForm.name}
                    onChange={(event) => updateAuthField("name", event.target.value)}
                    required
                  />
                </Label>
                <Label>
                  Create Password
                  <Input
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={authForm.password}
                    onChange={(event) => updateAuthField("password", event.target.value)}
                    required
                  />
                </Label>
                <Label>
                  Confirm Password
                  <Input
                    type="password"
                    placeholder="Re-enter password"
                    value={authForm.confirmPassword}
                    onChange={(event) => updateAuthField("confirmPassword", event.target.value)}
                    required
                  />
                </Label>
                <Actions>
                  <PrimaryButton type="submit" disabled={loading}>
                    {loading ? "Creating Account..." : "Create Password And Continue"}
                  </PrimaryButton>
                </Actions>
              </Form>
            )}

            {step === STEPS.LOGIN && (
              <Form onSubmit={handlePasswordLogin}>
                <Label>
                  Induction Email
                  <Input
                    type="email"
                    placeholder="Enter the same induction form email"
                    value={authForm.email}
                    onChange={(event) => updateAuthField("email", event.target.value)}
                    required
                  />
                </Label>
                <Label>
                  Password
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={authForm.password}
                    onChange={(event) => updateAuthField("password", event.target.value)}
                    required
                  />
                </Label>
                <Actions>
                  <PrimaryButton type="submit" disabled={loading}>
                    {loading ? "Signing In..." : "Login And Continue"}
                  </PrimaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={() => {
                      clearAuthAlerts();
                      resetAuthSensitiveFields();
                      setStep(STEPS.FORGOT_REQUEST_OTP);
                    }}
                  >
                    Forgot Password
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={() => {
                      clearAuthAlerts();
                      resetAuthSensitiveFields();
                      setStep(STEPS.REQUEST_OTP);
                    }}
                  >
                    Need OTP Flow Instead
                  </SecondaryButton>
                </Actions>
              </Form>
            )}

            {step === STEPS.FORGOT_REQUEST_OTP && (
              <Form onSubmit={(event) => handleForgotSendOtp(event, false)}>
                <Label>
                  Account Email
                  <Input
                    type="email"
                    placeholder="Enter your induction account email"
                    value={authForm.email}
                    onChange={(event) => updateAuthField("email", event.target.value)}
                    required
                  />
                </Label>
                <Actions>
                  <PrimaryButton type="submit" disabled={loading}>
                    {loading ? "Sending OTP..." : "Send Reset OTP"}
                  </PrimaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={() => {
                      clearAuthAlerts();
                      resetAuthSensitiveFields();
                      setStep(STEPS.LOGIN);
                    }}
                  >
                    Back To Login
                  </SecondaryButton>
                </Actions>
              </Form>
            )}

            {step === STEPS.FORGOT_VERIFY_OTP && (
              <Form onSubmit={handleForgotVerifyOtp}>
                <Label>
                  Email
                  <Input
                    type="email"
                    value={authForm.email}
                    onChange={(event) => updateAuthField("email", event.target.value)}
                    required
                  />
                </Label>
                <Label>
                  OTP
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={authForm.otp}
                    onChange={(event) => updateAuthField("otp", event.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                  />
                </Label>
                <Actions>
                  <PrimaryButton type="submit" disabled={loading}>
                    {loading ? "Verifying..." : "Verify Reset OTP"}
                  </PrimaryButton>
                  <SecondaryButton
                    type="button"
                    disabled={!canResendOtp || loading}
                    onClick={(event) => handleForgotSendOtp(event, true)}
                  >
                    {canResendOtp ? "Resend OTP" : `Resend in ${formatCountdown()}`}
                  </SecondaryButton>
                </Actions>
              </Form>
            )}

            {step === STEPS.FORGOT_RESET_PASSWORD && (
              <Form onSubmit={handleForgotResetPassword}>
                <Label>
                  New Password
                  <Input
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={authForm.password}
                    onChange={(event) => updateAuthField("password", event.target.value)}
                    required
                  />
                </Label>
                <Label>
                  Confirm New Password
                  <Input
                    type="password"
                    placeholder="Re-enter new password"
                    value={authForm.confirmPassword}
                    onChange={(event) => updateAuthField("confirmPassword", event.target.value)}
                    required
                  />
                </Label>
                <Actions>
                  <PrimaryButton type="submit" disabled={loading}>
                    {loading ? "Resetting..." : "Reset Password And Continue"}
                  </PrimaryButton>
                </Actions>
              </Form>
            )}
          </>
        ) : (
          <>
            <Title>Team 2026 Simple Details Form</Title>
            <Body>
              Fill this form and submit directly from this page.
            </Body>

            <Notice>
              Signed in as <strong>{teamMeta.email || "your account"}</strong>
            </Notice>

            <MetaGrid>
              <MetaItem>
                Induction status: <MetaValue>{teamMeta.inductionStatus || "selected"}</MetaValue>
              </MetaItem>
              <MetaItem>
                Remaining updates: <MetaValue>{Math.max(Number(teamMeta.remainingEdits || 0), 0)}</MetaValue>
              </MetaItem>
              <MetaItem>
                Submitted before: <MetaValue>{teamMeta.hasSubmitted ? "Yes" : "No"}</MetaValue>
              </MetaItem>
              <MetaItem>
                Live on team page: <MetaValue>{teamMeta.isApproved ? "Yes" : "Pending"}</MetaValue>
              </MetaItem>
            </MetaGrid>

            {uploadError ? <Alert $type="error">{uploadError}</Alert> : null}
            {uploadSuccess ? <Alert $type="success">{uploadSuccess}</Alert> : null}

            {!isSelectedCandidate ? (
              <Alert $type="error">
                Only students with induction status "selected" can submit Team 2026 details.
              </Alert>
            ) : null}

            {teamMeta.hasSubmitted && !hasEditLeft ? (
              <Alert $type="error">You have already used your one allowed update.</Alert>
            ) : null}

            <Form onSubmit={handleUploadSubmit}>
              <Label>
                LinkedIn ID or URL
                <Input
                  type="text"
                  placeholder="www.linkedin.com/in/your-id"
                  value={uploadForm.linkedinId}
                  onChange={(event) => handleUploadFieldChange("linkedinId", event.target.value)}
                  autoComplete="off"
                  required
                />
              </Label>

              <Label>
                GitHub ID
                <Input
                  type="text"
                  placeholder="https://github.com/your-id"
                  value={uploadForm.githubId}
                  onChange={(event) => handleUploadFieldChange("githubId", event.target.value)}
                  autoComplete="off"
                  required
                />
              </Label>

              <Label>
                X Account (optional)
                <Input
                  type="text"
                  placeholder="x.com/your-handle"
                  value={uploadForm.xAccount}
                  onChange={(event) => handleUploadFieldChange("xAccount", event.target.value)}
                />
              </Label>

              <Label>
                Profile Photo{teamMeta.hasSubmitted ? " (optional for update)" : ""}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </Label>
              <FileHint>
                {teamMeta.hasSubmitted
                  ? "Upload photo only if you want to replace the current one."
                  : "Photo is required for first submission. Max file size: 5MB."}
              </FileHint>

              <Actions>
                <PrimaryButton type="submit" disabled={uploading || !isSelectedCandidate || !hasEditLeft}>
                  {uploading
                    ? "Saving..."
                    : teamMeta.hasSubmitted
                      ? "Update Details"
                      : "Submit Details"}
                </PrimaryButton>

                <SecondaryButton
                  type="button"
                  disabled={uploading}
                  onClick={() => {
                    clearUploadAlerts();
                    loadUploadContext(true);
                  }}
                >
                  Refresh Status
                </SecondaryButton>

                <SecondaryButton type="button" disabled={uploading} onClick={handleSwitchAccount}>
                  Switch Account
                </SecondaryButton>
              </Actions>
            </Form>
          </>
        )}

        <HomeLink to="/">Back to Home</HomeLink>
      </Card>
    </Wrapper>
  );
};

export default InductionUploadRedirect;

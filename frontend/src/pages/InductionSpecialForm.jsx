import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { API_BASE_URL } from "../config/api";

const BRANCH_OPTIONS = [
  "Computer Science and Engineering",
  "Information Technology",
  "Electronics and Communication Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Internet of Things",
];

const DOMAIN_OPTIONS = [
  "Web Dev",
  "AI/ML",
  "Cybersecurity",
  "Management",
  "UI/UX",
  "Competitive Programming",
];

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  branch: "",
  section: "",
  rollNumber: "",
  residenceType: "",
  domains: [],
  techStack: "",
  techSkills: "",
  softSkills: "",
  projects: "",
  githubId: "",
  linkedinUrl: "",
  codeforcesId: "",
  codechefId: "",
  hackerrankId: "",
  leetcodeId: "",
  whyJoin: "",
  interestingFact: "",
  otherClubs: "",
  strengths: "",
  weaknesses: "",
};

export default function InductionSpecialForm() {
  const { inviteId, token } = useParams();
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inviteMeta, setInviteMeta] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const inviteValidateUrl = useMemo(
    () => `${API_BASE_URL}/api/induction/special/${encodeURIComponent(inviteId || "")}/${encodeURIComponent(token || "")}`,
    [inviteId, token],
  );

  useEffect(() => {
    const validateInvite = async () => {
      try {
        const response = await fetch(inviteValidateUrl);
        const data = await response.json();
        if (!data.success) {
          setError(data.message || "Invalid invitation link");
          return;
        }
        setInviteMeta(data.data || null);
      } catch {
        setError("Failed to validate invitation link. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    validateInvite();
  }, [inviteValidateUrl]);

  const setValue = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDomainChange = (domain) => {
    setFormData((prev) => {
      const exists = prev.domains.includes(domain);
      return {
        ...prev,
        domains: exists
          ? prev.domains.filter((d) => d !== domain)
          : [...prev.domains, domain],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/induction/special/${encodeURIComponent(inviteId || "")}/${encodeURIComponent(token || "")}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();
      if (!data.success) {
        setError(data.message || "Failed to submit form");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Failed to submit form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <StateMessage>Validating special induction link...</StateMessage>;
  }

  if (error && !inviteMeta) {
    return <StateError>{error}</StateError>;
  }

  if (submitted) {
    return (
      <StateSuccess>
        <h2>Application Submitted</h2>
        <p>Your special induction form has been submitted successfully.</p>
      </StateSuccess>
    );
  }

  return (
    <Container>
      <Card>
        <Title>Special Induction Form</Title>
        <Subtitle>
          This one-time form link is for applicants without college sign-in access.
        </Subtitle>
        <MetaRow>
          <MetaBadge>Invite ID: {inviteMeta?.inviteId || inviteId}</MetaBadge>
          <MetaBadge>
            {inviteMeta?.expiresAt
              ? `Expires: ${new Date(inviteMeta.expiresAt).toLocaleDateString()}`
              : "No Expiry"}
          </MetaBadge>
        </MetaRow>
        {inviteMeta?.note ? <InviteNote>Note: {inviteMeta.note}</InviteNote> : null}
        {error ? <InlineError>{error}</InlineError> : null}

        <Form onSubmit={handleSubmit}>
          <SectionTitle>Basic Details</SectionTitle>
          <Row>
            <Field>
              <Label>First Name *</Label>
              <Input required value={formData.firstName} onChange={(e) => setValue("firstName", e.target.value)} />
            </Field>
            <Field>
              <Label>Last Name *</Label>
              <Input required value={formData.lastName} onChange={(e) => setValue("lastName", e.target.value)} />
            </Field>
          </Row>

          <Row>
            <Field>
              <Label>Email *</Label>
              <Input type="email" required value={formData.email} onChange={(e) => setValue("email", e.target.value)} />
            </Field>
            <Field>
              <Label>Phone *</Label>
              <Input required value={formData.phone} onChange={(e) => setValue("phone", e.target.value)} />
            </Field>
          </Row>

          <Row>
            <Field>
              <Label>Branch *</Label>
              <Select required value={formData.branch} onChange={(e) => setValue("branch", e.target.value)}>
                <option value="">Select branch</option>
                {BRANCH_OPTIONS.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label>Section *</Label>
              <Input required value={formData.section} onChange={(e) => setValue("section", e.target.value)} />
            </Field>
          </Row>

          <Row>
            <Field>
              <Label>Roll Number *</Label>
              <Input required value={formData.rollNumber} onChange={(e) => setValue("rollNumber", e.target.value)} />
            </Field>
            <Field>
              <Label>Residence Type *</Label>
              <Select required value={formData.residenceType} onChange={(e) => setValue("residenceType", e.target.value)}>
                <option value="">Select</option>
                <option value="Hosteler">Hosteler</option>
                <option value="Day Scholar">Day Scholar</option>
              </Select>
            </Field>
          </Row>

          <Field>
            <Label>Interested Domains</Label>
            <CheckboxGrid>
              {DOMAIN_OPTIONS.map((domain) => (
                <CheckboxLabel key={domain}>
                  <input
                    type="checkbox"
                    checked={formData.domains.includes(domain)}
                    onChange={() => handleDomainChange(domain)}
                  />
                  <span>{domain}</span>
                </CheckboxLabel>
              ))}
            </CheckboxGrid>
          </Field>

          <SectionTitle>Technical Background</SectionTitle>
          <Field>
            <Label>Tech Stack</Label>
            <Input value={formData.techStack} onChange={(e) => setValue("techStack", e.target.value)} />
          </Field>

          <Field>
            <Label>Projects</Label>
            <TextArea rows={3} value={formData.projects} onChange={(e) => setValue("projects", e.target.value)} />
          </Field>

          <SectionTitle>Profiles</SectionTitle>
          <Row>
            <Field>
              <Label>GitHub ID *</Label>
              <Input required value={formData.githubId} onChange={(e) => setValue("githubId", e.target.value)} />
            </Field>
            <Field>
              <Label>LinkedIn URL *</Label>
              <Input required value={formData.linkedinUrl} onChange={(e) => setValue("linkedinUrl", e.target.value)} />
            </Field>
          </Row>

          <SectionTitle>Motivation</SectionTitle>
          <Field>
            <Label>Why do you want to join GDG? *</Label>
            <TextArea required rows={4} value={formData.whyJoin} onChange={(e) => setValue("whyJoin", e.target.value)} />
          </Field>

          <Field>
            <Label>Interesting Fact</Label>
            <TextArea rows={2} value={formData.interestingFact} onChange={(e) => setValue("interestingFact", e.target.value)} />
          </Field>

          <RequiredHint>* marked fields are required</RequiredHint>
          <SubmitButton type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Special Form"}
          </SubmitButton>
        </Form>
      </Card>
    </Container>
  );
}

const Container = styled.div`
  min-height: 100vh;
  padding: clamp(14px, 3vw, 28px) 12px;
  background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
`;

const Card = styled.div`
  max-width: 900px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: clamp(14px, 3vw, 24px);
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(22px, 4vw, 30px);
  color: #0f172a;
`;

const Subtitle = styled.p`
  margin: 8px 0 16px;
  color: #475569;
  font-size: 14px;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
`;

const MetaBadge = styled.div`
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #1e40af;
  background: #dbeafe;
`;

const SectionTitle = styled.h3`
  margin: 8px 0 2px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
  font-size: 14px;
  letter-spacing: 0.3px;
  color: #334155;

  &:first-child {
    margin-top: 0;
    border-top: none;
    padding-top: 0;
  }
`;

const InviteNote = styled.div`
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #334155;
`;

const Input = styled.input`
  height: 44px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 16px;
`;

const Select = styled.select`
  height: 44px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 16px;
`;

const TextArea = styled.textarea`
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 16px;
  resize: vertical;
`;

const CheckboxGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #334155;
  padding: 6px 8px;
  border-radius: 8px;
  background: #f8fafc;

  input {
    width: 16px;
    height: 16px;
  }
`;

const RequiredHint = styled.div`
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
`;

const SubmitButton = styled.button`
  margin-top: 8px;
  height: 44px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const StateMessage = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #334155;
  font-size: 16px;
`;

const StateError = styled(StateMessage)`
  color: #b91c1c;
`;

const StateSuccess = styled(StateMessage)`
  flex-direction: column;
  gap: 8px;
  color: #166534;

  h2 {
    margin: 0;
  }

  p {
    margin: 0;
  }
`;

const InlineError = styled.div`
  margin-bottom: 10px;
  padding: 10px 12px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #991b1b;
  background: #fef2f2;
`;

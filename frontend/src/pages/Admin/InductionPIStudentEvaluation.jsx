import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth";
import { API_BASE_URL } from "../../config/api";
import {
  showApiErrorToast,
  showSuccessToast,
  showWarningToast,
} from "../../utils/toastUtils";

const API = `${API_BASE_URL}/api`;

const recommendationOptions = [
  { value: "hold", label: "Hold" },
  { value: "shortlisted_offline", label: "Shortlist Offline" },
  { value: "selected", label: "Recommend Selected" },
  { value: "rejected", label: "Recommend Rejected" },
];

const finalStatusOptions = [
  { value: "shortlisted_online", label: "Shortlisted Online" },
  { value: "shortlisted_offline", label: "Shortlisted Offline" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
];

const getBasePath = (role) => {
  if (role === "super_admin") return "/super-admin";
  if (role === "event_manager") return "/event-manager";
  return "/admin";
};

export default function InductionPIStudentEvaluation() {
  const { panelId, studentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingEval, setSavingEval] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const [form, setForm] = useState({
    overallRating: "",
    technicalSkills: "",
    softSkills: "",
    recommendation: "hold",
    comment: "",
    review: "",
  });

  const [finalStatus, setFinalStatus] = useState("shortlisted_offline");
  const [finalNote, setFinalNote] = useState("");

  const tokenConfig = useMemo(() => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/induction/panels/${panelId}/students/${studentId}`, tokenConfig);
      if (data?.success) {
        const payload = data.data;
        setDetail(payload);

        const evalData = payload.myEvaluation || {};
        setForm({
          overallRating: evalData.overallRating ?? "",
          technicalSkills: evalData.technicalSkills ?? "",
          softSkills: evalData.softSkills ?? "",
          recommendation: evalData.recommendation || "hold",
          comment: evalData.comment || "",
          review: evalData.review || "",
        });

        setFinalStatus(payload.panelEntry?.finalStatus || "shortlisted_offline");
        setFinalNote(payload.panelEntry?.finalNote || "");
      }
    } catch (error) {
      console.error("Failed to fetch student evaluation detail:", error);
      showApiErrorToast(error, "Failed to fetch student details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelId, studentId]);

  const saveEvaluation = async () => {
    if (!detail?.piControl?.isPiStarted) {
      showWarningToast("PI is not started yet.");
      return;
    }

    setSavingEval(true);
    try {
      const { data } = await axios.post(
        `${API}/induction/panels/${panelId}/evaluate`,
        {
          studentId,
          overallRating: Number(form.overallRating),
          technicalSkills: Number(form.technicalSkills),
          softSkills: Number(form.softSkills),
          recommendation: form.recommendation,
          comment: form.comment,
          review: form.review,
          remarks: form.review,
        },
        tokenConfig,
      );

      if (data?.success) {
        showSuccessToast("Evaluation saved.");
        await fetchDetail();
      }
    } catch (error) {
      console.error("Save evaluation failed:", error);
      showApiErrorToast(error, "Failed to save evaluation.");
    } finally {
      setSavingEval(false);
    }
  };

  const finalizeStudent = async () => {
    if (!detail?.piControl?.isPiStarted) {
      showWarningToast("PI is not started yet.");
      return;
    }

    setFinalizing(true);
    try {
      const { data } = await axios.post(
        `${API}/induction/panels/${panelId}/finalize`,
        {
          studentId,
          finalStatus,
          finalNote,
        },
        tokenConfig,
      );

      if (data?.success) {
        showSuccessToast("Student finalized.");
        await fetchDetail();
      }
    } catch (error) {
      console.error("Finalize student failed:", error);
      showApiErrorToast(error, "Failed to finalize student.");
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return <StateCard>Loading student profile...</StateCard>;
  }

  if (!detail?.student) {
    return <StateCard>Student detail not found.</StateCard>;
  }

  const student = detail.student;

  return (
    <Wrap>
      <TopBar>
        <div>
          <h2>{student.firstName} {student.lastName}</h2>
          <p>{student.email} | {student.rollNumber || "-"}</p>
        </div>
        <button type="button" onClick={() => navigate(`${getBasePath(user?.role)}/induction-pi`)}>
          Back To PI Page
        </button>
      </TopBar>

      {!detail.piControl?.isPiStarted && (
        <StateCard>PI is not started yet. You can view details but cannot submit evaluation.</StateCard>
      )}

      <Grid>
        <Card>
          <h3>📋 Basic Information</h3>
          <DetailsList>
            <li><strong>Roll Number:</strong> {student.rollNumber || "-"}</li>
            <li><strong>Email:</strong> {student.email || "-"}</li>
            <li><strong>Phone:</strong> {student.phone || "-"}</li>
            <li><strong>Branch:</strong> {student.branch || "-"}</li>
            <li><strong>Section:</strong> {student.section || "-"}</li>
            <li><strong>Residence:</strong> {student.residenceType || "-"}</li>
          </DetailsList>
        </Card>

        <Card>
          <h3>💻 Technical Profile</h3>
          <DetailsList>
            <li><strong>Domains:</strong> {(student.domains || []).join(", ") || "-"}</li>
            <li><strong>Tech Stack:</strong> {student.techStack || "-"}</li>
            <li><strong>Technical Skills:</strong> {student.techSkills || "-"}</li>
            <li><strong>Soft Skills:</strong> {student.softSkills || "-"}</li>
            <li><strong>Projects:</strong> {student.projects || "-"}</li>
          </DetailsList>
        </Card>
      </Grid>

      <Grid>
        <Card>
          <h3>🔗 Online Profiles</h3>
          <DetailsList>
            <li>
              <strong>GitHub:</strong>{" "}
              {student.githubId ? (
                <a href={`https://github.com/${student.githubId}`} target="_blank" rel="noopener noreferrer">
                  {student.githubId}
                </a>
              ) : "-"}
            </li>
            <li>
              <strong>LinkedIn:</strong>{" "}
              {student.linkedinUrl ? (
                <a href={student.linkedinUrl} target="_blank" rel="noopener noreferrer">
                  View Profile
                </a>
              ) : "-"}
            </li>
            <li>
              <strong>LeetCode:</strong>{" "}
              {student.leetcodeId ? (
                <a href={`https://leetcode.com/${student.leetcodeId}`} target="_blank" rel="noopener noreferrer">
                  {student.leetcodeId}
                </a>
              ) : "-"}
            </li>
            <li>
              <strong>Codeforces:</strong>{" "}
              {student.codeforcesId ? (
                <a href={`https://codeforces.com/profile/${student.codeforcesId}`} target="_blank" rel="noopener noreferrer">
                  {student.codeforcesId}
                </a>
              ) : "-"}
            </li>
            <li>
              <strong>CodeChef:</strong>{" "}
              {student.codechefId ? (
                <a href={`https://www.codechef.com/users/${student.codechefId}`} target="_blank" rel="noopener noreferrer">
                  {student.codechefId}
                </a>
              ) : "-"}
            </li>
            <li>
              <strong>HackerRank:</strong>{" "}
              {student.hackerrankId ? (
                <a href={`https://www.hackerrank.com/${student.hackerrankId}`} target="_blank" rel="noopener noreferrer">
                  {student.hackerrankId}
                </a>
              ) : "-"}
            </li>
          </DetailsList>
        </Card>

        <Card>
          <h3>📄 Resume & Documents</h3>
          <DetailsList>
            <li>
              <strong>Resume:</strong>{" "}
              {student.resumeUrl ? (
                <a href={student.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 600 }}>
                  📥 View/Download Resume
                </a>
              ) : "Not uploaded"}
            </li>
          </DetailsList>
        </Card>
      </Grid>

      <Card>
        <h3>💬 Personal Statements</h3>
        <DetailsList>
          <li>
            <strong>Why Join GDG?</strong>
            <div style={{ marginTop: '8px', padding: '12px', background: '#f8fafc', borderRadius: '8px', color: '#1e293b' }}>
              {student.whyJoin || "-"}
            </div>
          </li>
          <li style={{ marginTop: '16px' }}>
            <strong>Interesting Fact:</strong>
            <div style={{ marginTop: '8px', padding: '12px', background: '#f8fafc', borderRadius: '8px', color: '#1e293b' }}>
              {student.interestingFact || "-"}
            </div>
          </li>
          <li style={{ marginTop: '16px' }}>
            <strong>Other Clubs/Activities:</strong>
            <div style={{ marginTop: '8px', padding: '12px', background: '#f8fafc', borderRadius: '8px', color: '#1e293b' }}>
              {student.otherClubs || "-"}
            </div>
          </li>
          <li style={{ marginTop: '16px' }}>
            <strong>Strengths:</strong>
            <div style={{ marginTop: '8px', padding: '12px', background: '#f8fafc', borderRadius: '8px', color: '#1e293b' }}>
              {student.strengths || "-"}
            </div>
          </li>
          <li style={{ marginTop: '16px' }}>
            <strong>Weaknesses:</strong>
            <div style={{ marginTop: '8px', padding: '12px', background: '#f8fafc', borderRadius: '8px', color: '#1e293b' }}>
              {student.weaknesses || "-"}
            </div>
          </li>
        </DetailsList>
      </Card>

      <Grid>

        <Card>
          <h3>Evaluation Form</h3>
          <Field>
            <label>Overall Rating (1-10)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={form.overallRating}
              onChange={(e) => setForm((prev) => ({ ...prev, overallRating: e.target.value }))}
              disabled={!detail.piControl?.isPiStarted}
            />
          </Field>
          <Field>
            <label>Technical Skills (1-10)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={form.technicalSkills}
              onChange={(e) => setForm((prev) => ({ ...prev, technicalSkills: e.target.value }))}
              disabled={!detail.piControl?.isPiStarted}
            />
          </Field>
          <Field>
            <label>Soft Skills (1-10)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={form.softSkills}
              onChange={(e) => setForm((prev) => ({ ...prev, softSkills: e.target.value }))}
              disabled={!detail.piControl?.isPiStarted}
            />
          </Field>
          <Field>
            <label>Recommendation</label>
            <select
              value={form.recommendation}
              onChange={(e) => setForm((prev) => ({ ...prev, recommendation: e.target.value }))}
              disabled={!detail.piControl?.isPiStarted}
            >
              {recommendationOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
          <Field>
            <label>Comment</label>
            <textarea
              rows={3}
              value={form.comment}
              onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
              disabled={!detail.piControl?.isPiStarted}
            />
          </Field>
          <Field>
            <label>Review</label>
            <textarea
              rows={3}
              value={form.review}
              onChange={(e) => setForm((prev) => ({ ...prev, review: e.target.value }))}
              disabled={!detail.piControl?.isPiStarted}
            />
          </Field>
          <ActionRow>
            <button type="button" onClick={saveEvaluation} disabled={savingEval || !detail.piControl?.isPiStarted}>
              {savingEval ? "Saving..." : "Save Evaluation"}
            </button>
          </ActionRow>
        </Card>
      </Grid>

      <Card>
        <h3>Finalize Student</h3>
        <FinalizeGrid>
          <Field>
            <label>Final Status</label>
            <select
              value={finalStatus}
              onChange={(e) => setFinalStatus(e.target.value)}
              disabled={!detail.piControl?.isPiStarted}
            >
              {finalStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
          <Field>
            <label>Final Note</label>
            <textarea
              rows={3}
              value={finalNote}
              onChange={(e) => setFinalNote(e.target.value)}
              disabled={!detail.piControl?.isPiStarted}
            />
          </Field>
        </FinalizeGrid>
        <ActionRow>
          <button type="button" onClick={finalizeStudent} disabled={finalizing || !detail.piControl?.isPiStarted}>
            {finalizing ? "Finalizing..." : "Finalize Student"}
          </button>
        </ActionRow>
      </Card>
    </Wrap>
  );
}

const Wrap = styled.div`
  display: grid;
  gap: 12px;
`;

const TopBar = styled.div`
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: #f8fbff;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;

  h2 {
    margin: 0;
    color: #0f172a;
    font-size: 22px;
  }

  p {
    margin: 4px 0 0;
    color: #475569;
    font-size: 13px;
  }

  button {
    border: none;
    border-radius: 8px;
    padding: 8px 11px;
    background: #1d4ed8;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.section`
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: #ffffff;
  padding: 12px;

  h3 {
    margin: 0 0 8px;
    color: #1e3a8a;
    font-size: 16px;
  }
`;

const DetailsList = styled.ul`
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 6px;

  li {
    font-size: 13px;
    color: #334155;
  }

  strong {
    color: #0f172a;
  }

  a {
    color: #3b82f6;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }

  div {
    .dark & {
      background: #0f172a !important;
      color: #cbd5e1 !important;
    }
  }

  .dark & li {
    color: #94a3b8;
  }

  .dark & strong {
    color: #e2e8f0;
  }
`;

const Field = styled.div`
  display: grid;
  gap: 5px;
  margin-bottom: 8px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: #1e293b;
  }

  input,
  select,
  textarea {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
  }
`;

const FinalizeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 10px;

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
  }
`;

const ActionRow = styled.div`
  margin-top: 8px;

  button {
    border: none;
    border-radius: 8px;
    padding: 8px 11px;
    background: #0ea5e9;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const StateCard = styled.div`
  border: 1px dashed #94a3b8;
  border-radius: 10px;
  padding: 12px;
  color: #475569;
  font-size: 13px;
  background: #ffffff;
`;

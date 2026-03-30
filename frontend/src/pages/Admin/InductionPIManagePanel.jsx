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

const getBasePath = (role) => {
  if (role === "super_admin") return "/super-admin";
  if (role === "event_manager") return "/event-manager";
  return "/admin";
};

export default function InductionPIManagePanel() {
  const { panelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [panel, setPanel] = useState(null);
  const [allPanels, setAllPanels] = useState([]);
  const [members, setMembers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [piControl, setPiControl] = useState({ piRound: "shortlisted_online", isPiStarted: false });

  const [memberIds, setMemberIds] = useState([]);
  const [studentIds, setStudentIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMembers, setSavingMembers] = useState(false);
  const [savingStudents, setSavingStudents] = useState(false);

  const tokenConfig = useMemo(() => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [panelRes, panelsRes, membersRes, controlRes] = await Promise.all([
        axios.get(`${API}/induction/panels/${panelId}`, tokenConfig),
        axios.get(`${API}/induction/panels`, tokenConfig),
        axios.get(`${API}/induction/panel-members`, tokenConfig),
        axios.get(`${API}/induction/pi-control`, tokenConfig),
      ]);

      const panelData = panelRes.data?.data;
      const controlData = controlRes.data?.data || {};

      if (!panelData) {
        setPanel(null);
        return;
      }

      setPanel(panelData);
      setAllPanels(panelsRes.data?.data || []);
      setMembers(membersRes.data?.data || []);
      setPiControl(controlData);

      const nextMemberIds = (panelData.members || []).map((member) => String(member._id || member));
      setMemberIds(nextMemberIds);

      const nextStudentIds = (panelData.students || []).map((entry) => String(entry.student?._id || entry.student));
      setStudentIds(nextStudentIds.filter(Boolean));

      const round = controlData.piRound || "shortlisted_online";
      const candidatesRes = await axios.get(`${API}/induction/pi-candidates?round=${encodeURIComponent(round)}`, tokenConfig);
      if (candidatesRes.data?.success) {
        setCandidates(candidatesRes.data.data || []);
      }
    } catch (error) {
      console.error("Failed to load panel management:", error);
      showApiErrorToast(error, "Failed to load panel management data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelId]);

  const otherPanelManagerIds = useMemo(() => {
    const set = new Set();
    allPanels
      .filter((entry) => String(entry._id) !== String(panelId))
      .forEach((entry) => {
        (entry.members || []).forEach((member) => {
          if (member?._id) set.add(String(member._id));
        });
      });
    return set;
  }, [allPanels, panelId]);

  const toggleMember = (id) => {
    const sid = String(id);
    setMemberIds((prev) =>
      prev.includes(sid) ? prev.filter((value) => value !== sid) : [...prev, sid],
    );
  };

  const toggleStudent = (id) => {
    const sid = String(id);
    setStudentIds((prev) =>
      prev.includes(sid) ? prev.filter((value) => value !== sid) : [...prev, sid],
    );
  };

  const saveMembers = async () => {
    if (!memberIds.length) {
      showWarningToast("At least one panel member is required.");
      return;
    }

    setSavingMembers(true);
    try {
      const { data } = await axios.patch(
        `${API}/induction/panels/${panelId}`,
        {
          name: panel?.name,
          description: panel?.description || "",
          memberUserIds: memberIds,
        },
        tokenConfig,
      );

      if (data?.success) {
        showSuccessToast("Panel members updated successfully.");
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to save members:", error);
      showApiErrorToast(error, "Failed to save panel members.");
    } finally {
      setSavingMembers(false);
    }
  };

  const saveStudents = async () => {
    setSavingStudents(true);
    try {
      const { data } = await axios.patch(
        `${API}/induction/panels/${panelId}/students`,
        {
          mode: "set",
          studentIds,
        },
        tokenConfig,
      );

      if (data?.success) {
        showSuccessToast("Panel students updated successfully.");
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to save students:", error);
      showApiErrorToast(error, "Failed to save panel students.");
    } finally {
      setSavingStudents(false);
    }
  };

  if (loading) {
    return <StateCard>Loading panel management...</StateCard>;
  }

  if (!panel) {
    return <StateCard>Panel not found.</StateCard>;
  }

  return (
    <Wrap>
      <TopBar>
        <div>
          <h2>Manage {panel.name}</h2>
          <p>Round: {piControl.piRound === "shortlisted_offline" ? "Offline PI" : "Online PI"}</p>
        </div>
        <button type="button" onClick={() => navigate(`${getBasePath(user?.role)}/induction-pi`)}>
          Back To PI Home
        </button>
      </TopBar>

      <Grid>
        <SectionCard>
          <h3>Panel Members</h3>
          <small>One event manager can belong to only one panel.</small>
          <BoxGrid>
            {members.map((member) => {
              const id = String(member._id);
              const selected = memberIds.includes(id);
              const busyInOtherPanel = otherPanelManagerIds.has(id);

              return (
                <PickBox
                  key={id}
                  type="button"
                  $active={selected}
                  disabled={busyInOtherPanel}
                  onClick={() => !busyInOtherPanel && toggleMember(id)}
                >
                  <strong>{member.name}</strong>
                  <small>{member.email}</small>
                  <span>{busyInOtherPanel ? "Assigned to another panel" : selected ? "Selected" : "Available"}</span>
                </PickBox>
              );
            })}
          </BoxGrid>
          <ActionRow>
            <button type="button" onClick={saveMembers} disabled={savingMembers}>
              {savingMembers ? "Saving..." : "Save Panel Members"}
            </button>
          </ActionRow>
        </SectionCard>

        <SectionCard>
          <h3>Shortlisted Students</h3>
          <small>Each student can belong to only one panel.</small>
          <StudentList>
            {candidates.map((student) => {
              const id = String(student._id);
              const selected = studentIds.includes(id);
              const assignedElsewhere =
                student.assignedPanel &&
                String(student.assignedPanel.panelId) !== String(panelId);

              return (
                <StudentRow key={id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={assignedElsewhere}
                      onChange={() => toggleStudent(id)}
                    />
                    <div>
                      <strong>{student.firstName} {student.lastName}</strong>
                      <small>{student.email} | {student.rollNumber || "-"}</small>
                    </div>
                  </label>
                  <span>
                    {assignedElsewhere
                      ? `In ${student.assignedPanel.panelName}`
                      : selected
                        ? "Selected"
                        : "Available"}
                  </span>
                </StudentRow>
              );
            })}
          </StudentList>
          <ActionRow>
            <button type="button" onClick={saveStudents} disabled={savingStudents}>
              {savingStudents ? "Saving..." : "Save Panel Students"}
            </button>
          </ActionRow>
        </SectionCard>
      </Grid>
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

const SectionCard = styled.section`
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: #ffffff;
  padding: 12px;

  h3 {
    margin: 0;
    color: #1e3a8a;
    font-size: 16px;
  }

  small {
    color: #64748b;
    font-size: 12px;
  }
`;

const BoxGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const PickBox = styled.button`
  border: 1px solid ${(props) => (props.$active ? "#2563eb" : "#cbd5e1")};
  background: ${(props) => (props.$active ? "#eff6ff" : "#ffffff")};
  border-radius: 10px;
  padding: 10px;
  text-align: left;
  cursor: pointer;
  display: grid;
  gap: 2px;

  strong {
    font-size: 12px;
    color: #0f172a;
  }

  small {
    color: #475569;
    font-size: 11px;
  }

  span {
    color: ${(props) => (props.disabled ? "#b91c1c" : "#1d4ed8")};
    font-size: 10px;
    font-weight: 700;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const StudentList = styled.div`
  margin-top: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  max-height: 380px;
  overflow: auto;
`;

const StudentRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px solid #e2e8f0;

  &:last-child {
    border-bottom: none;
  }

  label {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex: 1;
    cursor: pointer;
  }

  strong {
    display: block;
    font-size: 12px;
    color: #0f172a;
  }

  small {
    display: block;
    font-size: 11px;
    color: #64748b;
  }

  span {
    font-size: 11px;
    color: #1d4ed8;
    font-weight: 700;
    white-space: nowrap;
  }
`;

const ActionRow = styled.div`
  margin-top: 10px;

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

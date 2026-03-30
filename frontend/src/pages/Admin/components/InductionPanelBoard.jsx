import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import PropTypes from "prop-types";
import { API_BASE_URL } from "../../../config/api";

const API = `${API_BASE_URL}/api`;

const statusOptions = [
  { value: "shortlisted_online", label: "Shortlisted Online" },
  { value: "shortlisted_offline", label: "Shortlisted Offline" },
  { value: "selected", label: "Selected" },
  { value: "rejected", label: "Rejected" },
];

const recommendationOptions = [
  { value: "hold", label: "Hold" },
  { value: "shortlisted_offline", label: "Shortlist Offline" },
  { value: "selected", label: "Recommend Selected" },
  { value: "rejected", label: "Recommend Rejected" },
];

export default function InductionPanelBoard({ user, selectedStudentIds = [] }) {
  const isSuperAdmin = user?.role === "super_admin";
  const [panels, setPanels] = useState([]);
  const [panelMembers, setPanelMembers] = useState([]);
  const [selectedPanelId, setSelectedPanelId] = useState("");
  const [panelStudents, setPanelStudents] = useState([]);
  const [loadingPanels, setLoadingPanels] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [creatingPanel, setCreatingPanel] = useState(false);
  const [assigningStudents, setAssigningStudents] = useState(false);
  const [savingEvaluationIds, setSavingEvaluationIds] = useState(new Set());
  const [finalizingIds, setFinalizingIds] = useState(new Set());
  const [isEditingPanel, setIsEditingPanel] = useState(false);
  const [updatingPanel, setUpdatingPanel] = useState(false);
  const [startingPi, setStartingPi] = useState(false);
  const [showEvaluationBoard, setShowEvaluationBoard] = useState(!isSuperAdmin);

  const [newPanelName, setNewPanelName] = useState("");
  const [newPanelDescription, setNewPanelDescription] = useState("");
  const [newPanelMemberIds, setNewPanelMemberIds] = useState([]);
  const [editPanelName, setEditPanelName] = useState("");
  const [editPanelDescription, setEditPanelDescription] = useState("");
  const [editPanelMemberIds, setEditPanelMemberIds] = useState([]);

  const [drafts, setDrafts] = useState({});

  const selectedPanel = useMemo(
    () => panels.find((panel) => String(panel._id) === String(selectedPanelId)) || null,
    [panels, selectedPanelId],
  );

  const selectedCount = selectedStudentIds.length;

  const tokenConfig = useMemo(() => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  const fetchPanels = async () => {
    setLoadingPanels(true);
    try {
      const { data } = await axios.get(`${API}/induction/panels`, tokenConfig);
      if (data?.success) {
        const list = data.data || [];
        setPanels(list);
        setSelectedPanelId((prev) => {
          const hasPrev = list.some((panel) => String(panel._id) === String(prev));
          if (hasPrev) return String(prev);
          return list.length > 0 ? String(list[0]._id) : "";
        });
      }
    } catch (err) {
      console.error("Failed to fetch induction panels:", err);
    } finally {
      setLoadingPanels(false);
    }
  };

  const fetchPanelMembers = async () => {
    if (!isSuperAdmin) return;
    try {
      const { data } = await axios.get(`${API}/induction/panel-members`, tokenConfig);
      if (data?.success) {
        setPanelMembers(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch panel members:", err);
    }
  };

  const fetchPanelStudents = async (panelId) => {
    if (!panelId) {
      setPanelStudents([]);
      return;
    }

    setLoadingStudents(true);
    try {
      const { data } = await axios.get(`${API}/induction/panels/${panelId}/students`, tokenConfig);
      if (data?.success) {
        const rows = data.data?.students || [];
        setPanelStudents(rows);

        const currentUserId = user?.id || user?._id;
        const nextDrafts = {};
        rows.forEach((row) => {
          const sid = String(row.student?._id || "");
          if (!sid) return;

          const myEvaluation = row.myEvaluation;
          nextDrafts[sid] = {
            score: myEvaluation?.score ?? "",
            remarks: myEvaluation?.remarks || "",
            recommendation: myEvaluation?.recommendation || "hold",
            finalStatus: row.finalStatus || "shortlisted_offline",
            finalNote: row.finalNote || "",
            myEvaluatorId: myEvaluation?.evaluator?._id || currentUserId,
          };
        });
        setDrafts(nextDrafts);
      }
    } catch (err) {
      console.error("Failed to fetch panel students:", err);
      setPanelStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchPanels();
    fetchPanelMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPanelStudents(selectedPanelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPanelId]);

  useEffect(() => {
    if (!selectedPanel) {
      setIsEditingPanel(false);
      setEditPanelName("");
      setEditPanelDescription("");
      setEditPanelMemberIds([]);
      return;
    }

    setEditPanelName(selectedPanel.name || "");
    setEditPanelDescription(selectedPanel.description || "");
    const safeMemberIds = (selectedPanel.members || [])
      .filter((member) => {
        if (!member || typeof member !== "object") return true;
        return member.role === "event_manager";
      })
      .map((member) => String(member._id || member));
    setEditPanelMemberIds(safeMemberIds);
    setIsEditingPanel(false);
  }, [selectedPanel]);

  useEffect(() => {
    setShowEvaluationBoard(!isSuperAdmin);
  }, [isSuperAdmin, selectedPanelId]);

  const updateDraft = (studentId, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        ...patch,
      },
    }));
  };

  const toggleMemberSelection = (memberId, mode = "new") => {
    const normalizedId = String(memberId);
    const setTarget = mode === "edit" ? setEditPanelMemberIds : setNewPanelMemberIds;

    setTarget((prev) =>
      prev.includes(normalizedId)
        ? prev.filter((id) => id !== normalizedId)
        : [...prev, normalizedId],
    );
  };

  const handleCreatePanel = async () => {
    if (!newPanelName.trim()) {
      alert("Panel name is required.");
      return;
    }
    if (!newPanelMemberIds.length) {
      alert("Select at least one member for this panel.");
      return;
    }

    setCreatingPanel(true);
    try {
      const { data } = await axios.post(
        `${API}/induction/panels`,
        {
          name: newPanelName.trim(),
          description: newPanelDescription.trim(),
          memberUserIds: newPanelMemberIds,
        },
        tokenConfig,
      );

      if (data?.success) {
        setNewPanelName("");
        setNewPanelDescription("");
        setNewPanelMemberIds([]);
        await fetchPanels();
        if (data?.data?._id) {
          setSelectedPanelId(String(data.data._id));
        }
      }
    } catch (err) {
      console.error("Failed to create panel:", err);
      alert(err.response?.data?.message || "Failed to create panel.");
    } finally {
      setCreatingPanel(false);
    }
  };

  const handleAssignSelectedStudents = async () => {
    if (!selectedPanelId) {
      alert("Select a panel first.");
      return;
    }

    if (!selectedStudentIds.length) {
      alert("Select shortlisted students from the table first.");
      return;
    }

    setAssigningStudents(true);
    try {
      const { data } = await axios.patch(
        `${API}/induction/panels/${selectedPanelId}/students`,
        {
          studentIds: selectedStudentIds,
          mode: "add",
        },
        tokenConfig,
      );

      if (data?.success) {
        alert("Students assigned to panel successfully.");
        fetchPanelStudents(selectedPanelId);
      }
    } catch (err) {
      console.error("Failed to assign students:", err);
      alert(err.response?.data?.message || "Failed to assign students to panel.");
    } finally {
      setAssigningStudents(false);
    }
  };

  const handleUpdatePanel = async () => {
    if (!selectedPanelId) {
      alert("Select a panel first.");
      return;
    }

    if (!editPanelName.trim()) {
      alert("Panel name is required.");
      return;
    }

    if (!editPanelMemberIds.length) {
      alert("Select at least one event manager for this panel.");
      return;
    }

    setUpdatingPanel(true);
    try {
      const { data } = await axios.patch(
        `${API}/induction/panels/${selectedPanelId}`,
        {
          name: editPanelName.trim(),
          description: editPanelDescription.trim(),
          memberUserIds: editPanelMemberIds,
        },
        tokenConfig,
      );

      if (data?.success) {
        alert("Panel updated successfully.");
        setIsEditingPanel(false);
        await fetchPanels();
      }
    } catch (err) {
      console.error("Failed to update panel:", err);
      alert(err.response?.data?.message || "Failed to update panel.");
    } finally {
      setUpdatingPanel(false);
    }
  };

  const handleStartPi = async () => {
    if (!selectedPanelId) {
      alert("Select a panel first.");
      return;
    }

    if (!window.confirm("Start PI round for this panel? This enables evaluations for assigned students.")) {
      return;
    }

    setStartingPi(true);
    try {
      const { data } = await axios.post(
        `${API}/induction/panels/${selectedPanelId}/start-pi`,
        {},
        tokenConfig,
      );

      if (data?.success) {
        alert(data.message || "PI round started successfully.");
        await fetchPanels();
        await fetchPanelStudents(selectedPanelId);
      }
    } catch (err) {
      console.error("Failed to start PI:", err);
      alert(err.response?.data?.message || "Failed to start PI.");
    } finally {
      setStartingPi(false);
    }
  };

  const handleSaveEvaluation = async (studentId) => {
    const sid = String(studentId);
    const draft = drafts[sid] || {};
    const score = Number(draft.score);

    if (Number.isNaN(score) || score < 0 || score > 100) {
      alert("Score must be between 0 and 100.");
      return;
    }

    setSavingEvaluationIds((prev) => new Set(prev).add(sid));
    try {
      const { data } = await axios.post(
        `${API}/induction/panels/${selectedPanelId}/evaluate`,
        {
          studentId: sid,
          score,
          remarks: draft.remarks || "",
          recommendation: draft.recommendation || "hold",
        },
        tokenConfig,
      );

      if (data?.success) {
        await fetchPanelStudents(selectedPanelId);
      }
    } catch (err) {
      console.error("Failed to save evaluation:", err);
      alert(err.response?.data?.message || "Failed to save evaluation.");
    } finally {
      setSavingEvaluationIds((prev) => {
        const next = new Set(prev);
        next.delete(sid);
        return next;
      });
    }
  };

  const handleFinalizeStudent = async (studentId) => {
    const sid = String(studentId);
    const draft = drafts[sid] || {};

    if (!draft.finalStatus) {
      alert("Choose final status first.");
      return;
    }

    setFinalizingIds((prev) => new Set(prev).add(sid));
    try {
      const { data } = await axios.post(
        `${API}/induction/panels/${selectedPanelId}/finalize`,
        {
          studentId: sid,
          finalStatus: draft.finalStatus,
          finalNote: draft.finalNote || "",
        },
        tokenConfig,
      );

      if (data?.success) {
        await fetchPanelStudents(selectedPanelId);
      }
    } catch (err) {
      console.error("Failed to finalize student:", err);
      alert(err.response?.data?.message || "Failed to finalize student.");
    } finally {
      setFinalizingIds((prev) => {
        const next = new Set(prev);
        next.delete(sid);
        return next;
      });
    }
  };

  return (
    <Wrap>
      <Header>
        <h3>Induction Panels & Evaluation</h3>
        <small>Clean flow: create panel, pick panel box, assign selected students, then start PI.</small>
      </Header>

      {isSuperAdmin && (
        <WorkflowStrip>
          <StepPill>
            <strong>Step 1</strong>
            <span>Create panel and choose event managers</span>
          </StepPill>
          <StepPill>
            <strong>Step 2</strong>
            <span>Click a panel box to make it active</span>
          </StepPill>
          <StepPill>
            <strong>Step 3</strong>
            <span>Assign selected next-round students and start PI</span>
          </StepPill>
        </WorkflowStrip>
      )}

      {isSuperAdmin && (
        <CreatePanelCard>
          <PanelRow>
            <Field>
              <label>Panel Name</label>
              <input
                value={newPanelName}
                onChange={(e) => setNewPanelName(e.target.value)}
                placeholder="Panel 1"
              />
            </Field>
            <Field>
              <label>Description</label>
              <input
                value={newPanelDescription}
                onChange={(e) => setNewPanelDescription(e.target.value)}
                placeholder="Optional"
              />
            </Field>
          </PanelRow>

          <Field>
            <label>Panel Members (event managers)</label>
            <MemberGrid>
              {panelMembers.map((member) => (
                <MemberBox
                  key={member._id}
                  type="button"
                  $active={newPanelMemberIds.includes(String(member._id))}
                  onClick={() => toggleMemberSelection(member._id, "new")}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={newPanelMemberIds.includes(String(member._id))}
                  />
                  <div>
                    <strong>{member.name}</strong>
                    <small>{member.email}</small>
                  </div>
                </MemberBox>
              ))}
            </MemberGrid>
          </Field>

          <ButtonRow>
            <button type="button" onClick={handleCreatePanel} disabled={creatingPanel}>
              {creatingPanel ? "Creating..." : "Create Panel"}
            </button>
          </ButtonRow>
        </CreatePanelCard>
      )}

      {loadingPanels ? (
        <State>Loading panels...</State>
      ) : !panels.length ? (
        <State>No panels yet. Create one above.</State>
      ) : (
        <PanelSelectionWrap>
          <SelectionTitle>Select Panel Box</SelectionTitle>
          <PanelCards>
            {panels.map((panel) => {
              const isActive = String(panel._id) === String(selectedPanelId);
              const memberNames = (panel.members || []).map((member) => member?.name).filter(Boolean);

              return (
                <PanelCard
                  key={panel._id}
                  type="button"
                  $active={isActive}
                  onClick={() => setSelectedPanelId(String(panel._id))}
                >
                  <PanelCardTop>
                    <strong>{panel.name}</strong>
                    <StatusPill $started={!!panel.piStarted}>
                      {panel.piStarted ? "PI Started" : "PI Pending"}
                    </StatusPill>
                  </PanelCardTop>
                  <PanelCardText>{panel.description || "No description"}</PanelCardText>
                  <PanelCardMeta>
                    Members: {memberNames.length ? memberNames.join(", ") : "Not assigned"}
                  </PanelCardMeta>
                </PanelCard>
              );
            })}
          </PanelCards>

          {isSuperAdmin && selectedPanel && (
            <SelectedPanelActions>
              <div>
                <strong>{selectedPanel.name}</strong>
                <small>
                  Active panel: assign selected next-round students into this panel.
                </small>
              </div>
              <button
                type="button"
                disabled={!selectedPanelId || !selectedStudentIds.length || assigningStudents}
                onClick={handleAssignSelectedStudents}
              >
                {assigningStudents ? "Assigning..." : `Assign Selected (${selectedCount})`}
              </button>
            </SelectedPanelActions>
          )}
        </PanelSelectionWrap>
      )}

      {selectedPanel && (
        <PanelMeta>
          <small>
            PI Status: <strong>{selectedPanel.piStarted ? "Started" : "Not Started"}</strong>
          </small>
          {selectedPanel.piStartedAt && (
            <small>Started At: {new Date(selectedPanel.piStartedAt).toLocaleString()}</small>
          )}
        </PanelMeta>
      )}

      {isSuperAdmin && selectedPanel && (
        <EditPanelCard>
          <EditHeader>
            <h4>Panel Controls</h4>
            <ControlButtons>
              <button
                type="button"
                onClick={() => setIsEditingPanel((prev) => !prev)}
                disabled={updatingPanel}
              >
                {isEditingPanel ? "Cancel Edit" : "Edit Panel"}
              </button>
              <button
                type="button"
                onClick={handleStartPi}
                disabled={selectedPanel.piStarted || startingPi}
              >
                {selectedPanel.piStarted
                  ? "PI Started"
                  : startingPi
                    ? "Starting PI..."
                    : "Start PI"}
              </button>
            </ControlButtons>
          </EditHeader>

          {isEditingPanel && (
            <>
              <PanelRow>
                <Field>
                  <label>Panel Name</label>
                  <input
                    value={editPanelName}
                    onChange={(e) => setEditPanelName(e.target.value)}
                    placeholder="Panel 1"
                  />
                </Field>
                <Field>
                  <label>Description</label>
                  <input
                    value={editPanelDescription}
                    onChange={(e) => setEditPanelDescription(e.target.value)}
                    placeholder="Optional"
                  />
                </Field>
              </PanelRow>

              <Field>
                <label>Panel Members (event managers)</label>
                <MemberGrid>
                  {panelMembers.map((member) => (
                    <MemberBox
                      key={member._id}
                      type="button"
                      $active={editPanelMemberIds.includes(String(member._id))}
                      onClick={() => toggleMemberSelection(member._id, "edit")}
                    >
                      <input
                        type="checkbox"
                        readOnly
                        checked={editPanelMemberIds.includes(String(member._id))}
                      />
                      <div>
                        <strong>{member.name}</strong>
                        <small>{member.email}</small>
                      </div>
                    </MemberBox>
                  ))}
                </MemberGrid>
              </Field>

              <ButtonRow>
                <button type="button" onClick={handleUpdatePanel} disabled={updatingPanel}>
                  {updatingPanel ? "Saving..." : "Save Panel Changes"}
                </button>
              </ButtonRow>
            </>
          )}
        </EditPanelCard>
      )}

      {selectedPanel && !selectedPanel.piStarted && (
        <Notice>
          PI round has not started yet for this panel. Super admin must start PI before evaluations and final decisions.
        </Notice>
      )}

      {isSuperAdmin && selectedPanel && (
        <BoardVisibilityCard>
          <div>
            <strong>Evaluation Board</strong>
            <small>Use this only if you want to review scoring table as super admin.</small>
          </div>
          <button type="button" onClick={() => setShowEvaluationBoard((prev) => !prev)}>
            {showEvaluationBoard ? "Hide Evaluation Board" : "Show Evaluation Board"}
          </button>
        </BoardVisibilityCard>
      )}

      {isSuperAdmin && !showEvaluationBoard ? (
        <State>Evaluation board hidden. Event managers can continue scoring from their PI page.</State>
      ) : loadingStudents ? (
        <State>Loading panel students...</State>
      ) : panelStudents.length === 0 ? (
        <State>No students assigned to this panel yet.</State>
      ) : (
        <TableWrap>
          <table>
            <thead>
              <tr>
                <th>Seq</th>
                <th>Student</th>
                <th>Status</th>
                <th>Avg Score</th>
                <th>My Score</th>
                <th>Recommendation</th>
                <th>Remarks</th>
                <th>Finalize</th>
              </tr>
            </thead>
            <tbody>
              {panelStudents.map((row) => {
                const student = row.student;
                const sid = String(student?._id || "");
                const draft = drafts[sid] || {};

                return (
                  <tr key={sid}>
                    <td>{row.sequence || "-"}</td>
                    <td>
                      <strong>{student?.firstName} {student?.lastName}</strong>
                      <div>{student?.email}</div>
                      <small>{student?.rollNumber}</small>
                    </td>
                    <td>{row.isFinalized ? `Finalized: ${row.finalStatus}` : student?.status}</td>
                    <td>{row.averageScore ?? "-"}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={draft.score ?? ""}
                        onChange={(e) => updateDraft(sid, { score: e.target.value })}
                        disabled={!selectedPanel?.piStarted}
                      />
                    </td>
                    <td>
                      <select
                        value={draft.recommendation || "hold"}
                        onChange={(e) => updateDraft(sid, { recommendation: e.target.value })}
                        disabled={!selectedPanel?.piStarted}
                      >
                        {recommendationOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <textarea
                        rows={2}
                        value={draft.remarks || ""}
                        onChange={(e) => updateDraft(sid, { remarks: e.target.value, finalNote: e.target.value })}
                        disabled={!selectedPanel?.piStarted}
                      />
                      <SmallButton
                        type="button"
                        onClick={() => handleSaveEvaluation(sid)}
                        disabled={savingEvaluationIds.has(sid) || !selectedPanel?.piStarted}
                      >
                        {savingEvaluationIds.has(sid) ? "Saving..." : "Save Score"}
                      </SmallButton>
                    </td>
                    <td>
                      <select
                        value={draft.finalStatus || "shortlisted_offline"}
                        onChange={(e) => updateDraft(sid, { finalStatus: e.target.value })}
                        disabled={!selectedPanel?.piStarted}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <SmallButton
                        type="button"
                        onClick={() => handleFinalizeStudent(sid)}
                        disabled={finalizingIds.has(sid) || !selectedPanel?.piStarted}
                      >
                        {finalizingIds.has(sid) ? "Finalizing..." : "Finalize"}
                      </SmallButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      )}
    </Wrap>
  );
}

InductionPanelBoard.propTypes = {
  user: PropTypes.shape({
    role: PropTypes.string,
    id: PropTypes.string,
    _id: PropTypes.string,
  }),
  selectedStudentIds: PropTypes.arrayOf(PropTypes.string),
};

const Wrap = styled.div`
  margin-bottom: 20px;
  border-radius: 14px;
  border: 1px solid #dbeafe;
  background: #f8fbff;
  padding: 14px;

  .dark & {
    border-color: #1e3a8a;
    background: #0f172a;
  }
`;

const Header = styled.div`
  margin-bottom: 10px;

  h3 {
    margin: 0;
    font-size: 16px;
    color: #1e3a8a;
  }

  small {
    color: #475569;
  }

  .dark & {
    h3 {
      color: #93c5fd;
    }

    small {
      color: #cbd5e1;
    }
  }
`;

const WorkflowStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0 0 12px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const StepPill = styled.div`
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  background: #eff6ff;
  padding: 8px 10px;

  strong {
    display: block;
    font-size: 11px;
    letter-spacing: 0.04em;
    color: #1d4ed8;
    text-transform: uppercase;
  }

  span {
    display: block;
    font-size: 12px;
    color: #334155;
    margin-top: 2px;
  }

  .dark & {
    border-color: #1d4ed8;
    background: #0b1220;

    strong {
      color: #93c5fd;
    }

    span {
      color: #e2e8f0;
    }
  }
`;

const CreatePanelCard = styled.div`
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 12px;
  background: #eff6ff;
  margin-bottom: 12px;

  .dark & {
    border-color: #1d4ed8;
    background: #111827;
  }
`;

const EditPanelCard = styled(CreatePanelCard)`
  background: #f8fafc;

  .dark & {
    background: #0b1220;
  }
`;

const EditHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;

  h4 {
    margin: 0;
    font-size: 14px;
    color: #1f2937;
  }

  .dark & h4 {
    color: #e2e8f0;
  }
`;

const ControlButtons = styled.div`
  display: flex;
  gap: 8px;

  button {
    border: none;
    border-radius: 8px;
    padding: 7px 10px;
    background: #1d4ed8;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 760px) {
    width: 100%;

    button {
      flex: 1;
    }
  }
`;

const PanelMeta = styled.div`
  margin: 2px 0 10px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;

  small {
    color: #334155;
  }

  strong {
    color: #1d4ed8;
  }

  .dark & small {
    color: #cbd5e1;
  }

  .dark & strong {
    color: #93c5fd;
  }
`;

const Notice = styled.div`
  margin-bottom: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #fcd34d;
  background: #fffbeb;
  color: #92400e;
  font-size: 12px;
  font-weight: 600;

  .dark & {
    border-color: #92400e;
    background: #2a1b08;
    color: #fbbf24;
  }
`;

const PanelRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

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

  select[multiple] {
    min-height: 90px;
  }

  .dark & {
    label {
      color: #e2e8f0;
    }

    input,
    select,
    textarea {
      background: #1e293b;
      border-color: #334155;
      color: #e2e8f0;
    }
  }
`;

const ButtonRow = styled.div`
  margin-top: 10px;

  button {
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    background: #2563eb;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const MemberGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 2px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const MemberBox = styled.button`
  border: 1px solid ${(props) => (props.$active ? "#2563eb" : "#cbd5e1")};
  background: ${(props) => (props.$active ? "#eff6ff" : "#ffffff")};
  border-radius: 10px;
  padding: 9px;
  text-align: left;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;

  input {
    margin-top: 2px;
  }

  strong {
    display: block;
    font-size: 12px;
    color: #1e293b;
  }

  small {
    display: block;
    font-size: 11px;
    color: #64748b;
  }

  .dark & {
    border-color: ${(props) => (props.$active ? "#3b82f6" : "#334155")};
    background: ${(props) => (props.$active ? "#1e3a8a" : "#0f172a")};

    strong {
      color: #e2e8f0;
    }

    small {
      color: #cbd5e1;
    }
  }
`;

const PanelSelectionWrap = styled.div`
  margin-bottom: 10px;
`;

const SelectionTitle = styled.h4`
  margin: 0 0 8px;
  font-size: 13px;
  color: #1e40af;
  font-weight: 700;

  .dark & {
    color: #93c5fd;
  }
`;

const PanelCards = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const PanelCard = styled.button`
  border: 1px solid ${(props) => (props.$active ? "#2563eb" : "#cbd5e1")};
  border-radius: 12px;
  background: ${(props) => (props.$active ? "#eff6ff" : "#ffffff")};
  padding: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #2563eb;
    transform: translateY(-1px);
  }

  .dark & {
    border-color: ${(props) => (props.$active ? "#3b82f6" : "#334155")};
    background: ${(props) => (props.$active ? "#1e3a8a" : "#0f172a")};
  }
`;

const PanelCardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  strong {
    font-size: 14px;
    color: #0f172a;
  }

  .dark & strong {
    color: #f8fafc;
  }
`;

const StatusPill = styled.span`
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.03em;
  color: ${(props) => (props.$started ? "#166534" : "#92400e")};
  background: ${(props) => (props.$started ? "#dcfce7" : "#fef3c7")};

  .dark & {
    color: ${(props) => (props.$started ? "#86efac" : "#fcd34d")};
    background: ${(props) => (props.$started ? "#14532d" : "#451a03")};
  }
`;

const PanelCardText = styled.p`
  margin: 8px 0 4px;
  font-size: 12px;
  color: #475569;

  .dark & {
    color: #cbd5e1;
  }
`;

const PanelCardMeta = styled.div`
  font-size: 11px;
  color: #334155;

  .dark & {
    color: #e2e8f0;
  }
`;

const SelectedPanelActions = styled.div`
  margin-top: 10px;
  border: 1px dashed #93c5fd;
  border-radius: 10px;
  background: #eff6ff;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;

  strong {
    display: block;
    color: #1e3a8a;
    font-size: 13px;
  }

  small {
    color: #475569;
    font-size: 12px;
  }

  margin-bottom: 10px;

  button {
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    background: #1d4ed8;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .dark & {
    border-color: #1d4ed8;
    background: #0b1220;

    strong {
      color: #93c5fd;
    }

    small {
      color: #cbd5e1;
    }
  }
`;

const BoardVisibilityCard = styled.div`
  margin-bottom: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #ffffff;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;

  strong {
    display: block;
    font-size: 13px;
    color: #1e293b;
  }

  small {
    display: block;
    font-size: 12px;
    color: #64748b;
  }

  button {
    border: none;
    border-radius: 8px;
    padding: 8px 10px;
    background: #0ea5e9;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .dark & {
    border-color: #334155;
    background: #111827;

    strong {
      color: #e2e8f0;
    }

    small {
      color: #cbd5e1;
    }
  }
`;

const State = styled.div`
  padding: 12px;
  font-size: 13px;
  color: #64748b;
`;

const TableWrap = styled.div`
  overflow: auto;

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 920px;
  }

  th,
  td {
    border-bottom: 1px solid #e2e8f0;
    padding: 8px;
    vertical-align: top;
    text-align: left;
    font-size: 12px;
  }

  th {
    color: #475569;
    text-transform: uppercase;
  }

  td div {
    color: #334155;
    font-size: 11px;
  }

  td small {
    color: #64748b;
    font-size: 11px;
  }

  .dark & th,
  .dark & td {
    border-color: #334155;
  }

  .dark & th {
    color: #94a3b8;
  }

  .dark & td div,
  .dark & td small {
    color: #cbd5e1;
  }
`;

const SmallButton = styled.button`
  margin-top: 6px;
  border: none;
  border-radius: 6px;
  background: #0ea5e9;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 6px 8px;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/useAuth";
import { API_BASE_URL } from "../../config/api";
import {
  showApiErrorToast,
  showSuccessToast,
  showWarningToast,
} from "../../utils/toastUtils";

const API = `${API_BASE_URL}/api`;

const roundOptions = [
  { value: "shortlisted_online", label: "Online PI Round" },
  { value: "shortlisted_offline", label: "Offline PI Round" },
];

const formatRound = (round = "") =>
  round === "shortlisted_offline" ? "Offline PI Round" : "Online PI Round";

const getBasePath = (role) => {
  if (role === "super_admin") return "/super-admin";
  if (role === "event_manager") return "/event-manager";
  return "/admin";
};

export default function InductionPIRound() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const isEventManager = user?.role === "event_manager";
  const navigate = useNavigate();

  const [piControl, setPiControl] = useState({
    piRound: "shortlisted_online",
    isPiStarted: false,
    piStartedAt: null,
  });
  const [panels, setPanels] = useState([]);
  const [panelMembers, setPanelMembers] = useState([]);
  const [selectedPanelId, setSelectedPanelId] = useState("");
  const [panelStudents, setPanelStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [updatingControl, setUpdatingControl] = useState(false);
  const [creatingPanel, setCreatingPanel] = useState(false);
  const [loadingPanelStudents, setLoadingPanelStudents] = useState(false);
  const [editingPanelId, setEditingPanelId] = useState("");
  const [editingPanelName, setEditingPanelName] = useState("");
  const [savingPanelName, setSavingPanelName] = useState(false);

  const [newPanelName, setNewPanelName] = useState("");
  const [newPanelDescription, setNewPanelDescription] = useState("");
  const [newPanelMemberIds, setNewPanelMemberIds] = useState([]);

  const tokenConfig = useMemo(() => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  }, []);

  const selectedPanel = useMemo(
    () => panels.find((panel) => String(panel._id) === String(selectedPanelId)) || null,
    [panels, selectedPanelId],
  );

  const assignedManagerIds = useMemo(() => {
    const ids = new Set();
    panels.forEach((panel) => {
      (panel.members || []).forEach((member) => {
        if (member?._id) ids.add(String(member._id));
      });
    });
    return ids;
  }, [panels]);

  const fetchBaseData = async () => {
    setLoading(true);
    try {
      const requests = [
        axios.get(`${API}/induction/pi-control`, tokenConfig),
        axios.get(`${API}/induction/panels`, tokenConfig),
      ];

      if (isSuperAdmin) {
        requests.push(axios.get(`${API}/induction/panel-members`, tokenConfig));
      }

      const [controlRes, panelsRes, membersRes] = await Promise.all(requests);

      if (controlRes.data?.success) {
        setPiControl(controlRes.data.data || {});
      }

      if (panelsRes.data?.success) {
        const panelList = panelsRes.data.data || [];
        setPanels(panelList);
        setSelectedPanelId((prev) => {
          const exists = panelList.some((panel) => String(panel._id) === String(prev));
          if (exists) return String(prev);
          return panelList[0]?._id ? String(panelList[0]._id) : "";
        });
      }

      if (isSuperAdmin && membersRes?.data?.success) {
        setPanelMembers(membersRes.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch PI data:", error);
      showApiErrorToast(error, "Failed to load PI data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPanelStudents = async (panelId) => {
    if (!panelId) {
      setPanelStudents([]);
      return;
    }

    setLoadingPanelStudents(true);
    try {
      const { data } = await axios.get(`${API}/induction/panels/${panelId}/students`, tokenConfig);
      if (data?.success) {
        setPanelStudents(data.data?.students || []);
      }
    } catch (error) {
      console.error("Failed to load panel students:", error);
      showApiErrorToast(error, "Failed to load panel students.");
    } finally {
      setLoadingPanelStudents(false);
    }
  };

  const handleCreatePanel = async () => {
    if (!newPanelName.trim()) {
      showWarningToast("Panel name is required.");
      return;
    }

    if (!newPanelMemberIds.length) {
      showWarningToast("Select at least one event manager.");
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
        showSuccessToast("Panel created successfully.");
        await fetchBaseData();
      }
    } catch (error) {
      console.error("Create panel failed:", error);
      showApiErrorToast(error, "Failed to create panel.");
    } finally {
      setCreatingPanel(false);
    }
  };

  const updatePiControl = async (payload) => {
    if (!isSuperAdmin) return;

    setUpdatingControl(true);
    try {
      const { data } = await axios.put(`${API}/induction/pi-control`, payload, tokenConfig);
      if (data?.success) {
        setPiControl(data.data || {});
        showSuccessToast(payload?.isPiStarted !== undefined
          ? payload.isPiStarted
            ? "PI started successfully."
            : "PI stopped successfully."
          : "PI round updated successfully.");
        await fetchBaseData();
      }
    } catch (error) {
      console.error("Update PI control failed:", error);
      showApiErrorToast(error, "Failed to update PI control.");
    } finally {
      setUpdatingControl(false);
    }
  };

  const toggleManagerInCreate = (memberId) => {
    const sid = String(memberId);
    setNewPanelMemberIds((prev) =>
      prev.includes(sid) ? prev.filter((id) => id !== sid) : [...prev, sid],
    );
  };

  const startEditingPanelName = (panel) => {
    setEditingPanelId(String(panel._id));
    setEditingPanelName(panel.name || "");
  };

  const cancelEditingPanelName = () => {
    setEditingPanelId("");
    setEditingPanelName("");
  };

  const savePanelName = async (panelId) => {
    const nextName = editingPanelName.trim();
    if (!nextName) {
      showWarningToast("Panel name is required.");
      return;
    }

    setSavingPanelName(true);
    try {
      const { data } = await axios.patch(
        `${API}/induction/panels/${panelId}`,
        { name: nextName },
        tokenConfig,
      );

      if (data?.success) {
        showSuccessToast("Panel name updated successfully.");
        setPanels((prev) =>
          prev.map((panel) =>
            String(panel._id) === String(panelId)
              ? {
                  ...panel,
                  name: data.data?.name || nextName,
                }
              : panel,
          ),
        );
        cancelEditingPanelName();
      }
    } catch (error) {
      console.error("Update panel name failed:", error);
      showApiErrorToast(error, "Failed to update panel name.");
    } finally {
      setSavingPanelName(false);
    }
  };

  const deletePanel = async (panelId, panelName) => {
    if (!window.confirm(`Are you sure you want to delete panel "${panelName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { data } = await axios.delete(
        `${API}/induction/panels/${panelId}`,
        tokenConfig,
      );

      if (data?.success) {
        showSuccessToast("Panel deleted successfully.");
        setPanels((prev) => prev.filter((panel) => String(panel._id) !== String(panelId)));
        if (String(selectedPanelId) === String(panelId)) {
          setSelectedPanelId("");
          setPanelStudents([]);
        }
      }
    } catch (error) {
      console.error("Delete panel failed:", error);
      showApiErrorToast(error, "Failed to delete panel.");
    }
  };

  useEffect(() => {
    fetchBaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  useEffect(() => {
    if (!selectedPanelId || (!isEventManager && !isSuperAdmin)) {
      setPanelStudents([]);
      return;
    }
    fetchPanelStudents(selectedPanelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPanelId, isEventManager, isSuperAdmin, piControl.isPiStarted]);

  if (loading) {
    return <StateCard>Loading PI workspace...</StateCard>;
  }

  if (user?.role === "admin") {
    return (
      <Wrap>
        <Header>
          <h2>Induction PI Round</h2>
          <p>Admin role has no dedicated PI workflow in this setup.</p>
        </Header>
        <StateCard>Use Super Admin for PI setup and Event Manager for evaluations.</StateCard>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <Header>
        <h2>Induction PI Round</h2>
        <p>Round: {formatRound(piControl.piRound)} | Status: {piControl.isPiStarted ? "Started" : "Not Started"}</p>
      </Header>

      {isSuperAdmin && (
        <MainGrid>
          <ControlCard>
            <CardHead>
              <h3>PI Control</h3>
            </CardHead>
            <ControlRow>
              <label>Current PI Round</label>
              <select
                value={piControl.piRound || "shortlisted_online"}
                onChange={(e) => updatePiControl({ piRound: e.target.value })}
                disabled={updatingControl || piControl.isPiStarted}
              >
                {roundOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <small>Changing round resets PI start state.</small>
            </ControlRow>
            <ControlRow>
              <button
                type="button"
                disabled={updatingControl}
                onClick={() => updatePiControl({ isPiStarted: !piControl.isPiStarted })}
              >
                {updatingControl
                  ? "Updating..."
                  : piControl.isPiStarted
                    ? "Stop PI"
                    : "Start PI"}
              </button>
              {piControl.piStartedAt && <small>Started at: {new Date(piControl.piStartedAt).toLocaleString()}</small>}
            </ControlRow>
          </ControlCard>

          <ControlCard>
            <div>
              <h3>Create Panel</h3>
              <small>One event manager can belong to only one panel.</small>
            </div>
            <ControlRow>
              <label>Panel Name</label>
              <input
                placeholder="Panel 1"
                value={newPanelName}
                onChange={(e) => setNewPanelName(e.target.value)}
              />
            </ControlRow>
            <ControlRow>
              <label>Description</label>
              <input
                placeholder="Optional"
                value={newPanelDescription}
                onChange={(e) => setNewPanelDescription(e.target.value)}
              />
            </ControlRow>
            <ManagerGrid>
              {panelMembers.map((member) => {
                const busy = assignedManagerIds.has(String(member._id));
                const checked = newPanelMemberIds.includes(String(member._id));
                return (
                  <ManagerBox
                    key={member._id}
                    type="button"
                    onClick={() => !busy && toggleManagerInCreate(member._id)}
                    disabled={busy}
                    $active={checked}
                  >
                    <strong>{member.name}</strong>
                    <small>{member.email}</small>
                    <span>{busy ? "Already in a panel" : checked ? "Selected" : "Available"}</span>
                  </ManagerBox>
                );
              })}
            </ManagerGrid>
            <ControlRow>
              <button type="button" onClick={handleCreatePanel} disabled={creatingPanel}>
                {creatingPanel ? "Creating..." : "Create Panel"}
              </button>
            </ControlRow>
          </ControlCard>
        </MainGrid>
      )}

      <PanelList>
        {panels.length === 0 ? (
          <StateCard>No panels created yet.</StateCard>
        ) : (
          panels.map((panel) => (
            <PanelCard key={panel._id}>
              <div>
                {isSuperAdmin && String(editingPanelId) === String(panel._id) ? (
                  <InlineEditRow>
                    <input
                      value={editingPanelName}
                      onChange={(e) => setEditingPanelName(e.target.value)}
                      placeholder="Panel name"
                      disabled={savingPanelName}
                    />
                    <InlineEditActions>
                      <button
                        type="button"
                        onClick={() => savePanelName(panel._id)}
                        disabled={savingPanelName}
                      >
                        {savingPanelName ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={cancelEditingPanelName}
                        disabled={savingPanelName}
                      >
                        Cancel
                      </button>
                    </InlineEditActions>
                  </InlineEditRow>
                ) : (
                  <h4>{panel.name}</h4>
                )}
                <p>{panel.description || "No description"}</p>
                <small>Members: {(panel.members || []).map((m) => m.name).join(", ") || "-"}</small>
              </div>
              {isSuperAdmin ? (
                <PanelActions>
                  <button
                    type="button"
                    onClick={() => navigate(`${getBasePath(user?.role)}/induction-pi/panels/${panel._id}`)}
                  >
                    Manage Panel
                  </button>
                  {String(editingPanelId) !== String(panel._id) && (
                    <>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => startEditingPanelName(panel)}
                      >
                        Edit Name
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => deletePanel(panel._id, panel.name)}
                        title="Delete Panel"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </PanelActions>
              ) : (
                <button type="button" onClick={() => setSelectedPanelId(String(panel._id))}>Open Panel</button>
              )}
            </PanelCard>
          ))
        )}
      </PanelList>

      {isEventManager && selectedPanel && (
        <EventManagerSection>
          <h3>{selectedPanel.name}</h3>
          <small>
            Panel Members: {(selectedPanel.members || []).map((member) => member.name).join(", ") || "-"}
          </small>
          {!piControl.isPiStarted && (
            <StateCard>PI is not started yet. You can view your panel and students only.</StateCard>
          )}
          {loadingPanelStudents ? (
            <StateCard>Loading students...</StateCard>
          ) : panelStudents.length === 0 ? (
            <StateCard>No students assigned to your panel.</StateCard>
          ) : (
            <StudentGrid>
              {panelStudents.map((row) => (
                <StudentCard
                  key={row.student?._id}
                  type="button"
                  disabled={!piControl.isPiStarted}
                  onClick={() => navigate(`${getBasePath(user?.role)}/induction-pi/panels/${selectedPanel._id}/students/${row.student?._id}`)}
                >
                  <strong>{row.student?.firstName} {row.student?.lastName}</strong>
                  <small>{row.student?.email}</small>
                  <span>Roll: {row.student?.rollNumber || "-"}</span>
                  <span>Avg Score: {row.averageScore ?? "-"}</span>
                  <span>{piControl.isPiStarted ? "Click to evaluate" : "Evaluation locked until PI starts"}</span>
                </StudentCard>
              ))}
            </StudentGrid>
          )}
        </EventManagerSection>
      )}
    </Wrap>
  );
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Header = styled.div`
  h2 {
    margin: 0;
    color: #0f172a;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  p {
    margin: 8px 0 0;
    color: #475569;
    font-size: 14px;
  }

  .dark & h2 {
    color: #f8fafc;
  }

  .dark & p {
    color: #cbd5e1;
  }
`;

const MainGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const ControlCard = styled.section`
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: #f8fbff;
  padding: 14px;

  .dark & {
    border-color: #1e3a8a;
    background: #0f172a;
  }
`;

const CardHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;

  h3 {
    margin: 0;
    font-size: 16px;
    color: #1e3a8a;
  }

  small {
    color: #64748b;
  }

  .dark & h3 {
    color: #93c5fd;
  }

  .dark & small {
    color: #cbd5e1;
  }
`;

const ControlRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: #1e293b;
  }

  input,
  select {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 9px 10px;
    font-size: 13px;
  }

  button {
    border: none;
    border-radius: 8px;
    padding: 9px 12px;
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

  small {
    color: #64748b;
    font-size: 12px;
  }

  .dark & {
    label {
      color: #e2e8f0;
    }

    input,
    select {
      background: #1e293b;
      color: #e2e8f0;
      border-color: #334155;
    }

    small {
      color: #cbd5e1;
    }
  }
`;

const ManagerGrid = styled.div`
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const ManagerBox = styled.button`
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
    font-size: 11px;
    color: #475569;
  }

  span {
    font-size: 10px;
    font-weight: 700;
    color: ${(props) => (props.disabled ? "#b91c1c" : "#1d4ed8")};
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const PanelList = styled.section`
  display: grid;
  gap: 10px;
`;

const PanelCard = styled.div`
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: #ffffff;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;

  h4 {
    margin: 0;
    color: #0f172a;
    font-size: 15px;
  }

  p {
    margin: 4px 0;
    color: #475569;
    font-size: 12px;
  }

  small {
    color: #334155;
    font-size: 12px;
  }

  button {
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    background: #0ea5e9;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .dark & {
    background: #0f172a;
    border-color: #1e3a8a;

    h4 {
      color: #f8fafc;
    }

    p,
    small {
      color: #cbd5e1;
    }
  }
`;

const PanelActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  button.secondary {
    background: #0f766e;
  }

  button.danger {
    background: #dc2626;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 4px;

    &:hover {
      background: #b91c1c;
    }
  }
`;

const InlineEditRow = styled.div`
  display: grid;
  gap: 8px;

  input {
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
  }

  .dark & input {
    background: #1e293b;
    border-color: #334155;
    color: #e2e8f0;
  }
`;

const InlineEditActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  button.secondary {
    background: #475569;
  }
`;

const EventManagerSection = styled.section`
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: #f8fbff;
  padding: 14px;

  h3 {
    margin: 0;
    color: #1e3a8a;
  }

  small {
    color: #475569;
  }

  .dark & {
    border-color: #1e3a8a;
    background: #0f172a;

    h3 {
      color: #93c5fd;
    }

    small {
      color: #cbd5e1;
    }
  }
`;

const StudentGrid = styled.div`
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const StudentCard = styled.button`
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #ffffff;
  padding: 10px;
  text-align: left;
  display: grid;
  gap: 3px;
  cursor: pointer;

  strong {
    font-size: 13px;
    color: #0f172a;
  }

  small,
  span {
    font-size: 12px;
    color: #475569;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .dark & {
    background: #111827;
    border-color: #334155;

    strong {
      color: #e2e8f0;
    }

    small,
    span {
      color: #cbd5e1;
    }
  }
`;

const StateCard = styled.div`
  border: 1px dashed #94a3b8;
  border-radius: 10px;
  padding: 12px;
  color: #475569;
  font-size: 13px;
  background: #ffffff;

  .dark & {
    border-color: #334155;
    background: #111827;
    color: #cbd5e1;
  }
`;

import { useState, useEffect } from "react";
import styled from "styled-components";
import {
  Mail,
  Send,
  Users,
  Eye,
  Trash2,
  Search,
  Check,
  X,
  FileText,
  Calendar,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Email Templates
const EMAIL_TEMPLATES = {
  announcement: {
    name: "General Announcement",
    subject: "Important Update from GDG MMMUT",
    preview: "Share news, updates, or announcements with your community",
  },
  event_invite: {
    name: "Event Invitation",
    subject: "You're Invited! 🎉",
    preview: "Invite users to upcoming events",
  },
  reminder: {
    name: "Event Reminder",
    subject: "Reminder: Event Starting Soon ⏰",
    preview: "Send reminders for upcoming events",
  },
  newsletter: {
    name: "Newsletter",
    subject: "GDG MMMUT Newsletter 📰",
    preview: "Monthly or weekly newsletter updates",
  },
  custom: {
    name: "Custom Email",
    subject: "",
    preview: "Create your own custom email",
  },
};

const EmailCenter = () => {
  const [activeTab, setActiveTab] = useState("compose");
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ sent: 0, failed: 0 });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);

  const [formData, setFormData] = useState({
    template: "announcement",
    subject: EMAIL_TEMPLATES.announcement.subject,
    title: "",
    message: "",
    targetType: "specific", // specific, all, event
    targetEvent: "",
    actionUrl: "",
    actionText: "",
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
    fetchUsers();
    fetchEvents();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/email/logs?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/email/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sentCount = response.data.stats?.find(s => s._id === 'sent')?.count || 0;
      const failedCount = response.data.stats?.find(s => s._id === 'failed')?.count || 0;
      setStats({ sent: sentCount, failed: failedCount });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/admin/users?limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/admin/events?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(response.data.events || []);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  const handleTemplateChange = (templateKey) => {
    const template = EMAIL_TEMPLATES[templateKey];
    setFormData(prev => ({
      ...prev,
      template: templateKey,
      subject: template.subject,
    }));
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.email === user.email);
      if (exists) {
        return prev.filter(u => u.email !== user.email);
      }
      return [...prev, { email: user.email, name: user.name }];
    });
  };

  const selectAllFiltered = () => {
    const filtered = getFilteredUsers();
    setSelectedUsers(filtered.map(u => ({ email: u.email, name: u.name })));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const getFilteredUsers = () => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(u =>
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    );
  };

  const handleSendEmail = async () => {
    if (!formData.subject || !formData.message) {
      alert("Please fill in subject and message");
      return;
    }

    let recipients = [];

    if (formData.targetType === "specific") {
      if (selectedUsers.length === 0) {
        alert("Please select at least one recipient");
        return;
      }
      recipients = selectedUsers;
    }

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        title: formData.subject,
        message: formData.message,
        actionUrl: formData.actionUrl || undefined,
        actionText: formData.actionText || undefined,
      };

      if (formData.targetType === "specific") {
        payload.recipients = recipients;
      } else if (formData.targetType === "all") {
        payload.filters = { listType: "all" };
      } else if (formData.targetType === "event") {
        payload.filters = { eventId: formData.targetEvent };
      }

      await axios.post(`${API_URL}/api/email/bulk`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Emails sent successfully! 🎉");
      setShowPreview(false);
      setSelectedUsers([]);
      setFormData(prev => ({ ...prev, message: "", title: "" }));
      fetchLogs();
      fetchStats();
    } catch (error) {
      console.error("Failed to send:", error);
      alert("Failed to send emails: " + (error.response?.data?.message || error.message));
    } finally {
      setSending(false);
    }
  };

  const handleDeleteLog = async (id) => {
    if (!confirm("Delete this log entry?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/email/logs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLogs();
      fetchStats();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderPreview = () => {
    return (
      <PreviewContainer>
        <PreviewHeader>
          <h3>📧 Email Preview</h3>
          <CloseBtn onClick={() => setShowPreview(false)}><X size={20} /></CloseBtn>
        </PreviewHeader>
        <PreviewEmail>
          <EmailHeader>
            <div className="from">
              <strong>From:</strong> Google Developers Group On Campus MMMUT Gorakhpur &lt;support@gdg.mmmut.app&gt;
            </div>
            <div className="to">
              <strong>To:</strong> {
                formData.targetType === "all" ? "All Users" :
                  formData.targetType === "event" ? `Event Attendees (${events.find(e => e._id === formData.targetEvent)?.name || 'Selected Event'})` :
                    `${selectedUsers.length} Selected Users`
              }
            </div>
            <div className="subject">
              <strong>Subject:</strong> {formData.subject}
            </div>
          </EmailHeader>
          <EmailBody dangerouslySetInnerHTML={{ __html: generateEmailHTML() }} />
        </PreviewEmail>
        <PreviewActions>
          <CancelBtn onClick={() => setShowPreview(false)}>
            <X size={16} /> Cancel
          </CancelBtn>
          <SendBtn onClick={handleSendEmail} disabled={sending}>
            {sending ? <RefreshCw size={16} className="spin" /> : <Send size={16} />}
            {sending ? "Sending..." : "Send Now"}
          </SendBtn>
        </PreviewActions>
      </PreviewContainer>
    );
  };

  const generateEmailHTML = () => {
    const formattedMessage = formData.message.replace(/\n/g, '<br>');
    return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f3f4;">
  <tr>
    <td align="center" style="padding: 20px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;">
        <tr>
          <td style="background-color: #4285f4; padding: 32px 40px; border-radius: 16px 16px 0 0; text-align: center;">
            <img src="/gdg_logo.png" alt="GDG MMMUT" style="max-width: 200px; height: auto;">
          </td>
        </tr>
        <tr>
          <td style="background-color: #ffffff; padding: 40px; border-left: 1px solid #e8eaed; border-right: 1px solid #e8eaed;">
            <h1 style="margin: 0 0 24px; font-size: 26px; font-weight: 600; color: #202124; text-align: center;">
              ${formData.subject}
            </h1>
            <div style="font-size: 16px; color: #202124; line-height: 1.8;">
              ${formattedMessage}
            </div>
            ${formData.actionUrl && formData.actionText ? `
            <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto;">
              <tr>
                <td align="center" style="background-color: #4285f4; border-radius: 8px;">
                  <a href="${formData.actionUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px;">
                    ${formData.actionText}
                  </a>
                </td>
              </tr>
            </table>
            ` : ''}
          </td>
        </tr>
        <tr>
          <td style="background-color: #f8f9fa; padding: 32px 40px; border-radius: 0 0 16px 16px; border: 1px solid #e8eaed; border-top: none; text-align: center;">
            <p style="margin: 0 0 12px; font-size: 14px; color: #5f6368;">
              Google Developers Group On Campus<br>
              <strong>MMMUT Gorakhpur</strong>
            </p>
            <p style="margin: 0; font-size: 13px;">
              <a href="https://gdg.mmmut.app" style="color: #4285f4; text-decoration: none;">Website</a>
              &nbsp;|&nbsp;
              <a href="https://instagram.com/gdsc.mmmut" style="color: #4285f4; text-decoration: none;">Instagram</a>
              &nbsp;|&nbsp;
              <a href="https://linkedin.com/company/gdsc-mmmut" style="color: #4285f4; text-decoration: none;">LinkedIn</a>
            </p>
            <p style="margin: 16px 0 0; font-size: 12px; color: #9aa0a6;">
              You received this email because you're a member of GDG MMMUT community.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
        `;
  };

  return (
    <Container>
      <Header>
        <div>
          <Title>📧 Email Center</Title>
          <Subtitle>Send beautiful emails to your community</Subtitle>
        </div>
      </Header>

      {/* Stats */}
      <StatsRow>
        <StatCard $color="#34a853">
          <TrendingUp size={24} />
          <div>
            <StatValue>{stats.sent}</StatValue>
            <StatLabel>Emails Sent</StatLabel>
          </div>
        </StatCard>
        <StatCard $color="#ea4335">
          <AlertCircle size={24} />
          <div>
            <StatValue>{stats.failed}</StatValue>
            <StatLabel>Failed</StatLabel>
          </div>
        </StatCard>
        <StatCard $color="#4285f4">
          <Users size={24} />
          <div>
            <StatValue>{users.length}</StatValue>
            <StatLabel>Total Users</StatLabel>
          </div>
        </StatCard>
      </StatsRow>

      {/* Tabs */}
      <TabsContainer>
        <Tab $active={activeTab === "compose"} onClick={() => setActiveTab("compose")}>
          <Mail size={18} /> Compose
        </Tab>
        <Tab $active={activeTab === "logs"} onClick={() => setActiveTab("logs")}>
          <FileText size={18} /> Sent Emails
        </Tab>
      </TabsContainer>

      {activeTab === "compose" && (
        <ComposeSection>
          {/* Template Selection */}
          <FormSection>
            <SectionTitle>1. Choose Template</SectionTitle>
            <TemplateGrid>
              {Object.entries(EMAIL_TEMPLATES).map(([key, template]) => (
                <TemplateCard
                  key={key}
                  $active={formData.template === key}
                  onClick={() => handleTemplateChange(key)}
                >
                  <div className="name">{template.name}</div>
                  <div className="preview">{template.preview}</div>
                </TemplateCard>
              ))}
            </TemplateGrid>
          </FormSection>

          {/* Email Content */}
          <FormSection>
            <SectionTitle>2. Email Content</SectionTitle>
            <FormGroup>
              <Label>Subject Line</Label>
              <Input
                type="text"
                value={formData.subject}
                onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter email subject..."
              />
            </FormGroup>
            <FormGroup>
              <Label>Message</Label>
              <TextArea
                value={formData.message}
                onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Write your message here..."
                rows={8}
              />
            </FormGroup>
            <FormRow>
              <FormGroup>
                <Label>Button URL (Optional)</Label>
                <Input
                  type="url"
                  value={formData.actionUrl}
                  onChange={e => setFormData(prev => ({ ...prev, actionUrl: e.target.value }))}
                  placeholder="https://gdg.mmmut.app/events"
                />
              </FormGroup>
              <FormGroup>
                <Label>Button Text</Label>
                <Input
                  type="text"
                  value={formData.actionText}
                  onChange={e => setFormData(prev => ({ ...prev, actionText: e.target.value }))}
                  placeholder="Learn More"
                />
              </FormGroup>
            </FormRow>
          </FormSection>

          {/* Recipients */}
          <FormSection>
            <SectionTitle>3. Select Recipients</SectionTitle>
            <TargetTypeSelector>
              <TargetOption
                $active={formData.targetType === "specific"}
                onClick={() => setFormData(prev => ({ ...prev, targetType: "specific" }))}
              >
                <Users size={20} />
                <span>Specific Users</span>
              </TargetOption>
              <TargetOption
                $active={formData.targetType === "all"}
                onClick={() => setFormData(prev => ({ ...prev, targetType: "all" }))}
              >
                <Users size={20} />
                <span>All Users ({users.length})</span>
              </TargetOption>
              <TargetOption
                $active={formData.targetType === "event"}
                onClick={() => setFormData(prev => ({ ...prev, targetType: "event" }))}
              >
                <Calendar size={20} />
                <span>Event Attendees</span>
              </TargetOption>
            </TargetTypeSelector>

            {formData.targetType === "specific" && (
              <UserSelector>
                <SearchBar>
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </SearchBar>
                <SelectionActions>
                  <SmallBtn onClick={selectAllFiltered}>Select All Visible</SmallBtn>
                  <SmallBtn onClick={clearSelection}>Clear Selection</SmallBtn>
                  <SelectedCount>{selectedUsers.length} selected</SelectedCount>
                </SelectionActions>
                <UserList>
                  {getFilteredUsers().slice(0, 50).map(user => (
                    <UserItem
                      key={user._id || user.email}
                      $selected={selectedUsers.some(u => u.email === user.email)}
                      onClick={() => toggleUserSelection(user)}
                    >
                      <UserCheck $selected={selectedUsers.some(u => u.email === user.email)}>
                        {selectedUsers.some(u => u.email === user.email) && <Check size={14} />}
                      </UserCheck>
                      <UserInfo>
                        <div className="name">{user.name}</div>
                        <div className="email">{user.email}</div>
                      </UserInfo>
                    </UserItem>
                  ))}
                </UserList>
              </UserSelector>
            )}

            {formData.targetType === "event" && (
              <EventSelect
                value={formData.targetEvent}
                onChange={e => setFormData(prev => ({ ...prev, targetEvent: e.target.value }))}
              >
                <option value="">Select an event...</option>
                {events.map(event => (
                  <option key={event._id} value={event._id}>
                    {event.name} ({event.registeredCount || 0} registrations)
                  </option>
                ))}
              </EventSelect>
            )}
          </FormSection>

          {/* Preview Button */}
          <ActionBar>
            <PreviewBtn onClick={() => setShowPreview(true)}>
              <Eye size={18} /> Preview Email
            </PreviewBtn>
          </ActionBar>
        </ComposeSection>
      )}

      {activeTab === "logs" && (
        <LogsSection>
          <LogsHeader>
            <h3>📋 Email History</h3>
            <RefreshBtn onClick={fetchLogs}>
              <RefreshCw size={16} /> Refresh
            </RefreshBtn>
          </LogsHeader>
          {loading ? (
            <LoadingText>Loading...</LoadingText>
          ) : logs.length === 0 ? (
            <EmptyState>No emails sent yet</EmptyState>
          ) : (
            <LogsTable>
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Sent At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td>{log.recipient}</td>
                    <td>{log.subject || "N/A"}</td>
                    <td>
                      <StatusBadge $status={log.status}>
                        {log.status}
                      </StatusBadge>
                    </td>
                    <td>{formatDate(log.sentAt)}</td>
                    <td>
                      <DeleteBtn onClick={() => handleDeleteLog(log._id)}>
                        <Trash2 size={14} />
                      </DeleteBtn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </LogsTable>
          )}
        </LogsSection>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <ModalOverlay onClick={() => setShowPreview(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            {renderPreview()}
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0;
  .dark & { color: white; }
`;

const Subtitle = styled.p`
  color: #64748b;
  margin: 4px 0 0;
  .dark & { color: #94a3b8; }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1px solid #e2e8f0;
  
  svg { color: ${props => props.$color}; }
  
  .dark & {
    background: #1e293b;
    border-color: #334155;
  }
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  .dark & { color: white; }
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: #64748b;
  .dark & { color: #94a3b8; }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
  .dark & { border-color: #334155; }
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  background: ${props => props.$active ? '#4285f4' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$active ? '#4285f4' : '#f1f5f9'};
  }
  
  .dark & {
    color: ${props => props.$active ? 'white' : '#94a3b8'};
    &:hover { background: ${props => props.$active ? '#4285f4' : '#334155'}; }
  }
`;

const ComposeSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FormSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  .dark & { background: #1e293b; border-color: #334155; }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 16px;
  .dark & { color: white; }
`;

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const TemplateCard = styled.div`
  padding: 16px;
  border: 2px solid ${props => props.$active ? '#4285f4' : '#e2e8f0'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$active ? '#4285f410' : 'transparent'};
  
  &:hover { border-color: #4285f4; }
  
  .name {
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 4px;
    .dark & { color: white; }
  }
  
  .preview {
    font-size: 13px;
    color: #64748b;
    .dark & { color: #94a3b8; }
  }
  
  .dark & { border-color: ${props => props.$active ? '#4285f4' : '#334155'}; }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 8px;
  .dark & { color: #cbd5e1; }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.2s;
  background: white;
  color: #0f172a;
  
  &:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66,133,244,0.1);
  }
  
  .dark & {
    background: #0f172a;
    border-color: #334155;
    color: white;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  resize: vertical;
  min-height: 150px;
  font-family: inherit;
  line-height: 1.6;
  background: white;
  color: #0f172a;
  
  &:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66,133,244,0.1);
  }
  
  .dark & {
    background: #0f172a;
    border-color: #334155;
    color: white;
  }
`;

const TargetTypeSelector = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const TargetOption = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 2px solid ${props => props.$active ? '#4285f4' : '#e2e8f0'};
  background: ${props => props.$active ? '#4285f410' : 'transparent'};
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  color: ${props => props.$active ? '#4285f4' : '#64748b'};
  transition: all 0.2s;
  
  &:hover { border-color: #4285f4; }
  
  .dark & { border-color: ${props => props.$active ? '#4285f4' : '#334155'}; }
`;

const UserSelector = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  .dark & { border-color: #334155; }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  
  svg { color: #94a3b8; }
  
  input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 15px;
    color: #0f172a;
    &:focus { outline: none; }
    .dark & { color: white; }
  }
  
  .dark & { background: #0f172a; border-color: #334155; }
`;

const SelectionActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  .dark & { border-color: #334155; }
`;

const SmallBtn = styled.button`
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  color: #64748b;
  
  &:hover { background: #f1f5f9; }
  
  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #94a3b8;
    &:hover { background: #334155; }
  }
`;

const SelectedCount = styled.span`
  margin-left: auto;
  font-size: 13px;
  font-weight: 600;
  color: #4285f4;
`;

const UserList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$selected ? '#4285f410' : 'transparent'};
  
  &:hover { background: #f1f5f9; }
  &:not(:last-child) { border-bottom: 1px solid #f1f5f9; }
  
  .dark & {
    &:hover { background: #334155; }
    &:not(:last-child) { border-color: #334155; }
  }
`;

const UserCheck = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${props => props.$selected ? '#4285f4' : '#cbd5e1'};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.$selected ? '#4285f4' : 'transparent'};
  color: white;
`;

const UserInfo = styled.div`
  .name {
    font-weight: 500;
    color: #0f172a;
    .dark & { color: white; }
  }
  .email {
    font-size: 13px;
    color: #64748b;
    .dark & { color: #94a3b8; }
  }
`;

const EventSelect = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  background: white;
  color: #0f172a;
  cursor: pointer;
  
  .dark & {
    background: #0f172a;
    border-color: #334155;
    color: white;
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const PreviewBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #4285f4, #1a73e8);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(66,133,244,0.3);
  }
`;

const LogsSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  .dark & { background: #1e293b; border-color: #334155; }
`;

const LogsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  h3 {
    margin: 0;
    color: #0f172a;
    .dark & { color: white; }
  }
`;

const RefreshBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #64748b;
  
  &:hover { background: #f1f5f9; }
  
  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #94a3b8;
  }
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 48px;
  color: #64748b;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px;
  color: #64748b;
`;

const LogsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
    .dark & { border-color: #334155; }
  }
  
  th {
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    .dark & { color: #94a3b8; }
  }
  
  td {
    font-size: 14px;
    color: #0f172a;
    .dark & { color: #e2e8f0; }
  }
  
  tbody tr:hover {
    background: #f8fafc;
    .dark & { background: #334155; }
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
  background: ${props => props.$status === 'sent' ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.$status === 'sent' ? '#16a34a' : '#dc2626'};
`;

const DeleteBtn = styled.button`
  padding: 6px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 4px;
  
  &:hover {
    background: #fee2e2;
    color: #dc2626;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 20px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  .dark & { background: #1e293b; }
`;

const PreviewContainer = styled.div``;

const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  
  h3 {
    margin: 0;
    font-size: 18px;
    color: #0f172a;
    .dark & { color: white; }
  }
  
  .dark & { border-color: #334155; }
`;

const CloseBtn = styled.button`
  padding: 8px;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  border-radius: 8px;
  
  &:hover { background: #f1f5f9; }
`;

const PreviewEmail = styled.div`
  padding: 24px;
`;

const EmailHeader = styled.div`
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 16px;
  font-size: 14px;
  
  > div {
    padding: 4px 0;
    color: #334155;
    .dark & { color: #cbd5e1; }
  }
  
  .dark & { background: #0f172a; }
`;

const EmailBody = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  .dark & { border-color: #334155; }
`;

const PreviewActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
  .dark & { border-color: #334155; }
`;

const CancelBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  color: #64748b;
  
  &:hover { background: #f1f5f9; }
  
  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #94a3b8;
  }
`;

const SendBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #34a853, #1e8e3e);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(52,168,83,0.3);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export default EmailCenter;

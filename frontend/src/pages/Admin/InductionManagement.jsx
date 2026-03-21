import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import {
  Search,
  Download,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Trash2,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../contexts/useAuth";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

const InductionManagement = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isInductionOpen, setIsInductionOpen] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetStatus, setTargetStatus] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isAdvancing, setIsAdvancing] = useState(false);
  const { user } = useAuth();

  const handleDeleteRegistration = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete the application for ${name}?`)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/induction/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSubmissions();
      setSelectedStudent(null);
    } catch (err) {
      console.error("Failed to delete application:", err);
      alert(err.response?.data?.message || "Failed to delete application. Super Admin only.");
    }
  };

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (branchFilter) params.append("branch", branchFilter);
      params.append("page", page);
      params.append("limit", 25);

      const { data } = await axios.get(
        `${API}/induction?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setSubmissions(data.data);
        setTotalPages(data.pagination.pages);
        setTotal(data.pagination.total);
      }
    } catch (err) {
      console.error("Failed to fetch induction submissions:", err);
    } finally {
      setLoading(false);
    }
  }, [branchFilter, page]);

  const fetchInductionStatus = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/induction/status`);
      if (data.success) {
        setIsInductionOpen(data.isInductionOpen);
      }
    } catch (err) {
      console.error("Failed to fetch induction status:", err);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
    fetchInductionStatus();
  }, [fetchSubmissions, fetchInductionStatus]);

  const handleToggleInductionForm = async () => {
    if (!window.confirm(`Are you sure you want to ${isInductionOpen ? 'CLOSE' : 'OPEN'} the induction form?`)) return;
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.put(`${API}/induction/status`, 
        { isInductionOpen: !isInductionOpen },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setIsInductionOpen(data.isInductionOpen);
      }
    } catch (err) {
      console.error("Failed to toggle induction form:", err);
      alert("Failed to change form status. Make sure you are a super admin.");
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (statusFilter && s.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.rollNumber?.toLowerCase().includes(q) ||
      s.branch?.toLowerCase().includes(q)
    );
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredSubmissions.map(s => s._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAdvance = async () => {
    if (!targetStatus) return alert("Please select a target round.");
    if (selectedIds.length === 0) return alert("Please select at least one candidate.");
    
    const confirmMessage = `Are you sure you want to move ${selectedIds.length} candidate(s) to '${targetStatus.replace('_', ' ')}'? This will automatically email them.`;
    if (!window.confirm(confirmMessage)) return;

    setIsAdvancing(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.patch(`${API}/induction/bulk-advance`, 
        { studentIds: selectedIds, targetStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (data.success) {
        alert(data.message);
        setSelectedIds([]);
        setTargetStatus("");
        fetchSubmissions();
      }
    } catch (err) {
      console.error("Failed to bulk advance:", err);
      alert("Failed to advance candidates. Please try again.");
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleExport = () => {
    const headers = [
      "Roll No",
      "Name",
      "Email",
      "Phone",
      "Branch",
      "Section",
      "Domains",
      "Tech Stack",
      "Projects",
      "GitHub",
      "LinkedIn",
      "Codeforces",
      "CodeChef",
      "HackerRank",
      "Why Join",
      "Interesting Fact",
      "Other Clubs",
      "Residence",
      "Resume",
      "Status",
      "Submitted At",
    ];

    const rows = filteredSubmissions.map((s) => [
      s.rollNumber || "",
      `${s.firstName || ""} ${s.lastName || ""}`.trim(),
      s.email || "",
      s.phone || "",
      s.branch || "",
      s.section || "",
      (s.domains || []).join("; "),
      s.techStack || "",
      s.projects || "",
      s.githubId || "",
      s.linkedinUrl || "",
      s.codeforcesId || "",
      s.codechefId || "",
      s.hackerrankId || "",
      (s.whyJoin || "").replace(/"/g, '""'),
      (s.interestingFact || "").replace(/"/g, '""'),
      (s.otherClubs || "").replace(/"/g, '""'),
      s.residenceType || "",
      s.resumeUrl || "",
      s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `induction_submissions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const branches = [
    "Computer Science and Engineering",
    "Information Technology",
    "Electronics and Communication Engineering",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Chemical Engineering",
  ];

  return (
    <Container>
      <Header>
        <div>
          <Title>Induction Applications</Title>
          <Subtitle>
            {total} total application{total !== 1 ? "s" : ""} received
          </Subtitle>
        </div>
        <HeaderActions>
          {user?.role === 'super_admin' && !statusLoading && (
            <StatusToggleWrapper onClick={handleToggleInductionForm} $isOpen={isInductionOpen}>
              <ToggleIndicator $isOpen={isInductionOpen} />
              <span>{isInductionOpen ? 'Form is OPEN' : 'Form is CLOSED'}</span>
            </StatusToggleWrapper>
          )}
          {user?.role === 'super_admin' && (
            <ExportButton onClick={handleExport}>
              <Download size={16} />
              Export CSV
            </ExportButton>
          )}
        </HeaderActions>
      </Header>

      <FiltersRow>
        <SearchBox>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, email, roll no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </SearchBox>
        <FilterGroup>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Stages</option>
            <option value="applied">Applied (Round 1)</option>
            <option value="shortlisted_online">Shortlisted (Online PI)</option>
            <option value="shortlisted_offline">Shortlisted (Offline PI)</option>
            <option value="selected">Selected</option>
            <option value="rejected">Rejected</option>
          </Select>
          <Select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </FilterGroup>
      </FiltersRow>

      {user?.role === 'super_admin' && selectedIds.length > 0 && (
        <BulkActionsPanel>
          <span>{selectedIds.length} candidate{selectedIds.length > 1 ? 's' : ''} selected</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Select style={{ padding: '8px', minWidth: '180px' }} value={targetStatus} onChange={(e) => setTargetStatus(e.target.value)}>
              <option value="">-- Move to Round --</option>
              <option value="shortlisted_online">Shortlist: Online PI</option>
              <option value="shortlisted_offline">Shortlist: Offline PI</option>
              <option value="selected">Finalize: Selected</option>
              <option value="rejected">Reject</option>
            </Select>
            <ActionBtn onClick={handleBulkAdvance} disabled={isAdvancing}>
              {isAdvancing ? "Processing..." : "Finalize Selected"}
            </ActionBtn>
          </div>
        </BulkActionsPanel>
      )}

      {loading ? (
        <LoadingState>Loading submissions...</LoadingState>
      ) : filteredSubmissions.length === 0 ? (
        <EmptyState>No induction applications found.</EmptyState>
      ) : (
        <>
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  {user?.role === 'super_admin' && (
                    <Th style={{ width: '40px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll} 
                        checked={filteredSubmissions.length > 0 && selectedIds.length === filteredSubmissions.length}
                      />
                    </Th>
                  )}
                  <Th>Roll No</Th>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Branch</Th>
                  <Th>Stage</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((s) => (
                  <tr key={s._id} style={{ background: selectedIds.includes(s._id) ? 'rgba(66, 133, 244, 0.05)' : 'transparent' }}>
                    {user?.role === 'super_admin' && (
                      <Td style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(s._id)} 
                          onChange={() => handleSelect(s._id)} 
                        />
                      </Td>
                    )}
                    <Td>{s.rollNumber}</Td>
                    <Td>
                      <strong>
                        {s.firstName} {s.lastName}
                      </strong>
                    </Td>
                    <Td>{s.email}</Td>
                    <Td>
                      <BranchBadge>{s.branch}</BranchBadge>
                    </Td>
                    <Td>
                      <StatusBadge $status={s.status}>{s.status.replace('_', ' ')}</StatusBadge>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <ViewButton onClick={() => setSelectedStudent(s)}>
                          <Eye size={16} />
                          View
                        </ViewButton>
                        {user?.role === 'super_admin' && (
                          <DeleteButton 
                            onClick={() => handleDeleteRegistration(s._id, s.firstName)}
                            title="Delete Application"
                          >
                            <Trash2 size={16} />
                          </DeleteButton>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>

          <Pagination>
            <PageInfo>
              Page {page} of {totalPages} ({total} results)
            </PageInfo>
            <PageButtons>
              <PageBtn
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={16} />
                Previous
              </PageBtn>
              <PageBtn
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight size={16} />
              </PageBtn>
            </PageButtons>
          </Pagination>
        </>
      )}

      {/* ─── Detail Modal ─── */}
      {selectedStudent && (
        <ModalOverlay onClick={() => setSelectedStudent(null)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {selectedStudent.firstName} {selectedStudent.lastName}
              </ModalTitle>
              <CloseBtn onClick={() => setSelectedStudent(null)}>
                <X size={20} />
              </CloseBtn>
            </ModalHeader>

            <ModalBody>
              {/* ─ Personal Details ─ */}
              <SectionLabel>Personal Details</SectionLabel>
              <DetailGrid>
                <DetailItem>
                  <DetailLabel>Roll Number</DetailLabel>
                  <DetailValue>{selectedStudent.rollNumber}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Email</DetailLabel>
                  <DetailValue>{selectedStudent.email}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Phone</DetailLabel>
                  <DetailValue>{selectedStudent.phone}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Branch</DetailLabel>
                  <DetailValue>{selectedStudent.branch}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Section</DetailLabel>
                  <DetailValue>{selectedStudent.section}</DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Residence</DetailLabel>
                  <DetailValue>{selectedStudent.residenceType}</DetailValue>
                </DetailItem>
              </DetailGrid>

              {/* ─ Technical Details ─ */}
              <SectionLabel>Technical Details</SectionLabel>
              <DetailGrid>
                <DetailItem $full>
                  <DetailLabel>Interested Domains</DetailLabel>
                  <DomainTags>
                    {(selectedStudent.domains || []).map((d) => (
                      <DomainTag key={d}>{d}</DomainTag>
                    ))}
                  </DomainTags>
                </DetailItem>
                <DetailItem $full>
                  <DetailLabel>Tech Stack</DetailLabel>
                  <DetailValue>
                    {selectedStudent.techStack || "—"}
                  </DetailValue>
                </DetailItem>
                <DetailItem $full>
                  <DetailLabel>Projects</DetailLabel>
                  <DetailValue>
                    {selectedStudent.projects || "—"}
                  </DetailValue>
                </DetailItem>
              </DetailGrid>

              {/* ─ Profiles ─ */}
              <SectionLabel>Online Profiles</SectionLabel>
              <DetailGrid>
                <DetailItem>
                  <DetailLabel>GitHub</DetailLabel>
                  <DetailValue>
                    {selectedStudent.githubId ? (
                      <ProfileLink
                        href={`https://github.com/${selectedStudent.githubId}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {selectedStudent.githubId}
                        <ExternalLink size={12} />
                      </ProfileLink>
                    ) : (
                      "—"
                    )}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>LinkedIn</DetailLabel>
                  <DetailValue>
                    {selectedStudent.linkedinUrl ? (
                      <ProfileLink
                        href={selectedStudent.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Profile
                        <ExternalLink size={12} />
                      </ProfileLink>
                    ) : (
                      "—"
                    )}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Codeforces</DetailLabel>
                  <DetailValue>
                    {selectedStudent.codeforcesId || "—"}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>CodeChef</DetailLabel>
                  <DetailValue>
                    {selectedStudent.codechefId || "—"}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>HackerRank</DetailLabel>
                  <DetailValue>
                    {selectedStudent.hackerrankId || "—"}
                  </DetailValue>
                </DetailItem>
                <DetailItem>
                  <DetailLabel>Resume</DetailLabel>
                  <DetailValue>
                    {selectedStudent.resumeUrl ? (
                      <ProfileLink
                        href={selectedStudent.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FileText size={14} />
                        View Resume
                      </ProfileLink>
                    ) : (
                      "—"
                    )}
                  </DetailValue>
                </DetailItem>
              </DetailGrid>

              {/* ─ Responses ─ */}
              <SectionLabel>Responses</SectionLabel>
              <DetailGrid>
                <DetailItem $full>
                  <DetailLabel>Why do you want to join GDG?</DetailLabel>
                  <DetailText>{selectedStudent.whyJoin || "—"}</DetailText>
                </DetailItem>
                <DetailItem $full>
                  <DetailLabel>Interesting Fact</DetailLabel>
                  <DetailText>
                    {selectedStudent.interestingFact || "—"}
                  </DetailText>
                </DetailItem>
                <DetailItem $full>
                  <DetailLabel>Other Clubs</DetailLabel>
                  <DetailText>{selectedStudent.otherClubs || "—"}</DetailText>
                </DetailItem>
              </DetailGrid>

              <SubmittedDate>
                Submitted:{" "}
                {selectedStudent.createdAt
                  ? new Date(selectedStudent.createdAt).toLocaleString()
                  : "Unknown"}
              </SubmittedDate>
            </ModalBody>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
};

/* ═══════════════ Styled Components ═══════════════ */

const Container = styled.div`
  max-width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
`;

const Title = styled.h1.attrs({
  className: "text-gray-900 dark:text-white",
})`
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 0;
`;

const Subtitle = styled.p.attrs({
  className: "text-gray-500 dark:text-gray-400",
})`
  font-size: 14px;
  margin: 4px 0 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ExportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  transition: all 0.2s;

  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;

    &:hover {
      background: #334155;
    }
  }
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: center;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  min-width: 280px;
  transition: all 0.2s;

  &:focus-within {
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  }

  svg {
    color: #94a3b8;
    flex-shrink: 0;
  }

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
    background: transparent;
    color: inherit;

    &::placeholder {
      color: #94a3b8;
    }
  }

  .dark & {
    background: #0f172a;
    border-color: #1e293b;
    color: #e2e8f0;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const Select = styled.select`
  padding: 10px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
  color: #475569;
  outline: none;
  min-width: 150px;
  transition: all 0.2s;

  &:focus {
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  }

  .dark & {
    background: #0f172a;
    border-color: #1e293b;
    color: #e2e8f0;
  }
`;

const LoadingState = styled.div.attrs({
  className: "text-gray-500 dark:text-gray-400",
})`
  text-align: center;
  padding: 80px 20px;
  font-size: 16px;
`;

const EmptyState = styled(LoadingState)``;

const TableWrapper = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: auto;

  .dark & {
    background: #0f172a;
    border-color: #1e293b;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 14px 20px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e2e8f0;
  color: #64748b;
  background: #f8fafc;
  white-space: nowrap;

  .dark & {
    background: #0f172a;
    color: #94a3b8;
    border-color: rgba(255, 255, 255, 0.05);
  }
`;

const Td = styled.td`
  padding: 14px 20px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  color: #334155;
  white-space: nowrap;

  .dark & {
    color: #e2e8f0;
    border-color: rgba(255, 255, 255, 0.05);
  }

  tr:last-child & {
    border-bottom: none;
  }
`;

const StatusToggleWrapper = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid ${(props) => (props.$isOpen ? '#86efac' : '#fca5a5')};
  background: ${(props) => (props.$isOpen ? '#f0fdf4' : '#fef2f2')};
  color: ${(props) => (props.$isOpen ? '#166534' : '#991b1b')};
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  .dark & {
    background: ${(props) => (props.$isOpen ? '#14532d' : '#7f1d1d')};
    color: ${(props) => (props.$isOpen ? '#86efac' : '#fecaca')};
    border-color: ${(props) => (props.$isOpen ? '#166534' : '#991b1b')};
  }
`;

const ToggleIndicator = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${(props) => (props.$isOpen ? '#22c55e' : '#ef4444')};
  box-shadow: 0 0 8px ${(props) => (props.$isOpen ? '#22c55e' : '#ef4444')};
`;

const BranchBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  background: #eef2ff;
  color: #4338ca;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;

  .dark & {
    background: #312e81;
    color: #a5b4fc;
  }
`;

const DomainTags = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const DomainTag = styled.span`
  display: inline-block;
  padding: 3px 8px;
  background: #f0fdf4;
  color: #166534;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;

  .dark & {
    background: #14532d;
    color: #86efac;
  }
`;

const ViewButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: #3367d6;
    transform: translateY(-1px);
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 14px 20px;
  background: white;
  border-radius: 14px;
  border: 1px solid #e2e8f0;

  .dark & {
    background: #0f172a;
    border-color: #1e293b;
  }
`;

const PageInfo = styled.span.attrs({
  className: "text-gray-500 dark:text-gray-400",
})`
  font-size: 14px;
`;

const PageButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const PageBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #475569;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f1f5f9;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;

    &:hover:not(:disabled) {
      background: #334155;
    }
  }
`;

/* ─── Modal ─── */

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
  z-index: 2000;
  overflow-y: auto;
`;

const Modal = styled.div`
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 720px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes modalIn {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .dark & {
    background: #1e293b;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px;
  border-bottom: 1px solid #e2e8f0;

  .dark & {
    border-color: #334155;
  }
`;

const ModalTitle = styled.h2.attrs({
  className: "text-gray-900 dark:text-white",
})`
  font-size: 22px;
  font-weight: 700;
  margin: 0;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  color: #64748b;
  transition: all 0.15s;

  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .dark & {
    color: #94a3b8;
    &:hover {
      background: #334155;
      color: #f1f5f9;
    }
  }
`;

const ModalBody = styled.div`
  padding: 24px 28px;
  max-height: 70vh;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
`;

const SectionLabel = styled.h3.attrs({
  className: "text-gray-700 dark:text-gray-300",
})`
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
  margin: 24px 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;

  &:first-child {
    margin-top: 0;
  }

  .dark & {
    border-color: #334155;
  }
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const DetailItem = styled.div`
  ${(props) => props.$full && "grid-column: 1 / -1;"}
`;

const DetailLabel = styled.div.attrs({
  className: "text-gray-400 dark:text-gray-500",
})`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
  margin-bottom: 4px;
`;

const DetailValue = styled.div.attrs({
  className: "text-gray-900 dark:text-gray-100",
})`
  font-size: 14px;
  font-weight: 500;
`;

const DetailText = styled.p.attrs({
  className: "text-gray-700 dark:text-gray-300",
})`
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
`;

const ProfileLink = styled.a`
  color: #4285f4;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const SubmittedDate = styled.p.attrs({
  className: "text-gray-400 dark:text-gray-500",
})`
  font-size: 12px;
  margin-top: 20px;
  text-align: right;
`;

const DeleteButton = styled(ViewButton)`
  color: #ef4444;
  padding: 6px;
  
  &:hover {
    background: #fee2e2;
    border-color: #fca5a5;
  }

  .dark & {
    color: #f87171;
    &:hover {
      background: #7f1d1d;
      border-color: #991b1b;
    }
  }
`;

const BulkActionsPanel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(66, 133, 244, 0.1);
  border: 1px solid rgba(66, 133, 244, 0.2);
  padding: 12px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  
  span {
    color: #4285f4;
    font-weight: 600;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  background: ${(props) => {
    if (props.$status === 'selected') return '#dcfce7';
    if (props.$status?.includes('shortlisted')) return '#fef08a';
    if (props.$status === 'rejected') return '#fee2e2';
    return '#f1f5f9';
  }};
  color: ${(props) => {
    if (props.$status === 'selected') return '#166534';
    if (props.$status?.includes('shortlisted')) return '#854d0e';
    if (props.$status === 'rejected') return '#991b1b';
    return '#475569';
  }};
`;

const ActionBtn = styled.button`
  background: #4285f4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export default InductionManagement;

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
  Link2,
  Copy,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../contexts/useAuth";
import { API_BASE_URL } from "../../config/api";

const API = `${API_BASE_URL}/api`;

const InductionManagement = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isInductionOpen, setIsInductionOpen] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetStatus, setTargetStatus] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [inviteId, setInviteId] = useState("");
  const [inviteNote, setInviteNote] = useState("");
  const [inviteExpiresInDays, setInviteExpiresInDays] = useState(7);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState("");
  const [inviteLinks, setInviteLinks] = useState([]);
  const [inviteLinksLoading, setInviteLinksLoading] = useState(false);
  const [requestReason, setRequestReason] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchInviteLinks = useCallback(async () => {
    if (user?.role !== "super_admin") return;

    setInviteLinksLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/induction/invite-links`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data?.success) {
        setInviteLinks(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch invite links:", err);
    } finally {
      setInviteLinksLoading(false);
    }
  }, [user?.role]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Link copied to clipboard");
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      alert("Failed to copy. Please copy manually.");
    }
  };

  const handleCreateInviteLink = async () => {
    if (!inviteId.trim()) {
      alert("Please enter a specific invite ID");
      return;
    }

    setCreatingInvite(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${API}/induction/invite-links`,
        {
          inviteId: inviteId.trim(),
          note: inviteNote.trim(),
          expiresInDays: Number(inviteExpiresInDays) || 0,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (data?.success) {
        const url = data?.data?.url || "";
        setGeneratedInviteUrl(url);
        setInviteId("");
        setInviteNote("");
        setInviteExpiresInDays(7);
        await fetchInviteLinks();
      }
    } catch (err) {
      console.error("Failed to create invite link:", err);
      alert(err.response?.data?.message || "Failed to create invite link");
    } finally {
      setCreatingInvite(false);
    }
  };



  const handleDeleteRegistration = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete the application for ${name}?`)) return;
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.delete(`${API}/induction/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data?.success) {
        const deletedCount = Number(data.deletedCount || 1);
        alert(`Deleted ${deletedCount} submission(s) for ${name}.`);
      }
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
      if (statusFilter) params.append("status", statusFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);
      params.append("page", page);
      params.append("limit", pageSize);

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
  }, [branchFilter, page, statusFilter, debouncedSearch, pageSize]);

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
  }, [fetchSubmissions]);

  useEffect(() => {
    fetchInductionStatus();
    fetchInviteLinks();
  }, [fetchInductionStatus, fetchInviteLinks]);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, statusFilter, branchFilter, debouncedSearch, pageSize]);

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

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(submissions.map(s => s._id));
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
    
    // Event managers create advancement request, super admins can directly advance
    if (user?.role === 'event_manager') {
      return handleRequestAdvancement();
    }
    
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

  const handleRequestAdvancement = async () => {
    if (!targetStatus) return alert("Please select a target round.");
    if (selectedIds.length === 0) return alert("Please select at least one candidate.");
    
    const confirmMessage = `Request advancement for ${selectedIds.length} candidate(s) to '${targetStatus.replace('_', ' ')}'? Super admin will review your request.`;
    if (!window.confirm(confirmMessage)) return;

    setIsRequesting(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(`${API}/induction/advancement-requests`, 
        { 
          studentIds: selectedIds, 
          targetStatus,
          reason: requestReason.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (data.success) {
        alert(data.message + "\nSuper admin will review your request.");
        setSelectedIds([]);
        setTargetStatus("");
        setRequestReason("");
      }
    } catch (err) {
      console.error("Failed to create advancement request:", err);
      alert(err.response?.data?.message || "Failed to create request. Please try again.");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (branchFilter) params.append("branch", branchFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);

      const response = await axios.get(
        `${API}/induction/export?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `induction_submissions_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export induction data:", err);
      alert("Failed to export Excel file. Please try again.");
    }
  };

  const branches = [
    "Computer Science and Engineering",
    "Information Technology",
    "Electronics and Communication Engineering",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Chemical Engineering",
    "Internet of Things",
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
              Export Excel
            </ExportButton>
          )}
        </HeaderActions>
      </Header>

      {user?.role === "super_admin" && (
        <InviteSection>
          <InviteHeading>
            <Link2 size={16} />
            Special One-Time Induction Links
          </InviteHeading>

          <InviteFormRow>
            <InviteInput
              placeholder="Specific ID (e.g. EXT-2026-001)"
              value={inviteId}
              onChange={(e) => setInviteId(e.target.value)}
            />
            <InviteInput
              placeholder="Note (optional)"
              value={inviteNote}
              onChange={(e) => setInviteNote(e.target.value)}
            />
            <InviteSelect
              value={inviteExpiresInDays}
              onChange={(e) => setInviteExpiresInDays(Number(e.target.value))}
            >
              <option value={0}>No Expiry</option>
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={15}>15 days</option>
              <option value={30}>30 days</option>
            </InviteSelect>
            <ActionBtn onClick={handleCreateInviteLink} disabled={creatingInvite}>
              {creatingInvite ? "Generating..." : "Generate Link"}
            </ActionBtn>
          </InviteFormRow>

          {generatedInviteUrl ? (
            <GeneratedLinkBar>
              <GeneratedLinkText>{generatedInviteUrl}</GeneratedLinkText>
              <CopyButton onClick={() => copyToClipboard(generatedInviteUrl)}>
                <Copy size={14} /> Copy
              </CopyButton>
            </GeneratedLinkBar>
          ) : null}

          <InviteList>
            {inviteLinksLoading ? (
              <InviteListEmpty>Loading invite links...</InviteListEmpty>
            ) : inviteLinks.length === 0 ? (
              <InviteListEmpty>No invite links generated yet.</InviteListEmpty>
            ) : (
              inviteLinks.slice(0, 8).map((invite) => (
                <InviteRow key={invite.id}>
                  <InviteMeta>
                    <strong>{invite.inviteId}</strong>
                    <span>{invite.note || "No note"}</span>
                    <small>
                      {invite.isUsed ? "Used" : "Unused"}
                      {invite.expiresAt ? ` • Expires ${new Date(invite.expiresAt).toLocaleDateString()}` : " • No expiry"}
                    </small>
                  </InviteMeta>
                  <CopyButton onClick={() => copyToClipboard(invite.url)}>
                    <Copy size={14} /> Copy Link
                  </CopyButton>
                </InviteRow>
              ))
            )}
          </InviteList>
        </InviteSection>
      )}

      <FiltersRow>
        <SearchBox>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name, email, roll no..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
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

      {selectedIds.length > 0 && (
        <BulkActionsPanel>
          <span>{selectedIds.length} candidate{selectedIds.length > 1 ? 's' : ''} selected</span>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
            <Select style={{ padding: '8px', minWidth: '180px' }} value={targetStatus} onChange={(e) => setTargetStatus(e.target.value)}>
              <option value="">-- Move to Round --</option>
              <option value="shortlisted_online">Shortlist: Online PI</option>
              <option value="shortlisted_offline">Shortlist: Offline PI</option>
              <option value="selected">Finalize: Selected</option>
              <option value="rejected">Reject</option>
            </Select>
            {user?.role === 'event_manager' && (
              <RequestReasonInput
                placeholder="Reason for request (optional)"
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
              />
            )}
            <ActionBtn onClick={handleBulkAdvance} disabled={isAdvancing || isRequesting}>
              {isAdvancing || isRequesting 
                ? "Processing..." 
                : user?.role === 'event_manager' 
                  ? "Request Advancement" 
                  : "Finalize Selected"}
            </ActionBtn>
          </div>
        </BulkActionsPanel>
      )}

      {loading ? (
        <LoadingState>Loading submissions...</LoadingState>
      ) : submissions.length === 0 ? (
        <EmptyState>No induction applications found.</EmptyState>
      ) : (
        <>
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  {(user?.role === 'super_admin' || user?.role === 'event_manager' || user?.role === 'admin') && (
                    <Th style={{ width: '40px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        onChange={handleSelectAll} 
                        checked={submissions.length > 0 && selectedIds.length === submissions.length}
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
                {submissions.map((s) => (
                  <tr key={s._id} style={{ background: selectedIds.includes(s._id) ? 'rgba(66, 133, 244, 0.05)' : 'transparent' }}>
                    {(user?.role === 'super_admin' || user?.role === 'event_manager' || user?.role === 'admin') && (
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
              Showing {total === 0 ? 0 : (page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total} results (Page {page} of {totalPages})
            </PageInfo>
            <PaginationControls>
              <PerPageControl>
                <PerPageLabel>Rows per page</PerPageLabel>
                <Select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  style={{ minWidth: "92px", padding: "8px 12px" }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Select>
              </PerPageControl>
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
            </PaginationControls>
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
                  <DetailLabel>Tech Stack / Tech Skills</DetailLabel>
                  <DetailValue>
                    {selectedStudent.techStack || selectedStudent.techSkills || "—"}
                  </DetailValue>
                </DetailItem>
                <DetailItem $full>
                  <DetailLabel>Soft Skills</DetailLabel>
                  <DetailValue>
                    {selectedStudent.softSkills || "—"}
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
                  <DetailLabel>LeetCode</DetailLabel>
                  <DetailValue>
                    {selectedStudent.leetcodeId || "—"}
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
                <DetailItem $full>
                  <DetailLabel>Strengths</DetailLabel>
                  <DetailText>{selectedStudent.strengths || "—"}</DetailText>
                </DetailItem>
                <DetailItem $full>
                  <DetailLabel>Weaknesses</DetailLabel>
                  <DetailText>{selectedStudent.weaknesses || "—"}</DetailText>
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
  
  @media (max-width: 650px) {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
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

  @media (max-width: 500px) {
    flex-direction: column;
    gap: 12px;
  }

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

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 500px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const PerPageControl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PerPageLabel = styled.span.attrs({
  className: "text-gray-500 dark:text-gray-400",
})`
  font-size: 13px;
  white-space: nowrap;
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

const RequestReasonInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  color: #1e293b;

  &::placeholder {
    color: #94a3b8;
  }

  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #e2e8f0;
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
  
  @media (max-width: 600px) {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    
    > div {
      flex-direction: column;
      width: 100%;
    }
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

const InviteSection = styled.div`
  margin-bottom: 20px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #dbeafe;
  background: #f8fbff;

  .dark & {
    background: #0f172a;
    border-color: #1e3a8a;
  }
`;

const InviteHeading = styled.h3`
  margin: 0 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: #1e40af;

  .dark & {
    color: #93c5fd;
  }
`;

const InviteFormRow = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1.4fr 0.8fr auto;
  gap: 10px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const InviteInput = styled.input`
  height: 40px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 14px;

  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #e2e8f0;
  }
`;

const InviteSelect = styled.select`
  height: 40px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0 10px;
  font-size: 14px;

  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #e2e8f0;
  }
`;

const GeneratedLinkBar = styled.div`
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  background: #eff6ff;

  @media (max-width: 760px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const GeneratedLinkText = styled.div`
  flex: 1;
  font-size: 12px;
  color: #1e3a8a;
  overflow-wrap: anywhere;
`;

const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #93c5fd;
  background: #ffffff;
  color: #1d4ed8;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;

  .dark & {
    background: #0f172a;
    border-color: #1d4ed8;
    color: #93c5fd;
  }
`;

const InviteList = styled.div`
  margin-top: 12px;
  display: grid;
  gap: 8px;
`;

const InviteRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;

  @media (max-width: 760px) {
    flex-direction: column;
    align-items: stretch;
  }

  .dark & {
    border-color: #334155;
  }
`;

const InviteMeta = styled.div`
  display: grid;
  gap: 2px;

  strong {
    color: #0f172a;
    font-size: 13px;
  }

  span {
    color: #64748b;
    font-size: 12px;
  }

  small {
    color: #475569;
    font-size: 11px;
  }

  .dark & {
    strong {
      color: #e2e8f0;
    }

    span {
      color: #94a3b8;
    }

    small {
      color: #cbd5e1;
    }
  }
`;

const InviteListEmpty = styled.div`
  font-size: 13px;
  color: #64748b;
`;

export default InductionManagement;

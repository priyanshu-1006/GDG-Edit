import { useState, useEffect } from "react";
import styled from "styled-components";
import { Plus, Trash2, Eye, FileSpreadsheet, Download, AlertCircle } from "lucide-react";
import { apiClient } from "../../utils/apiUtils";
import IssueCertificateModal from "./components/IssueCertificateModal";
import BulkIssueModal from "./components/BulkIssueModal";

const Container = styled.div`
  padding: 24px;
  max-width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 20px;
  flex-wrap: wrap;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;

  .dark & {
    color: white;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
`;

const EventSelect = styled.select`
  height: 40px;
  min-width: 220px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 12px;
  background: white;
  color: #0f172a;
  font-size: 14px;

  .dark & {
    background: #0f172a;
    border-color: #334155;
    color: #e2e8f0;
  }
`;

const AddButton = styled.button`
  background: linear-gradient(135deg, #4285f4, #3b82f6);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(66, 133, 244, 0.2);
  }
`;

const SecondaryButton = styled.button`
  background: #ffffff;
  color: #1e40af;
  border: 1px solid #93c5fd;
  padding: 10px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:not(:disabled):hover {
    background: #eff6ff;
  }

  .dark & {
    background: #0f172a;
    color: #93c5fd;
    border-color: #1d4ed8;

    &:not(:disabled):hover {
      background: #1e293b;
    }
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;

  .dark & {
    background: #1e293b;
    border-color: #334155;
  }
`;

const Th = styled.th`
  text-align: left;
  padding: 16px;
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  border-bottom: 1px solid #e2e8f0;

  .dark & {
    background: #0f172a;
    color: #94a3b8;
    border-color: #334155;
  }
`;

const Td = styled.td`
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  color: #334155;
  font-size: 14px;

  .dark & {
    color: #e2e8f0;
    border-color: #334155;
  }

  tr:last-child & {
    border-bottom: none;
  }
`;

const ActionButton = styled.button`
  padding: 8px;
  margin-right: 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  color: ${(props) => (props.$tone === "red" ? "#ef4444" : props.$tone === "blue" ? "#3b82f6" : "#10b981")};
  transition: all 0.2s;

  &:hover {
    background: ${(props) =>
      props.$tone === "red" ? "#fef2f2" : props.$tone === "blue" ? "#eff6ff" : "#ecfdf5"};
  }

  .dark & {
    &:hover {
      background: ${(props) =>
        props.$tone === "red" ? "#7f1d1d" : props.$tone === "blue" ? "#1e3a8a" : "#064e3b"};
    }
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const DangerButton = styled.button`
  background: #ef4444;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    background: #fca5a5;
  }

  &:not(:disabled):hover {
    background: #dc2626;
  }

  .dark & {
    &:not(:disabled):hover {
      background: #b91c1c;
    }
  }
`;

const SelectionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #eff6ff;
  border: 1px solid #93c5fd;
  border-radius: 8px;
  margin-bottom: 16px;
  color: #1e40af;
  font-weight: 500;

  .dark & {
    background: #1e3a8a;
    border-color: #1d4ed8;
    color: #93c5fd;
  }
`;

export default function CertificateManagement() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [selectedCerts, setSelectedCerts] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCerts = async () => {
    try {
      const res = await apiClient.get("/api/certificates");
      if (res.data.success) {
        const fetchedCerts = res.data.certificates || [];
        setCerts(fetchedCerts);

        if (!selectedEventId) {
          const firstEventId = fetchedCerts.find((c) => c.event?._id)?.event?._id;
          if (firstEventId) {
            setSelectedEventId(firstEventId);
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eventOptions = [...new Map(
    certs
      .filter((cert) => cert.event?._id)
      .map((cert) => [cert.event._id, { id: cert.event._id, name: cert.event.name || "Untitled Event" }]),
  ).values()];

  const handleDownloadZip = async () => {
    if (!selectedEventId) {
      alert("Please select an event first.");
      return;
    }

    try {
      setIsDownloadingZip(true);
      const response = await apiClient.get(
        `/api/certificates/download/event/${selectedEventId}/zip`,
        { responseType: "blob" },
      );

      const disposition = response.headers["content-disposition"];
      let fileName = "event-certificates.zip";
      const match = disposition?.match(/filename="?([^"]+)"?/i);
      if (match && match[1]) {
        fileName = match[1];
      }

      const fileUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = fileUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(fileUrl);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to download ZIP file.");
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await apiClient.delete(`/api/certificates/${id}`);
      fetchCerts();
    } catch (err) {
      console.error(err);
      alert("Delete failed. " + (err.response?.data?.message || ""));
    }
  };

  const handleSelectCert = (id) => {
    const newSelected = new Set(selectedCerts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCerts(newSelected);
  };

  const filteredCerts = selectedEventId 
    ? certs.filter(cert => cert.event?._id === selectedEventId)
    : certs;

  const handleSelectAll = () => {
    if (selectedCerts.size === filteredCerts.length && filteredCerts.length > 0) {
      setSelectedCerts(new Set());
    } else {
      setSelectedCerts(new Set(filteredCerts.map((c) => c._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCerts.size === 0) return;
    const confirmed = window.confirm(
      `Delete ${selectedCerts.size} certificate(s)? This cannot be undone.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedCerts).map((id) =>
          apiClient.delete(`/api/certificates/${id}`).catch((err) => {
            console.error(`Failed to delete ${id}:`, err);
            return Promise.reject(err);
          })
        )
      );
      setSelectedCerts(new Set());
      fetchCerts();
      alert("Certificates deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Some certificates failed to delete. " + (err.response?.data?.message || ""));
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <Container>Loading...</Container>;

  return (
    <Container>
      <Header>
        <Title>Certificate Management</Title>
        <ButtonGroup>
          <EventSelect
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            <option value="">Select event for ZIP export</option>
            {eventOptions.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </EventSelect>
          <SecondaryButton
            onClick={handleDownloadZip}
            disabled={!selectedEventId || isDownloadingZip}
          >
            <Download size={18} />
            {isDownloadingZip ? "Preparing ZIP..." : "Download Event ZIP"}
          </SecondaryButton>
          <AddButton onClick={() => setIsBulkModalOpen(true)}>
            <FileSpreadsheet size={20} /> Bulk Issue
          </AddButton>
          <AddButton onClick={() => setIsModalOpen(true)}>
            <Plus size={20} /> Issue Certificate
          </AddButton>
        </ButtonGroup>
      </Header>
      
      {selectedCerts.size > 0 && (
        <SelectionInfo>
          <AlertCircle size={20} />
          <span>{selectedCerts.size} certificate(s) selected</span>
          <DangerButton onClick={handleBulkDelete} disabled={isDeleting}>
            <Trash2 size={18} />
            {isDeleting ? "Deleting..." : "Delete Selected"}
          </DangerButton>
        </SelectionInfo>
      )}

      <Table>
        <thead>
          <tr>
            <Th style={{ width: "40px" }}>
              <Checkbox
                type="checkbox"
                checked={selectedCerts.size === filteredCerts.length && filteredCerts.length > 0}
                onChange={handleSelectAll}
              />
            </Th>
            <Th>Code</Th>
            <Th>Recipient</Th>
            <Th>Event</Th>
            <Th>Date</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {filteredCerts.length === 0 ? (
            <tr>
              <Td colSpan="6" style={{ textAlign: "center" }}>
                No certificates found
              </Td>
            </tr>
          ) : (
            filteredCerts.map((cert) => (
              <tr key={cert._id}>
                <Td style={{ width: "40px" }}>
                  <Checkbox
                    type="checkbox"
                    checked={selectedCerts.has(cert._id)}
                    onChange={() => handleSelectCert(cert._id)}
                  />
                </Td>
                <Td>{cert.certificateCode}</Td>
                <Td>{cert.recipientName || cert.user?.name || "Unknown"}</Td>
                <Td>{cert.event?.name || "Unknown"}</Td>
                <Td>{new Date(cert.issuedAt).toLocaleDateString()}</Td>
                <Td>
                  <ActionButton
                    $tone="green"
                    onClick={() =>
                      window.open(
                        `/verification/${cert.certificateCode}`,
                        "_blank",
                      )
                    }
                  >
                    <Eye size={18} />
                  </ActionButton>
                  <ActionButton
                    $tone="red"
                    onClick={() => handleDelete(cert._id)}
                  >
                    <Trash2 size={18} />
                  </ActionButton>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <IssueCertificateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCerts}
      />
      <BulkIssueModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={fetchCerts}
      />
    </Container>
  );
}

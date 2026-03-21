import { useState, useEffect } from "react";
import styled from "styled-components";
import { Plus, Trash2, Eye, FileSpreadsheet, Pencil, X, Check } from "lucide-react";
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
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  .dark & { color: white; }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
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

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  .dark & { background: #1e293b; border-color: #334155; }
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
  .dark & { background: #0f172a; color: #94a3b8; border-color: #334155; }
`;

const Td = styled.td`
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  color: #334155;
  font-size: 14px;
  .dark & { color: #e2e8f0; border-color: #334155; }
  tr:last-child & { border-bottom: none; }
`;

const ActionButton = styled.button`
  padding: 8px;
  margin-right: 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  color: ${(p) => p.color === "red" ? "#ef4444" : p.color === "blue" ? "#3b82f6" : "#10b981"};
  transition: all 0.2s;
  &:hover {
    background: ${(p) => p.color === "red" ? "#fef2f2" : p.color === "blue" ? "#eff6ff" : "#ecfdf5"};
  }
  .dark & {
    &:hover {
      background: ${(p) => p.color === "red" ? "#7f1d1d" : p.color === "blue" ? "#1e3a5f" : "#064e3b"};
    }
  }
`;

const Overlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; justify-content: center; align-items: center;
  z-index: 2000;
`;

const Modal = styled.div`
  background: white; border-radius: 16px; width: 100%; max-width: 480px;
  padding: 28px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  .dark & { background: #1e293b; }
`;

const ModalTitle = styled.h2`
  font-size: 20px; font-weight: 700; margin-bottom: 20px; color: #0f172a;
  display: flex; justify-content: space-between; align-items: center;
  .dark & { color: white; }
`;

const Field = styled.div`margin-bottom: 14px;`;

const Label = styled.label`
  display: block; font-size: 12px; font-weight: 600;
  text-transform: uppercase; color: #64748b; margin-bottom: 4px;
  .dark & { color: #94a3b8; }
`;

const Input = styled.input`
  width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0;
  border-radius: 8px; font-size: 14px; outline: none;
  background: white; color: #0f172a; transition: border-color 0.15s;
  &:focus { border-color: #4285f4; }
  .dark & {
    background: #0f172a; border-color: #334155; color: #e2e8f0;
    &:focus { border-color: #60a5fa; }
  }
`;

const SaveBtn = styled.button`
  width: 100%; padding: 12px; background: #4285f4; color: white;
  border: none; border-radius: 10px; font-weight: 600; font-size: 14px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  gap: 8px; margin-top: 8px; transition: background 0.15s;
  &:hover { background: #3367d6; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const CloseBtn = styled.button`
  background: none; border: none; cursor: pointer; color: #64748b;
  padding: 4px; border-radius: 6px;
  &:hover { background: #f1f5f9; }
  .dark & { color: #94a3b8; &:hover { background: #334155; } }
`;

export default function CertificateManagement() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editCert, setEditCert] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchCerts = async () => {
    try {
      const res = await apiClient.get("/api/certificates");
      if (res.data.success) setCerts(res.data.certificates || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCerts(); }, []);

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

  const openEdit = (cert) => {
    setEditCert(cert);
    setEditForm({
      recipientName: cert.recipientName || cert.user?.name || "",
      recipientEmail: cert.recipientEmail || "",
      customEventName: cert.event?.name || cert.customEventName || "",
      certificateCode: cert.certificateCode || "",
      certificateUrl: cert.certificateUrl || "",
      issuedAt: cert.issuedAt ? cert.issuedAt.split("T")[0] : "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editCert) return;
    setSaving(true);
    try {
      await apiClient.put(`/api/certificates/${editCert._id}`, editForm);
      setEditCert(null);
      fetchCerts();
    } catch (err) {
      console.error(err);
      alert("Save failed. " + (err.response?.data?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Container>Loading...</Container>;

  return (
    <Container>
      <Header>
        <Title>Certificate Management</Title>
        <ButtonGroup>
          <AddButton onClick={() => setIsBulkModalOpen(true)}>
            <FileSpreadsheet size={20} /> Bulk Issue
          </AddButton>
          <AddButton onClick={() => setIsModalOpen(true)}>
            <Plus size={20} /> Issue Certificate
          </AddButton>
        </ButtonGroup>
      </Header>
      <Table>
        <thead>
          <tr>
            <Th>Code</Th>
            <Th>Recipient</Th>
            <Th>Event</Th>
            <Th>Date</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {certs.length === 0 ? (
            <tr>
              <Td colSpan="5" style={{ textAlign: "center" }}>
                No certificates found
              </Td>
            </tr>
          ) : (
            certs.map((cert) => (
              <tr key={cert._id}>
                <Td>{cert.certificateCode}</Td>
                <Td>{cert.recipientName || cert.user?.name || "Unknown"}</Td>
                <Td>{cert.event?.name || cert.customEventName || "Unknown"}</Td>
                <Td>{new Date(cert.issuedAt).toLocaleDateString()}</Td>
                <Td>
                  <ActionButton color="green" onClick={() => window.open(`/verification/${cert.certificateCode}`, "_blank")}>
                    <Eye size={18} />
                  </ActionButton>
                  <ActionButton color="blue" onClick={() => openEdit(cert)}>
                    <Pencil size={18} />
                  </ActionButton>
                  <ActionButton color="red" onClick={() => handleDelete(cert._id)}>
                    <Trash2 size={18} />
                  </ActionButton>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <IssueCertificateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchCerts} />
      <BulkIssueModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} onSuccess={fetchCerts} />

      {editCert && (
        <Overlay onClick={() => setEditCert(null)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              Edit Certificate
              <CloseBtn onClick={() => setEditCert(null)}><X size={20} /></CloseBtn>
            </ModalTitle>
            <Field>
              <Label>Certificate Code</Label>
              <Input value={editForm.certificateCode} onChange={(e) => setEditForm({ ...editForm, certificateCode: e.target.value })} />
            </Field>
            <Field>
              <Label>Recipient Name</Label>
              <Input value={editForm.recipientName} onChange={(e) => setEditForm({ ...editForm, recipientName: e.target.value })} />
            </Field>
            <Field>
              <Label>Recipient Email</Label>
              <Input value={editForm.recipientEmail} onChange={(e) => setEditForm({ ...editForm, recipientEmail: e.target.value })} />
            </Field>
            <Field>
              <Label>Event Name</Label>
              <Input value={editForm.customEventName} onChange={(e) => setEditForm({ ...editForm, customEventName: e.target.value })} />
            </Field>
            <Field>
              <Label>Issue Date</Label>
              <Input type="date" value={editForm.issuedAt} onChange={(e) => setEditForm({ ...editForm, issuedAt: e.target.value })} />
            </Field>
            <Field>
              <Label>Certificate URL</Label>
              <Input value={editForm.certificateUrl} onChange={(e) => setEditForm({ ...editForm, certificateUrl: e.target.value })} />
            </Field>
            <SaveBtn onClick={handleSaveEdit} disabled={saving}>
              <Check size={18} />
              {saving ? "Saving..." : "Save Changes"}
            </SaveBtn>
          </Modal>
        </Overlay>
      )}
    </Container>
  );
}

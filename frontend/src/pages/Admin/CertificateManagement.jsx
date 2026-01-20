import { useState, useEffect } from "react";
import styled from "styled-components";
import { Plus, Trash2, Eye, FileSpreadsheet } from "lucide-react";
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

  .dark & {
    color: white;
  }
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
  color: ${(props) => (props.color === "red" ? "#ef4444" : "#10b981")};
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.color === "red" ? "#fef2f2" : "#ecfdf5")};
  }

  .dark & {
    &:hover {
      background: ${(props) => (props.color === "red" ? "#7f1d1d" : "#064e3b")};
    }
  }
`;

export default function CertificateManagement() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const fetchCerts = async () => {
    try {
      const res = await apiClient.get("/api/certificates");
      if (res.data.success) {
        setCerts(res.data.certificates || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCerts();
  }, []);

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
                <Td>{cert.event?.name || "Unknown"}</Td>
                <Td>{new Date(cert.issuedAt).toLocaleDateString()}</Td>
                <Td>
                  <ActionButton
                    color="green"
                    onClick={() =>
                      window.open(
                        cert.isDynamic
                          ? `/verification/${cert.certificateCode}`
                          : cert.certificateUrl ||
                              `/verification/${cert.certificateCode}`,
                        "_blank",
                      )
                    }
                  >
                    <Eye size={18} />
                  </ActionButton>
                  <ActionButton
                    color="red"
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

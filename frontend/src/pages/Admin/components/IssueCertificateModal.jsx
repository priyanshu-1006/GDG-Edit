import { useState, useEffect } from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import { X, Check, Upload } from "lucide-react";
import { toast } from "react-toastify";
import { apiClient as api, API_BASE_URL } from "../../../utils/apiUtils";
import axios from "axios";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ModalContainer = styled.div`
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  padding: 2rem;
  position: relative;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow-y: auto;

  .dark & {
    background: #1e293b;
    border: 1px solid #334155;
    box-shadow: none;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    color: #0f172a;
    background: #f1f5f9;
  }

  .dark & {
    color: #94a3b8;
    &:hover {
      color: white;
      background: #334155;
    }
  }
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1.5rem;
  font-family: "Google Sans", sans-serif;

  .dark & {
    color: white;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.5rem;

  .dark & {
    color: #cbd5e1;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: white;
  color: #0f172a;

  &:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  }

  .dark & {
    background: #0f172a;
    border-color: #334155;
    color: white;

    &:focus {
      border-color: #60a5fa;
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
    }
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  background-color: white;
  color: #0f172a;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  }

  .dark & {
    background: #0f172a;
    border-color: #334155;
    color: white;

    &:focus {
      border-color: #60a5fa;
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2);
    }
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background-color: #3367d6;
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const IssueCertificateModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [events, setEvents] = useState([]);

  const [formData, setFormData] = useState({
    recipientName: "",
    recipientEmail: "",
    certificateCode: "",
    eventId: "",
    issueDate: new Date().toISOString().split("T")[0],
    certificateUrl: "",
  });

  const [file, setFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setFetchingData(true);
    try {
      // Parallel fetch using axios directly or api client
      // Assuming api.get returns response.data
      const res = await api.get("/api/events?limit=100&upcoming=false"); // Get past events mostly
      setEvents(res.data.events || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load events");
    } finally {
      setFetchingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!file) return null;
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/certificates/upload-template`, // Reusing template upload endpoint which handles images
        uploadData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return res.data.secure_url || res.data.url;
    } catch (err) {
      console.error("Upload error", err);
      toast.error("Failed to upload certificate file");
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.recipientName ||
      !formData.recipientEmail ||
      !formData.certificateCode ||
      !formData.eventId
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!formData.certificateUrl && !file) {
      toast.error("Please provide a Certificate URL or upload a file");
      return;
    }

    setLoading(true);
    try {
      let finalUrl = formData.certificateUrl;

      if (file) {
        setUploading(true);
        finalUrl = await uploadFile();
        setUploading(false);
      }

      const payload = {
        ...formData,
        issuedAt: formData.issueDate,
        certificateUrl: finalUrl,
      };

      await api.post("/api/certificates", payload);
      toast.success("Certificate issued successfully");
      setFormData({
        recipientName: "",
        recipientEmail: "",
        certificateCode: "",
        eventId: "",
        issueDate: new Date().toISOString().split("T")[0],
        certificateUrl: "",
      });
      setFile(null);
      onSuccess(); // Refresh parent list
      onClose(); // Close modal
    } catch (error) {
      console.error("Error issuing certificate:", error);
      toast.error(
        error.response?.data?.message || "Failed to issue certificate",
      );
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <X size={24} />
        </CloseButton>
        <Title>Issue New Certificate</Title>

        {fetchingData ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            Loading data...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Event</Label>
              <Select
                name="eventId"
                value={formData.eventId}
                onChange={handleChange}
                required
              >
                <option value="">Select an Event</option>
                {events.map((event) => (
                  <option key={event._id} value={event._id}>
                    {event.name} ({new Date(event.date).toLocaleDateString()})
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Recipient Name</Label>
              <Input
                type="text"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Recipient Email</Label>
              <Input
                type="email"
                name="recipientEmail"
                value={formData.recipientEmail}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Certificate ID / Code</Label>
              <Input
                type="text"
                name="certificateCode"
                value={formData.certificateCode}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Issue Date</Label>
              <Input
                type="date"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Certificate File or URL</Label>

              <div style={{ marginBottom: "1rem" }}>
                <label
                  htmlFor="cert-file"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "6px",
                    cursor: "pointer",
                    background: file ? "#f0fdf4" : "transparent",
                    color: file ? "#15803d" : "inherit",
                  }}
                >
                  <Upload size={18} />
                  {file ? file.name : "Upload Image/PDF"}
                </label>
                <input
                  id="cert-file"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </div>

              <div
                style={{
                  textAlign: "center",
                  margin: "0.5rem 0",
                  fontSize: "0.75rem",
                  color: "#64748b",
                }}
              >
                OR
              </div>

              <Input
                type="url"
                name="certificateUrl"
                value={formData.certificateUrl}
                onChange={handleChange}
                placeholder="https://example.com/certificate.pdf"
                disabled={!!file}
              />
            </FormGroup>

            <Button type="submit" disabled={loading || uploading}>
              {uploading ? (
                "Uploading File..."
              ) : loading ? (
                "Issuing..."
              ) : (
                <>
                  <Check size={18} />
                  Issue Certificate
                </>
              )}
            </Button>
          </form>
        )}
      </ModalContainer>
    </ModalOverlay>
  );
};

export default IssueCertificateModal;

IssueCertificateModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

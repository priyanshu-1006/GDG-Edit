import { useState } from "react";
import styled from "styled-components";
import { X, Upload, Calendar, MapPin, Users, DollarSign } from "lucide-react";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../../utils/apiUtils";

const CreateEventModal = ({ show, onClose, onSuccess, editEvent = null }) => {
  const [formData, setFormData] = useState(
    editEvent || {
      name: "",
      description: "",
      type: "Hackathon",
      location: "",
      date: "",
      time: "",
      capacity: 100,
      registrationDeadline: "",
      image: "",
      tags: [],
      published: false,
      registrationOpen: true,
      eventCategory: "general",
    },
  );

  const [currentTag, setCurrentTag] = useState("");

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editEvent
        ? `${API_BASE_URL}/api/admin/events/${editEvent._id}`
        : `${API_BASE_URL}/api/admin/events`;

      const method = editEvent ? "put" : "post";

      await axios[method](url, formData, {
        headers: getAuthHeaders(),
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save event:", error);
      alert(
        "Failed to save event: " +
          (error.response?.data?.message || error.message),
      );
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addTag = () => {
    if (currentTag.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag("");
    }
  };

  const removeTag = (index) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  return (
    <Overlay>
      <Modal>
        <Header>
          <Title>{editEvent ? "Edit Event" : "Create New Event"}</Title>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </Header>

        <Form onSubmit={handleSubmit}>
          <Section>
            <SectionTitle>Basic Information</SectionTitle>

            <FormGroup>
              <Label>Event Name *</Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., HackBlitz 2024"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Description *</Label>
              <TextArea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your event..."
                rows={4}
                required
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label>Event Type *</Label>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="Workshop">Workshop</option>
                  <option value="Study Jam">Study Jam</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Meetup">Meetup</option>
                  <option value="Conference">Conference</option>
                  <option value="Webinar">Webinar</option>
                  <option value="Tech Fest">Tech Fest</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Event Category</Label>
                <Select
                  name="eventCategory"
                  value={formData.eventCategory}
                  onChange={handleChange}
                >
                  <option value="general">General</option>
                  <option value="study-jam">Study Jam</option>
                  <option value="immerse">Immerse</option>
                  <option value="hackblitz">HackBlitz</option>
                </Select>
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>Event Image URL</Label>
              <Input
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </FormGroup>
          </Section>

          <Section>
            <SectionTitle>Date, Time & Location</SectionTitle>

            <FormRow>
              <FormGroup>
                <Label>Event Date *</Label>
                <Input
                  type="datetime-local"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Event Time *</Label>
                <Input
                  type="text"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  placeholder="e.g., 09:00 AM - 05:00 PM"
                  required
                />
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>Location *</Label>
              <Input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., MMMUT Gorakhpur or Zoom Meeting"
                required
              />
            </FormGroup>

            <FormRow>
              <FormGroup>
                <Label>Capacity</Label>
                <Input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="100"
                  min="1"
                />
              </FormGroup>

              <FormGroup>
                <Label>Registration Deadline</Label>
                <Input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                />
              </FormGroup>
            </FormRow>
          </Section>

          <Section>
            <SectionTitle>Tags</SectionTitle>

            <TagInput>
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Add tags (e.g., AI, ML, Web Dev)"
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
              />
              <AddButton type="button" onClick={addTag}>
                Add Tag
              </AddButton>
            </TagInput>

            <TagsList>
              {formData.tags.map((tag, index) => (
                <Tag key={index}>
                  {tag}
                  <RemoveButton onClick={() => removeTag(index)}>
                    ×
                  </RemoveButton>
                </Tag>
              ))}
            </TagsList>
          </Section>

          <Section>
            <SectionTitle>Settings</SectionTitle>

            <FormGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  name="published"
                  checked={formData.published}
                  onChange={handleChange}
                />
                Publish event immediately
              </CheckboxLabel>
            </FormGroup>

            <FormGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  name="registrationOpen"
                  checked={formData.registrationOpen}
                  onChange={handleChange}
                />
                Registration open
              </CheckboxLabel>
            </FormGroup>
          </Section>

          <Footer>
            <CancelButton type="button" onClick={onClose}>
              Cancel
            </CancelButton>
            <SubmitButton type="submit">
              {editEvent ? "Update Event" : "Create Event"}
            </SubmitButton>
          </Footer>
        </Form>
      </Modal>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overflow-y: auto;
  padding: 24px;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const Modal = styled.div`
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;

  .dark & {
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  border-radius: 20px 20px 0 0;

  .dark & {
    background: #1e293b;
    border-color: rgba(255, 255, 255, 0.05);
  }
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.5px;

  .dark & {
    color: white;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  padding: 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    color: #ef4444;
  }

  .dark & {
    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  }
`;

const Form = styled.form`
  padding: 32px;
  flex: 1;
  overflow-y: auto;
`;

const Section = styled.div`
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid #f0f0f0;

  &:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
    margin-bottom: 0;
  }

  .dark & {
    border-color: rgba(255, 255, 255, 0.05);
  }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &::before {
    content: "";
    display: block;
    width: 4px;
    height: 16px;
    background: #4285f4;
    border-radius: 2px;
  }

  .dark & {
    color: white;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 8px;

  .dark & {
    color: #cbd5e1;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
  background: white;
  color: #1a1a1a;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
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
  border-radius: 12px;
  font-size: 15px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  background: white;
  color: #1a1a1a;
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
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
  cursor: pointer;
  background: white;
  color: #1a1a1a;
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
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  color: #334155;
  cursor: pointer;
  user-select: none;

  input {
    cursor: pointer;
    width: 18px;
    height: 18px;
    accent-color: #4285f4;
  }

  .dark & {
    color: #cbd5e1;
  }
`;

const TagInput = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
`;

const AddButton = styled.button`
  padding: 12px 20px;
  background: linear-gradient(135deg, #4285f4, #3b82f6);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 10px -1px rgba(59, 130, 246, 0.3);
  }
`;

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: #eff6ff;
  color: #1d4ed8;
  border-radius: 99px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #dbeafe;

  .dark & {
    background: #172554;
    color: #93c5fd;
    border-color: #1e3a8a;
  }
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #60a5fa;
  cursor: pointer;
  font-size: 16px;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;

  &:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 24px 32px;
  border-top: 1px solid #f0f0f0;
  background: #fcfcfc;
  border-radius: 0 0 20px 20px;

  .dark & {
    background: #0f172a;
    border-color: rgba(255, 255, 255, 0.05);
  }
`;

const CancelButton = styled.button`
  padding: 12px 24px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
  transition: all 0.2s;

  &:hover {
    background: #f8fafc;
    color: #475569;
  }

  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;

    &:hover {
      background: #334155;
      color: white;
    }
  }
`;

const SubmitButton = styled.button`
  padding: 12px 28px;
  background: linear-gradient(135deg, #4285f4, #34a853);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 4px 6px -1px rgba(66, 133, 244, 0.2);
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px -1px rgba(66, 133, 244, 0.3);
  }
`;

export default CreateEventModal;

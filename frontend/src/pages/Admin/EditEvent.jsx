import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../../utils/apiUtils";
import { ArrowLeft, Save, X } from "lucide-react";

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "Workshop",
    description: "",
    location: "",
    date: "",
    time: "",
    capacity: 100,
    tags: "",
    eventCategory: "general",
    published: false,
    registrationOpen: true,
    image: "",
  });

  const fetchEvent = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/events/${id}`,
        {
          headers: getAuthHeaders(),
        },
      );
      const event = response.data.event;
      setFormData({
        name: event.name || "",
        type: event.type || "Workshop",
        description: event.description || "",
        location: event.location || "",
        date: event.date
          ? new Date(event.date).toISOString().split("T")[0]
          : "",
        time: event.time || "",
        capacity: event.capacity || 100,
        tags: event.tags ? event.tags.join(", ") : "",
        eventCategory: event.eventCategory || "general",
        published: event.published || false,
        registrationOpen: event.registrationOpen || true,
        image: event.image || "",
      });
    } catch (error) {
      console.error("Failed to fetch event:", error);
      alert("Failed to load event");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const submitData = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        capacity: parseInt(formData.capacity),
      };

      await axios.put(`${API_BASE_URL}/api/admin/events/${id}`, submitData, {
        headers: getAuthHeaders(),
      });

      alert("Event updated successfully!");
      navigate(`/admin/events/${id}`);
    } catch (error) {
      console.error("Failed to update event:", error);
      alert(
        "Failed to update event: " +
          (error.response?.data?.message || error.message),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingContainer>Loading event...</LoadingContainer>;
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate(`/admin/events/${id}`)}>
          <ArrowLeft size={20} />
          Back to Event Details
        </BackButton>
        <Title>Edit Event</Title>
      </Header>

      <Form onSubmit={handleSubmit}>
        <Section>
          <SectionTitle>Basic Information</SectionTitle>

          <FormGroup>
            <Label>Event Name *</Label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Google Cloud Study Jam"
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
              <Label>Category</Label>
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
            <Label>Description *</Label>
            <TextArea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              placeholder="Describe your event..."
            />
          </FormGroup>

          <FormGroup>
            <Label>Event Image URL</Label>
            <Input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
            {formData.image && (
              <ImagePreview>
                <img src={formData.image} alt="Preview" />
              </ImagePreview>
            )}
          </FormGroup>
        </Section>

        <Section>
          <SectionTitle>Event Details</SectionTitle>

          <FormRow>
            <FormGroup>
              <Label>Date *</Label>
              <Input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Time *</Label>
              <Input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label>Location *</Label>
            <Input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="e.g., Seminar Hall, MMMUT"
            />
          </FormGroup>

          <FormGroup>
            <Label>Capacity</Label>
            <Input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="1"
              placeholder="100"
            />
          </FormGroup>

          <FormGroup>
            <Label>Tags (comma-separated)</Label>
            <Input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., Cloud, AI, Machine Learning"
            />
          </FormGroup>
        </Section>

        <Section>
          <SectionTitle>Settings</SectionTitle>

          <CheckboxGroup>
            <Checkbox
              type="checkbox"
              name="published"
              checked={formData.published}
              onChange={handleChange}
            />
            <CheckboxLabel>
              <strong>Published</strong>
              <span>Event will be visible to users</span>
            </CheckboxLabel>
          </CheckboxGroup>

          <CheckboxGroup>
            <Checkbox
              type="checkbox"
              name="registrationOpen"
              checked={formData.registrationOpen}
              onChange={handleChange}
            />
            <CheckboxLabel>
              <strong>Registration Open</strong>
              <span>Users can register for this event</span>
            </CheckboxLabel>
          </CheckboxGroup>
        </Section>

        <ButtonGroup>
          <CancelButton
            type="button"
            onClick={() => navigate(`/admin/events/${id}`)}
          >
            <X size={18} />
            Cancel
          </CancelButton>
          <SaveButton type="submit" disabled={saving}>
            <Save size={18} />
            {saving ? "Saving..." : "Save Changes"}
          </SaveButton>
        </ButtonGroup>
      </Form>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 18px;
  color: #64748b;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s;

  &:hover {
    background: #f8fafc;
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

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;

  @media (max-width: 768px) {
    font-size: 24px;
  }

  .dark & {
    color: white;
  }
`;

const Form = styled.form`
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const Section = styled.div`
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid #f0f0f0;

  .dark & {
    border-color: #334155;
  }

  &:last-of-type {
    border-bottom: none;
  }
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;

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

  @media (max-width: 768px) {
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
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #4285f4;
  }

  @media (max-width: 480px) {
    font-size: 16px; /* Prevents iOS zoom */
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #4285f4;
  }

  @media (max-width: 480px) {
    font-size: 16px; /* Prevents iOS zoom */
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #4285f4;
  }

  @media (max-width: 480px) {
    font-size: 16px; /* Prevents iOS zoom */
  }
`;

const ImagePreview = styled.div`
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
  max-width: 400px;

  img {
    width: 100%;
    height: auto;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  margin-top: 2px;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;

  strong {
    font-size: 14px;
    color: #333;
  }

  span {
    font-size: 13px;
    color: #64748b;
  }

  .dark & span {
    color: #94a3b8;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
  }
`;

const CancelButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
  }

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #4285f4;
  border: 1px solid #4285f4;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #3367d6;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

export default EditEvent;

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../../utils/apiUtils";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  Tag,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEventDetails = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/events/${id}`,
        {
          headers: getAuthHeaders(),
        },
      );
      setEvent(response.data.event);
    } catch (error) {
      console.error("Failed to fetch event:", error);
      alert("Failed to load event details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchRegistrations = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/registrations?eventId=${id}`,
        {
          headers: getAuthHeaders(),
        },
      );
      setRegistrations(response.data.registrations || []);
    } catch (error) {
      console.error("Failed to fetch registrations:", error);
    }
  }, [id]);

  useEffect(() => {
    fetchEventDetails();
    fetchRegistrations();
  }, [fetchEventDetails, fetchRegistrations]);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${event.name}"?`)) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/admin/events/${id}`, {
        headers: getAuthHeaders(),
      });
      alert("Event deleted successfully");
      navigate("/admin/events");
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Failed to delete event");
    }
  };

  const handleTogglePublish = async () => {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/admin/events/${id}/publish`,
        {},
        { headers: getAuthHeaders() },
      );
      setEvent({ ...event, published: !event.published });
      alert(
        `Event ${!event.published ? "published" : "unpublished"} successfully`,
      );
    } catch (error) {
      console.error("Failed to toggle publish:", error);
      alert("Failed to update event status");
    }
  };

  if (loading) {
    return <LoadingContainer>Loading event details...</LoadingContainer>;
  }

  if (!event) {
    return <ErrorContainer>Event not found</ErrorContainer>;
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate("/admin/events")}>
          <ArrowLeft size={20} />
          Back to Events
        </BackButton>
        <ActionButtons>
          <ActionButton onClick={() => navigate(`/admin/events/${id}/edit`)}>
            <Edit size={18} />
            Edit
          </ActionButton>
          <ActionButton $primary onClick={handleTogglePublish}>
            {event.published ? (
              <XCircle size={18} />
            ) : (
              <CheckCircle size={18} />
            )}
            {event.published ? "Unpublish" : "Publish"}
          </ActionButton>
          <ActionButton $danger onClick={handleDelete}>
            <Trash2 size={18} />
            Delete
          </ActionButton>
        </ActionButtons>
      </Header>

      <ContentGrid>
        <MainContent>
          <EventCard>
            {event.image && (
              <EventImage>
                <img src={event.image} alt={event.name} />
              </EventImage>
            )}

            <EventContent>
              <TitleSection>
                <Title>{event.name}</Title>
                <StatusBadge $published={event.published}>
                  {event.published ? "Published" : "Draft"}
                </StatusBadge>
              </TitleSection>

              <TypeSection>
                <TypeBadge>{event.type}</TypeBadge>
                {event.eventCategory && event.eventCategory !== "general" && (
                  <CategoryBadge>{event.eventCategory}</CategoryBadge>
                )}
              </TypeSection>

              <Description>{event.description}</Description>

              <InfoGrid>
                <InfoItem>
                  <Calendar size={20} />
                  <InfoLabel>Date</InfoLabel>
                  <InfoValue>
                    {new Date(event.date).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </InfoValue>
                </InfoItem>

                <InfoItem>
                  <Clock size={20} />
                  <InfoLabel>Time</InfoLabel>
                  <InfoValue>{event.time}</InfoValue>
                </InfoItem>

                <InfoItem>
                  <MapPin size={20} />
                  <InfoLabel>Location</InfoLabel>
                  <InfoValue>{event.location}</InfoValue>
                </InfoItem>

                <InfoItem>
                  <Users size={20} />
                  <InfoLabel>Capacity</InfoLabel>
                  <InfoValue>
                    {event.registeredCount || 0} / {event.capacity}
                  </InfoValue>
                </InfoItem>
              </InfoGrid>

              {event.tags && event.tags.length > 0 && (
                <TagsSection>
                  <Tag size={16} />
                  <TagsLabel>Tags:</TagsLabel>
                  <TagsList>
                    {event.tags.map((tag, index) => (
                      <TagItem key={index}>{tag}</TagItem>
                    ))}
                  </TagsList>
                </TagsSection>
              )}
            </EventContent>
          </EventCard>
        </MainContent>

        <Sidebar>
          <StatsCard>
            <StatsTitle>Registration Stats</StatsTitle>
            <StatItem>
              <StatLabel>Total Registrations</StatLabel>
              <StatValue>{registrations.length}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Approved</StatLabel>
              <StatValue $color="#34a853">
                {registrations.filter((r) => r.status === "approved").length}
              </StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Pending</StatLabel>
              <StatValue $color="#fbbc04">
                {registrations.filter((r) => r.status === "pending").length}
              </StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Rejected</StatLabel>
              <StatValue $color="#ea4335">
                {registrations.filter((r) => r.status === "rejected").length}
              </StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Attended</StatLabel>
              <StatValue $color="#4285f4">
                {registrations.filter((r) => r.attended).length}
              </StatValue>
            </StatItem>
          </StatsCard>

          <QuickActionsCard>
            <StatsTitle>Quick Actions</StatsTitle>
            <QuickActionButton
              onClick={() => navigate("/admin/registrations?eventId=" + id)}
            >
              <Users size={18} />
              View Registrations
            </QuickActionButton>
            <QuickActionButton onClick={() => alert("Export coming soon!")}>
              <Download size={18} />
              Export Registrations
            </QuickActionButton>
          </QuickActionsCard>
        </Sidebar>
      </ContentGrid>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 18px;
  color: #64748b;
  font-weight: 500;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 18px;
  color: #ea4335;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
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
  transition: all 0.2s;

  &:hover {
    background: #f8fafc;
    color: #0f172a;
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

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;

  @media (max-width: 768px) {
    width: 100%;
    flex-wrap: wrap;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: ${(props) =>
    props.$danger ? "#fee" : props.$primary ? "#e3f2fd" : "white"};
  border: 1px solid
    ${(props) =>
      props.$danger ? "#ea4335" : props.$primary ? "#4285f4" : "#ddd"};
  color: ${(props) =>
    props.$danger ? "#ea4335" : props.$primary ? "#4285f4" : "#333"};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) =>
      props.$danger ? "#ea4335" : props.$primary ? "#4285f4" : "#f5f5f5"};
    color: ${(props) => (props.$danger || props.$primary ? "white" : "#333")};
  }

  @media (max-width: 768px) {
    flex: 1;
    justify-content: center;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MainContent = styled.div``;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const EventCard = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);

  .dark & {
    background: #1e293b;
    box-shadow: none;
    border: 1px solid #334155;
  }
`;

const EventImage = styled.div`
  width: 100%;
  height: 400px;
  height: 400px;
  background: #f1f5f9;

  .dark & {
    background: #0f172a;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 768px) {
    height: 250px;
  }
`;

const EventContent = styled.div`
  padding: 32px;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const TitleSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
  flex: 1;

  .dark & {
    color: white;
  }

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const StatusBadge = styled.div`
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  background: ${(props) => (props.$published ? "#34a853" : "#666")};
  color: white;
`;

const TypeSection = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

const TypeBadge = styled.div`
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: #4285f4;
  color: white;
`;

const CategoryBadge = styled.div`
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: #ea4335;
  color: white;
  text-transform: capitalize;
`;

const Description = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: #475569;

  .dark & {
    color: #cbd5e1;
  }
  margin-bottom: 32px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  svg {
    color: #4285f4;
  }
`;

const InfoLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #0f172a;

  .dark & {
    color: white;
  }
`;

const TagsSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;

  svg {
    color: #666;
  }
`;

const TagsLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #666;
`;

const TagsList = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const TagItem = styled.div`
  padding: 4px 12px;
  background: #f1f5f9;
  border-radius: 12px;
  font-size: 13px;
  color: #475569;

  .dark & {
    background: #0f172a;
    color: #94a3b8;
  }
`;

const StatsCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const StatsTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 20px;

  .dark & {
    color: white;
  }
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;

  .dark & {
    border-color: #334155;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #64748b;

  .dark & {
    color: #94a3b8;
  }
`;

const StatValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: ${(props) => props.$color || "#0f172a"};

  .dark & {
    color: ${(props) => props.$color || "white"};
  }
`;

const QuickActionsCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const QuickActionButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background: #f8fafc;
    border-color: #4285f4;
    color: #4285f4;
  }

  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;

    &:hover {
      background: #334155;
      color: #93c5fd;
      border-color: #60a5fa;
    }
  }
`;

export default EventDetails;

import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import {
  Search,
  Plus,
  Calendar,
  MapPin,
  Users,
  Eye,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../../utils/apiUtils";
import CreateEventModal from "./CreateEventModal";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterMode, setFilterMode] = useState("");
  const [filterPublished, setFilterPublished] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      console.log(
        "🔍 Fetching events from:",
        `${API_BASE_URL}/api/admin/events`,
      );
      console.log("📋 Params:", {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        type: filterType,
        mode: filterMode,
        published: filterPublished,
      });

      const response = await axios.get(`${API_BASE_URL}/api/admin/events`, {
        headers: getAuthHeaders(),
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm,
          type: filterType,
          mode: filterMode,
          published: filterPublished,
        },
      });

      console.log("✅ Response received:", response.data);
      console.log("📊 Events count:", response.data.events?.length);
      console.log("📈 Total from API:", response.data.pagination?.total);

      setEvents(response.data.events || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.pagination?.total || 0,
      }));
    } catch (error) {
      console.error("❌ Failed to fetch events:", error);
      console.error("Error details:", error.response?.data);
      console.error("Status code:", error.response?.status);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    searchTerm,
    filterType,
    filterMode,
    filterPublished,
  ]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleTogglePublish = async (eventId, currentStatus) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/admin/events/${eventId}/publish`,
        { publish: !currentStatus },
        { headers: getAuthHeaders() },
      );
      fetchEvents();
    } catch (error) {
      console.error("Failed to toggle publish:", error);
    }
  };

  const handleDuplicate = async (eventId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/admin/events/${eventId}/duplicate`,
        {},
        { headers: getAuthHeaders() },
      );
      fetchEvents();
    } catch (error) {
      console.error("Failed to duplicate event:", error);
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/admin/events/${eventId}`, {
        headers: getAuthHeaders(),
      });
      fetchEvents();
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const getEventTypeColor = (type) => {
    const colors = {
      workshop: "#4285f4",
      seminar: "#ea4335",
      hackathon: "#fbbc04",
      competition: "#34a853",
      meetup: "#9c27b0",
    };
    return colors[type] || "#666";
  };

  return (
    <Container>
      <Header>
        <div>
          <Title>Event Management</Title>
          <Subtitle>Manage all events, workshops, and hackathons</Subtitle>
        </div>
        <CreateButton onClick={() => setShowCreateModal(true)}>
          <Plus size={20} />
          Create Event
        </CreateButton>
      </Header>

      <FilterBar>
        <SearchBox>
          <Search size={20} />
          <input
            type="text"
            placeholder="Search events by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBox>

        <FilterGroup>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Workshop">Workshop</option>
            <option value="Study Jam">Study Jam</option>
            <option value="Hackathon">Hackathon</option>
            <option value="Meetup">Meetup</option>
            <option value="Conference">Conference</option>
            <option value="Webinar">Webinar</option>
            <option value="Tech Fest">Tech Fest</option>
          </Select>

          <Select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="general">General</option>
            <option value="study-jam">Study Jam</option>
            <option value="immerse">Immerse</option>
            <option value="hackblitz">HackBlitz</option>
          </Select>

          <Select
            value={filterPublished}
            onChange={(e) => setFilterPublished(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
          </Select>
        </FilterGroup>
      </FilterBar>

      {loading ? (
        <LoadingContainer>Loading events...</LoadingContainer>
      ) : (
        <>
          <EventsGrid>
            {events.map((event) => (
              <EventCard key={event._id}>
                <EventImage>
                  {event.image ? (
                    <img src={event.image} alt={event.name} />
                  ) : (
                    <PlaceholderImage>
                      <Calendar size={48} />
                    </PlaceholderImage>
                  )}
                  <PublishBadge $published={event.published}>
                    {event.published ? "Published" : "Draft"}
                  </PublishBadge>
                </EventImage>

                <EventContent>
                  <EventHeader>
                    <EventType $color={getEventTypeColor(event.type)}>
                      {event.type}
                    </EventType>
                    {event.eventCategory &&
                      event.eventCategory !== "general" && (
                        <EventMode>{event.eventCategory}</EventMode>
                      )}
                  </EventHeader>

                  <EventTitle>{event.name}</EventTitle>

                  <EventMeta>
                    <MetaItem>
                      <Calendar size={16} />
                      {new Date(event.date).toLocaleDateString()}{" "}
                      {event.time && `• ${event.time}`}
                    </MetaItem>
                    {event.location && (
                      <MetaItem>
                        <MapPin size={16} />
                        {event.location}
                      </MetaItem>
                    )}
                  </EventMeta>

                  <EventStats>
                    <StatItem>
                      <Users size={16} />
                      <span>
                        {event.stats?.totalRegistrations || 0} registered
                      </span>
                    </StatItem>
                    {event.capacity && (
                      <StatItem>
                        <span>
                          {event.stats?.capacityUsed || 0}% capacity (
                          {event.registeredCount || 0}/{event.capacity})
                        </span>
                      </StatItem>
                    )}
                  </EventStats>

                  <EventActions>
                    <ActionButton
                      onClick={() =>
                        (window.location.href = `/admin/events/${event._id}`)
                      }
                      title="View Event Details"
                    >
                      <Eye size={16} />
                    </ActionButton>
                    <ActionButton
                      onClick={() =>
                        (window.location.href = `/admin/events/${event._id}/edit`)
                      }
                      title="Edit Event"
                    >
                      <Edit size={16} />
                    </ActionButton>
                    <ActionButton
                      onClick={() => handleDuplicate(event._id)}
                      title="Duplicate Event"
                    >
                      <Copy size={16} />
                    </ActionButton>
                    <ActionButton
                      $primary={!event.published}
                      onClick={() =>
                        handleTogglePublish(event._id, event.published)
                      }
                      title={
                        event.published ? "Unpublish Event" : "Publish Event"
                      }
                    >
                      {event.published ? (
                        <XCircle size={16} />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                    </ActionButton>
                    <ActionButton
                      $danger
                      onClick={() => handleDelete(event._id)}
                      title="Delete Event"
                    >
                      <Trash2 size={16} />
                    </ActionButton>
                  </EventActions>
                </EventContent>
              </EventCard>
            ))}
          </EventsGrid>

          <Pagination>
            <PaginationInfo>
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} events
            </PaginationInfo>
            <PaginationButtons>
              <PageButton
                disabled={pagination.page === 1}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
              >
                Previous
              </PageButton>
              <PageButton
                disabled={
                  pagination.page * pagination.limit >= pagination.total
                }
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Next
              </PageButton>
            </PaginationButtons>
          </Pagination>
        </>
      )}

      <CreateEventModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchEvents}
      />
    </Container>
  );
};

const Container = styled.div`
  max-width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`;

const Title = styled.h1.attrs({
  className: "text-gray-900 dark:text-white",
})`
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const Subtitle = styled.p.attrs({
  className: "text-gray-500 dark:text-gray-400",
})`
  font-size: 15px;
  margin-top: 6px;
  max-width: 600px;
  line-height: 1.5;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #4285f4, #3b82f6);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px -1px rgba(59, 130, 246, 0.3);
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
`;

const SearchBox = styled.div`
  flex: 1;
  min-width: 300px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s;

  .dark & {
    background: #1e293b;
    border-color: #334155;
  }

  &:focus-within {
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  }

  svg {
    color: #94a3b8;
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
  transition: all 0.2s;

  &:focus {
    border-color: #4285f4;
  }

  .dark & {
    background: #1e293b;
    border-color: #334155;
    color: #e2e8f0;
  }

  @media (max-width: 768px) {
    flex: 1;
  }
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 64px;
  color: #64748b;
  font-weight: 500;
`;

const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
`;

const EventCard = styled.div.attrs({
  className: "bg-white dark:bg-gray-800",
})`
  border-radius: 20px;
  overflow: hidden;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;

  .dark & {
    border-color: rgba(255, 255, 255, 0.05);
  }

  &:hover {
    transform: translateY(-6px);
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
`;

const EventImage = styled.div`
  position: relative;
  height: 180px;
  background: #f1f5f9;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  ${EventCard}:hover & img {
    transform: scale(1.05);
  }
`;

const PlaceholderImage = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #94a3b8;

  .dark & {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    color: #475569;
  }
`;

const PublishBadge = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 6px 12px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  ${(props) =>
    props.$published
      ? `
    background: rgba(34, 197, 94, 0.9);
    color: white;
  `
      : `
    background: rgba(100, 116, 139, 0.9);
    color: white;
  `}
`;

const EventContent = styled.div`
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const EventHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const EventType = styled.span`
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(props) => `${props.$color}15`};
  color: ${(props) => props.$color};
  border: 1px solid ${(props) => `${props.$color}30`};
`;

const EventMode = styled.span.attrs({
  className: "text-gray-500 dark:text-gray-400",
})`
  font-size: 12px;
  text-transform: capitalize;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 6px;

  .dark & {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const EventTitle = styled.h3.attrs({
  className: "text-gray-900 dark:text-white",
})`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 50px; /* Fixed height for 2 lines */
`;

const EventMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const MetaItem = styled.div.attrs({
  className: "text-gray-600 dark:text-gray-400",
})`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;

  svg {
    color: #94a3b8;
  }
`;

const EventStats = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  margin-top: auto;

  .dark & {
    border-color: rgba(255, 255, 255, 0.05);
  }
`;

const StatItem = styled.div.attrs({
  className: "text-gray-600 dark:text-gray-400",
})`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;

  svg {
    color: #94a3b8;
  }
`;

const EventActions = styled.div`
  display: flex;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);

  .dark & {
    border-color: rgba(255, 255, 255, 0.05);
  }
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  ${(props) =>
    props.$danger
      ? `
    background: #fef2f2;
    border: 1px solid #fee2e2;
    color: #ef4444;
    .dark & { background: #450a0a; border-color: #7f1d1d; color: #fca5a5; }
    
    &:hover {
      background: #fee2e2;
      border-color: #fecaca;
      .dark & { background: #7f1d1d; }
    }
  `
      : props.$primary
        ? `
    background: #eff6ff;
    border: 1px solid #dbeafe;
    color: #3b82f6;
    .dark & { background: #172554; border-color: #1e3a8a; color: #93c5fd; }
    
    &:hover {
      background: #dbeafe;
      border-color: #bfdbfe;
      .dark & { background: #1e40af; }
    }
  `
        : `
    background: white;
    border: 1px solid #e2e8f0;
    color: #64748b;
    .dark & { background: #1e293b; border-color: #334155; color: #94a3b8; }
    
    &:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #0f172a;
      .dark & { background: #334155; color: #f1f5f9; }
    }
  `}
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;

  .dark & {
    background: #1e293b;
    border-color: #334155;
  }
`;

const PaginationInfo = styled.div`
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const PageButton = styled.button`
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f8fafc;
    color: #0f172a;
    border-color: #cbd5e1;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f1f5f9;
  }

  .dark & {
    background: #0f172a;
    border-color: #334155;
    color: #cbd5e1;

    &:hover:not(:disabled) {
      background: #1e293b;
      color: #f1f5f9;
    }

    &:disabled {
      background: #0f172a;
      opacity: 0.3;
    }
  }
`;

export default Events;

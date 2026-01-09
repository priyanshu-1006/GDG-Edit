import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Upload, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../../config/api'; // Assuming this is where apiClient is

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
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-height: 90vh;
  overflow-y: auto;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  &:hover {
    color: #111827;
  }
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
  font-family: 'Google Sans', sans-serif;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background-color: white;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
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

const Hint = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const IssueCertificateModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  
  const [formData, setFormData] = useState({
    userId: '',
    eventId: '',
    certificateUrl: ''
  });

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
      const [usersResponse, eventsResponse] = await Promise.all([
        api.get('/users?limit=100'), // Get first 100 users for now
        api.get('/events?limit=100&upcoming=false') // Get past events mostly
      ]);

      // Handle different API response structures if needed
      setUsers(usersResponse.data.users || []);
      setEvents(eventsResponse.data.events || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load users or events');
    } finally {
      setFetchingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.eventId || !formData.certificateUrl) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/certificates', formData);
      toast.success('Certificate issued successfully');
      setFormData({ userId: '', eventId: '', certificateUrl: '' }); // Reset form
      onSuccess(); // Refresh parent list
      onClose();   // Close modal
    } catch (error) {
      console.error('Error issuing certificate:', error);
      toast.error(error.response?.data?.message || 'Failed to issue certificate');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <X size={24} />
        </CloseButton>
        <Title>Issue New Certificate</Title>

        {fetchingData ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading data...</div>
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
                {events.map(event => (
                    <option key={event._id} value={event._id}>
                    {event.name} ({new Date(event.date).toLocaleDateString()})
                    </option>
                ))}
                </Select>
            </FormGroup>

            <FormGroup>
                <Label>Recipient (User)</Label>
                <Select 
                name="userId" 
                value={formData.userId} 
                onChange={handleChange}
                required
                >
                <option value="">Select a User</option>
                {users.map(user => (
                    <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                    </option>
                ))}
                </Select>
                <Hint>Only showing first 100 users. Use search in future versions.</Hint>
            </FormGroup>

            <FormGroup>
                <Label>Certificate URL</Label>
                <Input
                type="url"
                name="certificateUrl"
                value={formData.certificateUrl}
                onChange={handleChange}
                placeholder="https://example.com/certificate.pdf"
                required
                />
                <Hint>Link to the hosted certificate file (PDF/Image)</Hint>
            </FormGroup>

            <Button type="submit" disabled={loading}>
                {loading ? 'Issuing...' : (
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

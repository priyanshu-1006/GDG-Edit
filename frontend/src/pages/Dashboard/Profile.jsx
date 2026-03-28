import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useAuth } from '../../contexts/useAuth';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import CodingProfiles from '../../components/CodingProfiles';
import AddProfileModal from '../../components/AddProfileModal';
import { API_BASE_URL } from '../../config/api';

const Container = styled.div`
  animation: fadeIn 0.5s ease;
  color: ${({ theme }) => theme.colors.text.primary};

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 2rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1.1rem;
`;

const ProfileCard = styled.div`
  background: #1c1c1c;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  margin-bottom: 2rem;
`;

const ProfileHeader = styled.div`
  background: ${({ theme }) => theme.colors.background.tertiary};
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const AvatarSection = styled.div`
  position: relative;
`;

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.background.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.text.primary};
  border: 5px solid rgba(255, 255, 255, 0.08);
  background-image: ${props => props.$image ? `url(${props.$image})` : 'none'};
  background-size: cover;
  background-position: center;
`;

const EditAvatarButton = styled.button`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.background.primary};
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1.1rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const ProfileInfo = styled.div`
  flex: 1;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ProfileName = styled.h2`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
`;

const ProfileEmail = styled.div`
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 1rem;
`;

const ProfileBadges = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const Badge = styled.span`
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
`;

const ProfileBody = styled.div`
  padding: 2rem;
`;

const Section = styled.div`
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1.25rem;
  font-weight: 700;
`;

const EditButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${props => props.$editing ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  color: ${props => props.$editing ? '#f43f5e' : 'white'};
  border: ${props => props.$editing ? '2px solid #f43f5e' : 'none'};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const InfoIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1.2rem;
  flex-shrink: 0;
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoLabel = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  font-weight: 600;
`;

const InfoValue = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1rem;
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid ${props => props.$error ? '#f43f5e' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 8px;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.background.primary};
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);

  @media (max-width: 480px) {
    flex-direction: column;
    
    button {
      width: 100%;
    }
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${props => props.$variant === 'primary' 
    ? ({ theme }) => theme.colors.background.tertiary 
    : 'transparent'};
  color: ${props => props.$variant === 'primary' ? ({ theme }) => theme.colors.text.primary : ({ theme }) => theme.colors.text.secondary};
  border: ${props => props.$variant === 'primary' ? 'none' : '2px solid rgba(255,255,255,0.12)'};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(0,0,0,0.35);
  }
`;

const Profile = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    college: '',
    year: '',
    branch: ''
  });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        college: user.college || '',
        year: user.year || '',
        branch: user.branch || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Profile updated successfully!');
      setEditing(false);
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        college: user.college || '',
        year: user.year || '',
        branch: user.branch || ''
      });
    }
    setEditing(false);
  };

  const formatJoinDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <Container>
      <Header>
        <Title>My Profile 👤</Title>
        <Subtitle>Manage your personal information</Subtitle>
      </Header>

      <ProfileCard>
        <ProfileHeader>
          <AvatarSection>
            <Avatar $image={user?.profilePhoto}>
              {!user?.profilePhoto && (user?.name?.charAt(0).toUpperCase() || 'U')}
            </Avatar>
            <EditAvatarButton>
              <FiEdit2 />
            </EditAvatarButton>
          </AvatarSection>

          <ProfileInfo>
            <ProfileName>{user?.name || 'User Name'}</ProfileName>
            <ProfileEmail>{user?.email || 'user@example.com'}</ProfileEmail>
            <ProfileBadges>
              <Badge>🎓 Student</Badge>
              <Badge>Member since {formatJoinDate(user?.createdAt || new Date())}</Badge>
            </ProfileBadges>
          </ProfileInfo>
        </ProfileHeader>

        <ProfileBody>
          <Section>
            <SectionHeader>
              <SectionTitle>Personal Information</SectionTitle>
              {!editing ? (
                <EditButton onClick={() => setEditing(true)}>
                  <FiEdit2 />
                  Edit Profile
                </EditButton>
              ) : (
                <EditButton $editing onClick={handleCancel}>
                  <FiX />
                  Cancel
                </EditButton>
              )}
            </SectionHeader>

            <InfoGrid>
              <InfoItem>
                <InfoIcon><FiUser /></InfoIcon>
                <InfoContent>
                  <InfoLabel>Full Name</InfoLabel>
                  {editing ? (
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                    />
                  ) : (
                    <InfoValue>{user?.name || 'Not provided'}</InfoValue>
                  )}
                </InfoContent>
              </InfoItem>

              <InfoItem>
                <InfoIcon><FiMail /></InfoIcon>
                <InfoContent>
                  <InfoLabel>Email Address</InfoLabel>
                  <InfoValue>{user?.email || 'Not provided'}</InfoValue>
                </InfoContent>
              </InfoItem>

              <InfoItem>
                <InfoIcon><FiPhone /></InfoIcon>
                <InfoContent>
                  <InfoLabel>Phone Number</InfoLabel>
                  {editing ? (
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone"
                    />
                  ) : (
                    <InfoValue>{user?.phone || 'Not provided'}</InfoValue>
                  )}
                </InfoContent>
              </InfoItem>

              <InfoItem>
                <InfoIcon><FiMapPin /></InfoIcon>
                <InfoContent>
                  <InfoLabel>College</InfoLabel>
                  {editing ? (
                    <Input
                      type="text"
                      name="college"
                      value={formData.college}
                      onChange={handleChange}
                      placeholder="Enter your college"
                    />
                  ) : (
                    <InfoValue>{user?.college || 'Not provided'}</InfoValue>
                  )}
                </InfoContent>
              </InfoItem>

              <InfoItem>
                <InfoIcon><FiCalendar /></InfoIcon>
                <InfoContent>
                  <InfoLabel>Year</InfoLabel>
                  {editing ? (
                    <Input
                      type="text"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      placeholder="e.g., 2nd Year"
                    />
                  ) : (
                    <InfoValue>{user?.year || 'Not provided'}</InfoValue>
                  )}
                </InfoContent>
              </InfoItem>

              <InfoItem>
                <InfoIcon><FiUser /></InfoIcon>
                <InfoContent>
                  <InfoLabel>Branch</InfoLabel>
                  {editing ? (
                    <Input
                      type="text"
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      placeholder="e.g., Computer Science"
                    />
                  ) : (
                    <InfoValue>{user?.branch || 'Not provided'}</InfoValue>
                  )}
                </InfoContent>
              </InfoItem>
            </InfoGrid>

            {editing && (
              <Actions>
                <Button onClick={handleCancel}>
                  Cancel
                </Button>
                <Button $variant="primary" onClick={handleSave} disabled={loading}>
                  <FiSave />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Actions>
            )}
          </Section>
        </ProfileBody>
      </ProfileCard>

      {/* Coding Profiles Section */}
      <ProfileCard>
        <ProfileBody>
          <CodingProfiles 
            onAddProfile={() => setIsModalOpen(true)}
            onEditProfile={() => setIsModalOpen(true)}
          />
        </ProfileBody>
      </ProfileCard>

      {/* Add Profile Modal */}
      <AddProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Optionally refresh the page or update state
          window.location.reload();
        }}
      />
    </Container>
  );
};

export default Profile;

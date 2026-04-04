import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useAuth } from '../../contexts/useAuth';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiEdit2, FiSave, FiX, FiUpload } from 'react-icons/fi';
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
  background: ${({ theme }) => theme.colors.surfaceElevated};
  border: 1px solid ${({ theme }) => theme.colors.divider};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.colors.shadows.medium};
  margin-bottom: 2rem;
`;

const ProfileHeader = styled.div`
  background: ${({ theme }) => theme.colors.background.tertiary};
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    padding: 1.25rem;
    flex-direction: column;
    text-align: center;
  }
`;

const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
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
  border: 5px solid ${({ theme }) => theme.colors.divider};
  background-image: ${props => props.$image ? `url(${props.$image})` : 'none'};
  background-size: cover;
  background-position: center;
`;

const AvatarActionButton = styled.button`
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  font-size: 0.9rem;
  font-weight: 600;
  transition: transform 0.2s ease, opacity 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const ProfileInfo = styled.div`
  flex: 1;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ProfileName = styled.h2`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  font-weight: 700;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
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

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const Badge = styled.span`
  padding: 0.5rem 1rem;
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.divider};
  color: ${({ theme }) => theme.colors.text.primary};
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
`;

const InductionStatusCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.divider};
  background: ${({ theme }) => theme.colors.background.secondary};
  border-radius: 12px;
  padding: 1rem;
`;

const InductionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
`;

const InductionPill = styled.span`
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ $tone }) =>
    $tone === 'good' ? '#86efac' : $tone === 'bad' ? '#fda4af' : '#93c5fd'};
  background: ${({ $tone }) =>
    $tone === 'good'
      ? 'rgba(22, 163, 74, 0.2)'
      : $tone === 'bad'
        ? 'rgba(225, 29, 72, 0.2)'
        : 'rgba(30, 64, 175, 0.3)'};
`;

const InductionMetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.85rem;
`;

const InductionMetaItem = styled.div`
  background: ${({ theme }) => theme.colors.background.tertiary};
  border: 1px solid ${({ theme }) => theme.colors.divider};
  border-radius: 10px;
  padding: 0.7rem;
`;

const InductionNote = styled.p`
  margin: 0.85rem 0 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.92rem;
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

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 0.75rem;
  }
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
  background: ${({ theme }) => theme.colors.background.tertiary};
  border: 1px solid ${({ theme }) => theme.colors.divider};
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
  border: 2px solid ${({ theme, $error }) => ($error ? '#f43f5e' : theme.colors.border)};
  border-radius: 8px;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.background.secondary};
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const YearSelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.background.secondary};
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
  border-top: 1px solid ${({ theme }) => theme.colors.divider};

  @media (max-width: 480px) {
    flex-direction: column;
    
    button {
      width: 100%;
    }
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${({ theme, $variant }) =>
    $variant === 'primary' ? theme.colors.primary : 'transparent'};
  color: ${({ theme, $variant }) =>
    $variant === 'primary' ? theme.colors.text.inverse : theme.colors.text.secondary};
  border: ${({ theme, $variant }) =>
    $variant === 'primary' ? 'none' : `2px solid ${theme.colors.divider}`};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.colors.shadows.medium};
  }
`;

const Profile = () => {
  const { user } = useAuth();
  const induction = user?.induction;
  const photoInputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    college: '',
    year: '',
    branch: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        college: user.college || '',
        year: user.year ? String(user.year) : '',
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

      const payload = { ...formData };
      if (payload.year === '') {
        delete payload.year;
      } else {
        payload.year = Number(payload.year);
      }

      await axios.put(
        `${API_BASE_URL}/api/auth/profile`,
        payload,
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
        year: user.year ? String(user.year) : '',
        branch: user.branch || ''
      });
    }
    setEditing(false);
  };

  const formatYear = (year) => {
    if (!year) return 'Not provided';
    if (year === 1) return '1st Year';
    if (year === 2) return '2nd Year';
    if (year === 3) return '3rd Year';
    return `${year}th Year`;
  };

  const formatJoinDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInductionTone = (status) => {
    if (status === 'selected') return 'good';
    if (status === 'rejected') return 'bad';
    return 'info';
  };

  const triggerPhotoPicker = () => {
    photoInputRef.current?.click();
  };

  const handlePhotoUpload = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      event.target.value = '';
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('Image size must be 5MB or smaller.');
      event.target.value = '';
      return;
    }

    try {
      setUploadingPhoto(true);
      const token = localStorage.getItem('token');
      const uploadData = new FormData();
      uploadData.append('photo', selectedFile);

      await axios.post(
        `${API_BASE_URL}/api/auth/profile/photo`,
        uploadData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      alert('Profile photo updated successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      alert('Failed to upload profile photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
      event.target.value = '';
    }
  };

  return (
    <Container>
      <Header>
        <Title>My Profile</Title>
        <Subtitle>Manage your personal information</Subtitle>
      </Header>

      <ProfileCard>
        <ProfileHeader>
          <AvatarSection>
            <Avatar $image={user?.profilePhoto}>
              {!user?.profilePhoto && (user?.name?.charAt(0).toUpperCase() || 'U')}
            </Avatar>
            <AvatarActionButton type="button" onClick={triggerPhotoPicker} disabled={uploadingPhoto}>
              <FiUpload />
              {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
            </AvatarActionButton>
            <HiddenFileInput
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
            />
          </AvatarSection>

          <ProfileInfo>
            <ProfileName>{user?.name || 'User Name'}</ProfileName>
            <ProfileEmail>{user?.email || 'user@example.com'}</ProfileEmail>
            <ProfileBadges>
              <Badge>Student</Badge>
              <Badge>Member since {formatJoinDate(user?.createdAt || new Date())}</Badge>
              {user?.role === 'student' && induction?.statusLabel && (
                <Badge>Induction: {induction.statusLabel}</Badge>
              )}
            </ProfileBadges>
          </ProfileInfo>
        </ProfileHeader>

        <ProfileBody>
          {user?.role === 'student' && (
            <Section>
              <SectionHeader>
                <SectionTitle>Induction Status</SectionTitle>
              </SectionHeader>

              <InductionStatusCard>
                <InductionHeader>
                  <InfoValue>
                    {induction?.hasSubmitted ? induction.roundLabel : 'No induction application yet'}
                  </InfoValue>
                  <InductionPill $tone={getInductionTone(induction?.status)}>
                    {induction?.statusLabel || 'Not Applied Yet'}
                  </InductionPill>
                </InductionHeader>

                <InductionMetaGrid>
                  <InductionMetaItem>
                    <InfoLabel>Current Round</InfoLabel>
                    <InfoValue>{induction?.roundLabel || 'No Active Round'}</InfoValue>
                  </InductionMetaItem>
                  <InductionMetaItem>
                    <InfoLabel>Submitted At</InfoLabel>
                    <InfoValue>{formatDateTime(induction?.submittedAt)}</InfoValue>
                  </InductionMetaItem>
                  <InductionMetaItem>
                    <InfoLabel>Last Updated</InfoLabel>
                    <InfoValue>{formatDateTime(induction?.updatedAt)}</InfoValue>
                  </InductionMetaItem>
                  <InductionMetaItem>
                    <InfoLabel>PI Window</InfoLabel>
                    <InfoValue>
                      {induction?.activePiRound
                        ? `${induction.activePiRound === 'shortlisted_offline' ? 'Offline PI' : 'Online PI'} (${induction.isPiStarted ? 'Started' : 'Not Started'})`
                        : 'Not announced'}
                    </InfoValue>
                  </InductionMetaItem>
                </InductionMetaGrid>

                {!induction?.hasSubmitted && (
                  <InductionNote>
                    You have not submitted your induction form yet. Complete it to enter the induction rounds.
                  </InductionNote>
                )}
              </InductionStatusCard>
            </Section>
          )}

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
                    <YearSelect
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="5">5th Year</option>
                    </YearSelect>
                  ) : (
                    <InfoValue>{formatYear(user?.year)}</InfoValue>
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

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { FiDownload, FiAward, FiShare2 } from 'react-icons/fi';
import { API_BASE_URL } from '../../config/api';

const Container = styled.div`
  animation: fadeIn 0.5s ease;

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

const StatsBar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.surfaceElevated};
  border: 1px solid ${({ theme }) => theme.colors.divider};
  box-shadow: ${({ theme }) => theme.colors.shadows.small};
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.95rem;
`;

const CertificatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.25rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const CertificateCard = styled.div`
  background: ${({ theme }) => theme.colors.surfaceElevated};
  border: 1px solid ${({ theme }) => theme.colors.divider};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.colors.shadows.medium};
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const CertificateBanner = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  text-align: center;
  color: white;
  position: relative;
`;

const CertificateIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 0.5rem;
`;

const CertificateName = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const CertificateEventName = styled.div`
  font-size: 1rem;
  opacity: 0.9;
`;

const CertificateContent = styled.div`
  padding: 1.5rem;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const InfoItem = styled.div``;

const InfoLabel = styled.div`
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
`;

const InfoValue = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
  font-size: 0.95rem;
`;

const VerifiedText = styled(InfoValue)`
  color: ${({ theme }) => theme.colors.success};
`;

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const Button = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: ${({ theme, $variant }) =>
    $variant === 'primary' ? theme.colors.primary : 'transparent'};
  color: ${({ theme, $variant }) =>
    $variant === 'primary' ? theme.colors.text.inverse : theme.colors.primary};
  border: ${({ theme, $variant }) =>
    $variant === 'primary' ? 'none' : `2px solid ${theme.colors.primary}`};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  background: ${({ theme }) => theme.colors.surfaceElevated};
  border: 1px solid ${({ theme }) => theme.colors.divider};
  border-radius: 16px;
`;

const EmptyIcon = styled(FiAward)`
  font-size: 3.5rem;
  color: ${({ theme }) => theme.colors.text.tertiary};
  margin-bottom: 1rem;
`;

const EmptyText = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
`;

const EmptySubtext = styled.p`
  color: ${({ theme }) => theme.colors.text.tertiary};
  font-size: 0.95rem;
`;

const LoadingSpinner = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  
  &::after {
    content: '';
    width: 50px;
    height: 50px;
    border: 5px solid ${({ theme }) => theme.colors.divider};
    border-top-color: ${({ theme }) => theme.colors.primary};
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    thisYear: 0
  });

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get(
        `${API_BASE_URL}/api/certificates/user`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const certs = response.data || [];
      setCertificates(certs);

      // Calculate stats
      const now = new Date();
      const thisMonth = certs.filter(cert => {
        const certDate = new Date(cert.issuedDate);
        return certDate.getMonth() === now.getMonth() && 
               certDate.getFullYear() === now.getFullYear();
      }).length;

      const thisYear = certs.filter(cert => {
        const certDate = new Date(cert.issuedDate);
        return certDate.getFullYear() === now.getFullYear();
      }).length;

      setStats({
        total: certs.length,
        thisMonth,
        thisYear
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleDownload = async (certificateId) => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.get(
        `${API_BASE_URL}/api/certificates/${certificateId}/download`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate. Please try again.');
    }
  };

  const handleShare = (certificate) => {
    const shareUrl = `${window.location.origin}/certificates/${certificate.certificateId}`;
    
    if (navigator.share) {
      navigator.share({
        title: `My ${certificate.eventName} Certificate`,
        text: `Check out my certificate from ${certificate.eventName}!`,
        url: shareUrl,
      }).catch(console.error);
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('Certificate link copied to clipboard!');
    }
  };

  return (
    <Container>
      <Header>
        <Title>My Certificates</Title>
        <Subtitle>Your achievements and earned certificates</Subtitle>
      </Header>

      {!loading && (
        <StatsBar>
          <StatCard>
            <StatValue>{stats.total}</StatValue>
            <StatLabel>Total Certificates</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.thisMonth}</StatValue>
            <StatLabel>This Month</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.thisYear}</StatValue>
            <StatLabel>This Year</StatLabel>
          </StatCard>
        </StatsBar>
      )}

      <CertificatesGrid>
        {loading ? (
          <LoadingSpinner />
        ) : certificates.length > 0 ? (
          certificates.map((certificate) => (
            <CertificateCard key={certificate._id}>
              <CertificateBanner>
                <CertificateIcon>
                  <FiAward />
                </CertificateIcon>
                <CertificateName>Certificate of Achievement</CertificateName>
                <CertificateEventName>{certificate.eventName}</CertificateEventName>
              </CertificateBanner>
              
              <CertificateContent>
                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>Certificate ID</InfoLabel>
                    <InfoValue>{certificate.certificateId}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Issued Date</InfoLabel>
                    <InfoValue>{formatDate(certificate.issuedDate)}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Recipient</InfoLabel>
                    <InfoValue>{certificate.userId?.name || 'You'}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Status</InfoLabel>
                    <VerifiedText>Verified</VerifiedText>
                  </InfoItem>
                </InfoGrid>

                <Actions>
                  <Button 
                    $variant="primary"
                    onClick={() => handleDownload(certificate._id)}
                  >
                    <FiDownload />
                    Download
                  </Button>
                  <Button onClick={() => handleShare(certificate)}>
                    <FiShare2 />
                    Share
                  </Button>
                </Actions>
              </CertificateContent>
            </CertificateCard>
          ))
        ) : (
          <EmptyState>
            <EmptyIcon />
            <EmptyText>No certificates yet</EmptyText>
            <EmptySubtext>
              Complete events to earn certificates and showcase your achievements!
            </EmptySubtext>
          </EmptyState>
        )}
      </CertificatesGrid>
    </Container>
  );
};

export default Certificates;

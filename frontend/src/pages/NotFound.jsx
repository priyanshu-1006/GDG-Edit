import styled from "styled-components";
import { Link } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";

const NotFound = () => {
  return (
    <Container>
      <Content>
        <IconWrapper>
          <AlertTriangle size={64} color="#ea4335" />
        </IconWrapper>
        <Title>404</Title>
        <Subtitle>Page Not Found</Subtitle>
        <Description>
          The page you are looking for doesn't exist or has been moved.
        </Description>
        <HomeButton to="/">
          <Home size={20} />
          Back to Home
        </HomeButton>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.background};
  font-family: "Google Sans", sans-serif;
  text-align: center;
  padding: 24px;
`;

const Content = styled.div`
  max-width: 400px;
  width: 100%;
`;

const IconWrapper = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 72px;
  font-weight: 800;
  color: ${({ theme }) => theme.text};
  margin: 0;
  line-height: 1;
`;

const Subtitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin: 16px 0;
`;

const Description = styled.p`
  color: ${({ theme }) => theme.textSecondary || "#666"};
  margin-bottom: 32px;
  line-height: 1.5;
`;

const HomeButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background-color: #4285f4;
  color: white;
  text-decoration: none;
  border-radius: 50px;
  font-weight: 600;
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
  }
`;

export default NotFound;

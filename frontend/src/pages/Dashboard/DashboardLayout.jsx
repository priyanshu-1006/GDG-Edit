import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import {
  FiHome,
  FiCalendar,
  FiAward,
  FiUsers,
  FiBookOpen,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiBell,
  FiMoon,
  FiSun,
} from 'react-icons/fi';

const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background.primary};
`;

const Sidebar = styled.aside`
  width: ${props => props.$isOpen ? '280px' : '0'};
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  transition: width 0.3s ease;
  z-index: 1000;
  box-shadow: ${({ theme }) => theme.colors.shadows.medium};

  @media (max-width: 1024px) {
    width: ${props => props.$isOpen ? '280px' : '0'};
  }

  @media (max-width: 768px) {
    width: ${props => props.$isOpen ? '100%' : '0'};
    max-width: 100vw;
  }

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background.tertiary};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.divider};
    border-radius: 3px;
  }
`;

const SidebarHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.divider};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: bold;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  white-space: nowrap;
  line-height: 1;
  
  span {
    display: inline-block;
  }

  @media (max-width: 768px) {
    span {
      display: none; /* hide text beside logo on mobile */
    }
  }
`;

const LogoImage = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
  display: block;
  
  @media (max-width: 768px) {
    width: 40px; /* increased size */
    height: 40px;
  }
`;

const CloseButton = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.secondary};
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const Nav = styled.nav`
  padding: 1rem 0;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;

  &:hover {
    background: ${({ theme }) => theme.colors.background.tertiary};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  &.active {
    background: ${({ theme }) => theme.colors.background.tertiary};
    color: ${({ theme }) => theme.colors.text.primary};
    border-left-color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
  }

  svg {
    font-size: 1.25rem;
  }
`;

const UserSection = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.divider};
  background: ${({ theme }) => theme.colors.background.tertiary};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border: 1px solid ${({ theme }) => theme.colors.divider};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: bold;
  font-size: 1.1rem;
  overflow: hidden;
  background-image: ${props => props.$image ? `url(${props.$image})` : 'none'};
  background-size: cover;
  background-position: center;
`;

const UserDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserEmail = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LogoutButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.background.tertiary};
  color: ${({ theme }) => theme.colors.text.primary};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 600;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
  }
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: ${props => props.$sidebarOpen ? '280px' : '0'};
  transition: margin-left 0.3s ease;
  min-height: 100vh;
  
  @media (max-width: 1024px) {
    margin-left: 0;
  }
`;

const TopBar = styled.div`
  background: ${({ theme }) => theme.colors.background.secondary};
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: ${({ theme }) => theme.colors.shadows.small};
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid ${({ theme }) => theme.colors.divider};
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.background.tertiary};
  }
`;

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const NotificationButton = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.secondary};
  position: relative;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.background.tertiary};
  }
`;

const ThemeToggleButton = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: 0.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease, color 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.background.tertiary};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: 5px;
  right: 5px;
  background: #f43f5e;
  color: white;
  font-size: 0.65rem;
  padding: 0.15rem 0.35rem;
  border-radius: 10px;
  font-weight: bold;
`;

const ContentArea = styled.div`
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;

  @media (max-width: 1024px) {
    padding: 1.5rem;
  }

  @media (max-width: 768px) {
    padding: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const { user, logout } = useAuth();
  const { isDarkTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: FiHome, exact: true },
    { path: '/dashboard/events', label: 'My Events', icon: FiCalendar },
    { path: '/dashboard/study-jams', label: 'Study Jams', icon: FiBookOpen },
    { path: '/dashboard/teams', label: 'My Teams', icon: FiUsers },
    { path: '/dashboard/certificates', label: 'Certificates', icon: FiAward },
    { path: '/dashboard/profile', label: 'Profile', icon: FiUser },
  ];

  return (
    <DashboardContainer>
      <Sidebar $isOpen={sidebarOpen}>
        <SidebarHeader>
          <Logo onClick={() => navigate('/')}> 
            <LogoImage src="https://res.cloudinary.com/startup-grind/image/upload/c_fill,dpr_2.0,f_auto,g_center,h_900,q_auto:good,w_1200/v1/gcs/platform-data-goog/contentbuilder/GDG_Bevy_SocialSharingThumbnail_KFxxrrs.png" alt="GDG Logo" />
            <span>GDG MMMUT</span>
          </Logo>
          <CloseButton onClick={toggleSidebar}>
            <FiX />
          </CloseButton>
        </SidebarHeader>

        <Nav>
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={() => window.innerWidth <= 768 && setSidebarOpen(false)}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavItem>
          ))}
        </Nav>

        <UserSection>
          <UserInfo>
            <Avatar $image={user?.profilePhoto}>
              {!user?.profilePhoto && (user?.name?.charAt(0).toUpperCase() || 'U')}
            </Avatar>
            <UserDetails>
              <UserName>{user?.name || 'User'}</UserName>
              <UserEmail>{user?.email || 'user@example.com'}</UserEmail>
            </UserDetails>
          </UserInfo>
          <LogoutButton onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </LogoutButton>
        </UserSection>
      </Sidebar>

      <MainContent $sidebarOpen={sidebarOpen}>
        <TopBar>
          <MenuButton onClick={toggleSidebar}>
            <FiMenu />
          </MenuButton>
          <TopBarRight>
            <ThemeToggleButton
              onClick={toggleTheme}
              aria-label={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkTheme ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkTheme ? <FiSun /> : <FiMoon />}
            </ThemeToggleButton>
            <NotificationButton>
              <FiBell />
              <NotificationBadge>3</NotificationBadge>
            </NotificationButton>
          </TopBarRight>
        </TopBar>

        <ContentArea>
          <Outlet />
        </ContentArea>
      </MainContent>
    </DashboardContainer>
  );
};

export default DashboardLayout;

import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Mail, 
  Users, 
  Building2, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Send,
  History,
  ClipboardList,
  Rocket
} from 'lucide-react';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: #0f172a;
`;

const Sidebar = styled(motion.aside)`
  width: 280px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 100;
  
  @media (max-width: 1024px) {
    transform: ${({ $isOpen }) => $isOpen ? 'translateX(0)' : 'translateX(-100%)'};
    transition: transform 0.3s ease;
  }
`;

const SidebarHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LogoIcon = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #4f46e5 0%, #ec4899 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 800;
  color: white;
`;

const LogoText = styled.div`
  h1 {
    font-size: 24px;
    font-weight: 700;
    color: white;
    margin: 0;
    background: linear-gradient(135deg, #4f46e5 0%, #ec4899 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  span {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }
`;

const Nav = styled.nav`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
`;

const NavSection = styled.div`
  margin-bottom: 24px;
`;

const NavSectionTitle = styled.h3`
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 0 12px;
  margin-bottom: 8px;
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-bottom: 4px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }
  
  &.active {
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%);
    color: white;
    border: 1px solid rgba(79, 70, 229, 0.3);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const SidebarFooter = styled.div`
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  margin-bottom: 12px;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  font-size: 16px;
`;

const UserDetails = styled.div`
  flex: 1;
  overflow: hidden;
  
  h4 {
    color: white;
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  span {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 10px;
  color: #f87171;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(239, 68, 68, 0.2);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 280px;
  min-height: 100vh;
  
  @media (max-width: 1024px) {
    margin-left: 0;
  }
`;

const TopBar = styled.header`
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 50;
`;

const MenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  
  @media (max-width: 1024px) {
    display: block;
  }
`;

const PageTitle = styled.h2`
  color: white;
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`;

const ContentArea = styled.div`
  padding: 24px;
`;

const Overlay = styled(motion.div)`
  display: none;
  
  @media (max-width: 1024px) {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 90;
  }
`;

const pageTitles = {
  '/immerse/dashboard': 'Dashboard',
  '/immerse/compose': 'Compose Email',
  '/immerse/contacts': 'Contacts',
  '/immerse/companies': 'Companies',
  '/immerse/students': 'Students',
  '/immerse/templates': 'Email Templates',
  '/immerse/logs': 'Email Logs',
  '/immerse/analytics': 'Analytics',
  '/immerse/settings': 'Settings'
};

const ImmerseLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const storedAdmin = localStorage.getItem('immerseAdmin');
    const token = localStorage.getItem('immerseToken');
    
    if (!token || !storedAdmin) {
      navigate('/immerse/login');
      return;
    }
    
    setAdmin(JSON.parse(storedAdmin));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('immerseToken');
    localStorage.removeItem('immerseAdmin');
    navigate('/immerse/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const currentPageTitle = pageTitles[location.pathname] || 'Immerse';

  return (
    <LayoutContainer>
      <AnimatePresence>
        {sidebarOpen && (
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>
      
      <Sidebar $isOpen={sidebarOpen}>
        <SidebarHeader>
          <Logo>
            <LogoIcon>I</LogoIcon>
            <LogoText>
              <h1>IMMERSE</h1>
              <span>Mail System</span>
            </LogoText>
          </Logo>
        </SidebarHeader>
        
        <Nav>
          <NavSection>
            <NavSectionTitle>Overview</NavSectionTitle>
            <StyledNavLink to="/immerse/dashboard" onClick={closeSidebar}>
              <LayoutDashboard /> Dashboard
            </StyledNavLink>
            <StyledNavLink to="/immerse/analytics" onClick={closeSidebar}>
              <BarChart3 /> Analytics
            </StyledNavLink>
          </NavSection>
          
          <NavSection>
            <NavSectionTitle>Email</NavSectionTitle>
            <StyledNavLink to="/immerse/compose" onClick={closeSidebar}>
              <Send /> Compose
            </StyledNavLink>
            <StyledNavLink to="/immerse/templates" onClick={closeSidebar}>
              <FileText /> Templates
            </StyledNavLink>
            <StyledNavLink to="/immerse/logs" onClick={closeSidebar}>
              <History /> Email Logs
            </StyledNavLink>
          </NavSection>
          
          <NavSection>
            <NavSectionTitle>Events</NavSectionTitle>
            <StyledNavLink to="/immerse/registrations" onClick={closeSidebar}>
              <ClipboardList /> Registrations
            </StyledNavLink>
            <StyledNavLink to="/immerse-2026" target="_blank" onClick={closeSidebar}>
              <Rocket /> View Public Page
            </StyledNavLink>
          </NavSection>
          
          <NavSection>
            <NavSectionTitle>Contacts</NavSectionTitle>
            <StyledNavLink to="/immerse/contacts" onClick={closeSidebar}>
              <Users /> All Contacts
            </StyledNavLink>
            <StyledNavLink to="/immerse/companies" onClick={closeSidebar}>
              <Building2 /> Companies
            </StyledNavLink>
            <StyledNavLink to="/immerse/students" onClick={closeSidebar}>
              <Users /> Students
            </StyledNavLink>
          </NavSection>
          
          <NavSection>
            <NavSectionTitle>System</NavSectionTitle>
            <StyledNavLink to="/immerse/settings" onClick={closeSidebar}>
              <Settings /> Settings
            </StyledNavLink>
          </NavSection>
        </Nav>
        
        <SidebarFooter>
          <UserInfo>
            <UserAvatar>
              {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
            </UserAvatar>
            <UserDetails>
              <h4>{admin?.name || 'Admin'}</h4>
              <span>{admin?.role === 'immerse_super_admin' ? 'Super Admin' : 'Admin'}</span>
            </UserDetails>
          </UserInfo>
          <LogoutButton onClick={handleLogout}>
            <LogOut /> Sign Out
          </LogoutButton>
        </SidebarFooter>
      </Sidebar>
      
      <MainContent>
        <TopBar>
          <MenuButton onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </MenuButton>
          <PageTitle>{currentPageTitle}</PageTitle>
          <div />
        </TopBar>
        
        <ContentArea>
          <Outlet />
        </ContentArea>
      </MainContent>
    </LayoutContainer>
  );
};

export default ImmerseLayout;

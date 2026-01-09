import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardList,
  Bell,
  Award,
  Users2,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import ThemeToggle from '../../components/ThemeToggle';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/events', icon: Calendar, label: 'Events' },
    { path: '/admin/registrations', icon: ClipboardList, label: 'Registrations' },
    { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { path: '/admin/certificates', icon: Award, label: 'Certificates' },
    { path: '/admin/teams', icon: Users2, label: 'Teams' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Container>
      <Sidebar $open={sidebarOpen}>
        <SidebarHeader>
          <Logo>GDG Admin</Logo>
          <CloseButton onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </CloseButton>
        </SidebarHeader>

        <NavMenu>
          {menuItems.map((item) => (
            <NavItem
              key={item.path}
              to={item.path}
              end={item.exact}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavItem>
          ))}
        </NavMenu>
      </Sidebar>

      <MainContent $sidebarOpen={sidebarOpen}>
        <TopBar>
          <TopBarLeft>
            <MenuButton onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} />
            </MenuButton>
            <PageTitle>Admin Portal</PageTitle>
          </TopBarLeft>

          <TopBarRight>
            <div className="mr-2">
               <ThemeToggle />
            </div>
            <UserMenu>
              <UserButton onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <UserInfo>
                  <UserName>{user?.name}</UserName>
                  <UserRole>{user?.role?.replace('_', ' ')}</UserRole>
                </UserInfo>
                <ChevronDown size={20} />
              </UserButton>

              {userMenuOpen && (
                <DropdownMenu>
                  <DropdownItem onClick={() => navigate('/dashboard/profile')}>
                    Profile
                  </DropdownItem>
                  <DropdownItem onClick={handleLogout}>
                    <LogOut size={16} />
                    Logout
                  </DropdownItem>
                </DropdownMenu>
              )}
            </UserMenu>
          </TopBarRight>
        </TopBar>

        <Content>
          <Outlet />
        </Content>
      </MainContent>
    </Container>
  );
};

const Container = styled.div.attrs({
  className: 'bg-gray-100 dark:bg-gray-900 transition-colors duration-200 text-gray-900 dark:text-gray-100'
})`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled.aside`
  width: 260px;
  background: #1a1a1a;
  color: white;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  transform: ${props => props.$open ? 'translateX(0)' : 'translateX(-100%)'};
  transition: transform 0.3s ease;
  z-index: 1000;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Logo = styled.h1`
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(135deg, #4285f4, #ea4335, #fbbc04, #34a853);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

const NavMenu = styled.nav`
  padding: 20px 0;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  &.active {
    background: linear-gradient(90deg, #4285f4, #ea4335);
    color: white;
  }

  svg {
    flex-shrink: 0;
  }
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: ${props => props.$sidebarOpen ? '260px' : '0'};
  transition: margin-left 0.3s ease;

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const TopBar = styled.header.attrs({
  className: 'bg-white dark:bg-gray-800 transition-colors duration-200'
})`
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const MenuButton = styled.button.attrs({
  className: 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
})`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
`;

const PageTitle = styled.h2.attrs({
  className: 'text-gray-800 dark:text-white'
})`
  font-size: 20px;
  font-weight: 600;
`;

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const UserMenu = styled.div`
  position: relative;
`;

const UserButton = styled.button.attrs({
  className: 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
})`
  display: flex;
  align-items: center;
  gap: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
`;

const UserInfo = styled.div`
  text-align: right;
`;

const UserName = styled.div.attrs({
  className: 'text-gray-800 dark:text-white'
})`
  font-weight: 600;
  font-size: 14px;
`;

const UserRole = styled.div.attrs({
  className: 'text-gray-600 dark:text-gray-400'
})`
  font-size: 12px;
  text-transform: capitalize;
`;

const DropdownMenu = styled.div.attrs({
  className: 'bg-white dark:bg-gray-800 dark:border dark:border-gray-700'
})`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  overflow: hidden;
`;

const DropdownItem = styled.button.attrs({
  className: 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
})`
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Content = styled.div`
  padding: 24px;
`;

export default AdminLayout;

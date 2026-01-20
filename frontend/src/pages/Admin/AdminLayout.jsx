import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import styled from "styled-components";
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
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../../contexts/useAuth";
import ThemeToggle from "../../components/ThemeToggle";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
    { path: "/admin/users", icon: Users, label: "Users" },
    { path: "/admin/events", icon: Calendar, label: "Events" },
    {
      path: "/admin/registrations",
      icon: ClipboardList,
      label: "Registrations",
    },
    { path: "/admin/notifications", icon: Bell, label: "Notifications" },
    { path: "/admin/certificates", icon: Award, label: "Certificates" },
    { path: "/admin/teams", icon: Users2, label: "Teams" },
    { path: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
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
            <NavItem key={item.path} to={item.path} end={item.exact}>
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
                  <UserRole>{user?.role?.replace("_", " ")}</UserRole>
                </UserInfo>
                <ChevronDown size={20} />
              </UserButton>

              {userMenuOpen && (
                <DropdownMenu>
                  <DropdownItem onClick={() => navigate("/dashboard/profile")}>
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

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  font-family: "Inter", sans-serif;
  background: var(--admin-main-bg);
  color: var(--text-primary);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
`;

const Sidebar = styled.aside`
  width: 280px;
  background: var(--admin-sidebar-bg);
  color: var(--admin-sidebar-text);
  border-right: 1px solid var(--admin-sidebar-border);
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  transform: ${(props) =>
    props.$open ? "translateX(0)" : "translateX(-100%)"};
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.2s ease,
    color 0.2s ease;
  z-index: 1000;
  box-shadow: 4px 0 24px var(--shadow-color);

  /* Custom Scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--admin-sidebar-border);
  margin-bottom: 12px;
`;

const Logo = styled.h1`
  font-size: 26px;
  font-weight: 800;
  background: linear-gradient(135deg, #4285f4, #ea4335, #fbbc04, #34a853);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
`;

const CloseButton = styled.button`
  background: var(--admin-sidebar-hover);
  border: none;
  color: var(--admin-nav-text);
  cursor: pointer;
  display: none;
  padding: 8px;
  border-radius: 8px;
  transition:
    background 0.2s,
    color 0.2s;

  &:hover {
    background: var(--border-color);
    color: var(--admin-nav-hover-text);
  }

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const NavMenu = styled.nav`
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  color: var(--admin-nav-text);
  text-decoration: none;
  transition: all 0.2s ease;
  border-radius: 12px;
  font-weight: 500;
  font-size: 15px;

  &:hover {
    background: var(--admin-sidebar-hover);
    color: var(--admin-nav-hover-text);
    transform: translateX(4px);
  }

  &.active {
    background: var(--admin-nav-active-bg);
    color: var(--admin-nav-active-text);
  }

  svg {
    flex-shrink: 0;
  }
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: ${(props) => (props.$sidebarOpen ? "280px" : "0")};
  transition:
    margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.2s ease;
  min-width: 0;
  background: var(--admin-main-bg);

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const TopBar = styled.header.attrs({
  className:
    "bg-white dark:bg-gray-900/80 backdrop-blur-md transition-colors duration-200",
})`
  padding: 16px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  position: sticky;
  top: 0;
  z-index: 900;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const MenuButton = styled.button.attrs({
  className:
    "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
})`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PageTitle = styled.h2.attrs({
  className: "text-gray-800 dark:text-white",
})`
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.5px;
`;

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
`;

const UserMenu = styled.div`
  position: relative;
`;

const UserButton = styled.button.attrs({
  className:
    "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
})`
  display: flex;
  align-items: center;
  gap: 12px;
  background: none;
  border: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  padding: 6px 12px 6px 16px;
  border-radius: 99px;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(0, 0, 0, 0.15);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .dark & {
    border-color: rgba(255, 255, 255, 0.1);

    &:hover {
      border-color: rgba(255, 255, 255, 0.2);
    }
  }
`;

const UserInfo = styled.div`
  text-align: right;
  display: flex;
  flex-direction: column;
`;

const UserName = styled.span.attrs({
  className: "text-gray-900 dark:text-gray-100",
})`
  font-weight: 600;
  font-size: 14px;
  line-height: 1.2;
`;

const UserRole = styled.span.attrs({
  className: "text-gray-500 dark:text-gray-400",
})`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
  margin-top: 2px;
`;

const DropdownMenu = styled.div.attrs({
  className:
    "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700",
})`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  border-radius: 12px;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.2);
  min-width: 200px;
  padding: 6px;
  overflow: hidden;
  transform-origin: top right;
  animation: slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const DropdownItem = styled.button.attrs({
  className:
    "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors",
})`
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    color: #4285f4;
  }

  svg {
    opacity: 0.7;
  }
`;

const Content = styled.div`
  padding: 32px;
  max-width: 1600px;
  margin: 0 auto;
`;

export default AdminLayout;

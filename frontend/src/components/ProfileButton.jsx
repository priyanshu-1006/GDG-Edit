import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Settings, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useNavigate } from 'react-router-dom';

const ButtonContainer = styled.div`
  position: relative;
  :hover{
    background-color: ${({ theme }) => theme.colors.background.secondary};
  }
`

const Button = styled.button`
  background: ${({ theme }) => theme.colors?.background.secondary};
  border: none;
  border-radius: ${({ theme }) => theme.colors.borderRadius.medium};
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: 'Google Sans', sans-serif;
  cursor: pointer;

  transition: all ${({ theme }) => theme.colors.transitions.default};
  
  &:hover {
    box-shadow: ${({ theme }) => theme.colors.shadows.medium};
    transform: translateY(-1px);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.surface};
  }

  @media (max-width: 768px) {
    padding: 6px 8px;
    font-size: 14px;
  }
`;

const ProfilePhoto = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  @media (max-width: 480px) {
    display: none;
  }
`;

const UserName = styled.span`
  font-weight: 500;
  font-size: 12x;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const UserEmail = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};

  @media (max-width: 768px) {
    font-size: 10px;
  }
`;

const Dropdown = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: ${({ theme }) => theme.colors.surfaceElevated};
  border-radius: ${({ theme }) => theme.colors.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.colors.shadows.large};
  min-width: 200px;
  overflow: hidden;
  z-index: 1200;
  pointer-events: auto;

  @media (max-width: 480px) {
    min-width: 150px;
  }
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  background: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 14px;
  text-align: left;
  transition: background ${({ theme }) => theme.colors.transitions.default};

  &:hover {
    background: ${({ theme }) => theme.colors.surface};
  }

  svg {
    color: ${({ theme }) => theme.colors.text.secondary};
  }

  @media (max-width: 768px) {
    padding: 10px 12px;
    font-size: 12px;
  }
`;

const ProfileButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout(e) {
    e.preventDefault();
    logout();
    window.location.href = '/';
  }


  const handleProfile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    window.location.assign('/dashboard/profile');
  };

  return (
    <ButtonContainer>
      <Button type="button" onClick={() => setIsOpen(!isOpen)}>
        <ProfilePhoto>
          {user?.profilePhoto ? (
            <img src={user?.profilePhoto} alt={user?.name} />
          ) : (
            <User size={20} />
          )}
        </ProfilePhoto>
        <UserInfo>
          <UserName>{user?.name}</UserName>
        </UserInfo>
        <ChevronDown 
          size={16}
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s ease'
          }}
        />
      </Button>
      
      <AnimatePresence>
        {isOpen && (
          <Dropdown
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <DropdownItem type="button" onClick={handleProfile}>
              <User size={18} />
              My Profile
            </DropdownItem>
            <DropdownItem type="button" onClick={handleLogout}>
              <LogOut size={18} />
              Sign Out
            </DropdownItem>
          </Dropdown>
        )}
      </AnimatePresence>
    </ButtonContainer>
  );
};

export default ProfileButton;

import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ theme }) => theme.colors.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const Modal = styled(motion.div)`
  background: ${({ theme }) => theme.colors.background.primary};
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const CloseButton = styled.button`
  padding: 0.5rem;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.text.secondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: ${({ theme }) => theme.colors.background.secondary};
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const PlatformSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const PlatformCard = styled(motion.button)`
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid ${({ theme, $selected }) => 
    $selected ? theme.googleColors.blue.primary : theme.colors.border};
  background: ${({ theme, $selected }) => 
    $selected ? `${theme.googleColors.blue.primary}15` : theme.colors.background.secondary};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${({ theme }) => theme.googleColors.blue.primary};
    transform: translateY(-2px);
  }
  
  img {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }
  
  span {
    font-size: 1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1rem;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.googleColors.blue.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => `${theme.googleColors.blue.primary}20`};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const HelpText = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0.5rem 0 0 0;
`;

const Alert = styled(motion.div)`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  
  ${({ $type, theme }) => {
    if ($type === 'error') {
      return `
        background: ${theme.googleColors.red.primary}15;
        color: ${theme.googleColors.red.primary};
      `;
    } else if ($type === 'success') {
      return `
        background: ${theme.googleColors.green.primary}15;
        color: ${theme.googleColors.green.primary};
      `;
    }
  }}
  
  svg {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
  
  div {
    flex: 1;
    
    p {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 500;
    }
  }
`;

const ModalFooter = styled.div`
  padding: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const Button = styled(motion.button)`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  
  ${({ $variant, theme }) => {
    if ($variant === 'primary') {
      return `
        background: ${theme.googleColors.blue.primary};
        color: white;
        &:hover { background: ${theme.googleColors.blue.darker}; }
      `;
    } else {
      return `
        background: ${theme.colors.background.secondary};
        color: ${theme.colors.text.primary};
        &:hover { background: ${theme.colors.background.tertiary}; }
      `;
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AddProfileModal = ({ isOpen, onClose, onSuccess }) => {
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPlatform) {
      setError('Please select a platform');
      return;
    }
    
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/coding-profiles/add`,
        {
          platform: selectedPlatform,
          username: username.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess(`${selectedPlatform} profile added successfully!`);
      setTimeout(() => {
        onSuccess && onSuccess();
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPlatform('');
    setUsername('');
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <Modal
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <ModalHeader>
            <h2>Add Coding Profile</h2>
            <CloseButton onClick={handleClose}>
              <X size={24} />
            </CloseButton>
          </ModalHeader>

          <form onSubmit={handleSubmit}>
            <ModalBody>
              {error && (
                <Alert
                  $type="error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle size={20} />
                  <div>
                    <p>{error}</p>
                  </div>
                </Alert>
              )}

              {success && (
                <Alert
                  $type="success"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Check size={20} />
                  <div>
                    <p>{success}</p>
                  </div>
                </Alert>
              )}

              <FormGroup>
                <Label>Select Platform</Label>
                <PlatformSelector>
                  <PlatformCard
                    type="button"
                    $selected={selectedPlatform === 'leetcode'}
                    onClick={() => setSelectedPlatform('leetcode')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png" 
                      alt="LeetCode"
                    />
                    <span>LeetCode</span>
                  </PlatformCard>

                  <PlatformCard
                    type="button"
                    $selected={selectedPlatform === 'codechef'}
                    onClick={() => setSelectedPlatform('codechef')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <img 
                      src="https://cdn.codechef.com/images/cc-logo.svg" 
                      alt="CodeChef"
                    />
                    <span>CodeChef</span>
                  </PlatformCard>
                </PlatformSelector>
              </FormGroup>

              {selectedPlatform && (
                <FormGroup>
                  <Label>Username</Label>
                  <Input
                    type="text"
                    placeholder={`Enter your ${selectedPlatform} username`}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                  />
                  <HelpText>
                    {selectedPlatform === 'leetcode' 
                      ? 'Your LeetCode username (e.g., john_doe)'
                      : 'Your CodeChef username (e.g., john_doe)'}
                  </HelpText>
                </FormGroup>
              )}
            </ModalBody>

            <ModalFooter>
              <Button
                type="button"
                $variant="secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                $variant="primary"
                disabled={loading || !selectedPlatform || !username.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <Loader size={18} className="spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Add Profile
                  </>
                )}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      </Overlay>
    </AnimatePresence>
  );
};

export default AddProfileModal;

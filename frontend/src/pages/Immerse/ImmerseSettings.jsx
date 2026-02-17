import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User,
  Lock,
  Shield,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Mail,
  UserPlus,
  Settings as SettingsIcon,
  Database,
  Bell,
  X
} from 'lucide-react';
import { immerseAuth, immerseApi } from '../../utils/immerseApi';

// Styled Components
const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 32px;
  
  h1 {
    color: white;
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 8px;
  }
  
  p {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    margin: 0;
  }
`;

const TabNav = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 32px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  width: fit-content;
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: ${({ $active }) => $active ? 'rgba(79, 70, 229, 0.3)' : 'transparent'};
  border: ${({ $active }) => $active ? '1px solid rgba(79, 70, 229, 0.5)' : '1px solid transparent'};
  border-radius: 8px;
  color: ${({ $active }) => $active ? 'white' : 'rgba(255, 255, 255, 0.6)'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: white;
    background: ${({ $active }) => $active ? 'rgba(79, 70, 229, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const Section = styled(motion.section)`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  margin-bottom: 24px;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    color: white;
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    
    svg {
      width: 20px;
      height: 20px;
      color: #4f46e5;
    }
  }
`;

const SectionContent = styled.div`
  padding: 24px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FormGroup = styled.div`
  label {
    display: block;
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 8px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: white;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: rgba(79, 70, 229, 0.5);
    background: rgba(255, 255, 255, 0.08);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PasswordInput = styled.div`
  position: relative;
  
  input {
    width: 100%;
    padding: 12px 48px 12px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: white;
    font-size: 14px;
    
    &:focus {
      outline: none;
      border-color: rgba(79, 70, 229, 0.5);
    }
  }
  
  button {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    padding: 4px;
    
    &:hover {
      color: white;
    }
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: rgba(79, 70, 229, 0.5);
  }
  
  option {
    background: #1e293b;
  }
`;

const Button = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: ${({ $variant }) => {
    switch ($variant) {
      case 'primary': return 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';
      case 'danger': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'success': return 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  }};
  border: ${({ $variant }) => $variant ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'};
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ $variant }) => $variant ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none'};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const Alert = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: ${({ $type }) => 
    $type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 
    $type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 
    'rgba(251, 191, 36, 0.1)'};
  border: 1px solid ${({ $type }) => 
    $type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 
    $type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 
    'rgba(251, 191, 36, 0.3)'};
  border-radius: 10px;
  margin-bottom: 20px;
  
  svg {
    width: 20px;
    height: 20px;
    color: ${({ $type }) => 
      $type === 'error' ? '#ef4444' : 
      $type === 'success' ? '#22c55e' : 
      '#fbbf24'};
    flex-shrink: 0;
  }
  
  span {
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    flex: 1;
  }
`;

// Admin Management Table
const AdminTable = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
`;

const AdminTableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 120px;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.03);
  
  span {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const AdminRow = styled(motion.div)`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 120px;
  padding: 16px 20px;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const AdminInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AdminAvatar = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
`;

const AdminDetails = styled.div`
  h4 {
    color: white;
    font-size: 14px;
    font-weight: 500;
    margin: 0 0 2px;
  }
  
  span {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
  }
`;

const RoleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ $role }) => 
    $role === 'immerse_super_admin' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(59, 130, 246, 0.2)'};
  color: ${({ $role }) => 
    $role === 'immerse_super_admin' ? '#a855f7' : '#3b82f6'};
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

const StatusDot = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${({ $active }) => $active ? '#22c55e' : '#ef4444'};
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const IconButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ $danger }) => $danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
    color: ${({ $danger }) => $danger ? '#ef4444' : 'white'};
    border-color: ${({ $danger }) => $danger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.2)'};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

// Modal
const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled(motion.div)`
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  h3 {
    color: white;
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
  
  button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    padding: 4px;
    
    &:hover {
      color: white;
    }
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  
  svg {
    width: 48px;
    height: 48px;
    color: rgba(255, 255, 255, 0.2);
    margin-bottom: 16px;
  }
  
  h4 {
    color: white;
    font-size: 16px;
    margin: 0 0 8px;
  }
  
  p {
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    margin: 0;
  }
`;

const InfoCard = styled.div`
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  
  h4 {
    color: white;
    font-size: 14px;
    font-weight: 500;
    margin: 0 0 8px;
  }
  
  p {
    color: rgba(255, 255, 255, 0.6);
    font-size: 13px;
    margin: 0;
    line-height: 1.5;
  }
`;

const ImmerseSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Profile form state
  const [profile, setProfile] = useState({
    name: '',
    email: ''
  });
  
  // Password form state
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // New admin form state
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    role: 'immerse_admin'
  });

  const fetchCurrentAdmin = useCallback(async () => {
    try {
      const stored = localStorage.getItem('immerseAdmin');
      if (stored) {
        const admin = JSON.parse(stored);
        setCurrentAdmin(admin);
        setProfile({
          name: admin.name || '',
          email: admin.email || ''
        });
      }
    } catch (error) {
      console.error('Error fetching admin:', error);
    }
  }, []);

  const fetchAdmins = useCallback(async () => {
    if (currentAdmin?.role !== 'immerse_super_admin') return;
    
    try {
      const response = await immerseAuth.getAdmins();
      if (response.data.success) {
        setAdmins(response.data.admins);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  }, [currentAdmin?.role]);

  useEffect(() => {
    fetchCurrentAdmin();
  }, [fetchCurrentAdmin]);

  useEffect(() => {
    if (activeTab === 'admins') {
      fetchAdmins();
    }
  }, [activeTab, fetchAdmins]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await immerseApi.put('/auth/profile', profile);
      if (response.data.success) {
        // Update local storage
        const updatedAdmin = { ...currentAdmin, ...profile };
        localStorage.setItem('immerseAdmin', JSON.stringify(updatedAdmin));
        setCurrentAdmin(updatedAdmin);
        showAlert('success', 'Profile updated successfully');
      }
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      showAlert('error', 'New passwords do not match');
      return;
    }
    
    if (passwords.newPassword.length < 8) {
      showAlert('error', 'Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await immerseApi.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      
      if (response.data.success) {
        showAlert('success', 'Password changed successfully');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      showAlert('error', 'All fields are required');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await immerseAuth.createAdmin(newAdmin);
      if (response.data.success) {
        showAlert('success', 'Admin created successfully');
        setShowCreateModal(false);
        setNewAdmin({ name: '', email: '', password: '', role: 'immerse_admin' });
        fetchAdmins();
      }
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    
    try {
      const response = await immerseApi.delete(`/auth/admin/${adminId}`);
      if (response.data.success) {
        showAlert('success', 'Admin deleted successfully');
        fetchAdmins();
      }
    } catch (error) {
      showAlert('error', error.response?.data?.message || 'Failed to delete admin');
    }
  };

  const togglePassword = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <PageContainer>
      <PageHeader>
        <h1>Settings</h1>
        <p>Manage your account and system configuration</p>
      </PageHeader>

      <TabNav>
        <Tab $active={activeTab === 'profile'} onClick={() => setActiveTab('profile')}>
          <User /> Profile
        </Tab>
        <Tab $active={activeTab === 'security'} onClick={() => setActiveTab('security')}>
          <Lock /> Security
        </Tab>
        {currentAdmin?.role === 'immerse_super_admin' && (
          <Tab $active={activeTab === 'admins'} onClick={() => setActiveTab('admins')}>
            <Shield /> Admins
          </Tab>
        )}
        <Tab $active={activeTab === 'system'} onClick={() => setActiveTab('system')}>
          <SettingsIcon /> System
        </Tab>
      </TabNav>

      <AnimatePresence>
        {alert && (
          <Alert
            $type={alert.type}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {alert.type === 'error' ? <AlertCircle /> : <CheckCircle />}
            <span>{alert.message}</span>
          </Alert>
        )}
      </AnimatePresence>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SectionHeader>
            <h3><User /> Profile Information</h3>
          </SectionHeader>
          <SectionContent>
            <form onSubmit={handleProfileUpdate}>
              <FormRow>
                <FormGroup>
                  <label>Full Name</label>
                  <Input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </FormGroup>
                <FormGroup>
                  <label>Email Address</label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="Enter your email"
                  />
                </FormGroup>
              </FormRow>
              <FormRow>
                <FormGroup>
                  <label>Role</label>
                  <Input
                    type="text"
                    value={currentAdmin?.role === 'immerse_super_admin' ? 'Super Admin' : 'Admin'}
                    disabled
                  />
                </FormGroup>
                <FormGroup>
                  <label>Account Created</label>
                  <Input
                    type="text"
                    value={currentAdmin?.createdAt ? new Date(currentAdmin.createdAt).toLocaleDateString() : 'N/A'}
                    disabled
                  />
                </FormGroup>
              </FormRow>
              <Button type="submit" $variant="primary" disabled={loading} whileTap={{ scale: 0.98 }}>
                <Save /> {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </SectionContent>
        </Section>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SectionHeader>
            <h3><Lock /> Change Password</h3>
          </SectionHeader>
          <SectionContent>
            <form onSubmit={handlePasswordChange}>
              <FormRow>
                <FormGroup>
                  <label>Current Password</label>
                  <PasswordInput>
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      value={passwords.currentPassword}
                      onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />
                    <button type="button" onClick={() => togglePassword('current')}>
                      {showPassword.current ? <EyeOff /> : <Eye />}
                    </button>
                  </PasswordInput>
                </FormGroup>
              </FormRow>
              <FormRow>
                <FormGroup>
                  <label>New Password</label>
                  <PasswordInput>
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      placeholder="Enter new password"
                    />
                    <button type="button" onClick={() => togglePassword('new')}>
                      {showPassword.new ? <EyeOff /> : <Eye />}
                    </button>
                  </PasswordInput>
                </FormGroup>
                <FormGroup>
                  <label>Confirm New Password</label>
                  <PasswordInput>
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                    <button type="button" onClick={() => togglePassword('confirm')}>
                      {showPassword.confirm ? <EyeOff /> : <Eye />}
                    </button>
                  </PasswordInput>
                </FormGroup>
              </FormRow>
              <InfoCard style={{ marginBottom: 20 }}>
                <h4>Password Requirements</h4>
                <p>Your password must be at least 8 characters long. We recommend using a mix of letters, numbers, and special characters for better security.</p>
              </InfoCard>
              <Button type="submit" $variant="primary" disabled={loading} whileTap={{ scale: 0.98 }}>
                <Lock /> {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </SectionContent>
        </Section>
      )}

      {/* Admins Tab (Super Admin Only) */}
      {activeTab === 'admins' && currentAdmin?.role === 'immerse_super_admin' && (
        <Section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SectionHeader>
            <h3><Shield /> Admin Management</h3>
            <Button $variant="primary" onClick={() => setShowCreateModal(true)} whileTap={{ scale: 0.98 }}>
              <UserPlus /> Add Admin
            </Button>
          </SectionHeader>
          <SectionContent style={{ padding: 0 }}>
            {admins.length > 0 ? (
              <AdminTable>
                <AdminTableHeader>
                  <span>Admin</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Actions</span>
                </AdminTableHeader>
                {admins.map((admin, index) => (
                  <AdminRow
                    key={admin._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <AdminInfo>
                      <AdminAvatar>{admin.name?.charAt(0)?.toUpperCase() || 'A'}</AdminAvatar>
                      <AdminDetails>
                        <h4>{admin.name}</h4>
                        <span>Added {new Date(admin.createdAt).toLocaleDateString()}</span>
                      </AdminDetails>
                    </AdminInfo>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14 }}>{admin.email}</span>
                    <RoleBadge $role={admin.role}>
                      {admin.role === 'immerse_super_admin' ? <Shield size={12} /> : <User size={12} />}
                      {admin.role === 'immerse_super_admin' ? 'Super Admin' : 'Admin'}
                    </RoleBadge>
                    <ActionButtons>
                      {admin._id !== currentAdmin?._id && (
                        <IconButton $danger onClick={() => handleDeleteAdmin(admin._id)}>
                          <Trash2 />
                        </IconButton>
                      )}
                    </ActionButtons>
                  </AdminRow>
                ))}
              </AdminTable>
            ) : (
              <EmptyState>
                <Shield />
                <h4>No admins found</h4>
                <p>Add admins to help manage the Immerse mail system</p>
              </EmptyState>
            )}
          </SectionContent>
        </Section>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <>
          <Section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SectionHeader>
              <h3><Mail /> Email Configuration</h3>
            </SectionHeader>
            <SectionContent>
              <FormRow>
                <FormGroup>
                  <label>Email Service</label>
                  <Input type="text" value="Resend" disabled />
                </FormGroup>
                <FormGroup>
                  <label>Sending Domain</label>
                  <Input type="text" value="immerse.mmmut.app" disabled />
                </FormGroup>
              </FormRow>
              <FormRow>
                <FormGroup>
                  <label>Default From Name</label>
                  <Input type="text" value="Immerse Team" disabled />
                </FormGroup>
                <FormGroup>
                  <label>Default From Email</label>
                  <Input type="text" value="noreply@immerse.mmmut.app" disabled />
                </FormGroup>
              </FormRow>
              <InfoCard>
                <h4>Email Service Status</h4>
                <p>Email service is configured and operational. All emails are sent through Resend using the immerse.mmmut.app domain.</p>
              </InfoCard>
            </SectionContent>
          </Section>

          <Section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SectionHeader>
              <h3><Database /> System Information</h3>
            </SectionHeader>
            <SectionContent>
              <FormRow>
                <FormGroup>
                  <label>System Version</label>
                  <Input type="text" value="1.0.0" disabled />
                </FormGroup>
                <FormGroup>
                  <label>Environment</label>
                  <Input type="text" value={import.meta.env.MODE || 'development'} disabled />
                </FormGroup>
              </FormRow>
              <FormRow>
                <FormGroup>
                  <label>API Endpoint</label>
                  <Input type="text" value="/api/immerse" disabled />
                </FormGroup>
                <FormGroup>
                  <label>Database Status</label>
                  <Input type="text" value="Connected" disabled />
                </FormGroup>
              </FormRow>
            </SectionContent>
          </Section>
        </>
      )}

      {/* Create Admin Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <Modal
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <h3>Create New Admin</h3>
                <button onClick={() => setShowCreateModal(false)}>
                  <X size={20} />
                </button>
              </ModalHeader>
              <form onSubmit={handleCreateAdmin}>
                <ModalBody>
                  <FormGroup style={{ marginBottom: 16 }}>
                    <label>Full Name</label>
                    <Input
                      type="text"
                      value={newAdmin.name}
                      onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                      placeholder="Enter admin name"
                      required
                    />
                  </FormGroup>
                  <FormGroup style={{ marginBottom: 16 }}>
                    <label>Email Address</label>
                    <Input
                      type="email"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                      placeholder="Enter admin email"
                      required
                    />
                  </FormGroup>
                  <FormGroup style={{ marginBottom: 16 }}>
                    <label>Password</label>
                    <PasswordInput>
                      <input
                        type={showPassword.newAdmin ? 'text' : 'password'}
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                        placeholder="Enter password"
                        required
                      />
                      <button type="button" onClick={() => togglePassword('newAdmin')}>
                        {showPassword.newAdmin ? <EyeOff /> : <Eye />}
                      </button>
                    </PasswordInput>
                  </FormGroup>
                  <FormGroup>
                    <label>Role</label>
                    <Select
                      value={newAdmin.role}
                      onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                    >
                      <option value="immerse_admin">Admin</option>
                      <option value="immerse_super_admin">Super Admin</option>
                    </Select>
                  </FormGroup>
                </ModalBody>
                <ModalFooter>
                  <Button type="button" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" $variant="primary" disabled={loading}>
                    <UserPlus /> {loading ? 'Creating...' : 'Create Admin'}
                  </Button>
                </ModalFooter>
              </form>
            </Modal>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default ImmerseSettings;

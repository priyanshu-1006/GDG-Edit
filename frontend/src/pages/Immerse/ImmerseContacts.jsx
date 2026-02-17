import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Edit2, 
  Trash2, 
  Mail,
  X,
  Building2,
  User,
  GraduationCap
} from 'lucide-react';
import { immerseContacts } from '../../utils/immerseApi';

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 400px;
`;

const SearchInput = styled.div`
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 0 16px;
  flex: 1;
  
  input {
    flex: 1;
    background: none;
    border: none;
    padding: 12px 0;
    color: white;
    font-size: 14px;
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
    
    &:focus {
      outline: none;
    }
  }
  
  svg {
    color: rgba(255, 255, 255, 0.4);
    width: 18px;
    height: 18px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const Button = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: ${({ $variant }) => 
    $variant === 'primary' ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' :
    $variant === 'success' ? 'rgba(34, 197, 94, 0.2)' :
    'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${({ $variant }) => 
    $variant === 'primary' ? 'transparent' :
    $variant === 'success' ? 'rgba(34, 197, 94, 0.3)' :
    'rgba(255, 255, 255, 0.1)'};
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 8px;
`;

const FilterTab = styled.button`
  padding: 8px 16px;
  background: ${({ $active }) => $active ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${({ $active }) => $active ? 'rgba(79, 70, 229, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 8px;
  color: ${({ $active }) => $active ? 'white' : 'rgba(255, 255, 255, 0.6)'};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    background: rgba(79, 70, 229, 0.1);
    color: white;
  }
`;

const Table = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 120px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  span {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  @media (max-width: 1024px) {
    display: none;
  }
`;

const TableRow = styled(motion.div)`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 120px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  align-items: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr auto;
    gap: 12px;
  }
`;

const ContactInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ContactAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${({ $type }) => 
    $type === 'company' ? 'linear-gradient(135deg, #ec4899, #f472b6)' :
    $type === 'student' ? 'linear-gradient(135deg, #06b6d4, #22d3ee)' :
    'linear-gradient(135deg, #4f46e5, #7c3aed)'};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 18px;
    height: 18px;
    color: white;
  }
`;

const ContactDetails = styled.div`
  h4 {
    color: white;
    font-size: 14px;
    font-weight: 500;
    margin: 0;
  }
  
  p {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    margin: 4px 0 0;
  }
`;

const TableCell = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  
  @media (max-width: 1024px) {
    display: none;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${({ $status }) => {
    switch ($status) {
      case 'contacted': return 'rgba(59, 130, 246, 0.2)';
      case 'interested': return 'rgba(34, 197, 94, 0.2)';
      case 'confirmed': return 'rgba(16, 185, 129, 0.2)';
      case 'declined': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(251, 191, 36, 0.2)';
    }
  }};
  color: ${({ $status }) => {
    switch ($status) {
      case 'contacted': return '#3b82f6';
      case 'interested': return '#22c55e';
      case 'confirmed': return '#10b981';
      case 'declined': return '#ef4444';
      default: return '#fbbf24';
    }
  }};
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 8px;
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
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  &.delete:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.3);
    color: #f87171;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled(motion.div)`
  background: #1e293b;
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
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: white;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  
  label {
    display: block;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
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
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
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
    border-color: #4f46e5;
  }
  
  option {
    background: #1e293b;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: white;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
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
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.5);
  
  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  h4 {
    color: white;
    font-size: 16px;
    margin: 0 0 8px;
  }
  
  p {
    font-size: 14px;
    margin: 0;
  }
`;

const ImmerseContacts = ({ filterType = null }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(filterType || 'all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [formData, setFormData] = useState({
    type: filterType || 'company',
    name: '',
    email: '',
    phone: '',
    companyName: '',
    designation: '',
    college: '',
    year: '',
    branch: '',
    status: 'pending',
    notes: ''
  });

  useEffect(() => {
    fetchContacts();
  }, [filter, search]);

  const fetchContacts = async () => {
    try {
      const params = {};
      if (filter !== 'all') params.type = filter;
      if (search) params.search = search;
      
      const response = await immerseContacts.getAll(params);
      if (response.data.success) {
        setContacts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editContact) {
        await immerseContacts.update(editContact._id, formData);
      } else {
        await immerseContacts.create(formData);
      }
      setModalOpen(false);
      resetForm();
      fetchContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      alert(error.response?.data?.message || 'Failed to save contact');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      await immerseContacts.delete(id);
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const openEditModal = (contact) => {
    setEditContact(contact);
    setFormData({
      type: contact.type,
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      companyName: contact.companyName || '',
      designation: contact.designation || '',
      college: contact.college || '',
      year: contact.year || '',
      branch: contact.branch || '',
      status: contact.status || 'pending',
      notes: contact.notes || ''
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setEditContact(null);
    setFormData({
      type: filterType || 'company',
      name: '',
      email: '',
      phone: '',
      companyName: '',
      designation: '',
      college: '',
      year: '',
      branch: '',
      status: 'pending',
      notes: ''
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'company': return <Building2 />;
      case 'student': return <GraduationCap />;
      default: return <User />;
    }
  };

  return (
    <>
      <PageHeader>
        <SearchBar>
          <SearchInput>
            <Search />
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </SearchInput>
        </SearchBar>
        
        <ActionButtons>
          <Button 
            $variant="primary" 
            onClick={() => { resetForm(); setModalOpen(true); }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus /> Add Contact
          </Button>
        </ActionButtons>
      </PageHeader>
      
      {!filterType && (
        <FilterTabs>
          <FilterTab $active={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </FilterTab>
          <FilterTab $active={filter === 'company'} onClick={() => setFilter('company')}>
            Companies
          </FilterTab>
          <FilterTab $active={filter === 'student'} onClick={() => setFilter('student')}>
            Students
          </FilterTab>
          <FilterTab $active={filter === 'sponsor'} onClick={() => setFilter('sponsor')}>
            Sponsors
          </FilterTab>
          <FilterTab $active={filter === 'speaker'} onClick={() => setFilter('speaker')}>
            Speakers
          </FilterTab>
        </FilterTabs>
      )}
      
      <Table>
        <TableHeader>
          <span>Contact</span>
          <span>Email</span>
          <span>Type</span>
          <span>Status</span>
          <span>Emails Sent</span>
          <span>Actions</span>
        </TableHeader>
        
        {loading ? (
          <EmptyState>
            <p>Loading...</p>
          </EmptyState>
        ) : contacts.length === 0 ? (
          <EmptyState>
            <User />
            <h4>No contacts found</h4>
            <p>Add your first contact to get started</p>
          </EmptyState>
        ) : (
          contacts.map((contact, index) => (
            <TableRow
              key={contact._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ContactInfo>
                <ContactAvatar $type={contact.type}>
                  {getTypeIcon(contact.type)}
                </ContactAvatar>
                <ContactDetails>
                  <h4>{contact.name}</h4>
                  <p>{contact.companyName || contact.college || contact.designation}</p>
                </ContactDetails>
              </ContactInfo>
              
              <TableCell>{contact.email}</TableCell>
              
              <TableCell style={{ textTransform: 'capitalize' }}>
                {contact.type}
              </TableCell>
              
              <TableCell>
                <StatusBadge $status={contact.status}>
                  {contact.status}
                </StatusBadge>
              </TableCell>
              
              <TableCell>{contact.emailsSent || 0}</TableCell>
              
              <ActionGroup>
                <IconButton title="Send Email">
                  <Mail />
                </IconButton>
                <IconButton onClick={() => openEditModal(contact)} title="Edit">
                  <Edit2 />
                </IconButton>
                <IconButton className="delete" onClick={() => handleDelete(contact._id)} title="Delete">
                  <Trash2 />
                </IconButton>
              </ActionGroup>
            </TableRow>
          ))
        )}
      </Table>
      
      <AnimatePresence>
        {modalOpen && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
          >
            <Modal
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <h3>{editContact ? 'Edit Contact' : 'Add Contact'}</h3>
                <CloseButton onClick={() => setModalOpen(false)}>
                  <X size={20} />
                </CloseButton>
              </ModalHeader>
              
              <form onSubmit={handleSubmit}>
                <ModalBody>
                  <FormGroup>
                    <label>Type</label>
                    <Select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="company">Company</option>
                      <option value="student">Student</option>
                      <option value="sponsor">Sponsor</option>
                      <option value="speaker">Speaker</option>
                      <option value="other">Other</option>
                    </Select>
                  </FormGroup>
                  
                  <FormGroup>
                    <label>Name *</label>
                    <Input
                      type="text"
                      placeholder="Full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <label>Email *</label>
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <label>Phone</label>
                    <Input
                      type="tel"
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </FormGroup>
                  
                  {(formData.type === 'company' || formData.type === 'sponsor') && (
                    <>
                      <FormGroup>
                        <label>Company Name</label>
                        <Input
                          type="text"
                          placeholder="Company name"
                          value={formData.companyName}
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        />
                      </FormGroup>
                      <FormGroup>
                        <label>Designation</label>
                        <Input
                          type="text"
                          placeholder="Job title"
                          value={formData.designation}
                          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        />
                      </FormGroup>
                    </>
                  )}
                  
                  {formData.type === 'student' && (
                    <>
                      <FormGroup>
                        <label>College</label>
                        <Input
                          type="text"
                          placeholder="College name"
                          value={formData.college}
                          onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                        />
                      </FormGroup>
                      <FormGroup>
                        <label>Year</label>
                        <Select
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        >
                          <option value="">Select year</option>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                        </Select>
                      </FormGroup>
                      <FormGroup>
                        <label>Branch</label>
                        <Input
                          type="text"
                          placeholder="Branch/Department"
                          value={formData.branch}
                          onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                        />
                      </FormGroup>
                    </>
                  )}
                  
                  <FormGroup>
                    <label>Status</label>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="interested">Interested</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="declined">Declined</option>
                      <option value="registered">Registered</option>
                    </Select>
                  </FormGroup>
                  
                  <FormGroup>
                    <label>Notes</label>
                    <Textarea
                      placeholder="Additional notes..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </FormGroup>
                </ModalBody>
                
                <ModalFooter>
                  <Button type="button" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" $variant="primary">
                    {editContact ? 'Update' : 'Create'}
                  </Button>
                </ModalFooter>
              </form>
            </Modal>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImmerseContacts;

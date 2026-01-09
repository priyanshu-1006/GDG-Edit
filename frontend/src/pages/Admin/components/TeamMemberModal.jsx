import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.background.secondary};
  padding: 24px;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h2 {
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.text.secondary};
  &:hover { color: ${({ theme }) => theme.colors.text.primary}; }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  
  label {
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 0.9rem;
    font-weight: 500;
  }
  
  input, select {
    padding: 10px;
    border-radius: 6px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.background.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const Row = styled.div`
  display: flex;
  gap: 16px;
  > div { flex: 1; }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 10px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  
  ${props => props.variant === 'primary' ? `
    background: ${props.theme.colors.primary};
    color: white;
    &:hover { opacity: 0.9; }
  ` : `
    background: transparent;
    border: 1px solid ${props.theme.colors.border};
    color: ${props.theme.colors.text.primary};
    &:hover { background: ${props.theme.colors.background.tertiary}; }
  `}
`;

export default function TeamMemberModal({ member, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    badge: 'volunteer',
    year: '2025',
    image: '',
    visible: true,
    social: {
      linkedin: '',
      twitter: '',
      github: ''
    }
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        role: member.role || '',
        badge: member.badge || 'volunteer',
        year: member.year || '2025',
        image: member.image || '',
        visible: member.visible !== false,
        social: {
          linkedin: member.social?.linkedin || '',
          twitter: member.social?.twitter || '',
          github: member.social?.github || ''
        }
      });
    }
  }, [member]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('social.')) {
      const socialKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        social: {
          ...prev.social,
          [socialKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Overlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <Header>
          <h2>{member ? 'Edit Team Member' : 'Add Team Member'}</h2>
          <CloseButton onClick={onClose}><X /></CloseButton>
        </Header>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <label>Full Name</label>
            <input 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              placeholder="e.g. John Doe"
            />
          </FormGroup>

          <Row>
            <FormGroup>
              <label>Role</label>
              <input 
                name="role" 
                value={formData.role} 
                onChange={handleChange} 
                required 
                placeholder="e.g. Web Lead"
              />
            </FormGroup>
            <FormGroup>
              <label>Year</label>
              <select name="year" value={formData.year} onChange={handleChange}>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="GDG Lead">GDG Lead</option>
              </select>
            </FormGroup>
          </Row>

          <Row>
            <FormGroup>
              <label>Badge Color/Type</label>
              <select name="badge" value={formData.badge} onChange={handleChange}>
                <option value="lead">Lead (Blue)</option>
                <option value="core">Core (Red)</option>
                <option value="organizer">Organizer (Green)</option>
                <option value="volunteer">Volunteer (Yellow)</option>
                <option value="Web Developer">Web Developer</option>
                <option value="Android Developer">Android Developer</option>
              </select>
            </FormGroup>
            <FormGroup>
              <label style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '30px'}}>
                <input 
                  type="checkbox" 
                  name="visible" 
                  checked={formData.visible} 
                  onChange={handleChange}
                  style={{width: 'auto'}}
                />
                Is Publicly Visible?
              </label>
            </FormGroup>
          </Row>

          <FormGroup>
            <label>Image URL</label>
            <input 
              name="image" 
              value={formData.image} 
              onChange={handleChange} 
              placeholder="https://..."
            />
            {formData.image && (
              <img 
                src={formData.image} 
                alt="Preview" 
                style={{height: '60px', width: '60px', objectFit: 'cover', borderRadius: '4px', marginTop: '4px'}} 
              />
            )}
          </FormGroup>

          <fieldset style={{border: '1px solid #ddd', padding: '12px', borderRadius: '8px'}}>
            <legend style={{padding: '0 8px', color: '#666'}}>Social Links</legend>
            <FormGroup>
              <label>LinkedIn</label>
              <input name="social.linkedin" value={formData.social.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
            </FormGroup>
            <FormGroup style={{marginTop: '10px'}}>
              <label>Twitter / X</label>
              <input name="social.twitter" value={formData.social.twitter} onChange={handleChange} placeholder="https://twitter.com/..." />
            </FormGroup>
            <FormGroup style={{marginTop: '10px'}}>
              <label>GitHub</label>
              <input name="social.github" value={formData.social.github} onChange={handleChange} placeholder="https://github.com/..." />
            </FormGroup>
          </fieldset>

          <ButtonGroup>
            <Button type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">Save Member</Button>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </Overlay>
  );
}

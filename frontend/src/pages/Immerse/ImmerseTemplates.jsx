import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  Edit2, 
  Trash2, 
  Eye,
  X,
  Copy
} from 'lucide-react';
import { immerseTemplates } from '../../utils/immerseApi';

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Button = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: ${({ $variant }) => 
    $variant === 'primary' ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' :
    'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${({ $variant }) => 
    $variant === 'primary' ? 'transparent' : 'rgba(255, 255, 255, 0.1)'};
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

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
`;

const TemplateCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
  
  &:hover {
    border-color: rgba(79, 70, 229, 0.3);
  }
`;

const TemplateHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  h4 {
    color: white;
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 8px;
  }
`;

const CategoryBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  background: rgba(79, 70, 229, 0.2);
  border-radius: 20px;
  color: #a5b4fc;
  font-size: 11px;
  font-weight: 500;
  text-transform: capitalize;
`;

const TemplatePreview = styled.div`
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  min-height: 100px;
  max-height: 150px;
  overflow: hidden;
  
  p {
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
    margin: 0;
    line-height: 1.5;
  }
`;

const TemplateFooter = styled.div`
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const TemplateStats = styled.div`
  display: flex;
  gap: 16px;
  
  span {
    color: rgba(255, 255, 255, 0.4);
    font-size: 12px;
  }
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
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: sticky;
  top: 0;
  background: #1e293b;
  z-index: 10;
  
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
`;

const Label = styled.label`
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
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

const Editor = styled.textarea`
  width: 100%;
  min-height: 300px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: white;
  font-size: 13px;
  font-family: 'Monaco', 'Menlo', monospace;
  resize: vertical;
  line-height: 1.6;
  
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

const PreviewContainer = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-top: 20px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  
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

const ImmerseTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState(null);
  const [editTemplate, setEditTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    category: 'general',
    htmlContent: '',
    variables: [],
    previewText: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await immerseTemplates.getAll();
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const variables = formData.htmlContent.match(/\{\{(\w+)\}\}/g)?.map(v => v.replace(/\{\{|\}\}/g, '')) || [];
      
      const data = {
        ...formData,
        variables
      };

      if (editTemplate) {
        await immerseTemplates.update(editTemplate._id, data);
      } else {
        await immerseTemplates.create(data);
      }
      setModalOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert(error.response?.data?.message || 'Failed to save template');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await immerseTemplates.delete(id);
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const openEditModal = (template) => {
    setEditTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      category: template.category,
      htmlContent: template.htmlContent,
      variables: template.variables || [],
      previewText: template.previewText || ''
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setEditTemplate(null);
    setFormData({
      name: '',
      subject: '',
      category: 'general',
      htmlContent: '',
      variables: [],
      previewText: ''
    });
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <>
      <PageHeader>
        <h2 style={{ color: 'white', margin: 0 }}>Email Templates</h2>
        <Button 
          $variant="primary" 
          onClick={() => { resetForm(); setModalOpen(true); }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus /> New Template
        </Button>
      </PageHeader>
      
      {loading ? (
        <EmptyState>
          <p>Loading...</p>
        </EmptyState>
      ) : templates.length === 0 ? (
        <EmptyState>
          <FileText />
          <h4>No templates yet</h4>
          <p>Create your first email template to get started</p>
        </EmptyState>
      ) : (
        <TemplateGrid>
          {templates.map((template, index) => (
            <TemplateCard
              key={template._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <TemplateHeader>
                <h4>{template.name}</h4>
                <CategoryBadge>{template.category}</CategoryBadge>
              </TemplateHeader>
              
              <TemplatePreview>
                <p><strong>Subject:</strong> {template.subject}</p>
                <p style={{ marginTop: 8 }}>
                  {stripHtml(template.htmlContent).substring(0, 150)}...
                </p>
              </TemplatePreview>
              
              <TemplateFooter>
                <TemplateStats>
                  <span>Used: {template.usageCount || 0}</span>
                  {template.variables?.length > 0 && (
                    <span>Variables: {template.variables.length}</span>
                  )}
                </TemplateStats>
                
                <ActionGroup>
                  <IconButton onClick={() => setPreviewModal(template)} title="Preview">
                    <Eye />
                  </IconButton>
                  <IconButton onClick={() => openEditModal(template)} title="Edit">
                    <Edit2 />
                  </IconButton>
                  <IconButton className="delete" onClick={() => handleDelete(template._id)} title="Delete">
                    <Trash2 />
                  </IconButton>
                </ActionGroup>
              </TemplateFooter>
            </TemplateCard>
          ))}
        </TemplateGrid>
      )}
      
      {/* Create/Edit Modal */}
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
                <h3>{editTemplate ? 'Edit Template' : 'New Template'}</h3>
                <CloseButton onClick={() => setModalOpen(false)}>
                  <X size={20} />
                </CloseButton>
              </ModalHeader>
              
              <form onSubmit={handleSubmit}>
                <ModalBody>
                  <FormGroup>
                    <Label>Template Name *</Label>
                    <Input
                      type="text"
                      placeholder="e.g., Sponsor Outreach"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="general">General</option>
                      <option value="sponsor">Sponsor</option>
                      <option value="student">Student</option>
                      <option value="speaker">Speaker</option>
                      <option value="follow_up">Follow Up</option>
                      <option value="confirmation">Confirmation</option>
                      <option value="reminder">Reminder</option>
                    </Select>
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>Subject Line *</Label>
                    <Input
                      type="text"
                      placeholder="Email subject (supports {{variables}})"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>Preview Text</Label>
                    <Input
                      type="text"
                      placeholder="Text shown in email preview"
                      value={formData.previewText}
                      onChange={(e) => setFormData({ ...formData, previewText: e.target.value })}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>HTML Content *</Label>
                    <Editor
                      placeholder="Enter HTML content. Use {{variableName}} for dynamic content."
                      value={formData.htmlContent}
                      onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                      required
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>Preview</Label>
                    <PreviewContainer>
                      <div dangerouslySetInnerHTML={{ __html: formData.htmlContent || '<p>Preview will appear here...</p>' }} />
                    </PreviewContainer>
                  </FormGroup>
                </ModalBody>
                
                <ModalFooter>
                  <Button type="button" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" $variant="primary">
                    {editTemplate ? 'Update' : 'Create'}
                  </Button>
                </ModalFooter>
              </form>
            </Modal>
          </ModalOverlay>
        )}
      </AnimatePresence>
      
      {/* Preview Modal */}
      <AnimatePresence>
        {previewModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewModal(null)}
          >
            <Modal
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <h3>Preview: {previewModal.name}</h3>
                <CloseButton onClick={() => setPreviewModal(null)}>
                  <X size={20} />
                </CloseButton>
              </ModalHeader>
              
              <ModalBody>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>
                  <strong>Subject:</strong> {previewModal.subject}
                </p>
                
                {previewModal.variables?.length > 0 && (
                  <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 20, fontSize: 13 }}>
                    <strong>Variables:</strong> {previewModal.variables.join(', ')}
                  </p>
                )}
                
                <PreviewContainer>
                  <div dangerouslySetInnerHTML={{ __html: previewModal.htmlContent }} />
                </PreviewContainer>
              </ModalBody>
            </Modal>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImmerseTemplates;

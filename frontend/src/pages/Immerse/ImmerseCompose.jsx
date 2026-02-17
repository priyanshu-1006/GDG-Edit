import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  Send, 
  Users, 
  FileText, 
  Eye,
  Sparkles,
  ChevronDown,
  X,
  Check
} from 'lucide-react';
import { immerseEmail, immerseContacts, immerseTemplates } from '../../utils/immerseApi';

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const ComposerCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
`;

const CardHeader = styled.div`
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
  }
`;

const CardBody = styled.div`
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
  font-size: 14px;
  font-family: 'Monaco', 'Menlo', monospace;
  resize: vertical;
  line-height: 1.6;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
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

const SidePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  @media (max-width: 1200px) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
`;

const PanelCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 20px;
`;

const PanelTitle = styled.h4`
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    width: 16px;
    height: 16px;
    color: #818cf8;
  }
`;

const RecipientList = styled.div`
  max-height: 200px;
  overflow-y: auto;
`;

const RecipientItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  input {
    width: 16px;
    height: 16px;
  }
`;

const RecipientInfo = styled.div`
  flex: 1;
  overflow: hidden;
  
  span {
    display: block;
    color: white;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  small {
    color: rgba(255, 255, 255, 0.5);
    font-size: 11px;
  }
`;

const TemplateList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TemplateItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: ${({ $selected }) => $selected ? 'rgba(79, 70, 229, 0.2)' : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${({ $selected }) => $selected ? 'rgba(79, 70, 229, 0.3)' : 'transparent'};
  border-radius: 10px;
  color: white;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(79, 70, 229, 0.1);
  }
  
  svg {
    width: 16px;
    height: 16px;
    color: #818cf8;
  }
`;

const VariablesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const VariableTag = styled.button`
  padding: 6px 12px;
  background: rgba(79, 70, 229, 0.2);
  border: 1px solid rgba(79, 70, 229, 0.3);
  border-radius: 6px;
  color: #a5b4fc;
  font-size: 12px;
  font-family: monospace;
  cursor: pointer;
  
  &:hover {
    background: rgba(79, 70, 229, 0.3);
  }
`;

const PreviewPane = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
  
  h4 {
    color: #333;
    margin: 0 0 10px;
    font-size: 16px;
  }
`;

const Alert = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: ${({ $type }) => $type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
  border: 1px solid ${({ $type }) => $type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
  border-radius: 10px;
  color: ${({ $type }) => $type === 'success' ? '#22c55e' : '#ef4444'};
  font-size: 14px;
  margin-bottom: 20px;
`;

const ImmerseCompose = () => {
  const [sendMode, setSendMode] = useState('single'); // single, bulk
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchContacts();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await immerseTemplates.getAll();
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await immerseContacts.getAll({ limit: 100 });
      if (response.data.success) {
        setContacts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setSubject(template.subject);
    setHtmlContent(template.htmlContent);
  };

  const insertVariable = (variable) => {
    setHtmlContent(prev => prev + `{{${variable}}}`);
  };

  const toggleContact = (contact) => {
    setSelectedContacts(prev => {
      const exists = prev.find(c => c._id === contact._id);
      if (exists) {
        return prev.filter(c => c._id !== contact._id);
      }
      return [...prev, contact];
    });
  };

  const handleSend = async () => {
    if (sendMode === 'single' && !recipient) {
      setAlert({ type: 'error', message: 'Please enter a recipient email' });
      return;
    }
    
    if (sendMode === 'bulk' && selectedContacts.length === 0) {
      setAlert({ type: 'error', message: 'Please select at least one contact' });
      return;
    }
    
    if (!subject || !htmlContent) {
      setAlert({ type: 'error', message: 'Please fill in subject and content' });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      if (sendMode === 'single') {
        await immerseEmail.send({
          to: recipient,
          subject,
          html: htmlContent,
          category: 'general'
        });
        setAlert({ type: 'success', message: 'Email sent successfully!' });
      } else {
        const result = await immerseEmail.sendBulk({
          contactIds: selectedContacts.map(c => c._id),
          subject,
          html: htmlContent,
          campaignName: `Bulk Email - ${new Date().toLocaleDateString()}`
        });
        setAlert({ 
          type: 'success', 
          message: `Sent ${result.data.sent} emails successfully! ${result.data.failed} failed.` 
        });
      }

      // Reset form
      if (sendMode === 'single') setRecipient('');
      setSelectedContacts([]);
    } catch (error) {
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to send email' 
      });
    } finally {
      setLoading(false);
    }
  };

  const availableVariables = ['name', 'email', 'companyName', 'designation', 'college', 'eventDate', 'registrationId'];

  return (
    <Container>
      <ComposerCard>
        <CardHeader>
          <h3>
            <Send size={18} style={{ color: '#818cf8' }} />
            Compose Email
          </h3>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <Button 
              $variant={sendMode === 'single' ? 'primary' : undefined}
              onClick={() => setSendMode('single')}
              style={{ padding: '8px 16px' }}
            >
              Single
            </Button>
            <Button 
              $variant={sendMode === 'bulk' ? 'primary' : undefined}
              onClick={() => setSendMode('bulk')}
              style={{ padding: '8px 16px' }}
            >
              Bulk
            </Button>
          </div>
        </CardHeader>
        
        <CardBody>
          {alert && (
            <Alert 
              $type={alert.type}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {alert.type === 'success' ? <Check size={18} /> : <X size={18} />}
              {alert.message}
            </Alert>
          )}
          
          {sendMode === 'single' && (
            <FormGroup>
              <Label>To</Label>
              <Input
                type="email"
                placeholder="recipient@example.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </FormGroup>
          )}
          
          {sendMode === 'bulk' && (
            <FormGroup>
              <Label>Recipients: {selectedContacts.length} selected</Label>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 8, 
                marginTop: 8,
                minHeight: 40,
                padding: 12,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 10
              }}>
                {selectedContacts.length === 0 ? (
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                    Select contacts from the sidebar
                  </span>
                ) : (
                  selectedContacts.map(contact => (
                    <span 
                      key={contact._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        background: 'rgba(79,70,229,0.2)',
                        borderRadius: 20,
                        fontSize: 12,
                        color: 'white'
                      }}
                    >
                      {contact.name}
                      <button 
                        onClick={() => toggleContact(contact)}
                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </FormGroup>
          )}
          
          <FormGroup>
            <Label>Subject</Label>
            <Input
              type="text"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Content (HTML)</Label>
            <Editor
              placeholder="Write your email content here... Use {{variable}} for dynamic content."
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
            />
          </FormGroup>
          
          <ButtonRow>
            <Button onClick={() => setShowPreview(!showPreview)}>
              <Eye /> Preview
            </Button>
            <Button 
              $variant="primary" 
              onClick={handleSend}
              disabled={loading}
            >
              <Send /> {loading ? 'Sending...' : 'Send Email'}
            </Button>
          </ButtonRow>
          
          {showPreview && (
            <PreviewPane style={{ marginTop: 20 }}>
              <h4>{subject || 'Email Subject'}</h4>
              <div dangerouslySetInnerHTML={{ __html: htmlContent || '<p>Email content preview...</p>' }} />
            </PreviewPane>
          )}
        </CardBody>
      </ComposerCard>
      
      <SidePanel>
        {sendMode === 'bulk' && (
          <PanelCard>
            <PanelTitle>
              <Users /> Select Recipients
            </PanelTitle>
            <RecipientList>
              {contacts.map(contact => (
                <RecipientItem 
                  key={contact._id}
                  onClick={() => toggleContact(contact)}
                >
                  <input
                    type="checkbox"
                    checked={selectedContacts.some(c => c._id === contact._id)}
                    onChange={() => {}}
                  />
                  <RecipientInfo>
                    <span>{contact.name}</span>
                    <small>{contact.email}</small>
                  </RecipientInfo>
                </RecipientItem>
              ))}
            </RecipientList>
          </PanelCard>
        )}
        
        <PanelCard>
          <PanelTitle>
            <FileText /> Templates
          </PanelTitle>
          <TemplateList>
            {templates.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                No templates available
              </p>
            ) : (
              templates.slice(0, 5).map(template => (
                <TemplateItem
                  key={template._id}
                  $selected={selectedTemplate?._id === template._id}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <FileText />
                  {template.name}
                </TemplateItem>
              ))
            )}
          </TemplateList>
        </PanelCard>
        
        <PanelCard>
          <PanelTitle>
            <Sparkles /> Variables
          </PanelTitle>
          <VariablesList>
            {availableVariables.map(variable => (
              <VariableTag 
                key={variable}
                onClick={() => insertVariable(variable)}
              >
                {`{{${variable}}}`}
              </VariableTag>
            ))}
          </VariablesList>
        </PanelCard>
      </SidePanel>
    </Container>
  );
};

export default ImmerseCompose;

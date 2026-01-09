import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { X, Upload, Check, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../../config/api';
import axios from 'axios';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ModalContainer = styled.div`
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px; /* Wider for preview */
  padding: 2rem;
  position: relative;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  &:hover { color: #111827; }
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
`;

const Row = styled.div`
  display: flex;
  gap: 2rem;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Col = styled.div`
  flex: 1;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
`;

const FileInput = styled.input`
  display: block;
  width: 100%;
  font-size: 0.875rem;
  color: #6b7280;
  file-selector-button {
    margin-right: 1rem;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    background: #e5e7eb;
    cursor: pointer;
  }
`;

const PreviewContainer = styled.div`
  margin-top: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  cursor: crosshair;
  background: #f9fafb;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  display: block;
`;

const PreviewText = styled.div`
  position: absolute;
  transform: translate(-50%, -50%); /* Center on click */
  white-space: nowrap;
  pointer-events: none;
  border: 1px dashed #3b82f6;
  padding: 2px 5px;
  background: rgba(255, 255, 255, 0.7);
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  &:disabled { background-color: #9ca3af; cursor: not-allowed; }
`;

const BulkIssueModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  
  // Files
  const [templateFile, setTemplateFile] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  
  // Preview
  const [templateUrl, setTemplateUrl] = useState(''); // Cloudinary or Local Blob
  const [localPreviewUrl, setLocalPreviewUrl] = useState(''); // For immediate preview
  
  // Positioning
  const [pos, setPos] = useState({ x: 50, y: 50 }); // Percentage
  const [fontSize, setFontSize] = useState(30);
  const [color, setColor] = useState('#000000');

  const imageRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
        fetchEvents();
    }
  }, [isOpen]);

  const fetchEvents = async () => {
    try {
        const res = await api.get('/events?limit=50&upcoming=false');
        setEvents(res.data.events || []);
    } catch (err) {
        console.error(err);
    }
  };

  const handleTemplateChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setTemplateFile(file);
        setLocalPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleImageClick = (e) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y });
  };

  const uploadTemplate = async () => {
    if (!templateFile) return null;
    try {
        const formData = new FormData();
        formData.append("file", templateFile);
        
        // Note: Reusing Uploadbox endpoint pattern
        const token = localStorage.getItem("token");
        const res = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/upload/certificates`, 
            formData,
            { headers: { 
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
            }}
        );
        return res.data.secure_url || res.data.url;
    } catch (err) {
        console.error("Upload error", err);
        throw new Error("Failed to upload template image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEvent || !excelFile || (!templateFile && !templateUrl)) {
        toast.error("Please provide Event, Template, and Excel file");
        return;
    }

    setLoading(true);
    try {
        let finalTemplateUrl = templateUrl;
        if (templateFile && !finalTemplateUrl) {
            finalTemplateUrl = await uploadTemplate();
            setTemplateUrl(finalTemplateUrl);
        }

        const formData = new FormData();
        formData.append('file', excelFile);
        formData.append('eventId', selectedEvent);
        formData.append('templateUrl', finalTemplateUrl);
        formData.append('textX', pos.x);
        formData.append('textY', pos.y);
        formData.append('fontSize', fontSize);
        formData.append('color', color);

        const res = await api.post('/certificates/bulk-issue', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data.success) {
            toast.success(`Processed: ${res.data.summary.success} success, ${res.data.summary.failed} failed`);
            if (res.data.summary.errors.length > 0) {
                console.warn(res.data.summary.errors);
                toast.warning("Check console for some errors in rows");
            }
            onSuccess();
            onClose();
        }
    } catch (err) {
        console.error(err);
        toast.error("Bulk issue failed");
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}><X /></CloseButton>
        <Title>Bulk Issue Certificates</Title>
        
        <form onSubmit={handleSubmit}>
            <Row>
                <Col>
                    <FormGroup>
                        <Label>Select Event</Label>
                        <Select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)} required>
                            <option value="">Choose...</option>
                            {events.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
                        </Select>
                    </FormGroup>

                    <FormGroup>
                        <Label><ImageIcon size={16} /> Template Image</Label>
                        <FileInput type="file" accept="image/*" onChange={handleTemplateChange} required={!templateUrl} />
                    </FormGroup>

                    <FormGroup>
                        <Label><FileSpreadsheet size={16} /> Excel File (Name, Email)</Label>
                        <FileInput type="file" accept=".xlsx, .xls, .csv" onChange={e => setExcelFile(e.target.files[0])} required />
                    </FormGroup>

                    <FormGroup>
                        <Label>Font Size (px)</Label>
                        <input type="number" value={fontSize} onChange={e => setFontSize(e.target.value)} style={{width:'100%', padding:'0.5rem'}} />
                    </FormGroup>
                    <FormGroup>
                        <Label>Text Color</Label>
                        <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{width:'100%', height: '40px'}} />
                    </FormGroup>
                </Col>

                <Col>
                    <Label>Preview & Position (Click to place name)</Label>
                    <PreviewContainer>
                        {localPreviewUrl ? (
                            <div style={{position:'relative'}}>
                                <PreviewImage ref={imageRef} src={localPreviewUrl} onClick={handleImageClick} />
                                <PreviewText style={{ 
                                    left: `${pos.x}%`, 
                                    top: `${pos.y}%`,
                                    fontSize: `${fontSize}px`,
                                    color: color,
                                    fontFamily: 'Arial, sans-serif'
                                }}>
                                    Your Name Here
                                </PreviewText>
                            </div>
                        ) : (
                            <div style={{padding:'2rem', color:'#9ca3af'}}>Upload a template to preview</div>
                        )}
                    </PreviewContainer>
                </Col>
            </Row>

            <Button type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Generate Certificates'}
            </Button>
        </form>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default BulkIssueModal;

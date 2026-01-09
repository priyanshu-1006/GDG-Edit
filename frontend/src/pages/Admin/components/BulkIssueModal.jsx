import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Check, FileSpreadsheet, Image as ImageIcon, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../../config/api';
import axios from 'axios';

const BulkIssueModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  
  // Form State
  const [isCustomEvent, setIsCustomEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [customEventName, setCustomEventName] = useState('');
  
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
    if ((!isCustomEvent && !selectedEvent) || (isCustomEvent && !customEventName)) {
        toast.error("Please provide Event details");
        return;
    }
    if (!excelFile || (!templateFile && !templateUrl)) {
        toast.error("Please provide valid files");
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
        if (isCustomEvent) {
          formData.append('customEventName', customEventName);
        } else {
          formData.append('eventId', selectedEvent);
        }
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
                toast.warning("Check console for errors in some rows");
            }
            onSuccess();
            onClose();
        }
    } catch (err) {
        console.error(err);
        toast.error("Bulk issue failed. Check inputs.");
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl p-6 md:p-8 flex flex-col max-h-[90vh]">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
            <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Bulk Issue Certificates</h2>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Form Inputs */}
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Issue For:</label>
                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button
                                    type="button"
                                    onClick={() => setIsCustomEvent(false)}
                                    className={`px-3 py-1 text-sm rounded-md transition-all ${!isCustomEvent ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    Existing Event
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCustomEvent(true)}
                                    className={`px-3 py-1 text-sm rounded-md transition-all ${isCustomEvent ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    Custom Event
                                </button>
                            </div>
                        </div>

                        {!isCustomEvent ? (
                            <select 
                                value={selectedEvent} 
                                onChange={e => setSelectedEvent(e.target.value)} 
                                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                required={!isCustomEvent}
                            >
                                <option value="">Select an Event...</option>
                                {events.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
                            </select>
                        ) : (
                            <input 
                                type="text" 
                                placeholder="Enter Custom Event Name (e.g. Hackathon 2025)"
                                value={customEventName}
                                onChange={e => setCustomEventName(e.target.value)}
                                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                required={isCustomEvent}
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            <ImageIcon size={16} className="inline mr-2" /> Template Image (Certificate Layout)
                        </label>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleTemplateChange}
                            required={!templateUrl}
                            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            <FileSpreadsheet size={16} className="inline mr-2" /> Excel File (Columns: 'Name', 'Email')
                        </label>
                        <input 
                            type="file" 
                            accept=".xlsx, .xls, .csv" 
                            onChange={e => setExcelFile(e.target.files[0])}
                            required
                            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900 dark:file:text-green-300 transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Font Size (px)</label>
                            <input 
                                type="number" 
                                value={fontSize} 
                                onChange={e => setFontSize(e.target.value)} 
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Text Color</label>
                            <input 
                                type="color" 
                                value={color} 
                                onChange={e => setColor(e.target.value)} 
                                className="w-full h-10 p-1 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Preview */}
                <div>
                   <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                       Preview and Position (Click image to place text)
                   </label>
                   <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center min-h-[300px]">
                        {localPreviewUrl ? (
                            <div className="relative inline-block w-full">
                                <img 
                                    ref={imageRef} 
                                    src={localPreviewUrl} 
                                    alt="Preview" 
                                    onClick={handleImageClick}
                                    className="w-full h-auto cursor-crosshair display-block"
                                />
                                <div 
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 border border-dashed border-blue-500 bg-white/70 px-2 py-1 pointer-events-none whitespace-nowrap"
                                    style={{ 
                                        left: `${pos.x}%`, 
                                        top: `${pos.y}%`,
                                        fontSize: `${fontSize}px`,
                                        color: color,
                                        fontFamily: 'Arial, sans-serif'
                                    }}
                                >
                                    Student Name
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-400 dark:text-gray-500 flex flex-col items-center">
                                <ImageIcon size={48} className="mb-2 opacity-50" />
                                <p>Upload a template to see preview</p>
                            </div>
                        )}
                   </div>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                       {pos.x.toFixed(1)}% X, {pos.y.toFixed(1)}% Y (Relative to image size)
                   </p>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className={`mt-8 w-full py-3 px-6 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2
                    ${loading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-lg hover:shadow-xl'
                    }`}
            >
                {loading ? (
                    <>Processing...</>
                ) : (
                    <>
                        <Check size={20} /> Generate & Issue Certificates
                    </>
                )}
            </button>
        </form>
      </div>
    </div>
  );
};

export default BulkIssueModal;

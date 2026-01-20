import { useState, useEffect } from "react";
import {
  X,
  Check,
  FileSpreadsheet,
  Image as ImageIcon,
  Upload,
  Edit,
  LayoutTemplate,
  ChevronRight,
  ChevronLeft,
  Download,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import { apiClient, API_BASE_URL } from "../../../utils/apiUtils";
import axios from "axios";
import * as XLSX from "xlsx";
import CertificateDesignerModal from "./CertificateDesignerModal";

const BulkIssueModal = ({ isOpen, onClose, onSuccess }) => {
  // Wizard State
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);

  // Data States
  const [isCustomEvent, setIsCustomEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [customEventName, setCustomEventName] = useState("");

  const [templateFile, setTemplateFile] = useState(null);
  const [templateUrl, setTemplateUrl] = useState("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");

  const [layoutConfig, setLayoutConfig] = useState(null);

  const [excelFile, setExcelFile] = useState(null);
  const [previewData, setPreviewData] = useState(null); // Data for previewing (first row)

  // Legacy state for backward compatibility fallback
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [fontSize, setFontSize] = useState(30);
  const [color, setColor] = useState("#000000");

  const [isDesignerOpen, setIsDesignerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
      // Reset wizard
      setStep(1);
    }
  }, [isOpen]);

  const fetchEvents = async () => {
    try {
      const res = await apiClient.get("/api/events?limit=50&upcoming=false");
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
      setLayoutConfig(null);
    }
  };

  const uploadTemplate = async () => {
    if (!templateFile) return null;
    try {
      const formData = new FormData();
      formData.append("file", templateFile);

      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/api/certificates/upload-template`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return res.data.secure_url || res.data.url;
    } catch (err) {
      console.error("Upload error", err);
      throw new Error("Failed to upload template image");
    }
  };

  const handleDesignerSave = (elements) => {
    setLayoutConfig(elements);
    // Backward compatibility sync
    if (elements.length > 0) {
      const first = elements[0];
      setPos({ x: first.x, y: first.y });
      setFontSize(first.fontSize);
      setColor(first.color);
    }
  };

  const downloadExcelTemplate = () => {
    let fields = ["Name", "Email"];
    if (layoutConfig) {
      layoutConfig.forEach((el) => {
        const match = el.text.match(/\{(.+?)\}/);
        if (match && match[1]) {
          const varName = match[1]
            .replace(/recipient name|name|recipient email|email/gi, "")
            .trim();
          if (varName) fields.push(match[1]); // Keep original case for header
        }
      });
    }

    // Unique fields
    fields = [...new Set(fields.filter((f) => f))];

    // Create one dummy row
    const data = [
      fields.reduce((acc, curr) => ({ ...acc, [curr]: `Example ${curr}` }), {}),
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Recipients");
    XLSX.writeFile(wb, "Certificate_Recipients_Template.xlsx");
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setExcelFile(file);

    // Parse for preview
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsName = wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      const data = XLSX.utils.sheet_to_json(ws);
      if (data && data.length > 0) {
        setPreviewData(data[0]); // Take first row for preview
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleNext = () => {
    if (step === 1) {
      if (
        (!isCustomEvent && !selectedEvent) ||
        (isCustomEvent && !customEventName)
      ) {
        toast.error("Please select an event");
        return;
      }
    }
    if (step === 2 && !templateFile && !templateUrl) {
      toast.error("Please upload a template");
      return;
    }
    if (step === 4 && !excelFile) {
      toast.error("Please upload the recipients Excel file");
      return;
    }
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let finalTemplateUrl = templateUrl;
      if (templateFile && !finalTemplateUrl) {
        finalTemplateUrl = await uploadTemplate();
        setTemplateUrl(finalTemplateUrl);
      }

      const formData = new FormData();
      formData.append("file", excelFile);
      if (isCustomEvent) {
        formData.append("customEventName", customEventName);
      } else {
        formData.append("eventId", selectedEvent);
      }
      formData.append("templateUrl", finalTemplateUrl);

      if (layoutConfig) {
        formData.append("layoutConfig", JSON.stringify(layoutConfig));
      }

      // Fallback
      formData.append("textX", pos.x);
      formData.append("textY", pos.y);
      formData.append("fontSize", fontSize);
      formData.append("color", color);

      const res = await apiClient.post(
        "/api/certificates/bulk-issue",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (res.data.success) {
        toast.success(`Done! ${res.data.summary.success} sent.`);
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error("Correction failed. Check inputs.");
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = ["Event", "Template", "Design", "Data", "Preview"];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header & Steps */}
          <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                New Certificate Run
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center justify-between relative px-2">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-300 -z-10"
                style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
              />

              {stepTitles.map((title, idx) => {
                const stepNum = idx + 1;
                const isActive = step >= stepNum;
                const isCurrent = step === stepNum;
                return (
                  <div
                    key={title}
                    className="flex flex-col items-center gap-2 bg-white dark:bg-gray-900 px-2"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                      }`}
                    >
                      {isActive ? <Check size={14} /> : stepNum}
                    </div>
                    <span
                      className={`text-xs font-medium ${isCurrent ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}
                    >
                      {title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {/* Step 1: Event */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Choose Event
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Which event is this certificate for?
                  </p>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
                  <button
                    onClick={() => setIsCustomEvent(false)}
                    className={`flex-1 py-3 font-semibold rounded-lg transition-all ${!isCustomEvent ? "bg-white dark:bg-gray-700 shadow text-blue-600" : "text-gray-500"}`}
                  >
                    Existing Event
                  </button>
                  <button
                    onClick={() => setIsCustomEvent(true)}
                    className={`flex-1 py-3 font-semibold rounded-lg transition-all ${isCustomEvent ? "bg-white dark:bg-gray-700 shadow text-blue-600" : "text-gray-500"}`}
                  >
                    Custom Event
                  </button>
                </div>

                {!isCustomEvent ? (
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-lg outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">Select an upcoming event...</option>
                    {events.map((ev) => (
                      <option key={ev._id} value={ev._id}>
                        {ev.name} ({new Date(ev.date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Event Name (e.g. AI Hackathon 2025)"
                    value={customEventName}
                    onChange={(e) => setCustomEventName(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-lg outline-none focus:border-blue-500 transition-colors"
                  />
                )}
              </div>
            )}

            {/* Step 2: Template */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Upload Template
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Upload the blank certificate background image (PNG/JPG)
                  </p>
                </div>

                <label className="flex flex-col items-center justify-center w-full h-64 border-3 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group">
                  {localPreviewUrl ? (
                    <img
                      src={localPreviewUrl}
                      alt="Preview"
                      className="h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 group-hover:text-blue-500 transition-colors">
                      <ImageIcon size={64} className="mb-4" />
                      <span className="text-lg font-medium">
                        Click to upload image
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    onChange={handleTemplateChange}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Step 3: Design */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 text-center">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Customize Design
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Add placeholder variables (like {"{Name}"}) and position
                    them.
                  </p>
                </div>

                <div className="p-10 bg-gray-50 dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <LayoutTemplate
                    size={80}
                    className="mx-auto text-blue-500 mb-6"
                  />
                  <button
                    onClick={() => setIsDesignerOpen(true)}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-3 mx-auto"
                  >
                    <Edit size={24} /> Open Certificate Designer
                  </button>

                  {layoutConfig ? (
                    <div className="mt-6 text-green-600 font-medium flex items-center justify-center gap-2">
                      <Check size={20} /> Design Saved ({layoutConfig.length}{" "}
                      variables defined)
                    </div>
                  ) : (
                    <p className="mt-6 text-gray-400 text-sm">
                      No design saved yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Data */}
            {step === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Prepare Recipients
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Download the template based on your design, fill it, and
                    upload.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Download */}
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileSpreadsheet size={32} />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                      1. Download Template
                    </h4>
                    <p className="text-sm text-gray-500 mb-6">
                      Contains headers: Name, Email + your custom variables.
                    </p>
                    <button
                      onClick={downloadExcelTemplate}
                      className="w-full py-3 bg-white dark:bg-gray-800 text-blue-600 font-bold rounded-lg border border-blue-200 dark:border-blue-800 hover:border-blue-400 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={18} /> Download Excel
                    </button>
                  </div>

                  {/* Upload */}
                  <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-2xl border border-green-100 dark:border-green-900/30 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload size={32} />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                      2. Upload Filled Excel
                    </h4>
                    <p className="text-sm text-gray-500 mb-6">
                      Upload the filled Excel file here.
                    </p>
                    <label className="block w-full cursor-pointer group">
                      <div className="w-full py-3 bg-green-600 text-white font-bold rounded-lg group-hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                        <Upload size={18} />{" "}
                        {excelFile ? "Change File" : "Upload File"}
                      </div>
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleExcelUpload}
                        className="hidden"
                      />
                    </label>
                    {excelFile && (
                      <p className="mt-2 text-sm text-green-700 font-medium">
                        {excelFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Preview */}
            {step === 5 && (
              <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Final Preview
                  </h3>
                  <p className="text-gray-500 mt-1">
                    Reviewing 1st row data:{" "}
                    <b>
                      {previewData &&
                        (previewData.Name ||
                          previewData["Recipient Name"] ||
                          "Unknown")}
                    </b>
                  </p>
                </div>

                <div className="flex-1 bg-gray-100 dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 relative overflow-hidden flex items-center justify-center p-4">
                  {localPreviewUrl && layoutConfig ? (
                    <div
                      className="relative shadow-xl max-h-full inline-block"
                      style={{ width: "fit-content" }}
                    >
                      <img
                        src={localPreviewUrl}
                        alt="Preview"
                        className="max-h-[50vh] object-contain block"
                      />
                      {layoutConfig.map((el, idx) => {
                        // Replace text with preview data
                        let content = el.text;
                        if (previewData) {
                          // Regex matches {VarName}
                          content = content.replace(
                            /\{(.+?)\}/g,
                            (match, p1) => {
                              // Special mapping for generic "Name"
                              if (
                                [
                                  "name",
                                  "recipient name",
                                  "recipientname",
                                ].includes(p1.toLowerCase())
                              ) {
                                // Look for Name keys but exclude Team/Event/File
                                const nameKey = Object.keys(previewData).find(
                                  (k) =>
                                    k.toLowerCase().includes("name") &&
                                    !k.toLowerCase().includes("team") &&
                                    !k.toLowerCase().includes("event") &&
                                    !k.toLowerCase().includes("file"),
                                );
                                if (nameKey) return previewData[nameKey];
                              }

                              // default find key in previewData that matches p1 (case insensitive)
                              const key = Object.keys(previewData).find(
                                (k) => k.toLowerCase() === p1.toLowerCase(),
                              );
                              return key ? previewData[key] : match;
                            },
                          );
                        }

                        // Prepare styles
                        let widthStyle = el.width;
                        let fontSizeStyle = Math.max(10, el.fontSize * 0.6); // Font scaling

                        // Heuristic: If width is pixels (number or "300px"), scale it by 0.6 to match preview scale
                        // This prevents fixed-width boxes from being too wide relative to the smaller preview image
                        if (typeof el.width === "number") {
                          widthStyle = `${el.width * 0.6}px`;
                        } else if (
                          typeof el.width === "string" &&
                          !el.width.includes("%")
                        ) {
                          const pxVal = parseFloat(el.width);
                          if (!isNaN(pxVal)) widthStyle = `${pxVal * 0.6}px`;
                        }

                        return (
                          <div
                            key={idx}
                            style={{
                              position: "absolute",
                              left: `${el.x}%`,
                              top: `${el.y}%`,
                              fontSize: `${fontSizeStyle}px`,
                              color: el.color,
                              fontWeight: el.fontWeight,
                              textAlign: el.textAlign,
                              width: widthStyle,
                              transform: "translate(0, 0)",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {content}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p>Preview not available</p>
                  )}
                </div>

                {!previewData && (
                  <div className="mt-4 p-4 bg-yellow-50 text-yellow-700 rounded-xl flex items-center gap-2">
                    <AlertCircle size={20} />
                    <span>
                      Warning: Could not read Excel data for preview. Proceed
                      with caution.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={step === 1 || loading}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors ${step === 1 ? "opacity-0 pointer-events-none" : "text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"}`}
            >
              <ChevronLeft size={20} /> Back
            </button>

            {step < 5 ? (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 active:scale-95 transition-all"
              >
                Next Step <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 flex items-center gap-2 active:scale-95 transition-all"
              >
                {loading ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    Issue Certificates <Check size={20} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <CertificateDesignerModal
        isOpen={isDesignerOpen}
        onClose={() => setIsDesignerOpen(false)}
        imageUrl={localPreviewUrl}
        initialConfig={layoutConfig}
        onSave={handleDesignerSave}
      />
    </>
  );
};

BulkIssueModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};

export default BulkIssueModal;

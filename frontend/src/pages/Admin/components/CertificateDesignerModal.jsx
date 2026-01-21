import { useState, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import {
  X,
  Plus,
  Type,
  Save,
  Trash2,
  GripHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import PropTypes from "prop-types";

const CertificateDesignerModal = ({
  isOpen,
  onClose,
  imageUrl,
  initialConfig,
  onSave,
}) => {
  const [elements, setElements] = useState(
    initialConfig || [
      {
        id: "recipient-name",
        text: "{Name}",
        x: 50,
        y: 50,
        fontSize: 30,
        color: "#000000",
        fontWeight: "bold",
        width: "40%", // Default to percentage for responsiveness
        textAlign: "center",
      },
    ],
  );
  const [selectedId, setSelectedId] = useState(null);
  const containerRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // If initial config changes (or opens fresh), reset
  const imgRef = useRef(null);

  // If initial config changes (or opens fresh), reset
  useEffect(() => {
    if (isOpen) {
      if (
        initialConfig &&
        Array.isArray(initialConfig) &&
        initialConfig.length > 0
      ) {
        try {
          // Deep clone to avoid reference issues
          const clonedConfig = JSON.parse(JSON.stringify(initialConfig));
          console.log(
            "CertificateDesigner: Loading saved config",
            clonedConfig,
          );
          setElements(clonedConfig);
        } catch (err) {
          console.error("CertificateDesigner: Error cloning config", err);
          setElements(initialConfig);
        }
      } else {
        console.log("CertificateDesigner: Loading default config (new/empty)");
        setElements([
          {
            id: "recipient-name",
            text: "{Name}",
            x: 50,
            y: 50,
            fontSize: 30,
            color: "#000000",
            fontWeight: "bold",
            width: "40%",
            textAlign: "center",
          },
        ]);
      }
    }
  }, [isOpen, initialConfig]);

  // Reset load state when image changes, check if already loaded
  useEffect(() => {
    setImageLoaded(false);
    if (imgRef.current && imgRef.current.complete) {
      setImageLoaded(true);
    }
  }, [imageUrl, isOpen]);

  const addTextElement = () => {
    const newId = `text-${Date.now()}`;
    const name = prompt(
      "Enter Variable Name (e.g. Name, Score, Rank):",
      "Name",
    );
    if (!name) return;

    setElements([
      ...elements,
      {
        id: newId,
        text: `{${name}}`,
        x: 50,
        y: 50,
        fontSize: 24,
        color: "#000000",
        fontWeight: "bold",
        width: "30%", // Default percentage
        textAlign: "center",
      },
    ]);
    setSelectedId(newId);
  };

  const updateElement = (id, updates) => {
    setElements(
      elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
    );
  };

  const removeElement = (id) => {
    setElements(elements.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleSave = () => {
    // Calculate relative font size based on image height
    // Use imgRef for accuracy, fallback to container or default 800px
    let referenceH = imgRef.current?.offsetHeight;
    if (!referenceH || referenceH === 0) {
      referenceH = containerRef.current?.offsetHeight || 800;
    }

    console.log(
      "CertificateDesigner: Saving with Reference Height:",
      referenceH,
    );

    const scaledElements = elements.map((el) => {
      // Safety calculation
      let ratio = el.fontSize / referenceH;
      // Sanity check: if ratio is huge (> 0.5 for small font), it means referenceH was likely 0/small
      if (ratio > 0.5) {
        console.warn(
          "CertificateDesigner: Calculated Ratio too large, resetting to default 0.05",
          ratio,
        );
        ratio = 0.05;
      }

      // Calculate Height Ratio
      let hRatio = null;
      if (
        el.height &&
        typeof el.height === "string" &&
        el.height.endsWith("px")
      ) {
        const hPx = parseFloat(el.height);
        if (!isNaN(hPx)) {
          hRatio = hPx / referenceH;
        }
      }

      return {
        ...el,
        fontSizeRatio: ratio,
        heightRatio: hRatio,
      };
    });

    onSave(scaledElements);
    onClose();
  };

  if (!isOpen) return null;

  const selectedElement = elements.find((el) => el.id === selectedId);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 w-full h-full max-w-[95vw] max-h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Type className="text-blue-500" /> Certificate Designer
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
              Drag to move • Resize box • Double click to edit text
            </span>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Save size={18} /> Save Design
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar / Toolbar */}
          <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 overflow-y-auto flex-shrink-0">
            <div className="mb-8">
              <button
                onClick={addTextElement}
                className="w-full py-3 px-4 bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-300 font-medium hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} /> Add Variable Placeholder
              </button>
            </div>

            {selectedElement ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-200">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                    Content
                  </label>
                  <input
                    type="text"
                    value={selectedElement.text}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        text: e.target.value,
                      })
                    }
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Use {"{Name}"} for names.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                      Font Size
                    </label>
                    <input
                      type="number"
                      value={selectedElement.fontSize}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          fontSize: parseInt(e.target.value) || 12,
                        })
                      }
                      className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedElement.color}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            color: e.target.value,
                          })
                        }
                        className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <span className="text-sm font-mono text-gray-500">
                        {selectedElement.color}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                    Alignment
                  </label>
                  <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                    {["left", "center", "right"].map((align) => (
                      <button
                        key={align}
                        onClick={() =>
                          updateElement(selectedElement.id, {
                            textAlign: align,
                          })
                        }
                        className={`flex-1 py-2 rounded-md flex items-center justify-center transition-all ${selectedElement.textAlign === align ? "bg-white dark:bg-gray-600 shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                      >
                        {align === "left" && <AlignLeft size={18} />}
                        {align === "center" && <AlignCenter size={18} />}
                        {align === "right" && <AlignRight size={18} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => removeElement(selectedElement.id)}
                    className="w-full py-2 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} /> Delete Element
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400">
                <GripHorizontal size={48} className="mx-auto mb-4 opacity-20" />
                <p>Select an element on the canvas to edit its properties</p>
              </div>
            )}

            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">
                Instructions
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1.5 list-disc list-inside">
                <li>Drag elements to position them</li>
                <li>Drag corners to resize text area</li>
                <li>Use {"{Name}"} for names</li>
              </ul>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-gray-200 dark:bg-black p-8 overflow-auto flex items-center justify-center relative">
            {imageUrl ? (
              <div
                ref={containerRef}
                className="relative shadow-2xl bg-white select-none inline-block"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "fit-content",
                }}
              >
                <img
                  ref={imgRef}
                  src={imageUrl}
                  alt="Certificate Template"
                  onLoad={() => {
                    // Defer to ensure layout is computed
                    setTimeout(() => setImageLoaded(true), 100);
                  }}
                  className="max-h-[85vh] w-auto object-contain block pointer-events-none"
                  style={{ userSelect: "none" }}
                />

                {imageLoaded &&
                  elements.map((el) => {
                    // Safe guard: Ensure container dimensions are valid
                    const parentW = containerRef.current?.offsetWidth || 0;
                    const parentH = containerRef.current?.offsetHeight || 0;
                    if (!parentW || !parentH) {
                      console.warn(
                        "CertificateDesigner: Parent dimensions 0, skipping render",
                        el.id,
                      );
                      return null;
                    }

                    return (
                      <Rnd
                        key={el.id}
                        position={{
                          x: (el.x / 100) * parentW,
                          y: (el.y / 100) * parentH,
                        }}
                        size={{
                          width:
                            typeof el.width === "string" &&
                            el.width.includes("%")
                              ? el.width
                              : el.width,
                          height: el.height || "auto",
                        }}
                        onDragStop={(e, d) => {
                          // USE VIEWPORT RECTANGLES FOR TOTAL ACCURACY
                          // This bypasses internal library offsets and container quirks
                          if (!imgRef.current) return;

                          const imgRect =
                            imgRef.current.getBoundingClientRect();
                          const elRect = d.node.getBoundingClientRect();

                          const relativeX = elRect.left - imgRect.left;
                          const relativeY = elRect.top - imgRect.top;

                          updateElement(el.id, {
                            x: (relativeX / imgRect.width) * 100,
                            y: (relativeY / imgRect.height) * 100,
                          });
                        }}
                        onResizeStop={(e, direction, ref, delta, position) => {
                          if (!imgRef.current) return;

                          const imgRect =
                            imgRef.current.getBoundingClientRect();
                          const elRect = ref.getBoundingClientRect();

                          // Calculate relative position strictly from visuals
                          const relativeX = elRect.left - imgRect.left;
                          const relativeY = elRect.top - imgRect.top;

                          // Calculate relative width strictly from visuals
                          // Note: elRect.width includes borders, so it matches visual box
                          const widthPct = (elRect.width / imgRect.width) * 100;

                          updateElement(el.id, {
                            width: `${widthPct}%`,
                            height: ref.style.height, // Keep pixels for heightRatio calc later
                            x: (relativeX / imgRect.width) * 100,
                            y: (relativeY / imgRect.height) * 100,
                          });
                        }}
                        onClick={() => setSelectedId(el.id)}
                        className={`border-2 ${selectedId === el.id ? "border-blue-500 z-50" : "border-transparent hover:border-blue-300 z-10"}`}
                        style={{ display: "flex", alignItems: "center" }}
                      >
                        <div
                          style={{
                            fontSize: `${el.fontSize}px`,
                            color: el.color,
                            fontWeight: el.fontWeight,
                            textAlign: el.textAlign || "center",
                            width: "100%",
                            lineHeight: 1.2,
                          }}
                          className="cursor-move whitespace-pre-wrap break-words"
                        >
                          {el.text}
                        </div>
                      </Rnd>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <p>No template image loaded.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

CertificateDesignerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  imageUrl: PropTypes.string,
  initialConfig: PropTypes.array,
  onSave: PropTypes.func.isRequired,
};

export default CertificateDesignerModal;

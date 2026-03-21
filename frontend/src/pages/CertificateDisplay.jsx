import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import styled from "styled-components";

import Header from "../components/Header";
import { Download } from "lucide-react";
import { API_BASE_URL } from "../utils/apiUtils";

const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  margin-top: 7rem;
  text-align: center;
  font-family: "Google Sans", sans-serif;
`;

const CertificateImage = styled.img`
  width: 100%;
  max-width: 700px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
`;

const Canvas = styled.canvas`
  width: 100%;
  max-width: 700px; /* Responsive display */
  height: auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
`;

const ErrorText = styled.h2`
  color: #ea4335;
`;

const SuccessBadge = styled.div`
  display: inline-block;
  padding: 8px 16px;
  background-color: #e6f4ea;
  color: #1e8e3e;
  border-radius: 20px;
  font-weight: bold;
  margin-bottom: 20px;
`;

const CertificateDisplay = () => {
  const { serial } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        console.log(`[Certificate Display] Loading certificate: ${serial}`);
        const res = await fetch(
          `${API_BASE_URL}/api/certificates/verify/${serial}`,
        );
        const result = await res.json();

        if (!res.ok || !result.success) {
          const errorMsg = result.message || "Certificate not found.";
          console.error(`[Certificate Display] Error (${res.status}): ${errorMsg}`);
          throw new Error(errorMsg);
        }
        setData(result.certificate);
      } catch (err) {
        console.error(`[Certificate Display] Failed to load:`, err);
        setError(err.message);
      }
    };

    fetchCertificate();
  }, [serial]);

  // Handle Dynamic Generation
  useEffect(() => {
    if (data && data.isDynamic && data.certificateUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = data.certificateUrl.startsWith("/")
        ? API_BASE_URL + data.certificateUrl
        : data.certificateUrl;

      img.onload = () => {
        // Set canvas resolution to image resolution
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw Template
        ctx.drawImage(img, 0, 0);

        // Helper to render a single text element
        // Helper to render a single text element with Wrapping
        const renderText = (el, data) => {
          const {
            text,
            content,
            x,
            y,
            fontSize,
            color,
            fontWeight,
            textAlign,
            width,
            fontSizeRatio,
            heightRatio,
            id,
          } = el;

          const recipientName =
            data.recipientName || data.user?.name || "Valued Member";
          const recipientEmail = data.recipientEmail || data.user?.email || "";

          // Support both new and legacy layout element schemas.
          let rawText = "";
          if (typeof text === "string") rawText = text;
          else if (typeof content === "string") rawText = content;

          if (!rawText && typeof id === "string" && /name/i.test(id)) {
            rawText = "{Name}";
          }

          if (!rawText) {
            return { drewName: false };
          }

          // Variable substitution
          const finalText = rawText.replace(/\{(.+?)\}/g, (match, p1) => {
            const keyLC = p1.toLowerCase();
            // Standard Fields
            if (["name", "recipient name", "recipientname"].includes(keyLC)) {
              return recipientName || match;
            }
            if (["email", "recipient email", "recipientemail"].includes(keyLC)) {
              return recipientEmail || match;
            }
            if (["date"].includes(keyLC)) {
              return new Date(data.issuedAt).toLocaleDateString();
            }
            if (["certi id", "certi_id", "certificate id", "certificate_id", "certificateid", "certiid", "id"].includes(keyLC)) {
              return data.certificateCode || data._id || match;
            }
            if (data.extraData) {
              if (data.extraData[p1]) return data.extraData[p1];
              const foundKey = Object.keys(data.extraData).find(
                (k) => k.toLowerCase() === keyLC,
              );
              if (foundKey) return data.extraData[foundKey];
            }
            return match;
          });

          // 1. Calculate Font Size
          let finalFontSize = fontSize;
          if (fontSizeRatio) {
            finalFontSize = fontSizeRatio * img.height;
          } else {
            finalFontSize = (fontSize / 800) * img.height;
          }

          // VISUAL CORRECTION: Canvas text often renders smaller/thinner than DOM text
          // Apply a 1.33 factor (approx pt conversion) to match user expectation from Designer
          finalFontSize = finalFontSize * 1.33;

          // Use a better font stack to match web preview
          ctx.font = `${fontWeight || "normal"} ${finalFontSize}px Inter, Roboto, "Helvetica Neue", Arial, sans-serif`;
          ctx.fillStyle = color || "black";
          ctx.textAlign = textAlign || "center";
          ctx.textBaseline = "middle";

          // 2. Calculate Box Width
          let boxW = 0;
          if (typeof width === "number") {
            boxW = (width / 1000) * img.width;
          } else if (typeof width === "string" && width.includes("%")) {
            boxW = img.width * (parseFloat(width) / 100);
          } else {
            boxW = img.width * 0.4;
          }

          // 3. Calculate Position
          const xLeft = img.width * (x / 100);
          const yTop = img.height * (y / 100);

          // 4. Horizontal Anchor
          let xAnchor = xLeft;
          if (textAlign === "center") {
            xAnchor = xLeft + boxW / 2;
          } else if (textAlign === "right") {
            xAnchor = xLeft + boxW;
          }

          // --- WRAPPING LOGIC ---
          const words = finalText.split(" ");
          let lines = [];
          let currentLine = words[0];

          for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < boxW) {
              currentLine += " " + word;
            } else {
              lines.push(currentLine);
              currentLine = word;
            }
          }
          lines.push(currentLine);

          // 5. Vertical Anchor (Centering the BLOCK of text)
          const lineHeight = finalFontSize * 1.2; // Match CSS line-height
          const totalTextHeight = lines.length * lineHeight;

          let blockYStart = yTop;

          if (heightRatio) {
            const boxH = heightRatio * img.height;
            // Center the entire block within the box
            blockYStart = yTop + (boxH - totalTextHeight) / 2 + lineHeight / 2;
            // Note: adding lineHeight/2 because textBaseline is middle
          } else {
            // Fallback: mostly centering relative to font size itself
            blockYStart = yTop + finalFontSize / 2;
          }

          // Draw each line
          lines.forEach((line, index) => {
            // Calculate vertical position for this line
            // Logic: Start at calculated block start, add line height for each subsequent line
            const lineY = blockYStart + index * lineHeight;

            ctx.fillText(line, xAnchor, lineY);
          });

          const lowerText = rawText.toLowerCase();
          const drewName =
            lowerText.includes("{name}") ||
            lowerText.includes("{recipient name}") ||
            lowerText.includes("{recipientname}") ||
            (typeof id === "string" && /name/i.test(id));

          return { drewName };
        };

        const drawNameFallback = () => {
          const recipientName =
            data.recipientName || data.user?.name || "Valued Member";
          const fallbackFontSize = Math.max(28, img.height * 0.06);
          ctx.font = `700 ${fallbackFontSize}px Inter, Roboto, \"Helvetica Neue\", Arial, sans-serif`;
          ctx.fillStyle = "#000000";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(recipientName, img.width / 2, img.height * 0.52);
        };

        // Handle New Array Format OR Legacy Object Format
        if (Array.isArray(data.positioning)) {
          let hasNameElement = false;

          data.positioning.forEach((el) => {
            try {
              const { drewName } = renderText(el, data);
              if (drewName) hasNameElement = true;
            } catch (renderError) {
              console.error("Failed to render certificate text element", {
                element: el,
                error: renderError,
              });
            }
          });

          if (!hasNameElement) {
            drawNameFallback();
          }
        } else {
          // Legacy Fallback
          const { x, y, fontSize, color } = data.positioning || {
            x: 50,
            y: 50,
            fontSize: 30,
            color: "black",
          };
          const recipientName =
            data.recipientName || data.user?.name || "Valued Member";
          renderText(
            {
              text: recipientName,
              x,
              y,
              fontSize,
              color,
              fontWeight: "bold",
              textAlign: "center",
              width: 300, // Assume legacy default pixel width
            },
            data,
          );
        }
      };
    }
  }, [data]);

  if (error) {
    return (
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <Header />
        <Container>
          <ErrorText>❌ Certificate Not Found</ErrorText>
          <p style={{ marginTop: "20px", color: "#666", fontSize: "16px" }}>
            <strong>Certificate Code:</strong> <code style={{ background: "#f5f5f5", padding: "4px 8px", borderRadius: "4px" }}>{serial}</code>
          </p>
          <p style={{ color: "#666", fontSize: "16px", marginTop: "10px" }}>
            {error}
          </p>
          <p style={{ color: "#866", fontSize: "14px", marginTop: "20px", lineHeight: "1.6" }}>
            <strong>Troubleshooting:</strong><br/>
            • Make sure you've entered the correct certificate code<br/>
            • Check for extra spaces or typos<br/>
            • The certificate code is usually provided in your confirmation email
          </p>
        </Container>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <Header />
        <Container>
          <h3>Loading certificate {serial ? `(${serial})` : ""}...</h3>
        </Container>
      </div>
    );
  }

  const recipient = data.recipientName || data.user?.name || "N/A";
  const eventName = data.event?.name || "GDG Event";

  // Construct absolute URL for display/download
  const finalImageUrl =
    data.certificateUrl && data.certificateUrl.startsWith("/")
      ? `${API_BASE_URL}${data.certificateUrl}`
      : data.certificateUrl;

  const handleDownload = async () => {
    if (data.isDynamic && canvasRef.current) {
      // 1. Dynamic Certificate (Canvas)
      try {
        const dataUrl = canvasRef.current.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `Certificate-${data.certificateCode || "GDG"}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Download failed", err);
        alert("Failed to download certificate. Please try again.");
      }
    } else if (data.certificateUrl) {
      // 2. Static Certificate (Image URL)
      try {
        const response = await fetch(finalImageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Certificate-${data.certificateCode || "GDG"}.png`; // Force PNG ext
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Download failed", err);
        // Fallback to simple new tab open if CORS fails
        window.open(finalImageUrl, "_blank");
      }
    }
  };

  return (
    <div
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Header />
      <Container>
        <SuccessBadge>Certificate Verified ✅</SuccessBadge>
        <p>
          <strong>Recipient:</strong> {recipient}
        </p>
        <p>
          <strong>Event:</strong> {eventName}
        </p>
        <p>
          <strong>Serial No:</strong> {data.certificateCode}
        </p>
        <p>
          <strong>Issued:</strong>{" "}
          {new Date(data.issuedAt).toLocaleDateString()}
        </p>

        {data.isDynamic ? (
          <Canvas ref={canvasRef} />
        ) : (
          <CertificateImage
            src={finalImageUrl}
            alt="Certificate"
            onError={(e) => {
              console.error("Image failed to load:", finalImageUrl);
              // Don't hide it, let the browser show broken icon so we know
            }}
          />
        )}

        <div style={{ marginTop: "20px" }}>
          <button
            onClick={handleDownload}
            style={{
              padding: "12px 24px",
              background: "#4285f4",
              color: "white",
              border: "none",
              borderRadius: "50px", // More rounded for modern look
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow:
                "0 4px 6px rgba(50,50,93,0.11), 0 1px 3px rgba(0,0,0,0.08)",
              transition: "all 0.15s ease",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "translateY(-1px)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            <Download size={20} />
            Download Certificate
          </button>
        </div>
      </Container>
    </div>
  );
};

export default CertificateDisplay;

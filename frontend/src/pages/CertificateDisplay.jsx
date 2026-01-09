import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import Header from "../components/Header";

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
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/certificates/verify/${serial}`);
        const result = await res.json();
        
        if (!res.ok || !result.success) throw new Error(result.message || "Invalid certificate.");
        setData(result.certificate);
      } catch (err) {
        setError(err.message);
      }
    };
    
    fetchCertificate();
  }, [serial]);

  // Handle Dynamic Generation
  useEffect(() => {
    if (data && data.isDynamic && data.certificateUrl && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = data.certificateUrl;
        
        img.onload = () => {
            // Set canvas resolution to image resolution
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw Template
            ctx.drawImage(img, 0, 0);
            
            // Draw Text
            const { x, y, fontSize, color } = data.positioning || { x: 50, y: 50, fontSize: 30, color: 'black' };
            
            // Scale font size relative to image width if needed, or use absolute logic
            // Assuming fontSize stored is in pixels appropriate for the full res image
            ctx.font = `bold ${fontSize}px Arial, sans-serif`;
            ctx.fillStyle = color;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            const xPos = img.width * (x / 100);
            const yPos = img.height * (y / 100);
            
            const recipientName = data.recipientName || data.user?.name || "Valued Member";
            ctx.fillText(recipientName, xPos, yPos);
        };
    }
  }, [data]);

  if (error) {
    return (
        <div style={{minHeight: '100vh', display:'flex', flexDirection:'column'}}>
            <Header/>
            <Container>
                <ErrorText>❌ {error}</ErrorText>
            </Container>
        </div>
    );
  }

  if (!data) {
    return (
        <div style={{minHeight: '100vh', display:'flex', flexDirection:'column'}}>
            <Header/>
            <Container><h3>Loading certificate...</h3></Container>
        </div>
    );
  }

  const recipient = data.recipientName || data.user?.name || "N/A";
  const eventName = data.event?.name || "GDG Event";

  return (
    <div style={{minHeight: '100vh', display:'flex', flexDirection:'column'}}>
    <Header/>
    <Container>
      <SuccessBadge>Certificate Verified ✅</SuccessBadge>
      <p><strong>Recipient:</strong> {recipient}</p>
      <p><strong>Event:</strong> {eventName}</p>
      <p><strong>Serial No:</strong> {data.certificateCode}</p>
      <p><strong>Issued:</strong> {new Date(data.issuedAt).toLocaleDateString()}</p>
      
      {data.isDynamic ? (
          <Canvas ref={canvasRef} />
      ) : (
          <CertificateImage src={data.certificateUrl} alt="Certificate" />
      )}
      
      <div style={{marginTop: '20px'}}>
        <button 
            onClick={() => window.print()} 
            style={{
                padding: '10px 20px', 
                background: '#4285f4', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px',
                cursor: 'pointer'
            }}
        >
            Download / Print
        </button>
      </div>
    </Container>
    </div>
  );
};

export default CertificateDisplay;

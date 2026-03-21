import { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

const Verify = styled.div`
  background-color: ${({ theme }) => theme.colors?.background?.primary || "#fff"};
  padding: 1.5rem 2rem;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 400px;
  width: 100%;
  margin: 2rem auto;

  label {
    color: ${({ theme }) => theme.colors?.text?.tertiary || "#555"};
    font-weight: 600;
  }

  input {
    height: 48px;
    padding: 0.5rem 1rem;
    border: 1px solid ${({ theme }) => theme.colors?.border || "#e0e0e0"};
    border-radius: 6px;
    font-size: 1rem;
    background-color: ${({ theme }) => theme.colors?.background?.secondary || "#fff"};
    color: ${({ theme }) => theme.colors?.text?.primary || "#000"};
    width: 100%;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
  }

  button {
    width: 100%;
    background-color: #3b82f6;
    color: white;
    font-weight: 600;
    font-size: 1rem;
    padding: 0.75rem;
    border-radius: 6px;
    transition: background-color 0.3s;
    border: none;
    cursor: pointer;

    &:hover {
      background-color: #2563eb;
    }

    &:disabled {
      background-color: #ccc;
      color: #666;
      border: 1px solid #aaa;
      cursor: not-allowed;
      opacity: 0.6;
    }
  }
`;

const VerificationPage = () => {
  const [serial, setSerial] = useState("");
  const [showQRReader, setShowQRReader] = useState(false);
  const hasScannedRef = useRef(false);
  const navigate = useNavigate();
  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const handleVerify = () => {
    if (serial.trim() === "") {
      alert("Please enter a serial number or scan the QR code.");
      return;
    }
    navigate(`/verification/${serial.trim()}`);
  };

  const handleQRScanSuccess = useCallback((decodedText) => {
    if (!hasScannedRef.current) {
      hasScannedRef.current = true;
      setSerial(decodedText.trim());
      navigate(`/verification/${decodedText.trim()}`);
    }
  }, [navigate]);

  const handleQRScanError = (error) => {
    console.warn("QR Scan Error", error);
  };

  useEffect(() => {
    if (showQRReader && qrRef.current && !html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode("qr-reader");

      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length) {
            const cameraId = devices[0].id;
            html5QrCodeRef.current
              .start(
                cameraId,
                {
                  fps: 10,
                  qrbox: 250,
                },
                handleQRScanSuccess,
                handleQRScanError
              )
              .catch((err) => {
                console.error("Unable to start scanning", err);
                alert("QR scanner initialization failed.");
              });
          }
        })
        .catch((err) => {
          console.error("Camera access error", err);
          alert("No camera found or permission denied.");
        });
    }

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current.clear();
          html5QrCodeRef.current = null;
        });
      }
    };
  }, [showQRReader, handleQRScanSuccess]);

  return (
    <Verify>
      <h3
        style={{
          fontFamily: "Google Sans, sans-serif",
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#3b82f6",
        }}
      >
        Certificate Verification
      </h3>

      <label htmlFor="serial">Enter Serial Number</label>
      <input
        id="serial"
        type="text"
        value={serial}
        onChange={(e) => setSerial(e.target.value)}
        placeholder="e.g., GDG-IT23A06"
      />

      <button onClick={handleVerify}>Verify Now</button>

      <button
        onClick={() => {
          hasScannedRef.current = false;
          setShowQRReader((prev) => !prev);
        }}
      >
        {showQRReader ? "Close QR Scanner" : "Scan QR Code"}
      </button>

      {showQRReader && (
        <div
          id="qr-reader"
          ref={qrRef}
          style={{
            marginTop: "1rem",
            width: "100%",
            maxWidth: "350px",
            height: "300px",
          }}
        />
      )}
    </Verify>
  );
};

export default VerificationPage;

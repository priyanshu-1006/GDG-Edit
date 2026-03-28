import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Send, CheckCircle, AlertCircle, Loader2, Heart } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// 🔹 Styled Components
const FormContainer = styled.form`
  max-width: 28rem;
  margin: 0 auto;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);

  h2 {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1.5rem;
    text-align: center;
    color: #111827;
  }

  label {
    display: block;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: #374151;
  }

  input, select, textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid #d1d5db;
    background: rgba(255, 255, 255, 0.7);
    color: #111827;
    font-size: 1rem;
    transition: all 0.2s ease;
    margin-bottom: 0.5rem;

    &:focus {
      border-color: #4285f4;
      outline: none;
      box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.2);
    }
  }
`;

const ErrorMessage = styled.p`
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #ea4335;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ErrorBox = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid #fca5a5;
  background: rgba(234, 67, 53, 0.1);
  color: #ea4335;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const SuccessBox = styled.div`
  max-width: 28rem;
  margin: 0 auto;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-align: center;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);

  h3 {
    font-size: 1.5rem;
    font-weight: bold;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  p {
    color: #4b5563;
  }
`;

const SuccessIconWrapper = styled.div`
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1rem;
  border-radius: 50%;
  background: rgba(52, 168, 83, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${pulse} 2s infinite;
`;

const SubmitButton = styled.button`
  width: 100%;
  margin-top: 1.5rem;
  padding: 1rem;
  font-weight: 600;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: white;
  background: linear-gradient(to right, #4285f4, #2563eb);
  transition: all 0.3s ease;
  box-shadow: 0 6px 15px rgba(66, 133, 244, 0.3);

  &:hover:not(:disabled) {
    transform: scale(1.02);
    background: linear-gradient(to right, #2563eb, #4285f4);
    box-shadow: 0 8px 20px rgba(66, 133, 244, 0.4);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    background: linear-gradient(to right, #9ca3af, #6b7280);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

// 🔹 Component
const RSVPForm = ({ eventId, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    branch: '',
    domain: "development",
    message: '',
  });
  const email="shreyat190105@gmail.com";
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle');

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email format';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/rsvp/user`, formData);
      setSubmitStatus('success');
      setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      console.error('Error creating RSVP:', err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (submitStatus === 'success') {
    return (
      <SuccessBox>
        <SuccessIconWrapper>
          {formData.email===email?<Heart size={32} color="#e63946" />:<CheckCircle size={32} color="#34a853" />}
        </SuccessIconWrapper>
        <h3>Registration Successful!</h3>
        <p>Thank you for registering. You'll receive a confirmation email shortly.</p>
      </SuccessBox>
    );
  }

  return (
    <FormContainer onSubmit={handleSubmit}>
      <h2>Reserve Your Spot</h2>

      <div>
        <label>Full Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter your full name"
        />
        {errors.name && (
          <ErrorMessage><AlertCircle size={16} /> {errors.name}</ErrorMessage>
        )}
      </div>

      <div>
        <label>Email Address *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="Enter your email"
        />
        {errors.email && (
          <ErrorMessage><AlertCircle size={16} /> {errors.email}</ErrorMessage>
        )}
      </div>

      <div>
        <label>Branch</label>
        <input
          type="text"
          value={formData.branch}
          onChange={(e) => handleInputChange('branch', e.target.value)}
          placeholder="Your branch (optional)"
        />
      </div>

      <div>
        <label>Domain</label>
        <select
          value={formData.domain}
          onChange={(e) => handleInputChange('domain', e.target.value)}
        >
          <option value="development">Development</option>
          <option value="dsa">DSA/CP</option>
          <option value="dsai">Data Science/AI-ML</option>
          <option value="web3">Web3 and CyberSecurity</option>
          <option value="nontech">Creative Team(UI/UX, Content writing, Graphic Designing, Video editing)</option>
          <option value="management">Management and Outreach</option>

        </select>
      </div>

      <div>
        <label>Any Message for Us</label>
        <textarea
          rows={3}
          value={formData.message}
          onChange={(e) => handleInputChange('message', e.target.value)}
          placeholder="Are You Excited?"
        />
      </div>

      {submitStatus === 'error' && (
        <ErrorBox>
          <AlertCircle size={16} /> You have already registered.
        </ErrorBox>
      )}

      <SubmitButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? <><Loader2 size={20} className="animate-spin" /> Submitting...</> : <><Send size={20} /> Register Now</>}
      </SubmitButton>
    </FormContainer>
  );
};

export default RSVPForm;
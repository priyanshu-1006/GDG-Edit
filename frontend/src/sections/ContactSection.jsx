import React, { useEffect, useState } from 'react';
import { Mail, MapPin, Users } from 'lucide-react';
import './ContactSection.css';
import styled from 'styled-components';
import { API_BASE_URL } from '../config/api';

const Contact = styled.div`
  background-color: ${({ theme }) => theme.colors.background.secondary};
  padding: var(--spacing-lg) 0;
`;

const Container = styled.div`
  width: min(1280px, calc(100% - 2rem));
  margin: 0 auto var(--spacing-lg);
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: var(--font-size-lg);

  h2 {
    text-align: center;
    color: ${({ theme }) => theme.colors.text.primary};
  }
  p {
    text-align: center;
    max-width: 800px;
    margin: 0 auto var(--spacing-lg);
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: var(--font-size-lg);
  }
`;

const ContactGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 1.5rem;
  align-items: stretch;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 0.25rem;
  }
`;

const Info = styled.div`
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: 0 4px 20px var(--shadow-color);
  position: relative;
  overflow: hidden;
  h3 {
    color: ${({ theme }) => theme.colors.text.primary};
  }
  h4 {
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const ContactContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid ${({ theme }) => theme.colors.border || 'rgba(0, 0, 0, 0.08)'};
  height: fit-content;

  h3 {
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: var(--spacing-md);
  }
`;

const ContactForm = styled.form`
  background-color: ${({ theme }) => theme.colors.background.primary};
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);

  label {
    display: block;
    margin-bottom: var(--spacing-xs);
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: var(--font-size-sm);
    font-weight: 500;
  }

  input,
  textarea,
  select {
    width: 100%;
    padding: var(--spacing-sm);
    border: ${({ theme }) => theme.googleColors.borders};
    border-radius: var(--radius-md);
    background-color: ${({ theme }) => theme.colors.background.secondary};
    color: ${({ theme }) => theme.colors.text.secondary};
    transition: border-color var(--transition-short), box-shadow var(--transition-short);
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  }

  input.error,
  textarea.error {
    border-color: var(--accent-color);
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatusMessage = styled.div`
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  border: 1px solid
    ${({ $error }) => ($error ? 'rgba(234, 67, 53, 0.35)' : 'rgba(15, 157, 88, 0.35)')};
  background: ${({ $error }) => ($error ? 'rgba(234, 67, 53, 0.08)' : 'rgba(15, 157, 88, 0.08)')};
  color: ${({ $error }) => ($error ? '#ea4335' : '#0f9d58')};
`;

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    website: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [submittedAt, setSubmittedAt] = useState(Date.now());

  useEffect(() => {
    setSubmittedAt(Date.now());
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setStatusMessage('Sending...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, submittedAt }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Something went wrong');

      setStatusMessage('✅ Your message has been sent successfully!');
      setFormData({ name: '', email: '', subject: '', message: '', website: '' });
      setSubmittedAt(Date.now());
    } catch (err) {
      console.error('Error submitting form:', err.message);
      setStatusMessage('❌ Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  return (
    <Contact id="contact">
      <Container>
        <h2 className="section-title">Get In Touch</h2>
        <p>
          Have questions about GDG MMMUT or interested in collaborating? We'd love to hear from
          you! Reach out to us through any of the channels below.
        </p>

        <ContactGrid>
          {/* Left side */}
          <Info>
            <h3>Contact GDG On Campus MMMUT</h3>

            <div className="contact-method">
              <div className="contact-icon">
                <Mail size={24} />
              </div>
              <div className="contact-details">
                <h4>Email Us</h4>
                <a href="mailto:mmmutdsc@gmail.com">mmmutdsc@gmail.com</a>
              </div>
            </div>

            <div className="contact-method">
              <div className="contact-icon">
                <MapPin size={24} />
              </div>
              <div className="contact-details">
                <h4>Visit Us</h4>
                <p>MMMUT Campus, Gorakhpur, Uttar Pradesh, India</p>
              </div>
            </div>

            <div className="contact-method">
              <div className="contact-icon">
                <Users size={24} />
              </div>
              <div className="contact-details">
                <h4>Join Community</h4>
                <a
                  href="https://gdg.community.dev/gdg-on-campus-madan-mohan-malaviya-university-of-technology-gorakhpur-india/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GDG On Campus MMMUT
                </a>
              </div>
            </div>

            <div className="quick-links">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="/events">Upcoming Events</a></li>
                <li><a href="#about">About GDG On Campus MMMUT</a></li>
                <li><a href="https://gdg.community.dev/" target="_blank" rel="noopener noreferrer">Google Developer Groups</a></li>
                <li><a href="https://developers.google.com/community" target="_blank" rel="noopener noreferrer">GDG Community Page</a></li>
              </ul>
            </div>
          </Info>

          {/* Right side */}
          <ContactContainer className="contact-form-container">
            <h3>We’d Love to Hear from You</h3>

            {statusMessage && (
              <StatusMessage $error={statusMessage.startsWith('❌')}>
                {statusMessage}
              </StatusMessage>
            )}

            <ContactForm onSubmit={handleSubmit} className="contact-form">
              <label htmlFor="website" style={{ position: 'absolute', left: '-9999px' }}>
                Website
              </label>
              <input
                id="website"
                name="website"
                type="text"
                value={formData.website}
                onChange={handleChange}
                autoComplete="off"
                tabIndex={-1}
                style={{ position: 'absolute', left: '-9999px' }}
              />

              <FormGroup className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                  placeholder="Enter your full name"
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </FormGroup>

              <FormGroup className="form-group">
                <label htmlFor="email">Your Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="you@mmmut.ac.in"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </FormGroup>

              <FormGroup className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={errors.subject ? 'error' : ''}
                  placeholder="Your Subject"
                />
                {errors.subject && <span className="error-message">{errors.subject}</span>}
              </FormGroup>

              <FormGroup className="form-group">
                <label htmlFor="message">Your Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  className={errors.message ? 'error' : ''}
                  placeholder="Write your message here..."
                ></textarea>
                {errors.message && <span className="error-message">{errors.message}</span>}
              </FormGroup>

              <button
                type="submit"
                className={`btn btn-primary submit-btn ${isSubmitting ? 'submitting' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </ContactForm>
          </ContactContainer>
        </ContactGrid>
      </Container>
    </Contact>
  );
};

export default ContactSection;

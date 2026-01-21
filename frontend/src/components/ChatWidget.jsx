import { useState, useRef, useEffect, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import { X, Send, Minus, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { apiClient } from "../utils/apiUtils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "../contexts/ThemeContext";
import PropTypes from "prop-types";

// ============================================
// GOOGLE COLORS
// ============================================
const GOOGLE_COLORS = {
  blue: "#4285F4",
  red: "#EA4335",
  yellow: "#FBBC05",
  green: "#34A853",
};

// ============================================
// CUSTOM GDG CHATBOT ICON COMPONENT
// ============================================
// Google "G" Logo for Header
const GoogleGIcon = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M24 9.5C19.2 9.5 14.9 11.7 12 15.1L16.7 18.9C17.9 16.3 20.7 14.5 24 14.5C26.2 14.5 28.2 15.3 29.7 16.7L33.9 12.5C31.3 10.4 27.8 9.5 24 9.5Z"
      fill={GOOGLE_COLORS.red}
    />
    <path
      d="M12 15.1C10.2 17.5 9.5 20.6 9.5 24C9.5 27.4 10.2 30.5 12 32.9L16.7 29.1C15.9 27.6 15.5 25.9 15.5 24C15.5 22.1 15.9 20.4 16.7 18.9L12 15.1Z"
      fill={GOOGLE_COLORS.yellow}
    />
    <path
      d="M24 38.5C20.7 38.5 17.9 36.7 16.7 34.1L12 37.9C14.9 41.3 19.2 43.5 24 43.5C27.8 43.5 31.3 42.6 33.9 40.5L29.9 36.8C28.4 37.8 26.3 38.5 24 38.5Z"
      fill={GOOGLE_COLORS.green}
    />
    <path
      d="M38.5 24C38.5 22.8 38.4 21.7 38.2 20.5H24V28H32.3C31.6 30.3 30.1 32.2 29.9 36.8L33.9 40.5C36.9 37.7 38.5 33.5 38.5 24Z"
      fill={GOOGLE_COLORS.blue}
    />
  </svg>
);

GoogleGIcon.propTypes = {
  size: PropTypes.number,
};

const GDGChatIcon = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Google "G" with chat bubble background */}
    <circle cx="24" cy="24" r="20" fill="white" />
    {/* Google G Logo */}
    <path
      d="M24 13C18.5 13 13.8 16.2 11.5 20.8L17.3 25.5C18.8 21.8 21.2 19 24 19C26.6 19 28.9 20.2 30.8 22L36 16.8C32.8 14.2 28.6 13 24 13Z"
      fill={GOOGLE_COLORS.red}
    />
    <path
      d="M11.5 20.8C10.2 22.8 9.5 25.3 9.5 28C9.5 30.7 10.2 33.2 11.5 35.2L17.3 30.5C16.5 28.8 16 26.9 16 25C16 23.1 16.5 21.2 17.3 19.5L11.5 20.8Z"
      fill={GOOGLE_COLORS.yellow}
    />
    <path
      d="M24 41C21.2 41 18.8 39.2 17.3 36.5L11.5 41.2C13.8 45.8 18.5 49 24 49C28.6 49 32.8 47.8 36 45.2L31.2 40.4C29.3 41.2 27 41 24 41Z"
      fill={GOOGLE_COLORS.green}
    />
    <path
      d="M38.5 28C38.5 26.4 38.3 24.8 38 23.5H24V33H32.8C31.8 36.2 30.5 38.5 31.2 40.4L36 45.2C40.2 41.5 42.5 35.5 38.5 28Z"
      fill={GOOGLE_COLORS.blue}
    />
  </svg>
);

GDGChatIcon.propTypes = {
  size: PropTypes.number,
};

const GDGChatIconDark = ({ size = 28 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Google "G" with dark background */}
    <circle cx="24" cy="24" r="20" fill="#1e293b" />
    {/* Google G Logo - brighter colors for dark theme */}
    <path
      d="M24 13C18.5 13 13.8 16.2 11.5 20.8L17.3 25.5C18.8 21.8 21.2 19 24 19C26.6 19 28.9 20.2 30.8 22L36 16.8C32.8 14.2 28.6 13 24 13Z"
      fill="#F28B82"
    />
    <path
      d="M11.5 20.8C10.2 22.8 9.5 25.3 9.5 28C9.5 30.7 10.2 33.2 11.5 35.2L17.3 30.5C16.5 28.8 16 26.9 16 25C16 23.1 16.5 21.2 17.3 19.5L11.5 20.8Z"
      fill="#FDE293"
    />
    <path
      d="M24 41C21.2 41 18.8 39.2 17.3 36.5L11.5 41.2C13.8 45.8 18.5 49 24 49C28.6 49 32.8 47.8 36 45.2L31.2 40.4C29.3 41.2 27 41 24 41Z"
      fill="#81C995"
    />
    <path
      d="M38.5 28C38.5 26.4 38.3 24.8 38 23.5H24V33H32.8C31.8 36.2 30.5 38.5 31.2 40.4L36 45.2C40.2 41.5 42.5 35.5 38.5 28Z"
      fill="#8AB4F8"
    />
  </svg>
);

GDGChatIconDark.propTypes = {
  size: PropTypes.number,
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

const generateSessionId = () => {
  return (
    "chat_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).substring(2, 9)
  );
};

const getSessionId = () => {
  const STORAGE_KEY = "gdg_chat_session";
  let sessionId = localStorage.getItem(STORAGE_KEY);
  const sessionTime = localStorage.getItem(STORAGE_KEY + "_time");
  const now = Date.now();

  if (
    !sessionId ||
    !sessionTime ||
    now - parseInt(sessionTime) > 24 * 60 * 60 * 1000
  ) {
    sessionId = generateSessionId();
    localStorage.setItem(STORAGE_KEY, sessionId);
    localStorage.setItem(STORAGE_KEY + "_time", now.toString());
  }

  return sessionId;
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// ============================================
// STYLED COMPONENTS
// ============================================

const WidgetContainer = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-family: "Google Sans", "Inter", sans-serif;
`;

const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
`;

const pulseRing = keyframes`
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.4); opacity: 0; }
`;

const colorRotate = keyframes`
  0% { box-shadow: 0 4px 20px rgba(66, 133, 244, 0.4); }
  25% { box-shadow: 0 4px 20px rgba(234, 67, 53, 0.4); }
  50% { box-shadow: 0 4px 20px rgba(251, 188, 5, 0.4); }
  75% { box-shadow: 0 4px 20px rgba(52, 168, 83, 0.4); }
  100% { box-shadow: 0 4px 20px rgba(66, 133, 244, 0.4); }
`;

const ToggleButton = styled.button`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${(props) =>
    props.$isDark
      ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
      : "linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)"};
  color: white;
  border: 2px solid transparent;
  background-clip: padding-box;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: ${floatAnimation} 3s ease-in-out infinite;

  /* Google colors border gradient */
  &::before {
    content: "";
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: conic-gradient(
      from 0deg,
      ${GOOGLE_COLORS.blue},
      ${GOOGLE_COLORS.red},
      ${GOOGLE_COLORS.yellow},
      ${GOOGLE_COLORS.green},
      ${GOOGLE_COLORS.blue}
    );
    z-index: -1;
    animation: ${colorRotate} 4s linear infinite;
  }

  /* Pulse ring effect */
  &::after {
    content: "";
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    border: 2px solid ${GOOGLE_COLORS.blue};
    animation: ${pulseRing} 2s ease-out infinite;
    pointer-events: none;
  }

  &:hover {
    transform: scale(1.1);
    animation: none;

    &::after {
      animation: none;
      opacity: 0;
    }
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus {
    outline: 2px solid ${GOOGLE_COLORS.blue};
    outline-offset: 4px;
  }

  ${(props) =>
    props.$isOpen &&
    css`
      animation: none;
      background: linear-gradient(
        135deg,
        ${GOOGLE_COLORS.blue},
        ${GOOGLE_COLORS.green}
      );

      &::before {
        display: none;
      }

      &::after {
        display: none;
      }
    `}
`;

const ChatWindow = styled.div`
  width: 400px;
  height: 580px;
  background: var(--background, #ffffff);
  border-radius: var(--radius-lg, 16px);
  box-shadow:
    0 20px 40px var(--shadow-color-strong, rgba(0, 0, 0, 0.15)),
    0 0 0 1px var(--border-color, rgba(0, 0, 0, 0.05));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 16px;
  transform-origin: bottom right;
  animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  @keyframes popIn {
    from {
      opacity: 0;
      transform: scale(0.8) translateY(20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @media (max-width: 480px) {
    width: calc(100vw - 32px);
    height: 85vh;
    border-radius: var(--radius-lg, 16px);
  }
`;

const Header = styled.div`
  padding: 16px 20px;
  background: linear-gradient(
    135deg,
    ${GOOGLE_COLORS.blue} 0%,
    #1a73e8 50%,
    ${GOOGLE_COLORS.green} 100%
  );
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;

  /* Decorative dots */
  &::before {
    content: "";
    position: absolute;
    top: -20px;
    right: -20px;
    width: 80px;
    height: 80px;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 70%
    );
    border-radius: 50%;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: -30px;
    left: 20%;
    width: 60px;
    height: 60px;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.08) 0%,
      transparent 70%
    );
    border-radius: 50%;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1;
`;

const HeaderAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const HeaderTitle = styled.div`
  font-weight: 600;
  font-size: 16px;
  letter-spacing: -0.01em;
`;

const HeaderStatus = styled.div`
  font-size: 12px;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: "";
    width: 8px;
    height: 8px;
    background: ${GOOGLE_COLORS.green};
    border-radius: 50%;
    box-shadow: 0 0 8px ${GOOGLE_COLORS.green};
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  z-index: 1;
`;

const HeaderButton = styled.button`
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md, 8px);
  transition: all 0.2s;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: scale(1.05);
  }

  &:focus {
    outline: 2px solid white;
    outline-offset: 2px;
  }
`;

const MessagesArea = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--surface, #f8f9fa);

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-color, #dadce0);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--text-tertiary, #80868b);
  }
`;

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
`;

const MessageBubble = styled.div`
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  position: relative;
  word-wrap: break-word;

  ${(props) =>
    props.$isUser
      ? css`
          background: linear-gradient(135deg, ${GOOGLE_COLORS.blue}, #1a73e8);
          color: white;
          border-bottom-right-radius: 4px;
          box-shadow: 0 2px 8px rgba(66, 133, 244, 0.3);
        `
      : css`
          background: var(--surface-elevated, #ffffff);
          color: var(--text-primary, #202124);
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 3px var(--shadow-color, rgba(0, 0, 0, 0.1));
          border: 1px solid var(--border-color, #dadce0);
        `}

  /* Markdown styling */
  p {
    margin: 0 0 8px 0;
    &:last-child {
      margin-bottom: 0;
    }
  }

  a {
    color: ${(props) => (props.$isUser ? "#a5d6ff" : GOOGLE_COLORS.blue)};
    text-decoration: underline;
    &:hover {
      text-decoration: none;
    }
  }

  ul,
  ol {
    margin: 4px 0;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }

  strong {
    font-weight: 600;
  }

  code {
    background: ${(props) =>
      props.$isUser
        ? "rgba(255,255,255,0.2)"
        : "var(--surface-variant, #e8eaed)"};
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
  }
`;

const MessageTime = styled.span`
  font-size: 11px;
  color: var(--text-tertiary, #80868b);
  margin-top: 4px;
  padding: 0 4px;
`;

const FeedbackContainer = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 6px;
`;

const FeedbackButton = styled.button`
  background: var(--surface-variant, #e8eaed);
  border: none;
  padding: 6px 10px;
  cursor: pointer;
  color: var(--text-secondary, #5f6368);
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  border-radius: var(--radius-full, 9999px);
  transition: all 0.2s;

  &:hover {
    background: ${(props) =>
      props.$positive ? "rgba(52, 168, 83, 0.15)" : "rgba(234, 67, 53, 0.15)"};
    color: ${(props) =>
      props.$positive ? GOOGLE_COLORS.green : GOOGLE_COLORS.red};
  }

  &.active {
    background: ${(props) =>
      props.$positive ? GOOGLE_COLORS.green : GOOGLE_COLORS.red};
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const InputArea = styled.div`
  padding: 16px;
  border-top: 1px solid var(--border-color, #dadce0);
  background: var(--background, #ffffff);
  display: flex;
  gap: 12px;
  align-items: center;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 18px;
  border-radius: var(--radius-full, 9999px);
  border: 2px solid var(--border-color, #dadce0);
  outline: none;
  font-size: 14px;
  transition: all 0.2s;
  background: var(--surface, #f8f9fa);
  color: var(--text-primary, #202124);

  &::placeholder {
    color: var(--text-tertiary, #80868b);
  }

  &:focus {
    border-color: ${GOOGLE_COLORS.blue};
    background: var(--background, #ffffff);
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  }
`;

const SendButton = styled.button`
  background: linear-gradient(135deg, ${GOOGLE_COLORS.blue}, #1a73e8);
  color: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(66, 133, 244, 0.3);

  &:disabled {
    background: var(--border-color, #dadce0);
    box-shadow: none;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:focus {
    outline: 2px solid ${GOOGLE_COLORS.blue};
    outline-offset: 2px;
  }
`;

const bounceAnimation = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 5px;
  padding: 14px 18px;
  background: var(--surface-elevated, #ffffff);
  border-radius: 18px;
  align-self: flex-start;
  border: 1px solid var(--border-color, #dadce0);
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 3px var(--shadow-color, rgba(0, 0, 0, 0.1));

  span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: ${bounceAnimation} 1.4s infinite ease-in-out both;

    &:nth-child(1) {
      background: ${GOOGLE_COLORS.blue};
      animation-delay: -0.32s;
    }
    &:nth-child(2) {
      background: ${GOOGLE_COLORS.red};
      animation-delay: -0.16s;
    }
    &:nth-child(3) {
      background: ${GOOGLE_COLORS.green};
      animation-delay: 0s;
    }
  }
`;

const QuickStartContainer = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const WelcomeMessage = styled.div`
  background: var(--surface-elevated, #ffffff);
  border-radius: 18px;
  padding: 16px;
  border: 1px solid var(--border-color, #dadce0);
  box-shadow: 0 1px 3px var(--shadow-color, rgba(0, 0, 0, 0.1));
  border-bottom-left-radius: 4px;
`;

const WelcomeEmoji = styled.span`
  font-size: 28px;
  display: block;
  margin-bottom: 8px;
`;

const WelcomeTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #202124);
`;

const WelcomeText = styled.p`
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary, #5f6368);
  line-height: 1.5;
`;

const QuickStartTitle = styled.h4`
  margin: 0;
  font-size: 12px;
  color: var(--text-tertiary, #80868b);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const QuickStartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const QuickStartButton = styled.button`
  background: var(--surface-elevated, #ffffff);
  border: 1px solid var(--border-color, #dadce0);
  border-radius: var(--radius-md, 12px);
  padding: 14px 12px;
  font-size: 13px;
  color: var(--text-secondary, #5f6368);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 10px;

  &:hover {
    background: var(--surface, #f8f9fa);
    border-color: ${GOOGLE_COLORS.blue};
    color: var(--text-primary, #202124);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--shadow-color, rgba(0, 0, 0, 0.1));
  }

  &:active {
    transform: translateY(0);
  }
`;

const QuickStartEmoji = styled.span`
  font-size: 20px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface, #f8f9fa);
  border-radius: var(--radius-md, 8px);
`;

const ChipsContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  overflow-x: auto;
  white-space: nowrap;
  border-top: 1px solid var(--border-color, #dadce0);
  background: var(--surface, #f8f9fa);

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ChipButton = styled.button`
  background: var(--surface-elevated, #ffffff);
  border: 1px solid var(--border-color, #dadce0);
  border-radius: var(--radius-full, 9999px);
  padding: 8px 14px;
  font-size: 12px;
  color: var(--text-secondary, #5f6368);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: ${GOOGLE_COLORS.blue};
    border-color: ${GOOGLE_COLORS.blue};
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorBanner = styled.div`
  background: rgba(234, 67, 53, 0.1);
  border-top: 1px solid rgba(234, 67, 53, 0.2);
  color: ${GOOGLE_COLORS.red};
  padding: 12px 16px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const RetryButton = styled.button`
  background: ${GOOGLE_COLORS.red};
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: var(--radius-full, 9999px);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    background: #d93025;
    transform: scale(1.02);
  }
`;

// ============================================
// MAIN COMPONENT
// ============================================

const ChatWidget = () => {
  const { isDarkTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => getSessionId());
  const [error, setError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = useCallback(
    async (textOverride) => {
      const textToSend =
        typeof textOverride === "string" ? textOverride : inputValue;
      if (!textToSend.trim()) return;

      setShowWelcome(false);
      setError(null);

      const messageId = Date.now().toString();
      const userMsg = {
        id: messageId,
        text: textToSend,
        isUser: true,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputValue("");
      setIsLoading(true);

      try {
        const res = await apiClient.post("/api/chat", {
          message: userMsg.text,
          sessionId: sessionId,
        });

        if (res.data.success) {
          const botMsgId = Date.now().toString();
          setMessages((prev) => [
            ...prev,
            {
              id: botMsgId,
              text: res.data.response,
              isUser: false,
              timestamp: new Date().toISOString(),
              queryType: res.data.queryType,
              sources: res.data.context?.slice(0, 3),
            },
          ]);
        } else {
          throw new Error(res.data.message || "Unknown error");
        }
      } catch (err) {
        console.error("Chat Error", err);

        let errorMsg = "Something went wrong. Please try again.";
        if (err.response?.status === 503) {
          errorMsg =
            "The chatbot is currently unavailable. Please try again later.";
        } else if (err.response?.status === 429) {
          errorMsg =
            "You're sending messages too quickly. Please wait a moment.";
        } else if (err.response?.status === 400) {
          errorMsg = err.response.data?.message || "Invalid message format.";
        }

        setError({ message: errorMsg, retryText: textToSend });
      } finally {
        setIsLoading(false);
      }
    },
    [inputValue, sessionId],
  );

  const handleRetry = () => {
    if (error?.retryText) {
      handleSend(error.retryText);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFeedback = async (messageId, isPositive) => {
    try {
      setFeedbackGiven((prev) => ({
        ...prev,
        [messageId]: isPositive ? "up" : "down",
      }));

      await apiClient.post("/api/chat/feedback", {
        messageId,
        feedback: isPositive ? "positive" : "negative",
        sessionId,
      });
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setShowWelcome(true);
    setError(null);
    setFeedbackGiven({});
    localStorage.removeItem("gdg_chat_session");
    localStorage.removeItem("gdg_chat_session_time");
  };

  const quickStartOptions = [
    { emoji: "📅", text: "Upcoming events" },
    { emoji: "👥", text: "Meet the team" },
    { emoji: "🚀", text: "How to join" },
    { emoji: "💬", text: "Contact us" },
  ];

  return (
    <WidgetContainer>
      {isOpen && (
        <ChatWindow
          role="dialog"
          aria-label="GDG Assistant Chat"
          aria-modal="true"
        >
          <Header>
            <HeaderContent>
              <HeaderAvatar>
                <GoogleGIcon size={32} />
              </HeaderAvatar>
              <HeaderInfo>
                <HeaderTitle>GDG Assistant</HeaderTitle>
                <HeaderStatus>Online • Ready to help</HeaderStatus>
              </HeaderInfo>
            </HeaderContent>
            <HeaderActions>
              <HeaderButton
                onClick={handleNewChat}
                title="New conversation"
                aria-label="Start new conversation"
              >
                <RefreshCw size={18} />
              </HeaderButton>
              <HeaderButton
                onClick={() => setIsOpen(false)}
                aria-label="Minimize chat"
              >
                <Minus size={18} />
              </HeaderButton>
            </HeaderActions>
          </Header>

          <MessagesArea
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {showWelcome && messages.length === 0 && (
              <QuickStartContainer>
                <WelcomeMessage>
                  <WelcomeEmoji>👋</WelcomeEmoji>
                  <WelcomeTitle>
                    Hi there! I&apos;m the GDG Assistant
                  </WelcomeTitle>
                  <WelcomeText>
                    I can help you learn about GDG MMMUT, our events, team
                    members, and how to get involved in our community!
                  </WelcomeText>
                </WelcomeMessage>
                <QuickStartTitle>Quick Questions</QuickStartTitle>
                <QuickStartGrid>
                  {quickStartOptions.map((opt) => (
                    <QuickStartButton
                      key={opt.text}
                      onClick={() => handleSend(opt.text)}
                      aria-label={opt.text}
                    >
                      <QuickStartEmoji>{opt.emoji}</QuickStartEmoji>
                      <span>{opt.text}</span>
                    </QuickStartButton>
                  ))}
                </QuickStartGrid>
              </QuickStartContainer>
            )}

            {messages.map((msg) => (
              <MessageWrapper key={msg.id} $isUser={msg.isUser}>
                <MessageBubble $isUser={msg.isUser}>
                  {msg.isUser ? (
                    msg.text
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  )}
                </MessageBubble>
                <MessageTime>{formatTime(msg.timestamp)}</MessageTime>

                {!msg.isUser && (
                  <FeedbackContainer>
                    <FeedbackButton
                      $positive
                      onClick={() => handleFeedback(msg.id, true)}
                      className={feedbackGiven[msg.id] === "up" ? "active" : ""}
                      aria-label="This was helpful"
                      disabled={!!feedbackGiven[msg.id]}
                    >
                      <ThumbsUp size={12} />
                      <span>Helpful</span>
                    </FeedbackButton>
                    <FeedbackButton
                      onClick={() => handleFeedback(msg.id, false)}
                      className={
                        feedbackGiven[msg.id] === "down" ? "active" : ""
                      }
                      aria-label="This was not helpful"
                      disabled={!!feedbackGiven[msg.id]}
                    >
                      <ThumbsDown size={12} />
                    </FeedbackButton>
                  </FeedbackContainer>
                )}
              </MessageWrapper>
            ))}

            {isLoading && (
              <TypingIndicator aria-label="Assistant is typing">
                <span></span>
                <span></span>
                <span></span>
              </TypingIndicator>
            )}
            <div ref={messagesEndRef} />
          </MessagesArea>

          {error && (
            <ErrorBanner role="alert">
              <span>{error.message}</span>
              <RetryButton onClick={handleRetry}>
                <RefreshCw size={12} />
                Retry
              </RetryButton>
            </ErrorBanner>
          )}

          {!showWelcome && (
            <ChipsContainer>
              {[
                "Upcoming Events?",
                "Who leads the team?",
                "How to join?",
                "Contact Info",
              ].map((q) => (
                <ChipButton
                  key={q}
                  onClick={() => handleSend(q)}
                  disabled={isLoading}
                >
                  {q}
                </ChipButton>
              ))}
            </ChipsContainer>
          )}

          <InputArea>
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              aria-label="Type your message"
              disabled={isLoading}
            />
            <SendButton
              onClick={() => handleSend()}
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message"
            >
              <Send size={18} />
            </SendButton>
          </InputArea>
        </ChatWindow>
      )}
      <ToggleButton
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close chat" : "Open chat with GDG Assistant"}
        aria-expanded={isOpen}
        $isDark={isDarkTheme}
        $isOpen={isOpen}
      >
        {isOpen ? (
          <X size={28} color="white" />
        ) : isDarkTheme ? (
          <GDGChatIconDark size={40} />
        ) : (
          <GDGChatIcon size={40} />
        )}
      </ToggleButton>
    </WidgetContainer>
  );
};

export default ChatWidget;

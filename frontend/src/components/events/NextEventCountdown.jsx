import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import PropTypes from 'prop-types';


const Countdown = styled(motion.div)`
  
    background-color: ${({ theme }) => theme.colors.background.primary}; /* Equivalent to bg-gray-50 */
  color: ${({ theme }) => theme.colors.text.primary}; /* Optional dark mode handling */
  border-radius: 1rem; /* Equivalent to rounded-2xl */
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1); /* Equivalent to shadow-lg */
  overflow: hidden;
  padding-left: 2rem;
  padding-right: 4rem;
  ${({ theme }) =>
    theme.isDark &&
    `
    background-color: ${theme.colors.background.secondary || "#2d3748"}; /* Equivalent to dark:bg-dark-200 */
  `
  }
  h3{
    font-size: 1.5rem; /* text-2xl */
  font-weight: 700; /* font-bold */
  color: ${({ theme }) => theme.googleColors.blue.primary || '#3b82f6'}; /* text-gdg-blue-500 */
  margin-bottom: 0.5rem;
  }
  h4{
     font-size: 1.25rem; /* text-xl */
  color: ${({ theme }) => theme.colors.text.primary || '#1f2937'}; /* text-gray-800 */
  font-weight: 600; /* font-semibold */
  margin-bottom: 1rem; /* mb-4 */

  ${({ theme }) =>
    theme.isDark &&
    `
    color: ${theme.colors.text.secondary || '#e5e7eb'}; /* dark:text-gray-200 */
  `}
  }
  .items{
     display: grid;
  grid-template-columns: repeat(4, 1fr); /* grid-cols-4 */
  gap: 0.5rem; /* gap-2 */
  text-align: center;
  margin-top: 1.5rem; 
  }
`
const CountItem = styled.div`
 font-size: 1.875rem; /* text-3xl */
  font-weight: 700; /* font-bold */
  color: ${({ theme }) => theme.colors.text.primary}; /* text-gray-800 */
  background-color: ${({ theme }) => theme.colors.background.primary || '#ffffff'}; /* bg-white */
  border-radius: 0.5rem; /* rounded-lg */
  padding: 0.75rem 0.25rem; /* py-3 px-1 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); /* shadow-sm */

  ${({ theme }) =>
    theme === "dark" &&
    `
    color: ${theme.colors.text.primary || '#ffffff'}; 
    background-color: ${theme.colors.background.secondary || '#2d3748'}; /* dark:bg-dark-300 */
  `}
`
const Label = styled.div`
  font-size: 0.75rem; /* text-xs */
  margin-top: 0.25rem; /* mt-1 */
  color: ${({ theme }) => theme.colors.text.secondary || '#4b5563'}; /* text-gray-600 */

  ${({ theme }) =>
    theme === "dark" &&
    `
    color: ${theme.colors.text.tertiary || '#9ca3af'}; /* dark:text-gray-400 */
  `}
`
const NextEventCountdown = ({ event }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(event?.date).getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [event?.date]);

  return (
    <Countdown
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ padding: "2rem" }}>
        <h3 >Next Event Countdown</h3>
        <h4>{event?.title}</h4>

        <div className="items">
          <CountdownItem value={timeLeft.days} label="Days" />
          <CountdownItem value={timeLeft.hours} label="Hours" />
          <CountdownItem value={timeLeft.minutes} label="Minutes" />
          <CountdownItem value={timeLeft.seconds} label="Seconds" />
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          {timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0 ? (
            <button className="btn-primary" style={{ width: "full" }} onClick={() => window.location.href = '/induction'}>
              Apply Now →
            </button>
          ) : (
            <button disabled className="btn-primary" style={{ width: "full", opacity: 0.6, cursor: "not-allowed" }}>
              Opens Tomorrow
            </button>
          )}
        </div>
      </div>
    </Countdown>
  );
};


const CountdownItem = ({ value, label }) => (
  <div style={{ display: "flex", flexDirection: "column" }}>
    <CountItem className="text-3xl font-bold text-gray-800 dark:text-white bg-white dark:bg-dark-300 rounded-lg py-3 px-1 shadow-sm">
      {value}
    </CountItem>
    <Label className="text-xs mt-1 text-gray-600 dark:text-gray-400">
      {label}
    </Label>
  </div>
);

CountdownItem.propTypes = {
  value: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
};

NextEventCountdown.propTypes = {
  event: PropTypes.shape({
    date: PropTypes.string,
    title: PropTypes.string,
  }),
};

export default NextEventCountdown;
import { createContext, useContext, useState, useEffect } from 'react';
import { darkTheme, lightTheme } from '../styles/themes';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    // Retrieve the saved theme preference from local storage, or fallback to system preference
    const savedTheme = localStorage.getItem('isDarkTheme');
    return savedTheme !== null
      ? JSON.parse(savedTheme)
      : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const theme = isDarkTheme ? darkTheme : lightTheme;

  useEffect(() => {
    // Save theme preference to local storage whenever it changes
    localStorage.setItem('isDarkTheme', JSON.stringify(isDarkTheme));
    
    // Apply dark mode class to html element for Tailwind
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setIsDarkTheme(e.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setIsDarkTheme((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

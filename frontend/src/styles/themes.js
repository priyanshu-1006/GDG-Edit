// Google's color palette
const googleColors = {
  blue: {
    primary: "#4285F4",
    light: "#8AB4F8",
    dark: "#1A73E8",
    darker: "#0B57D0",
    five: "'#3b82f6'",
  },
  red: {
    primary: "#EA4335",
    light: "#F28B82",
    dark: "#D93025",
    darker: "#B31412",
  },
  yellow: {
    primary: "#FBBC05",
    light: "#FDE293",
    dark: "#F9AB00",
    darker: "#F29900",
  },
  green: {
    primary: "#34A853",
    light: "#81C995",
    dark: "#188038",
    darker: "#0F652F",
  },
  grey: {
    50: "#F8F9FA",
    100: "#F1F3F4",
    200: "#E8EAED",
    300: "#DADCE0",
    400: "#BDC1C6",
    500: "#9AA0A6",
    600: "#80868B",
    700: "#5F6368",
    800: "#1B1C1E",
    900: "#202124",
  },
};

export const lightTheme = {
  name: "light",
  colors: {
    primary: googleColors.blue.primary,
    secondary: googleColors.green.primary,
    accent: googleColors.yellow.primary,
    accent1: googleColors.red,
    accent2: googleColors.yellow,
    error: googleColors.red.primary,
    surface: "#F8F9FA",
    surfaceElevated: "#FFFFFF",

    textSecondary: "#5F6368",
    success: "#188038",
    divider: "rgba(0, 0, 0, 0.12)",
    background: {
      primary: "#FFFFFF",
      secondary: googleColors.grey[50],
      tertiary: googleColors.grey[100],
    },
    text: {
      primary: googleColors.grey[900],
      secondary: googleColors.grey[700],
      tertiary: googleColors.grey[600],
      inverse: "#FFFFFF",
    },
    admin: {
      sidebarBg: "#FFFFFF",
      sidebarText: "#5F6368",
      sidebarBorder: "rgba(0, 0, 0, 0.12)",
      mainBg: "#F3F4F6", // Light gray background
    },
    shadows: {
      small:
        "0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15)",
      medium: "0 2px 6px 2px rgba(60, 64, 67, 0.15)",
      large:
        "0 4px 8px 3px rgba(60, 64, 67, 0.15), 0 1px 3px rgba(60, 64, 67, 0.3)",
    },
    transitions: {
      default: "0.2s ease",
      slow: "0.4s ease",
    },
    borderRadius: {
      small: "4px",
      medium: "8px",
      large: "16px",
      circle: "50%",
    },
    border: googleColors.grey[300],
    shadow: "rgba(60, 64, 67, 0.3)",
    overlay: "rgba(32, 33, 36, 0.1)",
  },
  googleColors,
};

export const darkTheme = {
  name: "dark",
  colors: {
    primary: googleColors.blue.light,
    secondary: googleColors.green.light,
    accent: googleColors.yellow.light,
    error: googleColors.red.light,
    accent1: "#F28B82", // Lighter red for dark mode
    accent2: "#FDD663", // Lighter yellow for dark mode
    surface: "#303134",
    surfaceElevated: "#3C4043",
    textSecondary: "#9AA0A6",
    success: "#81C995",
    divider: "rgba(232, 234, 237, 0.12)",

    background: {
      primary: "#000000",
      secondary: "#0a0a0a",
      tertiary: "#111111",
    },
    text: {
      white: "#ffffff",
      primary: googleColors.grey[50],
      secondary: googleColors.grey[200],
      tertiary: googleColors.grey[400],
      inverse: googleColors.grey[900],
    },
    admin: {
      sidebarBg: "#1B1C1E", // Dark sidebar
      sidebarText: "#E8EAED",
      sidebarBorder: "rgba(255, 255, 255, 0.12)",
      mainBg: "#0F0F0F", // Very dark main background
    },
    border: googleColors.grey[700],
    shadow: "rgba(0, 0, 0, 0.5)",
    overlay: "rgba(0, 0, 0, 0.4)",
    shadows: {
      small:
        "0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15)",
      medium: "0 2px 6px 2px rgba(0, 0, 0, 0.15)",
      large: "0 4px 8px 3px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.3)",
    },
    transitions: {
      default: "0.2s ease",
      slow: "0.4s ease",
    },
    borderRadius: {
      small: "4px",
      medium: "8px",
      large: "16px",
      circle: "50%",
    },
  },
  googleColors,
};

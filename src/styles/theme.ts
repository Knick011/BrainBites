// Updated theme based on the specifications
import { Platform } from 'react-native';

const theme = {
  colors: {
    // Primary colors from the specifications
    primary: '#FF9F1C',       // Primary orange
    secondary: '#FFB347',     // Secondary orange  
    accent: '#5D9CEC',        // Accent blue
    success: '#4CD964',       // Success green (correct answers)
    warning: '#FFCC00',       // Warning yellow
    error: '#FF3B30',         // Error red (incorrect answers)
    
    // Background colors
    background: '#FFF8E7',    // Light cream background
    card: '#FFFFFF',          // White cards
    
    // Text colors
    textDark: '#333333',      // Main text
    textLight: '#FFFFFF',     // White text
    textMuted: '#777777',     // Secondary text
    
    // Light versions for backgrounds
    successLight: 'rgba(76, 217, 100, 0.15)',
    errorLight: 'rgba(255, 59, 48, 0.15)',
    warningLight: 'rgba(255, 204, 0, 0.15)',
    primaryLight: 'rgba(255, 159, 28, 0.15)',
    
    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    // Additional colors for UI elements
    white: '#FFFFFF',
    black: '#000000',
    gray: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    }
  },
  
  typography: {
    fontFamily: {
      regular: Platform.OS === 'ios' ? 'Avenir' : 'Roboto',
      medium: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto-Medium',
      bold: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto-Bold',
      black: Platform.OS === 'ios' ? 'Avenir-Black' : 'Roboto-Black',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  borderRadius: {
    none: 0,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    full: 9999,
  },
  
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.22,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    // Special orange shadow for buttons
    primary: {
      shadowColor: 'rgba(255, 159, 28, 0.4)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  
  animation: {
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 1000,
  },
  
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modalBackdrop: 40,
    mascot: 50,
    modal: 60,
    popover: 70,
    tooltip: 80,
    notification: 90,
    maximum: 99,
  },
};

export default theme;
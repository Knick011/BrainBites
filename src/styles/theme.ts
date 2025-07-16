// src/styles/theme.ts
export default {
  colors: {
    primary: '#FF9F1C',
    primaryDark: '#E8890A',
    primaryLight: '#FFB84D',
    secondary: '#4A90E2',
    accent: '#50C878',
    
    // Quiz Colors (matching your image)
    quizPrimary: '#FF9F1C',
    quizSecondary: '#FFB84D', 
    quizTertiary: '#FFD07B',
    
    // Background colors
    background: '#FAFAFA',
    backgroundLight: '#FFFFFF',
    backgroundDark: '#F5F5F5',
    
    // Text colors
    textPrimary: '#333333',
    textSecondary: '#666666',
    textLight: '#999999',
    textDark: '#1A1A1A',
    textWhite: '#FFFFFF',
    
    // Status colors
    success: '#4CAF50',
    successLight: '#E8F5E8',
    error: '#F44336',
    errorLight: '#FFEBEE',
    warning: '#FF9800',
    warningLight: '#FFF3E0',
    info: '#2196F3',
    infoLight: '#E3F2FD',
    
    // Option colors for quiz
    optionDefault: '#F5F5F5',
    optionSelected: '#E3F2FD',
    optionCorrect: '#E8F5E8',
    optionIncorrect: '#FFEBEE',
    
    // Neutral colors
    white: '#FFFFFF',
    black: '#000000',
    gray: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    
    // Card colors
    card: '#FFFFFF',
    cardBorder: '#E0E0E0',
    cardShadow: 'rgba(0, 0, 0, 0.1)',
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
  },
  
  fonts: {
    primary: 'Nunito-Regular',
    primaryBold: 'Nunito-Bold',
    secondary: 'Quicksand-Regular',
    secondaryBold: 'Quicksand-Bold',
  },
  
  typography: {
    fontFamily: {
      regular: 'Nunito-Regular',
      bold: 'Nunito-Bold',
      secondary: 'Quicksand-Regular',
      secondaryBold: 'Quicksand-Bold',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
    },
    lineHeight: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
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
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  animations: {
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
    easing: {
      easeInOut: 'ease-in-out',
      easeOut: 'ease-out',
      easeIn: 'ease-in',
    },
  },
  
  layout: {
    headerHeight: 80,
    tabBarHeight: 60,
    borderWidth: 1,
    borderWidthThick: 2,
  },
};
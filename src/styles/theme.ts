// ASI Wallet Brand Guide v0.1 - Dark theme (default)
export const darkTheme = {
  colors: {
    primary: '#93E27C',
    primaryDark: '#82C96D',
    secondary: '#33E4FF',
    danger: '#FF4D4F',
    success: '#93E27C',
    warning: '#FFB84D',
    info: '#33E4FF',
    error: '#FF4D4F',
    border: '#272B2E',
    borderLight: 'rgba(255, 255, 255, 0.1)',
    
    background: {
      primary: '#0D1012',
      secondary: '#1B1F21',
      tertiary: '#272B2E',
    },
    
    text: {
      primary: '#F7F9FA',
      secondary: '#b8b8b8',
      tertiary: '#757575',
      inverse: '#0D1012',
    },
  },
  
  primary: '#93E27C',
  primaryDark: '#82C96D',
  secondary: '#33E4FF',
  danger: '#FF4D4F',
  success: '#93E27C',
  warning: '#FFB84D',
  info: '#33E4FF',
  
  background: '#0D1012',
  surface: '#1B1F21',
  card: '#1B1F21',
  
  text: {
    primary: '#F7F9FA',
    secondary: '#b8b8b8',
    tertiary: '#757575',
    inverse: '#0D1012',
  },
  
  inputBg: '#272B2E',
  
  border: '#272B2E',
  borderLight: 'rgba(255, 255, 255, 0.1)',
  shadow: '0 1px 4px rgba(0, 0, 0, 0.32)',
  shadowLarge: '0 4px 12px rgba(0, 0, 0, 0.36)',
  
  error: '#FF4D4F',
  textSecondary: '#b8b8b8',
  
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    logo: '17.658px',
  },
  
  gradient: {
    primary: 'linear-gradient(135deg, #93E27C 0%, #82C96D 100%)',
    secondary: 'linear-gradient(135deg, #33E4FF 0%, #00B8D4 100%)',
    dark: 'linear-gradient(135deg, #1B1F21 0%, #0D1012 100%)',
  },
};

// Light theme - ASI Wallet Brand Guide v0.1
export const lightTheme = {
  colors: {
    primary: '#5A9C4F',
    primaryDark: '#4A8240',
    secondary: '#00A3CC',
    danger: '#E43A3C',
    success: '#5A9C4F',
    warning: '#f57c00',
    info: '#00A3CC',
    error: '#E43A3C',
    border: '#E0E4E6',
    borderLight: 'rgba(0, 0, 0, 0.05)',
    
    background: {
      primary: '#F7F9FA',
      secondary: '#FFFFFF',
      tertiary: '#F0F2F3',
    },
    
    text: {
      primary: '#0D1012',
      secondary: '#5a5a5a',
      tertiary: '#757575',
      inverse: '#F7F9FA',
    },
  },
  
  primary: '#5A9C4F',
  primaryDark: '#4A8240',
  secondary: '#00A3CC',
  danger: '#E43A3C',
  success: '#5A9C4F',
  warning: '#f57c00',
  info: '#00A3CC',
  
  background: '#F7F9FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  
  text: {
    primary: '#0D1012',
    secondary: '#5a5a5a',
    tertiary: '#757575',
    inverse: '#F7F9FA',
  },
  
  inputBg: '#F0F2F3',
  
  border: '#E0E4E6',
  borderLight: 'rgba(0, 0, 0, 0.05)',
  shadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
  shadowLarge: '0 4px 12px rgba(0, 0, 0, 0.12)',
  
  error: '#E43A3C',
  textSecondary: '#5a5a5a',
  
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    logo: '17.658px',
  },
  
  gradient: {
    primary: 'linear-gradient(135deg, #5A9C4F 0%, #6BB05E 100%)',
    secondary: 'linear-gradient(135deg, #00A3CC 0%, #33B8DB 100%)',
    dark: 'linear-gradient(135deg, #FFFFFF 0%, #F7F9FA 100%)',
  },
};

export type Theme = typeof lightTheme;
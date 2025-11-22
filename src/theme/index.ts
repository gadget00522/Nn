import { MD3LightTheme as DefaultLight, MD3DarkTheme as DefaultDark } from 'react-native-paper';

export const DarkTheme = {
  ...DefaultDark,
  colors: {
    ...DefaultDark.colors,
    primary: '#6C63FF',      // A more vibrant purple-ish blue
    onPrimary: '#FFFFFF',
    primaryContainer: '#4D47B3', // Darker shade of primary
    secondary: '#00E5FF',    // Cyan neon accent
    background: '#0F111A',   // Very dark blue-gray (almost black)
    surface: '#1E2130',      // Slightly lighter blue-gray for cards
    surfaceVariant: '#2A2D3E', // Even lighter for variety
    text: '#FFFFFF',
    onSurface: '#FFFFFF',
    elevation: { level2: '#252836' },
    warning: '#FFD740',      // Amber
    success: '#00E676',      // Bright green
    error: '#FF5252',        // Bright red
    outline: '#3F445B',      // Border color
  },
  roundness: 16, // More rounded corners
};

export const LightTheme = {
  ...DefaultLight,
  colors: {
    ...DefaultLight.colors,
    primary: '#6C63FF',
    background: '#F0F2F5',
    surface: '#FFFFFF',
    text: '#1A1D21',
    secondary: '#00B8D4',
    warning: '#FFC400',
    success: '#2E7D32',
    error: '#D32F2F',
  },
  roundness: 16,
};

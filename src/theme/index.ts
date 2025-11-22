import { MD3LightTheme as DefaultLight, MD3DarkTheme as DefaultDark } from 'react-native-paper';

/**
 * Thème sombre personnalisé pour l'application.
 * Basé sur MD3DarkTheme de React Native Paper.
 */
export const DarkTheme = {
  ...DefaultDark,
  colors: {
    ...DefaultDark.colors,
    /** Couleur principale (bleu Malin Wallet). */
    primary: '#037DD6',
    /** Couleur de fond principale. */
    background: '#121416',
    /** Couleur de surface (cartes, etc.). */
    surface: '#1C1F22',
    /** Niveaux d'élévation pour les surfaces. */
    elevation: { level2: '#24272A' },
    /** Couleur du texte principal. */
    text: '#FFFFFF',
    /** Couleur secondaire (texte grisé). */
    secondary: '#8B92A6',
    /** Couleur d'avertissement. */
    warning: '#F7931A',
    /** Couleur de succès. */
    success: '#4CAF50',
    /** Couleur d'erreur. */
    error: '#D32F2F',
  },
};

/**
 * Thème clair personnalisé pour l'application.
 * Basé sur MD3LightTheme de React Native Paper.
 */
export const LightTheme = {
  ...DefaultLight,
  colors: {
    ...DefaultLight.colors,
    /** Couleur principale. */
    primary: '#037DD6',
    /** Couleur de fond principale. */
    background: '#F4F6F8',
    /** Couleur de surface. */
    surface: '#FFFFFF',
    /** Niveaux d'élévation. */
    elevation: { level2: '#E9ECEF' },
    /** Couleur du texte principal. */
    text: '#1A1D21',
    /** Couleur secondaire. */
    secondary: '#4F5660',
    /** Couleur d'avertissement. */
    warning: '#F7931A',
    /** Couleur de succès. */
    success: '#2E7D32',
    /** Couleur d'erreur. */
    error: '#D32F2F',
  },
};

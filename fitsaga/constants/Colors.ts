/**
 * FitSaga App Theme - Black and Turquoise
 * A modern, sleek design with high contrast and energetic accents
 */

// Primary brand colors
const turquoise = {
  primary: '#00E5CC',    // Bright turquoise - main accent color
  light: '#4FFFEB',      // Light turquoise for highlights
  dark: '#00B3A1',       // Darker turquoise for pressed states
  faded: '#00E5CC40'     // Transparent turquoise for subtle elements
};

// Dark theme colors
const dark = {
  background: '#121212',  // Rich black background
  surface: '#1E1E1E',     // Slightly lighter black for cards
  elevated: '#2D2D2D',    // Elevated surfaces
  border: '#333333',      // Subtle borders
  disabled: '#666666'     // Disabled elements
};

// Text and content colors
const text = {
  primary: '#FFFFFF',     // White text
  secondary: '#CCCCCC',   // Light gray text
  hint: '#999999',        // Hint text
  disabled: '#777777'     // Disabled text
};

// Status colors
const status = {
  success: '#4CAF50',     // Green for success states
  warning: '#FFC107',     // Amber for warnings
  error: '#F44336',       // Red for errors
  info: turquoise.primary // Turquoise for info
};

export const Colors = {
  // Light theme (although the app primarily uses dark theme)
  light: {
    text: '#11181C',
    background: '#FFFFFF',
    tint: turquoise.primary,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: turquoise.primary,
    
    // Additional colors
    card: '#F5F5F5',
    border: '#E0E0E0',
    notification: status.error,
    primary: turquoise.primary,
    secondary: turquoise.dark,
    accent: '#00E5CC',
    highlight: turquoise.light,
    success: status.success,
    warning: status.warning,
    error: status.error,
    info: status.info,
    surface: '#F5F5F5',
    elevated: '#E8E8E8'
  },
  
  // Dark theme (primary app theme)
  dark: {
    text: text.primary,
    background: dark.background,
    tint: turquoise.primary,
    icon: text.secondary,
    tabIconDefault: text.hint,
    tabIconSelected: turquoise.primary,
    
    // Additional colors
    card: dark.surface,
    border: dark.border,
    notification: status.error,
    primary: turquoise.primary,
    secondary: turquoise.light,
    accent: turquoise.primary,
    highlight: turquoise.light,
    surface: dark.surface,
    elevated: dark.elevated,
    success: status.success,
    warning: status.warning,
    error: status.error,
    info: status.info,
    
    // Gradients (can be used with linear gradient components)
    gradient: {
      primary: [turquoise.primary, turquoise.dark],
      accent: [turquoise.light, turquoise.primary]
    }
  },
  
  // Raw color values for use in both themes
  raw: {
    turquoise,
    dark,
    text,
    status
  }
};

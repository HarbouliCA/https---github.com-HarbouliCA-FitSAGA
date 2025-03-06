import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

type ThemeContextType = {
  colorScheme: 'light' | 'dark';
  colors: typeof Colors.dark | typeof Colors.light;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, forceDark = true }: { children: ReactNode, forceDark?: boolean }) {
  // Get the device color scheme
  const deviceColorScheme = useNativeColorScheme();
  
  // Use forced dark mode or device preference
  const colorScheme = forceDark ? 'dark' : (deviceColorScheme || 'dark');
  
  // Get the appropriate colors based on the color scheme
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  // Create the theme context value
  const themeContextValue: ThemeContextType = {
    colorScheme: colorScheme as 'light' | 'dark',
    colors,
    isDark: colorScheme === 'dark',
  };

  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

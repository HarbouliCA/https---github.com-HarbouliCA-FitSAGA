import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from './ThemeProvider';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  padded?: boolean;
}

export function Card({ children, style, elevated = false, padded = true }: CardProps) {
  const { colors } = useTheme();
  
  return (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: elevated ? colors.elevated : colors.card,
          padding: padded ? 16 : 0,
          borderColor: colors.border,
        },
        elevated && styles.elevated,
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 8,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});

import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  ActivityIndicator,
  TouchableOpacityProps
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './ThemeProvider';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradient?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
  gradient = false,
  ...props
}: ButtonProps) {
  const { colors, isDark } = useTheme();
  
  // Determine button styles based on variant and size
  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      width: fullWidth ? '100%' : 'auto',
    };
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingVertical = 8;
        baseStyle.paddingHorizontal = 16;
        break;
      case 'large':
        baseStyle.paddingVertical = 16;
        baseStyle.paddingHorizontal = 24;
        break;
      default: // medium
        baseStyle.paddingVertical = 12;
        baseStyle.paddingHorizontal = 20;
    }
    
    // Variant styles
    if (!gradient) {
      switch (variant) {
        case 'secondary':
          baseStyle.backgroundColor = colors.secondary;
          break;
        case 'outline':
          baseStyle.backgroundColor = 'transparent';
          baseStyle.borderWidth = 1;
          baseStyle.borderColor = colors.primary;
          break;
        case 'text':
          baseStyle.backgroundColor = 'transparent';
          break;
        default: // primary
          baseStyle.backgroundColor = colors.primary;
      }
    }
    
    return baseStyle;
  };
  
  // Determine text styles based on variant and size
  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
    };
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyle.fontSize = 14;
        break;
      case 'large':
        baseStyle.fontSize = 18;
        break;
      default: // medium
        baseStyle.fontSize = 16;
    }
    
    // Variant styles
    switch (variant) {
      case 'outline':
      case 'text':
        baseStyle.color = colors.primary;
        break;
      default: // primary, secondary
        baseStyle.color = isDark ? colors.text : '#000000';
    }
    
    return baseStyle;
  };
  
  // Render button content
  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : colors.primary} 
          style={styles.loader}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[getTextStyles(), icon ? styles.textWithIcon : null, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </>
  );
  
  // Render button with or without gradient
  if (gradient && (variant === 'primary' || variant === 'secondary')) {
    // Define gradient colors as a tuple to satisfy the type requirements
    const gradientColors: [string, string] = variant === 'primary' 
      ? [colors.primary, colors.secondary] 
      : [colors.secondary, colors.primary];
      
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={loading}
        style={[styles.container, fullWidth && styles.fullWidth, style]}
        {...props}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[getButtonStyles(), styles.gradient]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={loading}
      style={[getButtonStyles(), styles.container, fullWidth && styles.fullWidth, style]}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loader: {
    marginRight: 0,
  },
  textWithIcon: {
    marginLeft: 8,
  },
});

import React from 'react';
import { TextInput as RNTextInput, StyleSheet, TextInputProps, View } from 'react-native';
import { useTheme } from './ThemeProvider';

interface ThemedTextInputProps extends TextInputProps {
  error?: string;
}

export function TextInput({ style, error, ...props }: ThemedTextInputProps) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      <RNTextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: error ? colors.error : colors.border,
          },
          style,
        ]}
        placeholderTextColor={colors.secondary}
        {...props}
      />
      {error && (
        <View style={styles.errorContainer}>
          <View style={[styles.errorIndicator, { backgroundColor: colors.error }]} />
          <View style={styles.errorTextContainer}>
            <View style={[styles.errorBackground, { backgroundColor: colors.error }]}>
              <View style={styles.errorTextWrapper}>
                <View style={styles.errorTextContent}>
                  {error}
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  errorIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 8,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorBackground: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  errorTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorTextContent: {
    fontSize: 12,
    color: 'white',
    flex: 1,
  },
});

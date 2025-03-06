import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '../constants/Colors';

export function ExternalLink({
  href,
  children,
  style,
}: {
  href: string;
  children: React.ReactNode;
  style?: React.ComponentProps<typeof Text>['style'];
}) {
  return (
    <Pressable
      onPress={() => WebBrowser.openBrowserAsync(href)}
      style={({ pressed }) => ({
        opacity: pressed ? 0.6 : 1,
      })}>
      <Text style={[styles.text, style]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    color: Colors.light.tint,
    textDecorationLine: 'underline',
  },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from './ui/ThemeProvider';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export function ThemeShowcase() {
  const { colors } = useTheme();
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>FitSaga Theme</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>Black & Turquoise</Text>
      
      {/* Color Palette */}
      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Color Palette</Text>
        <View style={styles.colorRow}>
          <ColorSwatch color={colors.primary} name="Primary" />
          <ColorSwatch color={colors.secondary} name="Secondary" />
          <ColorSwatch color={colors.accent} name="Accent" />
        </View>
        <View style={styles.colorRow}>
          <ColorSwatch color={colors.background} name="Background" />
          <ColorSwatch color={colors.card} name="Card" />
          <ColorSwatch color={colors.elevated} name="Elevated" />
        </View>
        <View style={styles.colorRow}>
          <ColorSwatch color={colors.success} name="Success" />
          <ColorSwatch color={colors.warning} name="Warning" />
          <ColorSwatch color={colors.error} name="Error" />
        </View>
      </Card>
      
      {/* Buttons */}
      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Buttons</Text>
        <View style={styles.buttonRow}>
          <Button title="Primary" style={styles.button} />
          <Button title="Secondary" variant="secondary" style={styles.button} />
        </View>
        <View style={styles.buttonRow}>
          <Button title="Outline" variant="outline" style={styles.button} />
          <Button title="Text" variant="text" style={styles.button} />
        </View>
        <View style={styles.buttonRow}>
          <Button title="Gradient" gradient style={styles.button} />
          <Button title="Loading" loading style={styles.button} />
        </View>
      </Card>
      
      {/* Cards */}
      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Cards</Text>
        <Card style={styles.nestedCard}>
          <Text style={{ color: colors.text }}>Standard Card</Text>
        </Card>
        <Card elevated style={styles.nestedCard}>
          <Text style={{ color: colors.text }}>Elevated Card</Text>
        </Card>
      </Card>
      
      {/* Typography */}
      <Card>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Typography</Text>
        <Text style={[styles.heading1, { color: colors.text }]}>Heading 1</Text>
        <Text style={[styles.heading2, { color: colors.text }]}>Heading 2</Text>
        <Text style={[styles.heading3, { color: colors.text }]}>Heading 3</Text>
        <Text style={[styles.body, { color: colors.text }]}>Body Text</Text>
        <Text style={[styles.caption, { color: colors.secondary }]}>Caption</Text>
      </Card>
    </ScrollView>
  );
}

// Helper component for color swatches
function ColorSwatch({ color, name }: { color: string, name: string }) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.swatch}>
      <View style={[styles.colorSquare, { backgroundColor: color }]} />
      <Text style={[styles.swatchText, { color: colors.text }]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 24,
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  colorRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  swatch: {
    flex: 1,
    alignItems: 'center',
  },
  colorSquare: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: 4,
  },
  swatchText: {
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  nestedCard: {
    marginVertical: 8,
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
});

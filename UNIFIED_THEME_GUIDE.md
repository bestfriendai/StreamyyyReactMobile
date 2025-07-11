# Unified Theme System Guide

This guide explains how to use the new unified theme system that consolidates all previous theme approaches into a single, comprehensive design system.

## Overview

The unified theme system provides:
- **Consistent Design Tokens**: Colors, typography, spacing, and more
- **Dark/Light Mode Support**: Runtime theme switching
- **Tamagui Integration**: Enhanced UI component library
- **Accessibility Features**: WCAG-compliant design patterns
- **Animation System**: Standardized animations and transitions
- **Component Library**: Pre-built UI components

## Architecture

```
theme/
├── unifiedTheme.ts          # Main theme configuration
├── modernTheme.ts           # Legacy (keep for migration)
├── tokens.ts               # Legacy (keep for migration)

contexts/
└── ThemeContext.tsx        # Theme provider and hooks

components/ui/
├── Button.tsx              # Standardized button component
├── Card.tsx                # Standardized card component
├── Input.tsx               # Standardized input component
├── TabBar.tsx              # Enhanced tab bar
├── AnimatedContainer.tsx   # Animation utilities
└── LoadingSpinner.tsx      # Loading indicators

utils/
└── accessibility.ts        # Accessibility utilities
```

## Basic Usage

### 1. Theme Provider Setup

The theme provider is already configured in `app/_layout.tsx`:

```tsx
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function RootLayout() {
  return (
    <TamaguiProvider config={config}>
      <ThemeProvider defaultMode="dark">
        {/* Your app content */}
      </ThemeProvider>
    </TamaguiProvider>
  );
}
```

### 2. Using Theme in Components

```tsx
import { useTheme } from '@/contexts/ThemeContext';

export const MyComponent = () => {
  const { theme, isDark, toggleTheme, helpers } = useTheme();

  return (
    <View style={{
      backgroundColor: theme.background.primary,
      padding: theme.tokens.spacing[4],
    }}>
      <Text style={{
        color: theme.text.primary,
        fontSize: theme.tokens.typography.sizes.lg,
        fontWeight: theme.tokens.typography.weights.semibold,
      }}>
        Hello, themed world!
      </Text>
    </View>
  );
};
```

### 3. Using Theme Helpers

```tsx
const { helpers } = useTheme();

// Get typography styles
const titleStyle = helpers.getTypography('2xl', 'bold', 'tight');

// Get color with opacity
const overlayColor = helpers.getColorWithOpacity(theme.background.primary, 0.8);

// Get spacing
const margin = helpers.getSpacing(4);

// Get shadow
const shadowStyle = helpers.getShadow('lg');
```

## Design Tokens

### Colors

```tsx
// Primary brand colors
theme.tokens.colors.primary[500]    // Main brand color
theme.tokens.colors.primary[600]    // Darker variant
theme.tokens.colors.primary[400]    // Lighter variant

// Semantic theme colors
theme.background.primary            // Main background
theme.background.card              // Card background
theme.text.primary                 // Primary text
theme.text.secondary               // Secondary text
theme.interactive.primary          // Interactive elements
theme.status.success               // Success state
theme.status.error                 // Error state
```

### Typography

```tsx
// Font sizes
theme.tokens.typography.sizes.xs      // 10px
theme.tokens.typography.sizes.sm      // 12px
theme.tokens.typography.sizes.base    // 14px
theme.tokens.typography.sizes.lg      // 18px
theme.tokens.typography.sizes['2xl'] // 22px

// Font weights
theme.tokens.typography.weights.normal    // 400
theme.tokens.typography.weights.medium    // 500
theme.tokens.typography.weights.semibold  // 600
theme.tokens.typography.weights.bold      // 700
```

### Spacing

```tsx
// 8pt grid system
theme.tokens.spacing[1]   // 4px
theme.tokens.spacing[2]   // 8px
theme.tokens.spacing[4]   // 16px
theme.tokens.spacing[6]   // 24px
theme.tokens.spacing[8]   // 32px
```

### Border Radius

```tsx
theme.tokens.radius.sm    // 4px
theme.tokens.radius.md    // 6px
theme.tokens.radius.lg    // 8px
theme.tokens.radius.xl    // 12px
theme.tokens.radius.full  // 9999px
```

## UI Components

### Button

```tsx
import { Button } from '@/components/ui/Button';

<Button
  title="Primary Button"
  onPress={() => {}}
  variant="primary"        // primary | secondary | ghost | link | danger
  size="md"               // xs | sm | md | lg | xl
  gradient                // Enable gradient background
  loading                 // Show loading state
  disabled                // Disabled state
  icon={<Icon />}         // Left or right icon
  iconPosition="left"     // left | right
/>
```

### Card

```tsx
import { Card, StreamCard, ControlCard } from '@/components/ui/Card';

<Card
  variant="elevated"      // default | elevated | flat | glass
  interactive            // Enable touch interactions
  onPress={() => {}}     // Touch handler
  gradient              // Enable gradient background
  padding={6}           // Padding token
  borderRadius="xl"     // Radius token
>
  <Text>Card content</Text>
</Card>

// Specialized variants
<StreamCard onPress={() => {}}>Stream content</StreamCard>
<ControlCard>Control content</ControlCard>
```

### Input

```tsx
import { Input, SearchInput, PasswordInput } from '@/components/ui/Input';

<Input
  value={value}
  onChangeText={setValue}
  placeholder="Enter text"
  label="Field Label"
  error="Error message"
  size="md"                // sm | md | lg
  variant="default"        // default | outlined | filled | glass
  leftIcon={<Icon />}      // Left icon
  rightIcon={<Icon />}     // Right icon
  multiline               // Multi-line input
/>

// Specialized variants
<SearchInput />
<PasswordInput />
```

### Animations

```tsx
import { 
  AnimatedContainer, 
  FadeInContainer, 
  SlideUpContainer,
  StaggeredContainer 
} from '@/components/ui/AnimatedContainer';

<AnimatedContainer
  preset="fadeIn"         // fadeIn | slideUp | scale | bounce | etc.
  speed="normal"          // fast | normal | slow
  delay={200}            // Delay in ms
  loop                   // Loop animation
>
  <Text>Animated content</Text>
</AnimatedContainer>

// Pre-configured containers
<FadeInContainer delay={100}>
  <Text>Fade in content</Text>
</FadeInContainer>

// Staggered animations
<StaggeredContainer staggerDelay={100}>
  <View>Item 1</View>
  <View>Item 2</View>
  <View>Item 3</View>
</StaggeredContainer>
```

### Loading Indicators

```tsx
import { LoadingSpinner, StreamLoadingSpinner } from '@/components/ui/LoadingSpinner';

<LoadingSpinner
  size="md"              // xs | sm | md | lg | xl
  variant="default"      // default | gradient | pulse | dots | bars
  speed="normal"         // slow | normal | fast
  color={theme.interactive.primary}
/>

// Specialized variants
<StreamLoadingSpinner />
```

## Accessibility

### Color Contrast

```tsx
import { ColorContrastUtils } from '@/utils/accessibility';

// Check if colors meet WCAG standards
const isAccessible = ColorContrastUtils.meetsAccessibilityStandard(
  textColor,
  backgroundColor,
  'AA'  // AA | AAA
);

// Get accessible text color for background
const textColor = ColorContrastUtils.getAccessibleTextColor(
  backgroundColor,
  theme,
  'AA'
);
```

### Screen Reader Support

```tsx
import { ScreenReaderUtils } from '@/utils/accessibility';

// Generate accessible labels
const streamLabel = ScreenReaderUtils.generateStreamLabel(
  'StreamerName',
  1234,
  'Gaming'
);

const buttonLabel = ScreenReaderUtils.generateButtonLabel(
  'Play',
  'paused',
  false
);

// Announce to screen reader
ScreenReaderUtils.announce('Stream started');
```

### Touch Targets

```tsx
import { TouchTargetUtils } from '@/utils/accessibility';

// Ensure minimum touch target size
const minSize = TouchTargetUtils.ensureMinimumTouchTarget(32); // Returns 44

// Get recommended padding
const padding = TouchTargetUtils.getRecommendedPadding(32); // Returns 6

// Check if target is accessible
const isAccessible = TouchTargetUtils.isTouchTargetAccessible(44, 44); // Returns true
```

## Migration Guide

### From Legacy Themes

1. **Replace imports:**
   ```tsx
   // Old
   import { Theme } from '@/constants/Theme';
   import { ModernTheme } from '@/theme/modernTheme';
   
   // New
   import { useTheme } from '@/contexts/ThemeContext';
   ```

2. **Update component usage:**
   ```tsx
   // Old
   const styles = StyleSheet.create({
     container: {
       backgroundColor: Theme.colors.background.primary,
       padding: Theme.spacing.md,
     },
   });
   
   // New
   const { theme } = useTheme();
   const styles = StyleSheet.create({
     container: {
       backgroundColor: theme.background.primary,
       padding: theme.tokens.spacing[4],
     },
   });
   ```

3. **Replace hardcoded values:**
   ```tsx
   // Old
   backgroundColor: '#8B5CF6'
   fontSize: 16
   padding: 16
   
   // New
   backgroundColor: theme.interactive.primary
   fontSize: theme.tokens.typography.sizes.base
   padding: theme.tokens.spacing[4]
   ```

## Best Practices

### 1. Always Use Theme Tokens

```tsx
// ✅ Good
<View style={{
  backgroundColor: theme.background.primary,
  padding: theme.tokens.spacing[4],
  borderRadius: theme.tokens.radius.lg,
}}>

// ❌ Bad
<View style={{
  backgroundColor: '#000000',
  padding: 16,
  borderRadius: 8,
}}>
```

### 2. Use Semantic Color Names

```tsx
// ✅ Good
color: theme.text.primary
backgroundColor: theme.background.card
borderColor: theme.border.primary

// ❌ Bad
color: theme.tokens.colors.gray[50]
backgroundColor: theme.tokens.colors.gray[900]
```

### 3. Leverage Helper Functions

```tsx
// ✅ Good
const titleStyle = helpers.getTypography('2xl', 'bold');
const shadowStyle = helpers.getShadow('lg');

// ❌ Bad
const titleStyle = {
  fontSize: 22,
  fontWeight: '700',
  fontFamily: 'Inter',
};
```

### 4. Use Pre-built Components

```tsx
// ✅ Good
<Button
  title="Submit"
  variant="primary"
  size="lg"
  onPress={handleSubmit}
/>

// ❌ Bad
<TouchableOpacity
  style={{
    backgroundColor: theme.interactive.primary,
    padding: theme.tokens.spacing[4],
    borderRadius: theme.tokens.radius.lg,
  }}
  onPress={handleSubmit}
>
  <Text style={{ color: 'white', fontSize: 16 }}>Submit</Text>
</TouchableOpacity>
```

### 5. Test Accessibility

```tsx
import { AccessibilityTester } from '@/utils/accessibility';

const testResult = AccessibilityTester.testComponent({
  backgroundColor: theme.background.primary,
  textColor: theme.text.primary,
  touchTargetSize: { width: 44, height: 44 },
  hasLabel: true,
  isInteractive: true,
});

if (!testResult.passed) {
  console.warn('Accessibility issues:', testResult.issues);
}
```

## Examples

See the following files for complete examples:
- `/components/EnhancedSettingsScreenWithTheme.tsx` - Complete themed screen
- `/app/(tabs)/_layout.tsx` - Updated tab bar with theme
- `/components/ui/` - All UI components with theme integration

## Performance Notes

- Theme context updates only when theme mode changes
- Animation preferences are cached and checked only when needed
- Color contrast calculations are memoized
- Touch target adjustments are computed at build time when possible

## Troubleshooting

### Theme Not Updating
Ensure `ThemeProvider` wraps your app and components use `useTheme` hook.

### Colors Not Showing
Check that you're using theme semantic names, not direct token access.

### Animations Not Working
Verify that `react-native-reanimated` is properly configured.

### TypeScript Errors
Ensure all theme files are properly typed and imported.

---

This unified theme system provides a robust foundation for consistent, accessible, and maintainable UI development across your React Native app.
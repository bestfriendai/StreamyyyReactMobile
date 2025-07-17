import { Button, XStack, YStack, Text, Card, H2 } from '@tamagui/core';
import React from 'react';

export const TamaguiDemo: React.FC = () => {
  return (
    <YStack padding="$4" gap="$4" backgroundColor="$background">
      <H2>Tamagui Components Demo</H2>

      <Card padding="$4" backgroundColor="$backgroundStrong">
        <Text color="$color">This is a Tamagui Card with enhanced styling</Text>
      </Card>

      <XStack gap="$3">
        <Button theme="active" size="$4">
          Primary Button
        </Button>
        <Button variant="outlined" size="$4">
          Secondary Button
        </Button>
      </XStack>

      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="600" color="$color">
          Modern Typography
        </Text>
        <Text fontSize="$4" color="$colorSubtle">
          Enhanced design system with proper spacing and colors
        </Text>
      </YStack>
    </YStack>
  );
};

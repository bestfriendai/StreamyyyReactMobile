import React, { useState } from 'react';
import { Alert, Switch, Platform, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EnhancedSettingsScreen } from '@/components/EnhancedSettingsScreen';

export default function Settings() {

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <EnhancedSettingsScreen />
      </SafeAreaView>
    </View>
  );
}
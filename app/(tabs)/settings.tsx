import React, { useState } from 'react';
import { Alert, Switch, Platform, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EnhancedSettingsScreen } from '@/components/EnhancedSettingsScreen';
import { NavigationHeader } from '@/components/NavigationHeader';
import { User, Bell } from 'lucide-react-native';

export default function Settings() {

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <NavigationHeader
          title="Settings"
          subtitle="Preferences & Account"
          rightElement={
            <TouchableOpacity style={{ padding: 4 }}>
              <User size={20} color="#8B5CF6" />
            </TouchableOpacity>
          }
        />
        <EnhancedSettingsScreen />
      </SafeAreaView>
    </View>
  );
}
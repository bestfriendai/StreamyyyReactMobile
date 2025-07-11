import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export class HapticFeedback {
  static async light() {
    if (Platform.OS === 'ios') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.log('Haptic feedback not available');
      }
    }
  }

  static async medium() {
    if (Platform.OS === 'ios') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.log('Haptic feedback not available');
      }
    }
  }

  static async heavy() {
    if (Platform.OS === 'ios') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.log('Haptic feedback not available');
      }
    }
  }

  static async selection() {
    if (Platform.OS === 'ios') {
      try {
        await Haptics.selectionAsync();
      } catch (error) {
        console.log('Haptic feedback not available');
      }
    }
  }

  static async success() {
    if (Platform.OS === 'ios') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.log('Haptic feedback not available');
      }
    }
  }

  static async warning() {
    if (Platform.OS === 'ios') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (error) {
        console.log('Haptic feedback not available');
      }
    }
  }

  static async error() {
    if (Platform.OS === 'ios') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (error) {
        console.log('Haptic feedback not available');
      }
    }
  }
}
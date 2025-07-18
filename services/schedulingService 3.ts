import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from './notificationService';
import { discordService } from './discordService';
import { UnifiedStream } from './platformService';

export interface ScheduledStream {
  id: string;
  streamerId: string;
  streamerName: string;
  streamerDisplayName: string;
  platform: string;
  title: string;
  description: string;
  category: string;
  scheduledStartTime: string;
  scheduledEndTime?: string;
  estimatedDuration: number; // in minutes
  timezone: string;
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled' | 'postponed';
  actualStartTime?: string;
  actualEndTime?: string;
  thumbnailUrl?: string;
  tags: string[];
  maxViewers?: number;
  isPremium: boolean;
  isSubscriberOnly: boolean;
  ageRestriction?: number;
  language: string;
  collaborators: string[];
  notificationSettings: {
    remind15Min: boolean;
    remind1Hour: boolean;
    remind1Day: boolean;
    discordNotification: boolean;
    pushNotification: boolean;
  };
  attendees: string[];
  maxAttendees?: number;
  waitlistEnabled: boolean;
  waitlist: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  daysOfMonth?: number[]; // 1-31
  months?: number[]; // 1-12
  endDate?: string;
  maxOccurrences?: number;
  exceptions?: string[]; // dates to skip
}

export interface StreamReminder {
  id: string;
  scheduledStreamId: string;
  userId: string;
  type: '15min' | '1hour' | '1day' | 'custom';
  reminderTime: string;
  isActive: boolean;
  notificationId?: string;
  message?: string;
  channels: ('push' | 'discord' | 'email')[];
  createdAt: string;
}

export interface ScheduleConflict {
  id: string;
  streamerId: string;
  conflictType: 'overlap' | 'too_close' | 'platform_limit' | 'resource_conflict';
  conflictingStreams: string[];
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestions: string[];
  autoResolvable: boolean;
}

export interface StreamTemplate {
  id: string;
  name: string;
  streamerId: string;
  platform: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  duration: number;
  notificationSettings: ScheduledStream['notificationSettings'];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

class SchedulingService {
  private readonly storageKey = 'stream_schedules';
  private readonly remindersKey = 'stream_reminders';
  private readonly templatesKey = 'stream_templates';
  private readonly baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.streammulti.com';

  constructor() {
    console.log('Scheduling Service initialized');
    this.initializeScheduling();
  }

  private async initializeScheduling() {
    // Set up background task for reminder processing
    this.processReminders();
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupExpiredSchedules();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Scheduling API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Scheduling API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Schedule Management
  async createScheduledStream(streamData: Omit<ScheduledStream, 'id' | 'createdAt' | 'updatedAt' | 'attendees' | 'waitlist'>): Promise<ScheduledStream> {
    console.log(`🔄 Creating scheduled stream: ${streamData.title}`);
    
    try {
      const scheduledStream: ScheduledStream = {
        id: Date.now().toString(),
        ...streamData,
        attendees: [],
        waitlist: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Validate schedule
      const conflicts = await this.checkScheduleConflicts(scheduledStream);
      if (conflicts.length > 0) {
        console.warn('Schedule conflicts detected:', conflicts);
      }

      // Save to local storage
      await this.saveScheduledStream(scheduledStream);

      // Create reminders
      await this.createReminders(scheduledStream);

      // Sync with backend
      try {
        await this.makeRequest('/scheduling/streams', {
          method: 'POST',
          body: JSON.stringify(scheduledStream),
        });
      } catch (error) {
        console.warn('Failed to sync with backend:', error);
      }

      console.log(`✅ Scheduled stream created: ${scheduledStream.title}`);
      return scheduledStream;
    } catch (error) {
      console.error('❌ Failed to create scheduled stream:', error);
      throw error;
    }
  }

  async updateScheduledStream(id: string, updates: Partial<ScheduledStream>): Promise<ScheduledStream> {
    console.log(`🔄 Updating scheduled stream: ${id}`);
    
    try {
      const existingStream = await this.getScheduledStream(id);
      if (!existingStream) {
        throw new Error('Scheduled stream not found');
      }

      const updatedStream: ScheduledStream = {
        ...existingStream,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Validate updates
      if (updates.scheduledStartTime || updates.scheduledEndTime) {
        const conflicts = await this.checkScheduleConflicts(updatedStream);
        if (conflicts.length > 0) {
          console.warn('Schedule conflicts detected:', conflicts);
        }
      }

      // Update reminders if time changed
      if (updates.scheduledStartTime) {
        await this.updateReminders(updatedStream);
      }

      // Save to local storage
      await this.saveScheduledStream(updatedStream);

      // Sync with backend
      try {
        await this.makeRequest(`/scheduling/streams/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updatedStream),
        });
      } catch (error) {
        console.warn('Failed to sync with backend:', error);
      }

      console.log(`✅ Scheduled stream updated: ${id}`);
      return updatedStream;
    } catch (error) {
      console.error('❌ Failed to update scheduled stream:', error);
      throw error;
    }
  }

  async deleteScheduledStream(id: string): Promise<void> {
    console.log(`🔄 Deleting scheduled stream: ${id}`);
    
    try {
      // Remove reminders
      await this.removeReminders(id);

      // Remove from local storage
      const schedules = await this.getScheduledStreams();
      const updatedSchedules = schedules.filter(s => s.id !== id);
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(updatedSchedules));

      // Sync with backend
      try {
        await this.makeRequest(`/scheduling/streams/${id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.warn('Failed to sync with backend:', error);
      }

      console.log(`✅ Scheduled stream deleted: ${id}`);
    } catch (error) {
      console.error('❌ Failed to delete scheduled stream:', error);
      throw error;
    }
  }

  async getScheduledStream(id: string): Promise<ScheduledStream | null> {
    try {
      const schedules = await this.getScheduledStreams();
      return schedules.find(s => s.id === id) || null;
    } catch (error) {
      console.error('❌ Failed to get scheduled stream:', error);
      return null;
    }
  }

  async getScheduledStreams(streamerId?: string): Promise<ScheduledStream[]> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      const schedules: ScheduledStream[] = stored ? JSON.parse(stored) : [];
      
      if (streamerId) {
        return schedules.filter(s => s.streamerId === streamerId);
      }
      
      return schedules;
    } catch (error) {
      console.error('❌ Failed to get scheduled streams:', error);
      return [];
    }
  }

  async getUpcomingStreams(limit: number = 10, hours: number = 24): Promise<ScheduledStream[]> {
    try {
      const schedules = await this.getScheduledStreams();
      const now = new Date();
      const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);
      
      return schedules
        .filter(s => {
          const streamTime = new Date(s.scheduledStartTime);
          return streamTime > now && streamTime <= cutoff && s.status === 'scheduled';
        })
        .sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Failed to get upcoming streams:', error);
      return [];
    }
  }

  private async saveScheduledStream(stream: ScheduledStream): Promise<void> {
    try {
      const schedules = await this.getScheduledStreams();
      const existingIndex = schedules.findIndex(s => s.id === stream.id);
      
      if (existingIndex >= 0) {
        schedules[existingIndex] = stream;
      } else {
        schedules.push(stream);
      }
      
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(schedules));
    } catch (error) {
      console.error('❌ Failed to save scheduled stream:', error);
      throw error;
    }
  }

  // Reminder Management
  async createReminder(reminder: Omit<StreamReminder, 'id' | 'createdAt'>): Promise<StreamReminder> {
    console.log(`🔄 Creating reminder for stream: ${reminder.scheduledStreamId}`);
    
    try {
      const newReminder: StreamReminder = {
        id: Date.now().toString(),
        ...reminder,
        createdAt: new Date().toISOString(),
      };

      // Schedule notification
      if (reminder.channels.includes('push')) {
        const notificationId = await notificationService.scheduleNotification({
          type: 'stream_reminder',
          title: `Stream starting soon!`,
          body: `${reminder.type} reminder for upcoming stream`,
          data: {
            scheduledStreamId: reminder.scheduledStreamId,
            userId: reminder.userId,
          },
          scheduledFor: reminder.reminderTime,
          userId: reminder.userId,
          isRecurring: false,
          isActive: true,
        });
        
        newReminder.notificationId = notificationId;
      }

      // Save reminder
      const reminders = await this.getReminders();
      reminders.push(newReminder);
      await AsyncStorage.setItem(this.remindersKey, JSON.stringify(reminders));

      console.log(`✅ Reminder created: ${newReminder.id}`);
      return newReminder;
    } catch (error) {
      console.error('❌ Failed to create reminder:', error);
      throw error;
    }
  }

  async getReminders(userId?: string): Promise<StreamReminder[]> {
    try {
      const stored = await AsyncStorage.getItem(this.remindersKey);
      const reminders: StreamReminder[] = stored ? JSON.parse(stored) : [];
      
      if (userId) {
        return reminders.filter(r => r.userId === userId);
      }
      
      return reminders;
    } catch (error) {
      console.error('❌ Failed to get reminders:', error);
      return [];
    }
  }

  private async createReminders(stream: ScheduledStream): Promise<void> {
    const streamTime = new Date(stream.scheduledStartTime);
    const userId = stream.createdBy;
    
    const reminderTypes = [
      { type: '15min' as const, minutes: 15 },
      { type: '1hour' as const, minutes: 60 },
      { type: '1day' as const, minutes: 24 * 60 },
    ];

    for (const { type, minutes } of reminderTypes) {
      if (stream.notificationSettings[`remind${type === '15min' ? '15Min' : type === '1hour' ? '1Hour' : '1Day'}`]) {
        const reminderTime = new Date(streamTime.getTime() - minutes * 60 * 1000);
        
        if (reminderTime > new Date()) {
          await this.createReminder({
            scheduledStreamId: stream.id,
            userId,
            type,
            reminderTime: reminderTime.toISOString(),
            isActive: true,
            channels: ['push'],
          });
        }
      }
    }
  }

  private async updateReminders(stream: ScheduledStream): Promise<void> {
    // Remove existing reminders
    await this.removeReminders(stream.id);
    
    // Create new reminders
    await this.createReminders(stream);
  }

  private async removeReminders(scheduledStreamId: string): Promise<void> {
    try {
      const reminders = await this.getReminders();
      const streamReminders = reminders.filter(r => r.scheduledStreamId === scheduledStreamId);
      
      // Cancel notifications
      for (const reminder of streamReminders) {
        if (reminder.notificationId) {
          await notificationService.cancelScheduledNotification(reminder.notificationId);
        }
      }
      
      // Remove from storage
      const updatedReminders = reminders.filter(r => r.scheduledStreamId !== scheduledStreamId);
      await AsyncStorage.setItem(this.remindersKey, JSON.stringify(updatedReminders));
    } catch (error) {
      console.error('❌ Failed to remove reminders:', error);
    }
  }

  // Conflict Detection
  async checkScheduleConflicts(stream: ScheduledStream): Promise<ScheduleConflict[]> {
    console.log(`🔄 Checking schedule conflicts for: ${stream.title}`);
    
    try {
      const schedules = await this.getScheduledStreams(stream.streamerId);
      const conflicts: ScheduleConflict[] = [];
      
      const streamStart = new Date(stream.scheduledStartTime);
      const streamEnd = stream.scheduledEndTime ? new Date(stream.scheduledEndTime) : 
                        new Date(streamStart.getTime() + stream.estimatedDuration * 60 * 1000);
      
      for (const existingStream of schedules) {
        if (existingStream.id === stream.id) continue;
        
        const existingStart = new Date(existingStream.scheduledStartTime);
        const existingEnd = existingStream.scheduledEndTime ? new Date(existingStream.scheduledEndTime) :
                           new Date(existingStart.getTime() + existingStream.estimatedDuration * 60 * 1000);
        
        // Check for overlap
        if (streamStart < existingEnd && streamEnd > existingStart) {
          conflicts.push({
            id: Date.now().toString(),
            streamerId: stream.streamerId,
            conflictType: 'overlap',
            conflictingStreams: [stream.id, existingStream.id],
            severity: 'high',
            description: `Stream overlaps with "${existingStream.title}"`,
            suggestions: [
              'Reschedule one of the streams',
              'Reduce stream duration',
              'Use different platform',
            ],
            autoResolvable: false,
          });
        }
        
        // Check for too close scheduling (within 30 minutes)
        const timeDiff = Math.abs(streamStart.getTime() - existingStart.getTime());
        if (timeDiff < 30 * 60 * 1000 && timeDiff > 0) {
          conflicts.push({
            id: Date.now().toString(),
            streamerId: stream.streamerId,
            conflictType: 'too_close',
            conflictingStreams: [stream.id, existingStream.id],
            severity: 'medium',
            description: `Stream scheduled too close to "${existingStream.title}"`,
            suggestions: [
              'Add buffer time between streams',
              'Combine streams if topics are similar',
            ],
            autoResolvable: true,
          });
        }
      }
      
      console.log(`✅ Conflict check completed: ${conflicts.length} conflicts found`);
      return conflicts;
    } catch (error) {
      console.error('❌ Failed to check schedule conflicts:', error);
      return [];
    }
  }

  // Template Management
  async createTemplate(template: Omit<StreamTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<StreamTemplate> {
    console.log(`🔄 Creating stream template: ${template.name}`);
    
    try {
      const newTemplate: StreamTemplate = {
        id: Date.now().toString(),
        ...template,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const templates = await this.getTemplates();
      templates.push(newTemplate);
      await AsyncStorage.setItem(this.templatesKey, JSON.stringify(templates));

      console.log(`✅ Template created: ${newTemplate.name}`);
      return newTemplate;
    } catch (error) {
      console.error('❌ Failed to create template:', error);
      throw error;
    }
  }

  async getTemplates(streamerId?: string): Promise<StreamTemplate[]> {
    try {
      const stored = await AsyncStorage.getItem(this.templatesKey);
      const templates: StreamTemplate[] = stored ? JSON.parse(stored) : [];
      
      if (streamerId) {
        return templates.filter(t => t.streamerId === streamerId);
      }
      
      return templates;
    } catch (error) {
      console.error('❌ Failed to get templates:', error);
      return [];
    }
  }

  async applyTemplate(templateId: string, scheduledTime: string): Promise<Omit<ScheduledStream, 'id' | 'createdAt' | 'updatedAt'>> {
    console.log(`🔄 Applying template: ${templateId}`);
    
    try {
      const templates = await this.getTemplates();
      const template = templates.find(t => t.id === templateId);
      
      if (!template) {
        throw new Error('Template not found');
      }

      const streamData: Omit<ScheduledStream, 'id' | 'createdAt' | 'updatedAt'> = {
        streamerId: template.streamerId,
        streamerName: template.streamerId,
        streamerDisplayName: template.streamerId,
        platform: template.platform,
        title: template.title,
        description: template.description,
        category: template.category,
        scheduledStartTime: scheduledTime,
        estimatedDuration: template.duration,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isRecurring: false,
        status: 'scheduled',
        tags: template.tags,
        isPremium: false,
        isSubscriberOnly: false,
        language: 'en',
        collaborators: [],
        notificationSettings: template.notificationSettings,
        attendees: [],
        waitlistEnabled: false,
        waitlist: [],
        metadata: {},
        createdBy: template.streamerId,
      };

      console.log(`✅ Template applied: ${template.name}`);
      return streamData;
    } catch (error) {
      console.error('❌ Failed to apply template:', error);
      throw error;
    }
  }

  // Recurring Streams
  async generateRecurringStreams(stream: ScheduledStream, endDate: string): Promise<ScheduledStream[]> {
    console.log(`🔄 Generating recurring streams for: ${stream.title}`);
    
    try {
      if (!stream.isRecurring || !stream.recurrenceRule) {
        throw new Error('Stream is not set as recurring');
      }

      const generatedStreams: ScheduledStream[] = [];
      const rule = stream.recurrenceRule;
      const startDate = new Date(stream.scheduledStartTime);
      const endDateObj = new Date(endDate);
      
      let currentDate = new Date(startDate);
      let occurrenceCount = 0;
      
      while (currentDate <= endDateObj) {
        if (rule.maxOccurrences && occurrenceCount >= rule.maxOccurrences) {
          break;
        }

        // Skip exceptions
        if (rule.exceptions && rule.exceptions.includes(currentDate.toISOString().split('T')[0])) {
          currentDate = this.getNextOccurrence(currentDate, rule);
          continue;
        }

        // Create recurring stream
        const recurringStream: ScheduledStream = {
          ...stream,
          id: `${stream.id}_${occurrenceCount}`,
          scheduledStartTime: currentDate.toISOString(),
          scheduledEndTime: stream.scheduledEndTime ? 
            new Date(currentDate.getTime() + (new Date(stream.scheduledEndTime).getTime() - startDate.getTime())).toISOString() :
            undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        generatedStreams.push(recurringStream);
        occurrenceCount++;
        
        currentDate = this.getNextOccurrence(currentDate, rule);
      }

      console.log(`✅ Generated ${generatedStreams.length} recurring streams`);
      return generatedStreams;
    } catch (error) {
      console.error('❌ Failed to generate recurring streams:', error);
      throw error;
    }
  }

  private getNextOccurrence(currentDate: Date, rule: RecurrenceRule): Date {
    const next = new Date(currentDate);
    
    switch (rule.frequency) {
      case 'daily':
        next.setDate(next.getDate() + rule.interval);
        break;
      case 'weekly':
        next.setDate(next.getDate() + (7 * rule.interval));
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + rule.interval);
        break;
      default:
        next.setDate(next.getDate() + rule.interval);
        break;
    }
    
    return next;
  }

  // Utility Methods
  private async processReminders(): Promise<void> {
    try {
      const reminders = await this.getReminders();
      const now = new Date();
      
      for (const reminder of reminders) {
        const reminderTime = new Date(reminder.reminderTime);
        
        if (reminder.isActive && reminderTime <= now) {
          const scheduledStream = await this.getScheduledStream(reminder.scheduledStreamId);
          
          if (scheduledStream) {
            // Send Discord notification if enabled
            if (reminder.channels.includes('discord')) {
              await discordService.scheduleStreamReminder({
                id: scheduledStream.id,
                communityId: 'general',
                title: scheduledStream.title,
                description: scheduledStream.description,
                type: 'stream',
                startTime: scheduledStream.scheduledStartTime,
                endTime: scheduledStream.scheduledEndTime,
                isRecurring: scheduledStream.isRecurring,
                attendees: scheduledStream.attendees,
                createdBy: scheduledStream.createdBy,
                createdAt: scheduledStream.createdAt,
                updatedAt: scheduledStream.updatedAt,
                isPublic: true,
                tags: scheduledStream.tags,
                metadata: scheduledStream.metadata,
              });
            }
          }
          
          // Deactivate reminder
          reminder.isActive = false;
          await this.updateReminder(reminder);
        }
      }
    } catch (error) {
      console.error('❌ Failed to process reminders:', error);
    }
  }

  private async updateReminder(reminder: StreamReminder): Promise<void> {
    try {
      const reminders = await this.getReminders();
      const index = reminders.findIndex(r => r.id === reminder.id);
      
      if (index >= 0) {
        reminders[index] = reminder;
        await AsyncStorage.setItem(this.remindersKey, JSON.stringify(reminders));
      }
    } catch (error) {
      console.error('❌ Failed to update reminder:', error);
    }
  }

  private async cleanupExpiredSchedules(): Promise<void> {
    try {
      const schedules = await this.getScheduledStreams();
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const activeSchedules = schedules.filter(s => {
        const streamTime = new Date(s.scheduledStartTime);
        return streamTime > oneWeekAgo || s.status === 'scheduled';
      });
      
      if (activeSchedules.length !== schedules.length) {
        await AsyncStorage.setItem(this.storageKey, JSON.stringify(activeSchedules));
        console.log(`✅ Cleaned up ${schedules.length - activeSchedules.length} expired schedules`);
      }
    } catch (error) {
      console.error('❌ Failed to cleanup expired schedules:', error);
    }
  }

  // Public helper methods
  async getScheduleForDay(date: string, streamerId?: string): Promise<ScheduledStream[]> {
    try {
      const schedules = await this.getScheduledStreams(streamerId);
      const targetDate = new Date(date);
      
      return schedules.filter(s => {
        const streamDate = new Date(s.scheduledStartTime);
        return streamDate.toDateString() === targetDate.toDateString();
      });
    } catch (error) {
      console.error('❌ Failed to get schedule for day:', error);
      return [];
    }
  }

  async getScheduleForWeek(startDate: string, streamerId?: string): Promise<ScheduledStream[]> {
    try {
      const schedules = await this.getScheduledStreams(streamerId);
      const weekStart = new Date(startDate);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      return schedules.filter(s => {
        const streamDate = new Date(s.scheduledStartTime);
        return streamDate >= weekStart && streamDate < weekEnd;
      });
    } catch (error) {
      console.error('❌ Failed to get schedule for week:', error);
      return [];
    }
  }

  formatStreamTime(scheduledTime: string, timezone?: string): string {
    const date = new Date(scheduledTime);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    };
    
    if (timezone) {
      options.timeZone = timezone;
    }
    
    return date.toLocaleString(undefined, options);
  }

  getTimeUntilStream(scheduledTime: string): string {
    const now = new Date();
    const streamTime = new Date(scheduledTime);
    const diffMs = streamTime.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Stream has started';
    }
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}, ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}, ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
  }
}

export const schedulingService = new SchedulingService();

// Helper functions for easier importing
export const createScheduledStream = async (streamData: Omit<ScheduledStream, 'id' | 'createdAt' | 'updatedAt' | 'attendees' | 'waitlist'>) => {
  return schedulingService.createScheduledStream(streamData);
};

export const getUpcomingStreams = async (limit?: number, hours?: number) => {
  return schedulingService.getUpcomingStreams(limit, hours);
};

export const createStreamTemplate = async (template: Omit<StreamTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
  return schedulingService.createTemplate(template);
};

export const checkScheduleConflicts = async (stream: ScheduledStream) => {
  return schedulingService.checkScheduleConflicts(stream);
};
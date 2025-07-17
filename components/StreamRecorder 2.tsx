import { MotiView, MotiText } from 'moti';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
  PermissionsAndroid,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  Video,
  Square,
  Play,
  Pause,
  Download,
  Share as ShareIcon,
  Clock,
  HardDrive,
  AlertCircle,
  CheckCircle,
  Trash2,
} from 'lucide-react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { TwitchStream } from '@/services/twitchApi';
import { ModernTheme } from '@/theme/modernTheme';

interface StreamRecorderProps {
  stream: TwitchStream;
  streamRef: React.RefObject<View>;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onScreenshot?: (uri: string) => void;
}

interface RecordingSession {
  id: string;
  streamId: string;
  streamName: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  fileUri?: string;
  fileSize?: number;
  status: 'recording' | 'stopped' | 'processing' | 'completed' | 'failed';
}

interface ScreenshotSession {
  id: string;
  streamId: string;
  streamName: string;
  timestamp: Date;
  fileUri: string;
  fileSize: number;
  status: 'saving' | 'completed' | 'failed';
}

export const StreamRecorder: React.FC<StreamRecorderProps> = ({
  stream,
  streamRef,
  onRecordingStart,
  onRecordingStop,
  onScreenshot,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentSession, setCurrentSession] = useState<RecordingSession | null>(null);
  const [screenshots, setScreenshots] = useState<ScreenshotSession[]>([]);
  const [storagePermission, setStoragePermission] = useState<boolean | null>(null);
  const [availableSpace, setAvailableSpace] = useState<number>(0);

  const recordingInterval = useRef<NodeJS.Timeout>();
  const recordingStartTime = useRef<Date>();

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
    checkStorageSpace();
  }, []);

  const checkPermissions = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setStoragePermission(status === 'granted');

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);

        const writeGranted =
          granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === 'granted';
        const readGranted =
          granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === 'granted';

        setStoragePermission(writeGranted && readGranted);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setStoragePermission(false);
    }
  };

  const checkStorageSpace = async () => {
    try {
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      setAvailableSpace(freeSpace);
    } catch (error) {
      console.error('Error checking storage space:', error);
      setAvailableSpace(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {return '0 Bytes';}
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateFileName = (type: 'screenshot' | 'recording'): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = type === 'screenshot' ? 'png' : 'mp4';
    return `${stream.user_name}_${timestamp}.${extension}`;
  };

  const takeScreenshot = useCallback(async () => {
    if (!streamRef.current || !storagePermission) {
      Alert.alert('Permission Required', 'Storage permission is required to save screenshots.', [
        { text: 'OK', onPress: checkPermissions },
      ]);
      return;
    }

    const screenshotId = Date.now().toString();
    const newScreenshot: ScreenshotSession = {
      id: screenshotId,
      streamId: stream.id,
      streamName: stream.user_name,
      timestamp: new Date(),
      fileUri: '',
      fileSize: 0,
      status: 'saving',
    };

    setScreenshots(prev => [...prev, newScreenshot]);

    try {
      const result = await captureRef(streamRef.current, {
        format: 'png',
        quality: 0.8,
      });

      const fileName = generateFileName('screenshot');
      const fileUri = FileSystem.documentDirectory + fileName;

      // Move the temporary file to a permanent location
      await FileSystem.moveAsync({
        from: result,
        to: fileUri,
      });

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      const fileSize = fileInfo.exists ? fileInfo.size || 0 : 0;

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(fileUri);

      // Update screenshot status
      setScreenshots(prev =>
        prev.map(s =>
          s.id === screenshotId ? { ...s, fileUri, fileSize, status: 'completed' } : s
        )
      );

      onScreenshot?.(fileUri);

      Alert.alert(
        'Screenshot Saved',
        `Screenshot saved successfully!\nSize: ${formatFileSize(fileSize)}`,
        [{ text: 'OK' }, { text: 'Share', onPress: () => shareFile(fileUri) }]
      );
    } catch (error) {
      console.error('Error taking screenshot:', error);

      setScreenshots(prev =>
        prev.map(s => (s.id === screenshotId ? { ...s, status: 'failed' } : s))
      );

      Alert.alert('Screenshot Failed', 'Failed to save screenshot. Please try again.', [
        { text: 'OK' },
      ]);
    }
  }, [streamRef, stream, storagePermission, onScreenshot]);

  const startRecording = useCallback(async () => {
    if (!storagePermission) {
      Alert.alert('Permission Required', 'Storage permission is required to record streams.', [
        { text: 'OK', onPress: checkPermissions },
      ]);
      return;
    }

    // Check available space (require at least 100MB)
    if (availableSpace < 100 * 1024 * 1024) {
      Alert.alert(
        'Insufficient Storage',
        'Not enough storage space to start recording. Please free up space.',
        [{ text: 'OK' }]
      );
      return;
    }

    const sessionId = Date.now().toString();
    const newSession: RecordingSession = {
      id: sessionId,
      streamId: stream.id,
      streamName: stream.user_name,
      startTime: new Date(),
      duration: 0,
      status: 'recording',
    };

    setCurrentSession(newSession);
    setIsRecording(true);
    setRecordingDuration(0);
    recordingStartTime.current = new Date();

    // Start duration counter
    recordingInterval.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);

    onRecordingStart?.();

    console.log('Recording started for stream:', stream.user_name);
  }, [stream, storagePermission, availableSpace, onRecordingStart]);

  const stopRecording = useCallback(async () => {
    if (!currentSession || !isRecording) {return;}

    setIsRecording(false);

    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - currentSession.startTime.getTime()) / 1000);

    // Update session status
    setCurrentSession(prev =>
      prev
        ? {
            ...prev,
            endTime,
            duration,
            status: 'processing',
          }
        : null
    );

    onRecordingStop?.();

    try {
      // In a real implementation, you would:
      // 1. Stop the actual video recording
      // 2. Process the video file
      // 3. Save to media library
      // 4. Update session with file info

      // For now, we'll simulate the process
      setTimeout(() => {
        const fileName = generateFileName('recording');
        const fileUri = FileSystem.documentDirectory + fileName;
        const estimatedSize = duration * 1024 * 100; // Rough estimate

        setCurrentSession(prev =>
          prev
            ? {
                ...prev,
                fileUri,
                fileSize: estimatedSize,
                status: 'completed',
              }
            : null
        );

        Alert.alert(
          'Recording Saved',
          `Recording saved successfully!\nDuration: ${formatDuration(duration)}\nSize: ${formatFileSize(estimatedSize)}`,
          [{ text: 'OK' }, { text: 'Share', onPress: () => shareFile(fileUri) }]
        );
      }, 2000);
    } catch (error) {
      console.error('Error stopping recording:', error);

      setCurrentSession(prev =>
        prev
          ? {
              ...prev,
              status: 'failed',
            }
          : null

      Alert.alert('Recording Failed', 'Failed to save recording. Please try again.', [
        { text: 'OK' },
      ]);
    }
  }, [currentSession, isRecording, onRecordingStop]);

  const shareFile = async (fileUri: string) => {
    try {
      const canShare = await Share.share({
        url: fileUri,
        message: `Check out this stream from ${stream.user_name}!`,
      });
    } catch (error) {
      console.error('Error sharing file:', error);
      Alert.alert('Share Failed', 'Failed to share file.');
    }
  };

  const deleteFile = async (fileUri: string) => {
    try {
      await FileSystem.deleteAsync(fileUri);
      setScreenshots(prev => prev.filter(s => s.fileUri !== fileUri));
      Alert.alert('File Deleted', 'File has been deleted successfully.');
    } catch (error) {
      console.error('Error deleting file:', error);
      Alert.alert('Delete Failed', 'Failed to delete file.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'recording':
      case 'saving':
        return <Clock size={16} color="#F59E0B" />;
      case 'processing':
        return <HardDrive size={16} color="#8B5CF6" />;
      case 'completed':
        return <CheckCircle size={16} color="#10B981" />;
      case 'failed':
        return <AlertCircle size={16} color="#EF4444" />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[ModernTheme.colors.background.secondary, ModernTheme.colors.background.primary]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Video size={20} color={ModernTheme.colors.primary[500]} />
            <Text style={styles.headerTitle}>Stream Recorder</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.storageInfo}>{formatFileSize(availableSpace)} free</Text>
          </View>
        </View>

        {/* Current Recording Status */}
        {currentSession && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={styles.currentSession}
          >
            <LinearGradient
              colors={
                currentSession.status === 'recording'
                  ? [ModernTheme.colors.error[600], ModernTheme.colors.error[500]]
                  : [ModernTheme.colors.gray[700], ModernTheme.colors.gray[600]]
              }
              style={styles.sessionGradient}
            >
              <View style={styles.sessionInfo}>
                <View style={styles.sessionHeader}>
                  {getStatusIcon(currentSession.status)}
                  <Text style={styles.sessionTitle}>
                    {currentSession.status === 'recording' ? 'Recording' : 'Last Recording'}
                  </Text>
                </View>

                <Text style={styles.sessionDuration}>
                  {isRecording
                    ? formatDuration(recordingDuration)
                    : formatDuration(currentSession.duration)}
                </Text>
              </View>

              {currentSession.fileSize && (
                <Text style={styles.sessionSize}>{formatFileSize(currentSession.fileSize)}</Text>
              )}
            </LinearGradient>
          </MotiView>
        )}

        {/* Recording Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.screenshotButton}
            onPress={takeScreenshot}
            disabled={!storagePermission}
          >
            <LinearGradient
              colors={[ModernTheme.colors.secondary[600], ModernTheme.colors.secondary[500]]}
              style={styles.buttonGradient}
            >
              <Camera size={20} color={ModernTheme.colors.text.primary} />
              <Text style={styles.buttonText}>Screenshot</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.recordButton}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={!storagePermission}
          >
            <LinearGradient
              colors={
                isRecording
                  ? [ModernTheme.colors.error[600], ModernTheme.colors.error[500]]
                  : [ModernTheme.colors.success[600], ModernTheme.colors.success[500]]
              }
              style={styles.buttonGradient}
            >
              {isRecording ? (
                <Square size={20} color={ModernTheme.colors.text.primary} />
              ) : (
                <Video size={20} color={ModernTheme.colors.text.primary} />
              )}
              <Text style={styles.buttonText}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Permission Warning */}
        {storagePermission === false && (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.permissionWarning}
          >
            <AlertCircle size={20} color={ModernTheme.colors.error[500]} />
            <Text style={styles.permissionText}>
              Storage permission required for recording and screenshots
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={checkPermissions}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </MotiView>
        )}

        {/* Recent Screenshots */}
        {screenshots.length > 0 && (
          <View style={styles.recentFiles}>
            <Text style={styles.recentTitle}>Recent Screenshots</Text>
            {screenshots.slice(-3).map(screenshot => (
              <MotiView
                key={screenshot.id}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                style={styles.fileItem}
              >
                <LinearGradient
                  colors={[
                    ModernTheme.colors.background.secondary,
                    ModernTheme.colors.background.primary,
                  ]}
                  style={styles.fileGradient}
                >
                  <View style={styles.fileInfo}>
                    <View style={styles.fileHeader}>
                      {getStatusIcon(screenshot.status)}
                      <Text style={styles.fileName} numberOfLines={1}>
                        {screenshot.streamName}
                      </Text>
                    </View>
                    <Text style={styles.fileTimestamp}>
                      {screenshot.timestamp.toLocaleTimeString()}
                    </Text>
                  </View>

                  <View style={styles.fileActions}>
                    {screenshot.status === 'completed' && (
                      <>
                        <TouchableOpacity
                          style={styles.fileAction}
                          onPress={() => shareFile(screenshot.fileUri)}
                        >
                          <ShareIcon size={16} color={ModernTheme.colors.primary[500]} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.fileAction}
                          onPress={() => deleteFile(screenshot.fileUri)}
                        >
                          <Trash2 size={16} color={ModernTheme.colors.error[500]} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </LinearGradient>
              </MotiView>
            ))}
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: ModernTheme.borderRadius.lg,
    overflow: 'hidden',
    margin: ModernTheme.spacing.sm,
  },
  gradient: {
    padding: ModernTheme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ModernTheme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
  },
  headerTitle: {
    fontSize: ModernTheme.typography.sizes.lg,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  storageInfo: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
  },
  currentSession: {
    marginBottom: ModernTheme.spacing.md,
  },
  sessionGradient: {
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
    marginBottom: ModernTheme.spacing.xs,
  },
  sessionTitle: {
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
  },
  sessionDuration: {
    fontSize: ModernTheme.typography.sizes.xl,
    fontWeight: ModernTheme.typography.weights.bold,
    color: ModernTheme.colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  sessionSize: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
  },
  controls: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.md,
    marginBottom: ModernTheme.spacing.md,
  },
  screenshotButton: {
    flex: 1,
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  recordButton: {
    flex: 2,
    borderRadius: ModernTheme.borderRadius.md,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ModernTheme.spacing.md,
    paddingHorizontal: ModernTheme.spacing.lg,
    gap: ModernTheme.spacing.sm,
  },
  buttonText: {
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
  },
  permissionWarning: {
    backgroundColor: ModernTheme.colors.error[100],
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.md,
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
    marginBottom: ModernTheme.spacing.md,
  },
  permissionText: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.error[700],
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: ModernTheme.colors.error[500],
    borderRadius: ModernTheme.borderRadius.sm,
    paddingHorizontal: ModernTheme.spacing.md,
    paddingVertical: ModernTheme.spacing.sm,
  },
  permissionButtonText: {
    fontSize: ModernTheme.typography.sizes.sm,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
  },
  recentFiles: {
    marginTop: ModernTheme.spacing.md,
  },
  recentTitle: {
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.semibold,
    color: ModernTheme.colors.text.primary,
    marginBottom: ModernTheme.spacing.sm,
  },
  fileItem: {
    marginBottom: ModernTheme.spacing.sm,
  },
  fileGradient: {
    borderRadius: ModernTheme.borderRadius.md,
    padding: ModernTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ModernTheme.colors.border.primary,
  },
  fileInfo: {
    flex: 1,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernTheme.spacing.sm,
    marginBottom: ModernTheme.spacing.xs,
  },
  fileName: {
    fontSize: ModernTheme.typography.sizes.md,
    fontWeight: ModernTheme.typography.weights.medium,
    color: ModernTheme.colors.text.primary,
    flex: 1,
  },
  fileTimestamp: {
    fontSize: ModernTheme.typography.sizes.sm,
    color: ModernTheme.colors.text.secondary,
  },
  fileActions: {
    flexDirection: 'row',
    gap: ModernTheme.spacing.sm,
  },
  fileAction: {
    padding: ModernTheme.spacing.sm,
  },
});

export default StreamRecorder;

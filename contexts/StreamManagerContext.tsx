import React, { createContext, useContext, ReactNode } from 'react';
import { useStreamManager } from '@/hooks/useStreamManager';

// Define the context type
type StreamManagerContextType = ReturnType<typeof useStreamManager>;

// Create the context
const StreamManagerContext = createContext<StreamManagerContextType | undefined>(undefined);

// Provider component
interface StreamManagerProviderProps {
  children: ReactNode;
}

export const StreamManagerProvider: React.FC<StreamManagerProviderProps> = ({ children }) => {
  const streamManager = useStreamManager();
  
  // Debug logging for context state changes
  React.useEffect(() => {
    console.log('StreamManagerContext - Active streams changed:', streamManager.activeStreams.length);
  }, [streamManager.activeStreams]);
  
  return (
    <StreamManagerContext.Provider value={streamManager}>
      {children}
    </StreamManagerContext.Provider>
  );
};

// Hook to use the stream manager context
export const useStreamManagerContext = (): StreamManagerContextType => {
  const context = useContext(StreamManagerContext);
  if (!context) {
    throw new Error('useStreamManagerContext must be used within a StreamManagerProvider');
  }
  return context;
};

export default StreamManagerProvider;
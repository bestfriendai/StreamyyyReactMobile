declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_TWITCH_CLIENT_ID: string;
      EXPO_PUBLIC_TWITCH_CLIENT_SECRET: string;
    }
  }
}

export {};

// Clerk Configuration Template
// Add this to your app configuration

export const clerkConfig = {
  publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,

  // OAuth providers (configure in Clerk Dashboard)
  oauthProviders: [
    'oauth_google',
    'oauth_twitch',
    // 'oauth_discord', // Removed per user preference
    // 'oauth_github',
    // 'oauth_twitter',
  ],
  
  // Sign-in/Sign-up options
  signIn: {
    elements: {
      emailAddress: { required: true },
      password: { required: true },
      phoneNumber: { required: false },
    }
  },
  
  signUp: {
    elements: {
      emailAddress: { required: true },
      password: { required: true },
      firstName: { required: true },
      lastName: { required: true },
    }
  },
  
  // Appearance customization
  appearance: {
    theme: 'dark',
    variables: {
      colorPrimary: '#8B5CF6',
      colorBackground: '#000000',
      colorInputBackground: '#1F2937',
      colorInputText: '#FFFFFF',
    }
  }
};

// Temporary debug file to check environment variables
console.log('=== Environment Variables Debug ===');
console.log('EXPO_PUBLIC_TWITCH_CLIENT_ID:', process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID);
console.log('EXPO_PUBLIC_TWITCH_CLIENT_SECRET:', process.env.EXPO_PUBLIC_TWITCH_CLIENT_SECRET);
console.log('All EXPO_PUBLIC vars:', Object.keys(process.env).filter(key => key.startsWith('EXPO_PUBLIC')));
console.log('=== End Debug ===');
#!/usr/bin/env node

const os = require('os');

console.log('🔗 OAuth Redirect URLs for Clerk Dashboard');
console.log('='.repeat(50));

// Get network interfaces
const networks = os.networkInterfaces();
const ips = [];

Object.keys(networks).forEach(interfaceName => {
  networks[interfaceName].forEach(network => {
    if (network.family === 'IPv4' && !network.internal) {
      ips.push(network.address);
    }
  });
});

console.log('\n📍 Your current IP addresses:');
ips.forEach(ip => console.log(`   ${ip}`));

console.log('\n📋 Add these URLs to Clerk Dashboard:');
console.log('   (User & Authentication → Social Connections → Provider → Configure → Redirect URLs)');

console.log('\n🔹 Primary OAuth URLs (Add these first):');
console.log('   streamyyy://oauth-callback');
console.log('   https://accounts.clerk.dev/v1/oauth_callback');

console.log('\n🔹 Development URLs (Current session):');
// Current ports that appeared in error messages
const currentPorts = ['8082', '8083', '19000', '19006'];

ips.forEach(ip => {
  currentPorts.forEach(port => {
    console.log(`   exp://${ip}:${port}/--/oauth-native-callback`);
  });
});

console.log('\n🔹 Localhost Development URLs:');
currentPorts.forEach(port => {
  console.log(`   exp://localhost:${port}/--/oauth-native-callback`);
});

console.log('\n🔹 Alternative Custom Schemes:');
console.log('   streamyyy://oauth-native-callback');
console.log('   streamyyy://sso-callback');

console.log('\n🔹 Production URLs:');
console.log('   https://clerk.streamyyy.com/v1/oauth_callback');
console.log('   https://streamyyy.com/oauth-callback');

console.log('\n🚀 Instructions:');
console.log('1. Go to https://dashboard.clerk.com/');
console.log('2. Select your Streamyyy project');
console.log('3. Go to User & Authentication → Social Connections');
console.log('4. Click Google → Configure → Add all URLs above');
console.log('5. Click Discord → Configure → Add all URLs above');
console.log('6. Save and test OAuth again!');

console.log('\n✅ Pro tip: Copy/paste each URL exactly as shown above');
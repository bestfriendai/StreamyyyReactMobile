#!/usr/bin/env node

/**
 * Clerk Helper Script
 * A simple utility to help manage Clerk integration without official CLI
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvironmentVariables() {
  log('\n🔐 CLERK ENVIRONMENT VARIABLES CHECK', 'cyan');
  log('=' .repeat(50), 'cyan');

  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    log('❌ .env file not found!', 'red');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  const requiredVars = [
    'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ];

  const optionalVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ];

  let allRequired = true;

  // Check required variables
  log('\nRequired Variables:', 'bright');
  requiredVars.forEach(varName => {
    const found = envLines.some(line => line.startsWith(`${varName}=`));
    if (found) {
      log(`  ✅ ${varName}`, 'green');
    } else {
      log(`  ❌ ${varName} - MISSING!`, 'red');
      allRequired = false;
    }
  });

  // Check optional variables
  log('\nOptional Variables:', 'bright');
  optionalVars.forEach(varName => {
    const found = envLines.some(line => line.startsWith(`${varName}=`));
    if (found) {
      log(`  ✅ ${varName}`, 'green');
    } else {
      log(`  ⚠️  ${varName} - Not set`, 'yellow');
    }
  });

  return allRequired;
}

function validateClerkKeys() {
  log('\n🔑 CLERK KEYS VALIDATION', 'cyan');
  log('=' .repeat(50), 'cyan');

  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!publishableKey) {
    log('❌ Publishable key not found in environment', 'red');
    return false;
  }

  // Validate publishable key format
  if (publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_')) {
    log(`✅ Publishable key format is valid (${publishableKey.startsWith('pk_test_') ? 'TEST' : 'LIVE'})`, 'green');
  } else {
    log('❌ Publishable key format is invalid', 'red');
    return false;
  }

  if (secretKey) {
    if (secretKey.startsWith('sk_test_') || secretKey.startsWith('sk_live_')) {
      log(`✅ Secret key format is valid (${secretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE'})`, 'green');
    } else {
      log('❌ Secret key format is invalid', 'red');
      return false;
    }
  } else {
    log('⚠️  Secret key not set (only needed for backend operations)', 'yellow');
  }

  // Check if keys match environment
  const pubKeyEnv = publishableKey.startsWith('pk_test_') ? 'test' : 'live';
  const secKeyEnv = secretKey ? (secretKey.startsWith('sk_test_') ? 'test' : 'live') : pubKeyEnv;

  if (pubKeyEnv === secKeyEnv) {
    log(`✅ Keys are from the same environment (${pubKeyEnv.toUpperCase()})`, 'green');
  } else {
    log('❌ Keys are from different environments!', 'red');
    return false;
  }

  return true;
}

function checkPackageJson() {
  log('\n📦 PACKAGE.JSON CHECK', 'cyan');
  log('=' .repeat(50), 'cyan');

  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    log('❌ package.json not found!', 'red');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const clerkPackages = [
    '@clerk/clerk-expo',
    '@clerk/clerk-react',
    '@clerk/clerk-js'
  ];

  let hasClerk = false;
  clerkPackages.forEach(pkg => {
    if (dependencies[pkg]) {
      log(`✅ ${pkg}: ${dependencies[pkg]}`, 'green');
      hasClerk = true;
    }
  });

  if (!hasClerk) {
    log('❌ No Clerk packages found in dependencies!', 'red');
    return false;
  }

  return true;
}

function generateClerkConfig() {
  log('\n⚙️  GENERATING CLERK CONFIGURATION TEMPLATE', 'cyan');
  log('=' .repeat(50), 'cyan');

  const configTemplate = `
// Clerk Configuration Template
// Add this to your app configuration

export const clerkConfig = {
  publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  
  // OAuth providers (configure in Clerk Dashboard)
  oauthProviders: [
    'oauth_google',
    'oauth_discord',
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
`;

  const configPath = path.join(process.cwd(), 'config', 'clerk.config.js');
  const configDir = path.dirname(configPath);

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(configPath, configTemplate);
  log(`✅ Configuration template saved to: ${configPath}`, 'green');
}

function showUsageInstructions() {
  log('\n📚 CLERK INTEGRATION USAGE', 'cyan');
  log('=' .repeat(50), 'cyan');

  log('\n1. Environment Setup:', 'bright');
  log('   • Get your keys from: https://dashboard.clerk.com', 'yellow');
  log('   • Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to .env', 'yellow');
  log('   • Add CLERK_SECRET_KEY to .env (for backend)', 'yellow');

  log('\n2. OAuth Setup:', 'bright');
  log('   • Configure OAuth providers in Clerk Dashboard', 'yellow');
  log('   • Add redirect URLs for your app', 'yellow');
  log('   • Test OAuth flows in development', 'yellow');

  log('\n3. Testing:', 'bright');
  log('   • Use the ClerkVerificationScreen component', 'yellow');
  log('   • Check browser console for Clerk logs', 'yellow');
  log('   • Test sign-in/sign-up flows', 'yellow');

  log('\n4. Useful Links:', 'bright');
  log('   • Dashboard: https://dashboard.clerk.com', 'blue');
  log('   • Docs: https://clerk.com/docs', 'blue');
  log('   • Expo Guide: https://clerk.com/docs/quickstarts/expo', 'blue');
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  log('🚀 CLERK HELPER UTILITY', 'magenta');
  log('=' .repeat(50), 'magenta');

  switch (command) {
    case 'check':
      checkEnvironmentVariables();
      validateClerkKeys();
      checkPackageJson();
      break;
    
    case 'config':
      generateClerkConfig();
      break;
    
    case 'help':
    case '--help':
    case '-h':
      showUsageInstructions();
      break;
    
    default:
      log('\nAvailable commands:', 'bright');
      log('  check  - Check environment and configuration', 'yellow');
      log('  config - Generate configuration template', 'yellow');
      log('  help   - Show usage instructions', 'yellow');
      log('\nExample: node scripts/clerk-helper.js check', 'cyan');
      break;
  }
}

// Load environment variables
require('dotenv').config();

main();

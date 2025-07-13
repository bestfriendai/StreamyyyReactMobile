#!/usr/bin/env node
/**
 * Custom TypeScript checking script
 * Handles module resolution issues and provides detailed error reporting
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();

// Files to check
const CRITICAL_FILES = [
  'store/useAppStore.ts',
  'services/twitchApi.ts',
  'components/modern/ModernMultiStreamGrid.tsx',
  'components/modern/ModernStreamCard.tsx',
  'components/modern/LayoutManager.tsx',
  'theme/modernTheme.ts',
  'types/stream.ts',
  'types/api.ts',
  'types/ui.ts',
];

// Common TypeScript issues and fixes
const COMMON_FIXES = {
  'Cannot find module': 'Check import paths and ensure files exist',
  'Property does not exist': 'Check interface definitions and type exports',
  'Type is missing': 'Add proper type annotations or import missing types',
  'Declaration or statement expected': 'Check for syntax errors or missing semicolons',
};

/**
 * Check if a file exists and is readable
 */
function checkFileExists(filePath) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  try {
    fs.accessSync(fullPath, fs.constants.R_OK);
    return true;
  } catch (error) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }
}

/**
 * Run TypeScript check on a specific file
 */
function checkFile(filePath) {
  return new Promise((resolve) => {
    const command = `npx tsc --noEmit --skipLibCheck "${filePath}"`;
    
    exec(command, { cwd: PROJECT_ROOT }, (error, stdout, stderr) => {
      const result = {
        file: filePath,
        success: !error,
        errors: [],
        warnings: [],
      };

      if (error) {
        const output = stderr || stdout || error.message;
        const lines = output.split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
          if (line.includes('error TS')) {
            result.errors.push(line.trim());
          } else if (line.includes('warning')) {
            result.warnings.push(line.trim());
          }
        });
      }

      resolve(result);
    });
  });
}

/**
 * Analyze TypeScript errors and provide suggestions
 */
function analyzeErrors(errors) {
  const suggestions = [];
  
  errors.forEach(error => {
    for (const [pattern, suggestion] of Object.entries(COMMON_FIXES)) {
      if (error.includes(pattern)) {
        suggestions.push(`💡 ${suggestion}`);
        break;
      }
    }
  });

  return suggestions;
}

/**
 * Generate a detailed report
 */
function generateReport(results) {
  const report = {
    totalFiles: results.length,
    passedFiles: results.filter(r => r.success).length,
    failedFiles: results.filter(r => !r.success).length,
    totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
    totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
    details: results,
  };

  return report;
}

/**
 * Print formatted report
 */
function printReport(report) {
  console.log('\n🔍 TypeScript Integration Check Results');
  console.log('=====================================');
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total files checked: ${report.totalFiles}`);
  console.log(`   ✅ Passed: ${report.passedFiles}`);
  console.log(`   ❌ Failed: ${report.failedFiles}`);
  console.log(`   🔴 Total errors: ${report.totalErrors}`);
  console.log(`   🟡 Total warnings: ${report.totalWarnings}`);

  if (report.failedFiles > 0) {
    console.log(`\n🚨 Files with errors:`);
    
    report.details.forEach(result => {
      if (!result.success) {
        console.log(`\n📄 ${result.file}:`);
        
        result.errors.forEach(error => {
          console.log(`   ❌ ${error}`);
        });
        
        if (result.warnings.length > 0) {
          result.warnings.forEach(warning => {
            console.log(`   🟡 ${warning}`);
          });
        }

        const suggestions = analyzeErrors(result.errors);
        if (suggestions.length > 0) {
          console.log(`\n   Suggestions:`);
          suggestions.forEach(suggestion => {
            console.log(`   ${suggestion}`);
          });
        }
      }
    });
  }

  if (report.passedFiles > 0) {
    console.log(`\n✅ Files passing TypeScript check:`);
    report.details.forEach(result => {
      if (result.success) {
        console.log(`   ✓ ${result.file}`);
      }
    });
  }

  console.log(`\n🎯 Integration Status: ${report.failedFiles === 0 ? 'READY FOR PRODUCTION' : 'NEEDS ATTENTION'}`);
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting TypeScript Integration Check...\n');

  // Check if critical files exist
  console.log('📁 Checking file availability...');
  const existingFiles = CRITICAL_FILES.filter(checkFileExists);
  
  if (existingFiles.length < CRITICAL_FILES.length) {
    console.log(`\n⚠️  Some files are missing. Checking ${existingFiles.length} available files.\n`);
  }

  // Run TypeScript checks
  console.log('🔧 Running TypeScript checks...');
  const results = await Promise.all(
    existingFiles.map(file => checkFile(file))
  );

  // Generate and print report
  const report = generateReport(results);
  printReport(report);

  // Set exit code based on results
  process.exit(report.failedFiles > 0 ? 1 : 0);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { checkFile, generateReport, analyzeErrors };
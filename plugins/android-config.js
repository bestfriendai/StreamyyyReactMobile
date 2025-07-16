const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidGradleConfig(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      // Add gradle configurations for Google Mobile Ads
      config.modResults.contents = config.modResults.contents.replace(
        /allprojects \{[\s\S]*?repositories \{/,
        `allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://www.jitpack.io' }`
      );

      // Add dependency resolution strategy
      if (!config.modResults.contents.includes('resolutionStrategy')) {
        config.modResults.contents = config.modResults.contents.replace(
          /allprojects \{[\s\S]*?repositories \{[\s\S]*?\}[\s\S]*?\}/,
          `allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://www.jitpack.io' }
    }
    
    configurations.all {
        resolutionStrategy {
            force 'com.google.android.gms:play-services-ads:22.5.0'
            force 'com.google.android.gms:play-services-basement:18.1.0'
        }
    }
}`
        );
      }
    }
    return config;
  });
};
// App Store and Play Store metadata configuration
export default {
  // iOS App Store metadata
  ios: {
    appName: "Multi-Stream Viewer",
    subtitle: "Watch Multiple Streams",
    description: "Experience the ultimate multi-streaming platform. Watch multiple live streams simultaneously with our intuitive grid layout, advanced controls, and seamless switching between platforms like Twitch, YouTube, and more.",
    keywords: ["streaming", "twitch", "youtube", "multi-stream", "live", "viewer", "grid"],
    primaryCategory: "Entertainment",
    secondaryCategory: "Social Networking",
    contentRating: "12+",
    contentAdvisoryRating: {
      cartoonOrFantasyViolence: "NONE",
      realisticViolence: "NONE",
      prolongedGraphicViolence: "NONE",
      profanityOrCrudeHumor: "MILD",
      matureOrSuggestiveThemes: "MILD",
      horrorOrFearThemes: "NONE",
      medicalTreatmentInfo: "NONE",
      alcoholTobaccoOrDrugUse: "MILD",
      gambling: "NONE",
      sexualContentOrNudity: "NONE",
      graphicSexualContentOrNudity: "NONE"
    },
    supportURL: "https://streamyyy.com/support",
    marketingURL: "https://streamyyy.com",
    privacyPolicyURL: "https://streamyyy.com/privacy"
  },
  
  // Android Play Store metadata
  android: {
    appName: "Multi-Stream Viewer",
    shortDescription: "Watch multiple live streams simultaneously",
    fullDescription: "Transform your streaming experience with Multi-Stream Viewer. Our innovative app lets you watch multiple live streams at once with an intuitive grid layout. Switch between Twitch, YouTube, and other platforms seamlessly. Perfect for keeping up with multiple streamers, comparing content, or monitoring your favorite creators.\n\nFeatures:\n• Multi-stream grid layout\n• Support for major platforms\n• Intuitive controls\n• Picture-in-picture mode\n• Favorite streams management\n• Dark/light theme support",
    category: "ENTERTAINMENT",
    contentRating: "Teen",
    contentRatingDetails: {
      violenceDescription: "No violence content",
      sexualContentDescription: "No sexual content",
      profanityDescription: "May contain mild language in user-generated content",
      substanceUseDescription: "May contain references to substances in streaming content",
      gamblingDescription: "No gambling content",
      realMoneyGamblingDescription: "No real money gambling"
    },
    targetAudience: "13+",
    tags: ["streaming", "entertainment", "video", "live", "social"],
    website: "https://streamyyy.com",
    email: "support@streamyyy.com",
    privacyPolicy: "https://streamyyy.com/privacy",
    dataCollectionDisclosure: {
      collectsPersonalInfo: true,
      sharesPersonalInfo: false,
      encryptsData: true,
      deletesDataOnRequest: true
    }
  }
};
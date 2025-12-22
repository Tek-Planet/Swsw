import 'expo-env';

export default () => ({
    expo: {
      name: "Grid",
      slug: "grid",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/images/icon.png",
      scheme: "grid",
      userInterfaceStyle: "automatic",
      newArchEnabled: true,
      ios: {
        supportsTablet: true,
        googleServicesFile: "./GoogleService-Info.plist",
        bundleIdentifier: "com.techplanet.grid",
        infoPlist: {
          ITSAppUsesNonExemptEncryption: false
        }
      },
      android: {
        package: "com.techplanet.grid",
        adaptiveIcon: {
          backgroundColor: "#FFFFFF",
          foregroundImage: "./assets/images/android-icon-foreground.png",
          backgroundImage: "./assets/images/android-icon-background.png",
          monochromeImage: "./assets/images/android-icon-monochrome.png"
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false
      },
      web: {
        output: "static",
        favicon: "./assets/images/favicon.png"
      },
      plugins: [
        "expo-router",
        [
          "expo-splash-screen",
          {
            image: "./assets/images/splash-icon.png",
            imageWidth: 200,
            resizeMode: "contain",
            backgroundColor: "#ffffff",
            dark: {
              backgroundColor: "#000000"
            }
          }
        ],
        "expo-web-browser",
        "expo-font"
      ],
      experiments: {
        typedRoutes: true,
        reactCompiler: true
      },
      extra: {
        eas: {
          projectId: "3f6993c4-5f31-42c9-afbe-a246d37ace7e"
        },
        firebase: {
          apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
          measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
        }
      }
    }
  });
  
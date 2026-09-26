# 🚛 EcoSyz Labour App (Smart Garbage Collection System)

A React Native & Expo mobile application built for field workers and garbage collection staff, featuring QR code scanning, GPS route tracking, and **voice-assisted garbage collection**.

---

## ⚠️ Important Note: EAS & Development Builds Required

> **Why Not Expo Go?**  
> This application uses custom native modules and permissions (**`expo-speech-recognition`**, **`expo-camera`**, **`expo-location`**, and the **React Native New Architecture**) that are **not supported in the standard Expo Go sandbox**.  
> 
> You must run the app using an **Expo Development Build (`expo-dev-client`)** or install the **EAS Preview APK** directly on your device.

---

## 📋 Prerequisites

- **Node.js**: v18+ installed
- **npm** or **yarn**
- **EAS CLI** installed globally:
  ```bash
  npm install -g eas-cli
  ```
- **Expo Account**: Log in via terminal:
  ```bash
  eas login
  ```

---

## 🚀 Getting Started

### 1. Install Dependencies
From the `app-frontend` directory:
```bash
npm install
```

### 2. Configure Backend API Endpoint
Ensure `config.js` is set to your machine's local network IP address (do not use `localhost` when testing on a physical mobile device):
```javascript
// app-frontend/config.js
export const API_URL = 'http://<YOUR_LOCAL_IP>:8000/api';
```

### 3. Start the Development Server
Start the bundler with the development client flag:
```bash
npx expo start --dev-client
# or
npm start
```

---

## 📦 Building the App with EAS Build

We have pre-configured build profiles in `eas.json` for Android:

### 📱 Option A: Build Standalone APK (Recommended for Testing & Field Use)
Generates an installable `.apk` file that you can directly install on any Android phone:
```bash
npm run build:apk
# or
eas build -p android --profile preview
```
Once the build completes on EAS cloud, download the APK from the terminal link or your Expo dashboard and install it on your device.

---

### 🛠️ Option B: Build a Custom Development Client
Builds a custom dev client container APK with all native dependencies (`expo-speech-recognition`, camera, etc.) pre-installed. Once installed on your test phone, you get live code reloading just like Expo Go:
```bash
eas build -p android --profile development
```
After installing the Dev Client APK on your phone:
1. Run `npx expo start --dev-client` on your computer.
2. Scan the QR code or select your local server inside the dev client app.

---

### 🚀 Option C: Production Release
```bash
npm run build:android
# or
eas build -p android --profile production
```

---

## 💻 Local Native Build (Optional - with Android Studio)

If you have Android Studio and the Android SDK installed locally on your machine:
```bash
npm run android
```

---

## ✨ Key Features

- 🎧 **"Hey Eco" Hands-Free Collection**: 
  - **Wake Word Recognition**: Workers say *"Hey Eco, Bin 102 collected 3 kg"*.
  - **3-Second Auto-Submit**: Automatically validates GPS & submits without touching the screen.
  - **Text-to-Speech (TTS) Readback**: Audio spoken into Bluetooth earphones with cancellation support.
  - **Pocket AMOLED Mode**: Blackout low-power screen mode to keep the phone in pockets without accidental touches or battery drain.
- 📷 **QR Code Scanner**: High-speed camera scanner to verify dustbins.
- 🗺️ **GPS Location & Map Navigation**: Real-time coordinates and interactive map tracking.
- 🕒 **Attendance Management**: Check in / check out with location verification.
- 🔔 **Custom Feedback & Alerts**: Interactive status modals and error handling.

---

## 🔧 Useful Scripts

| Command | Description |
| :--- | :--- |
| `npm start` | Starts Expo bundler (`expo start`) |
| `npm run build:apk` | Triggers cloud EAS build for preview APK |
| `npm run build:android` | Triggers cloud EAS production build |
| `npm run android` | Compiles and runs locally via Android Studio / emulator |
| `npm run lint` | Runs Expo ESLint checks |

---

## ❓ Troubleshooting

- **`expo-speech-recognition` or Camera crashing on Expo Go**:  
  Standard Expo Go does not contain native speech recognition binaries. Use an EAS development build or Preview APK.
- **Network Error / Cannot connect to backend**:  
  Ensure your phone and computer are on the same Wi-Fi network and `API_URL` in `config.js` is set to your machine's LAN IP (e.g. `192.168.x.x:8000/api`).
- **Permissions Denied**:  
  Ensure Camera, Location, and Microphone permissions are granted in your Android device settings.

# Daymark — Reminders

An Expo and React Native app for creating recurring reminders with the Reminder API.

## Features

- Email/password sign-in and tenant registration
- Secure native session storage; browser session storage on web
- Today overview, reminder filters, activity history, and account settings
- Create, edit, pause, resume, complete, and delete recurring reminders
- Weekly, 15-day, monthly, yearly, and custom intervals
- Android push-token registration with the backend

## Run the app

1. Start the Go API from `D:\workspace\reminderapp\reminderbackend` and make sure its PostgreSQL database is configured.
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the backend host. Do not include `/api/v1`.
   - Android emulator: `http://10.0.2.2:8080`
   - iOS simulator: `http://localhost:8080`
   - Physical device: use the computer's LAN IP and ensure the device can reach it.
3. Install dependencies and start Expo:

   ```sh
   npm install
   npx expo start
   ```

4. Open the project in Expo Go or a development build. For Android push notifications, configure Firebase for the native app (including its Android Firebase configuration), use a development build on a physical device, and run the backend's FCM worker with service-account credentials. iOS push delivery additionally needs Firebase/APNs project configuration. Each account can register multiple devices and pause notifications for each one from Account settings.

## API

The client uses the backend's `/api/v1` endpoints. Reminders include a local notification time and IANA timezone; the default time is 9:00 AM in the device timezone. The API URL is read from `EXPO_PUBLIC_API_URL`; the Android emulator default is `http://10.0.2.2:8080` and other platforms default to `http://localhost:8080`.
Web sessions are stored in browser local storage and are not encrypted; avoid signing in on shared browsers.

The backend enforces a minimum password length of 12 characters and E.164 phone numbers for registration. Custom reminder intervals are limited to 1–1000 days, weeks, months, or years; advance notice accepts 0–365 days.

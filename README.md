# AOH Directory

Standalone Next.js App Router website for a tenant-aware church directory platform.

## Routes

- `/` tenant picker
- `/aoh` AOH public directory
- `/aoh/church/[id]` church profile
- `/aoh/district/[districtId]` district dashboard
- `/aoh/admin` protected admin route
- `/login` Firebase email/password sign-in
- `/logout` clears the session cookie

## Current State

- Separate codebase from the Champaign County church directory
- Firestore-backed tenant, church, submission, and user queries when Firebase is configured
- Split-view public directory UI
- Church profile pages
- District dashboards
- Public submission writes to Firestore `submissions`
- Admin moderation writes approved submissions into Firestore `churches`
- Back-office edit screens for published churches and queued submissions
- Firebase session-cookie authentication and tenant-aware role checks

## Required Environment Variables

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `SESSION_COOKIE_NAME`

## Firestore Collections

- `tenants`
- `churches`
- `submissions`
- `users`
- `audit_logs`

## Admin Back Office

- `/aoh/admin` dashboard
- `/aoh/admin/church/[id]` edit a published church record
- `/aoh/admin/submission/[id]` edit a queued submission before approval
- admin-only communications center for bulk email and text messaging

Role behavior:

- `admin` can manage all churches and submissions for the tenant
- `overseer` and `bishop` can only manage records in their assigned district
- `pastor` can only manage their assigned church
- `admin` can create new editor accounts from the back office
- every edit writes an `audit_logs` entry

## Communications Center

The admin portal can send a message to all churches, or to one district, by:

- email
- text message
- both

Provider env vars:

- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_PHONE`

Notes:

- Email only works after SendGrid is configured.
- Text messaging only works after Twilio is configured.
- The portal logs each broadcast in `audit_logs`.

## Bulk Church Import

Template file:

- `data/imports/aoh-churches-template.csv`

Import command:

```bash
cd /Users/tes/aoh-directory
npm run import:churches
```

Optional custom CSV path:

```bash
cd /Users/tes/aoh-directory
IMPORT_CSV_PATH="/full/path/to/aoh-churches.csv" npm run import:churches
```

CSV columns:

- `church_name`
- `pastor_name`
- `pastor_title`
- `address`
- `city`
- `state`
- `zip`
- `district`
- `phone`
- `email`
- `website`
- `status`
- `source`
- `last_updated`
- `lat`
- `lng`
- `ministries`
- `notes`

## Next Wiring Steps

1. Add Algolia autocomplete on top of the live `churches` collection.
2. Add Mapbox clustered client views using the stored lat/lng fields.
3. Add richer church-edit validation and duplicate-resolution tools in the back office.

## Deploy To Vercel

1. Push this repo to GitHub.
2. In Vercel, create a new project from the repo.
3. Add the same environment variables from `.env.local` into the Vercel project settings.
4. Redeploy after every env var is saved.

Local preflight before you publish:

```bash
cd /Users/tes/aoh-directory
npm run deploy:preflight
```

Required Vercel env vars:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `SESSION_COOKIE_NAME`

## Mobile App Packaging

The app is now prepared for iPhone and Android packaging through Capacitor.

Current mobile identity:

- app name: `AOH Church of God Directory`
- owner: `TECH AND SOLUTIONS`
- website: `https://aohdirectory.com`
- live Vercel app: `https://aoh-directory.vercel.app/aoh`
- bundle id default: `com.techandsolutions.aohdirectory`

Mobile art drop folder:

- icon: `branding/mobile/app-icon-1024.png`
- splash: `branding/mobile/splash-2732.png`

Install command after those files exist:

```bash
./scripts/install-mobile-assets.sh
```

Why this route:

- the current app uses Next.js server rendering and Firebase session auth
- that makes a static mobile export a poor fit
- Capacitor lets the native app shell load the deployed HTTPS site without rewriting the product in React Native

Additional mobile env var:

- `CAP_SERVER_URL`

The mobile wrapper now defaults to `https://aoh-directory.vercel.app/aoh`.

If you later switch the app over to the custom domain, set `CAP_SERVER_URL` before you sync native projects. Example:

```bash
CAP_SERVER_URL="https://aohdirectory.com/aoh" npm run mobile:sync
```

Initial native project setup:

```bash
cd /Users/tes/aoh-directory
npm run mobile:add:ios
npm run mobile:add:android
CAP_SERVER_URL="https://your-live-domain.example" npm run mobile:sync
```

Open the native projects:

```bash
cd /Users/tes/aoh-directory
npm run mobile:open:ios
npm run mobile:open:android
```

Notes:

- the current mobile wrapper points to `https://aoh-directory.vercel.app/aoh`
- after the custom domain is live, run `CAP_SERVER_URL="https://aohdirectory.com/aoh" npm run mobile:sync`
- the current bundle id is `com.techandsolutions.aohdirectory`
- native app icons and splash screens still need platform assets prepared in Xcode and Android Studio
- iOS publishing still requires your Apple Developer account and certificates
- Android publishing still requires your Play Console account and signing key

## Publish Firestore Rules

Use the Firebase CLI from the project root after you log into the correct Firebase account:

```bash
firebase use aoh-church-directory
firebase deploy --only firestore:rules,firestore:indexes
```

The Firebase project config file is already included as `firebase.json`.

## Make The Site Live

The codebase is deployment-ready, but publishing it still requires your Vercel account access. I can prepare everything locally, but I cannot complete the final Vercel production deploy without your authenticated Vercel session.

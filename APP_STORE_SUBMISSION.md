# AOH Directory Store Submission

Prepared on April 27, 2026.

Use this file while submitting `AOH Church of God Directory` to Apple App Store Connect and Google Play Console.

## Core App Info

- App Name: `AOH Church of God Directory`
- Bundle / Package ID: `com.techandsolutions.aohdirectory`
- Support Email: `support@techedsupport.com`
- Support URL: `https://aohdirectory.com`
- Privacy Policy URL: `https://aohdirectory.com/privacy-policy`
- Website: `https://aohdirectory.com`
- Category suggestion: `Lifestyle`
- Secondary category suggestion for Apple: `Reference`

## App Description

```text
AOH Directory is a church directory app created to help members, visitors, pastors, leaders, and families connect with Apostolic Overcoming Holy Church of God, Inc. churches.

With the AOH Directory app, users can search for churches by name, city, state, pastor, or district. The app is designed to make it easier to find a church home, view church information, connect with local congregations, and access important directory details quickly.

Key features include:

- Search AOH churches by church name, pastor, city, state, or district
- View church location and leadership information
- Browse churches by district
- Access church details in a mobile-friendly format
- Help visitors and members find worship connections
- Support accurate and organized church directory information

AOH Directory is built with a simple, clean, and mobile-friendly design to serve the Apostolic Overcoming Holy Church of God community and those looking to connect with an AOH church.
```

## Short Description

Google Play short description:

```text
Find AOH churches by name, city, state, pastor, or district.
```

## Keywords

Apple keywords suggestion:

```text
church,directory,AOH,worship,Christian,ministry,pastor,district
```

## App Review Notes

Use this in Apple App Review Notes:

```text
AOH Directory helps users find Apostolic Overcoming Holy Church of God, Inc. churches by name, city, state, pastor, and district. The app includes public church directory browsing for all users. Admin features require Firebase Authentication credentials and are intended only for authorized directory staff and church leaders.
```

## Privacy Summary Based On Current Code

This app currently uses:

- Firebase Authentication
- Firebase Firestore
- Firebase Storage
- Website and app hosting
- Google Maps links
- Optional SendGrid email sending
- Optional Twilio SMS sending

This app currently allows:

- Public directory browsing
- Prayer request submission
- Church claim submission
- Church registration / directory update submission
- Admin login
- Admin editing of church records
- Admin image upload for church records

## Apple App Privacy Answers

These answers should match the current codebase.

### Tracking

- Does this app track users across apps or websites owned by other companies? `No`

### Data Types Collected

Select `Yes` for these:

- Contact Info
  - Name
  - Email Address
  - Phone Number
- User Content
  - Messages or other user content
- Identifiers
  - User ID
- Photos or Videos
  - Photos

### Why these apply

- Name, email, and phone can be submitted in prayer requests, church claims, church submissions, and admin user creation.
- Messages or user content can be submitted in prayer request text and claim/support text.
- User ID applies because Firebase Authentication creates authenticated user records for admin access.
- Photos apply because admin editing supports image upload to Firebase Storage.

### Data Not Collected For Tracking

Mark all collected data as:

- `Not used for tracking`

### Data Linked to the User

Use `Yes` for:

- Contact Info
- User Content
- User ID

Use `Yes` for Photos only if you plan to use mobile admin image upload in the released app. If regular public users cannot upload photos, but only authorized admins can, it is still safer to disclose it as collected.

### Data Used For These Purposes

For Contact Info:

- App Functionality

For User Content:

- App Functionality

For User ID:

- App Functionality
- Account Management

For Photos:

- App Functionality

### Optional Safer Apple Disclosure Choice

If you want to minimize back-and-forth with Apple review, use the broader truthful disclosure:

- Contact Info: `Yes`
- User Content: `Yes`
- User ID: `Yes`
- Photos: `Yes`
- Tracking: `No`

## Google Play Data Safety Answers

Use these answers in the Data safety form.

### Does your app collect or share any of the required user data types?

- `Yes`

### Is all user data encrypted in transit?

- `Yes`

### Can users request that their data be deleted?

- `Yes`

Use:

```text
Users can request corrections or privacy-related changes by contacting support@techedsupport.com.
```

### Data Collected

Mark as collected:

- Personal info
  - Name
  - Email address
  - Phone number
- Messages
  - Other in-app messages
- Photos and videos
  - Photos
- App info and performance
  - No
- Location
  - No
- Financial info
  - No
- Health and fitness
  - No
- Contacts
  - No
- Browsing history
  - No
- Search history
  - No

### Purposes

For name, email, phone:

- App functionality
- Account management
- Developer communications

For messages:

- App functionality

For photos:

- App functionality

### Is this data processed ephemerally?

- `No`

### Is collection required or optional?

Use:

- Directory browsing: no personal data required
- Forms and admin features: data entry is optional or role-based

So in Play Console, where needed, answer:

- `Optional`

### Is the data shared?

Use:

- `No` for selling or advertising sharing
- If Play asks whether data is transferred to service providers used to operate the app, answer truthfully based on your setup

Because this app uses Firebase and may use SendGrid / Twilio, a conservative answer is:

- Data is processed by service providers to operate app functionality
- Not shared for advertising

## Screenshots You Need

Prepare these before final submission.

### Apple

- iPhone 6.7-inch screenshots
- iPhone 6.5-inch screenshots if needed

Recommended screens:

1. Home / directory landing screen
2. Search and filter screen
3. Church profile detail screen
4. District browsing screen
5. Prayer request or registration screen

### Google

- Phone screenshots
- Feature graphic if you want stronger Play listing presentation

Recommended screens:

1. Directory landing
2. Church search
3. Church detail page
4. District page
5. Prayer request or church connection screen

## Apple Submission Steps

1. Open App Store Connect.
2. Go to `My Apps`.
3. Click `+`, then `New App`.
4. Enter:
   - Name: `AOH Church of God Directory`
   - Primary Language: `English`
   - Bundle ID: `com.techandsolutions.aohdirectory`
   - SKU: `aoh-directory-001`
5. Open Xcode.
6. Select the `App` target.
7. Open `Signing & Capabilities`.
8. Choose your Apple Developer Team.
9. Confirm the bundle identifier is `com.techandsolutions.aohdirectory`.
10. Set version to `1.0.0`.
11. Set build to `1`.
12. Change the run target at the top from the simulator to `Any iOS Device`.
13. Click `Product` -> `Archive`.
14. When archive finishes, the Organizer window opens.
15. Click `Distribute App`.
16. Choose `App Store Connect`.
17. Upload the build.
18. Back in App Store Connect, open the app record.
19. Fill in:
   - Description
   - Keywords
   - Support URL
   - Privacy Policy URL
   - Category
   - Age Rating
   - App Privacy answers
   - Screenshots
20. Select the uploaded build.
21. Add review notes.
22. Click `Submit for Review`.

## Google Submission Steps

1. Open Google Play Console.
2. Click `Create app`.
3. Enter:
   - App name: `AOH Church of God Directory`
   - Default language: `English`
   - App or game: `App`
   - Free or paid: `Free`
4. Open Android Studio.
5. Open the Android project.
6. Click `Build` -> `Generate Signed Bundle / APK`.
7. Choose `Android App Bundle`.
8. Create or choose your signing key.
9. Build the `.aab` file.
10. Back in Google Play Console, complete:
    - App access
    - Ads
    - Content rating
    - Data safety
    - Privacy policy
    - Store listing
11. Upload the `.aab` to `Internal testing` first.
12. Test it.
13. Then create a `Production` release.
14. Roll it out for review.

## Store Checklist Before You Submit

- Privacy policy page is live
- Website is live at `https://aohdirectory.com`
- App builds open correctly on iPhone and Android
- Screenshots are ready
- Support email works
- Bundle/package ID matches exactly
- Apple signing is set
- Android signing key is saved safely
- App description is pasted
- Privacy answers are completed

## Important Note

If you change the app features later, especially analytics, push notifications, ads, or new account/profile features, update both:

- Apple App Privacy answers
- Google Play Data safety answers

# Project Setup

## Clone the Repository
```sh
git clone <repository_url>
cd <repository_name>
```

## Setup Environment Variables
1. Rename `.env.example` to `.env`:
   ```sh
   mv .env.example .env
   ```
2. Open `.env` and fill in all required values.

## Firebase Setup
1. Enable **Google** and **Facebook** sign-in in Firebase Authentication.
2. Download the Firebase Admin SDK JSON file.
3. Place the JSON file inside the `config` folder.
4. Update the correct path in `firebaseConfig.js`.

## Facebook Authentication Setup
1. Go to [Meta Developer](https://developers.facebook.com/).
2. Create an account if you don’t have one.
3. Create a new app inside the Meta Developer Console.
4. Get the **App ID** and **App Secret**.
5. Add them to your `.env` file.
6. In Firebase Authentication, find the **redirect URL** for Facebook login.
7. Copy the **redirect URL** from Firebase and paste it into the **Valid OAuth Redirect URIs** section in your Facebook app settings.

## Install Dependencies
```sh
npm install
```

## Start the Server
```sh
npm start
```

## API Documentation
For full API details, visit:
[Postman Documentation](https://documenter.getpostman.com/view/27080842/2sAYkDML7i)

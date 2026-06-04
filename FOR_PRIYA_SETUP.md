# 🌱 Kisan Family Academy — Complete Setup Guide
### For Priya Haraik | No Coding Needed

---

## 📋 TABLE OF CONTENTS

1. [What You Need First](#1-what-you-need-first)
2. [Step 1 — Firebase Setup](#2-step-1--firebase-setup)
3. [Step 2 — Upload to GitHub](#3-step-2--upload-to-github)
4. [Step 3 — Deploy on Cloudflare Pages](#4-step-3--deploy-on-cloudflare-pages)
5. [Step 4 — How to Add Videos](#5-step-4--how-to-add-videos)
6. [Step 5 — How to Approve Students](#6-step-5--how-to-approve-students)
7. [Step 6 — How to Send Notifications](#7-step-6--how-to-send-notifications)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. What You Need First

Before starting, make sure you have:

- [ ] A **Google account** (Gmail)
- [ ] A **GitHub account** — create free at https://github.com/signup
- [ ] A **Cloudflare account** — create free at https://dash.cloudflare.com/sign-up
- [ ] The **project ZIP file** (kisan-family-academy.tar.gz) downloaded to your computer

### Extract the ZIP file

**On Windows:**
1. Right-click the downloaded file
2. Click "Extract All" → Click "Extract"
3. A folder called `kisan-family-academy` will appear

**On Mac:**
1. Double-click the `.tar.gz` file
2. A folder will appear automatically

---

## 2. Step 1 — Firebase Setup

Your Firebase project is already created: **kisan-family-academy**

You just need to enable a few settings:

### 2a. Enable Google Sign-In

1. Go to https://console.firebase.google.com
2. Click your project: **kisan-family-academy**
3. In the left menu, click **Authentication**
4. Click the **Sign-in method** tab
5. Click **Google**
6. Toggle the switch to **Enable**
7. Enter your email in the "Project support email" box
8. Click **Save**

### 2b. Add Your Website Domain to Firebase

> ⚠️ This is important — without this, Google login will not work on your live site

1. Still in **Authentication** → **Sign-in method**
2. Scroll down to **Authorized domains**
3. Click **Add domain**
4. Add your Cloudflare domain (you'll get this in Step 3, e.g. `kisan-academy.pages.dev`)
5. Click **Add**

### 2c. Create Firestore Database

1. In the left menu, click **Firestore Database**
2. Click **Create database**
3. Select **Start in production mode**
4. Choose region: **asia-south1 (Mumbai)** — best for India
5. Click **Enable**

### 2d. Set Firestore Rules (Allow your app to read/write)

1. In Firestore, click the **Rules** tab
2. Replace everything with this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read, write: if request.auth.token.email in [
        'haraikpriya@gmail.com',
        'priyaharaikbuisness@gmail.com',
        'uditsharmas9736@gmail.com'
      ];
    }
    match /videos/{videoId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.email in [
        'haraikpriya@gmail.com',
        'priyaharaikbuisness@gmail.com',
        'uditsharmas9736@gmail.com'
      ];
    }
    match /progress/{userId}/videos/{videoId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /questions/{questionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /certificates/{certId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.token.email in [
        'haraikpriya@gmail.com',
        'priyaharaikbuisness@gmail.com',
        'uditsharmas9736@gmail.com'
      ];
    }
    match /notifications/{notifId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.email in [
        'haraikpriya@gmail.com',
        'priyaharaikbuisness@gmail.com',
        'uditsharmas9736@gmail.com'
      ];
    }
  }
}
```

3. Click **Publish**

---

## 3. Step 2 — Upload to GitHub

GitHub is a free website that stores your code so Cloudflare can build and host it.

### Create a New Repository on GitHub

1. Go to https://github.com and log in
2. Click the **+** button (top right) → **New repository**
3. Repository name: `kisan-family-academy`
4. Keep it **Private** (your code stays hidden)
5. Click **Create repository**

### Upload Your Files

**Option A — Using GitHub Desktop (Easiest for beginners)**

1. Download GitHub Desktop: https://desktop.github.com
2. Install and sign in with your GitHub account
3. Click **File** → **Add Local Repository**
4. Browse to your extracted `kisan-family-academy` folder
5. If it asks to initialize, click **Initialize Repository**
6. Click **Publish repository** → Select your repository → **Publish**

**Option B — Upload via Browser (No software needed)**

> Note: This only works for small projects. For large projects, use Option A.

1. On your new GitHub repository page, click **uploading an existing file**
2. Drag and drop ALL files from your extracted folder
3. Scroll down and click **Commit changes**

---

## 4. Step 3 — Deploy on Cloudflare Pages

Cloudflare Pages hosts your website for free and builds it automatically.

### Connect GitHub to Cloudflare

1. Go to https://dash.cloudflare.com
2. Click **Workers & Pages** in the left menu
3. Click **Create application**
4. Click the **Pages** tab
5. Click **Connect to Git**
6. Click **Connect GitHub** and allow access
7. Select your `kisan-family-academy` repository
8. Click **Begin setup**

### Build Settings

Fill in these exact settings:

| Setting | Value |
|---|---|
| Project name | `kisan-academy` |
| Production branch | `main` |
| Framework preset | None |
| Build command | `cd artifacts/kisan-academy && npm install -g pnpm && pnpm install && pnpm run build` |
| Build output directory | `artifacts/kisan-academy/dist/public` |

### Add Environment Variables

> ⚠️ This step is critical — your app needs these to connect to Firebase

1. Scroll down to **Environment variables**
2. Click **Add variable** for each one below:

| Variable Name | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyC-K3wShOBELU8pItzkfhhTtMP8a4BjAng` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `kisan-family-academy.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `kisan-family-academy` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `kisan-family-academy.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `1039598199917` |
| `VITE_FIREBASE_APP_ID` | `1:1039598199917:web:a4c6ca1f3c8c70225ecb64` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-XDT8003J15` |
| `VITE_ADMIN_EMAILS` | `haraikpriya@gmail.com,priyaharaikbuisness@gmail.com,uditsharmas9736@gmail.com` |
| `BASE_PATH` | `/` |

3. Click **Save and Deploy**

### Wait for Deployment

- Cloudflare will take 2–5 minutes to build
- When done, you'll see a green **Success** badge
- Your website URL will be something like: `kisan-academy.pages.dev`
- Click **Visit site** to open your live app! 🎉

### Add Your Domain to Firebase (Important!)

1. Copy your `kisan-academy.pages.dev` URL
2. Go back to Firebase → Authentication → Sign-in method → Authorized domains
3. Click **Add domain** and paste your URL
4. Click **Add**

---

## 5. Step 4 — How to Add Videos

> You do this from inside the app — no code needed!

### Steps:

1. Open your live app (e.g. `kisan-academy.pages.dev`)
2. Sign in with **haraikpriya@gmail.com** (Google login)
3. Tap your **Profile** tab (bottom right)
4. Tap **Admin Panel**
5. Open the menu (☰ top left) → tap **Videos**
6. Tap **+ Add Video**

### Fill in the video details:

| Field | What to enter |
|---|---|
| **Title** | Name of the video (e.g. "Apple Tree Pruning Basics") |
| **YouTube ID** | The code from the YouTube URL (explained below) |
| **Category** | e.g. "Disease Management" or "Canopy Management" |
| **Duration** | e.g. "18:24" |
| **Description** | Short description of the video |
| **Order** | Number for sorting (1 = first, 2 = second, etc.) |

### How to find the YouTube ID:

- Open any YouTube video
- Look at the URL: `https://www.youtube.com/watch?v=`**`rSr185gCqmE`**
- The part after `v=` is the YouTube ID — copy just that part

7. Tap **Save Video**

The video will appear in the app immediately for all approved students! ✅

---

## 6. Step 5 — How to Approve Students

When a student signs up and pays, you approve their access:

1. Open the app → Sign in with admin email
2. Tap **Profile** → **Admin Panel**
3. Open menu (☰) → tap **Approvals**
4. You'll see all students waiting for approval
5. Tap **Approve** next to their name

They will now have full access to all course videos! ✅

### Block a student:

1. Open menu → **Students**
2. Tap on any student to expand their details
3. Tap **Block** to remove their access

---

## 7. Step 6 — How to Send Notifications

Send announcements to your students (stored in-app):

1. Open the app → Sign in with admin email
2. Tap **Profile** → **Admin Panel**
3. Open menu (☰) → tap **Notifications**
4. Choose the **Type** (e.g. "New Lesson", "Webinar Reminder")
5. Write a **Title** (short, e.g. "New Video Added!")
6. Write your **Message** (e.g. "We've added a new pruning tutorial. Watch it now!")
7. Tap **Send Notification**

The notification is saved and shown to students when they check their app. ✅

---

## 8. Troubleshooting

### "Google sign-in not working"
→ Make sure you added your website domain to Firebase Authorized Domains (Step 2b)

### "Students can't see videos"
→ Check that Firestore Rules are published (Step 2d) and the student is approved (Step 5)

### "Build failed on Cloudflare"
→ Double-check that all 9 environment variables are entered correctly with no spaces

### "App shows blank white screen"
→ Check that `BASE_PATH` is set to `/` in Cloudflare environment variables

### "Videos not loading"
→ Make sure the YouTube ID is correct (only the letters/numbers after `v=`, not the full URL)

---

## 📞 App Access Summary

| Who | Email | Access |
|---|---|---|
| Admin | haraikpriya@gmail.com | Full admin panel |
| Admin | priyaharaikbuisness@gmail.com | Full admin panel |
| Admin | uditsharmas9736@gmail.com | Full admin panel |
| Students | Any Gmail | Needs admin approval |

---

## 🌐 Your Firebase Project Details

| Item | Value |
|---|---|
| Project ID | kisan-family-academy |
| Firebase Console | https://console.firebase.google.com/project/kisan-family-academy |
| Auth Domain | kisan-family-academy.firebaseapp.com |

---

*Made with ❤️ for Priya Haraik Ventures — Kisan Family Academy*

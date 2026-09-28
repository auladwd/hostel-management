# প্রোডাকশন ডিপ্লয়মেন্ট নির্দেশিকা (Production Deployment Guide)
## হোস্টেল ও মেস ম্যানেজমেন্ট সিস্টেম | আওলাদ আইটি সলিউশন

এই নির্দেশিকাটি অনুসরণ করে নতুন কোনো ক্লায়েন্টের জন্য স্বতন্ত্রভাবে (Single-Tenant) এই অ্যাপ্লিকেশনটি ডিপ্লয় করা যাবে।

---

## ⚠️ বাণিজ্যিক হোস্টিং বিষয়ক সতর্কতা (Commercial Hosting Policy)

Vercel-এর সাধারণ 'Hobby' প্ল্যান কোনো বাণিজ্যিক বা ক্লায়েন্ট ব্যবসার কাজে ব্যবহারের অনুমতি দেয় না। বাণিজ্যিক ক্লায়েন্ট ডিপ্লয়মেন্টের জন্য নিচের যেকোনো একটি উপায় অবলম্বন করুন:
1. **Vercel Pro Plan**: বাণিজ্যিক ব্যবহারের জন্য অনুমোদিত।
2. **Dedicated Cloud VPS (DigitalOcean / Hetzner / AWS Lightsail)**: Node.js, Docker অথবা PM2 এর মাধ্যমে চালানো যায়। সবচেয়ে সাশ্রয়ী ও দীর্ঘমেয়াদী সমাধান।

---

## ১. MongoDB Atlas ডেটাবেজ সেটআপ

১. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)-এ প্রবেশ করুন।
২. ক্লায়েন্টের জন্য একটি নতুন Project তৈরি করুন (যেমন: `Client-GreenViewHostel`)।
৩. একটি ফ্রি M0 ক্লাস্টার অথবা ডেডিকেটেড M10 ক্লাস্টার নির্বাচন করুন (Cloud Provider: AWS, Region: Singapore বা Mumbai)।
৪. **Database Access**:
   - একটি ডেডিকেটেড ইউজার তৈরি করুন (যেমন: `hostel_admin`) এবং শক্তিশালী পাসওয়ার্ড দিন।
   - Role নির্বাচন করুন: `Read and write to any database`।
৫. **Network Access**:
   - IP Access List-এ `0.0.0.0/0` (Allow Access from Anywhere) দিন যাতে সার্ভারলেস ও হোস্টিং সার্ভার যুক্ত হতে পারে।
৬. **Connection String**:
   - "Connect" -> "Drivers" -> "Node.js" নির্বাচন করুন।
   - কানেকশন স্ট্রিং কপি করুন:
     ```
     mongodb+srv://hostel_admin:<password>@cluster0.xxxxx.mongodb.net/hostel_db?retryWrites=true&w=majority
     ```
   - এটি `.env` এর `MONGODB_URI` ভেরিয়েবলে ব্যবহার করুন।

---

## ২. Firebase Authentication ও Google Login সেটআপ

১. [Firebase Console](https://console.firebase.google.com/)-এ যান।
২. "Add project" ক্লিক করে ক্লায়েন্টের নামে প্রজেক্ট খুলুন (যেমন: `greenview-hostel-auth`)।
৩. **Authentication চালু করুন**:
   - বাম মেনুর Build -> Authentication -> Get Started।
   - Sign-in method ট্যাবে গিয়ে **Google** নির্বাচন করুন এবং Enable করুন।
   - সাপোর্ট ইমেইল হিসেবে ক্লায়েন্ট বা অ্যাডমিনের ইমেইল দিন।
৪. **Authorized Domains**:
   - Authentication -> Settings -> Authorized domains-এ যান।
   - আপনার ডিপ্লয় করা ডোমেইন যুক্ত করুন (যেমন: `greenview.auladit.com` অথবা `hostel-client.vercel.app`)।
৫. **Web App ক্রেডেনশিয়াল সংগ্রহ**:
   - Project Settings -> General -> "Your apps"-এ গিয়ে Web icon (`</>`) ক্লিক করুন।
   - প্রাপ্ত কনফিগারেশন থেকে নিচের ভেরিয়েবলগুলো সংগ্রহ করুন:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`

---

## ৩. Firebase Admin SDK সার্ভিস অ্যাকাউন্ট সেটআপ

সার্ভার-সাইডে টোকেন যাচাইয়ের জন্য Admin SDK আবশ্যক:
১. Firebase Console -> Project Settings -> **Service accounts** ট্যাবে যান।
২. "Generate new private key" বাটনে ক্লিক করে JSON ফাইলটি ডাউনলোড করুন।
৩. JSON ফাইলটি খুলে নিচের ৩টি তথ্য সংগ্রহ করুন:
   - `project_id` -> `FIREBASE_PROJECT_ID`
   - `client_email` -> `FIREBASE_CLIENT_EMAIL`
   - `private_key` -> `FIREBASE_PRIVATE_KEY`

> **গুরুত্বপূর্ণ নোট**: Vercel বা প্রোডাকশন এনভায়রনমেন্ট ভেরিয়েবলে `FIREBASE_PRIVATE_KEY` পেস্ট করার সময় সম্পূর্ণ কী-টি ডাবল কোটেশনে রাখুন এবং `\n` সঠিকভাবে সংরক্ষিত রাখুন:
> ```
> FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n"
> ```

---

## ৪. Cloudinary মিডিয়া স্টোরেজ সেটআপ

বর্ডারদের ছবি, জাতীয় পরিচয়পত্র ও খরচের রসিদ সংরক্ষণের জন্য:
১. [Cloudinary](https://cloudinary.com)-এ ফ্রি অথবা পেইড ক্লায়েন্ট অ্যাকাউন্ট খুলুন।
২. ড্যাশবোর্ড থেকে নিচের তথ্যগুলো সংগ্রহ করুন:
   - Cloud Name -> `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - API Key -> `CLOUDINARY_API_KEY`
   - API Secret -> `CLOUDINARY_API_SECRET`
   - Folder -> `CLOUDINARY_FOLDER="hostel_management"`

---

## ৫. প্রাথমিক মালিক একাউন্ট সক্রিয়করণ (Bootstrapping)

১. এনভায়রনমেন্টে `INITIAL_OWNER_EMAIL` হিসেবে হোস্টেল মালিকের নিজস্ব জিমেইল সেট করুন:
   ```env
   INITIAL_OWNER_EMAIL="hostelowner@gmail.com"
   BOOTSTRAP_SECRET="একটি_শক্তিশালী_৩২_অক্ষরের_গোপন_কি"
   ```
২. অ্যাপ ডিপ্লয় করার পর মালিক তার জিমেইল দিয়ে গুগল লগইন করলে সিস্টেম স্বয়ংক্রিয়ভাবে তাকে **OWNER (সুপার এডমিন)** হিসেবে রেজিস্টার করবে।
৩. পরবর্তীতে তিনি সেটিংস থেকে হোস্টেল ম্যানেজার, হিসাবরক্ষক ও মিল ম্যানেজারদের একাউন্ট পারমিশন পরিবর্তন করতে পারবেন।

---

## ৬. ডিপ্লয়মেন্ট প্রক্রিয়া

### বিকল্প ক: Vercel Pro ডিপ্লয়মেন্ট
১. GitHub-এ ক্লায়েন্টের জন্য একটি প্রাইভেট রিপোজিটরি তৈরি করে কোড পুশ করুন।
২. Vercel ড্যাশবোর্ডে গিয়ে রিপোজিটরিটি Import করুন।
৩. Framework Preset: `Next.js`
4. **Environment Variables** সেকশনে `.env.example`-এর প্রতিটি ভেরিয়েবল ক্লায়েন্টের সঠিক মান দিয়ে পূরণ করুন।
৫. "Deploy" বাটনে ক্লিক করুন।

### বিকল্প খ: Ubuntu / Cloud VPS ডিপ্লয়মেন্ট (PM2 সহ)
```bash
# ১. রিপো ক্লোন ও ডিপেন্ডেন্সি ইনস্টল
git clone <repo-url> hostel-app
cd hostel-app
npm install

# ২. .env তৈরি
nano .env.local

# ৩. প্রোডাকশন বিল্ড
npm run build

# ৪. PM2 দিয়ে ব্যাকগ্রাউন্ডে রান
npm install -g pm2
pm2 start npm --name "hostel-system" -- start -- -p 3000
pm2 save
pm2 startup
```
Nginx রিভার্স প্রক্সি ও Let's Encrypt SSL সার্টিফিকেট সেট করুন।

---

## ৭. ডেটাবেজ ব্যাকআপ ও রিস্টোর নির্দেশিকা

MongoDB Atlas ক্লাউডে স্বয়ংক্রিয় ব্যাকআপ ব্যবস্থা রয়েছে:
- **স্বয়ংক্রিয় ব্যাকআপ**: Atlas ক্লাস্টারের "Backup" ট্যাব থেকে প্রতিদিনের ব্যাকআপ সক্রিয় করুন।
- **ম্যানুয়াল ব্যাকআপ গ্রহণ (CLI)**:
  ```bash
  mongodump --uri="<MONGODB_URI>" --out="./backup_$(date +%F)"
  ```
- **ডেটাবেজ রিস্টোর (CLI)**:
  ```bash
  mongorestore --uri="<MONGODB_URI>" ./backup_2026-09-28/hostel_db
  ```

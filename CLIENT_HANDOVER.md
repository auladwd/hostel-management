# 🏢 Aulad IT Solution — Client Handover & Provisioning Manual
## Hostel & Mess Management System (Single-Tenant Commercial Distribution)

---

## 📌 ১. ওভারভিউ ও ব্যবসায়িক মডেল (Business Model & Overview)

**Aulad IT Solution**-এর তৈরি এই **Hostel & Mess Management System** সম্পূর্ণ **Single-Tenant Architecture** মডেলে নির্মিত। অর্থাৎ প্রতিটি হোস্টেল বা মেস ক্লায়েন্টকে একটি পৃথক, সম্পূর্ণ স্বাধীন সফটওয়্যার ইনস্ট্যান্স সরবরাহ করা হয়। 

### মূল নীতিসমূহ:
1. **স্বতন্ত্র ডাটাবেস (Independent Database):** প্রতিটি ক্লায়েন্টের নিজস্ব MongoDB Atlas ডাটাবেস থাকবে। কোনো ডাটা শেয়ারিং বা লিকেজ সম্ভব নয়।
2. **স্বতন্ত্র ক্লাউড স্টোরেজ (Independent Cloudinary):** ক্লায়েন্টের নিজস্ব মিডিয়া স্টোরেজ ও ট্রান্সফরমেশন কোটা।
3. **স্বতন্ত্র অথেনটিকেশন (Independent Firebase Auth):** ক্লায়েন্টের নিজস্ব ব্র্যান্ডেড Google Login ও ব্যবহারকারী তালিকা।
4. **বাণিজ্যিক হোস্টিং সম্মতি (Commercial Hosting Compliance):** Vercel Hobby টিয়ার বাণিজ্যিকভাবে ক্লায়েন্টদের কাছে ব্যবহারের জন্য অনুমোদিত নয়। এই হ্যান্ডওভার গাইডে Vercel Pro অথবা Docker/VPS সম্বলিত বাণিজ্যিক হোস্টিং প্রক্রিয়া বর্ণিত হয়েছে।

---

## 📋 ২. ক্লায়েন্ট ডেলিভারি চেকলিস্ট (Client Onboarding Checklist)

নতুন ক্লায়েন্টের কাছে সফটওয়্যার ডেলিভারির সময় নিচের ধাপগুলো ক্রমানুসারে সম্পন্ন করতে হবে:

| ধাপ | কাজ | বিবরণ | স্থিতি |
|---|---|---|:---:|
| ১ | ডোমেইন নির্বাচন | ক্লায়েন্টের নিজস্ব ডোমেইন বা সাবডোমেইন (`hostel.clientdomain.com`) প্রস্তুত করা | [ ] |
| ২ | MongoDB Atlas ক্লাস্টার | ক্লায়েন্টের নামে ফ্রি M0 বা প্রোডাকশন M10 ডেডিকেটেড ক্লাস্টার সেটআপ | [ ] |
| ৩ | Firebase কনসোল সেটআপ | নতুন প্রজেক্ট তৈরি, Google Auth এনেবল এবং ডোমেইন অনুমোদিত তালিকায় যুক্তকরণ | [ ] |
| ৪ | Firebase সার্ভিস অ্যাকাউন্ট | Admin SDK প্রাইভেট কি JSON ডাউনলোড ও এনভায়রনমেন্টে সেট | [ ] |
| ৫ | Cloudinary ক্লাউড তৈরি | ক্লায়েন্টের জন্য ফ্রি/পেইড Cloudinary অ্যাকাউন্ট ও সাইনড আপলোড সক্ষম করা | [ ] |
| ৬ | বাণিজ্যিক হোস্টিং ডেপ্লয়মেন্ট | Vercel Pro / Hostinger VPS / Docker কনটেইনারে ডেপ্লয় | [ ] |
| ৭ | সুপার অ্যাডমিন বুটস্ট্র্যাপ | ক্লায়েন্টের প্রধান ইমেইলকে মালিক/ওনার হিসেবে নিযুক্ত করা | [ ] |
| ৮ | ব্র্যান্ডিং ও পলিসি কনফিগারেশন | লোগো, হোস্টেল নাম, ঠিকানা, মোড (Hostel / Mess / Combined), মিল রুলস কনফিগার করা | [ ] |
| ৯ | ক্লায়েন্ট প্রশিক্ষণ ও হ্যান্ডওভার | অ্যাডমিন গাইড প্রদান ও ওনার লগইন যাচাইকরণ | [ ] |

---

## 🛠️ ৩. বিস্তারিত প্রোভিশনিং প্রক্রিয়া (Step-by-Step Provisioning)

### ধাপ ১: MongoDB Atlas ডেটাবেস প্রোভিশনিং
1. [MongoDB Atlas](https://cloud.mongodb.com)-এ প্রবেশ করুন।
2. ক্লায়েন্টের নামে একটি প্রজেক্ট খুলুন (যেমন: `Aulad-Hostel-ClientName`)।
3. **Database Access**-এ যান -> `Add New Database User`:
   - Authentication Method: `Password`
   - Role: `Read and write to any database` বা ক্লায়েন্টের ডাটাবেসে স্পেসিফিক রোল
4. **Network Access**-এ যান -> `Add IP Address`:
   - হোস্টিং প্রোভাইডার যদি ক্লাউড সার্ভারলেস হয় (যেমন Vercel), তবে `0.0.0.0/0` (Allow Access from Anywhere) দিন।
5. **Connect** বোতাম চেপে `Drivers` (Node.js) নির্বাচন করে কানেকশন স্ট্রিং কপি করুন:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/hostel_db?retryWrites=true&w=majority
   ```

### ধাপ ২: Firebase Authentication ও Service Account
1. [Firebase Console](https://console.firebase.google.com)-এ নতুন প্রজেক্ট খুলুন (যেমন: `client-hostel-app`)।
2. **Authentication** -> **Sign-in method** -> **Google Provider** এনেবল করুন।
3. **Authorized domains** সেকশনে ক্লায়েন্টের আসল ডোমেইন (যেমন: `hostel.clientdomain.com` এবং Vercel ডেপ্লয়মেন্ট ডোমেইন) যুক্ত করুন।
4. **Project Settings (General)** -> Web Apps -> `Register App`:
   - নিচের ভেরিয়েবলগুলো কপি করুন:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `NEXT_PUBLIC_FIREBASE_APP_ID`
5. **Project Settings** -> **Service accounts** ট্যাব:
   - **Firebase Admin SDK** সেকশনে গিয়ে **Generate new private key** বোতাম চাপুন।
   - ডাউনলোড হওয়া JSON ফাইলের ডেটা ব্যবহার করে নিচের তিনটি ভেরিয়েবল সাজান:
     - `FIREBASE_PROJECT_ID` = `project_id`
     - `FIREBASE_CLIENT_EMAIL` = `client_email`
     - `FIREBASE_PRIVATE_KEY` = সম্পূর্ণ প্রাইভেট কী (`"-----BEGIN PRIVATE KEY-----\nMIIEv...-----END PRIVATE KEY-----\n"`)

### ধাপ ৩: Cloudinary মিডিয়া স্টোরেজ
1. [Cloudinary](https://cloudinary.com)-এ ক্লায়েন্টের অ্যাকাউন্ট খুলুন।
2. ড্যাশবোর্ড থেকে কপি করুন:
   ```env
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxxxxxx
   CLOUDINARY_API_KEY=xxxxxxx
   CLOUDINARY_API_SECRET=xxxxxxx
   ```
3. Settings -> Upload Settings -> নিশ্চিত করুন আনসাইনড বা সাইনড আপলোড মোড পলিসি সঠিক আছে।

### ধাপ ৪: বাণিজ্যিক হোস্টিং (Commercial Hosting Options)

> ⚠️ **আইনি ও লাইসেন্সিং সতর্কতা:**
> Vercel-এর সাধারণ 'Hobby' ফ্রি টিয়ার ব্যক্তিগত/অবাণিজ্যিক কাজের জন্য সংরক্ষিত। আপনি যদি ক্লায়েন্টের কাছে সফটওয়্যার বিক্রি করে বাণিজ্যিক সমাধান দিচ্ছেন, তবে নিচের যেকোনো একটি বাণিজ্যিক হোস্টিং পদ্ধতি ব্যবহার করুন:

#### অপশন A: Vercel Pro (বাণিজ্যিক টিয়ার)
1. ক্লায়েন্টের নিজস্ব Vercel Pro অ্যাকাউন্ট অথবা Aulad IT Solution-এর এজেন্সি টিম অ্যাকাউন্টে প্রজেক্ট ইম্পোর্ট করুন।
2. **Environment Variables**-এ সব সিক্রেট কী (`.env.example` অনুযায়ী) যুক্ত করুন।
3. **Custom Domains**-এ ক্লায়েন্টের ডোমেইন (`hostel.clientdomain.com`) যোগ করে DNS CNAME রেকর্ড পয়েন্ট করুন।

#### অপশন B: ডেডিকেটেড VPS / ক্লাউড সার্ভার (Node.js / Docker)
যদি ক্লায়েন্ট প্রতি মাসে সাবস্ক্রিপশন ফি এড়িয়ে নিজস্ব ভিপিএসে (যেমন: Hostinger / DigitalOcean / Linode) চালাতে চায়:
1. সার্ভারে Node.js v20+ ও PM2 অথবা Docker ইনস্টল করুন।
2. বিল্ড চালান:
   ```bash
   npm ci
   npm run build
   pm2 start npm --name "client-hostel" -- start -- -p 3000
   ```
3. Nginx রিভার্স প্রক্সি ও বিনামূল্যে Let's Encrypt SSL সার্টিফিকেট কনফিগার করুন:
   ```nginx
   server {
       server_name hostel.clientdomain.com;
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 👑 ৪. সুপার অ্যাডমিন বুটস্ট্র্যাপ ও প্রাথমিক রোল নির্ধারণ (Bootstrap Setup)

ক্লায়েন্টকে সফটওয়্যার বুঝিয়ে দেওয়ার পূর্বে মালিকের (Owner) অ্যাক্সেস সেট করার প্রক্রিয়া:

1. এনভায়রনমেন্ট ফাইলে সেট করুন:
   ```env
   INITIAL_OWNER_EMAIL=owner@clienthostel.com
   SYSTEM_BOOTSTRAP_KEY=SuperSecretBootstrapKey2026!@#
   ```
2. ক্লায়েন্টের ওনারকে তার গুগল অ্যাকাউন্ট (`owner@clienthostel.com`) দিয়ে অ্যাপের লগইন পেজে একবার লগইন করতে বলুন।
3. লগইন করার পর নিচের যেকোনো একটি পদ্ধতিতে তাকে পার্মানেন্ট 'OWNER' রোল প্রদান করুন:

#### পদ্ধতি ১: ব্রাউজার থেকে বুটস্ট্র্যাপ ফর্ম
লগইন পেজে নিচে অবস্থিত **"সুপার অ্যাডমিন বুটস্ট্র্যাপ (Initial Owner Setup)"** প্যানেল ওপেন করুন:
- ওনারের ইমেইল লিখুন: `owner@clienthostel.com`
- বুটস্ট্র্যাপ সিক্রেট কী লিখুন: `SuperSecretBootstrapKey2026!@#`
- "ওনার হিসেবে রেজিস্টার করুন" চাপুন। তাৎক্ষণিকভাবে তিনি সর্বোচ্চ ক্ষমতার ওনার রোল পাবেন।

#### পদ্ধতি ২: সিকিউর কার্ল (CURL) রিকোয়েস্ট
```bash
curl -X POST https://hostel.clientdomain.com/api/auth/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "bootstrapKey": "SuperSecretBootstrapKey2026!@#",
    "email": "owner@clienthostel.com",
    "name": "হোস্টেল সুপারভাইজার",
    "phone": "01700000000"
  }'
```

---

## 🏢 ৫. হোস্টেল সেটিংস ও ব্র্যান্ডিং ইনিশিয়ালাইজেশন

ওনার ড্যাশবোর্ডে লগইন করে `/settings` পেজে গিয়ে প্রাথমিক সেটিংস কনফিগার করতে হবে:

1. **সাধারণ তথ্য (General Branding):**
   - হোস্টেল/মেসের পূর্ণ নাম (যেমন: *"পদ্মা রেসিডেন্সিয়াল ছাত্রাবাস"* বা *"ধানমন্ডি এক্সিকিউটিভ ব্যাচেলর মেস"*)
   - ফোন নম্বর, সাপোর্ট ইমেইল ও পূর্ণ ঠিকানা
   - প্রাতিষ্ঠানিক লোগো আপলোড (Cloudinary ইন্টিগ্রেশন সরাসরি কাজ করবে)
2. **অ্যাপ্লিকেশন মোড নির্বাচন (Application Mode):**
   - **হোস্টেল মোড (`HOSTEL_ONLY`):** মিল মডিউল অদৃশ্য থাকবে, শুধু সিট ও ভাড়া ব্যবস্থাপনা চালু থাকবে।
   - **মেস মোড (`MESS_ONLY`):** মিল ও বাজার ব্যবস্থাপনা প্রধান থাকবে।
   - **কম্বাইন্ড মোড (`COMBINED`):** হোস্টেল ও মেস উভয় সুবিধাই সক্রিয় থাকবে।
3. **মিল ও কিচেন রুলস (যদি মেস বা কম্বাইন্ড মোড হয়):**
   - সকালের খাবার বন্ধের সময় (যেমন: `22:00` আগের রাত)
   - দুপুরের খাবার বন্ধের সময় (যেমন: `08:00` সকাল)
   - রাতের খাবার বন্ধের সময় (যেমন: `15:00` বিকেল)
   - মিল ইউনিট মান (সকাল = 0.5, দুপুর = 1.0, রাত = 1.0)
4. **বিলিং রুলস:**
   - প্রতি মাসের নির্ধারিত ভাড়ার শেষ তারিখ (যেমন: মাসের ১০ তারিখ)
   - বিলম্ব ফি বা জরিমানা নীতি

---

## 💾 ৬. ডাটা ব্যাকআপ এবং রিস্টোর পলিসি (Backup & Disaster Recovery)

ক্লায়েন্টের তথ্যের নিরাপত্তা নিশ্চিত করতে ব্যাকআপের নিয়মাবলী:

### ১. MongoDB Atlas স্বয়ংক্রিয় ক্লাউড ব্যাকআপ
- ক্লাস্টার সেটিংসে গিয়ে **Cloud Backups** সক্রিয় রাখুন। এটি প্রতি ২৪ ঘণ্টায় স্বয়ংক্রিয় স্ন্যাপশট সংগ্রহ করে।
- প্রয়োজনে **Point-in-Time Restore** এর মাধ্যমে যেকোনো মুহূর্তের ডেটা পুনরুদ্ধার করা সম্ভব।

### ২. ম্যানুয়াল কমান্ড-লাইন ব্যাকআপ (mongodump)
মাসিক বা ত্রৈমাসিক ভিত্তিতে অফলাইন ব্যাকআপ সংরক্ষণের জন্য:
```bash
# ব্যাকআপ তৈরির কমান্ড:
mongodump --uri="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/hostel_db" --out=./backups/$(date +%Y-%m-%d)

# ডাটা রিস্টোর করার কমান্ড:
mongorestore --uri="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/hostel_db" ./backups/2026-09-28/hostel_db
```

---

## 🤝 ৭. ক্লায়েন্ট মালিকানা হস্তান্তর ও রিলিজ প্রটোকল (Ownership Transfer)

হ্যান্ডওভার সম্পন্ন করতে ক্লায়েন্টকে নিচের উপকরণগুলো হস্তান্তর করুন:

1. **অ্যাক্সেস ক্রেডেনশিয়ালস শিট (Access Credentials Document):**
   - ক্লায়েন্টের ডোমেইন লগইন
   - ওনার ইমেইল অ্যাড্রেস
   - নিজস্ব MongoDB Atlas প্রজেক্ট ইনভাইটেশন (ওনার রোল প্রদান করে Aulad IT Solution অ্যাডমিন ত্যাগ করতে পারে)
   - নিজস্ব Firebase কনসোল ওনারশিপ ট্রান্সফার
   - ক্লাউডিনারি ক্রেডেনশিয়ালস
2. **ব্যবহারকারী নির্দেশিকা:**
   - [USER_GUIDE_BN.md](file:///e:/Business_Project/hostel-management/USER_GUIDE_BN.md) (বাংলা সচিত্র ইউজার ম্যানুয়াল)
   - প্রিন্ট বা পিডিএফ কপি হিসেবে ক্লায়েন্টকে সরবরাহ করুন।
3. **হস্তান্তর স্বাক্ষর (Handover Sign-off):**
   - ক্লায়েন্ট ওনার অ্যাকাউন্ট দিয়ে লগইন করে টেস্ট অ্যাডমিশন ও পেমেন্ট রসিদ প্রিন্ট করে যাচাই করবেন।
   - কোনো বকেয়া বা সিস্টেম সমস্যা না থাকলে হ্যান্ডওভার সার্টিফিকেট সাক্ষরিত হবে।

---

> **Aulad IT Solution — গ্রাহক সেবায় সর্বদা দায়বদ্ধ**  
> টেকনিক্যাল সাপোর্ট ও কাস্টমাইজেশন: [Aulad IT Solution Support Desk]  
> কপিরাইট © ২০২৬ Aulad IT Solution. সর্বস্বত্ব সংরক্ষিত।

import mongoose from 'mongoose';
import dns from 'dns';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { v2 as cloudinary } from 'cloudinary';

// অনেক সময় বাংলাদেশে লোকাল আইএসপি ডিএনএস-এ mongodb+srv SRV রেকর্ড ব্লক বা ফেইল করে
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // ignore
}

async function testConnections() {
  console.log('=============================================');
  console.log('🔍 শুরু হচ্ছে .env.local ভেরিফিকেশন ও লাইভ কানেকশন টেস্ট...');
  console.log('=============================================\n');

  let allPassed = true;

  // 1. ভেরিয়েবল চেকিং
  console.log('📋 ১. প্রয়োজনীয় এনভায়রনমেন্ট ভেরিয়েবল যাচাই:');
  const requiredVars = [
    'MONGODB_URI',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'INITIAL_OWNER_EMAIL'
  ];

  const missing = requiredVars.filter(v => !process.env[v] || process.env[v]?.trim() === '');
  if (!process.env.BOOTSTRAP_SECRET && !process.env.SYSTEM_BOOTSTRAP_KEY) {
    missing.push('BOOTSTRAP_SECRET/SYSTEM_BOOTSTRAP_KEY');
  }
  if (missing.length > 0) {
    console.log(`❌ অনুপস্থিত বা খালি ভেরিয়েবল: ${missing.join(', ')}`);
    allPassed = false;
  } else {
    console.log('✅ সকল প্রয়োজনীয় ভেরিয়েবল উপস্থিত রয়েছে।');
  }

  // 2. MongoDB Atlas কানেকশন টেস্ট
  console.log('\n🍃 ২. MongoDB Atlas কানেকশন টেস্ট:');
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('❌ MONGODB_URI প্রদান করা হয়নি!');
    allPassed = false;
  } else {
    try {
      console.log('⏳ MongoDB Atlas-এ কানেক্ট করার চেষ্টা করা হচ্ছে...');
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
      const db = mongoose.connection.db;
      if (db) {
        const pingResult = await db.admin().ping();
        console.log(`✅ MongoDB Atlas কানেকশন সফল! (Database: "${mongoose.connection.name}", Ping: ${JSON.stringify(pingResult)})`);
      } else {
        console.log('✅ MongoDB Atlas সংযুক্ত হয়েছে!');
      }
      await mongoose.disconnect();
    } catch (err: any) {
      console.log(`❌ MongoDB Atlas কানেকশন ব্যর্থ হয়েছে: ${err.message}`);
      allPassed = false;
    }
  }

  // 3. Firebase Admin SDK টেস্ট
  console.log('\n🔥 ৩. Firebase Admin SDK অথেনটিকেশন টেস্ট:');
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.log('❌ Firebase Admin-এর জন্য প্রয়োজনীয় তথ্য অসম্পূর্ণ!');
    allPassed = false;
  } else {
    try {
      console.log('⏳ Firebase Admin ইনিশিয়ালাইজ করা হচ্ছে...');
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
      
      const app = getApps().length === 0 
        ? initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          }, 'test-verifier-app')
        : getApps()[0];

      const auth = getAuth(app);
      // ছোট একটি কল করে ভেরিফাই করা
      const userList = await auth.listUsers(1);
      console.log(`✅ Firebase Admin SDK সফলভাবে ভেরিফাইড! (Project: ${projectId}, Users Checked: ${userList.users.length})`);
    } catch (err: any) {
      console.log(`❌ Firebase Admin ইনিশিয়ালাইজেশন ব্যর্থ হয়েছে: ${err.message}`);
      allPassed = false;
    }
  }

  // 4. Cloudinary টেস্ট
  console.log('\n☁️ ৪. Cloudinary API কানেকশন টেস্ট:');
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.log('❌ Cloudinary ভেরিয়েবল অসম্পূর্ণ!');
    allPassed = false;
  } else {
    try {
      console.log('⏳ Cloudinary API পিং করা হচ্ছে...');
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      const ping = await cloudinary.api.ping();
      console.log(`✅ Cloudinary API কানেকশন সফল! (Cloud Name: ${cloudName}, Status: ${ping.status})`);
    } catch (err: any) {
      console.log(`❌ Cloudinary API টেস্ট ব্যর্থ হয়েছে: ${err.message}`);
      allPassed = false;
    }
  }

  console.log('\n=============================================');
  if (allPassed) {
    console.log('🎉 আলহামদুলিল্লাহ! সকল সার্ভিস (MongoDB, Firebase, Cloudinary) সফলভাবে সংযুক্ত হয়েছে ও প্রস্তুত!');
  } else {
    console.log('⚠️ কিছু সার্ভিসে সমস্যা পাওয়া গেছে, অনুগ্রহ করে উপরের ত্রুটি বার্তাগুলো লক্ষ্য করুন।');
  }
  console.log('=============================================\n');
}

testConnections().catch(console.error);

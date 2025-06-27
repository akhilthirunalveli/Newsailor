import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load service account credentials
let serviceAccount;
try {
  serviceAccount = JSON.parse(
    readFileSync('./serviceAccountKey.json', 'utf8')
  );
  console.log('✅ Service account loaded successfully');
} catch (error) {
  console.error('❌ Error loading service account:', error.message);
  process.exit(1);
}

// Initialize Admin SDK
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
  console.error('❌ Error initializing Firebase:', error.message);
  process.exit(1);
}

const db = getFirestore();

const categories = [
  'business',
  'crime',
  'domestic',
  'education',
  'entertainment',
  'environment',
  'food',
  'health',
  'lifestyle',
  'other',
  'politics',
  'science',
  'sports',
  'technology',
  'top',
  'tourism',
  'world'
];

async function deleteAllNews() {
  let totalDeleted = 0;
  for (const cat of categories) {
    const collectionRef = db.collection(`news_${cat}`);
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
      console.log(`No news found in category: ${cat}`);
      continue;
    }

    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
      totalDeleted++;
    });

    await batch.commit();
    console.log(`🗑️ Deleted ${snapshot.size} news from news_${cat}`);
  }
  console.log(`\n✅ Total news deleted: ${totalDeleted}`);
}

deleteAllNews()
  .then(() => {
    console.log('🎉 Finished deleting all news!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error deleting all news:', err);
    process.exit(1);
  });
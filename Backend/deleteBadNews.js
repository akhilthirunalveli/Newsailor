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

// List of your news categories (should match your fetchApiNews.js)
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

async function deleteBadNews() {
  let totalDeleted = 0;
  for (const cat of categories) {
    const collectionRef = db.collection(`news_${cat}`);
    // Get all docs in the collection
    const snapshot = await collectionRef.get();

    // Filter docs where imageUrl is missing, null, or empty string
    const docsToDelete = snapshot.docs.filter(doc => {
      const imageUrl = doc.data().imageUrl;
      return !imageUrl; // matches undefined, null, ''
    });

    if (docsToDelete.length === 0) {
      console.log(`No news without image found in category: ${cat}`);
      continue;
    }

    const batch = db.batch();
    docsToDelete.forEach(doc => {
      batch.delete(doc.ref);
      totalDeleted++;
    });

    await batch.commit();
    console.log(`🗑️ Deleted ${docsToDelete.length} news without image from news_${cat}`);
  }
  console.log(`\n✅ Total news without image deleted: ${totalDeleted}`);
}

deleteBadNews()
  .then(() => {
    console.log('🎉 Finished deleting bad news!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error deleting bad news:', err);
    process.exit(1);
  });
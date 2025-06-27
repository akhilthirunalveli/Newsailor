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
  'business', 'crime', 'domestic', 'education', 'entertainment',
  'environment', 'food', 'health', 'lifestyle', 'other',
  'politics', 'science', 'sports', 'technology', 'top',
  'tourism', 'world'
];

// Function to calculate similarity between two strings
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Using Levenshtein distance
  const matrix = Array(s2.length + 1).fill(null)
    .map(() => Array(s1.length + 1).fill(null));

  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  // Convert distance to similarity ratio
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - (matrix[s2.length][s1.length] / maxLength);
}

async function deleteSimilarNews() {
  let totalDeleted = 0;

  for (const category of categories) {
    console.log(`\nChecking category: ${category}`);
    const collectionRef = db.collection(`news_${category}`);
    const snapshot = await collectionRef.get();
    const docs = snapshot.docs;
    
    const batch = db.batch();
    const processedPairs = new Set();
    let categoryDeleted = 0;

    for (let i = 0; i < docs.length; i++) {
      for (let j = i + 1; j < docs.length; j++) {
        const doc1 = docs[i];
        const doc2 = docs[j];
        
        // Skip if either document has already been processed
        if (processedPairs.has(doc1.id) || processedPairs.has(doc2.id)) continue;

        const title1 = doc1.data().title;
        const title2 = doc2.data().title;

        const similarity = calculateSimilarity(title1, title2);

        // If similarity is greater than 85%, delete the newer article
        if (similarity > 0.85) {
          const date1 = doc1.data().publishedAt;
          const date2 = doc2.data().publishedAt;
          const docToDelete = date1 > date2 ? doc1 : doc2;

          batch.delete(docToDelete.ref);
          processedPairs.add(docToDelete.id);
          categoryDeleted++;
          totalDeleted++;

          console.log(`Found similar titles (${Math.round(similarity * 100)}% similar):`);
          console.log(`1: ${title1}`);
          console.log(`2: ${title2}`);
          console.log(`Deleting: ${docToDelete.data().title}\n`);
        }
      }
    }

    if (categoryDeleted > 0) {
      await batch.commit();
      console.log(`🗑️ Deleted ${categoryDeleted} similar news from ${category}`);
    }
  }

  console.log(`\n✅ Total similar news deleted: ${totalDeleted}`);
}

deleteSimilarNews()
  .then(() => {
    console.log('🎉 Finished deleting similar news!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error deleting similar news:', err);
    process.exit(1);
  });
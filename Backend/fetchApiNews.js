import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import admin from 'firebase-admin';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import crypto from 'crypto';
import cron from 'node-cron';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(' Starting news fetcher script...');

// Load service account credentials
let serviceAccount;
try {
  serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  };
  console.log(' Service account loaded successfully');
} catch (error) {
  console.error(' Error loading service account:', error.message);
  process.exit(1);
}

// Initialize Admin SDK
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  console.log('Firebase Admin SDK initialized');
} catch (error) {
  console.error(' Error initializing Firebase:', error.message);
  process.exit(1);
}

const db = getFirestore();

// Move API key to environment variable for security
const API_KEY = process.env.NEWSDATA_API_KEY || 'pub_1c6273dd5d2a429eb1123f6b1d73612d';
const BASE_URL = 'https://newsdata.io/api/1/latest?apikey=pub_1c6273dd5d2a429eb1123f6b1d73612d&q=indian%20news';


  const categories = ['business',
  'entertainment',
  'health',
  'politics',
  'science',
  'sports',
  'technology',
  'top',
  'world',
  'domestic'
];

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequestsPerHour: 200, // Adjust based on your plan
  delayBetweenRequests: 30000, // 30 seconds between requests
  retryDelay: 60000, // 1 minute retry delay for 429 errors
  maxRetries: 3
};

// Add request tracking
let requestCount = 0;
let lastResetTime = Date.now();

// Enhanced delay function with exponential backoff
async function smartDelay(attempt = 0) {
  const baseDelay = RATE_LIMIT.delayBetweenRequests;
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const finalDelay = Math.min(exponentialDelay, 300000); // Max 5 minutes
  
  console.log(` Waiting ${finalDelay / 1000} seconds before next request...`);
  await new Promise(resolve => setTimeout(resolve, finalDelay));
}

// Enhanced API request with retry logic
async function makeAPIRequest(params, retryCount = 0) {
  try {
    // Reset request count every hour
    const now = Date.now();
    if (now - lastResetTime > 3600000) { // 1 hour
      requestCount = 0;
      lastResetTime = now;
      console.log(' Hourly request count reset');
    }

    // Check if we're approaching rate limit
    if (requestCount >= RATE_LIMIT.maxRequestsPerHour - 10) {
      console.log(' Approaching rate limit, pausing execution...');
      await new Promise(resolve => setTimeout(resolve, 3600000 - (now - lastResetTime)));
      requestCount = 0;
      lastResetTime = Date.now();
    }

    console.log(`📡 Making API request (${requestCount + 1}/${RATE_LIMIT.maxRequestsPerHour})`);
    
    const response = await axios.get(BASE_URL, {
      params: {
        apikey: API_KEY,
        ...params
      },
      timeout: 30000,
      headers: {
        'User-Agent': 'NewsFetcher/1.0',
        'Accept': 'application/json'
      }
    });

    requestCount++;
    console.log(` API request successful. Remaining: ${response.headers['x_rate_limit_remaining'] || 'unknown'}`);
    
    return response;
    
  } catch (error) {
    if (error.response?.status === 429) {
      console.log(` Rate limit hit. Attempt ${retryCount + 1}/${RATE_LIMIT.maxRetries}`);
      
      if (retryCount < RATE_LIMIT.maxRetries) {
        const retryDelay = RATE_LIMIT.retryDelay * Math.pow(2, retryCount);
        console.log(` Waiting ${retryDelay / 1000} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return makeAPIRequest(params, retryCount + 1);
      } else {
        console.error(' Max retries reached for rate limit');
        throw new Error('Rate limit exceeded - max retries reached');
      }
    }
    
    if (error.response?.status === 403) {
      console.error(' API access forbidden - check your API key and plan limits');
      throw new Error('API access forbidden');
    }
    
    throw error;
  }
}

// Function to create/update super collections document
async function updateSuperCollections() {
  try {
    console.log(' Updating super collections document...');
    const superCollectionRef = db.collection('super_collections').doc('news_collections');
    
    const initialData = {
      lastUpdated: Timestamp.now(),
      totalCategories: categories.length,
      categories: {},
      searchCollections: {},
      rateLimit: {
        requestCount,
        lastReset: Timestamp.fromDate(new Date(lastResetTime)),
        maxPerHour: RATE_LIMIT.maxRequestsPerHour
      }
    };

    categories.forEach(category => {
      initialData.categories[category.toLowerCase()] = {
        name: category,
        articleCount: 0,
        lastUpdated: Timestamp.now(),
        articles: []
      };
    });

    await superCollectionRef.set(initialData, { merge: true });
    console.log(' Super collections document updated');
  } catch (error) {
    console.error(' Error updating super collections:', error);
    throw error;
  }
}

// Helper function to generate consistent article IDs
function generateArticleId(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50) + '_' + Date.now();
}

// Helper function to extract keywords from text
function extractKeywords(text) {
  if (!text) return [];
  
  const stopWords = ['the', 'is', 'at', 'which', 'on', 'and', 'a', 'to', 'are', 'as', 'was', 'will', 'for', 'of', 'with', 'in'];
  
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .slice(0, 10);
}

function getFingerprint(article) {
  return crypto
    .createHash('md5')
    .update((article.title || '') + (article.link || '') + (article.pubDate || ''))
    .digest('hex');
}

// Enhanced fetch and store function with better error handling
async function fetchAndStoreNews() {
  try {
    console.log(' Starting news fetch process...');
    
    await updateSuperCollections();
    
    const superCollectionRef = db.collection('super_collections').doc('news_collections');
    let totalArticlesAdded = 0;
    let successfulCategories = 0;

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      console.log(`\n Fetching news for category: ${cat} (${i + 1}/${categories.length})`);

      try {
        // Add delay before each request (except the first)
        if (i > 0) {
          await smartDelay();
        }

        const response = await makeAPIRequest({
          category: cat.toLowerCase(),
          language: 'en',
          country: 'in' // Focus on India to get more relevant results
        });

        const articles = response.data.results || [];
        console.log(` Found ${articles.length} articles for ${cat}`);

        if (articles.length === 0) {
          console.log(` No articles found for category: ${cat}`);
          continue;
        }

        const categoryKey = cat.toLowerCase();
        const processedArticles = [];

        // Process each article with better error handling
        for (let j = 0; j < Math.min(articles.length, 20); j++) { // Limit to 20 articles per category
          const article = articles[j];
          
          if (!article.title ||  !article.image_url) {
            console.log(` Skipping article ${j + 1}: Missing required fields (title, link, or image)`);
            continue;
          }

          try {
            const fingerprint = getFingerprint(article);
            
            // Check for duplicates
            const existingDoc = await db
              .collection(`news_${categoryKey}`)
              .where('fingerprint', '==', fingerprint)
              .limit(1)
              .get();

            if (!existingDoc.empty) {
              console.log(` Skipped duplicate: ${article.title.substring(0, 60)}...`);
              continue;
            }

            const articleData = {
              id: generateArticleId(article.title),
              title: article.title,
              content: article.content || article.description || '',
              imageUrl: article.image_url,
              description: article.description || '',
              link: article.link,
              pubDate: article.pubDate || null,
              source: article.source_id || 'unknown',
              category: cat,
              keywords: extractKeywords(article.title + ' ' + (article.content || article.description || '')),
              createdAt: Timestamp.now(),
              searchable: true,
              fingerprint
            };

            // Store in individual category collection
            await db.collection(`news_${categoryKey}`).doc(articleData.id).set(articleData);
            processedArticles.push(articleData);
            totalArticlesAdded++;
            console.log(` Added: ${article.title.substring(0, 60)}...`);

          } catch (articleError) {
            console.error(` Error processing article "${article.title}":`, articleError.message);
            continue;
          }
        }

        // Update super collections document
        if (processedArticles.length > 0) {
          try {
            const articlesForSuper = processedArticles.map(article => ({
              id: article.id,
              title: article.title,
              imageUrl: article.imageUrl,
              description: article.description,
              link: article.link,
              pubDate: article.pubDate,
              keywords: article.keywords,
              createdAt: article.createdAt
            }));

            await superCollectionRef.update({
              [`categories.${categoryKey}.articles`]: FieldValue.arrayUnion(...articlesForSuper),
              [`categories.${categoryKey}.articleCount`]: FieldValue.increment(processedArticles.length),
              [`categories.${categoryKey}.lastUpdated`]: Timestamp.now(),
              lastUpdated: Timestamp.now(),
              'rateLimit.requestCount': requestCount,
              'rateLimit.lastReset': Timestamp.fromDate(new Date(lastResetTime))
            });

            console.log(` Updated super collection for ${cat}: +${processedArticles.length} articles`);
          } catch (updateError) {
            console.error(` Error updating super collection for ${cat}:`, updateError.message);
          }
        }

        successfulCategories++;

      } catch (categoryError) {
        console.error(` Error fetching news for category ${cat}:`, categoryError.message);
        
        // If it's a rate limit error, break the loop to avoid further errors
        if (categoryError.message.includes('Rate limit')) {
          console.log(' Stopping due to rate limit. Will retry in next scheduled run.');
          break;
        }
        continue;
      }
    }

    console.log(`\n News fetch completed!`);
    console.log(` Total articles added: ${totalArticlesAdded}`);
    console.log(` Successful categories: ${successfulCategories}/${categories.length}`);
    console.log(` API requests made: ${requestCount}`);

  } catch (error) {
    console.error(' Fatal error in fetchAndStoreNews:', error);
    throw error;
  }
}

// Function to search news and create keyword-based collections
async function searchAndCreateCollection(searchKeyword) {
  try {
    console.log(`🔍 Searching for: "${searchKeyword}"`);
    
    const searchResults = [];
    const normalizedKeyword = searchKeyword.toLowerCase().trim();
    
    for (const cat of categories) {
      const categoryCollection = db.collection(`news_${cat.toLowerCase()}`);
      
      try {
        const titleQuery = await categoryCollection
          .where('title', '>=', searchKeyword)
          .where('title', '<=', searchKeyword + '\uf8ff')
          .limit(10)
          .get();
        
        const keywordQuery = await categoryCollection
          .where('keywords', 'array-contains', normalizedKeyword)
          .limit(10)
          .get();

        const allDocs = new Map();
        
        titleQuery.forEach(doc => {
          allDocs.set(doc.id, { id: doc.id, ...doc.data() });
        });
        
        keywordQuery.forEach(doc => {
          allDocs.set(doc.id, { id: doc.id, ...doc.data() });
        });

        searchResults.push(...Array.from(allDocs.values()));
      } catch (searchError) {
        console.error(`Error searching in category ${cat}:`, searchError.message);
        continue;
      }
    }

    const uniqueResults = searchResults.filter((article, index, self) =>
      index === self.findIndex(a => a.title === article.title)
    );

    console.log(`🔍 Found ${uniqueResults.length} unique results for "${searchKeyword}"`);

    if (uniqueResults.length > 0) {
      const searchCollectionName = `search_${normalizedKeyword.replace(/\s+/g, '_')}`;
      
      console.log(`📝 Creating search collection: ${searchCollectionName}`);
      
      const batch = db.batch();
      
      uniqueResults.forEach(article => {
        const docRef = db.collection(searchCollectionName).doc(article.id);
        batch.set(docRef, {
          ...article,
          searchKeyword: searchKeyword,
          searchCreatedAt: Timestamp.now(),
          relevanceScore: calculateRelevanceScore(article, normalizedKeyword)
        });
      });

      await batch.commit();

      const superCollectionRef = db.collection('super_collections').doc('news_collections');
      await superCollectionRef.update({
        [`searchCollections.${searchCollectionName}`]: {
          keyword: searchKeyword,
          resultCount: uniqueResults.length,
          createdAt: Timestamp.now(),
          collectionName: searchCollectionName
        },
        lastSearchUpdate: Timestamp.now()
      });

      console.log(`Created search collection '${searchCollectionName}' with ${uniqueResults.length} results`);
      return {
        collectionName: searchCollectionName,
        results: uniqueResults,
        count: uniqueResults.length
      };
    } else {
      console.log(` No results found for: "${searchKeyword}"`);
      return {
        collectionName: null,
        results: [],
        count: 0
      };
    }
  } catch (error) {
    console.error(' Error in search and create collection:', error);
    throw error;
  }
}

function calculateRelevanceScore(article, keyword) {
  let score = 0;
  const title = article.title.toLowerCase();
  const content = (article.content || '').toLowerCase();
  
  if (title.includes(keyword)) score += 10;
  
  const contentMatches = (content.match(new RegExp(keyword, 'g')) || []).length;
  score += contentMatches * 2;
  
  if (article.keywords && article.keywords.includes(keyword)) score += 5;
  
  return score;
}

// Main execution function with better error handling
async function main() {
  try {
    console.log(' Starting optimized news collection system...');
    console.log(' Current time:', new Date().toISOString());
    console.log(`Rate limit: ${requestCount}/${RATE_LIMIT.maxRequestsPerHour} requests this hour`);
    
    // Test API connection first
    console.log('\n🔗 Testing API connection...');
    const testResponse = await makeAPIRequest({
      category: 'world',
      language: 'en'
    });
    
    if (testResponse.data && testResponse.data.results) {
      console.log(`API connection successful. Found ${testResponse.data.results.length} test articles`);
    } else {
      throw new Error('API response structure unexpected');
    }
    
    // Fetch and store news
    await fetchAndStoreNews();
    
    console.log('\n System execution completed!');
    
  } catch (error) {
    console.error(' Fatal error in main execution:', error);
    
    // Don't exit the process, just log the error and continue
    if (error.message.includes('Rate limit')) {
      console.log(' Will retry in next scheduled run...');
    }
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n Process interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(' Unhandled Rejection at:', promise, 'reason:', reason);
});

// Changed to run every 2 hours instead of every 5 minutes to respect rate limits
cron.schedule('0 */2 * * *', () => {
  console.log('\n Scheduled fetch started at', new Date().toISOString());
  main().catch(error => {
    console.error(' Scheduled fetch error:', error);
  });
});

// Run once at startup
console.log(' Starting initial execution...');
main().catch(error => {
  console.error(' Initial execution error:', error);
});
// backend/firebase.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from './serviceAccountKey.json' assert { type: "json" };

// Initialize Firebase Admin with service account
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Helper functions for the optimized news system
export const NewsCollectionHelpers = {
  // Get all news organized by categories
  async getAllNews() {
    try {
      const superCollectionRef = db.collection('super_collections').doc('news_collections');
      const doc = await superCollectionRef.get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Error getting all news:', error);
      throw error;
    }
  },

  // Get news by specific category
  async getNewsByCategory(category) {
    try {
      const categoryCollection = db.collection(`news_${category.toLowerCase()}`);
      const snapshot = await categoryCollection
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error getting news for category ${category}:`, error);
      throw error;
    }
  },

  // Search news and get results from existing search collection
  async searchNews(keyword) {
    try {
      const normalizedKeyword = keyword.toLowerCase().trim();
      const searchCollectionName = `search_${normalizedKeyword.replace(/\s+/g, '_')}`;
      
      const searchCollection = db.collection(searchCollectionName);
      const snapshot = await searchCollection
        .orderBy('relevanceScore', 'desc')
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error searching news for keyword ${keyword}:`, error);
      return [];
    }
  },

  // Get all available search collections
  async getSearchCollections() {
    try {
      const superCollectionRef = db.collection('super_collections').doc('news_collections');
      const doc = await superCollectionRef.get();
      
      if (doc.exists && doc.data().searchCollections) {
        return doc.data().searchCollections;
      }
      return {};
    } catch (error) {
      console.error('Error getting search collections:', error);
      throw error;
    }
  },

  // Get trending topics based on search frequency
  async getTrendingTopics() {
    try {
      const searchCollections = await this.getSearchCollections();
      const trending = Object.values(searchCollections)
        .sort((a, b) => b.resultCount - a.resultCount)
        .slice(0, 10)
        .map(collection => ({
          keyword: collection.keyword,
          count: collection.resultCount,
          createdAt: collection.createdAt
        }));
      
      return trending;
    } catch (error) {
      console.error('Error getting trending topics:', error);
      throw error;
    }
  },

  // Get recent news across all categories
  async getRecentNews(limit = 20) {
    try {
      const categories = ['world', 'politics', 'sports', 'technology', 'business', 'health', 'entertainment'];
      const allNews = [];

      for (const category of categories) {
        const categoryCollection = db.collection(`news_${category}`);
        const snapshot = await categoryCollection
          .orderBy('createdAt', 'desc')
          .limit(Math.ceil(limit / categories.length))
          .get();
        
        snapshot.docs.forEach(doc => {
          allNews.push({ id: doc.id, ...doc.data() });
        });
      }

      // Sort by creation date and limit results
      return allNews
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent news:', error);
      throw error;
    }
  },

  // Get news statistics
  async getNewsStats() {
    try {
      const superCollectionRef = db.collection('super_collections').doc('news_collections');
      const doc = await superCollectionRef.get();
      
      if (!doc.exists) return null;
      
      const data = doc.data();
      const categories = data.categories || {};
      
      const stats = {
        totalArticles: Object.values(categories).reduce((sum, cat) => sum + cat.articleCount, 0),
        categoriesCount: Object.keys(categories).length,
        searchCollectionsCount: Object.keys(data.searchCollections || {}).length,
        lastUpdated: data.lastUpdated,
        categoryBreakdown: Object.entries(categories).map(([key, cat]) => ({
          name: cat.name,
          count: cat.articleCount,
          lastUpdated: cat.lastUpdated
        }))
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting news stats:', error);
      throw error;
    }
  }
};

export { db };
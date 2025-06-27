import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Sun, Moon, Edit3, Calendar, Tag, Star, PenTool } from 'lucide-react';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useTheme } from '../context/ThemeContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AdminLogin from '../components/AdminLogin';

const categories = [
  'world',
  'politics', 
  'sports',
  'technology',
  'business',
  'health',
  'entertainment'
];

const categoryInfo = {
  world: { label: 'World', icon: '🌍' },
  politics: { label: 'Politics', icon: '🏛️' },
  sports: { label: 'Sports', icon: '⚽' },
  technology: { label: 'Technology', icon: '💻' },
  business: { label: 'Business', icon: '💼' },
  health: { label: 'Health', icon: '🏥' },
  entertainment: { label: 'Entertainment', icon: '🎬' },
  editors_pick: { label: "Editor's Pick", icon: '⭐' }
};

const Admin = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('');
  const [newsList, setNewsList] = useState([]);
  const [editorsPickList, setEditorsPickList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('api'); // 'api' or 'editors'
  const [editorName, setEditorName] = useState('');
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const { isDarkMode: isDark, setIsDarkMode } = useTheme();

  const fetchNews = async () => {
    try {
      const allNews = [];

      for (const cat of categories) {
        const snapshot = await getDocs(collection(db, `news_${cat}`));
        snapshot.forEach(docSnap => {
          allNews.push({
            id: docSnap.id,
            ...docSnap.data(),
            category: cat,
            collection: `news_${cat}`,
            source: 'api'
          });
        });
      }

      setNewsList(allNews);
    } catch (err) {
      console.error('Error fetching news:', err);
    }
  };

  const fetchEditorsPickNews = async () => {
    try {
      let editorsNews = [];
      
      // Try to fetch from news_editors_pick first
      try {
        const snapshot = await getDocs(collection(db, 'news_editors_pick'));
        snapshot.forEach(docSnap => {
          editorsNews.push({
            id: docSnap.id,
            ...docSnap.data(),
            collection: 'news_editors_pick',
            source: 'editor'
          });
        });
        console.log('Fetched from news_editors_pick:', editorsNews.length, 'articles');
      } catch (editorsError) {
        console.log('Could not fetch from news_editors_pick, trying fallback...', editorsError);
        
        // Try fallback collection
        try {
          const fallbackSnapshot = await getDocs(collection(db, 'editors_articles'));
          fallbackSnapshot.forEach(docSnap => {
            editorsNews.push({
              id: docSnap.id,
              ...docSnap.data(),
              collection: 'editors_articles',
              source: 'editor'
            });
          });
          console.log('Fetched from editors_articles fallback:', editorsNews.length, 'articles');
        } catch (fallbackError) {
          console.error('Both collections failed:', fallbackError);
        }
      }

      setEditorsPickList(editorsNews);
    } catch (err) {
      console.error('Error fetching editors pick news:', err);
    }
  };

  const addEditorsPickNews = async () => {
    try {
      // Validate required fields
      if (!title || !content || !category || !editorName) {
        alert('Please fill in all required fields');
        return;
      }

      setLoading(true);
      console.log('Starting to publish article...');

      // No image upload, just use imageUrl from input
      const uploadedImageUrl = imageUrl.trim();

      // Create the article document
      const articleData = {
        title: title.trim(),
        content: content.trim(),
        imageUrl: uploadedImageUrl || '',
        category: category,
        originalCategory: category,
        editorName: editorName.trim(),
        createdAt: serverTimestamp(),
        pubDate: new Date().toISOString(),
        source: 'editor',
        isEditorsPick: true,
        searchable: true,
        keywords: extractKeywords(title + ' ' + content)
      };

      console.log('Publishing article to news_editors_pick:', articleData);

      // Add to Firestore
      let docRef;
      try {
        docRef = await addDoc(collection(db, 'news_editors_pick'), articleData);
        console.log('Successfully published to news_editors_pick with ID:', docRef.id);
      } catch (editorsPickError) {
        console.error('Failed to publish to news_editors_pick:', editorsPickError);
        alert('Failed to publish article. Please check your Firestore rules.');
        return;
      }

      // Reset form
      setTitle('');
      setContent('');
      setCategory('');
      setEditorName('');
      setImageUrl('');

      // Refresh the list
      await fetchEditorsPickNews();

      alert('Article published successfully!');
      setActiveTab('editors');
    } catch (error) {
      console.error('Error publishing article:', error);
      alert('Error publishing article: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract keywords
  const extractKeywords = (text) => {
    if (!text) return [];
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by'];
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 10);
  };

  const deleteNews = async (id, collectionName) => {
    if (!window.confirm('Are you sure you want to delete this article?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, collectionName, id));
      if (collectionName === 'news_editors_pick' || collectionName === 'editors_articles') {
        await fetchEditorsPickNews();
      } else {
        await fetchNews();
      }
      alert('Article deleted successfully!');
    } catch (err) {
      console.error('Error deleting news:', err);
      alert('Error deleting article. Please try again.');
    }
  };

  const getCategoryInfo = (categoryValue) => {
    return categoryInfo[categoryValue] || 
           { label: categoryValue || 'General', icon: '📄' };
  };

  const formatDate = (date) => {
    if (!date) return 'No date';
    
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const currentList = activeTab === 'api' ? newsList : editorsPickList;
  const filteredNewsList = currentList.filter(article => 
    article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getCategoryInfo(article.category || article.originalCategory).label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchNews();
    fetchEditorsPickNews();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthChecked(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const theme = {
    bg: isDark ? 'bg-gray-900' : 'bg-gray-50',
    cardBg: isDark ? 'bg-gray-800' : 'bg-white',
    text: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    input: isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
    button: isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700',
    deleteButton: isDark ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' : 'text-red-600 hover:text-red-800 hover:bg-red-50',
    tabActive: isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white',
    tabInactive: isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
  };

  if (!authChecked) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin theme={theme} isDark={isDark} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.bg}`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${theme.text} mb-2`}>
              News Admin Panel
            </h1>
            <p className={theme.textSecondary}>
              Logged in as: {user.email}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <div className="flex items-center gap-3">
              <Sun className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-yellow-500'}`} />
              <button
                onClick={() => setIsDarkMode(prev => !prev)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                  isDark ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                    isDark ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <Moon className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-gray-500'}`} />
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3zm11 4.414L11.414 5H15v2.586zM5 5h4.586L7 7.586 5 5zm10 10H5v-2.586l2-2 4.586 4.586H15v-2.586l-2-2 2-2V15zm0-7.414V15H5v-2.586l2-2 4.586 4.586H15v-2.586l-2-2 2-2z" clipRule="evenodd" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor's Pick Form */}
          <div className="lg:col-span-1">
            <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-6 shadow-lg`}>
              <div className="flex items-center gap-2 mb-6">
                <Star className={`w-5 h-5 text-yellow-500`} />
                <h2 className={`text-xl font-semibold ${theme.text}`}>
                  Editor's Pick
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                    Editor Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter editor name..."
                    value={editorName}
                    onChange={e => setEditorName(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                    Title *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter article title..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                    Content *
                  </label>
                  <textarea
                    placeholder="Write your article content..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={6}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all resize-none`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                    Image URL
                  </label>
                  <input
                    type="text"
                    placeholder="Paste image URL..."
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all`}
                  />
                  {imageUrl && (
                    <div className="mt-2">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all`}
                    required
                  >
                    <option value="">Select category...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {categoryInfo[cat]?.icon} {categoryInfo[cat]?.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={addEditorsPickNews}
                  disabled={loading}
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4" />
                      Publish as Editor's Pick
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* News List */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('api')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'api' ? theme.tabActive : theme.tabInactive
                }`}
              >
                <PenTool className="w-4 h-4" />
                API News ({newsList.length})
              </button>
              <button
                onClick={() => setActiveTab('editors')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === 'editors' ? theme.tabActive : theme.tabInactive
                }`}
              >
                <Star className="w-4 h-4" />
                Editor's Pick ({editorsPickList.length})
              </button>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-semibold ${theme.text}`}>
                  {activeTab === 'api' ? 'API News Articles' : "Editor's Pick Articles"} ({filteredNewsList.length})
                </h2>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search articles by title, content or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full px-4 py-3 pl-10 rounded-lg border ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                />
                <svg
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {filteredNewsList.length === 0 ? (
              <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-12 text-center shadow-lg`}>
                <Edit3 className={`w-12 h-12 ${theme.textMuted} mx-auto mb-4`} />
                <h3 className={`text-lg font-medium ${theme.text} mb-2`}>
                  {searchQuery ? 'No matching articles found' : 'No articles yet'}
                </h3>
                <p className={theme.textMuted}>
                  {searchQuery 
                    ? 'Try adjusting your search terms or clear the search'
                    : activeTab === 'editors' 
                      ? 'Start by creating your first Editor\'s Pick article using the form on the left.'
                      : 'API news will appear here when fetched.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredNewsList.map((article) => {
                  const categoryInfo = getCategoryInfo(article.category || article.originalCategory);
                  const isEditorsPick = article.source === 'editor';
                  
                  return (
                    <article
                      key={article.id}
                      className={`${theme.cardBg} ${theme.border} border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group ${
                        isEditorsPick ? 'ring-2 ring-yellow-500/20' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{categoryInfo.icon}</span>
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                              <Tag className="w-3 h-3 mr-1" />
                              {categoryInfo.label}
                            </span>
                            {isEditorsPick && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800`}>
                                <Star className="w-3 h-3 mr-1" />
                                Editor's Pick
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => deleteNews(article.id, article.collection)}
                          className={`${theme.deleteButton} p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100`}
                          title="Delete article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h3 className={`text-xl font-bold ${theme.text} mb-3 line-clamp-2`}>
                        {article.title}
                      </h3>
                      
                      <p className={`${theme.textSecondary} mb-4 line-clamp-3 leading-relaxed`}>
                        {article.content}
                      </p>

                      {article.imageUrl && (
                        <div className="mb-4">
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-full h-48 object-cover rounded-lg"
                            loading="lazy"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className={`flex items-center gap-2 ${theme.textMuted} text-sm`}>
                          <Calendar className="w-4 h-4" />
                          {formatDate(article.createdAt)}
                        </div>
                        {isEditorsPick && article.editorName && (
                          <div className={`flex items-center gap-2 ${theme.textMuted} text-sm`}>
                            <PenTool className="w-4 h-4" />
                            By {article.editorName}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useLocation, Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext'; // Import theme context

const Categories = () => {
  const [newsList, setNewsList] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { isDarkMode: isDark } = useTheme(); // Use global theme

  // Define display categories (capitalized for UI)
  const categories = [
    'All',
    'World',
    'Politics',
    'Sports',
    'Technology',
    'Business',
    'Health',
    'Entertainment',
    'Crime',
    'Domestic',
    'Education',
    'Environment',
    'Food',
    'Lifestyle',
    'Other',
    'Science',
    'Top',
    'Tourism'
  ];

  // Map display names to Firebase collection names (all lowercase)
  const categoryMap = {
    'All': 'all',
    'World': 'world',
    'Politics': 'politics',
    'Sports': 'sports',
    'Technology': 'technology',
    'Business': 'business',
    'Health': 'health',
    'Entertainment': 'entertainment',
    'Crime': 'crime',
    'Domestic': 'domestic',
    'Education': 'education',
    'Environment': 'environment',
    'Food': 'food',
    'Lifestyle': 'lifestyle',
    'Other': 'other',
    'Science': 'science',
    'Top': 'top',
    'Tourism': 'tourism'
  };

  const location = useLocation();

  // Fetch news from all Firebase collections
  const fetchNews = async () => {
    try {
      setLoading(true);
      
      const promises = Object.values(categoryMap).filter(cat => cat !== 'all').map(async (category) => {
        const colRef = collection(db, `news_${category}`);
        const q = query(colRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          category, // add lowercase category for routing
        }));
      });

      const results = await Promise.all(promises);
      const allNews = results.flat();
      
      setNewsList(allNews);

      // Set initial category from location state or default to 'All'
      const initialCategory = location.state?.selectedCategory || 'All';
      setSelectedCategory(initialCategory);

      if (initialCategory === 'All') {
        setFilteredNews(allNews);
      } else {
        const filtered = allNews.filter(news => 
          news.category === categoryMap[initialCategory]
        );
        setFilteredNews(filtered);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [location.state?.selectedCategory]);

  // Apply filters when search query changes
  useEffect(() => {
    if (newsList.length > 0) {
      applyFilters(selectedCategory, searchQuery);
    }
  }, [searchQuery, newsList]);

  const filterByCategory = (category) => {
    setSelectedCategory(category);
    applyFilters(category, searchQuery);
  };

  const handleSearch = () => {
    applyFilters(selectedCategory, searchQuery);
  };

  const applyFilters = (category, search) => {
    let filtered = newsList;

    // Apply category filter
    if (category !== 'All') {
      filtered = filtered.filter(news => 
        news.category === categoryMap[category]
      );
    }

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(news => 
        news.title?.toLowerCase().includes(searchLower) ||
        news.content?.toLowerCase().includes(searchLower) ||
        news.category?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredNews(filtered);
  };

  // Generate dynamic page title based on selected category
  const getPageTitle = () => {
    if (selectedCategory === 'All') {
      return 'Browse All Categories';
    }
    return `Browse By ${selectedCategory}`;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedCategory]);

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${isDark ? 'border-blue-400' : 'border-blue-600'}`}></div>
            <p className={isDark ? 'text-slate-300' : 'text-gray-600'}>Loading categories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
      {/* Header */}
      <header className={`border-b py-3 sticky top-0 z-50 shadow-lg backdrop-blur-md transition-colors ${
        isDark
          ? 'bg-slate-800/95 border-slate-700'
          : 'bg-white/95 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-5 flex flex-col gap-4 relative items-center">
          <Link to="/" className="no-underline">
            <h1 
              className={`text-3xl sm:text-4xl font-bold m-0 transition-colors ${
                isDark ? 'text-white hover:text-blue-600' : 'text-black hover:text-blue-600'
              }`}
              style={{ fontFamily: 'CS Bristol, cursive, sans-serif' }}
            >
              NewsSailor
            </h1>
          </Link>

          {/* Search Bar */}
          <div className="relative flex-1 flex justify-center w-full">
            <div className="w-full max-w-lg">
              <div className={`flex items-center rounded-full px-4 py-2 shadow-inner focus-within:ring-2 ring-blue-400 transition-all
                ${isDark ? 'bg-slate-700' : 'bg-gray-100'}
                border border-transparent focus-within:border-blue-400
              `}
                style={{
                  boxShadow: isDark
                    ? '0 2px 8px 0 rgba(30,41,59,0.25)'
                    : '0 2px 8px 0 rgba(0,0,0,0.06)',
                }}
              >
                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search articles..."
                  className={`bg-transparent outline-none flex-1 text-base placeholder-gray-400 ${
                    isDark ? 'text-gray-100' : 'text-gray-700'
                  }`}
                  style={{ minWidth: 0, fontWeight: 500 }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`ml-2 rounded-full p-1 hover:bg-gray-200 dark:hover:bg-slate-600 transition`}
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Dynamic Page Title */}
        <div className="mb-6 sm:mb-8">
          <h2 className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {getPageTitle()}
          </h2>
        </div>

        {/* Category Filter Buttons - Scrollable on mobile */}
        <div className="mb-8 sm:mb-10 -mx-4 sm:mx-0">
          <div className="overflow-x-auto pb-4 sm:pb-0 px-4 sm:px-0">
            <div className="flex flex-nowrap sm:flex-wrap gap-2 sm:gap-3 sm:justify-center min-w-min">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => filterByCategory(cat)}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                    selectedCategory === cat
                      ? `${isDark ? 'bg-blue-500 hover:bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white shadow-lg`
                      : `${isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className={`text-base sm:text-lg font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
            {selectedCategory === 'All' 
              ? `Showing all ${filteredNews.length} articles` 
              : `Showing ${filteredNews.length} articles in ${selectedCategory}`
            }
          </p>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredNews.length === 0 ? (
            <div className={`col-span-full text-center py-16 px-8 rounded-xl border-2 border-dashed ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-gray-50 border-gray-300'}`}>
              <div className="text-6xl mb-4">📰</div>
              <p className={`text-xl font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'} mb-2`}>
                No news available in this category
              </p>
              <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                Try selecting a different category or check back later
              </p>
            </div>
          ) : (
            filteredNews.map(({ id, title, content, imageUrl, category }) => (
              <Link
                key={id}
                to={`/news/${category}/${id}`}
                className="group block"
              >
                <article className={`rounded-xl overflow-hidden shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full flex flex-col
                  ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}`}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className={`w-full h-48 flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                      <div className="text-center">
                        <div className="text-4xl mb-2">📰</div>
                        <p className={isDark ? 'text-slate-400 italic' : 'text-gray-500 italic'}>No Image Available</p>
                      </div>
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize
                          ${isDark ? 'bg-slate-700 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                          {category}
                        </span>
                      </div>
                      
                      <h3 className={`text-xl font-semibold mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors
                        ${isDark ? 'text-white dark:group-hover:text-blue-400' : 'text-gray-900'}`}>
                        {title}
                      </h3>
                      
                   
                    </div>
                    
                    <div className={`flex items-center font-semibold text-sm group-hover:text-blue-700 transition-colors
                      ${isDark ? 'text-blue-400 dark:group-hover:text-blue-300' : 'text-blue-600'}`}>
                      Read Full Article
                      <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Categories;
// pages/Home.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import NewsTickerRectangle from './NewsTickerRectangle';
import { useTheme } from '../context/ThemeContext';
import { FaSearch } from 'react-icons/fa'; // Add at the top with other imports

// News Ticker Component
const NewsTicker = ({ allNews }) => {
  const { isDarkMode: isDark } = useTheme(); // Add theme context
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!allNews || allNews.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % allNews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [allNews]);

  if (!allNews || allNews.length === 0) {
    return (
      <div className={`w-full py-2 text-center font-mono text-lg tracking-wide ${
        isDark ? 'bg-slate-900 text-gray-300' : 'bg-black text-white'
      }`}>
        Loading breaking news...
      </div>
    );
  }

  const currentNews = allNews[currentIndex];

  return (
    <div
      className={`
        w-full flex items-center
        py-2 px-4 font-mono text-lg tracking-wide
        shadow-lg
        ${isDark ? 'bg-slate-900 text-yellow-300' : 'bg-grey-200 text-red-800'}
      `}
      style={{
        borderBottom: '4px solid #e11d48',
        letterSpacing: '0.04em'
      }}
    >
     
     
      {/* Marquee headline */}
      <Link
        to={`/news/${currentNews.category}/${currentNews.id}`}
        className="no-underline text-inherit flex-1"
        style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
      >
        <span
          className="inline-block"
          style={{
            animation: 'ticker-marquee 18s linear infinite'
          }}
        >
          {currentNews.title}
  
        </span>
      </Link>
      {/* Category and time */}
      <span className={`ml-4 px-2 py-1 rounded text-xs font-semibold ${isDark ? 'bg-slate-800 text-blue-300' : 'bg-gray-900 text-blue-200'}`}>
        {currentNews.category}
      </span>
      <span className={`ml-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-300'}`}>
        {formatTimeAgo(currentNews.createdAt)}
      </span>
      {/* Marquee animation keyframes */}
      <style>
        {`
          @keyframes ticker-marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
        `}
      </style>
    </div>
  );
};

// Header Component
const Header = ({ allNews }) => {
  const { isDarkMode: isDark } = useTheme();
  return (
    <div className="mx-2 sm:mx-4 lg:mx-6 relative px-2 sm:px-4"> {/* Adjusted margins and padding */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mt-15 mb-15 sm:mt-20 sm:mb-20 relative z-10">
        {/* Left: Title and Subtitle */}
        <div className="flex-1 min-w-0 text-center md:text-left">
          <h1 className={`text-4xl sm:text-5xl md:text-6xl font-bold leading-tight ${
            isDark ? 'text-white' : 'text-slate-800'
          }`}>
            Your own{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-blue-500">NEWS</span>
              <span className="absolute inset-0 bg-blue-500/10 rounded-lg -rotate-2 scale-110"></span>
            </span>{' '}
            <br className="hidden sm:block" />
            platform.
          </h1>
          <p className={`mt-4 sm:mt-6 text-base sm:text-lg md:text-xl ${
            isDark ? 'text-gray-300' : 'text-slate-600'
          }`}>
            Breaking news, real stories, your voice - all in one place.
          </p>
        </div>
        {/* Right: News Ticker (bigger) */}
        <div className="flex-shrink-0 w-full md:w-[600px] max-w-full">
          <NewsTickerRectangle allNews={allNews} isDark={isDark} />
        </div>
      </div>
      {/* Gradient Background */}
      <div className={`absolute -top-50 -z-10 opacity-30 w-full h-full bg-gradient-to-b pointer-events-none ${
        isDark ? 'from-blue-900/20 to-transparent' : 'from-blue-100/50 to-transparent'
      }`}></div>
    </div>
  );
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Just now';

  const now = new Date();
  const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hrs ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

const Home = () => {
  const [newsByCategory, setNewsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchInputRef = useRef(null);
  const searchBarRef = useRef(null); // Add this near your other refs
  const { isDarkMode: isDark } = useTheme(); // Use only this for theme

  const observerRef = useRef();

  // Combine less common categories under "others"
  const mainCategories = [
    'technology',
    'top',
    'editors_pick', // <-- use the Firestore collection key, not "editor's Pick"
    'business',
    'sports',
    'world',
    'entertainment',
    'domestic'
  ];

  const otherCategories = [
    'health',
    'politics',
    'science',
    'education',
    'environment',
    'food',
    'lifestyle',
    'other',
    'tourism',
    'crime'
  ];

  // Only fetch "others" as a single category
  const categories = [
    ...mainCategories,
    'others'
  ];

  const ITEMS_PER_CATEGORY = 6;

  const allNews = Array.from(
    new Map(
      Object.values(newsByCategory)
        .flat()
        .map(article => [article.id, article])
    ).values()
  )
  .sort((a, b) => {
    const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
    const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
    return timeB - timeA;
  })
  .slice(0, 10); // Show only latest 10 news in ticker

  const fetchNews = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setNewsByCategory({});
      } else {
        setLoadingMore(true);
      }

      const promises = categories.map(async (category) => {
        // Special handling for "others" category
        if (category === 'others') {
          // Create an array of promises for all other categories
          const otherPromises = otherCategories.map(async (subCategory) => {
            const colRef = collection(db, `news_${subCategory}`);
            let q = query(
              colRef,
              orderBy('createdAt', 'desc'),
              limit(Math.ceil(ITEMS_PER_CATEGORY / otherCategories.length))
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              category: subCategory,
              docRef: doc
            }));
          });

          // Wait for all other category queries to complete
          const otherResults = await Promise.all(otherPromises);
          const combinedArticles = otherResults.flat().sort((a, b) => {
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return timeB - timeA;
          });

          return {
            category: 'others',
            articles: combinedArticles.slice(0, ITEMS_PER_CATEGORY),
            lastDoc: null // Since we're combining multiple collections, we'll skip pagination for others
          };
        }

        // Normal category handling
        const colRef = collection(db, `news_${category}`);
        let q;

        if (loadMore && lastVisible[category]) {
          q = query(
            colRef,
            orderBy('createdAt', 'desc'),
            startAfter(lastVisible[category]),
            limit(ITEMS_PER_CATEGORY)
          );
        } else {
          q = query(colRef, orderBy('createdAt', 'desc'), limit(ITEMS_PER_CATEGORY));
        }

        const snapshot = await getDocs(q);
        
        return {
          category,
          articles: snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            category,
            docRef: doc
          })),
          lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
        };
      });

      const results = await Promise.all(promises);
      const newLastVisible = {};
      const newNewsByCategory = loadMore ? { ...newsByCategory } : {};

      results.forEach(({ category, articles, lastDoc }) => {
        if (loadMore) {
          newNewsByCategory[category] = [
            ...(newNewsByCategory[category] || []),
            ...articles
          ];
        } else {
          newNewsByCategory[category] = articles;
        }

        if (lastDoc) {
          newLastVisible[category] = lastDoc;
        }
      });

      setNewsByCategory(newNewsByCategory);
      setLastVisible(newLastVisible);

      const hasMoreContent = results.some(({ articles }) => articles.length === ITEMS_PER_CATEGORY);
      setHasMore(hasMoreContent);

    } catch (error) {
      console.error('Error loading news:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const lastNewsElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchNews(true);
      }
    }, {
      threshold: 0.1,
      rootMargin: '200px'
    });

    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  useEffect(() => {
    fetchNews();
  }, []);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSearchOpen(!!value);
    if (value.length > 1) {
      const results = Object.values(newsByCategory)
        .flat()
        .filter(article =>
          article.title?.toLowerCase().includes(value.toLowerCase()) ||
          article.content?.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 10);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  // Optional: Open search drawer with "/" key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && !searchOpen) {
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
        e.preventDefault();
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchTerm('');
        setSearchResults([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Close search bar when clicking outside
  useEffect(() => {
    if (!searchOpen) return;
    function handleClickOutside(event) {
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
        setSearchTerm('');
        setSearchResults([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${
        isDark ? 'bg-slate-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className={`w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-5 ${
            isDark
              ? 'border-slate-700 border-t-blue-500'
              : 'border-gray-200 border-t-blue-500'
          }`}></div>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
            Loading news...
          </p>
        </div>
      </div>
    );
  }

  // When displaying category names, show a friendly label for editors_pick
  const getCategoryLabel = (cat) => {
    if (cat === 'editors_pick') return "Editor's Pick";
    if (cat === 'top') return 'Top';
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  return (
    <div className={`min-h-screen transition-colors ${
      isDark ? 'bg-slate-900' : 'bg-gray-200'
    }`}>
      
        <header className={`border-b py-3 sticky top-0 z-50 shadow-lg backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-slate-800/95 border-slate-700'
            : 'bg-white/95 border-gray-200'
        }`}>
          <div className="w-full px-2 sm:px-4 flex flex-col sm:flex-row justify-between items-center relative gap-3"> {/* Adjusted container */}
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
            
            {/* Search Bar - Modified for responsiveness */}
            <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-xl" ref={searchBarRef}>
              <div className="w-full relative">
                <div className={`flex items-center rounded-full px-4 py-2 shadow-inner focus-within:ring-2 ring-blue-400 transition-all
                  ${isDark ? 'bg-slate-700' : 'bg-gray-100'}
                  ${searchOpen ? 'rounded-b-none' : ''}
                  border border-transparent focus-within:border-blue-400
                `}>
                  <FaSearch className={`mr-3 text-lg ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="Search news... (Press / )"
                    className={`bg-transparent outline-none w-full text-base placeholder-gray-400 ${
                      isDark ? 'text-gray-100' : 'text-gray-700'
                    }`}
                  />
                  {searchTerm && (
                    <button
                      className={`ml-2 rounded-full p-1 hover:bg-gray-200 dark:hover:bg-slate-600 transition`}
                      onClick={() => {
                        setSearchTerm('');
                        setSearchResults([]);
                        searchInputRef.current?.focus();
                      }}
                      tabIndex={-1}
                      aria-label="Clear search"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Search Dropdown - Positioned directly under input */}
                {searchOpen && (
                  <>
                    {/* Backdrop overlay */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchTerm('');
                        setSearchResults([]);
                      }}
                    />

                    {/* Dropdown container */}
                    <div
                      className={`
                        absolute left-0 right-0 top-full
                        z-50
                        rounded-b-2xl rounded-t-none
                        border border-t-0
                        transition-all duration-200 ease-out
                        transform origin-top
                        ${isDark
                          ? 'bg-slate-800 border-slate-700 shadow-2xl'
                          : 'bg-white border-gray-200 shadow-xl'}
                        ${searchOpen
                          ? 'scale-y-100 opacity-100 translate-y-0'
                          : 'scale-y-0 opacity-0 -translate-y-2'}
                      `}
                      style={{
                        marginTop: '-2px',
                        boxShadow: isDark
                          ? '0 8px 32px 0 rgba(30,41,59,0.45)'
                          : '0 8px 32px 0 rgba(0,0,0,0.10)',
                      }}
                    >
                      {/* Search Results Content */}
                      <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {/* Empty state */}
                        {searchTerm && searchResults.length === 0 && (
                          <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-center py-10 px-4`}>
                            <FaSearch className="mx-auto mb-3 text-3xl opacity-40" />
                            <p className="text-base font-medium">No results found for <span className="font-semibold">{`"${searchTerm}"`}</span></p>
                          </div>
                        )}

                        {/* Default state when no search term */}
                        {!searchTerm && (
                          <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-center py-8 px-4`}>
                            <FaSearch className="mx-auto mb-3 text-3xl opacity-30" />
                            <p className="text-base">Start typing to search articles...</p>
                          </div>
                        )}

                        {/* Search Results */}
                        {searchResults.map((article, index) => (
                          <Link
                            key={article.id}
                            to={`/news/${article.category}/${article.id}`}
                            className={`
                              flex gap-3 items-center p-3 transition-all duration-150 no-underline text-inherit
                              border-b last:border-b-0
                              ${isDark
                                ? 'hover:bg-slate-700 border-slate-700 active:bg-slate-600'
                                : 'hover:bg-blue-50 border-gray-100 active:bg-blue-100'}
                              ${index === 0 ? 'rounded-t-none' : ''}
                              ${index === searchResults.length - 1 ? 'rounded-b-2xl' : ''}
                              group
                            `}
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchTerm('');
                              setSearchResults([]);
                            }}
                          >
                            {/* Article Image */}
                            <div className="flex-shrink-0">
                              <img
                                src={article.imageUrl || '/api/placeholder/60/40'}
                                alt={article.title}
                                className="w-14 h-10 object-cover rounded-md shadow-sm border border-gray-200 dark:border-slate-700"
                              />
                            </div>

                            {/* Article Content */}
                            <div className="flex-1 min-w-0">
                              <div className={`font-semibold text-base line-clamp-2 leading-tight mb-1
                                ${isDark ? 'text-gray-100 group-hover:text-yellow-200' : 'text-slate-800 group-hover:text-blue-700'}`}>
                                {article.title}
                              </div>
                              <div className={`text-xs flex items-center gap-2
                                ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                                  ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
                                  {article.category}
                                </span>
                                <span>•</span>
                                <span>{formatTimeAgo(article.createdAt)}</span>
                              </div>
                            </div>

                            {/* Chevron indicator */}
                            <div className={`flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'} group-hover:text-blue-500`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Footer with search tip */}
                      {searchResults.length > 0 && (
                        <div className={`px-3 py-2 text-xs border-t
                          ${isDark
                            ? 'bg-slate-900 text-gray-500 border-slate-700'
                            : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                          <span className="font-medium">Tip:</span> Press <kbd className="px-1 py-0.5 rounded bg-gray-200 text-gray-700 text-xs">Enter</kbd> to view all results
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

      {/* Main content wrapper with adjusted padding */}
      <div className="px-2 sm:px-4 w-full"> {/* Adjusted padding */}
        <Header allNews={allNews} />
        <div style={{ position: 'relative', zIndex: 40 }}>
          <NewsTicker allNews={allNews} />
        </div>

        {/* Trending News Section */}
        <section className={`border-b py-4 sm:py-6 transition-colors ${
          isDark
          ? 'bg-slate-800 border-slate-700'
          : 'bg-white border-gray-200'
        }`}>
          <div className="w-full px-2 sm:px-4">
            <h2 className={`text-3xl font-bold mb-6 pb-3 border-b-4 border-blue-500 ${
              isDark ? 'text-white' : 'text-slate-800'
            }`}>
              Trending News
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Featured Story - Use editors_pick category */}
              {newsByCategory['editors_pick']?.[0] && (
                <Link
                  to={`/news/${newsByCategory['editors_pick'][0].category}/${newsByCategory['editors_pick'][0].id}`}
                  className="no-underline text-inherit lg:col-span-2"
                >
                  <div className="relative rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-105 hover:shadow-2xl shadow-lg h-full flex flex-col">
                    <img
                      src={newsByCategory['editors_pick'][0].imageUrl || '/api/placeholder/600/400'}
                      alt={newsByCategory['editors_pick'][0].title}
                      className="w-full h-96 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-8">
                      <h3 className="text-3xl font-bold leading-tight mb-2 text-white">
                        {newsByCategory['editors_pick'][0].title}
                      </h3>
                      <div className="flex gap-4 items-center">
                        <span className="text-sm text-gray-300">
                          {formatTimeAgo(newsByCategory['editors_pick'][0].createdAt)}
                        </span>
                        <span className="text-sm bg-orange-500 px-3 py-1 rounded-full text-white font-medium">
                          Editor's Pick
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Trending Stories List - Use top category */}
              <div className="flex flex-col gap-4">
                {newsByCategory['top']?.slice(0, 3).map((article, index) => (
                  <Link
                    key={article.id}
                    to={`/news/${article.category}/${article.id}`}
                    className="no-underline text-inherit"
                  >
                    <div className={`flex gap-4 p-4 rounded-lg shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer items-center ${
                      isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'
                    }`}>
                      <img
                        src={article.imageUrl || '/api/placeholder/100/80'}
                        alt={article.title}
                        className="w-24 h-20 object-cover rounded-md flex-shrink-0 shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-base font-semibold leading-tight mb-2 line-clamp-2 ${
                          isDark ? 'text-white' : 'text-slate-800'
                        }`}>
                          {article.title}
                        </h4>
                        <div className="flex gap-2 items-center">
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                            {formatTimeAgo(article.createdAt)}
                          </span>
                          <span className="text-sm text-orange-500 font-medium">
                            Top Story
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Navigation */}
        <div className={`border-b transition-colors overflow-x-auto ${
          isDark
            ? 'bg-slate-800 border-slate-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="w-full px-2 sm:px-4"> {/* Adjusted container */}
     
          </div>
        </div>

        {/* Main Content */}
        <main className="w-full py-4 sm:py-6 px-2 sm:px-4"> {/* Adjusted container and spacing */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Content */}
            <div className="lg:col-span-2 min-w-0">
              {/* Featured News Grid - Improved responsive layout */}
              <section className="mb-8 sm:mb-15">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-8">
                  {/* Sidebar with smaller news */}
                        <div className="md:col-span-2 md:order-1 order-2">
                          {Object.entries(newsByCategory)[0] && Object.entries(newsByCategory)[0][1].slice(1, 6).map((article, index) => (
                            <Link
                              key={article.id}
                              to={`/news/${article.category}/${article.id}`}
                              className="no-underline text-inherit"
                            >
                              <div className={`flex gap-4 mb-6 p-4 rounded-lg border-b transition-all hover:-translate-y-1 cursor-pointer shadow-sm items-center ${
                                isDark
                                  ? 'border-slate-600 hover:bg-slate-700 hover:shadow-md'
                                  : 'border-gray-200 hover:bg-gray-50 hover:shadow-md'
                              }`}>
                                <img
                                  src={article.imageUrl || '/api/placeholder/80/60'}
                                  alt={article.title}
                                  className="w-20 h-15 object-cover rounded-md flex-shrink-0 shadow-sm"
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className={`m-0 mb-2 text-base font-semibold leading-tight line-clamp-2 ${
                                    isDark ? 'text-white' : 'text-slate-800'
                                  }`}>
                                    {article.title}
                                  </h4>
                                  <div className="flex gap-2 items-center flex-wrap">
                                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                                      {formatTimeAgo(article.createdAt)}
                                    </span>
                                    <span className="text-sm text-orange-500 font-medium capitalize">
                                      {article.category} 
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>

                  {/* Main Featured Article */}
                  {Object.entries(newsByCategory)[0] && Object.entries(newsByCategory)[0][1][0] && (
                    <Link
                      to={`/news/${Object.entries(newsByCategory)[0][1][0].category}/${Object.entries(newsByCategory)[0][1][0].id}`}
                      className="no-underline text-inherit md:col-span-3 md:order-2 order-1"
                    >
                      <article className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-2xl flex flex-col rounded-2xl">
                        <img
                          src={Object.entries(newsByCategory)[0][1][0].imageUrl || '/api/placeholder/600/400'}
                          alt={Object.entries(newsByCategory)[0][1][0].title}
                          className="w-full h-64 md:h-96 object-cover rounded-t-2xl mb-5 shadow-lg"
                        />
                        <h1 className={`text-3xl md:text-4xl font-bold leading-tight mb-4 ${
                          isDark ? 'text-white' : 'text-slate-800'
                        }`} style={{ marginLeft: '1rem' }}>
                          {Object.entries(newsByCategory)[0][1][0].title} 
                        </h1>
                        <div className="flex gap-4 items-center mb-4" style={{ marginLeft: '1rem' }}>
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                            {formatTimeAgo(Object.entries(newsByCategory)[0][1][0].createdAt)}
                          </span>
                          <span className="text-sm text-orange-500 font-medium capitalize">
                            {Object.entries(newsByCategory)[0][1][0].category}
                          </span>
                        </div>
                      </article>
                    </Link>
                  )}
                </div>
              </section>

              {/* Category Sections with improved spacing */}
              {Object.entries(newsByCategory).slice(1).map(([categoryName, articles]) => (
                <section key={categoryName} className="mb-8 sm:mb-12">
                  <div className={`flex justify-between items-center mb-6 pb-3 border-b-4 border-blue-500`}>
                    <h2 className={`text-2xl md:text-3xl font-bold m-0 capitalize ${
                      isDark ? 'text-white' : 'text-slate-800'
                    }`}>
                      {getCategoryLabel(categoryName)}
                    </h2>
                    <Link
                      to={`/categories?category=${categoryName}`}
                      className="text-blue-500 no-underline text-base font-semibold transition-all hover:text-blue-600 hover:scale-105"
                    >
                      View All »
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {articles.slice(0, 4).map((article, index) => (
                      <Link
                        key={article.id}
                        to={`/news/${article.category}/${article.id}`}
                        className="no-underline text-inherit"
                      >
                        <article className={`cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl rounded-lg overflow-hidden shadow-md flex flex-col h-full ${
                          isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-gray-50'
                        }`}>
                          <img
                            src={article.imageUrl || '/api/placeholder/280/180'}
                            alt={article.title}
                            className="w-full h-45 object-cover"
                          />
                          <div className="p-4 flex flex-col flex-1">
                            <h3 className={`text-lg font-semibold leading-tight mb-2 line-clamp-2 ${
                              isDark ? 'text-white' : 'text-slate-800'
                            }`}>
                              {article.title}
                            </h3>
                            <div className="flex gap-2 items-center mt-auto">
                              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                                {formatTimeAgo(article.createdAt)}
                              </span>
                              <span className="text-sm text-orange-500 font-medium capitalize">
                                {article.category}
                              </span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}

              {/* Load More Trigger */}
              {/* <div ref={lastNewsElementRef} className="h-5"></div> */}

              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="text-center py-10">
                  <div className={`w-10 h-10 border-4 rounded-full animate-spin mx-auto mb-4 ${
                    isDark
                      ? 'border-slate-700 border-t-blue-500'
                      : 'border-gray-200 border-t-blue-500'
                  }`}></div>
                  <p className={`text-base ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                    Loading more news...
                  </p>
                </div>
              )}

              {!hasMore && Object.keys(newsByCategory).length > 0 && (
                <div className="text-center py-10">
                  <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                    You've reached the end! No more news to load.
                  </p>
                </div>
              )}
            </div>

            {/* Right Sidebar - Hide on mobile */}
            <div className="hidden lg:block min-w-0">
              {/* Trending section */}
              <div className={`rounded-xl p-6 shadow-lg sticky top-24 transition-colors ${
                isDark ? 'bg-slate-800' : 'bg-white border border-gray-200'
              }`}>
                <h3 className={`text-xl font-bold mb-5 pb-3 border-b-2 border-blue-500 ${
                  isDark ? 'text-white' : 'text-slate-800'
                }`}>
                  Trending Now
                </h3>

                {/* Trending news items */}
                {Object.values(newsByCategory).flat().slice(0, 6).map((article, index) => (
                  <Link
                    key={`trending-${article.id}`}
                    to={`/news/${article.category}/${article.id}`}
                    className="no-underline text-inherit"
                  >
                    <div className={`py-4 transition-all rounded-md hover:scale-105 flex items-center ${
                      isDark ? 'hover:bg-slate-700 hover:px-2' : 'hover:bg-gray-50 hover:px-2'
                    } ${index < 5 ? (isDark ? 'border-b border-slate-600' : 'border-b border-gray-200') : ''}`}>
                      <div className="flex items-start gap-3 w-full">
                        <span className="text-xl font-bold text-blue-500 min-w-6">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-base font-semibold leading-tight mb-2 line-clamp-2 ${
                            isDark ? 'text-white' : 'text-slate-800'
                          }`}>
                            {article.title}
                          </h4>
                          <div className="flex gap-2 items-center">
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                              {formatTimeAgo(article.createdAt)}
                            </span>
                            <span className="text-sm text-orange-500 font-medium capitalize">
                              {article.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>
    </div></div>
  );
};

export default Home;
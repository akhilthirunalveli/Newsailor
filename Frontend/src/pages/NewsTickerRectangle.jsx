import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const ANIMATION_DURATION = 600; // ms

const NewsTickerRectangle = ({ allNews, isDark }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeState, setFadeState] = useState('fade-in');

  useEffect(() => {
    if (!allNews || allNews.length === 0) return;
    const interval = setInterval(() => {
      setFadeState('fade-out');
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % allNews.length);
        setFadeState('fade-in');
      }, ANIMATION_DURATION);
    }, 5000);
    return () => clearInterval(interval);
  }, [allNews]);

  if (!allNews || allNews.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center rounded-2xl bg-gray-200 dark:bg-slate-800 shadow-lg">
        <span className="text-lg text-gray-500 dark:text-gray-300">Loading breaking news...</span>
      </div>
    );
  }

  const currentNews = allNews[currentIndex];

  return (
    <div
      className={`
        w-full max-w-xl mx-auto h-68 rounded-2xl shadow-3xl overflow-hidden relative flex items-end
        ${isDark ? 'bg-slate-900' : 'bg-white'}
      `}
      style={{
        background: currentNews.imageUrl
          ? `url(${currentNews.imageUrl}) center center / cover no-repeat`
          : undefined,
        position: 'relative',
      }}
    >
      {/* Blur overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      ></div>
      {/* News content with animation */}
      <Link
        to={`/news/${currentNews.category}/${currentNews.id}`}
        className={`relative z-10 w-full h-full flex flex-col justify-end p-8 no-underline transition-all duration-700 ${fadeState}`}
        style={{ color: 'inherit' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center px-3 py-1 text-white text-xs font-bold rounded bg-red-600 animate-pulse shadow">
            LIVE
          </span>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${isDark ? 'bg-slate-800 text-blue-300' : 'bg-gray-900 text-blue-200'}`}>
            {currentNews.category}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold leading-tight mb-2 text-white drop-shadow-lg line-clamp-2">
          {currentNews.title}
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-200">{formatTimeAgo(currentNews.createdAt)}</span>
        </div>
      </Link>
      {/* Animation styles */}
      <style>
        {`
          .fade-in {
            opacity: 1;
            transform: translateY(0);
            transition: opacity ${ANIMATION_DURATION}ms, transform ${ANIMATION_DURATION}ms;
          }
          .fade-out {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity ${ANIMATION_DURATION}ms, transform ${ANIMATION_DURATION}ms;
          }
        `}
      </style>
    </div>
  );
};

// Helper function (copy from Home.jsx or import)
function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Just now';
  const now = new Date();
  const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hrs ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

export default NewsTickerRectangle;
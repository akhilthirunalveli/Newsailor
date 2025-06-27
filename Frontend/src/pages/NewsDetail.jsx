// pages/NewsDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../context/ThemeContext'; // Import theme context

const NewsDetail = () => {
  const { category, id } = useParams(); // Read both category and id from URL
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDarkMode: isDark } = useTheme(); // Use global theme

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);

        // Fetch from correct Firestore collection based on category
        const docRef = doc(db, `news_${category}`, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setNews(docSnap.data());
        } else {
          setNews(null);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        setNews(null);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [category, id]);

  const bgClass = isDark ? 'bg-slate-900' : 'bg-white';
  const textClass = isDark ? 'text-gray-100' : 'text-gray-900';
  const proseClass = isDark ? 'prose-invert' : '';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const linkClass = isDark
    ? 'text-blue-300 hover:text-blue-400'
    : 'text-blue-600 hover:text-blue-700';

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} ${textClass}`}>
        <p className="p-5">Loading...</p>
      </div>
    );
  }

  if (!news) {
    return (
      <div className={`min-h-screen ${bgClass} ${textClass}`}>
        <p className="p-5">News not found.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} ${textClass}`}>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          to="/" 
          className={`inline-flex items-center text-lg font-medium ${linkClass} transition-colors hover:underline`}
        >
          ← Back to Home
        </Link>
        
        <h1 className={`text-3xl md:text-4xl font-bold mt-6 mb-6 leading-tight ${textClass}`}>
          {news.title}
        </h1>
        
        {news.imageUrl && (
          <img
            src={news.imageUrl}
            alt={news.title}
            className="w-full max-h-96 object-cover rounded-lg shadow-lg mb-8"
          />
        )}
        
        <div className={`prose prose-lg max-w-none ${proseClass}`}>
          <p className="whitespace-pre-wrap leading-relaxed text-lg">
            {news.description}
          </p>
          <Link
            to={news.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-block mt-4 text-lg font-semibold ${linkClass} transition duration-300 hover:underline`}
          > 
            Read More 
          </Link>
          {news.source && (
            <p className="mt-2 text-sm text-gray-500">
              Source: {news.source}
            </p>
          )}
        </div>
        
        {category && (
          <div className={`mt-8 pt-4 border-t ${borderClass}`}>
            <p className="italic text-gray-500">
              Category: {category.charAt(0).toUpperCase() + category.slice(1)}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default NewsDetail;
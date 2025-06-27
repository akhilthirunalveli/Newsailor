// components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const [isCollapsed, setIsCollapsed] = useState(true); // Changed to true (closed by default)
  const { isDarkMode, setIsDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef(null);

  // Auto-collapse when clicking outside navbar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target) && !isCollapsed) {
        setIsCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCollapsed]);

  const toggleNavbar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
    // You can add your mapping logic here later
    console.log('Theme toggled:', !isDarkMode ? 'dark' : 'light');
  };

  // Handle category navigation
  const handleCategoryClick = (category) => {
    navigate('/categories', { 
      state: { selectedCategory: category } 
    });
  };

  // Add this new function
  const handleNavigation = (path) => {
    if (location.pathname === path) {
      // If already on the same page, scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Navigate to the new path
      navigate(path);
    }
  };

  const navigationItems = [
    {
      icon: '🏠',
      label: 'Home',
      path: '/',
      active: location.pathname === '/'
    },
    {
      icon: '📰',
      label: 'Categories',
      path: '/categories',
      active: location.pathname.includes('/categories')
    },
    {
      icon: '🌍',
      label: 'World',
      category: 'World',
      active: location.pathname.includes('/categories') && location.state?.selectedCategory === 'World'
    },
    {
      icon: '🏛️',
      label: 'Politics',
      category: 'Politics',
      active: location.pathname.includes('/categories') && location.state?.selectedCategory === 'Politics'
    },
    {
      icon: '⚽',
      label: 'Sports',
      category: 'Sports',
      active: location.pathname.includes('/categories') && location.state?.selectedCategory === 'Sports'
    },
    {
      icon: '💻',
      label: 'Technology',
      category: 'Technology',
      active: location.pathname.includes('/categories') && location.state?.selectedCategory === 'Technology'
    },
    {
      icon: '💼',
      label: 'Business',
      category: 'Business',
      active: location.pathname.includes('/categories') && location.state?.selectedCategory === 'Business'
    },
    {
      icon: '🏥',
      label: 'Health',
      category: 'Health',
      active: location.pathname.includes('/categories') && location.state?.selectedCategory === 'Health'
    },
    {
      icon: '🎬',
      label: 'Entertainment',
      category: 'Entertainment',
      active: location.pathname.includes('/categories') && location.state?.selectedCategory === 'Entertainment'
    }
  ];

  const mobileNavigationItems = [
    {
      icon: '🏠',
      label: 'Home',
      path: '/',
      active: location.pathname === '/'
    },
    {
      icon: '📰',
      label: 'Categories',
      path: '/categories',
      active: location.pathname.includes('/categories')
    }
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <nav
        ref={navRef}
        className={`
          hidden md:flex fixed bottom-0 left-0 right-0 z-[1000]
          ${isDarkMode 
            ? 'bg-gray-800/95 border-t border-gray-700' 
            : 'bg-white/95 border-t border-gray-200'
          }
          backdrop-blur-lg transition-all duration-300 ease-in-out h-14
        `}
        style={{
          boxShadow: isDarkMode 
            ? '0 -4px 20px rgba(30, 58, 138, 0.2)'
            : '0 -4px 20px rgba(148, 163, 184, 0.1)'
        }}
      >
        {/* Navigation Items */}
        <div className="flex items-center justify-center w-full px-2 gap-1">
          {navigationItems.map((item, index) => {
            // For items with category, use button with navigation handler
            if (item.category) {
              return (
                <button
                  key={index}
                  onClick={() => handleCategoryClick(item.category)}
                  className={`
                    group flex items-center px-3 h-full min-w-[80px]
                    transition-all duration-200
                    ${item.active 
                      ? isDarkMode
                        ? 'text-blue-400 bg-gray-700/50' 
                        : 'text-blue-600 bg-gray-100'
                      : isDarkMode
                        ? 'text-gray-300 hover:text-white hover:bg-gray-700/30'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="text-xl transition-transform duration-200 group-hover:scale-110 mr-2">
                    {item.icon}
                  </span>
                  <span className="text-xs font-medium">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={index}
                to={item.path}
                className={`
                  group flex items-center px-3 h-full min-w-[80px]
                  transition-all duration-200 no-underline
                  ${item.active 
                    ? isDarkMode
                      ? 'text-blue-400 bg-gray-700/50' 
                      : 'text-blue-600 bg-gray-100'
                    : isDarkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700/30'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
              >
                <span className="text-xl transition-transform duration-200 group-hover:scale-110 mr-2">
                  {item.icon}
                </span>
                <span className="text-xs font-medium">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`
              group flex items-center px-3 h-full min-w-[80px]
              transition-all duration-200
              ${isDarkMode
                ? 'text-yellow-400 hover:bg-gray-700/30'
                : 'text-orange-500 hover:bg-gray-100'}
            `}
          >
            <span className="text-xl transition-transform duration-200 group-hover:scale-110 mr-2">
              {isDarkMode ? '🌙' : '☀️'}
            </span>
            <span className="text-xs font-medium">
              Theme
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Dock */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[250px]">
        <div className={`
          backdrop-blur-lg rounded-full shadow-lg border
          transition-colors duration-300
          ${isDarkMode 
            ? 'bg-gray-800/90 border-gray-700/50 shadow-black/20' 
            : 'bg-white/90 border-gray-200 shadow-gray-300/20'
          }
        `}>
          <div className="flex items-center justify-around px-2 py-1.5">
            {mobileNavigationItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleNavigation(item.path)}
                className={`
                  flex flex-col items-center p-2 rounded-full no-underline
                  transition-all duration-200 min-w-[60px]
                  ${item.active 
                    ? isDarkMode
                      ? 'text-blue-400 bg-gray-700/50'
                      : 'text-blue-600 bg-gray-100/70'
                    : isDarkMode
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700/30'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                  }
                `}
              >
                <span className="text-lg mb-0.5">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}
            
            {/* Theme Toggle for Mobile */}
            <button
              onClick={toggleTheme}
              className={`
                flex flex-col items-center p-2 rounded-full min-w-[60px]
                transition-all duration-200
                ${isDarkMode
                  ? 'text-yellow-400 hover:bg-gray-700/30'
                  : 'text-orange-500 hover:bg-gray-100/50'}
              `}
            >
              <span className="text-lg mb-0.5">{isDarkMode ? '🌙' : '☀️'}</span>
              <span className="text-[10px] font-medium">Theme</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {!isCollapsed && typeof window !== 'undefined' && window.innerWidth <= 768 && (
        <div
          onClick={toggleNavbar}
          className="fixed inset-0 bg-gray-800/50 z-[999] md:hidden"
        />
      )}

      {/* Custom scrollbar styles */}
      <style>{`
        /* Custom scrollbar for webkit browsers */
        nav div::-webkit-scrollbar {
          width: 4px;
        }
        
        nav div::-webkit-scrollbar-track {
          background: rgba(30, 58, 138, 0.3);
        }
        
        nav div::-webkit-scrollbar-thumb {
          background: rgba(96, 165, 250, 0.6);
          border-radius: 2px;
        }
        
        nav div::-webkit-scrollbar-thumb:hover {
          background: rgba(96, 165, 250, 0.8);
        }
      `}</style>
    </>
  );
};

// Layout wrapper component
export const NavbarLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full pb-14">
      <Navbar />
      <div className="w-full" style={{ backgroundColor: '#c9e0f5' }}>
        {children}
      </div>
    </div>
  );
};

export default Navbar;
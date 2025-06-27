// App.jsx
import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import NewsDetail from './pages/NewsDetail';
import Admin from './pages/Admin';
import Categories from './pages/Categories';


function App() {
  // Main theme state here
  const [isDark, setIsDark] = useState(() => {
    // Optional: persist theme in localStorage
    const stored = localStorage.getItem('theme');
    return stored ? stored === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark); // for Tailwind dark mode
  }, [isDark]);

  return (
    <ThemeProvider>
      <Navbar isDark={isDark} setIsDark={setIsDark} />
      <Routes>
        <Route path="/" element={<Home isDark={isDark} setIsDark={setIsDark} />} />
        <Route path="/categories" element={<Categories isDark={isDark} setIsDark={setIsDark} />} />
        <Route path="/news/:category/:id" element={<NewsDetail isDark={isDark} setIsDark={setIsDark} />} />
        <Route path="/admin" element={<Admin isDark={isDark} setIsDark={setIsDark} />} />
      </Routes>
      <Footer isDark={isDark} />
    </ThemeProvider>
  );
}

export default App;
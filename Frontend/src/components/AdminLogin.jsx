import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Link } from 'react-router-dom'; // Add this import

const AdminLogin = ({ theme, isDark }) => { // Add isDark prop
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError('Failed to log in. Please check your credentials.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      {/* Add header */}
      <div className="w-full px-2 sm:px-4 py-4 flex flex-col sm:flex-row justify-between items-center relative gap-3">
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
      </div>

      {/* Existing login form content */}
      <div className="flex items-center justify-center p-6">
        <div className={`${theme.cardBg} ${theme.border} border rounded-xl p-8 shadow-lg max-w-md w-full`}>
          <h1 className={`text-2xl font-bold ${theme.text} mb-6 text-center`}>
            Admin Login
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${theme.input} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
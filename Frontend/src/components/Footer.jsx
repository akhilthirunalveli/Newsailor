import React from "react";
import { Anchor, Compass, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ArrowUp, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext'; // Import the theme context

const Footer = () => {
  const { isDarkMode: isDark } = useTheme(); // Use global theme

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer className={`relative z-10 hidden lg:block pb-3 pt-1 lg:pb-3 lg:pt-8 ${
        isDark ? 'bg-slate-900' : 'bg-white'
      }`}>
        <div className="container mx-auto px-4">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4 sm:w-2/3 lg:w-3/12">
              <div className="mb-3 w-full">
                <a href="/#" className="mb-6 inline-block">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Anchor className={`h-10 w-10 transform rotate-12 ${
                        isDark ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping ${
                        isDark ? 'bg-yellow-400' : 'bg-yellow-500'
                      }`}></div>
                    </div>
                    <div className="px-6">
                      <h1
                        className="text-3xl font-bold text-blue-500 m-0 hover:text-blue-600 transition-colors"
                        style={{ fontFamily: 'CS Bristol, cursive, sans-serif' }}
                      >
                        NewsSailor
                      </h1>
                      <p className={`text-xs ${
                        isDark ? 'text-blue-300' : 'text-blue-600'
                      }`}>Navigate the seas of information</p>
                    </div>
                  </div>
                </a>
              </div>
            </div>

            <LinkGroup header="Navigation" isDark={isDark}>
              <NavLink link="/#" label="Home" isDark={isDark} />
              <NavLink link="/#" label="Latest News" isDark={isDark} />
              <NavLink link="/#" label="Categories" isDark={isDark} />
              <NavLink link="/#" label="Breaking News" isDark={isDark} />
            </LinkGroup>
            
            <LinkGroup header="News Deck" isDark={isDark}>
              <NavLink link="/#" label="Politics" isDark={isDark} />
              <NavLink link="/#" label="Technology" isDark={isDark} />
              <NavLink link="/#" label="Sports" isDark={isDark} />
              <NavLink link="/#" label="Entertainment" isDark={isDark} />
            </LinkGroup>
            
            <LinkGroup header="Harbor Links" isDark={isDark}>
              <NavLink link="/#" label="About NewsSailor" isDark={isDark} />
              <NavLink link="/#" label="Contact Harbor" isDark={isDark} />
              <NavLink link="/#" label="News Archive" isDark={isDark} />
              <NavLink link="/#" label="Subscribe" isDark={isDark} />
            </LinkGroup>

            <div className="w-full px-4 sm:w-1/2 lg:w-3/12">
              <div className="mb-6 w-full">
                <h4 className={`mb-4 text-lg font-semibold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Contact Harbor
                </h4>
                
                {/* Contact Info */}
                <div className="mb-6 space-y-3">
                  <div className={`flex items-center text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    <Mail className={`h-4 w-4 mr-3 ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <span>news@newssailor.com</span>
                  </div>
                  <div className={`flex items-center text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    <Phone className={`h-4 w-4 mr-3 ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <span>+1 (555) 123-NEWS</span>
                  </div>
                  <div className={`flex items-center text-sm ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    <MapPin className={`h-4 w-4 mr-3 ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <span>123 Harbor Street, News Port, NY</span>
                  </div>
                </div>

                {/* Social Media */}
                <h5 className={`mb-4 text-md font-medium ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Follow Our Voyage
                </h5>
                <div className="mb-6 flex items-center">
                  <a
                    href="#"
                    className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 ${
                      isDark 
                        ? 'border-gray-600 text-gray-300 hover:border-blue-400 hover:bg-blue-400 hover:text-white' 
                        : 'border-gray-300 text-gray-700 hover:border-blue-600 hover:bg-blue-600 hover:text-white'
                    } sm:mr-4 lg:mr-3 xl:mr-4`}
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                  <a
                    href="#"
                    className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 ${
                      isDark 
                        ? 'border-gray-600 text-gray-300 hover:border-sky-400 hover:bg-sky-400 hover:text-white' 
                        : 'border-gray-300 text-gray-700 hover:border-sky-500 hover:bg-sky-500 hover:text-white'
                    } sm:mr-4 lg:mr-3 xl:mr-4`}
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                  <a
                    href="#"
                    className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 ${
                      isDark 
                        ? 'border-gray-600 text-gray-300 hover:border-pink-400 hover:bg-pink-400 hover:text-white' 
                        : 'border-gray-300 text-gray-700 hover:border-pink-500 hover:bg-pink-500 hover:text-white'
                    } sm:mr-4 lg:mr-3 xl:mr-4`}
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                  <a
                    href="#"
                    className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 ${
                      isDark 
                        ? 'border-gray-600 text-gray-300 hover:border-blue-500 hover:bg-blue-500 hover:text-white' 
                        : 'border-gray-300 text-gray-700 hover:border-blue-700 hover:bg-blue-700 hover:text-white'
                    } sm:mr-4 lg:mr-3 xl:mr-4`}
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                </div>
                
                {/* Theme Toggle Button - removed, now controlled globally */}
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    &copy; 2025 NewsSailor
                  </p>
                  <button
                    onClick={scrollToTop}
                    className={`px-3 py-2 rounded-lg transition-all duration-300 ${
                      isDark
                        ? 'bg-blue-600 text-yellow-400 hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Back to top"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Background decorations */}
        
      </footer>
    </>
  );
};

export default Footer;

const LinkGroup = ({ children, header, isDark }) => {
  return (
    <>
      <div className="w-full px-4 sm:w-1/2 lg:w-2/12">
        <div className="mb-6 w-full">
          <h4 className={`mb-5 text-lg font-semibold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {header}
          </h4>
          <ul className="space-y-3">{children}</ul>
        </div>
      </div>
    </>
  );
};

const NavLink = ({ link, label, isDark }) => {
  return (
    <li>
      <a
        href={link}
        className={`inline-block text-base leading-loose transition-colors duration-300 ${
          isDark 
            ? 'text-gray-300 hover:text-blue-400' 
            : 'text-gray-600 hover:text-blue-600'
        }`}
      >
        {label}
      </a>
    </li>
  );
};
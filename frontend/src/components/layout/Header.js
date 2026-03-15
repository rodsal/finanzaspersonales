import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
<<<<<<< Updated upstream
import useScrollPosition from '../../hooks/useScrollPosition';

const Header = () => {
  const location = useLocation();
  const { isScrolled } = useScrollPosition();
=======
import { useAuth } from '../../contexts/AuthContext';

const NAV_ICONS = {
  '/': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  '/expenses': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  '/income': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  '/summary': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  '/viajes': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
};

const Header = () => {
  const location = useLocation();
  const { user, avatar } = useAuth();
>>>>>>> Stashed changes
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { path: '/', label: 'Inicio' },
    { path: '/expenses', label: 'Gastos' },
    { path: '/income', label: 'Ingresos' },
    { path: '/summary', label: 'Resumen' },
<<<<<<< Updated upstream
    { path: '/settings', label: 'Configuración' },
=======
    { path: '/viajes', label: 'Viajes' },
>>>>>>> Stashed changes
  ];

  return (
    <header
      className={`bg-white shadow-md fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'py-2' : 'py-6'
      }`}
    >
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3" onClick={closeMobileMenu}>
            <div
              className={`bg-primary-600 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isScrolled ? 'w-10 h-10' : 'w-14 h-14'
              }`}
            >
              <span
                className={`text-white font-bold transition-all duration-300 ${
                  isScrolled ? 'text-xl' : 'text-2xl'
                }`}
              >
                ₡
              </span>
            </div>
            <span
              className={`font-heading font-bold text-gray-800 transition-all duration-300 ${
                isScrolled ? 'text-xl' : 'text-2xl'
              }`}
            >
              Finanzas Personales
            </span>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`font-medium transition-all duration-200 ${
                    isScrolled ? 'text-base' : 'text-lg'
                  } ${
                    isActive(link.path)
                      ? 'text-primary-600'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

<<<<<<< Updated upstream
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
=======
          {/* Profile + Mobile button */}
          <div className="flex items-center gap-2">
            {user && (
              <Link
                to="/profile"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/profile')
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {avatar
                    ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-primary-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                  }
                </div>
                <span className="hidden sm:block">{user.name.split(' ')[0]}</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
>>>>>>> Stashed changes
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
<<<<<<< Updated upstream
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200">
            <ul className="space-y-2 pt-4">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    onClick={closeMobileMenu}
                    className={`block px-4 py-2 rounded-lg font-medium transition-colors ${
                      isActive(link.path)
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
=======
          <div className="md:hidden border-t border-gray-100 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {NAV_ICONS[link.path]}
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                to="/profile"
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium border-t border-gray-100 transition-colors ${
                  isActive('/profile')
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden">
                  {avatar
                    ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-primary-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                  }
                </div>
                Mi Perfil
              </Link>
            )}
>>>>>>> Stashed changes
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;

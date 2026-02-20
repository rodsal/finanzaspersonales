import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useScrollPosition from '../../hooks/useScrollPosition';

const Header = () => {
  const location = useLocation();
  const { isScrolled } = useScrollPosition();
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
    { path: '/settings', label: 'Configuración' },
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
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;

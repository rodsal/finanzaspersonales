import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Layout components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './pages/HomePage';
import ExpensesPage from './pages/ExpensesPage';
import SummaryPage from './pages/SummaryPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />

        <main className="flex-grow container mx-auto px-4 pt-8" style={{ marginTop: '150px', paddingBottom: '150px' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/summary" element={<SummaryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>

        <Footer />

        {/* Toast notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </Router>
  );
}

export default App;

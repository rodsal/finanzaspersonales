import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

<<<<<<< Updated upstream
// Layout components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages
=======
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/layout/Sidebar';

>>>>>>> Stashed changes
import HomePage from './pages/HomePage';
import ExpensesPage from './pages/ExpensesPage';
import SummaryPage from './pages/SummaryPage';
import SettingsPage from './pages/SettingsPage';
import IncomePage from './pages/IncomePage';
import TripsPage from './pages/TripsPage';
import TripDetailPage from './pages/TripDetailPage';

function App() {
  return (
<<<<<<< Updated upstream
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />

        <main className="flex-grow container mx-auto px-4 pt-8" style={{ marginTop: '150px', paddingBottom: '150px' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/income" element={<IncomePage />} />
            <Route path="/summary" element={<SummaryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>

        <Footer />

        {/* Toast notifications */}
=======
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <main className="flex-1 ml-64 overflow-y-auto">
                  <div className="p-6 min-h-full">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/expenses" element={<ExpensesPage />} />
                      <Route path="/income" element={<IncomePage />} />
                      <Route path="/summary" element={<SummaryPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/viajes" element={<TripsPage />} />
                      <Route path="/viajes/:id" element={<TripDetailPage />} />
                    </Routes>
                  </div>
                </main>
              </div>
            </ProtectedRoute>
          } />
        </Routes>

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      </div>
    </Router>
=======
      </Router>
    </AuthProvider>
>>>>>>> Stashed changes
  );
}

export default App;
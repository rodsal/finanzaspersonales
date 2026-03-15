import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import CategoryManager from '../components/settings/CategoryManager';
import CurrencySettings from '../components/settings/CurrencySettings';
import MaxSpendManager from '../components/settings/MaxSpendManager';

const ProfilePage = () => {
  const { user, avatar, logout, updateAvatar } = useAuth();
  const fileInputRef = useRef(null);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateAvatar(ev.target.result);
      toast.success('Foto de perfil actualizada');
    };
    reader.readAsDataURL(file);
  };
  const [activeTab, setActiveTab] = useState('currency');

  const tabs = [
    { id: 'currency', name: 'Moneda', icon: '₡' },
    { id: 'categories', name: 'Categorias', icon: '📂' },
    { id: 'maxspend', name: 'Limites de Gasto', icon: '📊' },
  ];

  const createdDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('es-CR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="max-w-6xl mx-auto">
      {/* User Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div
              onClick={handleAvatarClick}
              className="w-16 h-16 rounded-full overflow-hidden cursor-pointer relative group"
              title="Cambiar foto de perfil"
            >
              {avatar
                ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-primary-600 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
              }
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-medium">Cambiar</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div>
              <h1 className="text-2xl font-heading font-bold text-gray-900">
                {user?.name}
              </h1>
              <p className="text-gray-500">{user?.email}</p>
              {createdDate && (
                <p className="text-sm text-gray-400 mt-1">
                  Miembro desde {createdDate}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium hidden sm:inline">Cerrar sesion</span>
          </button>
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">
          Configuracion
        </h2>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="fade-in">
          {activeTab === 'currency' && <CurrencySettings />}
          {activeTab === 'categories' && <CategoryManager />}
          {activeTab === 'maxspend' && <MaxSpendManager />}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

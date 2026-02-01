import React, { useState } from 'react';
import CategoryManager from '../components/settings/CategoryManager';
import CurrencySettings from '../components/settings/CurrencySettings';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('currency');

  const tabs = [
    { id: 'currency', name: 'Moneda' },
    { id: 'categories', name: 'Categorías' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
          Configuración
        </h1>
        <p className="text-gray-600">
          Personaliza tu experiencia de gestión financiera
        </p>
      </div>

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
      </div>
    </div>
  );
};

export default SettingsPage;

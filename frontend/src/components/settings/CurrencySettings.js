import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const CurrencySettings = () => {
  const [currency, setCurrency] = useState('CRC');
  const [exchangeRate, setExchangeRate] = useState(540); // Tipo de cambio por defecto
  const [isEditing, setIsEditing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Cargar configuración desde localStorage
    const savedCurrency = localStorage.getItem('currency') || 'CRC';
    const savedRate = parseFloat(localStorage.getItem('exchangeRate')) || 540;
    const savedLastUpdate = localStorage.getItem('exchangeRateLastUpdate');

    setCurrency(savedCurrency);
    setExchangeRate(savedRate);
    if (savedLastUpdate) {
      setLastUpdate(new Date(savedLastUpdate));
    }
  }, []);

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('currency', newCurrency);
    toast.success(`Moneda cambiada a ${newCurrency === 'CRC' ? 'Colones' : 'Dólares'}`);

    // Disparar evento personalizado para notificar a otros componentes
    window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency: newCurrency } }));
  };

  const handleExchangeRateChange = (e) => {
    const value = parseFloat(e.target.value);
    if (value > 0) {
      setExchangeRate(value);
    }
  };

  const handleSaveExchangeRate = () => {
    const now = new Date();
    localStorage.setItem('exchangeRate', exchangeRate.toString());
    localStorage.setItem('exchangeRateLastUpdate', now.toISOString());
    setLastUpdate(now);
    setIsEditing(false);
    toast.success('Tipo de cambio actualizado');

    // Disparar evento para actualizar otros componentes
    window.dispatchEvent(new CustomEvent('exchangeRateChanged', { detail: { rate: exchangeRate } }));
  };

  const fetchExchangeRate = async () => {
    setIsFetching(true);
    try {
      // Usar API gratuita de exchangerate-api.com
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');

      if (!response.ok) {
        throw new Error('Error al obtener tipo de cambio');
      }

      const data = await response.json();
      const crcRate = data.rates.CRC;

      if (crcRate && crcRate > 0) {
        setExchangeRate(crcRate);
        const now = new Date();
        localStorage.setItem('exchangeRate', crcRate.toString());
        localStorage.setItem('exchangeRateLastUpdate', now.toISOString());
        setLastUpdate(now);
        toast.success(`Tipo de cambio actualizado: ₡${crcRate.toFixed(2)}`);

        // Disparar evento para actualizar otros componentes
        window.dispatchEvent(new CustomEvent('exchangeRateChanged', { detail: { rate: crcRate } }));
      } else {
        throw new Error('Tipo de cambio no válido');
      }
    } catch (error) {
      console.error('Error al obtener tipo de cambio:', error);
      toast.error('No se pudo obtener el tipo de cambio actual. Intenta más tarde.');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Configuración de Moneda</h3>

      {/* Selector de moneda */}
      <div className="card">
        <h4 className="font-medium text-gray-900 mb-4">Moneda de Visualización</h4>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleCurrencyChange('CRC')}
            className={`p-4 rounded-lg border-2 transition-all ${
              currency === 'CRC'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">₡</div>
              <div className="font-semibold text-gray-900">Colones (CRC)</div>
              <div className="text-sm text-gray-600 mt-1">Moneda local</div>
            </div>
          </button>

          <button
            onClick={() => handleCurrencyChange('USD')}
            className={`p-4 rounded-lg border-2 transition-all ${
              currency === 'USD'
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">$</div>
              <div className="font-semibold text-gray-900">Dólares (USD)</div>
              <div className="text-sm text-gray-600 mt-1">Divisa extranjera</div>
            </div>
          </button>
        </div>
      </div>

      {/* Tipo de cambio */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-medium text-gray-900">Tipo de Cambio</h4>
            {lastUpdate && (
              <p className="text-xs text-gray-500 mt-1">
                Última actualización: {lastUpdate.toLocaleDateString('es-CR')} {lastUpdate.toLocaleTimeString('es-CR')}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={fetchExchangeRate}
                  disabled={isFetching}
                  className="btn btn-primary text-sm"
                  title="Actualizar desde API"
                >
                  {isFetching ? 'Actualizando...' : 'Actualizar'}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary text-sm"
                >
                  Manual
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="form-label">1 USD = ? CRC</label>
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={handleExchangeRateChange}
                  className="form-input"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveExchangeRate}
                  className="btn btn-primary text-sm"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                ₡{exchangeRate.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">por cada dólar (USD)</div>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-blue-600">ℹ️</span>
            <div className="text-sm text-blue-900">
              <p className="font-medium">¿Cómo funciona?</p>
              <p className="mt-1 text-blue-700">
                Todos los gastos se guardan en colones. Si seleccionas dólares como moneda de visualización,
                se convertirán automáticamente usando este tipo de cambio.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vista previa */}
      <div className="card bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200">
        <h4 className="font-medium text-gray-900 mb-3">Vista Previa</h4>

        <div className="space-y-2">
          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
            <span className="text-gray-700">Gasto de ejemplo:</span>
            <span className="font-bold text-gray-900">₡10,000</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
            <span className="text-gray-700">Se mostrará como:</span>
            <span className="font-bold text-primary-600">
              {currency === 'CRC'
                ? '₡10,000'
                : `$${(10000 / exchangeRate).toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencySettings;

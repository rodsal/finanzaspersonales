import { useState, useEffect } from 'react';

const useCurrency = () => {
  const [currency, setCurrency] = useState('CRC');
  const [exchangeRate, setExchangeRate] = useState(540);

  useEffect(() => {
    // Cargar configuración inicial
    const savedCurrency = localStorage.getItem('currency') || 'CRC';
    const savedRate = parseFloat(localStorage.getItem('exchangeRate')) || 540;

    setCurrency(savedCurrency);
    setExchangeRate(savedRate);

    // Escuchar cambios de moneda
    const handleCurrencyChange = (event) => {
      setCurrency(event.detail.currency);
    };

    const handleRateChange = (event) => {
      setExchangeRate(event.detail.rate);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    window.addEventListener('exchangeRateChanged', handleRateChange);

    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange);
      window.removeEventListener('exchangeRateChanged', handleRateChange);
    };
  }, []);

  const formatCurrency = (amount) => {
    const crcAmount = parseFloat(amount);

    if (currency === 'USD') {
      const usdAmount = crcAmount / exchangeRate;
      const formatted = usdAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).replace(/,/g, '\u202F');
      return `$${formatted}`;
    }

    const formatted = crcAmount.toLocaleString('es-CR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).replace(/\./g, '\u202F');

    return `₡${formatted}`;
  };

  const convertToDisplay = (crcAmount) => {
    if (currency === 'USD') {
      return parseFloat(crcAmount) / exchangeRate;
    }
    return parseFloat(crcAmount);
  };

  const convertToCRC = (displayAmount) => {
    if (currency === 'USD') {
      return displayAmount * exchangeRate;
    }
    return displayAmount;
  };

  return {
    currency,
    exchangeRate,
    formatCurrency,
    convertToDisplay,
    convertToCRC,
  };
};

export default useCurrency;

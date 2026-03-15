import React from 'react';
import useCurrency from '../../hooks/useCurrency';

const CurrencyDisplay = ({ amount, className = '' }) => {
  const { formatCurrency } = useCurrency();

  return (
    <span className={className}>
      {formatCurrency(amount)}
    </span>
  );
};

export default CurrencyDisplay;

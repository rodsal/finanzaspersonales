// Constantes de la aplicación

// Categorías predefinidas con colores
export const EXPENSE_CATEGORIES = [
  { name: 'Alimentación', color: '#10b981' },
  { name: 'Transporte', color: '#3b82f6' },
  { name: 'Vivienda', color: '#8b5cf6' },
  { name: 'Servicios', color: '#f59e0b' },
  { name: 'Salud', color: '#ef4444' },
  { name: 'Educación', color: '#06b6d4' },
  { name: 'Entretenimiento', color: '#ec4899' },
  { name: 'Ropa', color: '#a855f7' },
  { name: 'Tecnología', color: '#6366f1' },
  { name: 'Otros', color: '#64748b' },
];

// Métodos de pago
export const PAYMENT_METHODS = [
  'Efectivo',
  'Tarjeta de Crédito',
  'Tarjeta de Débito',
  'Transferencia',
  'SINPE Móvil',
  'PayPal',
  'Otro',
];

// Opciones de filtro de tiempo
export const TIME_FILTERS = [
  { label: 'Hoy', value: 'today' },
  { label: 'Esta semana', value: 'week' },
  { label: 'Este mes', value: 'month' },
  { label: 'Este año', value: 'year' },
  { label: 'Personalizado', value: 'custom' },
];

// Meses del año
export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Formato de moneda
export const CURRENCY_FORMAT = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Función helper para formatear moneda
export const formatCurrency = (amount) => {
  // Reemplazar puntos por espacios estrechos para separadores de miles
  return CURRENCY_FORMAT.format(amount).replace(/\./g, '\u202F');
};

// Función helper para obtener color de categoría
export const getCategoryColor = (categoryName) => {
  const category = EXPENSE_CATEGORIES.find(c => c.name === categoryName);
  return category ? category.color : '#64748b';
};

// Función helper para obtener inicial de categoría
export const getCategoryIcon = (categoryName) => {
  return categoryName ? categoryName.charAt(0).toUpperCase() : 'O';
};

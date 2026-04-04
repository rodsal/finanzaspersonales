import axios from 'axios';

// Configuración base de axios
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: attach auth token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// ========== AUTH API ==========

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// ========== EXPENSES API ==========

export const expensesAPI = {
  // Obtener todos los gastos con filtros
  getAll: async (params = {}) => {
    const response = await api.get('/expenses', { params });
    return response.data;
  },

  // Obtener un gasto por ID
  getById: async (id) => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  // Crear nuevo gasto
  create: async (data) => {
    const response = await api.post('/expenses', data);
    return response.data;
  },

  // Actualizar gasto
  update: async (id, data) => {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  },

  // Eliminar gasto
  delete: async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  // Eliminar todos los gastos
  deleteAll: async () => {
    const response = await api.delete('/expenses/all', {
      params: { confirm: 'true' }
    });
    return response.data;
  },

  // Obtener resumen por categoría
  getSummaryByCategory: async (params = {}) => {
    const response = await api.get('/expenses/summary/category', { params });
    return response.data;
  },

  // Obtener resumen por mes
  getSummaryByMonth: async (params = {}) => {
    const response = await api.get('/expenses/summary/month', { params });
    return response.data;
  },

  // Obtener total de gastos
  getTotal: async (params = {}) => {
    const response = await api.get('/expenses/total', { params });
    return response.data;
  },
};

// ========== CATEGORIES API ==========

export const categoriesAPI = {
  // Obtener todas las categorías
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  // Obtener una categoría por ID
  getById: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  // Crear nueva categoría
  create: async (data) => {
    const response = await api.post('/categories', data);
    return response.data;
  },

  // Actualizar categoría
  update: async (id, data) => {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  // Eliminar categoría
  delete: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

// ========== INCOMES API ==========

export const incomeAPI = {
  // Obtener todos los ingresos con filtros
  getAll: async (params = {}) => {
    const response = await api.get('/incomes', { params });
    return response.data;
  },

  // Obtener un ingreso por ID
  getById: async (id) => {
    const response = await api.get(`/incomes/${id}`);
    return response.data;
  },

  // Crear nuevo ingreso
  create: async (data) => {
    const response = await api.post('/incomes', data);
    return response.data;
  },

  // Actualizar ingreso
  update: async (id, data) => {
    const response = await api.put(`/incomes/${id}`, data);
    return response.data;
  },

  // Eliminar ingreso
  delete: async (id) => {
    const response = await api.delete(`/incomes/${id}`);
    return response.data;
  },

  // Obtener resumen por tipo
  getSummary: async (params = {}) => {
    const response = await api.get('/incomes/summary', { params });
    return response.data;
  },

  // Obtener resumen de ingresos por mes
  getSummaryByMonth: async (params = {}) => {
    const response = await api.get('/incomes/summary/month', { params });
    return response.data;
  },

  // Obtener estimación mensual de ingresos activos
  getMonthlyEstimate: async () => {
    const response = await api.get('/incomes/monthly-estimate');
    return response.data;
  },
};


// ========== TRIPS API ==========

export const tripsAPI = {
  getAll: async () => {
    const response = await api.get('/trips');
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/trips', data);
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/trips/${id}`);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/trips/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/trips/${id}`);
    return response.data;
  },
  getSummary: async (id) => {
    const response = await api.get(`/trips/${id}/summary`);
    return response.data;
  },
  getExpenses: async (id) => {
    const response = await api.get(`/trips/${id}/expenses`);
    return response.data;
  },
  createExpense: async (id, data) => {
    const response = await api.post(`/trips/${id}/expenses`, data);
    return response.data;
  },
  updateExpense: async (id, expenseId, data) => {
    const response = await api.put(`/trips/${id}/expenses/${expenseId}`, data);
    return response.data;
  },
  deleteExpense: async (id, expenseId) => {
    const response = await api.delete(`/trips/${id}/expenses/${expenseId}`);
    return response.data;
  },
};

// ========== HEALTH CHECK ==========

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;

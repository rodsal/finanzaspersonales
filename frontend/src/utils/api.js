import axios from 'axios';

// Configuración base de axios
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

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

// ========== HEALTH CHECK ==========

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;

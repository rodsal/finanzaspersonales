import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { expensesAPI } from '../utils/api';
import { getCategoryColor, getCategoryIcon, MONTHS } from '../utils/constants';
import CurrencyDisplay from '../components/common/CurrencyDisplay';
import useCurrency from '../hooks/useCurrency';

const SummaryPage = () => {
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [summaryByCategory, setSummaryByCategory] = useState([]);
  const [summaryByMonth, setSummaryByMonth] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadSummary();
  }, [selectedYear]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      // Obtener resumen por categoría
      const categoryResponse = await expensesAPI.getSummaryByCategory();
      setSummaryByCategory(categoryResponse.data);
      setTotalExpenses(categoryResponse.total);

      // Obtener resumen por mes
      const monthResponse = await expensesAPI.getSummaryByMonth({ year: selectedYear });
      setSummaryByMonth(monthResponse.data);
    } catch (error) {
      console.error('Error al cargar resumen:', error);
      toast.error('Error al cargar el resumen');
    } finally {
      setLoading(false);
    }
  };

  // Preparar datos para el gráfico de pastel
  const pieChartData = summaryByCategory.map((item) => ({
    name: item.category,
    value: item.total,
    color: getCategoryColor(item.category),
  }));

  // Preparar datos para el gráfico de barras por mes
  const barChartData = summaryByMonth.map((item) => ({
    name: MONTHS[item.month - 1].substring(0, 3),
    total: item.total,
    count: item.count,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{payload[0].name}</p>
          <p className="text-primary-600 font-bold">
            {formatCurrency(payload[0].value)}
          </p>
          {payload[0].payload.count && (
            <p className="text-sm text-gray-600">
              {payload[0].payload.count} {payload[0].payload.count === 1 ? 'gasto' : 'gastos'}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando resumen...</p>
        </div>
      </div>
    );
  }

  if (summaryByCategory.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="text-3xl font-bold text-gray-400">₡</div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No hay datos para mostrar
          </h3>
          <p className="text-gray-500">
            Registra algunos gastos para ver tu resumen financiero
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
          Resumen Financiero
        </h1>
        <p className="text-gray-600">
          Análisis detallado de tus gastos por categoría y período
        </p>
      </div>

      {/* Tarjeta de total */}
      <div className="card bg-gradient-to-r from-primary-500 to-blue-600 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 mb-1">Total de Gastos (Todo el período)</p>
            <p className="text-4xl font-bold">
              <CurrencyDisplay amount={totalExpenses} />
            </p>
          </div>
          <div className="w-20 h-20 bg-white/10 rounded-lg flex items-center justify-center">
            <span className="text-4xl font-bold">₡</span>
          </div>
        </div>
      </div>

      {/* Resumen por categoría */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Lista de categorías */}
        <div className="card">
          <h2 className="text-xl font-heading font-semibold text-gray-900 mb-4">
            Gastos por Categoría
          </h2>
          <div className="space-y-3">
            {summaryByCategory.map((item) => (
              <div
                key={item.category}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-white"
                    style={{ backgroundColor: getCategoryColor(item.category) }}
                  >
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.category}</p>
                    <p className="text-sm text-gray-600">
                      {item.count} {item.count === 1 ? 'gasto' : 'gastos'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    <CurrencyDisplay amount={item.total} />
                  </p>
                  <p className="text-sm text-gray-600">{item.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de pastel */}
        <div className="card">
          <h2 className="text-xl font-heading font-semibold text-gray-900 mb-4">
            Distribución por Categoría
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={false}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={60}
                formatter={(value, entry) => {
                  const item = summaryByCategory.find(cat => cat.category === value);
                  return `${value} (${item ? item.percentage.toFixed(1) : 0}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resumen por mes */}
      {summaryByMonth.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-gray-900">
              Gastos Mensuales
            </h2>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {[2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="total" fill="#0ea5e9" name="Total" />
            </BarChart>
          </ResponsiveContainer>

          {/* Tabla de resumen mensual */}
          <div className="mt-6 overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Cantidad de Gastos</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {summaryByMonth.map((item) => (
                  <tr key={`${item.year}-${item.month}`}>
                    <td className="font-medium">
                      {MONTHS[item.month - 1]} {item.year}
                    </td>
                    <td>{item.count}</td>
                    <td className="font-semibold text-primary-600">
                      <CurrencyDisplay amount={item.total} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryPage;

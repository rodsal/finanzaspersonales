import React from 'react';
import { Link } from 'react-router-dom';
<<<<<<< Updated upstream

const HomePage = () => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-heading font-bold text-gray-900 mb-6">
          Finanzas Personales
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Control financiero profesional. Simple. Efectivo.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <Link
          to="/expenses"
          className="group relative bg-white border-2 border-gray-200 rounded-lg p-8 hover:border-primary-600 transition-all duration-300"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-600 rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h3 className="text-2xl font-heading font-semibold text-gray-900 mb-3">
            Gestión de Gastos
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Registra y categoriza tus gastos con un sistema intuitivo. Mantén un seguimiento detallado de cada transacción.
          </p>
          <div className="mt-6 text-primary-600 font-medium group-hover:translate-x-2 transition-transform">
            Ir a Gastos →
          </div>
        </Link>

        <Link
          to="/summary"
          className="group relative bg-white border-2 border-gray-200 rounded-lg p-8 hover:border-primary-600 transition-all duration-300"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-600 rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h3 className="text-2xl font-heading font-semibold text-gray-900 mb-3">
            Análisis y Resumen
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Visualiza tus finanzas con gráficos y reportes detallados. Identifica patrones y optimiza tu presupuesto.
          </p>
          <div className="mt-6 text-primary-600 font-medium group-hover:translate-x-2 transition-transform">
            Ver Resumen →
          </div>
        </Link>
      </div>

      {/* Método 50/30/20 Section */}
      <div className="bg-gray-50 rounded-lg p-12">
        <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4 text-center">
          El Método 50/30/20
        </h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
          Una regla simple y efectiva para organizar tu presupuesto mensual, popularizada por la senadora Elizabeth Warren.
          Divide tus ingresos netos en tres categorías:
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <div className="text-white font-bold text-2xl">50%</div>
            </div>
            <h4 className="font-semibold text-gray-900 mb-3 text-lg">Necesidades</h4>
            <p className="text-gray-600 leading-relaxed">
              Gastos esenciales como vivienda, alimentación, transporte, servicios básicos y seguros. Lo que necesitas para vivir.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <div className="text-white font-bold text-2xl">30%</div>
            </div>
            <h4 className="font-semibold text-gray-900 mb-3 text-lg">Deseos</h4>
            <p className="text-gray-600 leading-relaxed">
              Gastos no esenciales como entretenimiento, restaurantes, suscripciones, hobbies y compras personales.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <div className="text-white font-bold text-2xl">20%</div>
            </div>
            <h4 className="font-semibold text-gray-900 mb-3 text-lg">Ahorro e Inversión</h4>
            <p className="text-gray-600 leading-relaxed">
              Fondo de emergencia, ahorro a largo plazo, inversiones y pago de deudas más allá del mínimo.
            </p>
          </div>
        </div>
      </div>
=======
import { expensesAPI, incomeAPI } from '../utils/api';
import CurrencyDisplay from '../components/common/CurrencyDisplay';
import { getCategoryColor, getCategoryIcon, MONTHS } from '../utils/constants';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [categoryData, setCategoryData] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);

  const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const monthNum = parseInt(selectedMonth);
      const startDate = new Date(selectedYear, monthNum, 1);
      const endDate = new Date(selectedYear, monthNum + 1, 0, 23, 59, 59);
      const params = { start_date: startDate.toISOString(), end_date: endDate.toISOString() };

      const [incomeRes, categoryRes, expensesRes] = await Promise.all([
        incomeAPI.getSummary(params),
        expensesAPI.getSummaryByCategory(params),
        expensesAPI.getAll(params),
      ]);

      setTotalIncome(incomeRes.data.total || 0);
      setCategoryData(categoryRes.data || []);
      setTotalExpenses(categoryRes.total || 0);
      setRecentExpenses((expensesRes.data || []).slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const balance = totalIncome - totalExpenses;
  const todayStr = new Date().toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hola, {user?.name?.split(' ')[0]}</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Aquí tienes el resumen de tus finanzas hoy, {todayStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none">
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none">
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      ) : (
        <>
          {/* 3 Stat Cards */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
                  <span className="text-orange-500 font-bold text-sm">₡</span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${balance >= 0 ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                  {balance >= 0 ? '↑ +2.5%' : '↓ negativo'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-0.5">Balance Total</p>
              <p className={`text-xl font-bold ${balance >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                {balance < 0 && '-'}<CurrencyDisplay amount={Math.abs(balance)} />
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-xs text-gray-400 font-medium">v. mes ant.</span>
              </div>
              <p className="text-xs text-gray-500 mb-0.5">Ingresos Mensuales</p>
              <p className="text-xl font-bold text-gray-900"><CurrencyDisplay amount={totalIncome} /></p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                <span className="text-xs text-red-500 font-semibold bg-red-50 px-2 py-0.5 rounded-full">↑ +5.0%</span>
              </div>
              <p className="text-xs text-gray-500 mb-0.5">Gastos Mensuales</p>
              <p className="text-xl font-bold text-gray-900"><CurrencyDisplay amount={totalExpenses} /></p>
            </div>
          </div>

          {/* Bottom section */}
          <div className="grid grid-cols-3 gap-4" style={{ height: 'calc(100vh - 290px)' }}>
            {/* Resumen Mensual */}
            <div className="col-span-2 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Resumen Mensual</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Gastos por categoría</p>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">{selectedYear}</span>
              </div>

              {categoryData.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-gray-400 text-sm mb-3">Sin gastos en {MONTHS[parseInt(selectedMonth)]}</p>
                  <Link to="/expenses" className="px-3 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-medium hover:bg-orange-600 transition-colors">
                    + Registrar primer gasto
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {categoryData.map((item) => {
                    const planned = item.max_spend || 0;
                    const spent = item.total;
                    const pct = planned > 0 ? Math.min((spent / planned) * 100, 100) : 0;
                    const progressColor = pct <= 75 ? 'bg-green-500' : pct <= 90 ? 'bg-yellow-500' : pct <= 100 ? 'bg-orange-500' : 'bg-red-500';
                    return (
                      <div key={item.category} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: getCategoryColor(item.category) }}>
                          {getCategoryIcon(item.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-800">{item.category}</span>
                            <span className="text-xs font-bold text-gray-900"><CurrencyDisplay amount={spent} /></span>
                          </div>
                          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                            {planned > 0
                              ? <div className={`h-full rounded-full transition-all ${progressColor}`} style={{ width: `${pct}%` }} />
                              : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Transacciones Recientes */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-sm font-bold text-gray-900">Transacciones</h2>
                <Link to="/expenses" className="text-xs text-orange-500 font-medium hover:underline">Ver todas</Link>
              </div>
              <div className="space-y-3 overflow-y-auto flex-1">
                {recentExpenses.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">Sin transacciones</p>
                ) : (
                  recentExpenses.map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: getCategoryColor(exp.category) }}>
                          {getCategoryIcon(exp.category)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{exp.description}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(exp.date).toLocaleDateString('es-CR', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-red-500 flex-shrink-0">
                        -<CurrencyDisplay amount={exp.amount} />
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 flex-shrink-0">
                <Link to="/expenses" className="flex items-center justify-center px-2 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-semibold hover:bg-orange-600 transition-colors">
                  + Gasto
                </Link>
                <Link to="/income" className="flex items-center justify-center px-2 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors">
                  + Ingreso
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
>>>>>>> Stashed changes
    </div>
  );
};

export default HomePage;

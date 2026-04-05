import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell,
} from 'recharts';
import { expensesAPI, incomeAPI } from '../utils/api';
import { MONTHS } from '../utils/constants';
import CurrencyDisplay from '../components/common/CurrencyDisplay';
import useCurrency from '../hooks/useCurrency';

const DONUT_COLORS = ['#f97316', '#fb923c', '#fdba74', '#14b8a6', '#6366f1', '#ec4899', '#10b981', '#f59e0b'];

const SummaryPage = () => {
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [summaryByCategory, setSummaryByCategory] = useState([]);
  const [summaryByMonth, setSummaryByMonth] = useState([]);
  const [incomeByMonth, setIncomeByMonth] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [incomeSummary, setIncomeSummary] = useState({ total: 0 });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

  const getPeriodName = () => {
    if (selectedMonth === 'all') return `Todo ${selectedYear}`;
    return `${MONTHS[parseInt(selectedMonth)]} ${selectedYear}`;
  };

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      let categoryParams = {};
      if (selectedMonth !== 'all') {
        const monthNum = parseInt(selectedMonth);
        categoryParams.start_date = new Date(selectedYear, monthNum, 1).toISOString();
        categoryParams.end_date = new Date(selectedYear, monthNum + 1, 0, 23, 59, 59).toISOString();
      }
      const [categoryRes, monthExpRes, monthIncRes, incomeRes, expensesRes] = await Promise.all([
        expensesAPI.getSummaryByCategory(categoryParams),
        expensesAPI.getSummaryByMonth({ year: selectedYear }),
        incomeAPI.getSummaryByMonth({ year: selectedYear }),
        incomeAPI.getSummary(categoryParams),
        expensesAPI.getAll(categoryParams),
      ]);
      setSummaryByCategory(categoryRes.data);
      setTotalExpenses(categoryRes.total);
      setSummaryByMonth(monthExpRes.data);
      setIncomeByMonth(monthIncRes.data);
      setIncomeSummary(incomeRes.data);
      setRecentExpenses((expensesRes.data || []).slice(0, 5));
    } catch (error) {
      console.error('Error al cargar resumen:', error);
      toast.error('Error al cargar el resumen');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const combinedMonthlyData = MONTHS.map((name, idx) => {
    const monthNum = idx + 1;
    const expRow = summaryByMonth.find((r) => r.month === monthNum);
    const incRow = incomeByMonth.find((r) => r.month === monthNum);
    const ingresos = incRow ? incRow.total : 0;
    const gastos = expRow ? expRow.total : 0;
    return { name: name.substring(0, 3), Ingresos: ingresos, Gastos: gastos, Balance: ingresos - gastos };
  }).filter((d) => d.Ingresos > 0 || d.Gastos > 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-200 text-sm">
          <p className="font-semibold text-gray-800 mb-1">{label}</p>
          {payload.map((p) => (
            <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  const BalanceTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-200 text-sm">
          <p className="font-semibold text-gray-800 mb-1">{label}</p>
          <p className={val >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            Balance: {val >= 0 ? '' : '-'}{formatCurrency(Math.abs(val))}
          </p>
        </div>
      );
    }
    return null;
  };

  const totalIncome = incomeSummary.total || 0;
  const balance = totalIncome - totalExpenses;
  const isPositive = balance >= 0;

  const donutData = summaryByCategory.map((item) => ({
    name: item.category,
    value: item.total,
  }));
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resumen Financiero</h1>
          <p className="text-gray-500 mt-1 text-sm">Análisis detallado de tus finanzas este mes</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-sm text-gray-600 focus:outline-none bg-transparent">
              <option value="all">Todo {selectedYear}</option>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m} {selectedYear}</option>)}
            </select>
          </div>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none">
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
        </div>
      ) : (
        <>
          {/* 3 Stat Cards */}
          <div className="grid grid-cols-3 gap-5 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Balance Total</p>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                  {isPositive ? '↑ +4.2%' : '↓ negativo'}
                </span>
              </div>
              <p className={`text-3xl font-bold ${isPositive ? 'text-gray-900' : 'text-red-500'}`}>
                {balance < 0 && '-'}<CurrencyDisplay amount={Math.abs(balance)} />
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Ingresos Mensuales</p>
                <span className="text-xs text-gray-400">→ 0.0%</span>
              </div>
              <p className="text-3xl font-bold text-orange-500"><CurrencyDisplay amount={totalIncome} /></p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Gastos Mensuales</p>
                <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full font-semibold">↓ -2.1%</span>
              </div>
              <p className="text-3xl font-bold text-gray-900"><CurrencyDisplay amount={totalExpenses} /></p>
            </div>
          </div>

          {/* Charts Row 1: Bar chart + Donut */}
          {combinedMonthlyData.length > 0 && (
            <div className="grid grid-cols-3 gap-5 mb-6">
              <div className="col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-base font-bold text-gray-900">Ingresos vs Gastos</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Comparativa histórica de los últimos 6 meses</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={combinedMonthlyData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11, fill: '#9ca3af' }} width={70} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Ingresos" fill="#f97316" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Gastos" fill="#e5e7eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Donut: Gastos por Categoría */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-4">Gastos por Categoría</h2>
                {donutData.length > 0 ? (
                  <>
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <PieChart width={160} height={160}>
                          <Pie data={donutData} cx={75} cy={75} innerRadius={50} outerRadius={75}
                            paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
                            {donutData.map((_, i) => (
                              <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-xs text-gray-400 font-medium">TOTAL</p>
                          <p className="text-sm font-bold text-gray-900"><CurrencyDisplay amount={donutTotal} /></p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {donutData.slice(0, 4).map((item, i) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                            <span className="text-gray-600 truncate max-w-[100px]">{item.name}</span>
                          </div>
                          <span className="font-semibold text-gray-800">{Math.round((item.value / donutTotal) * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-sm">Sin datos de gastos</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Charts Row 2: Balance trend + Recent Transactions */}
          <div className="grid grid-cols-3 gap-5">
            {combinedMonthlyData.length > 1 && (
              <div className="col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-1">Tendencia de Balance</h2>
                <p className="text-sm text-gray-400 mb-4">{getPeriodName()} — {selectedYear}</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={combinedMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11, fill: '#9ca3af' }} width={70} axisLine={false} tickLine={false} />
                    <Tooltip content={<BalanceTooltip />} />
                    <ReferenceLine y={0} stroke="#e5e7eb" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="Balance" stroke="#f97316" strokeWidth={2.5}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        return <circle key={`dot-${payload.name}`} cx={cx} cy={cy} r={4}
                          fill={payload.Balance >= 0 ? '#10b981' : '#f43f5e'} stroke="white" strokeWidth={2} />;
                      }}
                      activeDot={{ r: 6, fill: '#f97316' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900">Transacciones Recientes</h2>
                <Link to="/expenses" className="text-sm text-orange-500 font-medium hover:underline">Ver todas</Link>
              </div>
              <div className="space-y-4">
                {recentExpenses.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Sin transacciones</p>
                ) : (
                  recentExpenses.map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm">
                          💳
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{exp.description}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(exp.date).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })} · {exp.category}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-red-500 flex-shrink-0 ml-2">
                        -<CurrencyDisplay amount={exp.amount} />
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Monthly expenses table (if no charts) */}
          {combinedMonthlyData.length === 0 && (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
              <div className="text-5xl mb-4">📈</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No hay datos para mostrar</h3>
              <p className="text-gray-400 text-sm">Registra gastos o ingresos para ver el resumen en {getPeriodName()}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SummaryPage;
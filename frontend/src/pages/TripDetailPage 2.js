import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { tripsAPI } from '../utils/api';
import TripForm from '../components/trips/TripForm';
import TripExpenseForm from '../components/trips/TripExpenseForm';

const CURRENCY_SYMBOLS = { CRC: '₡', USD: '$', EUR: '€', MXN: '$', GBP: '£' };

const CATEGORY_COLORS = {
  'Transporte': 'bg-blue-100 text-blue-700',
  'Alojamiento': 'bg-purple-100 text-purple-700',
  'Alimentación': 'bg-orange-100 text-orange-700',
  'Entretenimiento': 'bg-pink-100 text-pink-700',
  'Compras': 'bg-yellow-100 text-yellow-700',
  'Salud': 'bg-red-100 text-red-700',
  'Otros': 'bg-gray-100 text-gray-600',
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getTripStatus = (startDate, endDate) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (today < start) return 'upcoming';
  if (today > end) return 'past';
  return 'active';
};

const STATUS_CONFIG = {
  upcoming: { label: 'Próximo', color: 'bg-blue-100 text-blue-700' },
  active:   { label: 'En curso', color: 'bg-green-100 text-green-700' },
  past:     { label: 'Finalizado', color: 'bg-gray-100 text-gray-600' },
};

const TripDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('budget');

  const [showEditForm, setShowEditForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [tripRes, summaryRes, expensesRes] = await Promise.all([
        tripsAPI.getById(id),
        tripsAPI.getSummary(id),
        tripsAPI.getExpenses(id),
      ]);
      setTrip(tripRes.data);
      setSummary(summaryRes.data);
      setExpenses(expensesRes.data || []);
    } catch {
      toast.error('Error al cargar el viaje');
      navigate('/viajes');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleUpdateTrip = async (data) => {
    try {
      setFormLoading(true);
      await tripsAPI.update(id, data);
      toast.success('Viaje actualizado');
      setShowEditForm(false);
      loadAll();
    } catch {
      toast.error('Error al actualizar el viaje');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!window.confirm(`¿Eliminar el viaje "${trip.name}"? Se borrarán todos sus gastos.`)) return;
    try {
      await tripsAPI.delete(id);
      toast.success('Viaje eliminado');
      navigate('/viajes');
    } catch {
      toast.error('Error al eliminar el viaje');
    }
  };

  const handleCreateExpense = async (data) => {
    try {
      setFormLoading(true);
      await tripsAPI.createExpense(id, data);
      toast.success('Gasto agregado');
      setShowExpenseForm(false);
      loadAll();
    } catch {
      toast.error('Error al agregar el gasto');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateExpense = async (data) => {
    try {
      setFormLoading(true);
      await tripsAPI.updateExpense(id, editingExpense.id, data);
      toast.success('Gasto actualizado');
      setEditingExpense(null);
      loadAll();
    } catch {
      toast.error('Error al actualizar el gasto');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('¿Eliminar este gasto?')) return;
    try {
      await tripsAPI.deleteExpense(id, expenseId);
      toast.success('Gasto eliminado');
      loadAll();
    } catch {
      toast.error('Error al eliminar el gasto');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!trip) return null;

  const symbol = CURRENCY_SYMBOLS[trip.currency] || trip.currency;
  const status = getTripStatus(trip.start_date, trip.end_date);
  const statusBadge = STATUS_CONFIG[status];
  const pctUsed = summary ? Math.min(summary.percentage_used, 100) : 0;
  const isOverBudget = summary && summary.total_spent > summary.total_budget;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/viajes')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Mis Viajes
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-2xl">
              ✈️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-800">{trip.name}</h1>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {formatDate(trip.start_date)} → {formatDate(trip.end_date)}
              </p>
              {trip.notes && <p className="text-sm text-gray-400 mt-1">{trip.notes}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditForm(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Editar viaje"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteTrip}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar viaje"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Budget bar */}
        {summary && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Presupuesto usado</span>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${isOverBudget ? 'text-red-600' : 'text-gray-700'}`}>
                  {symbol}{summary.total_spent.toLocaleString()}
                </span>
                <span className="text-gray-300">/</span>
                <span className="text-sm text-gray-500">
                  {symbol}{summary.total_budget.toLocaleString()} {trip.currency}
                </span>
              </div>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all ${isOverBudget ? 'bg-red-500' : 'bg-primary-500'}`}
                style={{ width: `${pctUsed}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-gray-400">{pctUsed.toFixed(1)}% utilizado</span>
              <span className={`text-xs font-medium ${isOverBudget ? 'text-red-500' : 'text-green-600'}`}>
                {isOverBudget
                  ? `${symbol}${Math.abs(summary.remaining).toLocaleString()} sobre presupuesto`
                  : `${symbol}${summary.remaining.toLocaleString()} disponible`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { key: 'budget', label: 'Presupuesto' },
          { key: 'expenses', label: `Gastos (${expenses.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Presupuesto */}
      {activeTab === 'budget' && (
        <div>
          {!summary || summary.by_category.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-gray-500 text-sm">Agrega gastos para ver el desglose por categoría</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Gastos</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">% del viaje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {summary.by_category
                    .sort((a, b) => b.total - a.total)
                    .map(row => {
                      const pct = summary.total_spent > 0
                        ? (row.total / summary.total_spent * 100).toFixed(1)
                        : 0;
                      return (
                        <tr key={row.category} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[row.category] || 'bg-gray-100 text-gray-600'}`}>
                              {row.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right text-sm text-gray-500">{row.count}</td>
                          <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-800">
                            {symbol}{row.total.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-1.5 bg-primary-400 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 w-8">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td className="px-5 py-3 text-sm font-semibold text-gray-700">Total</td>
                    <td className="px-5 py-3 text-right text-sm text-gray-500">{expenses.length}</td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-gray-800">
                      {symbol}{summary.total_spent.toLocaleString()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Gastos */}
      {activeTab === 'expenses' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowExpenseForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar Gasto
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="text-4xl mb-3">🧾</div>
              <p className="text-gray-500 text-sm mb-4">Sin gastos registrados para este viaje</p>
              <button
                onClick={() => setShowExpenseForm(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Agregar primer gasto
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <ul className="divide-y divide-gray-50">
                {expenses.map(expense => (
                  <li key={expense.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[expense.category] || 'bg-gray-100 text-gray-600'}`}>
                        {expense.category}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{expense.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{formatDate(expense.date)}</span>
                          {expense.payment_method && (
                            <span className="text-xs text-gray-300">· {expense.payment_method}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-800">
                        {symbol}{expense.amount.toLocaleString()}
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button
                          onClick={() => setEditingExpense(expense)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showEditForm && (
        <TripForm
          trip={trip}
          onSubmit={handleUpdateTrip}
          onClose={() => setShowEditForm(false)}
          loading={formLoading}
        />
      )}
      {showExpenseForm && (
        <TripExpenseForm
          currency={trip.currency}
          onSubmit={handleCreateExpense}
          onClose={() => setShowExpenseForm(false)}
          loading={formLoading}
        />
      )}
      {editingExpense && (
        <TripExpenseForm
          expense={editingExpense}
          currency={trip.currency}
          onSubmit={handleUpdateExpense}
          onClose={() => setEditingExpense(null)}
          loading={formLoading}
        />
      )}
    </div>
  );
};

export default TripDetailPage;

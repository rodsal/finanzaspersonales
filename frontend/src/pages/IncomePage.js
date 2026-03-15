import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { incomeAPI } from '../utils/api';
import CurrencyDisplay from '../components/common/CurrencyDisplay';
import useCurrency from '../hooks/useCurrency';
import { MONTHS } from '../utils/constants';
import Modal from '../components/common/Modal';

const INCOME_TYPES = [
  { value: 'fixed', label: 'Salario Fijo', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  { value: 'variable', label: 'Salario Variable', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { value: 'sporadic', label: 'Ingreso Esporádico', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  { value: 'one_time', label: 'Ingreso Único Mensual', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  { value: 'commission', label: 'Comisión por Ventas', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
];

const FREQUENCIES = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
];

const NON_RECURRENT_TYPES = ['sporadic', 'one_time', 'commission'];
const getTypeInfo = (type) => INCOME_TYPES.find((t) => t.value === type) || INCOME_TYPES[2];
const getFrequencyLabel = (freq) => (FREQUENCIES.find((f) => f.value === freq) || {}).label || freq;

const ICON_BY_TYPE = {
  fixed: '💼', variable: '📊', sporadic: '⚡', one_time: '🎯', commission: '🏆',
};

const IncomePage = () => {
  useCurrency();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [incomeSummary, setIncomeSummary] = useState({ fixed: 0, variable: 0, sporadic: 0, one_time: 0, commission: 0, total: 0 });
  const [filterType, setFilterType] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [formData, setFormData] = useState({
    description: '', amount: '', income_type: 'fixed', frequency: 'monthly',
    date: new Date().toISOString().split('T')[0], notes: '', is_active: true,
  });

  useEffect(() => { loadIncomes(); loadIncomeSummary(); }, []); // eslint-disable-line
  useEffect(() => { loadIncomes(); loadIncomeSummary(); }, [filterType, selectedMonth, selectedYear]); // eslint-disable-line

  const loadIncomes = async () => {
    setLoading(true);
    try {
      const params = filterType !== 'all' ? { income_type: filterType } : {};
      if (selectedMonth !== 'all') {
        const monthNum = parseInt(selectedMonth);
        const startDate = new Date(selectedYear, monthNum, 1);
        const endDate = new Date(selectedYear, monthNum + 1, 0, 23, 59, 59);
        params.start_date = startDate.toISOString();
        params.end_date = endDate.toISOString();
      }
      const response = await incomeAPI.getAll(params);
      if (selectedMonth !== 'all' && (filterType === 'all' || ['fixed', 'variable'].includes(filterType))) {
        const recurrentResponse = await incomeAPI.getAll({ is_active: true, ...(filterType !== 'all' ? { income_type: filterType } : {}) });
        const recurrentIncomes = recurrentResponse.data.filter((inc) => ['fixed', 'variable'].includes(inc.income_type));
        const existingIds = new Set(response.data.map((inc) => inc.id));
        const merged = [...response.data];
        for (const inc of recurrentIncomes) { if (!existingIds.has(inc.id)) merged.push(inc); }
        merged.sort((a, b) => new Date(b.date) - new Date(a.date));
        setIncomes(merged);
      } else {
        setIncomes(response.data);
      }
    } catch { toast.error('Error al cargar los ingresos'); }
    finally { setLoading(false); }
  };

  const loadIncomeSummary = async () => {
    try {
      const params = {};
      if (selectedMonth !== 'all') {
        const monthNum = parseInt(selectedMonth);
        params.start_date = new Date(selectedYear, monthNum, 1).toISOString();
        params.end_date = new Date(selectedYear, monthNum + 1, 0, 23, 59, 59).toISOString();
      }
      const response = await incomeAPI.getSummary(params);
      setIncomeSummary(response.data);
    } catch { console.error('Error al cargar resumen de ingresos'); }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const isRecurrent = !NON_RECURRENT_TYPES.includes(formData.income_type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) { toast.error('Descripción y monto son requeridos'); return; }
    const payload = {
      description: formData.description, amount: parseFloat(formData.amount),
      income_type: formData.income_type,
      date: formData.date ? new Date(formData.date).toISOString() : undefined,
      notes: formData.notes || undefined,
    };
    if (isRecurrent) { payload.frequency = formData.frequency; payload.is_active = formData.is_active; }
    try {
      if (editingIncome) { await incomeAPI.update(editingIncome.id, payload); toast.success('Ingreso actualizado'); }
      else { await incomeAPI.create(payload); toast.success('Ingreso creado'); }
      resetForm();
      loadIncomes();
      loadIncomeSummary();
    } catch { toast.error('Error al guardar el ingreso'); }
  };

  const handleEdit = (income) => {
    setEditingIncome(income);
    setFormData({
      description: income.description, amount: income.amount.toString(),
      income_type: income.income_type, frequency: income.frequency || 'monthly',
      date: income.date ? income.date.split('T')[0] : new Date().toISOString().split('T')[0],
      notes: income.notes || '', is_active: income.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este ingreso?')) return;
    try { await incomeAPI.delete(id); toast.success('Ingreso eliminado'); loadIncomes(); loadIncomeSummary(); }
    catch { toast.error('Error al eliminar el ingreso'); }
  };

  const handleToggleActive = async (income) => {
    try {
      await incomeAPI.update(income.id, { is_active: !income.is_active });
      toast.success(income.is_active ? 'Ingreso desactivado' : 'Ingreso activado');
      loadIncomes(); loadIncomeSummary();
    } catch { toast.error('Error al actualizar estado'); }
  };

  const resetForm = () => {
    setFormData({ description: '', amount: '', income_type: 'fixed', frequency: 'monthly', date: new Date().toISOString().split('T')[0], notes: '', is_active: true });
    setEditingIncome(null);
    setShowForm(false);
  };

  const recurrentTotal = (incomeSummary.fixed || 0) + (incomeSummary.variable || 0);
  const extraTotal = (incomeSummary.sporadic || 0) + (incomeSummary.one_time || 0) + (incomeSummary.commission || 0);
  const totalPages = Math.ceil(incomes.length / itemsPerPage);
  const paginated = incomes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Ingresos</h1>
          <p className="text-gray-500 mt-1 text-sm">Monitorea y organiza tus entradas de dinero este mes.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none">
            <option value="all">Todos los meses</option>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none">
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar Ingreso
          </button>
        </div>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
            <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">↑ 5.2%</span>
          </div>
          <p className="text-sm text-gray-500 mb-1">Balance del Mes</p>
          <p className="text-2xl font-bold text-gray-900"><CurrencyDisplay amount={incomeSummary.total || 0} /></p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">↑ 8.1%</span>
          </div>
          <p className="text-sm text-gray-500 mb-1">Ingresos Totales</p>
          <p className="text-2xl font-bold text-gray-900"><CurrencyDisplay amount={recurrentTotal + extraTotal} /></p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">↑ 2.3%</span>
          </div>
          <p className="text-sm text-gray-500 mb-1">Ingresos Extra</p>
          <p className="text-2xl font-bold text-gray-900"><CurrencyDisplay amount={extraTotal} /></p>
        </div>
      </div>

      {/* Fuentes de Ingresos Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
        {/* Filter chips */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Fuentes de Ingresos</h2>
            <div className="flex items-center gap-2">
              {['all', 'fixed', 'variable', 'sporadic', 'one_time', 'commission'].map((type) => {
                const info = type === 'all' ? { label: 'Todos' } : getTypeInfo(type);
                return (
                  <button key={type} onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filterType === type ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {type === 'all' ? 'Todos' : info.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto" />
          </div>
        ) : incomes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">💰</div>
            <p className="text-gray-500 font-medium">No hay ingresos registrados</p>
            <p className="text-gray-400 text-sm mt-1">Agrega tu primer ingreso usando el botón de arriba</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-50">
              <div className="col-span-4">Concepto</div>
              <div className="col-span-2">Categoría</div>
              <div className="col-span-2">Fecha</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-1 text-right">Monto</div>
              <div className="col-span-1 text-right">Acciones</div>
            </div>

            {paginated.map((income) => {
              const typeInfo = getTypeInfo(income.income_type);
              const isRecurrentIncome = !NON_RECURRENT_TYPES.includes(income.income_type);
              return (
                <div key={income.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-orange-50">
                      {ICON_BY_TYPE[income.income_type] || '💰'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{income.description}</p>
                      {income.notes && <p className="text-xs text-gray-400 truncate">{income.notes}</p>}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm text-gray-500">
                    {new Date(income.date).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="col-span-2">
                    {isRecurrentIncome ? (
                      <button onClick={() => handleToggleActive(income)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${income.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${income.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {income.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Completado
                      </span>
                    )}
                    {isRecurrentIncome && (
                      <p className="text-xs text-gray-400 mt-1">{getFrequencyLabel(income.frequency)}</p>
                    )}
                  </div>
                  <div className="col-span-1 text-right">
                    <span className="text-sm font-bold text-gray-900"><CurrencyDisplay amount={income.amount} /></span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button onClick={() => handleEdit(income)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(income.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between px-6 py-4">
              <p className="text-sm text-gray-400">Mostrando {incomes.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, incomes.length)} de {incomes.length} ingresos</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${currentPage === 1 ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  Anterior
                </button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${currentPage === totalPages || totalPages === 0 ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-800 text-gray-800 hover:bg-gray-100'}`}>
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Charts placeholder */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4">Distribución por Categoría</h3>
          <div className="space-y-3">
            {[
              { label: 'Fijo', value: incomeSummary.fixed || 0, color: 'bg-green-500' },
              { label: 'Variable', value: incomeSummary.variable || 0, color: 'bg-blue-500' },
              { label: 'Esporádico', value: incomeSummary.sporadic || 0, color: 'bg-purple-500' },
              { label: 'Único mensual', value: incomeSummary.one_time || 0, color: 'bg-amber-500' },
              { label: 'Comisiones', value: incomeSummary.commission || 0, color: 'bg-orange-500' },
            ].filter((item) => item.value > 0).map((item) => {
              const total = incomeSummary.total || 1;
              const pct = Math.round((item.value / total) * 100);
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-semibold text-gray-800">{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {(incomeSummary.total || 0) === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Sin datos para mostrar</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4">Resumen de Ingresos</h3>
          <div className="space-y-3">
            {[
              { label: 'Recurrente (Fijo + Variable)', value: recurrentTotal, color: 'text-green-600 bg-green-50' },
              { label: 'Extras del Mes', value: extraTotal, color: 'text-purple-600 bg-purple-50' },
              { label: 'Total del Mes', value: incomeSummary.total || 0, color: 'text-orange-600 bg-orange-50', bold: true },
            ].map((item) => (
              <div key={item.label} className={`flex items-center justify-between px-4 py-3 rounded-xl ${item.color.split(' ')[1]}`}>
                <span className={`text-sm ${item.bold ? 'font-bold' : 'font-medium'} ${item.color.split(' ')[0]}`}>{item.label}</span>
                <span className={`text-sm font-bold ${item.color.split(' ')[0]}`}><CurrencyDisplay amount={item.value} /></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Income Form */}
      <Modal isOpen={showForm} onClose={resetForm} title={editingIncome ? 'Editar Ingreso' : 'Nuevo Ingreso'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {INCOME_TYPES.map((type) => (
              <button key={type.value} type="button"
                onClick={() => setFormData((prev) => ({ ...prev, income_type: type.value }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${formData.income_type === type.value ? type.color + ' border-transparent ring-2 ring-offset-1 ring-current' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {type.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Descripción *</label>
              <input type="text" name="description" value={formData.description} onChange={handleChange}
                className="form-input" placeholder="Ej: Salario empresa ABC" required />
            </div>
            <div>
              <label className="form-label">Monto *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">₡</span>
                <input type="number" name="amount" value={formData.amount} onChange={handleChange}
                  className="form-input" style={{ paddingLeft: '2.5rem' }} placeholder="0.00" min="0" step="0.01" required />
              </div>
            </div>
            {isRecurrent && (
              <div>
                <label className="form-label">Frecuencia</label>
                <select name="frequency" value={formData.frequency} onChange={handleChange} className="form-input">
                  {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="form-label">Fecha</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">Notas</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} className="form-input" rows="2" placeholder="Notas adicionales..." />
          </div>
          {isRecurrent && (
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className="text-sm text-gray-600">{formData.is_active ? 'Activo' : 'Inactivo'}</span>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors">
              {editingIncome ? 'Actualizar' : 'Crear Ingreso'}
            </button>
            <button type="button" onClick={resetForm} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default IncomePage;
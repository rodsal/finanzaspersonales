import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { incomeAPI } from '../utils/api';
import CurrencyDisplay from '../components/common/CurrencyDisplay';
import useCurrency from '../hooks/useCurrency';
import { MONTHS } from '../utils/constants';

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

const IncomePage = () => {
  const { formatCurrency } = useCurrency();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [incomeSummary, setIncomeSummary] = useState({ fixed: 0, variable: 0, sporadic: 0, one_time: 0, commission: 0, total: 0 });
  const [filterType, setFilterType] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    income_type: 'fixed',
    frequency: 'monthly',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    loadIncomes();
    loadIncomeSummary();
  }, []);

  const loadIncomes = async () => {
    setLoading(true);
    try {
      const params = filterType !== 'all' ? { income_type: filterType } : {};

      // Filtro por mes/año
      if (selectedMonth !== 'all') {
        const monthNum = parseInt(selectedMonth);
        const startDate = new Date(selectedYear, monthNum, 1);
        const endDate = new Date(selectedYear, monthNum + 1, 0, 23, 59, 59);
        params.start_date = startDate.toISOString();
        params.end_date = endDate.toISOString();
      }

      const response = await incomeAPI.getAll(params);

      // Siempre incluir ingresos recurrentes activos aunque no caigan en el rango de fechas
      if (selectedMonth !== 'all') {
        const recurrentParams = { is_active: true };
        if (filterType !== 'all') {
          if (['fixed', 'variable'].includes(filterType)) {
            recurrentParams.income_type = filterType;
          }
        }
        // Solo cargar recurrentes si no se está filtrando por un tipo no-recurrente
        if (filterType === 'all' || ['fixed', 'variable'].includes(filterType)) {
          const recurrentResponse = await incomeAPI.getAll(recurrentParams);
          const recurrentIncomes = recurrentResponse.data.filter(
            (inc) => ['fixed', 'variable'].includes(inc.income_type)
          );
          // Combinar: recurrentes activos + no-recurrentes del mes (sin duplicados)
          const existingIds = new Set(response.data.map((inc) => inc.id));
          const merged = [...response.data];
          for (const inc of recurrentIncomes) {
            if (!existingIds.has(inc.id)) {
              merged.push(inc);
            }
          }
          // Ordenar por fecha descendente
          merged.sort((a, b) => new Date(b.date) - new Date(a.date));
          setIncomes(merged);
        } else {
          setIncomes(response.data);
        }
      } else {
        setIncomes(response.data);
      }
    } catch (error) {
      console.error('Error al cargar ingresos:', error);
      toast.error('Error al cargar los ingresos');
    } finally {
      setLoading(false);
    }
  };

  const loadIncomeSummary = async () => {
    try {
      const params = {};
      if (selectedMonth !== 'all') {
        const monthNum = parseInt(selectedMonth);
        const startDate = new Date(selectedYear, monthNum, 1);
        const endDate = new Date(selectedYear, monthNum + 1, 0, 23, 59, 59);
        params.start_date = startDate.toISOString();
        params.end_date = endDate.toISOString();
      }
      const response = await incomeAPI.getSummary(params);
      setIncomeSummary(response.data);
    } catch (error) {
      console.error('Error al cargar resumen de ingresos:', error);
    }
  };

  useEffect(() => {
    loadIncomes();
    loadIncomeSummary();
  }, [filterType, selectedMonth, selectedYear]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description || !formData.amount) {
      toast.error('Descripción y monto son requeridos');
      return;
    }

    const payload = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      income_type: formData.income_type,
      date: formData.date ? new Date(formData.date).toISOString() : undefined,
      notes: formData.notes || undefined,
    };

    // Solo enviar frecuencia y is_active para fixed y variable
    if (isRecurrent) {
      payload.frequency = formData.frequency;
      payload.is_active = formData.is_active;
    }

    try {
      if (editingIncome) {
        await incomeAPI.update(editingIncome.id, payload);
        toast.success('Ingreso actualizado');
      } else {
        await incomeAPI.create(payload);
        toast.success('Ingreso creado');
      }

      resetForm();
      loadIncomes();
      loadIncomeSummary();
    } catch (error) {
      console.error('Error al guardar ingreso:', error);
      toast.error('Error al guardar el ingreso');
    }
  };

  const handleEdit = (income) => {
    setEditingIncome(income);
    setFormData({
      description: income.description,
      amount: income.amount.toString(),
      income_type: income.income_type,
      frequency: income.frequency || 'monthly',
      date: income.date ? income.date.split('T')[0] : new Date().toISOString().split('T')[0],
      notes: income.notes || '',
      is_active: income.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este ingreso?')) return;

    try {
      await incomeAPI.delete(id);
      toast.success('Ingreso eliminado');
      loadIncomes();
      loadIncomeSummary();
    } catch (error) {
      console.error('Error al eliminar ingreso:', error);
      toast.error('Error al eliminar el ingreso');
    }
  };

  const handleToggleActive = async (income) => {
    try {
      await incomeAPI.update(income.id, { is_active: !income.is_active });
      toast.success(income.is_active ? 'Ingreso desactivado' : 'Ingreso activado');
      loadIncomes();
      loadIncomeSummary();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      income_type: 'fixed',
      frequency: 'monthly',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      is_active: true,
    });
    setEditingIncome(null);
    setShowForm(false);
  };

  const isRecurrent = !['sporadic', 'one_time', 'commission'].includes(formData.income_type);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">Ingresos</h1>
        <p className="text-gray-600">Gestiona tus ingresos fijos, variables y esporádicos</p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
          <p className="text-sm opacity-90 mb-1">Recurrente</p>
          <p className="text-2xl font-bold"><CurrencyDisplay amount={incomeSummary.fixed + incomeSummary.variable} /></p>
          <p className="text-xs opacity-75 mt-1">Fijo + Variable activos</p>
        </div>
        <div className="card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <p className="text-sm opacity-90 mb-1">Extras del Mes</p>
          <p className="text-2xl font-bold"><CurrencyDisplay amount={(incomeSummary.sporadic || 0) + (incomeSummary.one_time || 0) + (incomeSummary.commission || 0)} /></p>
          <p className="text-xs opacity-75 mt-1">Esporádicos + Únicos + Comisiones</p>
        </div>
        <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <p className="text-sm opacity-90 mb-1">Total del Mes</p>
          <p className="text-2xl font-bold"><CurrencyDisplay amount={incomeSummary.total} /></p>
          <p className="text-xs opacity-75 mt-1">Todos los ingresos</p>
        </div>
      </div>

      {/* Botón nuevo + filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="btn btn-primary text-sm"
          >
            {showForm ? 'Cancelar' : '+ Nuevo Ingreso'}
          </button>

          {/* Filtro por mes y año */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todos los meses</option>
            {MONTHS.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'fixed', 'variable', 'sporadic', 'one_time', 'commission'].map((type) => {
            const info = type === 'all' ? { label: 'Todos', color: 'bg-gray-100 text-gray-700' } : getTypeInfo(type);
            const isActive = filterType === type;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  isActive ? (type === 'all' ? 'bg-gray-700 text-white' : info.color.replace('100', '600').replace('700', 'white')) : info.color
                }`}
              >
                {info.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card bg-gray-50 space-y-4 mb-6">
          <h4 className="font-semibold text-gray-900">
            {editingIncome ? 'Editar Ingreso' : 'Nuevo Ingreso'}
          </h4>

          {/* Tipo de ingreso */}
          <div className="flex flex-wrap gap-2">
            {INCOME_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, income_type: type.value }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  formData.income_type === type.value
                    ? type.color + ' border-transparent ring-2 ring-offset-1 ring-current'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Descripción *</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-input"
                placeholder="Ej: Salario empresa ABC"
                required
              />
            </div>

            <div>
              <label className="form-label">Monto *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">₡</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            {/* Frecuencia — solo para fixed y variable */}
            {isRecurrent && (
              <div>
                <label className="form-label">Frecuencia</label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  className="form-input"
                >
                  {FREQUENCIES.map((freq) => (
                    <option key={freq.value} value={freq.value}>{freq.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="form-label">Fecha</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Notas</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-input"
              rows="2"
              placeholder="Notas adicionales..."
            />
          </div>

          {/* Toggle activo — solo para fixed y variable */}
          {isRecurrent && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className="text-sm text-gray-600">
                {formData.is_active ? 'Activo' : 'Inactivo'} — se incluye en el cálculo mensual
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">
              {editingIncome ? 'Actualizar' : 'Crear'}
            </button>
            <button type="button" onClick={resetForm} className="btn btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de ingresos */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : incomes.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💰</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No hay ingresos registrados</h3>
          <p className="text-gray-500 text-sm">Agrega tu primer ingreso usando el botón de arriba</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incomes.map((income) => {
            const typeInfo = getTypeInfo(income.income_type);
            return (
              <div key={income.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4 flex-1">
                  {/* Indicador de tipo */}
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${typeInfo.dot}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">{income.description}</h4>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      {!NON_RECURRENT_TYPES.includes(income.income_type) && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                          {getFrequencyLabel(income.frequency)}
                        </span>
                      )}
                      {!NON_RECURRENT_TYPES.includes(income.income_type) && !income.is_active && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(income.date).toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {income.notes && ` · ${income.notes}`}
                    </p>
                  </div>
                </div>

                {/* Monto y acciones */}
                <div className="flex items-center gap-4">
                  <p className="font-bold text-lg text-green-600">
                    <CurrencyDisplay amount={income.amount} />
                  </p>

                  <div className="flex items-center gap-2">
                    {/* Toggle activo — solo para recurrentes */}
                    {!NON_RECURRENT_TYPES.includes(income.income_type) && (
                      <button
                        onClick={() => handleToggleActive(income)}
                        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${income.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                        title={income.is_active ? 'Desactivar' : 'Activar'}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${income.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    )}

                    <button
                      onClick={() => handleEdit(income)}
                      className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
                      title="Editar"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(income.id)}
                      className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IncomePage;

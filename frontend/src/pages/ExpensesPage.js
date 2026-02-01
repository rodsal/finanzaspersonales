import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseList from '../components/expenses/ExpenseList';
import ExcelImportExport from '../components/expenses/ExcelImportExport';
import VoucherParser from '../components/expenses/VoucherParser';
import Modal from '../components/common/Modal';
import { expensesAPI } from '../utils/api';
import CurrencyDisplay from '../components/common/CurrencyDisplay';

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showVoucherParser, setShowVoucherParser] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [timePeriod, setTimePeriod] = useState('all'); // all, week, biweekly, month, year
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);

  useEffect(() => {
    loadExpenses();
  }, []);

  // Filtrar gastos por período
  useEffect(() => {
    if (!expenses.length) {
      setFilteredTotal(0);
      setFilteredCount(0);
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let startDate;

    switch (timePeriod) {
      case 'week':
        // Última semana (7 días)
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;

      case 'biweekly':
        // Últimas 2 semanas (14 días)
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 14);
        break;

      case 'month':
        // Mes actual
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;

      case 'year':
        // Año actual
        startDate = new Date(today.getFullYear(), 0, 1);
        break;

      case 'all':
      default:
        // Todos los gastos
        const filtered = expenses;
        const total = filtered.reduce((sum, exp) => sum + exp.amount, 0);
        setFilteredTotal(total);
        setFilteredCount(filtered.length);
        return;
    }

    const filtered = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= today;
    });

    const total = filtered.reduce((sum, exp) => sum + exp.amount, 0);
    setFilteredTotal(total);
    setFilteredCount(filtered.length);
  }, [expenses, timePeriod]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const response = await expensesAPI.getAll({ limit: 100 });
      setExpenses(response.data);

      // Calcular total
      const total = response.data.reduce((sum, exp) => sum + exp.amount, 0);
      setTotalExpenses(total);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
      toast.error('Error al cargar los gastos');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    loadExpenses();
    setEditingExpense(null);
    setShowForm(false);
    setShowVoucherParser(false);
  };

  const handleUpdate = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = () => {
    loadExpenses();
  };

  const handleCancel = () => {
    setEditingExpense(null);
    setShowForm(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
              Gestión de Gastos
            </h1>
            <p className="text-gray-600">
              Registra y administra todos tus gastos
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowVoucherParser(true)}
              className="btn btn-secondary text-sm whitespace-nowrap"
              title="Importar desde voucher"
            >
              Voucher
            </button>
            <ExcelImportExport
              expenses={expenses}
              onImportComplete={loadExpenses}
            />
          </div>
        </div>
      </div>

      {/* Modal de Voucher Parser */}
      <Modal
        isOpen={showVoucherParser}
        onClose={() => setShowVoucherParser(false)}
        title="Importar desde Voucher"
        size="lg"
      >
        <VoucherParser onSuccess={handleSuccess} />
      </Modal>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Formulario - Columna izquierda */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-semibold text-gray-900">
                {editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
              </h2>
              {!showForm && !editingExpense && (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn btn-primary text-sm"
                >
                  + Agregar
                </button>
              )}
            </div>

            {(showForm || editingExpense) && (
              <ExpenseForm
                editingExpense={editingExpense}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            )}

            {!showForm && !editingExpense && (
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-400">+</span>
                </div>
                <p>Haz clic en "Agregar" para registrar un nuevo gasto</p>
              </div>
            )}
          </div>
        </div>

        {/* Lista de gastos - Columna derecha */}
        <div className="lg:col-span-2">
          {/* Resumen rápido */}
          <div className="card bg-gradient-to-r from-primary-500 to-blue-600 text-white mb-6">
            {/* Selector de período */}
            <div className="mb-4">
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="all" className="text-gray-900">Todo el período</option>
                <option value="week" className="text-gray-900">Última semana</option>
                <option value="biweekly" className="text-gray-900">Últimas 2 semanas</option>
                <option value="month" className="text-gray-900">Mes actual</option>
                <option value="year" className="text-gray-900">Año actual</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Total de Gastos</p>
                <p className="text-3xl font-bold">
                  <CurrencyDisplay amount={filteredTotal} />
                </p>
              </div>
              <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-3xl font-bold">₡</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-sm opacity-90">
                {filteredCount} {filteredCount === 1 ? 'gasto' : 'gastos'}
                {timePeriod !== 'all' && ` en el período seleccionado`}
              </p>
            </div>
          </div>

          {/* Lista */}
          {loading ? (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando gastos...</p>
            </div>
          ) : (
            <ExpenseList
              expenses={expenses}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;

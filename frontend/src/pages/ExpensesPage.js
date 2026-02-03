import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExpenseList from '../components/expenses/ExpenseList';
import ExcelImportExport from '../components/expenses/ExcelImportExport';
import VoucherParser from '../components/expenses/VoucherParser';
import Modal from '../components/common/Modal';
import { expensesAPI, categoriesAPI } from '../utils/api';
import CurrencyDisplay from '../components/common/CurrencyDisplay';

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showVoucherParser, setShowVoucherParser] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [timePeriod, setTimePeriod] = useState('all'); // all, week, biweekly, month, year
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  useEffect(() => {
    loadData();
  }, []);

  // Recargar gastos cuando cambia la categoría
  useEffect(() => {
    loadExpenses();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      const [categoriesRes] = await Promise.all([
        categoriesAPI.getAll()
      ]);
      setCategories(categoriesRes.data);
      loadExpenses();
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
      toast.error('Error al cargar datos');
    }
  };

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
        // Todos los gastos (ya filtrados por categoría desde el backend)
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
      const params = {};
      if (selectedCategory) {
        params.category = selectedCategory;
      }

      const response = await expensesAPI.getAll(params);
      setExpenses(response.data);

      // Calcular total
      const total = response.data.reduce((sum, exp) => sum + exp.amount, 0);
      setTotalExpenses(total);

      // Resetear a página 1 cuando cambian los datos
      setCurrentPage(1);
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

  const handleDeleteAll = async () => {
    if (deleteConfirmText !== 'ELIMINAR TODO') {
      toast.error('Debes escribir "ELIMINAR TODO" para confirmar');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await expensesAPI.deleteAll();
      toast.success(response.message || 'Todos los gastos eliminados');
      setShowDeleteAllModal(false);
      setDeleteConfirmText('');
      loadExpenses();
    } catch (error) {
      console.error('Error al eliminar gastos:', error);
      toast.error('Error al eliminar los gastos');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDeleteAll = () => {
    setShowDeleteAllModal(false);
    setDeleteConfirmText('');
  };

  // Calcular paginación
  const indexOfLastExpense = currentPage * itemsPerPage;
  const indexOfFirstExpense = indexOfLastExpense - itemsPerPage;
  const currentExpenses = expenses.slice(indexOfFirstExpense, indexOfLastExpense);
  const totalPages = Math.ceil(expenses.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Resetear página cuando cambia el período de tiempo
  useEffect(() => {
    setCurrentPage(1);
  }, [timePeriod]);

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
              className="btn btn-primary text-sm whitespace-nowrap"
              title="Importar desde voucher"
            >
              Voucher
            </button>
            <ExcelImportExport
              expenses={expenses}
              onImportComplete={loadExpenses}
            />
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="btn btn-danger text-sm whitespace-nowrap"
              title="Eliminar todos los gastos"
            >
              Eliminar Todo
            </button>
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
        <VoucherParser onSuccess={handleSuccess} categories={categories} />
      </Modal>

      {/* Modal de Confirmación de Eliminación Total */}
      <Modal
        isOpen={showDeleteAllModal}
        onClose={handleCancelDeleteAll}
        title="¿Eliminar TODOS los gastos?"
        size="md"
      >
        <div className="space-y-4">
          {/* Advertencia */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="font-semibold text-red-900 mb-1">
                  ¡ADVERTENCIA! Esta acción no se puede deshacer
                </h4>
                <p className="text-sm text-red-700">
                  Estás a punto de eliminar permanentemente <strong>TODOS</strong> tus gastos ({filteredCount} gastos).
                </p>
              </div>
            </div>
          </div>

          {/* Input de confirmación */}
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Para confirmar, escribe <strong className="text-gray-900">ELIMINAR TODO</strong>:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="form-input w-full"
              placeholder="ELIMINAR TODO"
              autoFocus
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleDeleteAll}
              disabled={deleteConfirmText !== 'ELIMINAR TODO' || isDeleting}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                deleteConfirmText === 'ELIMINAR TODO' && !isDeleting
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isDeleting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Eliminando...
                </span>
              ) : 'Eliminar Todo Permanentemente'}
            </button>
            <button
              onClick={handleCancelDeleteAll}
              disabled={isDeleting}
              className="flex-1 btn btn-secondary py-3"
            >
              Cancelar
            </button>
          </div>
        </div>
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
                categories={categories}
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
            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-4">
              {/* Selector de período */}
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

              {/* Selector de categoría */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="" className="text-gray-900">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name} className="text-gray-900">
                    {cat.name}
                  </option>
                ))}
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
            <>
              <ExpenseList
                expenses={currentExpenses}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="card mt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Info de página */}
                    <div className="text-sm text-gray-600">
                      Mostrando {indexOfFirstExpense + 1} - {Math.min(indexOfLastExpense, expenses.length)} de {expenses.length} gastos
                    </div>

                    {/* Controles de paginación */}
                    <div className="flex items-center gap-2">
                      {/* Botón Anterior */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        ← Anterior
                      </button>

                      {/* Números de página */}
                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, index) => {
                          const pageNumber = index + 1;

                          // Mostrar solo páginas cercanas a la actual
                          if (
                            pageNumber === 1 ||
                            pageNumber === totalPages ||
                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => handlePageChange(pageNumber)}
                                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                  currentPage === pageNumber
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          } else if (
                            pageNumber === currentPage - 2 ||
                            pageNumber === currentPage + 2
                          ) {
                            return <span key={pageNumber} className="text-gray-400">...</span>;
                          }
                          return null;
                        })}
                      </div>

                      {/* Botón Siguiente */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Siguiente →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ExpenseForm from '../components/expenses/ExpenseForm';
import ExcelImportExport from '../components/expenses/ExcelImportExport';
import VoucherParser from '../components/expenses/VoucherParser';
import Modal from '../components/common/Modal';
import { expensesAPI, categoriesAPI } from '../utils/api';
import CurrencyDisplay from '../components/common/CurrencyDisplay';
import { getCategoryColor, getCategoryIcon } from '../utils/constants';

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showVoucherParser, setShowVoucherParser] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { loadData(); }, []); // eslint-disable-line
  useEffect(() => { loadExpenses(); }, [selectedCategory]); // eslint-disable-line

  const loadData = async () => {
    try {
      const [categoriesRes] = await Promise.all([categoriesAPI.getAll()]);
      setCategories(categoriesRes.data);
      loadExpenses();
    } catch {
      toast.error('Error al cargar datos');
    }
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      const response = await expensesAPI.getAll(params);
      setExpenses(response.data);
      setCurrentPage(1);
    } catch {
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

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDeleteSingle = async (id) => {
    if (!window.confirm('¿Eliminar este gasto?')) return;
    try {
      await expensesAPI.delete(id);
      toast.success('Gasto eliminado');
      loadExpenses();
    } catch {
      toast.error('Error al eliminar');
    }
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
    } catch {
      toast.error('Error al eliminar los gastos');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = expenses.filter((e) =>
    e.description.toLowerCase().includes(searchText.toLowerCase())
  );
  const totalFiltered = filtered.reduce((sum, e) => sum + e.amount, 0);
  const now = new Date();
  const monthTotal = expenses
    .filter((e) => { const d = new Date(e.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((sum, e) => sum + e.amount, 0);
  const avgPerTx = filtered.length > 0 ? totalFiltered / filtered.length : 0;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Gastos</h1>
          <p className="text-gray-500 mt-1 text-sm">Revisa y administra tus movimientos financieros</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowVoucherParser(true)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Voucher
          </button>
          <ExcelImportExport expenses={expenses} onImportComplete={loadExpenses} />
          <button onClick={() => { setEditingExpense(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Gasto
          </button>
        </div>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">↑ 12%</span>
          </div>
          <p className="text-sm text-gray-500 mb-1">Gasto Total del Mes</p>
          <p className="text-2xl font-bold text-gray-900"><CurrencyDisplay amount={monthTotal} /></p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <span className="text-xs text-red-500 font-semibold bg-red-50 px-2 py-1 rounded-full">↓ 5%</span>
          </div>
          <p className="text-sm text-gray-500 mb-1">Total Período Filtrado</p>
          <p className="text-2xl font-bold text-gray-900"><CurrencyDisplay amount={totalFiltered} /></p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">↑ 2%</span>
          </div>
          <p className="text-sm text-gray-500 mb-1">Promedio por Transacción</p>
          <p className="text-2xl font-bold text-gray-900"><CurrencyDisplay amount={avgPerTx} /></p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Filters */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Transacciones Recientes</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" value={searchText} onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
                  placeholder="Buscar gasto..."
                  className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-48" />
              </div>
              <button onClick={() => setShowDeleteAllModal(true)}
                className="px-3 py-2 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
                Eliminar Todo
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => setSelectedCategory('')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex-shrink-0 ${selectedCategory === '' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              TODOS
            </button>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.name === selectedCategory ? '' : cat.name)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex-shrink-0 ${selectedCategory === cat.name ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {cat.name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">💸</div>
            <p className="text-gray-500 font-medium">Sin gastos registrados</p>
            <p className="text-gray-400 text-sm mt-1">Agrega tu primer gasto usando el botón de arriba</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-50">
              <div className="col-span-5">Transacción</div>
              <div className="col-span-2">Categoría</div>
              <div className="col-span-2">Fecha</div>
              <div className="col-span-2 text-right">Monto</div>
              <div className="col-span-1"></div>
            </div>

            {paginated.map((exp) => (
              <div key={exp.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: getCategoryColor(exp.category) }}>
                    {getCategoryIcon(exp.category)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{exp.description}</p>
                    {exp.notes && <p className="text-xs text-gray-400 truncate">{exp.notes}</p>}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg uppercase">{exp.category}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-gray-500">
                    {new Date(exp.date).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-sm font-bold text-red-500">-<CurrencyDisplay amount={exp.amount} /></span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button onClick={() => handleEdit(exp)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDeleteSingle(exp.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between px-6 py-4">
              <p className="text-sm text-gray-400">
                Mostrando {filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} de {filtered.length} transacciones
              </p>
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

      {/* Modals */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingExpense(null); }}
        title={editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'} size="md">
        <ExpenseForm editingExpense={editingExpense} onSuccess={handleSuccess}
          onCancel={() => { setShowForm(false); setEditingExpense(null); }} categories={categories} />
      </Modal>

      <Modal isOpen={showVoucherParser} onClose={() => setShowVoucherParser(false)} title="Importar desde Voucher" size="lg">
        <VoucherParser onSuccess={handleSuccess} categories={categories} />
      </Modal>

      <Modal isOpen={showDeleteAllModal} onClose={() => { setShowDeleteAllModal(false); setDeleteConfirmText(''); }}
        title="¿Eliminar TODOS los gastos?" size="md">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">Esta acción no se puede deshacer.</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Escribe <strong>ELIMINAR TODO</strong> para confirmar:</p>
            <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="form-input w-full" placeholder="ELIMINAR TODO" autoFocus />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleDeleteAll} disabled={deleteConfirmText !== 'ELIMINAR TODO' || isDeleting}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${deleteConfirmText === 'ELIMINAR TODO' && !isDeleting ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              {isDeleting ? 'Eliminando...' : 'Eliminar Todo'}
            </button>
            <button onClick={() => { setShowDeleteAllModal(false); setDeleteConfirmText(''); }}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExpensesPage;
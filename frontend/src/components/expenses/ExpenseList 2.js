import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { expensesAPI } from '../../utils/api';
import { getCategoryIcon, getCategoryColor } from '../../utils/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CurrencyDisplay from '../common/CurrencyDisplay';

const ExpenseList = ({ expenses, onUpdate, onDelete }) => {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este gasto?')) {
      return;
    }

    setDeletingId(id);

    try {
      await expensesAPI.delete(id);
      toast.success('Gasto eliminado exitosamente');
      if (onDelete) {
        onDelete(id);
      }
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
      toast.error('Error al eliminar el gasto');
    } finally {
      setDeletingId(null);
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="text-3xl font-bold text-gray-400">₡</div>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No hay gastos registrados
        </h3>
        <p className="text-gray-500">
          Comienza a registrar tus gastos para llevar un mejor control de tus finanzas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="card hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-white text-lg"
                  style={{ backgroundColor: getCategoryColor(expense.category) }}
                >
                  {getCategoryIcon(expense.category)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-lg">
                    {expense.description}
                  </h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                    <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                      {expense.category}
                    </span>
                    <span>
                      {format(new Date(expense.date), 'dd MMM yyyy', { locale: es })}
                    </span>
                    {expense.payment_method && (
                      <span className="text-gray-500">
                        {expense.payment_method}
                      </span>
                    )}
                  </div>
                  {expense.notes && (
                    <p className="mt-2 text-sm text-gray-600 italic">
                      {expense.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 ml-4">
              <div className="text-2xl font-bold text-primary-600">
                <CurrencyDisplay amount={expense.amount} />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onUpdate(expense)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(expense.id)}
                  disabled={deletingId === expense.id}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  {deletingId === expense.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExpenseList;

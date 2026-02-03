import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { expensesAPI } from '../../utils/api';
import { PAYMENT_METHODS } from '../../utils/constants';
import useCurrency from '../../hooks/useCurrency';

const ExpenseForm = ({ onSuccess, editingExpense = null, onCancel = null, categories = [] }) => {
  const { exchangeRate } = useCurrency();
  const [formData, setFormData] = useState({
    description: editingExpense?.description || '',
    amount: editingExpense?.amount || '',
    category: editingExpense?.category || '',
    date: editingExpense?.date ? editingExpense.date.split('T')[0] : new Date().toISOString().split('T')[0],
    notes: editingExpense?.notes || '',
    payment_method: editingExpense?.payment_method || '',
  });

  const [inputCurrency, setInputCurrency] = useState('CRC');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación
    if (!formData.description || !formData.amount || !formData.category) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    setLoading(true);

    try {
      // Convertir monto a CRC si se ingresó en USD
      let amountInCRC = parseFloat(formData.amount);
      if (inputCurrency === 'USD') {
        amountInCRC = amountInCRC * exchangeRate;
      }

      const data = {
        ...formData,
        amount: amountInCRC,
        date: new Date(formData.date).toISOString(),
      };

      if (editingExpense) {
        await expensesAPI.update(editingExpense.id, data);
        toast.success('Gasto actualizado exitosamente');
      } else {
        await expensesAPI.create(data);
        toast.success('Gasto registrado exitosamente');
      }

      // Resetear formulario si es nuevo gasto
      if (!editingExpense) {
        setFormData({
          description: '',
          amount: '',
          category: '',
          date: new Date().toISOString().split('T')[0],
          notes: '',
          payment_method: '',
        });
        setInputCurrency('CRC');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error al guardar gasto:', error);
      toast.error(error.response?.data?.error || 'Error al guardar el gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Descripción */}
      <div>
        <label htmlFor="description" className="form-label">
          Descripción *
        </label>
        <input
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="form-input"
          placeholder="Ej: Almuerzo en restaurante"
          required
        />
      </div>

      {/* Monto */}
      <div>
        <label htmlFor="amount" className="form-label">
          Monto *
        </label>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="form-input"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div>
            <select
              value={inputCurrency}
              onChange={(e) => setInputCurrency(e.target.value)}
              className="form-input"
            >
              <option value="CRC">₡ CRC</option>
              <option value="USD">$ USD</option>
            </select>
          </div>
        </div>
        {inputCurrency === 'USD' && (
          <p className="text-xs text-gray-500 mt-1">
            Se convertirá a ₡{(formData.amount * exchangeRate).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (TC: {exchangeRate})
          </p>
        )}
      </div>

      {/* Fecha */}
      <div>
        <label htmlFor="date" className="form-label">
          Fecha *
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>

      {/* Categoría y Método de Pago */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="form-label">
            Categoría *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="payment_method" className="form-label">
            Método de Pago
          </label>
          <select
            id="payment_method"
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            className="form-input"
          >
            <option value="">Selecciona un método</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label htmlFor="notes" className="form-label">
          Notas adicionales
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="form-input"
          rows="3"
          placeholder="Agrega cualquier detalle adicional..."
        />
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary flex-1"
        >
          {loading ? 'Guardando...' : editingExpense ? 'Actualizar Gasto' : 'Registrar Gasto'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

export default ExpenseForm;

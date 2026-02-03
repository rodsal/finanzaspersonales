import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { categoriesAPI } from '../../utils/api';

const MaxSpendManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [tempValues, setTempValues] = useState({});

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      toast.error('Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setTempValues({
      ...tempValues,
      [category.id]: category.max_spend || ''
    });
  };

  const handleSave = async (category) => {
    const newMaxSpend = tempValues[category.id];

    // Validación
    if (newMaxSpend && parseFloat(newMaxSpend) < 0) {
      toast.error('El presupuesto no puede ser negativo');
      return;
    }

    try {
      await categoriesAPI.update(category.id, {
        name: category.name,
        description: category.description,
        color: category.color,
        max_spend: newMaxSpend || null
      });

      toast.success('Límite de gasto actualizado');
      setEditingId(null);
      loadCategories();
    } catch (error) {
      console.error('Error al actualizar límite:', error);
      toast.error('Error al actualizar el límite de gasto');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setTempValues({});
  };

  const handleChange = (categoryId, value) => {
    setTempValues({
      ...tempValues,
      [categoryId]: value
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Límites de Gasto por Categoría</h3>
        <p className="text-sm text-gray-600">
          Define presupuestos máximos para cada categoría. Recibirás alertas visuales cuando te acerques al límite.
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-600 text-lg">ℹ️</span>
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Cómo funcionan los límites:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong className="text-green-700">Verde (0-85%)</strong>: Gasto dentro del rango normal</li>
              <li>• <strong className="text-yellow-700">Amarillo (85-95%)</strong>: Acercándose al límite</li>
              <li>• <strong className="text-red-700">Rojo (+95%)</strong>: Límite excedido o muy cerca</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const isEditing = editingId === category.id;
          const displayValue = isEditing
            ? tempValues[category.id] ?? ''
            : category.max_spend || '';

          return (
            <div
              key={category.id}
              className="card hover:shadow-lg transition-shadow border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color || '#3b82f6' }}
                ></div>
                <h4 className="font-semibold text-gray-900 text-lg">{category.name}</h4>
              </div>

              <div className="mb-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">
                  Presupuesto Máximo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">₡</span>
                  <input
                    type="number"
                    value={displayValue}
                    onChange={(e) => handleChange(category.id, e.target.value)}
                    readOnly={!isEditing}
                    className={`w-full border rounded-lg px-3 py-2 pl-8 transition-colors ${
                      isEditing
                        ? 'bg-white border-primary-500 ring-2 ring-primary-200 text-gray-900'
                        : 'bg-gray-50 border-gray-200 text-gray-700 cursor-pointer hover:bg-white'
                    }`}
                    placeholder="Sin límite"
                    min="0"
                    step="0.01"
                    onClick={() => !isEditing && handleEdit(category)}
                  />
                </div>
                {!isEditing && !category.max_spend && (
                  <p className="text-xs text-gray-400 mt-1">Click para establecer límite</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => handleSave(category)}
                      className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleEdit(category)}
                    className="px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            <p>No hay categorías disponibles.</p>
            <p className="text-sm mt-1">Crea categorías en la pestaña "Categorías" primero.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaxSpendManager;

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { categoriesAPI } from '../../utils/api';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  });

  const DEFAULT_CATEGORIES = [
    "Alimentación", "Transporte", "Vivienda", "Servicios", "Salud",
    "Educación", "Entretenimiento", "Ropa", "Tecnología", "Otros"
  ];

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, formData);
        toast.success('Categoría actualizada');
      } else {
        await categoriesAPI.create(formData);
        toast.success('Categoría creada');
      }

      setFormData({ name: '', description: '', color: '#3b82f6' });
      setEditingCategory(null);
      setShowForm(false);
      loadCategories();
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      toast.error('Error al guardar la categoría');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3b82f6',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) {
      return;
    }

    try {
      await categoriesAPI.delete(id);
      toast.success('Categoría eliminada');
      loadCategories();
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      toast.error('Error al eliminar la categoría');
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '', color: '#3b82f6' });
    setEditingCategory(null);
    setShowForm(false);
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Categorías Personalizadas</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary text-sm"
        >
          {showForm ? 'Cancelar' : '+ Nueva Categoría'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card bg-gray-50 space-y-4">
          <h4 className="font-semibold text-gray-900">
            {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
          </h4>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="Ej: Gimnasio"
                required
              />
            </div>

            <div>
              <label className="form-label">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-full h-10 rounded border border-gray-300 cursor-pointer p-1"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              rows="2"
              placeholder="Descripción de la categoría..."
            />
          </div>



          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">
              {editingCategory ? 'Actualizar' : 'Crear'}
            </button>
            <button type="button" onClick={handleCancel} className="btn btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="card hover:shadow-lg transition-shadow border border-gray-100 p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color || '#3b82f6' }}
                ></div>
                <h4 className="font-semibold text-gray-900 text-lg">{category.name}</h4>
              </div>

              {category.description && (
                <p className="text-sm text-gray-500">{category.description}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
              <button
                onClick={() => handleEdit(category)}
                className="text-sm text-gray-600 hover:text-primary-600 font-medium px-2 py-1"
              >
                Editar
              </button>
              {!DEFAULT_CATEGORIES.includes(category.name) && (
                <button
                  onClick={() => handleDelete(category.id)}
                  className="text-sm text-red-600 hover:text-red-700 px-2 py-1"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        ))}

        {categories.length === 0 && !showForm && (
          <div className="col-span-full text-center py-8 text-gray-500">
            <p>No hay categorías personalizadas aún.</p>
            <p className="text-sm mt-1">Crea una para personalizar tus gastos.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManager;

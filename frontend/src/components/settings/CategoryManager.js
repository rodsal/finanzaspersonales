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
    icon: '📦',
  });

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

      setFormData({ name: '', description: '', color: '#3b82f6', icon: '📦' });
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
      icon: category.icon || '📦',
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
    setFormData({ name: '', description: '', color: '#3b82f6', icon: '📦' });
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
              <label className="form-label">Icono</label>
              <input
                type="text"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                className="form-input"
                placeholder="📦"
              />
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

          <div>
            <label className="form-label">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-600">{formData.color}</span>
            </div>
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
            className="card hover:shadow-lg transition-shadow"
            style={{ borderLeft: `4px solid ${category.color || '#3b82f6'}` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{category.icon || '📦'}</span>
                <div>
                  <h4 className="font-semibold text-gray-900">{category.name}</h4>
                  {category.description && (
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleEdit(category)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Eliminar
              </button>
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

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { tripsAPI } from '../utils/api';
import TripForm from '../components/trips/TripForm';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return new Date(year, month - 1, day).toLocaleDateString('es-CR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const getTripStatus = (startDate, endDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (today < start) return 'upcoming';
  if (today > end) return 'past';
  return 'active';
};

const STATUS_CONFIG = {
  upcoming: { label: 'Próximo', bg: 'bg-blue-50 text-blue-600', dot: 'bg-blue-400' },
  active: { label: 'En curso', bg: 'bg-green-50 text-green-600', dot: 'bg-green-400' },
  past: { label: 'Finalizado', bg: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
};

const GRADIENT_BY_STATUS = {
  upcoming: 'from-blue-400 to-blue-600',
  active: 'from-orange-400 to-orange-600',
  past: 'from-gray-400 to-gray-500',
};

const CURRENCY_SYMBOLS = { CRC: '₡', USD: '$', EUR: '€', MXN: '$', GBP: '£' };

const DESTINATION_ICONS = ['🏖️', '🏔️', '🌆', '🗺️', '✈️', '🌴', '🏕️', '🌍'];
const getDestinationIcon = (name) => DESTINATION_ICONS[name.charCodeAt(0) % DESTINATION_ICONS.length];

const TripCard = ({ trip, onDelete }) => {
  const navigate = useNavigate();
  const status = getTripStatus(trip.start_date, trip.end_date);
  const cfg = STATUS_CONFIG[status];
  const gradient = GRADIENT_BY_STATUS[status];
  const symbol = CURRENCY_SYMBOLS[trip.currency] || trip.currency;

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`¿Eliminar el viaje "${trip.name}"? Se borrarán todos sus gastos.`)) {
      onDelete(trip.id);
    }
  };

  return (
    <div
      onClick={() => navigate(`/viajes/${trip.id}`)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-orange-100 transition-all group"
    >
      {/* Gradient header */}
      <div className={`bg-gradient-to-r ${gradient} px-5 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getDestinationIcon(trip.name)}</span>
          <div>
            <h3 className="font-bold text-white text-base">{trip.name}</h3>
            <p className="text-xs text-white text-opacity-80 mt-0.5 opacity-80">
              {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white bg-opacity-20 text-white">
            {cfg.label}
          </span>
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-white text-opacity-70 hover:text-opacity-100 transition-all rounded-lg hover:bg-white hover:bg-opacity-20"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">Presupuesto total</span>
          <span className="text-sm font-bold text-gray-800">
            {symbol}{trip.total_budget?.toLocaleString()} {trip.currency}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${gradient} w-0`} />
        </div>
        {trip.notes && (
          <p className="text-xs text-gray-400 mt-3 truncate">{trip.notes}</p>
        )}
      </div>
    </div>
  );
};

const AddTripCard = ({ onClick }) => (
  <div
    onClick={onClick}
    className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all flex flex-col items-center justify-center gap-3 min-h-[160px] group"
  >
    <div className="w-12 h-12 bg-orange-100 group-hover:bg-orange-200 rounded-xl flex items-center justify-center transition-colors">
      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </div>
    <div className="text-center">
      <p className="text-sm font-semibold text-gray-700 group-hover:text-orange-600 transition-colors">Planificar Nueva Aventura</p>
      <p className="text-xs text-gray-400 mt-0.5">Crea un presupuesto para tu próximo viaje</p>
    </div>
  </div>
);

const TripsPage = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      const res = await tripsAPI.getAll();
      setTrips(res.data || []);
    } catch {
      toast.error('Error al cargar los viajes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  const handleCreate = async (data) => {
    try {
      setFormLoading(true);
      await tripsAPI.create(data);
      toast.success('Viaje creado exitosamente');
      setShowForm(false);
      loadTrips();
    } catch {
      toast.error('Error al crear el viaje');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await tripsAPI.delete(id);
      toast.success('Viaje eliminado');
      loadTrips();
    } catch {
      toast.error('Error al eliminar el viaje');
    }
  };

  const upcoming = trips.filter(t => getTripStatus(t.start_date, t.end_date) === 'upcoming');
  const active = trips.filter(t => getTripStatus(t.start_date, t.end_date) === 'active');
  const past = trips.filter(t => getTripStatus(t.start_date, t.end_date) === 'past');

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Viajes</h1>
          <p className="text-gray-500 mt-1 text-sm">Planifica y controla el presupuesto de tus aventuras</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Viaje
        </button>
      </div>

      {/* Stats */}
      {!loading && trips.length > 0 && (
        <div className="grid grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Próximos viajes</p>
            <p className="text-2xl font-bold text-gray-900">{upcoming.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">En curso</p>
            <p className="text-2xl font-bold text-gray-900">{active.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Finalizados</p>
            <p className="text-2xl font-bold text-gray-900">{past.length}</p>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
        </div>
      ) : trips.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AddTripCard onClick={() => setShowForm(true)} />
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">En curso</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {active.map(t => <TripCard key={t.id} trip={t} onDelete={handleDelete} />)}
              </div>
            </section>
          )}
          {upcoming.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Próximos</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map(t => <TripCard key={t.id} trip={t} onDelete={handleDelete} />)}
                <AddTripCard onClick={() => setShowForm(true)} />
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Finalizados</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {past.map(t => <TripCard key={t.id} trip={t} onDelete={handleDelete} />)}
              </div>
            </section>
          )}
          {upcoming.length === 0 && active.length === 0 && (
            <AddTripCard onClick={() => setShowForm(true)} />
          )}
        </div>
      )}

      {showForm && (
        <TripForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          loading={formLoading}
        />
      )}
    </div>
  );
};

export default TripsPage;
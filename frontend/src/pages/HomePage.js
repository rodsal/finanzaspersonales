import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-heading font-bold text-gray-900 mb-6">
          Finanzas Personales
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Control financiero profesional. Simple. Efectivo.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <Link
          to="/expenses"
          className="group relative bg-white border-2 border-gray-200 rounded-lg p-8 hover:border-primary-600 transition-all duration-300"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-600 rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h3 className="text-2xl font-heading font-semibold text-gray-900 mb-3">
            Gestión de Gastos
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Registra y categoriza tus gastos con un sistema intuitivo. Mantén un seguimiento detallado de cada transacción.
          </p>
          <div className="mt-6 text-primary-600 font-medium group-hover:translate-x-2 transition-transform">
            Ir a Gastos →
          </div>
        </Link>

        <Link
          to="/summary"
          className="group relative bg-white border-2 border-gray-200 rounded-lg p-8 hover:border-primary-600 transition-all duration-300"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-primary-600 rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <h3 className="text-2xl font-heading font-semibold text-gray-900 mb-3">
            Análisis y Resumen
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Visualiza tus finanzas con gráficos y reportes detallados. Identifica patrones y optimiza tu presupuesto.
          </p>
          <div className="mt-6 text-primary-600 font-medium group-hover:translate-x-2 transition-transform">
            Ver Resumen →
          </div>
        </Link>
      </div>

      {/* Método 50/30/20 Section */}
      <div className="bg-gray-50 rounded-lg p-12">
        <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4 text-center">
          El Método 50/30/20
        </h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
          Una regla simple y efectiva para organizar tu presupuesto mensual, popularizada por la senadora Elizabeth Warren.
          Divide tus ingresos netos en tres categorías:
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <div className="text-white font-bold text-2xl">50%</div>
            </div>
            <h4 className="font-semibold text-gray-900 mb-3 text-lg">Necesidades</h4>
            <p className="text-gray-600 leading-relaxed">
              Gastos esenciales como vivienda, alimentación, transporte, servicios básicos y seguros. Lo que necesitas para vivir.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <div className="text-white font-bold text-2xl">30%</div>
            </div>
            <h4 className="font-semibold text-gray-900 mb-3 text-lg">Deseos</h4>
            <p className="text-gray-600 leading-relaxed">
              Gastos no esenciales como entretenimiento, restaurantes, suscripciones, hobbies y compras personales.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <div className="text-white font-bold text-2xl">20%</div>
            </div>
            <h4 className="font-semibold text-gray-900 mb-3 text-lg">Ahorro e Inversión</h4>
            <p className="text-gray-600 leading-relaxed">
              Fondo de emergencia, ahorro a largo plazo, inversiones y pago de deudas más allá del mínimo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

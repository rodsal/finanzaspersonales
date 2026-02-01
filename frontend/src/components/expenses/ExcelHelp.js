import React, { useState } from 'react';

const ExcelHelp = () => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="text-sm text-primary-600 hover:text-primary-700 underline"
      >
        ¿Cómo importar gastos?
      </button>

      {showHelp && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 w-96 max-w-[calc(100vw-2rem)]">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Formato del archivo Excel</h3>
            <button
              onClick={() => setShowHelp(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p className="font-medium mb-1">Columnas requeridas:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Fecha:</strong> Formato YYYY-MM-DD (ej: 2026-01-31)</li>
                <li><strong>Descripción:</strong> Texto descriptivo del gasto</li>
                <li><strong>Monto (CRC):</strong> Número positivo en colones</li>
                <li><strong>Categoría:</strong> Nombre de la categoría</li>
              </ul>
            </div>

            <div>
              <p className="font-medium mb-1">Columnas opcionales:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Método de Pago:</strong> Efectivo, Tarjeta, etc.</li>
                <li><strong>Notas:</strong> Información adicional</li>
              </ul>
            </div>

            <div className="border-t pt-3 mt-3">
              <p className="font-medium text-primary-600 mb-1">💡 Consejo:</p>
              <p className="text-xs">
                Descarga la plantilla de ejemplo haciendo clic en el botón "Plantilla"
                para ver el formato correcto del archivo.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelHelp;

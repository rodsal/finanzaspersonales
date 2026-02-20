import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { expensesAPI } from '../../utils/api';
import { PAYMENT_METHODS } from '../../utils/constants';
import useCurrency from '../../hooks/useCurrency';

const VoucherParser = ({ onSuccess, categories = [] }) => {
  const { exchangeRate } = useCurrency();
  const [voucherText, setVoucherText] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [inputCurrency, setInputCurrency] = useState('CRC');

  // Función para extraer datos del voucher
  const parseVoucher = (text) => {
    const data = {
      amount: null,
      description: '',
      date: null,
      payment_method: '',
      notes: text.substring(0, 200), // Guardar parte del texto original
    };

    // Extraer monto - buscar patrones como ₡1.000,00 o $100.00 o 1000.00 o 1,000.00
    const amountPatterns = [
      /₡\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)/,
      /\$\s*([0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]{2})?)/,
      /(?:total|monto|importe|amount)[\s:]*₡?\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)/i,
      /([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{2})?)/,
    ];

    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        let amount = match[1];
        if (amount.includes(',') && amount.includes('.')) {
          const lastComma = amount.lastIndexOf(',');
          const lastDot = amount.lastIndexOf('.');
          if (lastDot > lastComma) {
            // Formato: 4,185.00 - coma es miles, punto es decimal
            amount = amount.replace(/,/g, '');
          } else {
            // Formato: 4.185,00 - punto es miles, coma es decimal
            amount = amount.replace(/\./g, '').replace(',', '.');
          }
        } else {
          // Solo un tipo de separador - asumir formato CR (punto miles, coma decimal)
          amount = amount.replace(/\./g, '').replace(',', '.');
        }
        data.amount = parseFloat(amount);
        if (!isNaN(data.amount) && data.amount > 0) {
          break;
        }
      }
    }

    // Extraer fecha - buscar patrones de fecha
    const monthsES = {
      enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
      julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
    };

    const monthsEN = {
      jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
      apr: 4, april: 4, may: 5, jun: 6, june: 6,
      jul: 7, july: 7, aug: 8, august: 8, sep: 9, september: 9,
      oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12
    };

    const datePatterns = [
      { regex: /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/, type: 'dmy' },
      { regex: /(\d{4})[/-](\d{1,2})[/-](\d{1,2})/, type: 'ymd' },
      { regex: /(\d{1,2})\s+(?:de\s+)?([a-záéíóú]+)\s+(?:de\s+)?(\d{4})/i, type: 'es' },
      { regex: /([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/, type: 'en' },
    ];

    for (const { regex, type } of datePatterns) {
      const match = text.match(regex);
      if (match) {
        try {
          let day, month, year;

          if (type === 'es') {
            day = parseInt(match[1]);
            month = monthsES[match[2].toLowerCase()];
            year = parseInt(match[3]);
          } else if (type === 'en') {
            month = monthsEN[match[1].toLowerCase()];
            day = parseInt(match[2]);
            year = parseInt(match[3]);
          } else if (type === 'ymd') {
            year = parseInt(match[1]);
            month = parseInt(match[2]);
            day = parseInt(match[3]);
          } else {
            day = parseInt(match[1]);
            month = parseInt(match[2]);
            year = parseInt(match[3]);
          }

          if (month) {
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) {
              data.date = date.toISOString().split('T')[0];
              break;
            }
          }
        } catch (e) {
          console.error('Error parsing date:', e);
        }
      }
    }

    // Si no se encontró fecha, usar hoy
    if (!data.date) {
      data.date = new Date().toISOString().split('T')[0];
    }

    // Extraer comercio/descripción - buscar después de palabras clave
    const commercePatterns = [
      /(?:comercio|establecimiento|merchant|negocio)[\s:]+([^\n]{3,50})/i,
      /(?:en|at)[\s:]+([A-Z][^\n]{3,50})/,
    ];

    for (const pattern of commercePatterns) {
      const match = text.match(pattern);
      if (match) {
        data.description = match[1].trim().substring(0, 100);
        break;
      }
    }

    // Si no se encontró descripción, usar las primeras palabras
    if (!data.description) {
      const lines = text.split('\n').filter(line => line.trim().length > 5);
      if (lines.length > 0) {
        data.description = lines[0].substring(0, 100);
      }
    }

    // Detectar método de pago
    const paymentPatterns = {
      'Tarjeta de Crédito': /tarjeta.*cr[eé]dito|credit.*card|visa|mastercard/i,
      'Tarjeta de Débito': /tarjeta.*d[eé]bito|debit.*card/i,
      'SINPE Móvil': /sinpe|sinpe.*m[oó]vil/i,
      'Transferencia': /transferencia|transfer/i,
      'Efectivo': /efectivo|cash/i,
    };

    for (const [method, pattern] of Object.entries(paymentPatterns)) {
      if (pattern.test(text)) {
        data.payment_method = method;
        break;
      }
    }

    return data;
  };

  const handleAnalyze = () => {
    if (!voucherText.trim()) {
      toast.error('Por favor pega el contenido del voucher');
      return;
    }

    setIsAnalyzing(true);

    // Simular un pequeño delay para dar feedback visual
    setTimeout(() => {
      const data = parseVoucher(voucherText);

      if (!data.amount) {
        toast.warning('No se pudo detectar el monto. Por favor ingrésalo manualmente.');
      }

      setExtractedData(data);
      setIsAnalyzing(false);
      toast.success('Voucher analizado. Revisa y confirma los datos.');
    }, 500);
  };

  const handleSave = async () => {
    if (!extractedData.amount || extractedData.amount <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    if (!extractedData.description.trim()) {
      toast.error('La descripción es requerida');
      return;
    }

    if (!extractedData.category) {
      toast.error('La categoría es requerida');
      return;
    }

    setIsSaving(true);

    try {
      // Convertir monto a CRC si se ingresó en USD
      let amountInCRC = parseFloat(extractedData.amount);
      if (inputCurrency === 'USD') {
        amountInCRC = amountInCRC * exchangeRate;
      }

      const dataToSave = {
        ...extractedData,
        amount: amountInCRC,
      };

      await expensesAPI.create(dataToSave);
      toast.success('Gasto agregado exitosamente');

      // Limpiar formulario
      setVoucherText('');
      setExtractedData(null);
      setInputCurrency('CRC');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error al guardar gasto:', error);
      toast.error('Error al guardar el gasto');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setVoucherText('');
    setExtractedData(null);
    setInputCurrency('CRC');
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Importación Rápida desde Voucher
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Pega el contenido de tu email de voucher/recibo aquí y extraeremos automáticamente los datos
        </p>
      </div>

      {/* Área de texto para pegar el voucher */}
      <div>
        <label className="form-label">Contenido del Voucher</label>
        <textarea
          value={voucherText}
          onChange={(e) => setVoucherText(e.target.value)}
          placeholder="Pega aquí el texto completo de tu email de voucher o recibo digital..."
          className="form-input font-mono text-sm"
          rows={8}
          disabled={extractedData !== null}
        />
      </div>

      {/* Botones de acción */}
      {!extractedData ? (
        <div className="flex gap-2">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !voucherText.trim()}
            className="btn btn-primary"
          >
            {isAnalyzing ? 'Analizando...' : 'Analizar Voucher'}
          </button>
          {voucherText && (
            <button onClick={handleReset} className="btn btn-secondary">
              Limpiar
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Preview de datos extraídos */}
          <div className="card bg-blue-50 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-4">Datos Extraídos</h4>

            <div className="space-y-3">
              {/* Monto */}
              <div>
                <label className="form-label">Monto *</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={extractedData.amount || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, amount: parseFloat(e.target.value) })}
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
                {inputCurrency === 'USD' && extractedData.amount && (
                  <p className="text-xs text-gray-500 mt-1">
                    Se convertirá a ₡{(extractedData.amount * exchangeRate).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (TC: {exchangeRate})
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="form-label">Descripción</label>
                <input
                  type="text"
                  value={extractedData.description}
                  onChange={(e) => setExtractedData({ ...extractedData, description: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  value={extractedData.date}
                  onChange={(e) => setExtractedData({ ...extractedData, date: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="form-label">Categoría *</label>
                <select
                  value={extractedData.category || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, category: e.target.value })}
                  className="form-input"
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Método de pago */}
              <div>
                <label className="form-label">Método de Pago</label>
                <select
                  value={extractedData.payment_method}
                  onChange={(e) => setExtractedData({ ...extractedData, payment_method: e.target.value })}
                  className="form-input"
                >
                  <option value="">Seleccionar método</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notas */}
              <div>
                <label className="form-label">Notas (opcional)</label>
                <textarea
                  value={extractedData.notes || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, notes: e.target.value })}
                  className="form-input"
                  rows={2}
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn btn-success"
              >
                {isSaving ? 'Guardando...' : 'Confirmar y Agregar Gasto'}
              </button>
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}

      {/* Ayuda */}
      <div className="card bg-gray-50">
        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Consejos:</h4>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>Copia todo el contenido del email del voucher</li>
          <li>El sistema buscará el monto, fecha y comercio automáticamente</li>
          <li>Revisa siempre los datos extraídos antes de confirmar</li>
          <li>Puedes editar cualquier campo antes de guardar</li>
        </ul>
      </div>
    </div>
  );
};

export default VoucherParser;

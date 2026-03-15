import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { expensesAPI } from '../../utils/api';
import { format } from 'date-fns';

const ExcelImportExport = ({ expenses, onImportComplete }) => {
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.createRef();

  // Exportar gastos a Excel
  const handleExport = () => {
    if (!expenses || expenses.length === 0) {
      toast.warning('No hay gastos para exportar');
      return;
    }

    try {
      // Preparar datos para Excel
      const excelData = expenses.map((expense) => ({
        Fecha: format(new Date(expense.date), 'yyyy-MM-dd'),
        Descripción: expense.description,
        'Monto (CRC)': expense.amount,
        Categoría: expense.category,
        'Método de Pago': expense.payment_method || '',
        Notas: expense.notes || '',
      }));

      // Crear worksheet y workbook
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Gastos');

      // Configurar anchos de columna
      const columnWidths = [
        { wch: 12 }, // Fecha
        { wch: 30 }, // Descripción
        { wch: 15 }, // Monto
        { wch: 20 }, // Categoría
        { wch: 20 }, // Método de Pago
        { wch: 40 }, // Notas
      ];
      worksheet['!cols'] = columnWidths;

      // Generar archivo
      const fileName = `gastos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success(`Se exportaron ${expenses.length} gastos exitosamente`);
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar los gastos');
    }
  };

  // Importar gastos desde Excel
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
      event.target.value = '';
      return;
    }

    setImporting(true);

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });

          // Leer la primera hoja
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          if (jsonData.length === 0) {
            toast.warning('El archivo está vacío');
            setImporting(false);
            return;
          }

          // Función helper para procesar fechas de Excel
          const parseExcelDate = (value, rowIndex) => {
            if (!value) {
              return new Date();
            }

            // Si ya es un objeto Date (gracias a cellDates: true)
            if (value instanceof Date) {
              return value;
            }

            // Si es un número (fecha serial de Excel que no se convirtió)
            if (typeof value === 'number') {
              // Convertir número serial de Excel a fecha
              const excelEpoch = new Date(1899, 11, 30);
              const days = Math.floor(value);
              const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
              return date;
            }

            // Si es una cadena, intentar parsearla
            if (typeof value === 'string') {
              const trimmed = value.trim();

              // Detectar formato DD/MM/YYYY o DD-MM-YYYY
              const ddmmyyyyPattern = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
              const match = trimmed.match(ddmmyyyyPattern);

              if (match) {
                const day = parseInt(match[1], 10);
                const month = parseInt(match[2], 10) - 1;
                const year = parseInt(match[3], 10);

                const date = new Date(year, month, day);

                if (date.getFullYear() === year &&
                    date.getMonth() === month &&
                    date.getDate() === day) {
                  return date;
                }
              }

              // Si no es DD/MM/YYYY, intentar parsear normalmente
              const parsed = new Date(trimmed);
              if (!isNaN(parsed.getTime())) {
                return parsed;
              }
            }

            console.warn(`Fila ${rowIndex + 2}: No se pudo parsear la fecha "${value}" (tipo: ${typeof value})`);
            return new Date();
          };

          // Validar y convertir datos
          const validExpenses = [];
          const errors = [];

          jsonData.forEach((row, index) => {
            try {
              // Mapear columnas (soportar diferentes nombres)
              const fechaRaw = row.Fecha || row.fecha || row.Date || row.date;
              const fecha = parseExcelDate(fechaRaw, index);
              const descripcion =
                row.Descripción || row.descripcion || row.Description || row.description;
              const monto =
                row['Monto (CRC)'] ||
                row.Monto ||
                row.monto ||
                row.Amount ||
                row.amount;
              const categoria =
                row.Categoría || row.categoria || row.Category || row.category;
              const metodoPago =
                row['Método de Pago'] ||
                row['Metodo de Pago'] ||
                row.metodoPago ||
                row['Payment Method'] ||
                row.paymentMethod ||
                '';
              const notas =
                row.Notas || row.notas || row.Notes || row.notes || '';

              // Validar campos requeridos
              if (!descripcion || !monto || !categoria) {
                errors.push(`Fila ${index + 2}: faltan campos requeridos`);
                return;
              }

              if (parseFloat(monto) <= 0) {
                errors.push(`Fila ${index + 2}: el monto debe ser mayor a 0`);
                return;
              }

              validExpenses.push({
                description: descripcion,
                amount: parseFloat(monto),
                category: categoria,
                date: fecha.toISOString(),
                payment_method: metodoPago,
                notes: notas,
              });
            } catch (error) {
              errors.push(`Fila ${index + 2}: ${error.message}`);
            }
          });

          // Mostrar errores si hay
          if (errors.length > 0) {
            console.error('Errores de importación:', errors);
            toast.warning(
              `Se encontraron ${errors.length} errores. Revisa la consola para más detalles.`
            );
          }

          if (validExpenses.length === 0) {
            toast.error('No se encontraron gastos válidos para importar');
            setImporting(false);
            return;
          }

          // Importar gastos
          let imported = 0;
          let failed = 0;

          for (const expense of validExpenses) {
            try {
              await expensesAPI.create(expense);
              imported++;
            } catch (error) {
              console.error('Error al crear gasto:', error);
              failed++;
            }
          }

          if (imported > 0) {
            toast.success(
              `Se importaron ${imported} gasto${imported === 1 ? '' : 's'} exitosamente${
                failed > 0 ? ` (${failed} fallidos)` : ''
              }`
            );
            if (onImportComplete) {
              onImportComplete();
            }
          } else {
            toast.error('No se pudo importar ningún gasto');
          }
        } catch (error) {
          console.error('Error al procesar el archivo:', error);
          toast.error('Error al procesar el archivo Excel');
        } finally {
          setImporting(false);
          event.target.value = '';
        }
      };

      reader.onerror = () => {
        toast.error('Error al leer el archivo');
        setImporting(false);
        event.target.value = '';
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error al importar:', error);
      toast.error('Error al importar los gastos');
      setImporting(false);
      event.target.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  // Descargar plantilla de Excel
  const handleDownloadTemplate = () => {
    try {
      // Crear fecha como Date object que Excel reconozca
      const fechaEjemplo = new Date(2026, 0, 31); // 31 de enero de 2026

      const templateData = [
        {
          Fecha: fechaEjemplo,
          Descripción: 'Ejemplo de gasto',
          'Monto (CRC)': 5000,
          Categoría: 'Alimentación',
          'Método de Pago': 'Efectivo',
          Notas: 'Este es un ejemplo de cómo llenar el archivo',
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);

      // Formatear la columna de fecha explícitamente
      worksheet['A2'].t = 'd'; // Tipo fecha
      worksheet['A2'].z = 'dd/mm/yyyy'; // Formato visual

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Gastos');

      // Configurar anchos de columna
      const columnWidths = [
        { wch: 12 }, // Fecha
        { wch: 30 }, // Descripción
        { wch: 15 }, // Monto
        { wch: 20 }, // Categoría
        { wch: 20 }, // Método de Pago
        { wch: 40 }, // Notas
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.writeFile(workbook, 'plantilla_gastos.xlsx');
      toast.info('Plantilla descargada. Completa el archivo y vuelve a importarlo.');
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      toast.error('Error al descargar la plantilla');
    }
  };

  return (
    <>
      {/* Botón de Exportar */}
      <button
        onClick={handleExport}
        disabled={!expenses || expenses.length === 0}
        className="btn btn-secondary text-sm whitespace-nowrap"
        title="Exportar gastos a Excel"
      >
        Exportar
      </button>

      {/* Botón de Importar */}
      <button
        onClick={handleImportClick}
        disabled={importing}
        className="btn btn-primary text-sm whitespace-nowrap"
        title="Importar gastos desde Excel"
      >
        {importing ? 'Importando...' : 'Importar'}
      </button>

      {/* Botón de Plantilla */}
      <button
        onClick={handleDownloadTemplate}
        className="btn btn-secondary text-sm whitespace-nowrap"
        title="Descargar plantilla de Excel"
      >
        Plantilla
      </button>

      {/* Input oculto para seleccionar archivo */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleImport}
        style={{ display: 'none' }}
      />
    </>
  );
};

export default ExcelImportExport;

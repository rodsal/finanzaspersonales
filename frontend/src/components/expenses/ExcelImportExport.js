import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { expensesAPI } from '../../utils/api';
import useCurrency from '../../hooks/useCurrency';
import { format } from 'date-fns';
import ExcelHelp from './ExcelHelp';

const ExcelImportExport = ({ expenses, onImportComplete }) => {
  const { exchangeRate } = useCurrency();
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
          const workbook = XLSX.read(data, { type: 'array' });

          // Leer la primera hoja
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          if (jsonData.length === 0) {
            toast.warning('El archivo está vacío');
            setImporting(false);
            return;
          }

          // Validar y convertir datos
          const validExpenses = [];
          const errors = [];

          jsonData.forEach((row, index) => {
            try {
              // Mapear columnas (soportar diferentes nombres)
              const fecha =
                row.Fecha || row.fecha || row.Date || row.date || new Date().toISOString();
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
                date: new Date(fecha).toISOString(),
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
      const templateData = [
        {
          Fecha: '2026-01-31',
          Descripción: 'Ejemplo de gasto',
          'Monto (CRC)': 5000,
          Categoría: 'Alimentación',
          'Método de Pago': 'Efectivo',
          Notas: 'Este es un ejemplo de cómo llenar el archivo',
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
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
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Ayuda sobre el formato */}
      <ExcelHelp />

      {/* Input oculto para seleccionar archivo */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleImport}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ExcelImportExport;

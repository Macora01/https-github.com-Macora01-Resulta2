import React from 'react';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Filter,
  Loader2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { formatCurrency, cn } from '../lib/utils';
import { financialData, MONTHS } from '../data/financialData';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const Reports = () => {
  const [selectedYears, setSelectedYears] = React.useState<number[]>([2025]);
  const [selectedItems, setSelectedItems] = React.useState<string[]>(['ventasNetas', 'resultadoMes']);
  const [data, setData] = React.useState<any[]>(financialData);
  const [isExporting, setIsExporting] = React.useState(false);
  const reportRef = React.useRef<HTMLDivElement>(null);

  const items = [
    { id: 'ventasNetas', label: 'Ventas Netas', color: '#5f2e0a' },
    { id: 'costo', label: 'Costo de Ventas', color: '#A0522D' },
    { id: 'gastos', label: 'Gastos Operativos', color: '#dec290' },
    { id: 'resultadoMes', label: 'Resultado Neto', color: '#6B8E23' },
  ];

  React.useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('facore_token');
      try {
        const response = await fetch('/api/financial-data', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          if (result.length > 0) {
            setData(result);
            const availableYears = Array.from(new Set(result.map((d: any) => d.year))).sort((a: any, b: any) => b - a);
            if (availableYears.length > 0 && selectedYears.length === 1 && selectedYears[0] === 2025) {
              setSelectedYears([availableYears[0] as number]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  const years = React.useMemo(() => 
    Array.from(new Set(data.map(d => d.year))).sort((a, b) => b - a),
  [data]);

  const toggleYear = (year: number) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? (prev.length > 1 ? prev.filter(y => y !== year) : prev)
        : [...prev, year].sort((a, b) => a - b)
    );
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId)
        ? (prev.length > 1 ? prev.filter(i => i !== itemId) : prev)
        : [...prev, itemId]
    );
  };

  const chartData = React.useMemo(() => {
    return MONTHS.map((month, index) => {
      const entry: any = { name: month };
      selectedYears.forEach(year => {
        const monthData = data.find(d => d.year === year && d.monthIndex === index);
        selectedItems.forEach(item => {
          entry[`${item}_${year}`] = monthData ? Number(monthData[item]) : 0;
        });
      });
      return entry;
    });
  }, [selectedYears, selectedItems, data]);

  const totals = React.useMemo(() => {
    const filteredData = data.filter(d => selectedYears.includes(d.year));
    return filteredData.reduce((acc, curr) => ({
      ventasNetas: acc.ventasNetas + Number(curr.ventasNetas || 0),
      costo: acc.costo + Number(curr.costo || 0),
      gastos: acc.gastos + Number(curr.gastos || 0),
      resultadoMes: acc.resultadoMes + Number(curr.resultadoMes || 0),
    }), { ventasNetas: 0, costo: 0, gastos: 0, resultadoMes: 0 });
  }, [selectedYears, data]);

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    
    try {
      // Small delay to ensure any layout shifts or animations are settled
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FDFCF8',
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions to fit the whole report on one or more pages
      const imgWidth = pdfWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // Start 10mm from top

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      pdf.save(`Reporte_Facore_${selectedYears.join('-')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor, intente de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Mes', ...selectedYears.flatMap(year => 
      selectedItems.map(itemId => `${items.find(i => i.id === itemId)?.label} (${year})`)
    )];
    
    const rows = chartData.map(row => [
      row.name,
      ...selectedYears.flatMap(year => 
        selectedItems.map(itemId => row[`${itemId}_${year}`])
      )
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Datos_Facore_${selectedYears.join('-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#5f2e0a', '#A0522D', '#dec290', '#6B8E23', '#8B7355', '#7B2D00'];

  return (
    <div className="flex flex-col gap-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Reportes Detallados</h1>
          <p className="text-text-light font-medium">Análisis anual y comparativas de rendimiento.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white/50 p-1.5 rounded-xl border border-accent/20">
          {/* Multi-Year Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-accent/10">
            <Filter size={16} className="text-primary" />
            <div className="flex gap-1">
              {years.map(y => (
                <button
                  key={y}
                  onClick={() => toggleYear(y)}
                  className={cn(
                    "px-2 py-0.5 text-xs font-bold rounded transition-all",
                    selectedYears.includes(y) ? "bg-primary text-white" : "text-text-light hover:bg-accent/20"
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div className="h-8 w-px bg-accent/20 mx-1 hidden sm:block" />

          {/* Multi-Item Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-accent/10">
            <div className="flex gap-1">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={cn(
                    "px-2 py-0.5 text-xs font-bold rounded transition-all",
                    selectedItems.includes(item.id) ? "bg-primary text-white" : "text-text-light hover:bg-accent/20"
                  )}
                >
                  {item.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="h-8 w-px bg-accent/20 mx-1 hidden sm:block" />

          <button 
            onClick={exportToPDF}
            disabled={isExporting}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Exportar PDF
          </button>
        </div>
      </div>

      <div ref={reportRef} className="flex flex-col gap-8 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Annual Summary Card */}
          <div className="glass-card p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-text text-xl">
                Resumen de Periodo {selectedYears.length > 1 ? `(${selectedYears[0]}-${selectedYears[selectedYears.length-1]})` : selectedYears[0]}
              </h3>
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <FileText size={24} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-light font-bold uppercase tracking-wider">Ventas Totales</span>
                <span className="text-xl font-bold text-text">{formatCurrency(totals.ventasNetas)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-light font-bold uppercase tracking-wider">Resultado Neto</span>
                <span className={cn(
                  "text-xl font-bold",
                  totals.resultadoMes >= 0 ? "text-success" : "text-danger"
                )}>
                  {formatCurrency(totals.resultadoMes)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-light font-bold uppercase tracking-wider">Margen Operativo</span>
                <span className="text-xl font-bold text-primary">
                  {totals.ventasNetas > 0 ? ((totals.resultadoMes / totals.ventasNetas) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-text-light font-bold uppercase tracking-wider">Eficiencia de Costos</span>
                <span className="text-xl font-bold text-secondary">
                  {totals.ventasNetas > 0 ? ((totals.costo / totals.ventasNetas) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            </div>
          </div>

          {/* Growth Chart */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-text text-lg mb-6">Comparativa Mensual Detallada</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dec29040" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#8D6E63', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#8D6E63', fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                    }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" />
                  {selectedYears.map((year, yIdx) => (
                    selectedItems.map((itemId, iIdx) => {
                      const item = items.find(i => i.id === itemId);
                      const color = COLORS[(yIdx * selectedItems.length + iIdx) % COLORS.length];
                      return (
                        <Line 
                          key={`${itemId}_${year}`}
                          type="monotone" 
                          dataKey={`${itemId}_${year}`} 
                          name={`${item?.label} (${year})`}
                          stroke={color} 
                          strokeWidth={3}
                          dot={{ r: 4, fill: color }}
                          isAnimationActive={!isExporting}
                        />
                      );
                    })
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Data Table for PDF */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-accent/10 flex items-center justify-between">
            <h3 className="font-bold text-text text-lg">Tabla de Datos del Periodo</h3>
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 text-primary font-bold text-sm hover:underline"
            >
              <Download size={16} />
              Descargar CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-accent/10 border-b border-accent/20">
                  <th className="px-6 py-4 text-sm font-bold text-primary uppercase tracking-wider">Mes</th>
                  {selectedYears.map(year => (
                    selectedItems.map(itemId => (
                      <th key={`${itemId}_${year}`} className="px-6 py-4 text-sm font-bold text-primary uppercase tracking-wider text-right">
                        {items.find(i => i.id === itemId)?.label} ({year})
                      </th>
                    ))
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-accent/10">
                {chartData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-accent/5 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-text">{row.name}</td>
                    {selectedYears.map(year => (
                      selectedItems.map(itemId => (
                        <td key={`${itemId}_${year}`} className="px-6 py-4 text-sm text-text text-right font-medium">
                          {formatCurrency(row[`${itemId}_${year}`])}
                        </td>
                      ))
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};


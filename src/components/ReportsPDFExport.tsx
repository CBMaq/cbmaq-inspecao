import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface TechnicianStats {
  technician_id: string;
  technician_name: string;
  total_inspections: number;
  em_andamento: number;
  finalizadas: number;
  aprovadas: number;
  reprovadas: number;
  approval_rate: number;
}

interface MonthlyStats {
  month: string;
  total: number;
  aprovadas: number;
  reprovadas: number;
  finalizadas: number;
}

interface ReportsPDFExportProps {
  technicianStats: TechnicianStats[];
  monthlyStats: MonthlyStats[];
  totalStats: {
    total: number;
    em_andamento: number;
    finalizadas: number;
    aprovadas: number;
    reprovadas: number;
    avg_time: number;
  };
  selectedPeriod: string;
  disabled?: boolean;
}

export function ReportsPDFExport({ 
  technicianStats, 
  monthlyStats, 
  totalStats, 
  selectedPeriod,
  disabled 
}: ReportsPDFExportProps) {
  const generatePDF = async () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(51, 51, 51);
    doc.text("RELATÓRIO GERENCIAL", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text("CBMaq - Sistema de Inspeções", 105, 28, { align: "center" });
    
    const periodLabels: Record<string, string> = {
      "7": "Últimos 7 dias",
      "30": "Últimos 30 dias",
      "90": "Últimos 90 dias",
      "365": "Último ano",
    };
    
    doc.setFontSize(10);
    doc.text(`Período: ${periodLabels[selectedPeriod] || selectedPeriod}`, 105, 34, { align: "center" });
    
    // Linha separadora
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(20, 38, 190, 38);
    
    let yPosition = 48;
    
    // Estatísticas Gerais
    doc.setFontSize(14);
    doc.setTextColor(51, 51, 51);
    doc.text("Estatísticas Gerais", 20, yPosition);
    yPosition += 5;
    
    const generalStats = [
      ["Total de Inspeções", totalStats.total.toString()],
      ["Em Andamento", totalStats.em_andamento.toString()],
      ["Finalizadas", totalStats.finalizadas.toString()],
      ["Aprovadas", totalStats.aprovadas.toString()],
      ["Reprovadas", totalStats.reprovadas.toString()],
      ["Tempo Médio de Conclusão", `${totalStats.avg_time}h`],
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: generalStats,
      theme: "plain",
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 80 },
        1: { cellWidth: 90 },
      },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    // Desempenho por Técnico
    if (technicianStats.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(51, 51, 51);
      doc.text("Desempenho por Técnico", 20, yPosition);
      yPosition += 5;
      
      const techData = technicianStats.map((stat) => [
        stat.technician_name,
        stat.total_inspections.toString(),
        stat.em_andamento.toString(),
        stat.finalizadas.toString(),
        stat.aprovadas.toString(),
        stat.reprovadas.toString(),
        stat.aprovadas + stat.reprovadas > 0 
          ? `${stat.approval_rate.toFixed(1)}%` 
          : "-",
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [["Técnico", "Total", "Andamento", "Finalizadas", "Aprovadas", "Reprovadas", "Taxa Aprovação"]],
        body: techData,
        theme: "grid",
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 20, halign: "center" },
          2: { cellWidth: 23, halign: "center" },
          3: { cellWidth: 25, halign: "center" },
          4: { cellWidth: 23, halign: "center" },
          5: { cellWidth: 24, halign: "center" },
          6: { cellWidth: 25, halign: "center" },
        },
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Tendências Mensais
    if (monthlyStats.length > 0) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(51, 51, 51);
      doc.text("Tendências Mensais", 20, yPosition);
      yPosition += 5;
      
      const monthlyData = monthlyStats.map((stat) => {
        const [year, month] = stat.month.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1)
          .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        
        return [
          monthName.charAt(0).toUpperCase() + monthName.slice(1),
          stat.total.toString(),
          stat.finalizadas.toString(),
          stat.aprovadas.toString(),
          stat.reprovadas.toString(),
        ];
      });
      
      autoTable(doc, {
        startY: yPosition,
        head: [["Mês/Ano", "Total", "Finalizadas", "Aprovadas", "Reprovadas"]],
        body: monthlyData,
        theme: "grid",
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 30, halign: "center" },
          2: { cellWidth: 30, halign: "center" },
          3: { cellWidth: 30, halign: "center" },
          4: { cellWidth: 30, halign: "center" },
        },
      });
    }
    
    // Aviso LGPD
    doc.addPage();
    let yPos = 20;
    
    doc.setFontSize(7);
    doc.setTextColor(30, 58, 138); // Azul escuro (blue-900)
    const lgpdText = "Os dados deste relatório estão protegidos pela Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). " +
                     "As informações são utilizadas exclusivamente para fins de gestão e análise de inspeções técnicas da CBMaq.";
    const lgpdLines = doc.splitTextToSize(lgpdText, 170);
    doc.text(lgpdLines, 105, yPos, { align: "center" });
    
    // Rodapé
    const finalPageCount = doc.getNumberOfPages();
    for (let i = 1; i <= finalPageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${finalPageCount} - Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
        105,
        290,
        { align: "center" }
      );
    }
    
    // Salvar PDF
    const fileName = `relatorio_gerencial_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
  };
  
  return (
    <Button onClick={generatePDF} disabled={disabled} variant="outline">
      <FileDown className="mr-2 h-4 w-4" />
      Exportar PDF
    </Button>
  );
}

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface InspectionData {
  id: string;
  inspection_date: string;
  process_type: "instalacao_entrada_target" | "entrada_cbmaq" | "saida_cbmaq";
  model: string;
  serial_number: string;
  horimeter: number;
  freight_responsible: string | null;
  status: string;
  general_observations: string | null;
  has_fault_codes: boolean;
  fault_codes_description: string | null;
  codes_corrected: boolean;
  entry_signature: string | null;
  entry_signature_date: string | null;
  entry_technician_id: string | null;
  entry_technician_name: string | null;
  exit_signature: string | null;
  exit_signature_date: string | null;
  exit_technician_id: string | null;
  exit_technician_name: string | null;
  driver_documents_url: string | null;
  driver_signature: string | null;
  driver_signature_date: string | null;
  driver_name: string | null;
  machine_models?: {
    name: string;
    image_url: string | null;
    category: string;
    line: string;
  } | null;
}

interface InspectionItem {
  category: string;
  item_description: string;
  entry_status: "A" | "B" | "C" | null;
  exit_status: "A" | "B" | "C" | null;
  problem_description: string | null;
}

interface PDFExportProps {
  inspection: InspectionData;
  items: InspectionItem[];
  disabled?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  geral: "Geral",
  motor: "Motor",
  transmissao: "Transmissão",
  eixos: "Eixos",
  freios: "Freios",
  hidraulico: "Sistema Hidráulico e Contrapeso",
  deslocamento: "Deslocamento e Direção",
  chassi: "Chassi e Articulação",
  eletrico: "Sistema Elétrico",
  cabine: "Cabine",
  ar_condicionado: "Ar Condicionado",
};

const STATUS_LABELS: Record<string, string> = {
  em_andamento: "Em Andamento",
  finalizada: "Finalizada",
  aprovada: "Aprovada",
  reprovada: "Reprovada",
};

const PROCESS_TYPE_LABELS: Record<string, string> = {
  instalacao_entrada_target: "Instalação Entrada Target",
  entrada_cbmaq: "Entrada CBMAQ",
  saida_cbmaq: "Saída CBMAQ",
};

export function PDFExport({ inspection, items, disabled }: PDFExportProps) {
  const generatePDF = async () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(51, 51, 51);
    doc.text("RELATÓRIO DE INSPEÇÃO TÉCNICA", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text("CBMaq - Inspeções", 105, 28, { align: "center" });
    
    // Linha separadora
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(20, 32, 190, 32);
    
    // Dados do Equipamento
    let yPosition = 42;
    
    // Adicionar imagem do modelo se disponível
    if (inspection.machine_models?.image_url) {
      try {
        doc.addImage(inspection.machine_models.image_url, "JPEG", 20, yPosition, 50, 35);
        yPosition += 40;
      } catch (error) {
        console.error("Erro ao adicionar imagem:", error);
      }
    }
    
    doc.setFontSize(14);
    doc.setTextColor(51, 51, 51);
    doc.text("Dados do Equipamento", 20, yPosition);
    yPosition += 3;
    
    doc.setFontSize(10);
    const equipmentData = [
      ["Tipo de Processo", PROCESS_TYPE_LABELS[inspection.process_type] || inspection.process_type],
      ["Data da Inspeção", new Date(inspection.inspection_date).toLocaleDateString("pt-BR")],
      ["Modelo", inspection.model],
      ["Número de Série", inspection.serial_number],
      ["Horímetro", `${inspection.horimeter}h`],
      ["Status", STATUS_LABELS[inspection.status] || inspection.status],
    ];
    
    if (inspection.machine_models) {
      equipmentData.push(["Linha", inspection.machine_models.line]);
      equipmentData.push(["Categoria", inspection.machine_models.category]);
    }
    
    if (inspection.freight_responsible) {
      equipmentData.push(["Responsável Frete", inspection.freight_responsible]);
    }
    
    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: equipmentData,
      theme: "plain",
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50 },
        1: { cellWidth: 120 },
      },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
    
    // Códigos de Falhas
    if (inspection.has_fault_codes) {
      doc.setFontSize(14);
      doc.text("Códigos de Falhas", 20, yPosition);
      yPosition += 7;
      
      doc.setFontSize(10);
      doc.text(`Códigos: ${inspection.fault_codes_description || "N/A"}`, 20, yPosition);
      yPosition += 5;
      doc.text(`Corrigidos: ${inspection.codes_corrected ? "Sim" : "Não"}`, 20, yPosition);
      yPosition += 10;
    }
    
    // Itens de Inspeção por Categoria
    doc.setFontSize(14);
    doc.text("Itens de Inspeção", 20, yPosition);
    yPosition += 5;
    
    const groupedItems: Record<string, InspectionItem[]> = {};
    items.forEach((item) => {
      if (!groupedItems[item.category]) {
        groupedItems[item.category] = [];
      }
      groupedItems[item.category].push(item);
    });
    
    Object.entries(groupedItems).forEach(([category, categoryItems]) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(59, 130, 246);
      doc.text(CATEGORY_LABELS[category] || category, 20, yPosition);
      yPosition += 5;
      
      const tableData = categoryItems.map((item) => [
        item.item_description,
        item.entry_status || "-",
        item.exit_status || "-",
        item.problem_description || "-",
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [["Item", "Entrada", "Saída", "Observações"]],
        body: tableData,
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
          0: { cellWidth: 80 },
          1: { cellWidth: 20, halign: "center" },
          2: { cellWidth: 20, halign: "center" },
          3: { cellWidth: 60 },
        },
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    });
    
    // Observações Gerais
    if (inspection.general_observations) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51);
      doc.text("Observações Gerais", 20, yPosition);
      yPosition += 7;
      
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(inspection.general_observations, 170);
      doc.text(splitText, 20, yPosition);
      yPosition += splitText.length * 5 + 10;
    }
    
    // Assinaturas
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(12);
    doc.text("Assinaturas", 20, yPosition);
    yPosition += 10;
    
    if (inspection.entry_signature) {
      doc.setFontSize(10);
      doc.text("Técnico Responsável pela Entrada:", 20, yPosition);
      yPosition += 5;
      
      if (inspection.entry_signature.startsWith("data:image")) {
        doc.addImage(inspection.entry_signature, "PNG", 20, yPosition, 60, 20);
        yPosition += 25;
      }
      
      doc.setFontSize(9);
      doc.text(`Técnico: ${inspection.entry_technician_name || "N/A"}`, 20, yPosition);
      yPosition += 4;
      doc.text(`ID: ${inspection.entry_technician_id || "N/A"}`, 20, yPosition);
      yPosition += 4;
      doc.text(
        `Data: ${inspection.entry_signature_date ? new Date(inspection.entry_signature_date).toLocaleDateString("pt-BR") : "N/A"}`,
        20,
        yPosition
      );
      yPosition += 10;
    }
    
    if (inspection.exit_signature) {
      doc.setFontSize(10);
      doc.text("Técnico Responsável pela Saída:", 20, yPosition);
      yPosition += 5;
      
      if (inspection.exit_signature.startsWith("data:image")) {
        doc.addImage(inspection.exit_signature, "PNG", 20, yPosition, 60, 20);
        yPosition += 25;
      }
      
      doc.setFontSize(9);
      doc.text(`Técnico: ${inspection.exit_technician_name || "N/A"}`, 20, yPosition);
      yPosition += 4;
      doc.text(`ID: ${inspection.exit_technician_id || "N/A"}`, 20, yPosition);
      yPosition += 4;
      doc.text(
        `Data: ${inspection.exit_signature_date ? new Date(inspection.exit_signature_date).toLocaleDateString("pt-BR") : "N/A"}`,
        20,
        yPosition
      );
      yPosition += 10;
    }
    
    // Assinatura do Motorista
    if (inspection.driver_signature && inspection.driver_name) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(10);
      doc.text("Assinatura do Motorista:", 20, yPosition);
      yPosition += 5;
      
      if (inspection.driver_signature.startsWith("data:image")) {
        doc.addImage(inspection.driver_signature, "PNG", 20, yPosition, 60, 20);
        yPosition += 25;
      }
      
      doc.setFontSize(9);
      doc.text(`Motorista: ${inspection.driver_name}`, 20, yPosition);
      yPosition += 4;
      doc.text(
        `Data: ${inspection.driver_signature_date ? new Date(inspection.driver_signature_date).toLocaleDateString("pt-BR") : "N/A"}`,
        20,
        yPosition
      );
      yPosition += 4;
      
      if (inspection.driver_documents_url) {
        doc.text("Documento do motorista anexado", 20, yPosition);
      }
    }
    
    // Aviso LGPD
    const currentPageCount = doc.getNumberOfPages();
    doc.setPage(currentPageCount);
    if (yPosition > 260) {
      doc.addPage();
      yPosition = 20;
    } else {
      yPosition += 10;
    }
    
    doc.setFontSize(7);
    doc.setTextColor(30, 58, 138); // Azul escuro (blue-900)
    const lgpdText = "Os dados desta inspeção estão protegidos pela Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). " +
                     "As informações são utilizadas exclusivamente para fins de gestão de inspeções técnicas da CBMaq.";
    const lgpdLines = doc.splitTextToSize(lgpdText, 170);
    doc.text(lgpdLines, 105, yPosition, { align: "center" });
    
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
    const fileName = `inspecao_${inspection.serial_number}_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
  };
  
  return (
    <Button onClick={generatePDF} disabled={disabled} variant="outline">
      <FileDown className="mr-2 h-4 w-4" />
      Exportar PDF
    </Button>
  );
}

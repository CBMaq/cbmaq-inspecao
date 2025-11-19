import { Badge } from "@/components/ui/badge";

interface ProcessTypeBadgeProps {
  processType: "instalacao_entrada_target" | "entrada_cbmaq" | "saida_cbmaq" | "entrega_governo" | "entrada_dnm" | "saida_dnm";
}

export const ProcessTypeBadge = ({ processType }: ProcessTypeBadgeProps) => {
  const variants = {
    instalacao_entrada_target: { 
      className: "bg-blue-500 text-white hover:bg-blue-600", 
      label: "PDI Target" 
    },
    entrada_cbmaq: { 
      className: "bg-green-500 text-white hover:bg-green-600", 
      label: "Entrada CBMAQ" 
    },
    saida_cbmaq: { 
      className: "bg-orange-500 text-white hover:bg-orange-600", 
      label: "Saída CBMAQ" 
    },
    entrada_dnm: { 
      className: "bg-cyan-500 text-white hover:bg-cyan-600", 
      label: "Entrada DNM" 
    },
    saida_dnm: { 
      className: "bg-teal-500 text-white hover:bg-teal-600", 
      label: "Saída DNM" 
    },
    entrega_governo: { 
      className: "bg-purple-500 text-white hover:bg-purple-600", 
      label: "Entrega Governo" 
    },
  };

  const variant = variants[processType];

  return <Badge className={variant.className}>{variant.label}</Badge>;
};

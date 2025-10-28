import { Badge } from "@/components/ui/badge";

interface ProcessTypeBadgeProps {
  processType: "instalacao_entrada_target" | "entrada_cbmaq" | "saida_cbmaq";
}

export const ProcessTypeBadge = ({ processType }: ProcessTypeBadgeProps) => {
  const variants = {
    instalacao_entrada_target: { 
      className: "bg-blue-500 text-white hover:bg-blue-600", 
      label: "Instalação Entrada Target" 
    },
    entrada_cbmaq: { 
      className: "bg-green-500 text-white hover:bg-green-600", 
      label: "Entrada CBMAQ" 
    },
    saida_cbmaq: { 
      className: "bg-orange-500 text-white hover:bg-orange-600", 
      label: "Saída CBMAQ" 
    },
  };

  const variant = variants[processType];

  return <Badge className={variant.className}>{variant.label}</Badge>;
};

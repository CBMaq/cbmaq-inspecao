import { Badge } from "@/components/ui/badge";

interface InspectionStatusBadgeProps {
  status: "em_andamento" | "finalizada" | "aprovada" | "reprovada";
}

export const InspectionStatusBadge = ({ status }: InspectionStatusBadgeProps) => {
  const variants = {
    em_andamento: { className: "bg-blue-500 text-white hover:bg-blue-600", label: "Em Andamento" },
    finalizada: { className: "bg-purple-500 text-white hover:bg-purple-600", label: "Finalizada" },
    aprovada: { className: "bg-success text-success-foreground hover:bg-success", label: "Aprovada" },
    reprovada: { className: "bg-destructive text-destructive-foreground hover:bg-destructive", label: "Reprovada" },
  };

  const variant = variants[status];

  return <Badge className={variant.className}>{variant.label}</Badge>;
};

import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "A" | "B" | "C" | null | undefined;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  if (!status) return <span className="text-muted-foreground">-</span>;

  const variants = {
    A: { className: "bg-success text-success-foreground hover:bg-success", label: "A - Satisfatório" },
    B: { className: "bg-warning text-warning-foreground hover:bg-warning", label: "B - Necessita Reparo" },
    C: { className: "bg-neutral text-neutral-foreground hover:bg-neutral", label: "C - Não se Aplica" },
  };

  const variant = variants[status];

  return (
    <Badge className={variant.className}>
      {variant.label}
    </Badge>
  );
};

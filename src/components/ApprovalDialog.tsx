import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle } from "lucide-react";

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (observations: string) => Promise<void>;
  onReject: (observations: string) => Promise<void>;
}

export function ApprovalDialog({
  open,
  onOpenChange,
  onApprove,
  onReject,
}: ApprovalDialogProps) {
  const [observations, setObservations] = useState("");
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  const handleAction = async (actionType: "approve" | "reject") => {
    setLoading(true);
    try {
      if (actionType === "approve") {
        await onApprove(observations);
      } else {
        await onReject(observations);
      }
      setObservations("");
      setAction(null);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!action) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revisão da Inspeção</DialogTitle>
            <DialogDescription>
              Você deseja aprovar ou reprovar esta inspeção?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={() => setAction("approve")}
              className="bg-success hover:bg-success/90"
              size="lg"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Aprovar Inspeção
            </Button>
            <Button
              onClick={() => setAction("reject")}
              variant="destructive"
              size="lg"
            >
              <XCircle className="mr-2 h-5 w-5" />
              Reprovar Inspeção
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === "approve" ? "Aprovar Inspeção" : "Reprovar Inspeção"}
          </DialogTitle>
          <DialogDescription>
            {action === "approve"
              ? "Adicione observações sobre a aprovação (opcional)"
              : "Descreva o motivo da reprovação (obrigatório)"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="observations">
              Observações {action === "reject" && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder={
                action === "approve"
                  ? "Adicione observações..."
                  : "Descreva o motivo da reprovação..."
              }
              rows={5}
              className="mt-2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setAction(null);
              setObservations("");
            }}
            disabled={loading}
          >
            Voltar
          </Button>
          <Button
            onClick={() => handleAction(action)}
            disabled={loading || (action === "reject" && !observations.trim())}
            variant={action === "approve" ? "default" : "destructive"}
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processando...
              </>
            ) : action === "approve" ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirmar Aprovação
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Confirmar Reprovação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

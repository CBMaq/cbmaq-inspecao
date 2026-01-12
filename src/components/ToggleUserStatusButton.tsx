import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { UserX, UserCheck } from "lucide-react";

interface ToggleUserStatusButtonProps {
  userId: string;
  userName: string;
  isActive: boolean;
  onStatusChanged: () => void;
}

export function ToggleUserStatusButton({ 
  userId, 
  userName, 
  isActive, 
  onStatusChanged 
}: ToggleUserStatusButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-toggle-user-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ 
          userId, 
          activate: !isActive 
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || "Erro ao alterar status do usuário");
      }

      toast.success(isActive ? "Usuário desativado" : "Usuário reativado", {
        description: isActive 
          ? "O usuário não poderá mais acessar o sistema" 
          : "O usuário pode acessar o sistema novamente",
      });
      setOpen(false);
      onStatusChanged();
    } catch (error: any) {
      console.error("Error toggling user status:", error);
      toast.error(error.message || "Erro ao alterar status do usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={isActive ? "text-amber-600 hover:text-amber-700" : "text-green-600 hover:text-green-700"}
          title={isActive ? "Desativar usuário" : "Reativar usuário"}
        >
          {isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isActive ? "Desativar Usuário" : "Reativar Usuário"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isActive ? (
              <>
                Deseja desativar o usuário <strong>{userName}</strong>? 
                Ele não poderá mais acessar o sistema, mas todos os seus processos e dados serão mantidos.
              </>
            ) : (
              <>
                Deseja reativar o usuário <strong>{userName}</strong>? 
                Ele poderá acessar o sistema novamente com as mesmas permissões.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleToggle}
            disabled={loading}
            className={isActive 
              ? "bg-amber-600 text-white hover:bg-amber-700" 
              : "bg-green-600 text-white hover:bg-green-700"
            }
          >
            {loading 
              ? (isActive ? "Desativando..." : "Reativando...") 
              : (isActive ? "Desativar" : "Reativar")
            }
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

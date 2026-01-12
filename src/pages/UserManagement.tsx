import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Shield, User, Mail, Send } from "lucide-react";
import { NewUserDialog } from "@/components/NewUserDialog";
import { ResetPasswordDialog } from "@/components/ResetPasswordDialog";
import { EditUserDialog } from "@/components/EditUserDialog";
import { DeleteUserDialog } from "@/components/DeleteUserDialog";
import { ToggleUserStatusButton } from "@/components/ToggleUserStatusButton";
import { TechnicianManagement } from "@/components/TechnicianManagement";
import { DriverManagement } from "@/components/DriverManagement";

interface UserWithRole {
  id: string;
  full_name: string;
  email?: string;
  role: string;
  isActive: boolean;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasAdminRole = roles?.some(r => r.role === "admin");
    
    if (!hasAdminRole) {
      toast.error("Acesso negado", {
        description: "Apenas administradores podem acessar esta página",
      });
      navigate("/");
      return;
    }

    setIsAdmin(true);
    fetchUsers();
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Buscar todos os perfis com email (admins podem ver)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      if (profilesError) throw profilesError;

      // Get current session to call edge function for user status
      const { data: { session } } = await supabase.auth.getSession();

      // Para cada perfil, verificar papel via RPC (bypass seguro de RLS)
      const usersWithRoles: UserWithRole[] = await Promise.all(
        (profiles || []).map(async (profile: any) => {
          const [{ data: isAdminRole }, { data: isSupervisor }] = await Promise.all([
            supabase.rpc("has_role", { _user_id: profile.id, _role: "admin" }),
            supabase.rpc("has_role", { _user_id: profile.id, _role: "supervisor" }),
          ]);

          let role: string = "tecnico";
          if (Boolean(isAdminRole)) role = "admin";
          else if (Boolean(isSupervisor)) role = "supervisor";

          return {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            role,
            isActive: true, // Default to active, will be checked via separate call if needed
          } as UserWithRole;
        })
      );

      // Fetch user status from auth (via edge function)
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-users-status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || ""}`,
          },
          body: JSON.stringify({ userIds: usersWithRoles.map(u => u.id) }),
        });

        if (response.ok) {
          const statusData = await response.json();
          if (statusData.users) {
            usersWithRoles.forEach(user => {
              const userStatus = statusData.users.find((u: any) => u.id === user.id);
              if (userStatus) {
                user.isActive = !userStatus.banned_until || new Date(userStatus.banned_until) < new Date();
              }
            });
          }
        }
      } catch (statusError) {
        console.error("Error fetching user statuses:", statusError);
        // Continue with default active status
      }

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Evita SELECT (bloqueado por RLS). Apenas remove e insere novamente.
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        throw deleteError;
      }

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role: newRole as any }]);

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      toast.success("Papel atualizado com sucesso");
      await fetchUsers();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error(error.message || "Erro ao atualizar papel do usuário");
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      admin: "destructive",
      supervisor: "default",
      tecnico: "secondary",
    };

    const labels: Record<string, string> = {
      admin: "Administrador",
      supervisor: "Supervisor",
      tecnico: "Técnico",
    };

    return (
      <Badge variant={variants[role] || "secondary"}>
        {labels[role] || role}
      </Badge>
    );
  };

  const sendTestEmail = async () => {
    setSendingTestEmail(true);
    try {
      console.log("Enviando email de teste...");
      
      // Fazer chamada HTTP direta com query parameter
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-inspection-notification?test=true`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();
      const error = !response.ok ? data : null;

      console.log("Resposta do teste:", { data, error, status: response.status });

      if (error) {
        console.error("Erro ao enviar email de teste:", error);
        toast.error("Erro ao enviar email de teste", {
          description: error.message || "Não foi possível enviar o email de teste",
        });
        return;
      }

      toast.success("Email de teste enviado!", {
        description: `Email enviado para ${data?.sent || 0} supervisor(es) CBMaq`,
      });
    } catch (error: any) {
      console.error("Erro ao enviar email de teste:", error);
      toast.error("Erro ao enviar email de teste", {
        description: error.message || "Erro desconhecido",
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Gestão de Usuários
            </h1>
            <p className="text-muted-foreground">
              Gerencie papéis e permissões dos usuários
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Usuários do Sistema</CardTitle>
                <CardDescription>
                  Atribua papéis aos usuários para controlar suas permissões
                </CardDescription>
              </div>
              <NewUserDialog onUserCreated={fetchUsers} />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando usuários...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Papel Atual</TableHead>
                    <TableHead>Alterar Papel</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className={!user.isActive ? "opacity-60" : ""}>
                      <TableCell className="font-medium">
                        {user.full_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value) => updateUserRole(user.id, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tecnico">Técnico</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <EditUserDialog
                            userId={user.id}
                            currentName={user.full_name}
                            currentEmail={user.email || ""}
                            onUserUpdated={fetchUsers}
                          />
                          <ResetPasswordDialog 
                            userId={user.id} 
                            userName={user.full_name}
                          />
                          <ToggleUserStatusButton
                            userId={user.id}
                            userName={user.full_name}
                            isActive={user.isActive}
                            onStatusChanged={fetchUsers}
                          />
                          <DeleteUserDialog
                            userId={user.id}
                            userName={user.full_name}
                            onUserDeleted={fetchUsers}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <TechnicianManagement />

        <DriverManagement />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Teste de Notificações
            </CardTitle>
            <CardDescription>
              Envie um email de teste para verificar o funcionamento do sistema de notificações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Este botão enviará um email de teste para todos os supervisores com email @cbmaq.com.br. 
                O email conterá dados fictícios de uma inspeção para fins de teste.
              </p>
              <Button 
                onClick={sendTestEmail} 
                disabled={sendingTestEmail}
                className="w-full sm:w-auto"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendingTestEmail ? "Enviando..." : "Enviar Email de Teste"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações sobre Papéis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Técnico</Badge>
              <p className="text-sm text-muted-foreground">
                Pode criar e editar suas próprias inspeções. Acesso básico ao sistema.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="default">Supervisor</Badge>
              <p className="text-sm text-muted-foreground">
                Pode visualizar todas as inspeções e aprovar/reprovar inspeções finalizadas.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="destructive">Administrador</Badge>
              <p className="text-sm text-muted-foreground">
                Acesso completo ao sistema, incluindo gestão de usuários e permissões.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

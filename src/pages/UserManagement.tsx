import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Shield, User } from "lucide-react";
import { NewUserDialog } from "@/components/NewUserDialog";

interface UserWithRole {
  id: string;
  full_name: string;
  email?: string;
  role: string;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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
      // Buscar todos os perfis (admins podem ver)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name");

      if (profilesError) throw profilesError;

      // Para cada perfil, verificar papel via RPC (bypass seguro de RLS)
      const usersWithRoles: UserWithRole[] = await Promise.all(
        (profiles || []).map(async (profile: any) => {
          const [{ data: isAdmin }, { data: isSupervisor }] = await Promise.all([
            supabase.rpc("has_role", { _user_id: profile.id, _role: "admin" }),
            supabase.rpc("has_role", { _user_id: profile.id, _role: "supervisor" }),
          ]);

          let role: string = "tecnico";
          if (Boolean(isAdmin)) role = "admin";
          else if (Boolean(isSupervisor)) role = "supervisor";

          return {
            id: profile.id,
            full_name: profile.full_name,
            role,
          } as UserWithRole;
        })
      );

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
                    <TableHead>Papel Atual</TableHead>
                    <TableHead>Alterar Papel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name}
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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

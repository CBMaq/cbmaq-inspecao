import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InspectionStatusBadge } from "@/components/InspectionStatusBadge";
import { Plus, Search, LogOut, FileText, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/AuthGuard";

interface Inspection {
  id: string;
  inspection_date: string;
  model: string;
  serial_number: string;
  status: "em_andamento" | "finalizada" | "aprovada" | "reprovada";
  created_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userName, setUserName] = useState<string>("");
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    fetchInspections();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setUserName(profile.full_name);
      }

      // Fetch user roles from new secure table
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      if (rolesData) {
        setUserRoles(rolesData.map((r: any) => r.role));
      }
    }
  };

  const fetchInspections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inspections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar inspeções",
        description: error.message,
      });
    } else {
      setInspections((data || []) as Inspection[]);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredInspections = inspections.filter((inspection) => {
    const matchesSearch =
      inspection.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || inspection.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card shadow-sm">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">CBMaq Inspeções</h1>
                <p className="text-sm text-muted-foreground">Sistema de Inspeção Técnica</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {userName && (
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">{userName}</span>
                    {userRoles.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {userRoles.map(r => {
                          const labels: Record<string, string> = {
                            admin: 'Admin',
                            supervisor: 'Supervisor',
                            tecnico: 'Técnico'
                          };
                          return labels[r] || r;
                        }).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold">Inspeções</h2>
              <p className="text-muted-foreground">Gerencie as inspeções técnicas</p>
            </div>
            <Button onClick={() => navigate("/nova-inspecao")} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Nova Inspeção
            </Button>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por modelo ou nº de série..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="finalizada">Finalizada</SelectItem>
                    <SelectItem value="aprovada">Aprovada</SelectItem>
                    <SelectItem value="reprovada">Reprovada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando inspeções...</p>
              </div>
            </div>
          ) : filteredInspections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma inspeção encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Tente ajustar os filtros de busca"
                    : "Comece criando sua primeira inspeção"}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Button onClick={() => navigate("/nova-inspecao")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Inspeção
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredInspections.map((inspection) => (
                <Card
                  key={inspection.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                  onClick={() => navigate(`/inspecao/${inspection.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{inspection.model}</CardTitle>
                        <p className="text-sm text-muted-foreground mb-3">
                          Nº Série: {inspection.serial_number}
                        </p>
                      </div>
                      <InspectionStatusBadge status={inspection.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(inspection.inspection_date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

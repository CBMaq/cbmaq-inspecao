import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, BarChart3, TrendingUp, Users, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TechnicianStats {
  technician_id: string;
  technician_name: string;
  total_inspections: number;
  em_andamento: number;
  finalizadas: number;
  aprovadas: number;
  reprovadas: number;
  approval_rate: number;
}

interface MonthlyStats {
  month: string;
  total: number;
  aprovadas: number;
  reprovadas: number;
  finalizadas: number;
}

export default function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [technicianStats, setTechnicianStats] = useState<TechnicianStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [totalStats, setTotalStats] = useState({
    total: 0,
    em_andamento: 0,
    finalizadas: 0,
    aprovadas: 0,
    reprovadas: 0,
    avg_time: 0,
  });

  useEffect(() => {
    checkSupervisorAccess();
  }, []);

  useEffect(() => {
    if (isSupervisor) {
      fetchReports();
    }
  }, [isSupervisor, selectedPeriod]);

  const checkSupervisorAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasSupervisorRole = roles?.some(r => r.role === "supervisor" || r.role === "admin");
    
    if (!hasSupervisorRole) {
      toast.error("Acesso negado", {
        description: "Apenas supervisores e administradores podem acessar relatórios",
      });
      navigate("/");
      return;
    }

    setIsSupervisor(true);
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const daysAgo = parseInt(selectedPeriod);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Fetch all inspections in period
      const { data: inspections, error: inspectionsError } = await supabase
        .from("inspections")
        .select("*")
        .gte("created_at", startDate.toISOString());

      if (inspectionsError) throw inspectionsError;

      // Fetch all profiles to match with technicians
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name");

      if (profilesError) throw profilesError;

      // Create a map of user_id to full_name
      const profilesMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      // Calculate total stats
      const stats = {
        total: inspections?.length || 0,
        em_andamento: inspections?.filter(i => i.status === "em_andamento").length || 0,
        finalizadas: inspections?.filter(i => i.status === "finalizada").length || 0,
        aprovadas: inspections?.filter(i => i.status === "aprovada").length || 0,
        reprovadas: inspections?.filter(i => i.status === "reprovada").length || 0,
        avg_time: 0,
      };

      // Calculate average time for completed inspections
      const completedInspections = inspections?.filter(
        i => i.status === "finalizada" || i.status === "aprovada" || i.status === "reprovada"
      );
      
      if (completedInspections && completedInspections.length > 0) {
        const totalTime = completedInspections.reduce((acc, inspection) => {
          const created = new Date(inspection.created_at);
          const updated = new Date(inspection.updated_at);
          return acc + (updated.getTime() - created.getTime());
        }, 0);
        stats.avg_time = Math.round(totalTime / completedInspections.length / (1000 * 60 * 60)); // hours
      }

      setTotalStats(stats);

      // Calculate stats by technician
      const techStats: Record<string, TechnicianStats> = {};
      
      inspections?.forEach(inspection => {
        const techId = inspection.created_by;
        const techName = profilesMap.get(techId) || "Desconhecido";
        
        if (!techStats[techId]) {
          techStats[techId] = {
            technician_id: techId,
            technician_name: techName,
            total_inspections: 0,
            em_andamento: 0,
            finalizadas: 0,
            aprovadas: 0,
            reprovadas: 0,
            approval_rate: 0,
          };
        }

        techStats[techId].total_inspections++;
        
        if (inspection.status === "em_andamento") techStats[techId].em_andamento++;
        if (inspection.status === "finalizada") techStats[techId].finalizadas++;
        if (inspection.status === "aprovada") techStats[techId].aprovadas++;
        if (inspection.status === "reprovada") techStats[techId].reprovadas++;
      });

      // Calculate approval rate
      Object.values(techStats).forEach(stat => {
        const reviewed = stat.aprovadas + stat.reprovadas;
        stat.approval_rate = reviewed > 0 ? (stat.aprovadas / reviewed) * 100 : 0;
      });

      setTechnicianStats(Object.values(techStats).sort((a, b) => b.total_inspections - a.total_inspections));

      // Calculate monthly stats
      const monthlyData: Record<string, MonthlyStats> = {};
      
      inspections?.forEach(inspection => {
        const date = new Date(inspection.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            total: 0,
            aprovadas: 0,
            reprovadas: 0,
            finalizadas: 0,
          };
        }

        monthlyData[monthKey].total++;
        if (inspection.status === "aprovada") monthlyData[monthKey].aprovadas++;
        if (inspection.status === "reprovada") monthlyData[monthKey].reprovadas++;
        if (inspection.status === "finalizada") monthlyData[monthKey].finalizadas++;
      });

      setMonthlyStats(Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month)));

    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Erro ao carregar relatórios");
    } finally {
      setLoading(false);
    }
  };

  if (!isSupervisor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Relatórios Gerenciais
            </h1>
            <p className="text-muted-foreground">
              Análise de desempenho e métricas do sistema
            </p>
          </div>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando relatórios...</p>
          </div>
        ) : (
          <>
            {/* Overall Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Inspeções
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalStats.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Últimos {selectedPeriod} dias
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Em Andamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{totalStats.em_andamento}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Aprovadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">{totalStats.aprovadas}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Reprovadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-destructive">{totalStats.reprovadas}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Tempo Médio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalStats.avg_time}h</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Para conclusão
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Technician Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Desempenho por Técnico
                </CardTitle>
                <CardDescription>
                  Estatísticas individuais dos técnicos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {technicianStats.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhuma inspeção encontrada no período</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Técnico</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Em Andamento</TableHead>
                        <TableHead className="text-center">Finalizadas</TableHead>
                        <TableHead className="text-center">Aprovadas</TableHead>
                        <TableHead className="text-center">Reprovadas</TableHead>
                        <TableHead className="text-center">Taxa de Aprovação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {technicianStats.map((stat) => (
                        <TableRow key={stat.technician_id}>
                          <TableCell className="font-medium">
                            {stat.technician_name}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{stat.total_inspections}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {stat.em_andamento}
                          </TableCell>
                          <TableCell className="text-center">
                            {stat.finalizadas}
                          </TableCell>
                          <TableCell className="text-center text-success">
                            {stat.aprovadas}
                          </TableCell>
                          <TableCell className="text-center text-destructive">
                            {stat.reprovadas}
                          </TableCell>
                          <TableCell className="text-center">
                            {stat.aprovadas + stat.reprovadas > 0 ? (
                              <Badge 
                                variant={stat.approval_rate >= 80 ? "default" : stat.approval_rate >= 60 ? "secondary" : "destructive"}
                              >
                                {stat.approval_rate.toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendências Mensais
                </CardTitle>
                <CardDescription>
                  Evolução das inspeções ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyStats.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum dado mensal disponível</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {monthlyStats.map((stat) => {
                      const [year, month] = stat.month.split('-');
                      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                      
                      return (
                        <div key={stat.month} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize">{monthName}</span>
                            <span className="text-sm text-muted-foreground">
                              Total: {stat.total}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="flex items-center gap-2 text-sm">
                              <AlertCircle className="h-4 w-4 text-warning" />
                              <span>Finalizadas: {stat.finalizadas}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-success" />
                              <span>Aprovadas: {stat.aprovadas}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <XCircle className="h-4 w-4 text-destructive" />
                              <span>Reprovadas: {stat.reprovadas}</span>
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                            {stat.aprovadas > 0 && (
                              <div 
                                className="bg-success" 
                                style={{ width: `${(stat.aprovadas / stat.total) * 100}%` }}
                              />
                            )}
                            {stat.finalizadas > 0 && (
                              <div 
                                className="bg-warning" 
                                style={{ width: `${(stat.finalizadas / stat.total) * 100}%` }}
                              />
                            )}
                            {stat.reprovadas > 0 && (
                              <div 
                                className="bg-destructive" 
                                style={{ width: `${(stat.reprovadas / stat.total) * 100}%` }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

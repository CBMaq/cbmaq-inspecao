import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AuthGuard } from "@/components/AuthGuard";
import { ArrowLeft, Truck, Clock, CheckCircle2, AlertCircle, TrendingUp, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GovernmentDelivery {
  id: string;
  processo_id: string;
  orgao_publico: string | null;
  cidade: string | null;
  uf: string | null;
  data_saida_cbmaq: string | null;
  data_prevista_entrega: string | null;
  data_entrega_efetiva: string | null;
  status_entrega: string;
  motorista_id: string | null;
  created_at: string;
}

interface Inspection {
  id: string;
  model: string;
  serial_number: string;
  inspection_date: string;
}

interface KPIData {
  total: number;
  aguardando: number;
  em_transito: number;
  entregues: number;
  com_pendencia: number;
  tempo_medio_dias: number;
  entregas_no_prazo: number;
  entregas_atrasadas: number;
}

export default function GovernmentDeliveryDashboard() {
  const navigate = useNavigate();
  const [kpiData, setKpiData] = useState<KPIData>({
    total: 0,
    aguardando: 0,
    em_transito: 0,
    entregues: 0,
    com_pendencia: 0,
    tempo_medio_dias: 0,
    entregas_no_prazo: 0,
    entregas_atrasadas: 0,
  });

  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ["government-deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entrega_governo" as any)
        .select(`
          *,
          inspections!processo_id (
            id,
            model,
            serial_number,
            inspection_date
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  useEffect(() => {
    if (deliveries.length > 0) {
      calculateKPIs();
    }
  }, [deliveries]);

  const calculateKPIs = () => {
    const total = deliveries.length;
    const aguardando = deliveries.filter((d: any) => d.status_entrega === "aguardando_saida").length;
    const em_transito = deliveries.filter((d: any) => d.status_entrega === "em_transito").length;
    const entregues = deliveries.filter((d: any) => d.status_entrega === "entregue").length;
    const com_pendencia = deliveries.filter((d: any) => d.status_entrega === "com_pendencia").length;

    // Calcular tempo médio de entrega
    const entregasComDatas = deliveries.filter(
      (d: any) => d.data_saida_cbmaq && d.data_entrega_efetiva
    );

    let tempo_medio_dias = 0;
    if (entregasComDatas.length > 0) {
      const totalDias = entregasComDatas.reduce((acc: number, d: any) => {
        const saida = new Date(d.data_saida_cbmaq);
        const entrega = new Date(d.data_entrega_efetiva);
        return acc + differenceInDays(entrega, saida);
      }, 0);
      tempo_medio_dias = Math.round(totalDias / entregasComDatas.length);
    }

    // Calcular entregas no prazo vs atrasadas
    const entregasComPrevisao = deliveries.filter(
      (d: any) => d.data_prevista_entrega && d.data_entrega_efetiva
    );
    
    const entregas_no_prazo = entregasComPrevisao.filter((d: any) => {
      const prevista = new Date(d.data_prevista_entrega);
      const efetiva = new Date(d.data_entrega_efetiva);
      return efetiva <= prevista;
    }).length;

    const entregas_atrasadas = entregasComPrevisao.length - entregas_no_prazo;

    setKpiData({
      total,
      aguardando,
      em_transito,
      entregues,
      com_pendencia,
      tempo_medio_dias,
      entregas_no_prazo,
      entregas_atrasadas,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      aguardando_saida: { className: "bg-yellow-500 text-white", label: "Aguardando" },
      em_transito: { className: "bg-blue-500 text-white", label: "Em Trânsito" },
      entregue: { className: "bg-green-500 text-white", label: "Entregue" },
      com_pendencia: { className: "bg-red-500 text-white", label: "Pendência" },
    };
    const variant = variants[status] || variants.aguardando_saida;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  // Dados para gráfico de pizza (status)
  const pieData = [
    { name: "Aguardando Saída", value: kpiData.aguardando, color: "#eab308" },
    { name: "Em Trânsito", value: kpiData.em_transito, color: "#3b82f6" },
    { name: "Entregues", value: kpiData.entregues, color: "#22c55e" },
    { name: "Com Pendência", value: kpiData.com_pendencia, color: "#ef4444" },
  ].filter(item => item.value > 0);

  // Dados para gráfico de barras (por UF)
  const deliveriesByUF = deliveries.reduce((acc: any, d: any) => {
    const uf = d.uf || "Não informado";
    acc[uf] = (acc[uf] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.entries(deliveriesByUF).map(([uf, count]) => ({
    uf,
    entregas: count,
  }));

  // Dados para gráfico de prazo
  const prazoData = [
    { name: "No Prazo", value: kpiData.entregas_no_prazo, color: "#22c55e" },
    { name: "Atrasadas", value: kpiData.entregas_atrasadas, color: "#ef4444" },
  ].filter(item => item.value > 0);

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background p-4 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Truck className="h-8 w-8" />
                Dashboard - Entregas Governo
              </h1>
              <p className="text-muted-foreground">
                Métricas e indicadores de performance das entregas governamentais
              </p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total de Entregas</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpiData.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Todas as entregas registradas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Em Trânsito</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpiData.em_transito}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Máquinas sendo transportadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpiData.entregues}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Entregas finalizadas com sucesso
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpiData.tempo_medio_dias} dias</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Da saída até a entrega
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status das Entregas</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-10">
                    Nenhum dado disponível
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Entregas por UF</CardTitle>
              </CardHeader>
              <CardContent>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="uf" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="entregas" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-10">
                    Nenhum dado disponível
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cumprimento de Prazo</CardTitle>
              </CardHeader>
              <CardContent>
                {prazoData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={prazoData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => 
                          `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {prazoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-10">
                    Nenhum dado de prazo disponível
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicadores de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Aguardando Saída</p>
                    <p className="text-xs text-muted-foreground">Máquinas prontas para transporte</p>
                  </div>
                  <div className="text-2xl font-bold">{kpiData.aguardando}</div>
                </div>

                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Com Pendência</p>
                    <p className="text-xs text-muted-foreground">Entregas com problemas</p>
                  </div>
                  <div className="text-2xl font-bold">{kpiData.com_pendencia}</div>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Taxa de Sucesso</p>
                    <p className="text-xs text-muted-foreground">Entregas bem-sucedidas</p>
                  </div>
                  <div className="text-2xl font-bold">
                    {kpiData.total > 0 
                      ? `${Math.round((kpiData.entregues / kpiData.total) * 100)}%`
                      : "0%"
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Entregas Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Entregas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Órgão</TableHead>
                    <TableHead>Máquina</TableHead>
                    <TableHead>Cidade/UF</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead>Entrega</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.slice(0, 10).map((delivery: any) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-medium">
                        {delivery.orgao_publico || "-"}
                      </TableCell>
                      <TableCell>
                        {delivery.inspections?.model || "-"}
                        <div className="text-xs text-muted-foreground">
                          S/N: {delivery.inspections?.serial_number || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {delivery.cidade && delivery.uf 
                          ? `${delivery.cidade}/${delivery.uf}`
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        {delivery.data_saida_cbmaq
                          ? format(new Date(delivery.data_saida_cbmaq), "dd/MM/yyyy", { locale: ptBR })
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        {delivery.data_entrega_efetiva
                          ? format(new Date(delivery.data_entrega_efetiva), "dd/MM/yyyy", { locale: ptBR })
                          : delivery.data_prevista_entrega
                          ? format(new Date(delivery.data_prevista_entrega), "dd/MM/yyyy", { locale: ptBR }) + " (prev.)"
                          : "-"
                        }
                      </TableCell>
                      <TableCell>{getStatusBadge(delivery.status_entrega)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/inspecao/${delivery.processo_id}`)}
                        >
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {deliveries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Nenhuma entrega governo registrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}

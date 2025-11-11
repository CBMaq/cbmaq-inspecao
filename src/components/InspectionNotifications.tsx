import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProcessTypeBadge } from "@/components/ProcessTypeBadge";

interface Inspection {
  id: string;
  model: string;
  serial_number: string;
  process_type: "instalacao_entrada_target" | "entrada_cbmaq" | "saida_cbmaq";
  inspection_date: string;
  created_at: string;
}

interface InspectionNotificationsProps {
  userRoles: string[];
}

export function InspectionNotifications({ userRoles }: InspectionNotificationsProps) {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificar se usuário é supervisor ou admin
  const canViewNotifications = userRoles.includes("supervisor") || userRoles.includes("admin");

  useEffect(() => {
    if (!canViewNotifications) return;

    fetchInProgressInspections();

    // Configurar Realtime
    const channel = supabase
      .channel("inspections-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inspections",
        },
        (payload) => {
          console.log("Realtime update:", payload);
          fetchInProgressInspections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canViewNotifications]);

  const fetchInProgressInspections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inspections")
      .select("id, model, serial_number, process_type, inspection_date, created_at")
      .eq("status", "em_andamento")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setInspections(data as Inspection[]);
    }
    setLoading(false);
  };

  if (!canViewNotifications || inspections.length === 0) {
    return null;
  }

  return (
    <Card className="border-warning/50 shadow-lg mb-6">
      <CardContent className="p-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className={`h-5 w-5 text-warning ${inspections.length > 0 ? 'animate-pulse' : ''}`} />
              {inspections.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-warning text-warning-foreground rounded-full text-xs flex items-center justify-center font-bold">
                  {inspections.length}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Processos em Andamento</h3>
              <p className="text-sm text-muted-foreground">
                {inspections.length} {inspections.length === 1 ? "inspeção aguardando" : "inspeções aguardando"} finalização
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3 animate-in slide-in-from-top-2">
            {loading ? (
              <div className="text-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
              </div>
            ) : (
              inspections.map((inspection) => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">{inspection.model}</p>
                      <ProcessTypeBadge processType={inspection.process_type} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Nº Série: {inspection.serial_number}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Iniciado em {new Date(inspection.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/inspecao/${inspection.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

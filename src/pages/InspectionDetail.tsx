import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/AuthGuard";
import { ArrowLeft, Save, CheckCircle2, Camera, FileText, XCircle, Trash2 } from "lucide-react";
import { InspectionStatusBadge } from "@/components/InspectionStatusBadge";
import { ProcessTypeBadge } from "@/components/ProcessTypeBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { PhotoUpload } from "@/components/PhotoUpload";
import { SignaturePad } from "@/components/SignaturePad";
import { PDFExport } from "@/components/PDFExport";
import { ApprovalDialog } from "@/components/ApprovalDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DriverDocumentUpload } from "@/components/DriverDocumentUpload";
import { Input } from "@/components/ui/input";
import { observationSchema } from "@/lib/validations";
import { z } from "zod";

interface InspectionData {
  id: string;
  inspection_date: string;
  process_type: "instalacao_entrada_target" | "entrada_cbmaq" | "saida_cbmaq";
  model: string;
  serial_number: string;
  horimeter: number;
  freight_responsible: string | null;
  status: "em_andamento" | "finalizada" | "aprovada" | "reprovada";
  general_observations: string | null;
  approval_observations: string | null;
  approved_at: string | null;
  has_fault_codes: boolean;
  fault_codes_description: string | null;
  codes_corrected: boolean;
  entry_signature: string | null;
  entry_signature_date: string | null;
  entry_technician_id: string | null;
  entry_technician_name: string | null;
  exit_signature: string | null;
  exit_signature_date: string | null;
  exit_technician_id: string | null;
  exit_technician_name: string | null;
  driver_documents_url: string | null;
  driver_signature: string | null;
  driver_signature_date: string | null;
  driver_name: string | null;
}

interface InspectionItem {
  id?: string;
  category: string;
  item_description: string;
  entry_status: "A" | "B" | "C" | null;
  exit_status: "A" | "B" | "C" | null;
  problem_description: string | null;
}

const INSPECTION_CATEGORIES = {
  geral: {
    name: "Geral",
    items: [
      "Verificação visual do equipamento",
      "Verificar as condições do equipamento em geral",
      "Verificar anomalias na pintura (arranhões e manchas)",
      "Verificar se possui caixa de ferramenta",
      "Verificar aparelho de CD/Radio",
      "Verificar todas a proteções inferiores do chassi",
      "Verificar a calibração/danos dos pneus",
      "Verificar manuais (Manutenção e operação, catálogo de peças e certificado de garantia)",
      "Verificar adesivos",
      "Verificar giroflex",
      "Verificar chaves",
    ],
  },
  motor: {
    name: "Motor",
    items: [
      "Nível de óleo",
      "Sistema de combustível com relação a vazamento",
      "Filtros de óleo (Combustível e lubrificante)",
      "Cabo de aceleração, estrangulador; se necessário, lubrifique e ajuste",
      "Fixação do motor, carcaça do filtro de ar, alternador, motor de arranque e ventilador",
      "Tensão das correias",
      "Nível do fluido de refrigeração; se necessário completar",
      "Sistema de arrefecimento, funcionamento",
      "Existência de qualquer tipo de vazamento",
    ],
  },
  transmissao: {
    name: "Transmissão",
    items: [
      "Funcionamento geral",
      "Troca de marchas",
      "Vazamentos",
      "Temperatura de funcionamento",
      "Pressão e nível de óleo",
      "Filtro de óleo",
    ],
  },
  eixos: {
    name: "Eixos",
    items: [
      "Lubrificação de pinos e buchas",
      "Eixos cardans",
      "Torque dos parafusos",
      "Vazamentos",
      "Nível de óleo",
    ],
  },
  freios: {
    name: "Freios",
    items: [
      "Vazamentos",
      "Eficiência e funcionamento do sistema",
      "Sensores e interruptores",
      "Freio de estacionamento",
      "Oxidação dos discos e pinças",
      "Nível de óleo",
    ],
  },
  hidraulico: {
    name: "Sistema Hidráulico e Contrapeso",
    items: [
      "Funcionamento",
      "Danos e oxidação nos braços",
      "Lubrificação",
      "Barulhos anormais",
      "Vazamentos",
      "Verificação dos contrapesos",
    ],
  },
  deslocamento: {
    name: "Deslocamento e Direção",
    items: [
      "Funcionamento",
      "Barulhos anormais",
      "Vazamentos",
    ],
  },
  chassi: {
    name: "Chassi e Articulação",
    items: [
      "Funcionamento",
      "Lubrificação dos cilindros de direção, pinos e buchas",
      "Folgas na articulação",
      "Vazamentos",
    ],
  },
  eletrico: {
    name: "Sistema Elétrico",
    items: [
      "Funcionamento completo (bateria, iluminação, sensores)",
      "Montagem do chicote",
      "Fusíveis",
      "Alternador",
      "Motor de partida",
    ],
  },
  cabine: {
    name: "Cabine",
    items: [
      "Montagem geral",
      "Controles (joystick, alavancas)",
      "Assento e ajustes",
      "Coluna de direção",
      "Painel de instrumentos",
      "Rádio (montagem e teste)",
    ],
  },
  ar_condicionado: {
    name: "Ar Condicionado",
    items: [
      "Montagem e funcionamento",
      "Ventilador e difusores",
      "Painel de controle",
      "Vazamento de gás",
    ],
  },
};

export default function InspectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inspection, setInspection] = useState<InspectionData | null>(null);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [confirmFinalizeOpen, setConfirmFinalizeOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [technicians, setTechnicians] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (id) {
      fetchInspection();
      fetchUserRoles();
      fetchTechnicians();
    }
  }, [id]);

  const fetchUserRoles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      if (rolesData) {
        setUserRoles(rolesData.map((r: any) => r.role));
      }
    }
  };

  const fetchTechnicians = async () => {
    const { data, error } = await supabase
      .from("technicians")
      .select("id, name")
      .order("name");
    
    if (!error && data) {
      setTechnicians(data);
    }
  };

  const fetchInspection = async () => {
    setLoading(true);
    
    const { data: inspectionData, error: inspectionError } = await supabase
      .from("inspections")
      .select(`
        *,
        machine_models (
          name,
          image_url,
          category,
          line
        )
      `)
      .eq("id", id)
      .single();

    if (inspectionError) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar inspeção",
        description: inspectionError.message,
      });
      navigate("/");
      return;
    }

    setInspection(inspectionData as InspectionData);

    const { data: itemsData } = await supabase
      .from("inspection_items")
      .select("*")
      .eq("inspection_id", id);

    if (itemsData && itemsData.length > 0) {
      setItems(itemsData as InspectionItem[]);
    } else {
      initializeItems();
    }

    setLoading(false);
  };

  const initializeItems = () => {
    const allItems: InspectionItem[] = [];
    Object.entries(INSPECTION_CATEGORIES).forEach(([category, { items: categoryItems }]) => {
      categoryItems.forEach((itemDesc) => {
        allItems.push({
          category,
          item_description: itemDesc,
          entry_status: null,
          exit_status: null,
          problem_description: null,
        });
      });
    });
    setItems(allItems);
  };

  const updateItem = (index: number, field: keyof InspectionItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Determine which columns to show based on process type
  const getVisibleColumns = () => {
    if (!inspection) return { showEntry: true, showExit: true };
    
    switch (inspection.process_type) {
      case "instalacao_entrada_target":
        return { showEntry: true, showExit: false };
      case "entrada_cbmaq":
        return { showEntry: true, showExit: false };
      case "saida_cbmaq":
        return { showEntry: false, showExit: true };
      default:
        return { showEntry: true, showExit: true };
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      // Salvar itens de inspeção
      const { error: deleteError } = await supabase
        .from("inspection_items")
        .delete()
        .eq("inspection_id", id);

      if (deleteError) throw deleteError;

      const itemsToInsert = items.map((item) => ({
        inspection_id: id,
        category: item.category,
        item_description: item.item_description,
        entry_status: item.entry_status,
        exit_status: item.exit_status,
        problem_description: item.problem_description,
      }));

      const { error: insertError } = await supabase
        .from("inspection_items")
        .insert(itemsToInsert);

      if (insertError) throw insertError;

      toast({
        title: "Salvo com sucesso!",
        description: "As informações foram atualizadas.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("inspections")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Inspeção excluída",
        description: "A inspeção foi excluída com sucesso.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error.message,
      });
    }
  };

  const handleFinalize = async () => {
    if (!inspection.entry_signature || !inspection.exit_signature) {
      toast({
        variant: "destructive",
        title: "Assinaturas obrigatórias",
        description: "É necessário ter as assinaturas de entrada e saída para finalizar.",
      });
      return;
    }

    const { error } = await supabase
      .from("inspections")
      .update({ status: "finalizada" })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao finalizar",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Inspeção finalizada!",
      description: "A inspeção foi concluída e aguarda aprovação.",
    });

    await fetchInspection();
  };

  const handleApprove = async (observations: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("inspections")
      .update({
        status: "aprovada",
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
        approval_observations: observations,
      })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao aprovar",
        description: error.message,
      });
      throw error;
    }

    toast({
      title: "Inspeção aprovada!",
      description: "A inspeção foi aprovada com sucesso.",
    });

    await fetchInspection();
  };

  const handleReject = async (observations: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("inspections")
      .update({
        status: "reprovada",
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
        approval_observations: observations,
      })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao reprovar",
        description: error.message,
      });
      throw error;
    }

    toast({
      variant: "destructive",
      title: "Inspeção reprovada",
      description: "A inspeção foi reprovada.",
    });

    await fetchInspection();
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando inspeção...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!inspection) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-20">
        <header className="border-b bg-card shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              {userRoles.includes("admin") && (
                <Button
                  variant="outline"
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Inspeção
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Inspeção Técnica</h1>
                <p className="text-muted-foreground">
                  {inspection.model} - {inspection.serial_number}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <InspectionStatusBadge status={inspection.status} />
                <ProcessTypeBadge processType={inspection.process_type} />
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-5xl">
          {(inspection.status === "aprovada" || inspection.status === "reprovada") && (
            <Card className="mb-6 border-2" style={{ borderColor: inspection.status === "aprovada" ? "hsl(var(--success))" : "hsl(var(--destructive))" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {inspection.status === "aprovada" ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      Inspeção Aprovada
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-destructive" />
                      Inspeção Reprovada
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-muted-foreground">Observações do Supervisor</Label>
                  <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-3">
                    {inspection.approval_observations || "Sem observações"}
                  </p>
                </div>
                {inspection.approved_at && (
                  <div>
                    <Label className="text-muted-foreground">Data da Revisão</Label>
                    <p className="font-medium">
                      {new Date(inspection.approved_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Dados do Equipamento</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label className="text-muted-foreground">Tipo de Processo</Label>
                <div className="mt-1">
                  <ProcessTypeBadge processType={inspection.process_type} />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Data</Label>
                <p className="font-medium">
                  {new Date(inspection.inspection_date).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Modelo</Label>
                <p className="font-medium">{inspection.model}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Nº de Série</Label>
                <p className="font-medium">{inspection.serial_number}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Horímetro</Label>
                <p className="font-medium">{inspection.horimeter}h</p>
              </div>
              {inspection.freight_responsible && (
                <div>
                  <Label className="text-muted-foreground">Responsável Frete</Label>
                  <p className="font-medium">{inspection.freight_responsible}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Critérios de Avaliação</CardTitle>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  <span className="text-sm">A - Condição satisfatória</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-warning" />
                  <span className="text-sm">B - Necessário reparo ou ajuste</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-neutral" />
                  <span className="text-sm">C - Não se aplica</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {Object.entries(INSPECTION_CATEGORIES).map(([categoryKey, { name }]) => {
                  const categoryItems = items.filter((item) => item.category === categoryKey);
                  
                  return (
                    <AccordionItem key={categoryKey} value={categoryKey}>
                      <AccordionTrigger className="text-lg font-semibold">
                        {name}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-6 pt-4">
                          {categoryItems.map((item, index) => {
                            const globalIndex = items.findIndex(
                              (i) =>
                                i.category === item.category &&
                                i.item_description === item.item_description
                            );

                            return (
                              <Card key={`${item.category}-${index}`} className="border-l-4 border-l-primary">
                                <CardContent className="pt-6">
                                   <p className="font-medium mb-4">{item.item_description}</p>
                                   
                                   <div className={`grid gap-4 mb-4 ${getVisibleColumns().showEntry && getVisibleColumns().showExit ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
                                     {getVisibleColumns().showEntry && (
                                       <div>
                                         <Label className="mb-2 block">Entrada</Label>
                                         <RadioGroup
                                           value={item.entry_status || ""}
                                           onValueChange={(value) =>
                                             updateItem(globalIndex, "entry_status", value as "A" | "B" | "C")
                                           }
                                           className="flex gap-4"
                                         >
                                           <div className="flex items-center space-x-2">
                                             <RadioGroupItem value="A" id={`entry-a-${globalIndex}`} />
                                             <Label htmlFor={`entry-a-${globalIndex}`} className="cursor-pointer">
                                               A
                                             </Label>
                                           </div>
                                           <div className="flex items-center space-x-2">
                                             <RadioGroupItem value="B" id={`entry-b-${globalIndex}`} />
                                             <Label htmlFor={`entry-b-${globalIndex}`} className="cursor-pointer">
                                               B
                                             </Label>
                                           </div>
                                           <div className="flex items-center space-x-2">
                                             <RadioGroupItem value="C" id={`entry-c-${globalIndex}`} />
                                             <Label htmlFor={`entry-c-${globalIndex}`} className="cursor-pointer">
                                               C
                                             </Label>
                                           </div>
                                         </RadioGroup>
                                       </div>
                                     )}

                                     {getVisibleColumns().showExit && (
                                       <div>
                                         <Label className="mb-2 block">Saída</Label>
                                         <RadioGroup
                                           value={item.exit_status || ""}
                                           onValueChange={(value) =>
                                             updateItem(globalIndex, "exit_status", value as "A" | "B" | "C")
                                           }
                                           className="flex gap-4"
                                         >
                                           <div className="flex items-center space-x-2">
                                             <RadioGroupItem value="A" id={`exit-a-${globalIndex}`} />
                                             <Label htmlFor={`exit-a-${globalIndex}`} className="cursor-pointer">
                                               A
                                             </Label>
                                           </div>
                                           <div className="flex items-center space-x-2">
                                             <RadioGroupItem value="B" id={`exit-b-${globalIndex}`} />
                                             <Label htmlFor={`exit-b-${globalIndex}`} className="cursor-pointer">
                                               B
                                             </Label>
                                           </div>
                                           <div className="flex items-center space-x-2">
                                             <RadioGroupItem value="C" id={`exit-c-${globalIndex}`} />
                                             <Label htmlFor={`exit-c-${globalIndex}`} className="cursor-pointer">
                                               C
                                             </Label>
                                           </div>
                                         </RadioGroup>
                                       </div>
                                     )}
                                   </div>

                                  {(item.entry_status === "B" || item.exit_status === "B") && (
                                    <div>
                                      <Label htmlFor={`problem-${globalIndex}`} className="mb-2 block">
                                        Descrição do Problema
                                      </Label>
                                      <Textarea
                                        id={`problem-${globalIndex}`}
                                        value={item.problem_description || ""}
                                        onChange={(e) =>
                                          updateItem(globalIndex, "problem_description", e.target.value)
                                        }
                                        placeholder="Descreva o problema encontrado..."
                                        rows={3}
                                      />
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Códigos de Falhas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_fault_codes"
                  checked={inspection.has_fault_codes}
                  onCheckedChange={async (checked) => {
                    await supabase
                      .from("inspections")
                      .update({ has_fault_codes: checked as boolean })
                      .eq("id", id);
                    setInspection({ ...inspection, has_fault_codes: checked as boolean });
                  }}
                />
                <Label htmlFor="has_fault_codes" className="cursor-pointer">
                  Existe código de falhas?
                </Label>
              </div>

              {inspection.has_fault_codes && (
                <>
                  <div>
                    <Label htmlFor="fault_codes" className="mb-2 block">
                      Quais códigos?
                    </Label>
                    <Textarea
                      id="fault_codes"
                      value={inspection.fault_codes_description || ""}
                      onChange={(e) =>
                        setInspection({ ...inspection, fault_codes_description: e.target.value })
                      }
                      onBlur={async (e) => {
                        try {
                          const validated = observationSchema.parse({ 
                            fault_codes_description: e.target.value 
                          });
                          await supabase
                            .from("inspections")
                            .update({ fault_codes_description: validated.fault_codes_description })
                            .eq("id", id);
                        } catch (error) {
                          if (error instanceof z.ZodError) {
                            toast({
                              variant: "destructive",
                              title: "Texto muito longo",
                              description: error.errors[0].message,
                            });
                            // Revert to previous value
                            fetchInspection();
                          }
                        }
                      }}
                      placeholder="Liste os códigos de falha..."
                      rows={3}
                      maxLength={1000}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="codes_corrected"
                      checked={inspection.codes_corrected}
                      onCheckedChange={async (checked) => {
                        await supabase
                          .from("inspections")
                          .update({ codes_corrected: checked as boolean })
                          .eq("id", id);
                        setInspection({ ...inspection, codes_corrected: checked as boolean });
                      }}
                    />
                    <Label htmlFor="codes_corrected" className="cursor-pointer">
                      Foram corrigidos e apagados?
                    </Label>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Observações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={inspection.general_observations || ""}
                onChange={(e) =>
                  setInspection({ ...inspection, general_observations: e.target.value })
                }
                onBlur={async (e) => {
                  try {
                    const validated = observationSchema.parse({ 
                      general_observations: e.target.value 
                    });
                    await supabase
                      .from("inspections")
                      .update({ general_observations: validated.general_observations })
                      .eq("id", id);
                  } catch (error) {
                    if (error instanceof z.ZodError) {
                      toast({
                        variant: "destructive",
                        title: "Texto muito longo",
                        description: error.errors[0].message,
                      });
                      // Revert to previous value
                      fetchInspection();
                    }
                  }
                }}
                placeholder="Adicione observações gerais sobre a inspeção..."
                rows={5}
                maxLength={2000}
              />
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Fotos da Inspeção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <PhotoUpload
                inspectionId={id!}
                photoType="machine_entry"
                label="Máquina na Entrada"
              />
              <PhotoUpload
                inspectionId={id!}
                photoType="machine_exit"
                label="Máquina na Saída"
              />
              <PhotoUpload
                inspectionId={id!}
                photoType="horimeter"
                label="Horímetro"
              />
              <PhotoUpload
                inspectionId={id!}
                photoType="identification_plates"
                label="Plaquetas de Identificação"
              />
              <PhotoUpload
                inspectionId={id!}
                photoType="engine"
                label="Motor (Direito/Esquerdo)"
              />
              <PhotoUpload
                inspectionId={id!}
                photoType="front"
                label="Frente"
              />
              <PhotoUpload
                inspectionId={id!}
                photoType="sides"
                label="Laterais"
              />
              <PhotoUpload
                inspectionId={id!}
                photoType="rear"
                label="Traseira"
              />
              <PhotoUpload
                inspectionId={id!}
                photoType="cabin"
                label="Cabine"
              />
              <PhotoUpload
                inspectionId={id!}
                photoType="keys"
                label="Chaves"
              />
              <PhotoUpload
                inspectionId={id!}
                photoType="toolbox"
                label="Caixa de Ferramentas"
              />
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações do Motorista
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="driver_name">Nome do Motorista</Label>
                <Input
                  id="driver_name"
                  value={inspection.driver_name || ""}
                  onChange={(e) =>
                    setInspection({ ...inspection, driver_name: e.target.value })
                  }
                  onBlur={async (e) => {
                    await supabase
                      .from("inspections")
                      .update({ driver_name: e.target.value })
                      .eq("id", id);
                  }}
                  placeholder="Digite o nome do motorista"
                />
              </div>

              <DriverDocumentUpload
                inspectionId={id!}
                existingDocumentUrl={inspection.driver_documents_url}
                onUploadComplete={fetchInspection}
              />

              <SignaturePad
                label="Assinatura do Motorista"
                existingSignature={inspection.driver_signature}
                existingTechnicianId={null}
                existingTechnicianName={inspection.driver_name}
                existingDate={inspection.driver_signature_date}
                technicians={[]}
                hideTechnicianSelection={true}
                onSign={async (signature, _technicianId, _technicianName, date) => {
                  const { error } = await supabase
                    .from("inspections")
                    .update({
                      driver_signature: signature,
                      driver_signature_date: date,
                    })
                    .eq("id", id);
                  
                  if (error) {
                    toast({
                      variant: "destructive",
                      title: "Erro ao salvar assinatura",
                      description: error.message,
                    });
                    return;
                  }
                  
                  setInspection({
                    ...inspection,
                    driver_signature: signature,
                    driver_signature_date: date,
                  });

                  toast({
                    title: "Assinatura do motorista salva!",
                    description: "A assinatura foi registrada com sucesso.",
                  });
                }}
              />
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Assinaturas Digitais dos Técnicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SignaturePad
                label="Técnico Responsável pela Entrada"
                existingSignature={inspection.entry_signature}
                existingTechnicianId={inspection.entry_technician_id}
                existingTechnicianName={inspection.entry_technician_name}
                existingDate={inspection.entry_signature_date}
                technicians={technicians}
                onSign={async (signature, technicianId, technicianName, date) => {
                  const { error } = await supabase
                    .from("inspections")
                    .update({
                      entry_signature: signature,
                      entry_technician_id: technicianId,
                      entry_technician_name: technicianName,
                      entry_signature_date: date,
                    })
                    .eq("id", id);
                  
                  if (error) {
                    toast({
                      variant: "destructive",
                      title: "Erro ao salvar assinatura",
                      description: error.message,
                    });
                    return;
                  }
                  
                  setInspection({
                    ...inspection,
                    entry_signature: signature,
                    entry_technician_id: technicianId,
                    entry_technician_name: technicianName,
                    entry_signature_date: date,
                  });

                  toast({
                    title: "Assinatura de entrada salva!",
                    description: "A assinatura foi registrada com sucesso.",
                  });
                }}
              />

              <SignaturePad
                label="Técnico Responsável pela Saída"
                existingSignature={inspection.exit_signature}
                existingTechnicianId={inspection.exit_technician_id}
                existingTechnicianName={inspection.exit_technician_name}
                existingDate={inspection.exit_signature_date}
                technicians={technicians}
                onSign={async (signature, technicianId, technicianName, date) => {
                  const { error } = await supabase
                    .from("inspections")
                    .update({
                      exit_signature: signature,
                      exit_technician_id: technicianId,
                      exit_technician_name: technicianName,
                      exit_signature_date: date,
                    })
                    .eq("id", id);
                  
                  if (error) {
                    toast({
                      variant: "destructive",
                      title: "Erro ao salvar assinatura",
                      description: error.message,
                    });
                    return;
                  }
                  
                  setInspection({
                    ...inspection,
                    exit_signature: signature,
                    exit_technician_id: technicianId,
                    exit_technician_name: technicianName,
                    exit_signature_date: date,
                  });

                  toast({
                    title: "Assinatura de saída salva!",
                    description: "A assinatura foi registrada com sucesso.",
                  });
                }}
              />
            </CardContent>
          </Card>
        </main>

        <div className="container mx-auto px-6 pb-24 max-w-5xl">
          <div className="mt-6 p-4 border-t border-border/50 bg-muted/30 rounded-lg">
            <p className="text-xs text-center text-blue-900 dark:text-blue-400">
              Os dados desta inspeção estão protegidos pela Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              Ao utilizar este sistema, você está ciente do uso de suas informações para fins de gestão de inspeções técnicas da CBMaq.
            </p>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t bg-card p-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center gap-3 max-w-5xl">
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              {(inspection.status === "finalizada" || 
                inspection.status === "aprovada" || 
                inspection.status === "reprovada") && (
                <PDFExport inspection={inspection} items={items} />
              )}
            </div>
            <div className="flex gap-3">
              {inspection.status === "em_andamento" && (
                <>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={() => setConfirmFinalizeOpen(true)}
                    disabled={saving}
                    className="bg-success hover:bg-success/90"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Finalizar
                  </Button>
                </>
              )}
              {inspection.status === "finalizada" && 
               (userRoles.includes("supervisor") || userRoles.includes("admin")) && (
                <Button 
                  onClick={() => setApprovalDialogOpen(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Revisar Inspeção
                </Button>
              )}
            </div>
          </div>
        </div>

        <ApprovalDialog
          open={approvalDialogOpen}
          onOpenChange={setApprovalDialogOpen}
          onApprove={handleApprove}
          onReject={handleReject}
        />

        <ConfirmDialog
          open={confirmFinalizeOpen}
          onOpenChange={setConfirmFinalizeOpen}
          onConfirm={handleFinalize}
          title="Finalizar Inspeção"
          description="Tem certeza que deseja finalizar esta inspeção? Após finalizada, ela não poderá mais ser editada e aguardará aprovação."
          confirmText="Finalizar"
        />

        <ConfirmDialog
          open={confirmDeleteOpen}
          onOpenChange={setConfirmDeleteOpen}
          onConfirm={handleDelete}
          title="Excluir Inspeção"
          description="Tem certeza que deseja excluir esta inspeção? Esta ação não pode ser desfeita."
          confirmText="Excluir"
          variant="destructive"
        />
      </div>
    </AuthGuard>
  );
}

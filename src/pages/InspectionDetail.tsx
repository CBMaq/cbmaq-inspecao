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
import { ArrowLeft, Save, CheckCircle2, Camera } from "lucide-react";
import { InspectionStatusBadge } from "@/components/InspectionStatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { PhotoUpload } from "@/components/PhotoUpload";
import { SignaturePad } from "@/components/SignaturePad";

interface InspectionData {
  id: string;
  inspection_date: string;
  model: string;
  serial_number: string;
  horimeter: number;
  freight_responsible: string | null;
  status: "em_andamento" | "finalizada" | "aprovada" | "reprovada";
  general_observations: string | null;
  has_fault_codes: boolean;
  fault_codes_description: string | null;
  codes_corrected: boolean;
  entry_signature: string | null;
  entry_signature_date: string | null;
  entry_technician_id: string | null;
  exit_signature: string | null;
  exit_signature_date: string | null;
  exit_technician_id: string | null;
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

  useEffect(() => {
    if (id) {
      fetchInspection();
    }
  }, [id]);

  const fetchInspection = async () => {
    setLoading(true);
    
    const { data: inspectionData, error: inspectionError } = await supabase
      .from("inspections")
      .select("*")
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

  const handleSave = async () => {
    setSaving(true);

    // Salvar itens de inspeção
    const { error: deleteError } = await supabase
      .from("inspection_items")
      .delete()
      .eq("inspection_id", id);

    if (deleteError) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: deleteError.message,
      });
      setSaving(false);
      return;
    }

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

    if (insertError) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: insertError.message,
      });
      setSaving(false);
      return;
    }

    toast({
      title: "Salvo com sucesso!",
      description: "As informações foram atualizadas.",
    });

    setSaving(false);
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
      description: "A inspeção foi concluída com sucesso.",
    });

    navigate("/");
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
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Inspeção Técnica</h1>
                <p className="text-muted-foreground">
                  {inspection.model} - {inspection.serial_number}
                </p>
              </div>
              <InspectionStatusBadge status={inspection.status} />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Dados do Equipamento</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                                  
                                  <div className="grid gap-4 sm:grid-cols-2 mb-4">
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
                        await supabase
                          .from("inspections")
                          .update({ fault_codes_description: e.target.value })
                          .eq("id", id);
                      }}
                      placeholder="Liste os códigos de falha..."
                      rows={3}
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
                  await supabase
                    .from("inspections")
                    .update({ general_observations: e.target.value })
                    .eq("id", id);
                }}
                placeholder="Adicione observações gerais sobre a inspeção..."
                rows={5}
              />
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Fotos do Equipamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
              <CardTitle>Assinaturas Digitais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SignaturePad
                label="Técnico Responsável pela Entrada"
                existingSignature={inspection.entry_signature}
                existingTechnicianId={inspection.entry_technician_id}
                existingDate={inspection.entry_signature_date}
                onSign={async (signature, technicianId, date) => {
                  await supabase
                    .from("inspections")
                    .update({
                      entry_signature: signature,
                      entry_technician_id: technicianId,
                      entry_signature_date: date,
                    })
                    .eq("id", id);
                  
                  setInspection({
                    ...inspection,
                    entry_signature: signature,
                    entry_technician_id: technicianId,
                    entry_signature_date: date,
                  });

                  toast({
                    title: "Assinatura salva!",
                  });
                }}
              />

              <SignaturePad
                label="Técnico Responsável pela Saída"
                existingSignature={inspection.exit_signature}
                existingTechnicianId={inspection.exit_technician_id}
                existingDate={inspection.exit_signature_date}
                onSign={async (signature, technicianId, date) => {
                  await supabase
                    .from("inspections")
                    .update({
                      exit_signature: signature,
                      exit_technician_id: technicianId,
                      exit_signature_date: date,
                    })
                    .eq("id", id);
                  
                  setInspection({
                    ...inspection,
                    exit_signature: signature,
                    exit_technician_id: technicianId,
                    exit_signature_date: date,
                  });

                  toast({
                    title: "Assinatura salva!",
                  });
                }}
              />
            </CardContent>
          </Card>
        </main>

        <div className="fixed bottom-0 left-0 right-0 border-t bg-card p-4 shadow-lg">
          <div className="container mx-auto flex justify-end gap-3 max-w-5xl">
            <Button variant="outline" onClick={() => navigate("/")}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || inspection.status === "finalizada"}>
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Inspeção
                </>
              )}
            </Button>
            {inspection.status === "em_andamento" && (
              <Button 
                onClick={handleFinalize} 
                disabled={saving}
                className="bg-success hover:bg-success/90"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Finalizar Inspeção
              </Button>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

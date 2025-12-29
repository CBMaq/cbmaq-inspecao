import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/AuthGuard";
import { ArrowLeft, Save, Search, CalendarIcon } from "lucide-react";
import { inspectionSchema } from "@/lib/validations";
import { z } from "zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MachineModel {
  id: string;
  name: string;
  category: string;
  line: string;
  image_url: string | null;
}

export default function NewInspection() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const modelId = searchParams.get("modelId");
  const [selectedModel, setSelectedModel] = useState<MachineModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (modelId) {
      fetchModelDetails(modelId);
    }
  }, [modelId]);

  const fetchModelDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("machine_models")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setSelectedModel(data);
    } catch (error) {
      console.error("Erro ao buscar modelo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do modelo",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Usuário não autenticado",
        });
        setLoading(false);
        return;
      }

      // Validate form data
      const horimeterValue = parseInt(formData.get("horimeter") as string);
      
      const formDataObj = {
        inspection_date: formData.get("inspection_date") as string,
        process_type: formData.get("process_type") as string,
        model: selectedModel ? selectedModel.name : (formData.get("model") as string),
        serial_number: formData.get("serial_number") as string,
        horimeter: isNaN(horimeterValue) ? 0 : horimeterValue,
        freight_responsible: formData.get("freight_responsible") as string || "",
        initial_label: formData.get("initial_label") as string || "",
        deadline_date: deadlineDate ? format(deadlineDate, "yyyy-MM-dd") : "",
      };

      const validated = inspectionSchema.parse(formDataObj);

      const { data, error } = await supabase
        .from("inspections")
        .insert({
          inspection_date: validated.inspection_date,
          process_type: validated.process_type,
          model: validated.model,
          serial_number: validated.serial_number,
          horimeter: validated.horimeter,
          freight_responsible: validated.freight_responsible || null,
          initial_label: validated.initial_label || null,
          deadline_date: validated.deadline_date || null,
          created_by: user.id,
          status: "em_andamento",
          model_id: selectedModel?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Inspeção criada com sucesso!",
      });
      navigate(`/inspecao/${data.id}`);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Dados inválidos",
          description: error.errors[0].message,
        });
      } else if (error instanceof Error) {
        toast({
          variant: "destructive",
          title: "Erro ao criar inspeção",
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card shadow-sm">
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
              <h1 className="text-2xl font-bold">Nova Inspeção Técnica</h1>
              {!selectedModel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/catalogo")}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar no Catálogo
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-3xl">
          {selectedModel && (
            <Card className="mb-6 bg-muted">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {selectedModel.image_url && (
                    <img
                      src={selectedModel.image_url}
                      alt={selectedModel.name}
                      className="w-32 h-32 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl mb-1">{selectedModel.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Linha: {selectedModel.line} | Categoria: {selectedModel.category}
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-sm"
                      onClick={() => {
                        setSelectedModel(null);
                        navigate("/nova-inspecao");
                      }}
                    >
                      Alterar modelo selecionado
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Dados Básicos</CardTitle>
              <CardDescription>
                {selectedModel
                  ? "Complete os dados da inspeção para o modelo selecionado"
                  : "Preencha as informações iniciais do equipamento"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Tipo de Processo *</Label>
                    <RadioGroup name="process_type" defaultValue="entrada_cbmaq" required>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="instalacao_entrada_target" id="instalacao_entrada_target" />
                        <Label htmlFor="instalacao_entrada_target" className="font-normal cursor-pointer">
                          Instalação Entrada Target
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="entrada_cbmaq" id="entrada_cbmaq" />
                        <Label htmlFor="entrada_cbmaq" className="font-normal cursor-pointer">
                          Entrada CBMAQ
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="saida_cbmaq" id="saida_cbmaq" />
                        <Label htmlFor="saida_cbmaq" className="font-normal cursor-pointer">
                          Saída CBMAQ
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="entrada_dnm" id="entrada_dnm" />
                        <Label htmlFor="entrada_dnm" className="font-normal cursor-pointer">
                          Entrada DNM
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="saida_dnm" id="saida_dnm" />
                        <Label htmlFor="saida_dnm" className="font-normal cursor-pointer">
                          Saída DNM
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="entrega_governo" id="entrega_governo" />
                        <Label htmlFor="entrega_governo" className="font-normal cursor-pointer">
                          Entrega Governo
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="inspection_date">Data da Inspeção</Label>
                    <Input
                      id="inspection_date"
                      name="inspection_date"
                      type="date"
                      required
                      defaultValue={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="horimeter">Horímetro</Label>
                    <Input
                      id="horimeter"
                      name="horimeter"
                      type="number"
                      required
                      min="0"
                      placeholder="0"
                    />
                  </div>

                  {!selectedModel && (
                    <div className="space-y-2">
                      <Label htmlFor="model">Modelo</Label>
                      <Input
                        id="model"
                        name="model"
                        type="text"
                        required
                        placeholder="FL936F"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="serial_number">Nº de Série</Label>
                    <Input
                      id="serial_number"
                      name="serial_number"
                      type="text"
                      required
                      placeholder="ABC123456"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="freight_responsible">
                    Responsável pelo Frete (Opcional)
                  </Label>
                  <Input
                    id="freight_responsible"
                    name="freight_responsible"
                    type="text"
                    placeholder="Nome da transportadora"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initial_label">
                    Observação / Rótulo (Opcional)
                  </Label>
                  <Textarea
                    id="initial_label"
                    name="initial_label"
                    placeholder="Ex: Necessário Tanque cheio, CODEVASF, etc."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prazo para Conclusão (Opcional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !deadlineDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deadlineDate ? format(deadlineDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={deadlineDate}
                        onSelect={setDeadlineDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? "Criando..." : "Criar e Continuar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  );
}

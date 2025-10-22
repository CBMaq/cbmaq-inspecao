import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/AuthGuard";
import { ArrowLeft, Save } from "lucide-react";

export default function NewInspection() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

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

    const { data, error } = await supabase
      .from("inspections")
      .insert({
        inspection_date: formData.get("inspection_date") as string,
        model: formData.get("model") as string,
        serial_number: formData.get("serial_number") as string,
        horimeter: parseInt(formData.get("horimeter") as string),
        freight_responsible: formData.get("freight_responsible") as string,
        created_by: user.id,
        status: "em_andamento",
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar inspeção",
        description: error.message,
      });
    } else {
      toast({
        title: "Inspeção criada com sucesso!",
      });
      navigate(`/inspecao/${data.id}`);
    }

    setLoading(false);
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
            <h1 className="text-2xl font-bold">Nova Inspeção Técnica</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Dados Básicos</CardTitle>
              <CardDescription>
                Preencha as informações iniciais do equipamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/AuthGuard";
import { MachineImage } from "@/components/MachineImage";

interface MachineModel {
  id: string;
  name: string;
  category: string;
  line: string;
  image_url: string | null;
  internal_code: string | null;
  description: string | null;
}

const MachineCatalog = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [models, setModels] = useState<MachineModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<MachineModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    filterModels();
  }, [searchTerm, selectedLine, selectedCategory, models]);

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from("machine_models")
        .select("*")
        .order("name");

      if (error) throw error;
      setModels(data || []);
      setFilteredModels(data || []);
    } catch (error) {
      console.error("Erro ao buscar modelos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o catálogo de máquinas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterModels = () => {
    let filtered = [...models];

    if (searchTerm) {
      filtered = filtered.filter(
        (model) =>
          model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          model.internal_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLine !== "all") {
      filtered = filtered.filter((model) => model.line === selectedLine);
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((model) => model.category === selectedCategory);
    }

    setFilteredModels(filtered);
  };

  const handleSelectModel = (modelId: string) => {
    navigate(`/nova-inspecao?modelId=${modelId}`);
  };

  const uniqueLines = Array.from(new Set(models.map((m) => m.line)));
  const uniqueCategories = Array.from(new Set(models.map((m) => m.category)));

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <h1 className="text-3xl font-bold">Catálogo de Máquinas</h1>
            </div>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>
                Busque e filtre máquinas por nome, linha ou categoria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={selectedLine} onValueChange={setSelectedLine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as linhas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as linhas</SelectItem>
                    {uniqueLines.map((line) => (
                      <SelectItem key={line} value={line}>
                        {line}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {uniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Grid de Máquinas Agrupadas por Linha */}
          {loading ? (
            <div className="text-center py-12">Carregando catálogo...</div>
          ) : filteredModels.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Nenhuma máquina encontrada com os filtros selecionados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {uniqueLines
                .filter(line => filteredModels.some(m => m.line === line))
                .map((line) => {
                  const lineModels = filteredModels.filter(m => m.line === line);
                  const lineCategories = Array.from(new Set(lineModels.map(m => m.category)));
                  
                  return (
                    <div key={line}>
                      <div className="mb-4">
                        <h2 className="text-2xl font-bold mb-1">{line}</h2>
                        <p className="text-sm text-muted-foreground">
                          Categorias: {lineCategories.join(", ")}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lineModels.map((model) => (
                          <Card key={model.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="aspect-video relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                              {model.image_url ? (
                                <MachineImage
                                  imageUrl={model.image_url}
                                  alt={model.name}
                                  className="w-full h-full object-contain p-6"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  Sem imagem
                                </div>
                              )}
                            </div>
                            <CardHeader>
                              <CardTitle className="text-lg">{model.name}</CardTitle>
                              <CardDescription>
                                <div className="space-y-1">
                                  <div>Categoria: {model.category}</div>
                                  {model.internal_code && (
                                    <div className="text-xs">Código: {model.internal_code}</div>
                                  )}
                                </div>
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Button
                                onClick={() => handleSelectModel(model.id)}
                                className="w-full"
                              >
                                Selecionar para Inspeção
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default MachineCatalog;

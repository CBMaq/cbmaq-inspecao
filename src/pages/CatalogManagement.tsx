import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthGuard } from "@/components/AuthGuard";
import { MachineImage } from "@/components/MachineImage";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface MachineModel {
  id: string;
  name: string;
  category: string;
  line: string;
  image_url: string | null;
  internal_code: string | null;
  description: string | null;
  technical_sheet_url: string | null;
  source_url: string | null;
}

const CatalogManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [models, setModels] = useState<MachineModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<MachineModel | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    line: "",
    image_url: "",
    internal_code: "",
    description: "",
    technical_sheet_url: "",
    source_url: "",
  });

  useEffect(() => {
    checkAdminRole();
    fetchModels();
  }, []);

  const checkAdminRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some((r) => r.role === "admin");
    if (!isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from("machine_models")
        .select("*")
        .order("name");

      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error("Erro ao buscar modelos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os modelos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingModel) {
        const { error } = await supabase
          .from("machine_models")
          .update(formData)
          .eq("id", editingModel.id);

        if (error) throw error;
        toast({ title: "Modelo atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from("machine_models")
          .insert([formData]);

        if (error) throw error;
        toast({ title: "Modelo adicionado com sucesso!" });
      }

      setDialogOpen(false);
      resetForm();
      fetchModels();
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o modelo",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (model: MachineModel) => {
    setEditingModel(model);
    setFormData({
      name: model.name,
      category: model.category,
      line: model.line,
      image_url: model.image_url || "",
      internal_code: model.internal_code || "",
      description: model.description || "",
      technical_sheet_url: model.technical_sheet_url || "",
      source_url: model.source_url || "",
    });
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!modelToDelete) return;

    try {
      const { error } = await supabase
        .from("machine_models")
        .delete()
        .eq("id", modelToDelete);

      if (error) throw error;

      toast({ title: "Modelo excluído com sucesso!" });
      fetchModels();
    } catch (error) {
      console.error("Erro ao excluir modelo:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o modelo",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setModelToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      line: "",
      image_url: "",
      internal_code: "",
      description: "",
      technical_sheet_url: "",
      source_url: "",
    });
    setEditingModel(null);
  };

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
              <h1 className="text-3xl font-bold">Gerenciar Catálogo</h1>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Modelo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingModel ? "Editar Modelo" : "Novo Modelo"}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha as informações do modelo de máquina
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Modelo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="line">Linha *</Label>
                      <Input
                        id="line"
                        value={formData.line}
                        onChange={(e) => setFormData({ ...formData, line: e.target.value })}
                        placeholder="Ex: Construção, Agrícola"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria *</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Ex: Pá Carregadeira"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="internal_code">Código Interno</Label>
                    <Input
                      id="internal_code"
                      value={formData.internal_code}
                      onChange={(e) => setFormData({ ...formData, internal_code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image_url">URL da Imagem Principal</Label>
                    <Input
                      id="image_url"
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição Técnica</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="technical_sheet_url">URL Ficha Técnica</Label>
                    <Input
                      id="technical_sheet_url"
                      type="url"
                      value={formData.technical_sheet_url}
                      onChange={(e) => setFormData({ ...formData, technical_sheet_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source_url">URL de Origem</Label>
                    <Input
                      id="source_url"
                      type="url"
                      value={formData.source_url}
                      onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">
                      {editingModel ? "Atualizar" : "Adicionar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-12">Carregando modelos...</div>
          ) : models.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  Nenhum modelo cadastrado ainda.
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Modelo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {models.map((model) => (
                <Card key={model.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        {model.image_url && (
                          <div className="w-24 h-24 rounded bg-white dark:bg-slate-900 flex items-center justify-center">
                            <MachineImage
                              imageUrl={model.image_url}
                              alt={model.name}
                              className="p-2"
                            />
                          </div>
                        )}
                        <div>
                          <CardTitle>{model.name}</CardTitle>
                          <CardDescription>
                            <div className="mt-2 space-y-1">
                              <div>Linha: {model.line}</div>
                              <div>Categoria: {model.category}</div>
                              {model.internal_code && (
                                <div>Código: {model.internal_code}</div>
                              )}
                            </div>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(model)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setModelToDelete(model.id);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title="Confirmar Exclusão"
        description="Tem certeza que deseja excluir este modelo? Esta ação não pode ser desfeita."
      />
    </AuthGuard>
  );
};

export default CatalogManagement;

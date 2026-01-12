import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil } from "lucide-react";

interface Technician {
  id: string;
  name: string;
  user_id: string | null;
  created_at: string;
}

export function TechnicianManagement() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [newTechId, setNewTechId] = useState("");
  const [newTechName, setNewTechName] = useState("");
  const [editTechName, setEditTechName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("technicians")
      .select("*")
      .order("name");

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar técnicos",
        description: error.message,
      });
    } else {
      setTechnicians(data || []);
    }
    setLoading(false);
  };

  const handleAddTechnician = async () => {
    if (!newTechId.trim() || !newTechName.trim()) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha o ID e o nome do técnico.",
      });
      return;
    }

    const { error } = await supabase
      .from("technicians")
      .insert([
        {
          id: newTechId.trim(),
          name: newTechName.trim(),
        },
      ]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar técnico",
        description: error.message,
      });
    } else {
      toast({
        title: "Técnico adicionado!",
        description: "O técnico foi cadastrado com sucesso.",
      });
      setNewTechId("");
      setNewTechName("");
      setOpen(false);
      fetchTechnicians();
    }
  };

  const handleEditTechnician = (tech: Technician) => {
    setEditingTech(tech);
    setEditTechName(tech.name);
    setEditOpen(true);
  };

  const handleUpdateTechnician = async () => {
    if (!editingTech || !editTechName.trim()) {
      toast({
        variant: "destructive",
        title: "Campo obrigatório",
        description: "Por favor, preencha o nome do técnico.",
      });
      return;
    }

    const { error } = await supabase
      .from("technicians")
      .update({ name: editTechName.trim() })
      .eq("id", editingTech.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar técnico",
        description: error.message,
      });
    } else {
      toast({
        title: "Técnico atualizado!",
        description: "O técnico foi atualizado com sucesso.",
      });
      setEditOpen(false);
      setEditingTech(null);
      setEditTechName("");
      fetchTechnicians();
    }
  };

  const handleDeleteTechnician = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este técnico?")) {
      return;
    }

    const { error } = await supabase
      .from("technicians")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao remover técnico",
        description: error.message,
      });
    } else {
      toast({
        title: "Técnico removido!",
        description: "O técnico foi removido com sucesso.",
      });
      fetchTechnicians();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gestão de Técnicos</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Técnico
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Técnico</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tech-id">ID do Técnico</Label>
                <Input
                  id="tech-id"
                  value={newTechId}
                  onChange={(e) => setNewTechId(e.target.value)}
                  placeholder="Ex: TEC001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tech-name">Nome Completo</Label>
                <Input
                  id="tech-name"
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddTechnician}>
                  Cadastrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-4">Carregando...</p>
        ) : technicians.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">
            Nenhum técnico cadastrado ainda.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technicians.map((tech) => (
                <TableRow key={tech.id}>
                  <TableCell className="font-mono">{tech.id}</TableCell>
                  <TableCell>{tech.name}</TableCell>
                  <TableCell>
                    {new Date(tech.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTechnician(tech)}
                        title="Editar técnico"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTechnician(tech.id)}
                        title="Remover técnico"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Técnico</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>ID do Técnico</Label>
              <Input
                value={editingTech?.id || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tech-name">Nome Completo</Label>
              <Input
                id="edit-tech-name"
                value={editTechName}
                onChange={(e) => setEditTechName(e.target.value)}
                placeholder="Ex: João Silva"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateTechnician}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

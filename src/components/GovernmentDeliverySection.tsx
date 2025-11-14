import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Truck, Save, Building2, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { SignaturePad } from "./SignaturePad";
import { format } from "date-fns";

interface GovernmentDeliverySectionProps {
  inspectionId: string;
}

interface GovernmentDelivery {
  id: string;
  processo_id: string;
  motorista_id: string | null;
  orgao_publico: string | null;
  cnpj_orgao: string | null;
  endereco_entrega: string | null;
  cidade: string | null;
  uf: string | null;
  numero_nf: string | null;
  serie_nf: string | null;
  chave_nfe: string | null;
  nota_fiscal_pdf: string | null;
  transportadora: string | null;
  placa_veiculo: string | null;
  data_saida_cbmaq: string | null;
  data_prevista_entrega: string | null;
  data_entrega_efetiva: string | null;
  nome_recebedor: string | null;
  cargo_recebedor: string | null;
  documento_recebedor: string | null;
  assinatura_recebedor: string | null;
  status_entrega: string;
  observacoes: string | null;
}

export const GovernmentDeliverySection = ({ inspectionId }: GovernmentDeliverySectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<GovernmentDelivery>>({});
  const queryClient = useQueryClient();

  const { data: delivery, isLoading } = useQuery({
    queryKey: ["government-delivery", inspectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entrega_governo" as any)
        .select("*")
        .eq("processo_id", inspectionId)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data as any as GovernmentDelivery | null;
    },
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("motoristas" as any)
        .select("*")
        .eq("ativo", true)
        .order("nome");
      
      if (error) throw error;
      return data as any;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<GovernmentDelivery>) => {
      if (delivery) {
        const { error } = await supabase
          .from("entrega_governo" as any)
          .update(data as any)
          .eq("id", delivery.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("entrega_governo" as any)
          .insert([{ ...data, processo_id: inspectionId }] as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["government-delivery", inspectionId] });
      toast.success("Dados salvos com sucesso!");
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Erro ao salvar dados");
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleEdit = () => {
    setFormData(delivery || {});
    setIsEditing(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      aguardando_saida: { className: "bg-yellow-500", label: "Aguardando Saída" },
      em_transito: { className: "bg-blue-500", label: "Em Trânsito" },
      entregue: { className: "bg-green-500", label: "Entregue" },
      com_pendencia: { className: "bg-red-500", label: "Com Pendência" },
    };
    
    const variant = variants[status] || variants.aguardando_saida;
    return <Badge className={`${variant.className} text-white`}>{variant.label}</Badge>;
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando dados da entrega...</p>;
  }

  if (!delivery && !isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Entrega Governo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Nenhuma entrega governo registrada para esta inspeção.
          </p>
          <Button onClick={handleEdit}>
            <Building2 className="h-4 w-4 mr-2" />
            Registrar Entrega Governo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          <CardTitle>Entrega Governo</CardTitle>
          {delivery && getStatusBadge(delivery.status_entrega)}
        </div>
        {!isEditing && (
          <Button onClick={handleEdit} variant="outline" size="sm">
            Editar
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Dados do Órgão Público
                </h3>
              </div>
              <div>
                <Label>Órgão Público *</Label>
                <Input
                  value={formData.orgao_publico || ""}
                  onChange={(e) => setFormData({ ...formData, orgao_publico: e.target.value })}
                  placeholder="Ex: CODEVASF"
                />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input
                  value={formData.cnpj_orgao || ""}
                  onChange={(e) => setFormData({ ...formData, cnpj_orgao: e.target.value })}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="col-span-2">
                <Label>Endereço de Entrega</Label>
                <Input
                  value={formData.endereco_entrega || ""}
                  onChange={(e) => setFormData({ ...formData, endereco_entrega: e.target.value })}
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  value={formData.cidade || ""}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                />
              </div>
              <div>
                <Label>UF</Label>
                <Input
                  value={formData.uf || ""}
                  onChange={(e) => setFormData({ ...formData, uf: e.target.value })}
                  maxLength={2}
                  placeholder="Ex: PE"
                />
              </div>

              <div className="col-span-2 mt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Nota Fiscal
                </h3>
              </div>
              <div>
                <Label>Número NF</Label>
                <Input
                  value={formData.numero_nf || ""}
                  onChange={(e) => setFormData({ ...formData, numero_nf: e.target.value })}
                />
              </div>
              <div>
                <Label>Série NF</Label>
                <Input
                  value={formData.serie_nf || ""}
                  onChange={(e) => setFormData({ ...formData, serie_nf: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>Chave NFe</Label>
                <Input
                  value={formData.chave_nfe || ""}
                  onChange={(e) => setFormData({ ...formData, chave_nfe: e.target.value })}
                />
              </div>

              <div className="col-span-2 mt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Transporte
                </h3>
              </div>
              <div>
                <Label>Motorista *</Label>
                <Select
                  value={formData.motorista_id || ""}
                  onValueChange={(value) => setFormData({ ...formData, motorista_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motorista" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((driver: any) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.nome} {driver.empresa && `(${driver.empresa})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Transportadora</Label>
                <Input
                  value={formData.transportadora || ""}
                  onChange={(e) => setFormData({ ...formData, transportadora: e.target.value })}
                />
              </div>
              <div>
                <Label>Placa do Veículo</Label>
                <Input
                  value={formData.placa_veiculo || ""}
                  onChange={(e) => setFormData({ ...formData, placa_veiculo: e.target.value })}
                  placeholder="ABC-1234"
                />
              </div>
              <div>
                <Label>Data Saída CBMaq</Label>
                <Input
                  type="datetime-local"
                  value={formData.data_saida_cbmaq?.slice(0, 16) || ""}
                  onChange={(e) => setFormData({ ...formData, data_saida_cbmaq: e.target.value })}
                />
              </div>
              <div>
                <Label>Data Prevista Entrega</Label>
                <Input
                  type="datetime-local"
                  value={formData.data_prevista_entrega?.slice(0, 16) || ""}
                  onChange={(e) => setFormData({ ...formData, data_prevista_entrega: e.target.value })}
                />
              </div>
              <div>
                <Label>Data Entrega Efetiva</Label>
                <Input
                  type="datetime-local"
                  value={formData.data_entrega_efetiva?.slice(0, 16) || ""}
                  onChange={(e) => setFormData({ ...formData, data_entrega_efetiva: e.target.value })}
                />
              </div>

              <div className="col-span-2 mt-4">
                <h3 className="font-semibold mb-3">Recebedor</h3>
              </div>
              <div>
                <Label>Nome do Recebedor</Label>
                <Input
                  value={formData.nome_recebedor || ""}
                  onChange={(e) => setFormData({ ...formData, nome_recebedor: e.target.value })}
                />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input
                  value={formData.cargo_recebedor || ""}
                  onChange={(e) => setFormData({ ...formData, cargo_recebedor: e.target.value })}
                />
              </div>
              <div>
                <Label>Documento (RG/CPF)</Label>
                <Input
                  value={formData.documento_recebedor || ""}
                  onChange={(e) => setFormData({ ...formData, documento_recebedor: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes || ""}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Órgão Público
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Órgão:</strong> {delivery?.orgao_publico || "-"}</div>
                <div><strong>CNPJ:</strong> {delivery?.cnpj_orgao || "-"}</div>
                <div className="col-span-2"><strong>Endereço:</strong> {delivery?.endereco_entrega || "-"}</div>
                <div><strong>Cidade:</strong> {delivery?.cidade || "-"}</div>
                <div><strong>UF:</strong> {delivery?.uf || "-"}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Nota Fiscal
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Número:</strong> {delivery?.numero_nf || "-"}</div>
                <div><strong>Série:</strong> {delivery?.serie_nf || "-"}</div>
                <div className="col-span-2"><strong>Chave NFe:</strong> {delivery?.chave_nfe || "-"}</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Transporte
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Transportadora:</strong> {delivery?.transportadora || "-"}</div>
                <div><strong>Placa:</strong> {delivery?.placa_veiculo || "-"}</div>
                <div><strong>Saída CBMaq:</strong> {delivery?.data_saida_cbmaq ? format(new Date(delivery.data_saida_cbmaq), "dd/MM/yyyy HH:mm") : "-"}</div>
                <div><strong>Previsão:</strong> {delivery?.data_prevista_entrega ? format(new Date(delivery.data_prevista_entrega), "dd/MM/yyyy HH:mm") : "-"}</div>
                <div className="col-span-2"><strong>Entrega Efetiva:</strong> {delivery?.data_entrega_efetiva ? format(new Date(delivery.data_entrega_efetiva), "dd/MM/yyyy HH:mm") : "-"}</div>
              </div>
            </div>

            {delivery?.nome_recebedor && (
              <div>
                <h3 className="font-semibold mb-2">Recebedor</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Nome:</strong> {delivery.nome_recebedor}</div>
                  <div><strong>Cargo:</strong> {delivery.cargo_recebedor || "-"}</div>
                  <div><strong>Documento:</strong> {delivery.documento_recebedor || "-"}</div>
                </div>
              </div>
            )}

            {delivery?.observacoes && (
              <div>
                <h3 className="font-semibold mb-2">Observações</h3>
                <p className="text-sm whitespace-pre-wrap">{delivery.observacoes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

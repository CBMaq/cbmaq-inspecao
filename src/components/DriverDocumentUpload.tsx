import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DriverDocumentUploadProps {
  inspectionId: string;
  existingDocumentUrl: string | null;
  onUploadComplete: () => void;
}

export function DriverDocumentUpload({
  inspectionId,
  existingDocumentUrl,
  onUploadComplete,
}: DriverDocumentUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  // Gerar URL assinada quando existir um documento
  useEffect(() => {
    const getPath = (urlOrPath: string) => {
      if (!urlOrPath) return null;
      try {
        const u = new URL(urlOrPath);
        const marker = "/driver-documents/";
        const idx = u.pathname.indexOf(marker);
        if (idx !== -1) {
          return u.pathname.substring(idx + marker.length);
        }
      } catch {
        // not a URL, keep going
      }
      return urlOrPath.replace(/^driver-documents\//, "").replace(/^\/+/, "");
    };

    if (existingDocumentUrl) {
      const path = getPath(existingDocumentUrl);
      if (!path) return;
      supabase.storage
        .from("driver-documents")
        .createSignedUrl(path, 3600) // 1 hora de validade
        .then(({ data, error }) => {
          if (error) {
            console.error("Erro gerando URL assinada:", error);
            setSignedUrl(null);
          } else if (data?.signedUrl) {
            setSignedUrl(data.signedUrl);
          }
        });
    } else {
      setSignedUrl(null);
    }
  }, [existingDocumentUrl]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo (apenas PDFs e imagens)
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Tipo de arquivo inválido",
        description: "Apenas arquivos PDF e imagens são permitidos",
      });
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload do arquivo
      const fileExt = file.name.split(".").pop();
      const fileName = `${inspectionId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("driver-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Atualizar registro da inspeção com o caminho do arquivo
      const { error: updateError } = await supabase
        .from("inspections")
        .update({ driver_documents_url: filePath })
        .eq("id", inspectionId);

      if (updateError) throw updateError;

      toast({
        title: "Documento enviado!",
        description: "O documento do motorista foi carregado com sucesso.",
      });

      onUploadComplete();
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar documento",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveDocument = async () => {
    if (!existingDocumentUrl) return;

    try {
      // Remover do storage usando o caminho armazenado (normalizando quando for URL antiga)
      const normalizePath = (urlOrPath: string) => {
        try {
          const u = new URL(urlOrPath);
          const marker = "/driver-documents/";
          const idx = u.pathname.indexOf(marker);
          if (idx !== -1) return u.pathname.substring(idx + marker.length);
        } catch {}
        return urlOrPath.replace(/^driver-documents\//, "").replace(/^\/+/, "");
      };
      const pathToDelete = normalizePath(existingDocumentUrl);
      const { error: deleteError } = await supabase.storage
        .from("driver-documents")
        .remove([pathToDelete]);

      if (deleteError) throw deleteError;

      // Atualizar registro
      const { error: updateError } = await supabase
        .from("inspections")
        .update({ driver_documents_url: null })
        .eq("id", inspectionId);

      if (updateError) throw updateError;

      toast({
        title: "Documento removido",
        description: "O documento foi excluído com sucesso.",
      });

      onUploadComplete();
    } catch (error: any) {
      console.error("Erro ao remover documento:", error);
      toast({
        variant: "destructive",
        title: "Erro ao remover documento",
        description: error.message,
      });
    }
  };

  return (
    <div className="space-y-4">
      <Label>Documentos do Motorista (CNH, etc.)</Label>
      
      {existingDocumentUrl ? (
        <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
          <FileText className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <p className="font-medium">Documento carregado</p>
            {signedUrl ? (
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Visualizar documento
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">Carregando link...</p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRemoveDocument}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <Input
            id="driver-document"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <Label
            htmlFor="driver-document"
            className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent transition-colors"
          >
            <FileUp className="h-4 w-4" />
            {uploading ? "Enviando..." : "Selecionar arquivo"}
          </Label>
          <p className="text-sm text-muted-foreground">
            PDF ou imagem (máx. 5MB)
          </p>
        </div>
      )}
    </div>
  );
}

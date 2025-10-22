import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  inspectionId: string;
  photoType: string;
  label: string;
  onPhotoUploaded?: () => void;
}

export function PhotoUpload({ inspectionId, photoType, label, onPhotoUploaded }: PhotoUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPhotos();
  }, [inspectionId, photoType]);

  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inspection_photos")
      .select("photo_url")
      .eq("inspection_id", inspectionId)
      .eq("photo_type", photoType);

    if (error) {
      console.error("Error fetching photos:", error);
    } else if (data) {
      setPhotos(data.map((p) => p.photo_url));
    }
    setLoading(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    const totalFiles = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${inspectionId}/${photoType}/${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("inspection-photos")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("inspection-photos")
          .getPublicUrl(fileName);

        const { error: dbError } = await supabase
          .from("inspection_photos")
          .insert({
            inspection_id: inspectionId,
            photo_type: photoType,
            photo_url: publicUrl,
          });

        if (dbError) throw dbError;

        setPhotos((prev) => [...prev, publicUrl]);
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      toast({
        title: "Fotos enviadas!",
        description: `${files.length} foto(s) adicionada(s) com sucesso.`,
      });

      if (onPhotoUploaded) onPhotoUploaded();
      fetchPhotos(); // Reload photos
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar fotos",
        description: error.message,
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (photoUrl: string) => {
    try {
      const { error } = await supabase
        .from("inspection_photos")
        .delete()
        .eq("photo_url", photoUrl)
        .eq("inspection_id", inspectionId);

      if (error) throw error;

      fetchPhotos(); // Reload photos

      toast({
        title: "Foto removida",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover foto",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {uploadProgress}%
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Adicionar Fotos
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((url, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <img
                  src={url}
                  alt={`${label} ${index + 1}`}
                  className="w-full h-32 object-cover rounded"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(url)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <ImageIcon className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p className="text-sm">Nenhuma foto adicionada</p>
        </div>
      )}
    </div>
  );
}

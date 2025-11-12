import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon, Video, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface MediaUploadProps {
  inspectionId: string;
  photoType: string;
  label: string;
  onMediaUploaded?: () => void;
}

interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

export function MediaUpload({ inspectionId, photoType, label, onMediaUploaded }: MediaUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
  }, [inspectionId, photoType]);

  const getMediaType = (url: string): 'image' | 'video' => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext)) ? 'video' : 'image';
  };

  const fetchMedia = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inspection_photos")
      .select("photo_url")
      .eq("inspection_id", inspectionId)
      .eq("photo_type", photoType);

    if (error) {
      console.error("Error fetching media:", error);
    } else if (data) {
      setMedia(data.map((p) => ({
        url: p.photo_url,
        type: getMediaType(p.photo_url)
      })));
    }
    setLoading(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validation constants
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB para vídeos
    const ALLOWED_TYPES = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'
    ];

    // Validate all files before upload
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: "Arquivo muito grande",
          description: `${file.name} excede o tamanho máximo de 50MB.`,
        });
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
        toast({
          variant: "destructive",
          title: "Tipo de arquivo inválido",
          description: `${file.name} não é um formato permitido. Use JPG, PNG, WEBP, HEIC, MP4, MOV, AVI, WEBM ou MKV.`,
        });
        return;
      }
    }

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

        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      toast({
        title: "Arquivos enviados!",
        description: `${files.length} arquivo(s) adicionado(s) com sucesso.`,
      });

      if (onMediaUploaded) onMediaUploaded();
      fetchMedia(); // Reload media
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar arquivos",
        description: error.message,
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (mediaUrl: string) => {
    try {
      const { error } = await supabase
        .from("inspection_photos")
        .delete()
        .eq("photo_url", mediaUrl)
        .eq("inspection_id", inspectionId);

      if (error) throw error;

      fetchMedia(); // Reload media

      toast({
        title: "Arquivo removido",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao remover arquivo",
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
              Adicionar Fotos/Vídeos
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {media.map((item, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                {item.type === 'image' ? (
                  <div className="relative group/image cursor-pointer" onClick={() => setSelectedImage(item.url)}>
                    <img
                      src={item.url}
                      alt={`${label} ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center rounded">
                      <Maximize2 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-32 bg-muted rounded overflow-hidden">
                    <video
                      src={item.url}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                    />
                    <div className="absolute top-2 left-2 bg-background/80 rounded px-2 py-1">
                      <Video className="h-4 w-4" />
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(item.url)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {media.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <div className="flex justify-center gap-4 mb-2">
            <ImageIcon className="h-12 w-12 opacity-50" />
            <Video className="h-12 w-12 opacity-50" />
          </div>
          <p className="text-sm">Nenhuma foto ou vídeo adicionado</p>
        </div>
      )}

      <Dialog open={!!selectedImage} onOpenChange={() => {
        setSelectedImage(null);
        setZoom(100);
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogTitle className="sr-only">Visualização de imagem</DialogTitle>
          <DialogDescription className="sr-only">
            Imagem ampliada com controles de zoom
          </DialogDescription>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(50, zoom - 25))}
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">{zoom}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(100)}
              >
                Resetar
              </Button>
            </div>
            <div className="overflow-auto max-h-[calc(90vh-120px)] flex items-center justify-center">
              <img 
                src={selectedImage || ""} 
                alt="Foto ampliada" 
                style={{ width: `${zoom}%` }}
                className="object-contain"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

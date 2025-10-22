import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, Pen } from "lucide-react";

interface SignaturePadProps {
  label: string;
  onSign: (signature: string, technicianId: string, date: string) => void;
  existingSignature?: string | null;
  existingTechnicianId?: string | null;
  existingDate?: string | null;
}

export function SignaturePad({
  label,
  onSign,
  existingSignature,
  existingTechnicianId,
  existingDate,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signature, setSignature] = useState<string | null>(existingSignature || null);
  const [technicianId, setTechnicianId] = useState(existingTechnicianId || "");
  const [signatureDate, setSignatureDate] = useState(
    existingDate || new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let x, y;
    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let x, y;
    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Verificar se há desenho no canvas
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasDrawing = imageData.data.some(channel => channel !== 0);
    
    if (!hasDrawing) {
      alert("Por favor, desenhe sua assinatura antes de salvar.");
      return;
    }

    if (!technicianId.trim()) {
      alert("Por favor, informe o ID do técnico.");
      return;
    }

    const signatureData = canvas.toDataURL("image/png");
    setSignature(signatureData);
    onSign(signatureData, technicianId, signatureDate);
  };

  if (signature) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">{label}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSignature}
              >
                <X className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            </div>
            <img src={signature} alt="Assinatura" className="border rounded max-w-full" />
            <div className="text-sm text-muted-foreground">
              <p>Técnico ID: {technicianId}</p>
              <p>Data: {new Date(signatureDate).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Label className="font-semibold">{label}</Label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="technician-id">ID do Técnico</Label>
              <Input
                id="technician-id"
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                placeholder="Digite o ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature-date">Data</Label>
              <Input
                id="signature-date"
                type="date"
                value={signatureDate}
                onChange={(e) => setSignatureDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Desenhe sua assinatura</Label>
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              className="border-2 border-dashed rounded w-full touch-none"
              style={{ maxWidth: "400px", height: "200px" }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button type="button" variant="outline" onClick={clearSignature} className="flex-1">
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
            <Button
              type="button"
              onClick={saveSignature}
              disabled={!technicianId.trim()}
              className="flex-1"
            >
              <Pen className="mr-2 h-4 w-4" />
              Salvar Assinatura
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

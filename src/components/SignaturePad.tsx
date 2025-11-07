import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Pen } from "lucide-react";

interface Technician {
  id: string;
  name: string;
}

interface SignaturePadProps {
  label: string;
  onSign: (signature: string, technicianId: string, technicianName: string, date: string) => void;
  existingSignature?: string | null;
  existingTechnicianId?: string | null;
  existingTechnicianName?: string | null;
  existingDate?: string | null;
  technicians: Technician[];
  hideTechnicianSelection?: boolean;
}

export function SignaturePad({
  label,
  onSign,
  existingSignature,
  existingTechnicianId,
  existingTechnicianName,
  existingDate,
  technicians,
  hideTechnicianSelection = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signature, setSignature] = useState<string | null>(existingSignature || null);
  const [technicianId, setTechnicianId] = useState(existingTechnicianId || "");
  const [technicianName, setTechnicianName] = useState(existingTechnicianName || "");
  const [signatureDate, setSignatureDate] = useState(
    existingDate || new Date().toISOString().split("T")[0]
  );

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Define o tamanho do canvas baseado no container
    canvas.width = rect.width * dpr;
    canvas.height = 200 * dpr;
    
    // Ajusta o estilo CSS
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = '200px';

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Escala o contexto para alta resolução
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
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

    if (!hideTechnicianSelection && !technicianId.trim()) {
      alert("Por favor, selecione um técnico.");
      return;
    }

    const signatureData = canvas.toDataURL("image/png");
    setSignature(signatureData);
    onSign(signatureData, technicianId, technicianName || "Motorista", signatureDate);
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
              {!hideTechnicianSelection && (
                <p>Técnico: {technicianName} ({technicianId})</p>
              )}
              {hideTechnicianSelection && technicianName && (
                <p>Assinado por: {technicianName}</p>
              )}
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

          {!hideTechnicianSelection && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="technician-select">Selecione o Técnico</Label>
                <Select
                  value={technicianId}
                  onValueChange={(value) => {
                    setTechnicianId(value);
                    const selectedTech = technicians.find(t => t.id === value);
                    if (selectedTech) {
                      setTechnicianName(selectedTech.name);
                    }
                  }}
                >
                  <SelectTrigger id="technician-select">
                    <SelectValue placeholder="Escolha um técnico" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name} ({tech.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          )}

          {hideTechnicianSelection && (
            <div className="space-y-2">
              <Label htmlFor="signature-date">Data</Label>
              <Input
                id="signature-date"
                type="date"
                value={signatureDate}
                onChange={(e) => setSignatureDate(e.target.value)}
              />
            </div>
          )}

          <div ref={containerRef} className="w-full">
            <Label className="mb-2 block">Desenhe sua assinatura</Label>
            <canvas
              ref={canvasRef}
              className="border-2 border-dashed rounded w-full touch-none bg-white"
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
              disabled={!hideTechnicianSelection && !technicianId.trim()}
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

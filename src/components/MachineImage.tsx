import { useEffect, useState, useRef } from "react";
import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 512;

interface MachineImageProps {
  imageUrl: string;
  alt: string;
  className?: string;
}

export function MachineImage({ imageUrl, alt, className = "" }: MachineImageProps) {
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    processImage();
  }, [imageUrl]);

  const processImage = async () => {
    try {
      setLoading(true);
      setError(false);

      // Check cache first
      const cacheKey = `processed_${imageUrl}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setProcessedImage(cached);
        setLoading(false);
        return;
      }

      // Load image
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Resize if needed
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
          width = MAX_IMAGE_DIMENSION;
        } else {
          width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
          height = MAX_IMAGE_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Get image data
      const imageData = canvas.toDataURL('image/jpeg', 0.9);

      // Process with segmentation model
      const segmenter = await pipeline(
        'image-segmentation',
        'Xenova/segformer-b0-finetuned-ade-512-512',
        { device: 'webgpu' }
      );

      const result = await segmenter(imageData);

      if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
        throw new Error('Invalid segmentation result');
      }

      // Create output canvas
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = width;
      outputCanvas.height = height;
      const outputCtx = outputCanvas.getContext('2d');
      if (!outputCtx) throw new Error('Could not get output canvas context');

      // Draw original image
      outputCtx.drawImage(canvas, 0, 0);

      // Apply mask to remove background
      const outputImageData = outputCtx.getImageData(0, 0, width, height);
      const data = outputImageData.data;

      for (let i = 0; i < result[0].mask.data.length; i++) {
        const alpha = Math.round((1 - result[0].mask.data[i]) * 255);
        data[i * 4 + 3] = alpha;
      }

      outputCtx.putImageData(outputImageData, 0, 0);

      // Convert to PNG with transparency
      const finalImage = outputCanvas.toDataURL('image/png', 1.0);
      
      // Cache the result
      try {
        localStorage.setItem(cacheKey, finalImage);
      } catch (e) {
        console.warn('Could not cache image:', e);
      }

      setProcessedImage(finalImage);
      setLoading(false);
    } catch (err) {
      console.error('Error processing image:', err);
      setError(true);
      setLoading(false);
    }
  };

  if (error) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} filter contrast-110 brightness-105`}
      />
    );
  }

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-background to-muted`}>
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Processando...</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={processedImage || imageUrl}
      alt={alt}
      className={`${className} filter contrast-110 brightness-105 drop-shadow-xl`}
    />
  );
}
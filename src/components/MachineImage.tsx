import { useState, useEffect } from "react";

interface MachineImageProps {
  imageUrl: string;
  alt: string;
  className?: string;
}

export function MachineImage({ imageUrl, alt, className = "" }: MachineImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`${className} relative`}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-contain ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        style={{
          filter: 'contrast(1.15) brightness(1.05) saturate(1.1)',
          mixBlendMode: 'multiply',
        }}
      />
    </div>
  );
}
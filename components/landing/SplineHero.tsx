'use client';

import { useState } from 'react';

interface SplineHeroProps {
  sceneUrl: string;
}

export function SplineHero({ sceneUrl }: SplineHeroProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px]">
      {/* Loading skeleton */}
      {!loaded && (
        <div className="absolute inset-0 bg-[#0E1216] rounded-2xl animate-pulse flex items-center justify-center">
          <div className="text-[#3A424D] text-sm">Loading 3D scene...</div>
        </div>
      )}

      {/* Spline iframe embed */}
      <iframe
        src={sceneUrl}
        className={`w-full h-full rounded-2xl transition-opacity duration-700 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ border: 'none' }}
        onLoad={() => setLoaded(true)}
        title="AutomationNation 3D Hero"
        allow="autoplay"
      />

      {/* Subtle glow behind the scene */}
      <div
        className="absolute -inset-4 -z-10 rounded-3xl opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(25, 175, 255, 0.2), rgba(124, 58, 237, 0.1), transparent 70%)',
        }}
        aria-hidden="true"
      />
    </div>
  );
}

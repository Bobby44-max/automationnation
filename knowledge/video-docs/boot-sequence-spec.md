# Rain Check: Cinematic Boot Sequence (Google Veo Spec)

## Objective
A 4K atmospheric background loop for the Login/Sign-up screens that establishes the "Industrial Weather Intelligence" identity.

## Veo Prompt
"A cinematic, ultra-high-definition 4K 120fps video of an industrial tactical weather interface boot sequence. The scene starts in complete darkness. A sharp neon emerald 'RC' logo flickers to life in the center, followed by a rapid-fire cascade of schematic blueprints and radar data arrays expanding outward. Heavy rain droplets are seen in extreme macro, refracting the emerald light as they slide down a sleek obsidian glass panel. In the background, a volumetric storm cell swirls ominously, occasionally illuminated by localized sunbeams. The camera performs a slow, weighted dolly-in towards the interface. Atmospheric fog, industrial grain, hyper-detailed textures of carbon fiber and glass."

## Technical Specs
- **Resolution:** 4K (3840x2160)
- **Aspect Ratio:** 16:9
- **Frame Rate:** 60fps or 120fps (slow-motion)
- **Color Palette:** Obsidian Midnight (#020617), Emerald Neon (#10B981), Storm Grey.
- **Duration:** 15-second seamless loop.

## Integration Plan
1. Generate asset using Google Veo.
2. Optimize using FFmpeg for web (H.265/HEVC).
3. Implement as a background video in `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx`.

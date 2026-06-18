# Orbital View

Interactive 3D web app showing real satellites in Earth orbit. Uses NORAD TLE data from [CelesTrak](https://celestrak.org), propagated with [satellite.js](https://github.com/shashwatak/satellite-js), and rendered with Three.js.

## Features

- 3D Earth with live satellite positions
- Constellations color-coded (Starlink, GPS, OneWeb, Galileo, GLONASS, BeiDou, space stations)
- Toggle constellations on/off
- Time slider to scrub ±24 hours from now
- Play/pause with adjustable speed
- Touch-friendly controls for mobile

## Local development

```bash
npm install --cache .npm-cache
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to GitHub + Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial orbital view app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/orbital-view.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework preset: **Next.js** (auto-detected)
4. Click **Deploy**

No environment variables are required. The app fetches public satellite data from CelesTrak at runtime and caches responses for one hour.

## Tech stack

- [Next.js](https://nextjs.org)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [@react-three/drei](https://github.com/pmndrs/drei)
- [satellite.js](https://github.com/shashwatak/satellite-js)
- [Tailwind CSS](https://tailwindcss.com)

## Notes

- TLE accuracy is best within a few days of the data epoch; the default slider range is ±24 hours.
- Starlink includes thousands of satellites; older mobile devices may benefit from toggling it off for smoother performance.
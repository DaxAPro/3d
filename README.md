# Image to 3D Web Application

A full-stack web application built with **Next.js 16**, **React Three Fiber / Three.js**, and **Tailwind CSS** that converts 2D images into interactive 3D models (`.glb`) using AI via the Replicate API (TRELLIS / TripoSR).

---

## 🚀 Features

- **Drag & Drop Upload:** Upload any PNG, JPG, or WebP image.
- **AI 3D Generation:** Dispatches requests to the state-of-the-art TRELLIS model on Replicate.
- **Real-time Progress Indicator:** Animated spinner, shimmer progress bar, and status updates while the model generates.
- **Interactive 3D Viewer:** Built with `@react-three/fiber` and `@react-three/drei`:
  - 🔄 Left-click + drag to rotate (auto-rotation enabled by default)
  - 🔍 Scroll to zoom in / out
  - ↔️ Right-click + drag to pan
  - 💡 Dynamic lighting & studio HDR environment reflections
- **Direct Download:** One-click download button saves the generated 3D model as a standard `.glb` file.

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **3D Graphics:** Three.js, `@react-three/fiber`, `@react-three/drei`
- **AI Backend:** Next.js Server Route (`/api/generate-3d`) calling Replicate REST API

---

## 📦 Getting Started (Local Setup)

### 1. Set your Replicate API Token
Get your API key from [https://replicate.com/account/api-tokens](https://replicate.com/account/api-tokens).

Open the file:
```text
.env.local
```
Add your token:
```env
REPLICATE_API_TOKEN=r8_your_actual_token_here
```

### 2. Run the Development Server
In your terminal, navigate to the project directory and run:

```bash
cd "d:\vs code my app and website\3D Model\image-to-3d"
npm run dev
```

### 3. Open in Browser
Visit [http://localhost:3000](http://localhost:3000) in your browser.

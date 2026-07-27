# Script

Pastebin-style snippet search. Tema gold/dark "FF Lobby Gold".

## Jalanin lokal

```bash
npm install
npm run dev
```

## Ganti sumber data

Frontend manggil `/api/search` (serverless function di `api/search.js`),
bukan langsung ke API luar — jadi nggak kena masalah CORS pas di-deploy.

Set environment variable di Vercel:

```
SCRIPT_API_URL=https://url-api-asli-kamu.com/api/script/search
```

Buka **Project Settings → Environment Variables** di dashboard Vercel,
isi `SCRIPT_API_URL`, lalu redeploy. Nggak perlu edit kode sama sekali.

Kalau nggak di-set, default-nya fallback ke `https://example.com/...`
(placeholder, otomatis gagal — wajar, karena itu bukan API asli).

Format response yang diharapkan dari API upstream:

```json
{
  "result": {
    "scripts": [
      { "title": "Judul snippet", "script": "console.log('hi')" }
    ]
  }
}
```

## Jalanin lokal dengan API route

```bash
npm i -g vercel
vercel dev
```

(`npm run dev` biasa cuma jalanin Vite, nggak nge-serve folder `api/` —
buat nyoba serverless function-nya lokal, pakai `vercel dev`.)

## Font

Taruh file font `GFF Latin` (Thin/Regular/Medium/Bold, format `.ttf`) di
`public/fonts/`. Kalau belum ada, browser otomatis fallback ke
Helvetica/Arial — situs tetap jalan normal.

## Deploy ke Vercel

1. Push folder ini ke repo GitHub baru.
2. Buka [vercel.com/new](https://vercel.com/new), import repo tersebut.
3. Framework preset: **Vite** (otomatis terdeteksi). Build command:
   `npm run build`, output dir: `dist`.
4. Deploy.

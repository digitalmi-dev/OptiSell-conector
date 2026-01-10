# Cum să Pornești Backend-ul

## Problema: Eroare "Unexpected token '<', "<!DOCTYPE ... is not valid JSON"

Această eroare apare când backend-ul **nu rulează**. Frontend-ul încearcă să facă request-uri către API, dar primește HTML în loc de JSON.

## Soluție: Pornește Backend-ul

### Opțiunea 1: Rulează ambele servere simultan (Recomandat)

Într-un singur terminal:
```bash
npm run dev
```

Aceasta va rula **ambele** servere simultan:
- Backend pe `http://localhost:3001`
- Frontend pe `http://localhost:5173`

### Opțiunea 2: Rulează serverele separat

**Terminal 1 - Backend:**
```bash
npm run dev:server
# SAU
node server/index.js
```

Ar trebui să vezi:
```
Server running on http://localhost:3001
API endpoints available at http://localhost:3001/api
```

**Terminal 2 - Frontend:**
```bash
npm run dev:client
# SAU
npm run dev
```

Ar trebui să vezi:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Verifică că Backend-ul Rulează

**Test manual:**
```bash
curl http://localhost:3001/api/health
```

Ar trebui să returneze:
```json
{"status":"ok","message":"OptiSell Integrator API is running","timestamp":"2024-01-01T00:00:00.000Z"}
```

**Sau deschide în browser:**
```
http://localhost:3001/api/health
```

## Verificare Rapidă

1. **Verifică că backend-ul rulează:**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Verifică că portul 3001 nu este ocupat:**
   ```bash
   # macOS/Linux
   lsof -i :3001
   
   # Dacă portul este ocupat, oprește procesul sau schimbă portul în server/index.js
   ```

3. **Verifică dependențele:**
   ```bash
   npm install
   ```

4. **Verifică că folderul data există:**
   ```bash
   mkdir -p server/data
   ```

## Troubleshooting

### Eroare: "Port 3001 is already in use"

**Soluție 1:** Oprește procesul existent:
```bash
# macOS/Linux
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
# Găsește PID-ul și oprește-l cu:
taskkill /PID <PID> /F
```

**Soluție 2:** Schimbă portul:
```javascript
// server/index.js
const PORT = process.env.PORT || 3002; // Schimbă la alt port

// vite.config.js - actualizează proxy-ul
proxy: {
  '/api': {
    target: 'http://localhost:3002', // Actualizează portul
  }
}
```

### Eroare: "Cannot find module 'express'"

**Soluție:**
```bash
npm install
```

### Eroare: "ENOENT: no such file or directory, open 'server/data/integrations.json'"

**Soluție:**
```bash
mkdir -p server/data
touch server/data/integrations.json
echo "[]" > server/data/integrations.json
```

### Backend-ul nu pornește

**Verifică:**
1. Node.js este instalat: `node --version` (ar trebui să fie v14+)
2. Dependențele sunt instalate: `npm install`
3. Nu există erori în `server/index.js`
4. Portul 3001 nu este ocupat

**Debug:**
```bash
# Rulează backend-ul cu debug
NODE_ENV=development node server/index.js

# Sau adaugă console.log în server/index.js pentru debug
```

## Structură Corectă

```
OptiSell Integrator/
├── server/
│   ├── index.js              # Server principal
│   ├── routes/
│   │   ├── shopify.js        # Rute Shopify
│   │   └── shopifySync.js    # Rute sync
│   ├── services/
│   │   ├── shopifyClient.js  # Client Shopify
│   │   └── shopifySync.js    # Funcții sync
│   ├── storage/
│   │   └── integrations.js   # Storage integrări
│   ├── types/
│   │   └── shopify.js        # Tipuri Shopify
│   └── data/                 # Storage JSON (gitignored)
│       └── integrations.json # Integrări salvate
├── src/
│   └── ...
└── package.json
```

## Scripts Disponibile

Din `package.json`:
- `npm run dev` - Rulează ambele servere simultan
- `npm run dev:server` - Rulează doar backend-ul
- `npm run dev:client` - Rulează doar frontend-ul
- `npm run server` - Alias pentru `dev:server`

## Notă Importantă

**Pentru development local, trebuie să rulezi AMBELE servere:**
- Backend pe portul 3001
- Frontend pe portul 5173

Frontend-ul face request-uri către backend prin proxy-ul configurat în Vite (`/api` → `http://localhost:3001`).

Dacă backend-ul nu rulează, vei primi eroarea "Unexpected token '<', "<!DOCTYPE ... is not valid JSON" deoarece frontend-ul primește HTML în loc de JSON.

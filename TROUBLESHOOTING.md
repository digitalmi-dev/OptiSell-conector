# Troubleshooting - Rezolvare Probleme

## Eroare: "Unexpected token '<', "<!DOCTYPE ... is not valid JSON"

### Problema
Această eroare apare când backend-ul returnează HTML în loc de JSON. De obicei se întâmplă când:
- Backend server-ul nu rulează
- Proxy-ul Vite nu funcționează corect
- Ruta API nu există sau este greșit configurată

### Soluții

#### 1. Verifică că backend-ul rulează

**Verifică manual:**
```bash
# Deschide un terminal și verifică dacă backend-ul rulează
curl http://localhost:3001/api/health

# Ar trebui să returneze:
# {"status":"ok","message":"OptiSell Integrator API is running","timestamp":"..."}
```

**Dacă backend-ul nu rulează:**
```bash
# Într-un terminal separat, rulează backend-ul
npm run dev:server

# SAU
node server/index.js

# Ar trebui să vezi:
# Server running on http://localhost:3001
# API endpoints available at http://localhost:3001/api
```

#### 2. Verifică că ambele servere rulează

**Terminal 1 - Backend:**
```bash
npm run dev:server
# sau
node server/index.js
```

**Terminal 2 - Frontend:**
```bash
npm run dev:client
# sau
npm run dev
```

#### 3. Verifică configurația proxy în Vite

Fișierul `vite.config.js` ar trebui să conțină:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
```

**Dacă proxy-ul nu funcționează:**
- Verifică că portul 3001 nu este deja ocupat de alt proces
- Încearcă să repornești Vite dev server-ul
- Verifică că nu există erori în consola terminalului unde rulează Vite

#### 4. Verifică rutele API în backend

Testează direct endpoint-ul:
```bash
# Health check
curl http://localhost:3001/api/health

# Creare integrare (exemplu)
curl -X POST http://localhost:3001/api/shopify/integrations \
  -H "Content-Type: application/json" \
  -d '{
    "storeName": "test-shop",
    "adminAccessToken": "shpat_test"
  }'
```

#### 5. Verifică porturile

**Verifică dacă portul 3001 este disponibil:**
```bash
# macOS/Linux
lsof -i :3001

# Windows
netstat -ano | findstr :3001

# Dacă portul este ocupat, oprește procesul sau schimbă portul în server/index.js
```

**Schimbă portul dacă este necesar:**
```javascript
// server/index.js
const PORT = process.env.PORT || 3002; // Schimbă la alt port

// vite.config.js - actualizează proxy-ul
proxy: {
  '/api': {
    target: 'http://localhost:3002', // Actualizează portul
    changeOrigin: true,
  }
}
```

#### 6. Verifică erorile în consola

**În browser (Developer Tools → Console):**
- Verifică dacă există erori CORS
- Verifică dacă request-ul ajunge la server
- Verifică răspunsul primit

**În terminal unde rulează backend-ul:**
- Verifică dacă există erori la pornire
- Verifică dacă request-urile ajung la server (ar trebui să vezi log-uri)

#### 7. Verifică structura proiectului

Asigură-te că există folderul `server/data/`:
```bash
mkdir -p server/data
```

Acest folder este folosit pentru a stoca integrările în format JSON.

#### 8. Testează manual backend-ul

**Creează un test script:**
```javascript
// test-backend.js
import { sendProductToShopify } from './server/services/shopifySync.js';

const integrationData = {
  storeName: 'test-shop',
  adminAccessToken: 'shpat_test_token'
};

const productLocalData = {
  name: 'Test Product',
  description: 'Test Description',
  price: '99.99',
  sku: 'TEST123'
};

sendProductToShopify(integrationData, productLocalData)
  .then(result => {
    console.log('✅ Success:', result);
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
```

Rulează:
```bash
node test-backend.js
```

## Eroare: "CORS policy: No 'Access-Control-Allow-Origin' header"

### Problema
Backend-ul nu permite request-uri din frontend din cauza CORS.

### Soluție
Verifică că `server/index.js` include middleware CORS:
```javascript
import cors from 'cors';

app.use(cors());
```

Dacă problema persistă, configurează CORS explicit:
```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

## Eroare: "Cannot find module 'express'"

### Problema
Dependențele nu sunt instalate.

### Soluție
```bash
npm install
```

## Eroare: "ENOENT: no such file or directory, open 'server/data/integrations.json'"

### Problema
Folderul `server/data/` nu există.

### Soluție
```bash
mkdir -p server/data
touch server/data/integrations.json
echo "[]" > server/data/integrations.json
```

Sau verifică că `server/storage/integrations.js` creează folderul automat:
```javascript
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}
```

## Verificare Rapidă - Checklist

- [ ] Backend server rulează pe portul 3001 (`npm run dev:server`)
- [ ] Frontend server rulează pe portul 5173 (`npm run dev:client`)
- [ ] Health check funcționează: `curl http://localhost:3001/api/health`
- [ ] Proxy-ul în Vite este configurat corect (`vite.config.js`)
- [ ] Folderul `server/data/` există
- [ ] Toate dependențele sunt instalate (`npm install`)
- [ ] Nu există erori în consola backend-ului
- [ ] Nu există erori în consola browser-ului
- [ ] Portul 3001 nu este ocupat de alt proces

## Debug Mode

Pentru mai multe informații de debug, adaugă în `server/index.js`:
```javascript
// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});
```

Și în `src/services/api.js`:
```javascript
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('API Request:', url, options); // Debug log
  
  // ... restul codului
}
```

## Suport

Dacă problema persistă:
1. Verifică log-urile din terminalul backend-ului
2. Verifică Network tab în browser Developer Tools
3. Verifică Console tab în browser Developer Tools
4. Verifică că toate fișierele sunt salvate corect
5. Încearcă să repornești ambele servere

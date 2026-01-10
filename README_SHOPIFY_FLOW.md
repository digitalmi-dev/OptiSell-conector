# Shopify Integration - Flow Complet

## Prezentare Generală

Integrarea Shopify pentru OptiSell Integrator este implementată cu un backend Node.js + Express care comunică cu Shopify Admin API. Aplicația rulează local și folosește **Admin API Access Token** pentru autentificare (fără OAuth, pentru simplitate în development).

## Structura Proiectului

```
OptiSell Integrator/
├── server/                      # Backend Node.js + Express
│   ├── index.js                # Server principal
│   ├── routes/
│   │   └── shopify.js          # Rute API pentru Shopify
│   ├── services/
│   │   └── shopifyClient.js    # Client pentru comunicarea cu Shopify Admin API
│   ├── storage/
│   │   └── integrations.js     # Storage pentru integrări (JSON file)
│   ├── types/
│   │   └── shopify.js          # Tipuri și mapping pentru produse Shopify
│   └── data/                   # Director pentru stocare (JSON files)
│       └── integrations.json   # Stocare integrări (gitignored)
├── src/                        # Frontend React
│   ├── pages/
│   │   ├── Connections.jsx     # Gestionează integrările Shopify
│   │   └── Produse.jsx         # Gestionează produsele și sync-ul
│   └── services/
│       └── api.js              # Serviciu API pentru comunicarea cu backend
└── vite.config.js              # Configurare Vite cu proxy către backend
```

## Flow Complet de la Configurare la Sincronizare

### 1. Configurare Integrare Shopify

**Pas 1: Obține Admin API Access Token din Shopify**

1. Accesează **Shopify Admin** → **Settings** → **Apps and sales channels**
2. Click pe **Develop apps** → **Create an app**
3. Dă un nume aplicației (ex: "OptiSell Integrator")
4. Click pe **Configure Admin API scopes**
5. Activează următoarele scope-uri:
   - `read_products`
   - `write_products`
   - `read_inventory`
   - `write_inventory`
6. Click pe **Save**
7. Click pe **Install app**
8. Click pe **Show** lângă **Admin API access token** și copiază token-ul (format: `shpat_xxxxxxxxxxxxxxxxxxxxx`)

**Pas 2: Configurează Integrarea în OptiSell**

1. Deschide aplicația în browser: `http://localhost:5173`
2. Navighează la **Connections** (din sidebar sau din **Integrări** > **eCommerce**)
3. Click pe **Adaugă Conexiune**
4. În modalul care se deschide:
   - **Nume Integrare**: Lasă gol sau dă un nume personalizat (ex: "Shopify - My Shop")
   - **Store Name**: Introduce doar subdomeniul, fără `.myshopify.com` (ex: `optisell-2`)
   - **Admin API Access Token**: Lipește token-ul copiat din Shopify
5. Click pe **Creează Integrare**

**Ce se întâmplă în backend:**
- Backend-ul primește request la `POST /api/shopify/integrations`
- Validează input-ul (storeName și adminAccessToken sunt obligatorii)
- Construiește `shopDomain = storeName + ".myshopify.com"`
- Salvează integrarea în `server/data/integrations.json`:
  ```json
  {
    "id": "1234567890",
    "type": "shopify",
    "name": "Shopify - optisell-2",
    "storeName": "optisell-2",
    "shopDomain": "optisell-2.myshopify.com",
    "adminAccessToken": "shpat_xxxxxxxxxxxxxxxxxxxxx",
    "status": "disconnected",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```
- Returnează integrarea (fără token, pentru securitate)
- Frontend-ul actualizează lista de integrări

### 2. Testare Conexiune

**Pas 1: Testează Conexiunea**

1. În pagina **Connections**, găsește integrarea creată
2. Click pe **Testează Conexiunea**

**Ce se întâmplă în backend:**
- Backend-ul primește request la `POST /api/shopify/integrations/:id/test`
- Găsește integrarea după ID din `integrations.json`
- Creează un `ShopifyClient` cu `shopDomain` și `adminAccessToken`
- Apelează `client.testConnection()` care face:
  - Request către `https://{shopDomain}/admin/api/2024-10/products.json?limit=1`
  - Header: `X-Shopify-Access-Token: {adminAccessToken}`
- Dacă răspunsul este `200 OK`:
  - Actualizează status-ul integrării la `"connected"`
  - Obtine informații despre shop (`GET /admin/api/2024-10/shop.json`)
  - Returnează `{ success: true, message: "...", data: { shop: {...} } }`
- Dacă apare eroare (401, 403, etc.):
  - Actualizează status-ul la `"disconnected"`
  - Returnează `{ success: false, message: "...", error: "..." }`

**Pas 2: Verifică Rezultatul**

- Dacă succes: Badge verde "Conectat" apare, mesaj de succes cu informații despre shop
- Dacă eșuat: Badge gri "Neconectat", mesaj de eroare cu detalii

### 3. Import Produse din Shopify

**Pas 1: Selectează Integrare și Importă**

1. Navighează la **Produse** (din sidebar)
2. În header-ul paginii, selectează integrarea Shopify din dropdown
3. Click pe **Importă din Shopify**

**Ce se întâmplă în backend:**
- Frontend-ul apelează `GET /api/shopify/integrations/:id/products?limit=250`
- Backend-ul:
  - Găsește integrarea după ID
  - Creează `ShopifyClient` cu credențialele
  - Apelează `client.getProducts({ limit: 250 })`
  - Primește lista de produse din Shopify
  - Mapează fiecare produs la format intern OptiSell:
    ```javascript
    {
      id: shopifyProduct.id,
      shopifyId: shopifyProduct.id,
      name: shopifyProduct.title,
      sku: shopifyProduct.variants[0].sku,
      price: shopifyProduct.variants[0].price,
      stock: shopifyProduct.variants[0].inventory_quantity,
      // ... alte câmpuri
    }
    ```
  - Returnează lista de produse mapate

**Pas 2: Actualizare în Frontend**

- Frontend-ul primește produsele
- Pentru fiecare produs:
  - Dacă există deja un produs cu același `shopifyId` sau `sku`, îl actualizează
  - Altfel, creează un produs nou
- Salvează produsele în `localStorage` (pentru moment, poate fi înlocuit cu backend storage)
- Afișează mesaj: "Import complet! X produse importate/actualizate"

### 4. Sincronizare Produse în Shopify

**Opțiune A: Sincronizare Individuală**

1. În tabelul de produse, găsește produsul dorit
2. Click pe butonul **Sync** din coloana Status (doar dacă există SKU și integrare selectată)

**Opțiune B: Sincronizare în Masă**

1. Selectează mai multe produse (checkbox)
2. Click pe **Trimite în Shopify (X)** din header

**Ce se întâmplă în backend:**

**Pentru fiecare produs:**
1. Frontend-ul mapează produsul la format Shopify:
   ```javascript
   {
     title: product.name,
     body_html: product.description,
     vendor: product.brand,
     product_type: product.category,
     tags: product.tags,
     status: product.active ? 'active' : 'draft',
     variants: [{
       sku: product.sku,
       price: product.price,
       compare_at_price: product.comparePrice,
       inventory_quantity: product.stock,
       // ... alte câmpuri
     }],
     images: product.images.map(img => ({ src: img.url }))
   }
   ```

2. Apelează `POST /api/shopify/integrations/:id/products` cu:
   ```json
   {
     "product": { /* produsul în format Shopify */ },
     "shopifyId": "123456789" // opțional, dacă produsul există deja
   }
   ```

3. Backend-ul:
   - Dacă există `shopifyId`: încearcă să actualizeze produsul (`PUT /products/{id}.json`)
   - Dacă nu există `shopifyId` dar există SKU: caută produsul după SKU
     - Dacă găsește: actualizează produsul existent
     - Dacă nu găsește: creează produs nou
   - Dacă nu există nici `shopifyId` nici SKU: creează produs nou

4. Dacă succes:
   - Returnează produsul creat/actualizat cu `shopifyId` și `shopifyVariantId`
   - Frontend-ul actualizează produsul local cu aceste ID-uri
   - Afișează status "success" cu checkmark verde

5. Dacă eșuat:
   - Returnează eroare cu mesaj clar
   - Frontend-ul afișează status "error" cu mesajul de eroare

**Rate Limiting:**
- Pentru sincronizare în masă, există delay de 500ms între request-uri pentru a evita rate limits

## Mapping Câmpuri

| OptiSell | Shopify | Notă |
|----------|---------|------|
| `name` | `title` | Numele produsului |
| `sku` | `variants[0].sku` | SKU (obligatoriu pentru sync) |
| `price` | `variants[0].price` | Preț |
| `comparePrice` | `variants[0].compare_at_price` | Preț redus |
| `stock` | `variants[0].inventory_quantity` | Stoc |
| `description` | `body_html` | Descriere completă |
| `shortDescription` | `body_html` (primele 200 caractere) | Descriere scurtă |
| `brand` | `vendor` | Brand |
| `category` | `product_type` | Categorie |
| `tags` | `tags` | Tag-uri (comma-separated) |
| `weight` | `variants[0].weight` | Greutate (kg) |
| `active` | `status` | `active` / `draft` |
| `images` | `images[]` | Array de imagini |
| `shopifyId` | `id` | ID-ul produsului în Shopify (salvat local) |
| `shopifyVariantId` | `variants[0].id` | ID-ul variantei în Shopify (salvat local) |

## Stocare Date

### Integrări
- **Backend**: `server/data/integrations.json` (gitignored pentru securitate)
- **Format**: Array de obiecte integrare
- **Securitate**: Token-ul este stocat în fișier, dar nu este returnat în răspunsurile API

### Produse
- **Frontend**: `localStorage` (`optisell_products`)
- **Note**: În viitor, poate fi mutat în backend cu o bază de date reală

## Endpoint-uri API

### Integrări
- `POST /api/shopify/integrations` - Creează integrare nouă
- `GET /api/shopify/integrations` - Listă integrări
- `GET /api/shopify/integrations/:id` - Detalii integrare
- `PUT /api/shopify/integrations/:id` - Actualizează integrare
- `DELETE /api/shopify/integrations/:id` - Șterge integrare
- `POST /api/shopify/integrations/:id/test` - Testează conexiunea

### Produse
- `GET /api/shopify/integrations/:id/products` - Listă produse din Shopify
- `POST /api/shopify/integrations/:id/products` - Creează/Actualizează produs (sync inteligent)
- `PUT /api/shopify/integrations/:id/products/:productId` - Actualizează produs existent

## Rulare Proiect

### Backend
```bash
npm run dev:server
# Rulează pe http://localhost:3001
```

### Frontend
```bash
npm run dev:client
# Rulează pe http://localhost:5173
# Proxy automat către backend pe /api
```

### Ambele simultan
```bash
npm run dev
# Rulează ambele procese cu concurrently
```

## Securitate și Limitări

1. **Token Storage**: Token-urile sunt stocate în fișier JSON local (nu în Git)
2. **Rate Limits**: Shopify are rate limits (40 requests/10 secunde) - implementat delay pentru sync în masă
3. **Error Handling**: Toate erorile sunt tratate și returnate cu mesaje clare
4. **Validation**: Input-ul este validat înainte de a fi trimis către Shopify
5. **Development Only**: Această implementare este pentru development local. În producție:
   - Token-urile ar trebui criptate
   - OAuth flow ar trebui procesat pe server
   - Ar trebui implementat rate limiting și retry logic mai robust

## Troubleshooting

### Eroare: "Shopify nu este configurat"
- Verifică că ai creat o integrare în pagina Connections
- Verifică că Store Name și Access Token sunt complete

### Eroare: "401 Unauthorized"
- Token-ul este invalid sau expirat
- Regeneră Admin API Access Token în Shopify
- Actualizează integrarea cu noul token

### Eroare: "422 Unprocessable Entity"
- Datele produsului nu sunt valide
- Verifică că SKU-ul este unic
- Verifică că prețul este un număr valid
- Verifică că toate câmpurile obligatorii sunt complete

### Produsul nu apare în Shopify
- Verifică status-ul în coloana Status din tabel
- Verifică log-urile backend pentru detalii
- Verifică că ai permisiuni de write în Shopify App scopes

### Import nu funcționează
- Verifică că integrarea este conectată (badge verde)
- Verifică că ai permisiuni de read în Shopify App scopes
- Verifică log-urile backend pentru erori

## Pași Următori (Îmbunătățiri Viitoare)

1. **Paginare Completă**: Implementare paginare cu `page_info` pentru import produse
2. **Bulk Operations**: Optimizare pentru sincronizare în masă cu batch requests
3. **Sync Bidirectional**: Sincronizare automată când produsele se schimbă în Shopify
4. **Webhooks**: Implementare webhooks pentru notificări în timp real
5. **Mapping Custom**: Permitere configurării custom a mapping-ului câmpurilor
6. **Baza de Date**: Migrare de la localStorage/JSON files la bază de date reală (PostgreSQL, MongoDB)
7. **Criptare**: Criptare token-uri în storage
8. **Logging**: Sistem de logging complet pentru tracking sincronizări
9. **UI Improvements**: Progress bar pentru sync în masă, filtre și căutare mai avansată

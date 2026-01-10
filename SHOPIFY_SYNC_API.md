# Shopify Sync API - Documentație

## Prezentare

Funcția de sincronizare `sendProductToShopify` trimite produse din baza locală către Shopify folosind Admin API Access Token (shpat_...).

## Funcții Disponibile

### 1. `sendProductToShopify(integrationData, productLocalData)`

Creează un produs nou în Shopify.

**Parametri:**
- `integrationData` (object):
  - `storeName` (string): Numele magazinului (ex: `optisell-3` fără `.myshopify.com`)
  - `adminAccessToken` (string): Admin API Access Token (format: `shpat_...`)

- `productLocalData` (object):
  - `name` (string, obligatoriu): Numele produsului
  - `description` (string, opțional): Descrierea produsului
  - `price` (string, obligatoriu): Prețul produsului (ex: `"99.99"`)
  - `sku` (string, obligatoriu): SKU-ul produsului
  - `stock` (number, opțional): Stocul produsului (default: 0)
  - `brand` (string, opțional): Brand-ul produsului (default: "OptiSell Integrator")
  - `category` (string, opțional): Categoria produsului
  - `tags` (string, opțional): Tag-uri (comma-separated)
  - `comparePrice` (string, opțional): Preț redus
  - `weight` (string, opțional): Greutatea produsului
  - `active` (boolean, opțional): Status produs (default: true → "active")
  - `images` (array, opțional): Array de imagini `[{ url: "...", alt: "..." }]`

**Return:**
```javascript
{
  success: true,
  shopifyProductId: "123456789",
  shopifyVariantId: "987654321",
  product: { /* produsul creat în Shopify */ },
  message: "Produs sincronizat cu succes în Shopify!"
}
```

**Exemplu:**
```javascript
import { sendProductToShopify } from './server/services/shopifySync.js';

const integrationData = {
  storeName: 'optisell-3',
  adminAccessToken: 'shpat_xxxxxxxxxxxxxxxxxxxxx'
};

const productLocalData = {
  name: 'Produs Test',
  description: 'Descriere produs test',
  price: '99.99',
  sku: 'SKU123',
  stock: 100,
  brand: 'OptiSell',
  category: 'Electronics',
  tags: 'test, electronic'
};

const result = await sendProductToShopify(integrationData, productLocalData);

if (result.success) {
  console.log('✅ Produs creat cu succes! ID:', result.shopifyProductId);
} else {
  console.error('❌ Eroare:', result.error);
}
```

### 2. `updateProductInShopify(integrationData, shopifyProductId, productLocalData)`

Actualizează un produs existent în Shopify.

**Parametri:**
- `integrationData` (object): La fel ca mai sus
- `shopifyProductId` (string): ID-ul produsului în Shopify
- `productLocalData` (object): La fel ca mai sus

**Return:** Similar cu `sendProductToShopify`

### 3. `syncProductToShopify(integrationData, productLocalData)`

Sincronizare inteligentă - decide automat dacă să creeze sau să actualizeze produsul.

**Parametri:**
- `integrationData` (object): La fel ca mai sus
- `productLocalData` (object): La fel ca mai sus, dar poate include:
  - `shopifyId` sau `shopifyProductId` (string): Dacă există, actualizează produsul; altfel creează unul nou

**Return:** Similar cu celelalte funcții

## Endpoint-uri API

### POST `/api/shopify/sync/:id`

Sincronizează un produs din baza locală către Shopify.

**URL Parameters:**
- `id` (string): ID-ul integrării Shopify

**Body:**
```json
{
  "productLocalData": {
    "name": "Produs Test",
    "description": "Descriere produs",
    "price": "99.99",
    "sku": "SKU123",
    "stock": 100,
    "brand": "OptiSell",
    "category": "Electronics",
    "tags": "test, electronic",
    "comparePrice": "149.99",
    "weight": "1.5",
    "active": true,
    "images": [
      {
        "url": "https://example.com/image.jpg",
        "alt": "Imagine produs"
      }
    ],
    "shopifyId": "123456789" // Opțional - dacă există, actualizează produsul
  }
}
```

**Response Success (201 sau 200):**
```json
{
  "success": true,
  "message": "Produs sincronizat cu succes în Shopify!",
  "shopifyProductId": "123456789",
  "shopifyVariantId": "987654321",
  "product": {
    "id": 123456789,
    "title": "Produs Test",
    "body_html": "Descriere produs",
    "vendor": "OptiSell",
    "status": "active",
    "variants": [
      {
        "id": 987654321,
        "sku": "SKU123",
        "price": "99.99",
        "inventory_quantity": 100
      }
    ]
  }
}
```

**Response Error (400, 404, etc.):**
```json
{
  "success": false,
  "message": "Eroare la sincronizarea produsului în Shopify.",
  "error": "Token invalid sau Store Name greșit.",
  "status": 401,
  "details": { /* detalii suplimentare */ }
}
```

**Exemplu utilizare cu fetch:**
```javascript
const integrationId = '1234567890'; // ID-ul integrării din baza ta

const productLocalData = {
  name: 'Produs Test',
  description: 'Descriere produs test',
  price: '99.99',
  sku: 'SKU123',
  stock: 100,
  brand: 'OptiSell',
  category: 'Electronics'
};

const response = await fetch(`http://localhost:3001/api/shopify/sync/${integrationId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productLocalData
  })
});

const result = await response.json();

if (result.success) {
  console.log('✅ Produs sincronizat cu succes! ID:', result.shopifyProductId);
  // Salvează shopifyProductId în baza ta locală pentru actualizări ulterioare
  console.log('Shopify Product ID:', result.shopifyProductId);
  console.log('Shopify Variant ID:', result.shopifyVariantId);
} else {
  console.error('❌ Eroare:', result.error);
}
```

### POST `/api/shopify/sync/:id/intelligent`

Sincronizare inteligentă - decide automat create/update pe baza `shopifyId`.

**Body:** La fel ca mai sus

**Exemplu:**
```javascript
// Creează produs nou
const result1 = await fetch(`http://localhost:3001/api/shopify/sync/${integrationId}/intelligent`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productLocalData: {
      name: 'Produs Nou',
      price: '99.99',
      sku: 'SKU123'
    }
  })
});

// Actualizează produs existent (folosind shopifyId)
const result2 = await fetch(`http://localhost:3001/api/shopify/sync/${integrationId}/intelligent`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productLocalData: {
      shopifyId: '123456789', // ID-ul produsului în Shopify
      name: 'Produs Actualizat',
      price: '129.99',
      sku: 'SKU123'
    }
  })
});
```

## Utilizare din Frontend (React)

```javascript
import { shopifyAPI } from '../services/api';

// Sincronizare simplă
const syncProduct = async (integrationId, product) => {
  try {
    const result = await shopifyAPI.syncProduct(integrationId, {
      name: product.name,
      description: product.description,
      price: product.price,
      sku: product.sku,
      stock: product.stock,
      brand: product.brand,
      category: product.category
    });

    if (result.success) {
      console.log('✅ Produs sincronizat! ID:', result.shopifyProductId);
      // Actualizează produsul local cu shopifyProductId
      updateLocalProduct(product.id, {
        shopifyId: result.shopifyProductId,
        shopifyVariantId: result.shopifyVariantId
      });
    }
  } catch (error) {
    console.error('❌ Eroare:', error);
  }
};

// Sincronizare inteligentă
const syncProductIntelligent = async (integrationId, product) => {
  try {
    const result = await shopifyAPI.syncProductIntelligent(integrationId, {
      shopifyId: product.shopifyId, // Dacă există, actualizează; altfel creează
      name: product.name,
      description: product.description,
      price: product.price,
      sku: product.sku,
      stock: product.stock
    });

    if (result.success) {
      console.log('✅ Produs sincronizat!', result);
    }
  } catch (error) {
    console.error('❌ Eroare:', error);
  }
};
```

## Mapping Câmpuri

| OptiSell (Local) | Shopify API | Notă |
|------------------|-------------|------|
| `name` | `product.title` | Obligatoriu |
| `description` | `product.body_html` | Opțional |
| `price` | `product.variants[0].price` | Obligatoriu |
| `sku` | `product.variants[0].sku` | Obligatoriu |
| `stock` | `product.variants[0].inventory_quantity` | Opțional (default: 0) |
| `brand` | `product.vendor` | Opțional (default: "OptiSell Integrator") |
| `category` | `product.product_type` | Opțional |
| `tags` | `product.tags` | Opțional |
| `comparePrice` | `product.variants[0].compare_at_price` | Opțional |
| `weight` | `product.variants[0].weight` | Opțional |
| `active` | `product.status` | `true` → `"active"`, `false` → `"draft"` |
| `images` | `product.images[]` | Array de `{ url, alt }` |

## Error Handling

Toate funcțiile returnează un obiect cu `success: false` în caz de eroare:

```javascript
{
  success: false,
  error: "Mesaj de eroare clar",
  status: 401, // Status code HTTP
  details: { /* detalii suplimentare */ }
}
```

**Erori comune:**
- `401 Unauthorized`: Token invalid sau expirat
- `403 Forbidden`: Nu ai permisiuni
- `404 Not Found`: Produsul nu există (pentru update)
- `422 Unprocessable Entity`: Date invalide (SKU duplicat, preț invalid, etc.)

## Rate Limiting

Shopify are rate limits: **40 requests / 10 secunde** pentru Admin API.

Pentru sincronizare în masă, se recomandă:
- Delay de 500ms între request-uri
- Batch requests când este posibil
- Retry logic pentru rate limit errors (429)

## Notițe Importante

1. **Endpoint API**: Folosește versiunea `2026-01` (cea mai recentă disponibilă)
2. **Header Token**: Token-ul este trimis în header `X-Shopify-Access-Token`
3. **Format Preț**: Prețurile sunt string-uri (ex: `"99.99"`) nu numere
4. **SKU Unic**: SKU-ul trebuie să fie unic în Shopify
5. **Images**: Doar URL-uri absolute sunt suportate (nu file upload direct)

## Exemplu Complet

```javascript
// În backend (server/routes/shopifySync.js sau direct în ruta ta)
import { sendProductToShopify } from '../services/shopifySync.js';
import { findIntegrationById } from '../storage/integrations.js';

// În ruta ta
router.post('/sync-product/:integrationId', async (req, res) => {
  const { integrationId } = req.params;
  const { productLocalData } = req.body;

  // Găsește integrarea
  const integration = findIntegrationById(integrationId);
  
  if (!integration) {
    return res.status(404).json({ success: false, message: 'Integrare nu găsită' });
  }

  // Pregătește datele
  const integrationData = {
    storeName: integration.storeName,
    adminAccessToken: integration.adminAccessToken
  };

  // Sincronizează produsul
  const result = await sendProductToShopify(integrationData, productLocalData);

  if (result.success) {
    res.json({
      success: true,
      shopifyProductId: result.shopifyProductId,
      message: 'Produs sincronizat cu succes!'
    });
  } else {
    res.status(400).json({
      success: false,
      error: result.error
    });
  }
});
```

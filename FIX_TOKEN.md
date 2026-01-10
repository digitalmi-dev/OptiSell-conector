# Rezolvare Problema Token Invalid

## Probleme Identificate și Corectate

### 1. Versiunea API Shopify
**Problema:** Se folosea versiunea `2026-01` care nu este disponibilă.

**Soluție:** Am schimbat la versiunea stabilă `2024-10`.

### 2. Testul Conexiunii
**Problema:** Testul folosea `/products.json` care necesită permisiuni specifice și poate să eșueze chiar și cu token valid.

**Soluție:** Am schimbat la `/shop.json` care este mai simplu și nu necesită permisiuni speciale, doar un token valid.

### 3. Mesaje de Eroare
**Problema:** Mesajele de eroare nu erau clare despre ce anume este greșit.

**Soluție:** Am îmbunătățit mesajele de eroare pentru a fi mai specifice și utile.

## Pași pentru Actualizare Token

### Opțiunea 1: Editează Integrarea Există (Recomandat)

1. În pagina **Connections**, găsește integrarea cu problema
2. Click pe butonul **"Editează"**
3. În modalul care se deschide:
   - **Nu schimba Store Name** (păstrează-l la fel)
   - **Actualizează Admin API Access Token** cu noul token (cel care începe cu `shpat_`)
   - Click pe **"Salvează Modificările"**
4. După salvare, click pe **"Testează Conexiunea"**
5. Ar trebui să vezi mesaj de succes

### Opțiunea 2: Șterge și Creează Din Nou

1. În pagina **Connections**, click pe **"Șterge"** pentru integrarea existentă
2. Click pe **"+ Adaugă Conexiune"**
3. Completează:
   - **Store Name**: `optisell-3` (sau numele tău de magazin, fără `.myshopify.com`)
   - **Admin API Access Token**: Token-ul tău nou (format: `shpat_xxxxxxxxxxxxxxxxxxxxx`)
4. Click pe **"Creează Integrare"**
5. După creare, click pe **"Testează Conexiunea"**

## Verificare Token

### Cum Să Obții Token-ul Corect

1. **Accesează Shopify Admin** → **Settings** → **Apps and sales channels**
2. **Develop apps** → Găsește app-ul tău sau **Create an app** dacă nu există
3. **Configure Admin API scopes**:
   - `read_products`
   - `write_products`
   - `read_inventory`
   - `write_inventory`
4. **Install app** (dacă nu este instalat deja)
5. Click pe **"Show"** lângă **"Admin API access token"**
6. **Copiază întregul token** (ar trebui să înceapă cu `shpat_` și să fie destul de lung)
7. **Lipește token-ul complet** în câmpul "Admin API Access Token" din aplicație

### Verificare Token Corect

Token-ul valid ar trebui să:
- ✅ Înceapă cu `shpat_`
- ✅ Fie destul de lung (cel puțin 32 caractere)
- ✅ Să nu conțină spații sau caractere invalide
- ✅ Să fie token-ul de la Admin API, nu Storefront API sau altul

## Test Manual Token

Poți testa manual token-ul cu curl:

```bash
# Înlocuiește OPTISELL-3 cu numele tău de magazin
# Înlocuiește SHOPIFY_TOKEN cu token-ul tău

curl -X GET "https://optisell-3.myshopify.com/admin/api/2024-10/shop.json" \
  -H "X-Shopify-Access-Token: SHOPIFY_TOKEN" \
  -H "Content-Type: application/json"
```

**Dacă token-ul este valid**, ar trebui să returneze:
```json
{
  "shop": {
    "id": 12345678,
    "name": "Numele Magazinului",
    "email": "email@example.com",
    ...
  }
}
```

**Dacă token-ul este invalid**, vei primi:
```json
{
  "errors": "Invalid API key or access token"
}
```

## Troubleshooting

### Eroare: "Token invalid sau expirat"

**Cauze posibile:**
1. Token-ul nu este copiat complet (spații, linii noi, etc.)
2. Token-ul este de la alt tip de app (Storefront API, Private App vechi, etc.)
3. Token-ul a fost regenerat și cel vechi nu mai funcționează
4. Store Name este greșit

**Soluții:**
1. Copiază token-ul din nou, fără spații sau linii noi
2. Asigură-te că folosești **Admin API access token** de la **Custom App** sau **Private App**
3. Verifică că Store Name este corect (doar numele, fără `.myshopify.com`)
4. Testează token-ul manual cu curl (vezi mai sus)

### Eroare: "Nu ai permisiuni"

**Cauză:** App-ul din Shopify nu are scope-urile necesare configurate.

**Soluție:**
1. Accesează app-ul în Shopify Admin
2. Click pe **"Configure Admin API scopes"**
3. Activează:
   - `read_products`
   - `write_products`
   - `read_inventory`
   - `write_inventory`
4. Click pe **"Save"**
5. Reinstalează app-ul dacă este necesar

### Backend-ul nu răspunde

**Soluție:**
```bash
# Verifică că backend-ul rulează
curl http://localhost:3001/api/health

# Dacă nu răspunde, pornește backend-ul:
npm run dev:server

# SAU rulează ambele servere:
npm run dev
```

## Verificare Finală

După ce ai actualizat token-ul:

1. ✅ Click pe **"Testează Conexiunea"**
2. ✅ Ar trebui să vezi badge verde **"Conectat"**
3. ✅ Ar trebui să vezi mesaj: "Conexiunea cu Shopify a reușit!"
4. ✅ Ar trebui să vezi informații despre shop (nume, email, etc.)

Dacă tot primești eroare, verifică:
- Token-ul este copiat complet
- Store Name este corect
- App-ul din Shopify are scope-urile necesare
- Backend-ul rulează pe portul 3001
- Nu există erori în consola browser-ului (F12 → Console)

## Logging pentru Debug

Dacă problema persistă, verifică log-urile backend-ului:

```bash
# Verifică log-urile backend
tail -f /tmp/backend.log

# SAU verifică direct în terminal unde rulează backend-ul
```

Log-urile vor arăta exact ce eroare returnează Shopify și de ce eșuează conexiunea.

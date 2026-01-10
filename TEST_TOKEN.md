# Test Token - Ghid Rapid

## Probleme Corectate

✅ **Versiunea API:** Schimbat de la `2026-01` la `2024-10` (versiune stabilă Shopify)
✅ **Test Conexiune:** Schimbat de la `/products.json` la `/shop.json` (mai simplu și mai sigur)
✅ **Error Handling:** Îmbunătățit pentru mesaje mai clare
✅ **Logging:** Adăugat logging detaliat pentru debugging

## Pași Pentru Rezolvare

### 1. Actualizează Token-ul

**În pagina Connections:**
1. Găsește integrarea "Shopify - optisell-3"
2. Click pe **"Editează"**
3. În câmpul **"Admin API Access Token"**, lipește token-ul tău nou (cel care începe cu `shpat_`)
4. **IMPORTANT:** Copiază întregul token, fără spații sau linii noi
5. Click pe **"Salvează Modificările"**

### 2. Testează Conexiunea

După salvare:
1. Click pe butonul **"Testează Conexiunea"** (buton albastru cu iconiță refresh)
2. Așteaptă câteva secunde
3. Ar trebui să vezi:
   - ✅ Badge verde "Conectat" în loc de "Neconectat"
   - ✅ Mesaj: "Conexiunea cu Shopify a reușit!"
   - ✅ Informații despre shop (nume, email, etc.)

### 3. Dacă Tot Primești Eroare

**Verifică:**
1. **Token-ul este complet copiat?**
   - Token-ul ar trebui să fie destul de lung
   - Ar trebui să înceapă cu `shpat_`
   - Nu ar trebui să aibă spații sau linii noi

2. **Store Name este corect?**
   - Doar numele magazinului, fără `.myshopify.com`
   - Exemple corecte: `optisell-3`, `my-shop`, `test-store`
   - Exemple greșite: `optisell-3.myshopify.com`, `https://optisell-3.myshopify.com`

3. **Token-ul este de tip Admin API?**
   - Trebuie să fie de la **Custom App** sau **Private App**
   - Nu folosi Storefront API token sau alt tip

4. **App-ul din Shopify are scope-urile necesare?**
   - `read_products`
   - `write_products`
   - `read_inventory`
   - `write_inventory`

## Test Manual Token

Poți testa manual token-ul cu curl:

```bash
# Înlocuiește cu datele tale:
STORE_NAME="optisell-3"
TOKEN="shpat_xxxxxxxxxxxxxxxxxxxxx"

curl -X GET "https://${STORE_NAME}.myshopify.com/admin/api/2024-10/shop.json" \
  -H "X-Shopify-Access-Token: ${TOKEN}" \
  -H "Content-Type: application/json"
```

**Dacă funcționează**, vei vedea informații despre shop în JSON.

**Dacă nu funcționează**, vei vedea o eroare care îți va spune exact ce este greșit.

## Verificare Log-uri Backend

Dacă vrei să vezi exact ce se întâmplă când testezi conexiunea:

```bash
# Vezi log-urile backend în timp real
tail -f /tmp/backend.log

# SAU verifică ultimele linii
tail -20 /tmp/backend.log
```

Log-urile vor arăta:
- Request-ul trimis către Shopify
- Răspunsul primit
- Eroarea (dacă există)
- Detalii despre token și store name

## Dacă Tot Nu Funcționează

1. **Verifică că backend-ul rulează:**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Verifică log-urile backend pentru detalii:**
   ```bash
   tail -50 /tmp/backend.log
   ```

3. **Verifică în browser Console (F12) pentru erori:**
   - Network tab → vezi request-urile către `/api/shopify/...`
   - Console tab → vezi erorile JavaScript

4. **Testează token-ul direct cu curl** (vezi mai sus)

## Notă Importantă

**Backend-ul trebuie să ruleze** pentru ca testul să funcționeze. Verifică că vezi mesajul:
```
Server running on http://localhost:3001
API endpoints available at http://localhost:3001/api
```

Dacă nu vezi acest mesaj, pornește backend-ul:
```bash
npm run dev:server
```

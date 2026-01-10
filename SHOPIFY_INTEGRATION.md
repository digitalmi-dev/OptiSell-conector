# Shopify Integration - Ghid de Configurare

## Prezentare

Aplicația OptiSell Integrator permite sincronizarea produselor cu Shopify. Această integrare suportă:
- Crearea produselor în Shopify
- Actualizarea produselor existente
- Mapping automat între câmpurile OptiSell și Shopify
- Sincronizare individuală sau în masă

## Date Necesare pentru Configurare

### Opțiunea 1: Private App (Recomandat pentru Testing)

1. **Shopify Store Name**
   - Numele magazinului tău (ex: `my-shop`)
   - Se găsește în Shopify Admin > Settings > General

2. **Admin API Access Token**
   - Creează o Private App în Shopify:
     1. Shopify Admin > Apps > App and sales channel settings
     2. Develop apps > Create an app
     3. Configure Admin API scopes:
        - `read_products`
        - `write_products`
        - `read_inventory`
        - `write_inventory`
     4. Install app și copiază Admin API access token

### Opțiunea 2: Public App (OAuth Flow)

1. **Shopify Store Name** (vezi Opțiunea 1)

2. **API Key (Client ID) și API Secret (Client Secret)**
   - Creează o Public App în Shopify Partner Dashboard:
     1. Accesează https://partners.shopify.com
     2. Apps > Create app
     3. Configurează Redirect URI (ex: `https://your-domain.com/integrari/ecommerce`)
     4. Copiază API Key și API Secret

## Configurare în Aplicație

1. **Accesează pagina de Integrări**
   - Navighează la "Integrări" > "eCommerce"

2. **Configurează Shopify**
   - Click pe "Conectează Shopify"
   - Completează datele:
     - **Store Name**: numele magazinului (fără .myshopify.com)
     - **API Key**: Client ID (pentru OAuth) sau lasă gol pentru Private App
     - **API Secret**: Client Secret (doar pentru OAuth)
     - **Access Token**: Admin API Access Token (pentru Private App)

3. **Salvează configurația**
   - Click pe "Salvează"
   - Pentru OAuth: va fi redirectat la Shopify pentru autorizare
   - Pentru Private App: conexiunea se configurează automat

4. **Testează conexiunea**
   - Click pe "Testează Conexiunea"
   - Verifică dacă apare mesajul de succes

## Mapping Câmpuri

| OptiSell | Shopify | Notă |
|----------|---------|------|
| `name` | `title` | Numele produsului |
| `sku` | `variants[0].sku` | Cod SKU (obligatoriu) |
| `price` | `variants[0].price` | Preț |
| `comparePrice` | `variants[0].compare_at_price` | Preț redus |
| `stock` | `variants[0].inventory_quantity` | Stoc |
| `description` | `body_html` | Descriere |
| `shortDescription` | `body_html` (primele 200 caractere) | Descriere scurtă |
| `brand` | `vendor` | Brand |
| `category` | `product_type` | Categorie |
| `tags` | `tags` | Tag-uri |
| `weight` | `variants[0].weight` | Greutate (kg) |
| `ean` | `metafields.custom.ean` | EAN (metafield) |
| `asin` | `metafields.custom.asin` | ASIN (metafield) |
| `images` | `images[]` | Imagini produs |
| `active` | `status` | active/draft |

## Sincronizare Produse

### Sincronizare Individuală

1. Navighează la pagina "Produse"
2. Găsește produsul dorit
3. Click pe butonul "Sync" din coloana Status
4. Așteaptă confirmarea

### Sincronizare în Masă

1. Selectează produsele dorite (checkbox)
2. Click pe "Sincronizează în Shopify" din header
3. Confirmă sincronizarea
4. Urmărește progress-ul pentru fiecare produs

## Caracteristici

- **Sync Inteligent**: Dacă produsul există în Shopify (după SKU), îl actualizează; altfel îl creează
- **Rate Limiting**: 500ms delay între request-uri pentru a evita rate limits
- **Error Handling**: Gestionare completă a erorilor cu mesaje clare
- **Status Tracking**: Status de sincronizare pentru fiecare produs
- **ID Tracking**: Salvează `shopifyId` și `shopifyVariantId` pentru actualizări ulterioare

## Limitări și Notițe

1. **SKU Obligatoriu**: Produsele fără SKU nu pot fi sincronizate
2. **Imagini**: Doar URL-uri absolute sunt suportate (nu file upload direct)
3. **Metafields**: EAN și ASIN sunt salvate ca metafields (necesită metafield access în Shopify)
4. **OAuth**: În producție, OAuth flow-ul ar trebui procesat pe server pentru securitate
5. **Rate Limits**: Shopify are rate limits (40 requests/10 secunde pentru Admin API)

## Troubleshooting

### Eroare: "Shopify nu este configurat"
- Verifică dacă ai salvat configurația
- Asigură-te că Store Name și Access Token sunt complete

### Eroare: "401 Unauthorized"
- Access Token este invalid sau expirat
- Regeneră Access Token în Shopify și actualizează-l în aplicație

### Eroare: "422 Unprocessable Entity"
- Datele produsului nu sunt valide
- Verifică că SKU-ul este unic
- Verifică că prețul este un număr valid

### Produsul nu apare în Shopify
- Verifică status-ul produsului în coloana Status
- Verifică log-urile pentru detalii despre eroare
- Asigură-te că ai permisiuni de write în Shopify App

## Suport

Pentru probleme sau întrebări, verifică:
- Log-urile în pagina "Logs"
- Status-ul sincronizării în coloana Status
- Configurația Shopify în "Integrări" > "eCommerce"

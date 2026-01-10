/**
 * Script pentru testare manuală a token-ului Shopify
 * Usage: node server/test-shopify-token.js <storeName> <token>
 * 
 * Exemplu:
 * node server/test-shopify-token.js optisell-3 shpat_xxxxxxxxxxxxxxxxxxxxx
 */

const STORE_NAME = process.argv[2];
const TOKEN = process.argv[3];

if (!STORE_NAME || !TOKEN) {
  console.error('❌ Usage: node server/test-shopify-token.js <storeName> <token>');
  console.error('Exemplu: node server/test-shopify-token.js optisell-3 shpat_xxxxxxxxxxxxxxxxxxxxx');
  process.exit(1);
}

const cleanStoreName = STORE_NAME.trim().replace(/\.myshopify\.com$/, '').toLowerCase();
const cleanToken = TOKEN.trim().replace(/\s+/g, '');

console.log('\n🔍 Testing Shopify Token...\n');
console.log('Store Name:', cleanStoreName);
console.log('Shop Domain:', `${cleanStoreName}.myshopify.com`);
console.log('Token Prefix:', cleanToken.substring(0, 15) + '...');
console.log('Token Length:', cleanToken.length);
console.log('');

// Validare format token
if (!cleanToken.startsWith('shpat_') && !cleanToken.startsWith('shpca_')) {
  let tokenType = 'necunoscut';
  if (cleanToken.startsWith('shpss_')) {
    tokenType = 'Storefront API Access Token (NU funcționează pentru Admin API)';
  } else if (cleanToken.startsWith('shpcn_')) {
    tokenType = 'Custom App Storefront API Access Token (NU funcționează pentru Admin API)';
  }
  
  console.error('❌ TOKEN INVALID!');
  console.error('Token Type:', tokenType);
  console.error('Token Prefix:', cleanToken.substring(0, 10));
  console.error('');
  console.error('⚠️  Trebuie să folosești Admin API Access Token care începe cu:');
  console.error('   • shpat_ (Private App Admin API Access Token)');
  console.error('   • shpca_ (Custom App Admin API Access Token)');
  console.error('');
  console.error('📖 Vezi documentația: GET_CORRECT_TOKEN.md');
  process.exit(1);
}

console.log('✅ Token format valid (începe cu shpat_ sau shpca_)');
console.log('');

// Test conexiune
const shopifyUrl = `https://${cleanStoreName}.myshopify.com/admin/api/2024-10/shop.json`;

console.log('🌐 Making request to Shopify...');
console.log('URL:', shopifyUrl);
console.log('Method: GET');
console.log('Headers:');
console.log('  X-Shopify-Access-Token:', cleanToken.substring(0, 15) + '...');
console.log('  Content-Type: application/json');
console.log('');

fetch(shopifyUrl, {
  method: 'GET',
  headers: {
    'X-Shopify-Access-Token': cleanToken,
    'Content-Type': 'application/json'
  }
})
  .then(async (response) => {
    console.log('📡 Response Status:', response.status, response.statusText);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status} ${response.statusText}`;
      let errorDetails = null;

      try {
        const errorData = await response.json();
        console.error('❌ Error Response:', JSON.stringify(errorData, null, 2));
        errorDetails = errorData;

        if (errorData.errors) {
          if (typeof errorData.errors === 'string') {
            errorMessage = errorData.errors;
          } else if (Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.join(', ');
          } else {
            errorMessage = JSON.stringify(errorData.errors);
          }
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        const text = await response.text();
        console.error('❌ Error Response (Text):', text);
        errorMessage = text || errorMessage;
      }

      console.error('\n❌ CONEXIUNE EȘUATĂ!');
      console.error('Eroare:', errorMessage);
      
      if (response.status === 401) {
        console.error('');
        console.error('🔍 Posibile cauze:');
        console.error('   1. Token-ul este invalid sau expirat');
        console.error('   2. Token-ul este de tip Storefront API (începe cu shpss_ sau shpcn_)');
        console.error('   3. Store Name este greșit');
        console.error('   4. App-ul nu este instalat în Shopify');
        console.error('');
        console.error('💡 Soluții:');
        console.error('   1. Verifică că token-ul începe cu shpat_ sau shpca_');
        console.error('   2. Verifică că ai copiat Admin API Access Token, NU Storefront API Access Token');
        console.error('   3. Verifică că Store Name este corect (doar numele, fără .myshopify.com)');
        console.error('   4. Verifică în Shopify Admin că app-ul este instalat');
      }

      process.exit(1);
    }

    const data = await response.json();
    
    console.log('✅ CONEXIUNE REUȘITĂ!');
    console.log('');
    console.log('📦 Shop Information:');
    console.log('   ID:', data.shop?.id);
    console.log('   Name:', data.shop?.name);
    console.log('   Email:', data.shop?.email);
    console.log('   Domain:', data.shop?.domain);
    console.log('   Currency:', data.shop?.currency);
    console.log('   Timezone:', data.shop?.timezone);
    console.log('');
    console.log('✅ Token valid și funcționează corect!');
    console.log('');
    console.log('🎯 Pașii următori:');
    console.log('   1. Folosește acest token în aplicația OptiSell Integrator');
    console.log('   2. Actualizează integrarea existentă cu acest token');
    console.log('   3. Testează conexiunea din UI');
    console.log('');
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ EROARE DE REȚEA!');
    console.error('Eroare:', error.message);
    console.error('');
    console.error('🔍 Posibile cauze:');
    console.error('   1. Nu ai conexiune la internet');
    console.error('   2. Store Name este greșit (magazinul nu există)');
    console.error('   3. Eroare DNS (nu poate rezolva domeniul)');
    console.error('');
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('💡 Verifică că Store Name este corect:');
      console.error('   Corect: optisell-3');
      console.error('   Greșit: optisell-3.myshopify.com');
      console.error('   Greșit: https://optisell-3.myshopify.com');
    }
    
    process.exit(1);
  });

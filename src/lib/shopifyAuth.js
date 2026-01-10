/**
 * Shopify OAuth Authentication
 * Gestionează autentificarea OAuth cu Shopify
 */

/**
 * Generează URL-ul pentru OAuth authorization
 * @param {string} shopName - Numele magazinului (ex: "my-shop")
 * @param {string} apiKey - API Key de la Shopify App
 * @param {string} redirectUri - Redirect URI după autentificare
 * @param {array} scopes - Scope-uri necesare (ex: ["read_products", "write_products"])
 */
export function generateAuthURL(shopName, apiKey, redirectUri, scopes = ['read_products', 'write_products', 'read_inventory', 'write_inventory']) {
  const shop = shopName.includes('.myshopify.com') ? shopName : `${shopName}.myshopify.com`;
  const scopeString = scopes.join(',');
  const state = Math.random().toString(36).substring(7); // Random state pentru securitate

  // Salvează state în localStorage pentru verificare
  localStorage.setItem('shopify_oauth_state', state);

  const params = new URLSearchParams({
    client_id: apiKey,
    scope: scopeString,
    redirect_uri: redirectUri,
    state: state
  });

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

/**
 * Verifică și procesează callback-ul OAuth
 * @param {string} code - Authorization code de la callback
 * @param {string} shop - Shop name
 * @param {string} apiKey - API Key
 * @param {string} apiSecret - API Secret
 */
export async function processOAuthCallback(code, shop, apiKey, apiSecret) {
  try {
    // Exchange authorization code pentru access token
    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
    const response = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code: code
      })
    });

    if (!response.ok) {
      throw new Error('Failed to exchange authorization code for access token');
    }

    const data = await response.json();
    
    return {
      success: true,
      accessToken: data.access_token,
      scope: data.scope,
      shop: shopDomain
    };
  } catch (error) {
    console.error('OAuth callback error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Salvează configurația Shopify în localStorage
 * @param {object} config - Configurația Shopify
 */
export function saveShopifyConfig(config) {
  localStorage.setItem('shopify_config', JSON.stringify(config));
}

/**
 * Încarcă configurația Shopify din localStorage
 */
export function loadShopifyConfig() {
  const config = localStorage.getItem('shopify_config');
  return config ? JSON.parse(config) : null;
}

/**
 * Șterge configurația Shopify
 */
export function clearShopifyConfig() {
  localStorage.removeItem('shopify_config');
  localStorage.removeItem('shopify_oauth_state');
}

/**
 * Verifică dacă există o configurație Shopify validă
 */
export function hasShopifyConfig() {
  const config = loadShopifyConfig();
  return config && config.storeName && config.accessToken;
}

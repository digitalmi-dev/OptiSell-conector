import { getShopifyConfig } from "../storage/integrations.js";

const SHOPIFY_API_VERSION = "2024-01";

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID || "";
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET || "";
const SHOPIFY_REDIRECT_URI = process.env.SHOPIFY_REDIRECT_URI || "http://localhost:4000/api/shopify/callback";
const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES || "read_products,write_products,read_inventory,write_inventory";

export function getShopifyCredentials() {
  return {
    clientId: SHOPIFY_CLIENT_ID,
    clientSecret: SHOPIFY_CLIENT_SECRET,
    redirectUri: SHOPIFY_REDIRECT_URI,
    scopes: SHOPIFY_SCOPES,
  };
}

export function createShopifyClient(shopDomain) {
  const config = getShopifyConfig();

  if (!config.access_token) {
    throw new Error("Shopify nu este instalat. Accesează /api/shopify/install pentru a instala.");
  }

  let normalizedDomain = shopDomain ? shopDomain.trim() : "";
  if (normalizedDomain && !normalizedDomain.includes(".myshopify.com")) {
    throw new Error("shopDomain trebuie să conțină .myshopify.com");
  }
  normalizedDomain = normalizedDomain.replace(/^https?:\/\//, "");

  if (!normalizedDomain) {
    throw new Error("shopDomain este obligatoriu");
  }

  const baseUrl = `https://${normalizedDomain}/admin/api/${SHOPIFY_API_VERSION}`;

  async function request(endpoint, method = "GET", body = null) {
    const url = `${baseUrl}${endpoint}`;

    const options = {
      method,
      headers: {
        "X-Shopify-Access-Token": config.access_token,
        "Content-Type": "application/json",
      },
    };

    if (body && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      let errorMessage = `Shopify API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.errors) {
          errorMessage =
            typeof errorData.errors === "string"
              ? errorData.errors
              : JSON.stringify(errorData.errors);
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  }

  async function getProducts(limit = 5) {
    const data = await request(`/products.json?limit=${limit}`, "GET");
    return data.products || [];
  }

  async function testConnection() {
    const data = await request("/shop.json", "GET");
    return data.shop;
  }

  return {
    getProducts,
    testConnection,
  };
}

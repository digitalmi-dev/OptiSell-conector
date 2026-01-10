/**
 * API Service
 * Serviciu centralizat pentru apelurile către backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

/**
 * Face un request către backend API
 * @param {string} endpoint - Endpoint-ul API (ex: "/api/shopify/integrations")
 * @param {object} options - Opțiuni pentru fetch (method, body, etc.)
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  };

  if (options.body && typeof options.body === "object") {
    defaultOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, defaultOptions);

    // Verifică dacă răspunsul este JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      if (text.includes("<!DOCTYPE") || text.includes("<html")) {
        throw new Error(
          "Backend server nu rulează sau returnează HTML. Verifică că serverul backend rulează pe portul 4000."
        );
      }
      throw new Error(`Serverul a returnat un răspuns neașteptat (${contentType})`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("API Request Error:", error);
    throw error;
  }
}

/**
 * Shopify API endpoints
 */
export const shopifyAPI = {
  /**
   * Obține toate integrările Shopify
   * @returns {Promise<object>} Lista de integrări
   */
  getShopifyIntegrations: () => apiRequest("/api/shopify/integrations", { method: "GET" }),

  /**
   * Creează o integrare Shopify nouă
   * @param {object} payload - Datele integrării
   * @param {string} payload.integrationName - Numele integrării (opțional)
   * @param {string} payload.storeDomain - Domeniul magazinului (ex: "nume-magazin.myshopify.com")
   * @param {string} payload.clientId - Client ID (API Key) de la Custom App
   * @param {string} payload.clientSecret - Client Secret (API Secret) de la Custom App
   * @returns {Promise<object>} Integrarea creată
   */
  createShopifyIntegration: (payload) =>
    apiRequest("/api/shopify/integrations", {
      method: "POST",
      body: payload,
    }),

  /**
   * Obține o integrare specifică
   * @param {string} id - ID-ul integrării
   * @returns {Promise<object>} Integrarea
   */
  getShopifyIntegration: (id) => apiRequest(`/api/shopify/integrations/${id}`, { method: "GET" }),

  /**
   * Actualizează o integrare
   * @param {string} id - ID-ul integrării
   * @param {object} payload - Datele actualizate
   * @returns {Promise<object>} Integrarea actualizată
   */
  updateShopifyIntegration: (id, payload) =>
    apiRequest(`/api/shopify/integrations/${id}`, {
      method: "PUT",
      body: payload,
    }),

  /**
   * Șterge o integrare
   * @param {string} id - ID-ul integrării
   * @returns {Promise<object>} Răspuns
   */
  deleteShopifyIntegration: (id) =>
    apiRequest(`/api/shopify/integrations/${id}`, {
      method: "DELETE",
    }),

  /**
   * Testează conexiunea cu Shopify
   * @param {string} id - ID-ul integrării
   * @returns {Promise<object>} Rezultatul testului
   */
  testConnection: (id) =>
    apiRequest(`/api/shopify/integrations/${id}/test`, {
      method: "POST",
    }),

  /**
   * Obține produsele din Shopify
   * @param {string} id - ID-ul integrării
   * @param {object} params - Parametri de paginare
   * @returns {Promise<object>} Lista de produse
   */
  getProducts: (id, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/api/shopify/integrations/${id}/products${queryParams ? `?${queryParams}` : ""}`;
    return apiRequest(endpoint, { method: "GET" });
  },

  /**
   * Sincronizează un produs către Shopify
   * @param {string} id - ID-ul integrării
   * @param {object} productLocalData - Datele produsului
   * @returns {Promise<object>} Rezultatul sincronizării
   */
  syncProduct: (id, productLocalData) =>
    apiRequest(`/api/shopify/integrations/${id}/products`, {
      method: "POST",
      body: { productLocalData },
    }),
};

// Health check
export const healthCheck = () => apiRequest("/api/health", { method: "GET" });

export default apiRequest;

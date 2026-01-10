/**
 * API Service
 * Serviciu centralizat pentru apelurile către backend API
 */

const API_BASE_URL = '/api';

/**
 * Face un request către backend API
 * @param {string} endpoint - Endpoint-ul API (ex: "/shopify/integrations")
 * @param {object} options - Opțiuni pentru fetch (method, body, etc.)
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options
  };

  if (options.body && typeof options.body === 'object') {
    defaultOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, defaultOptions);
    
    // Verifică dacă răspunsul este JSON sau HTML
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Dacă nu este JSON, probabil serverul nu rulează sau returnează o pagină HTML
      if (response.status === 404) {
        throw new Error('Backend server nu rulează sau ruta API nu există. Verifică că serverul backend rulează pe portul 3001.');
      }
      const text = await response.text();
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        throw new Error('Backend server nu rulează sau ruta API nu există. Verifică că serverul backend rulează pe portul 3001. Dacă folosești Vite dev server, rulează și backend-ul separat: npm run dev:server');
      }
      throw new Error(`Serverul a returnat un răspuns neașteptat (${contentType}). Verifică că backend-ul rulează corect.`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    // Dacă eroarea este despre JSON parsing, oferă un mesaj mai clar
    if (error.message.includes('Unexpected token') || error.message.includes('JSON')) {
      throw new Error('Backend server nu rulează sau returnează HTML în loc de JSON. Verifică că serverul backend rulează pe portul 3001: npm run dev:server');
    }
    throw error;
  }
}

/**
 * Shopify API endpoints
 */
export const shopifyAPI = {
  // Integrări
  createIntegration: (data) => apiRequest('/shopify/integrations', {
    method: 'POST',
    body: data
  }),

  getIntegrations: () => apiRequest('/shopify/integrations', {
    method: 'GET'
  }),

  getIntegration: (id) => apiRequest(`/shopify/integrations/${id}`, {
    method: 'GET'
  }),

  updateIntegration: (id, data) => apiRequest(`/shopify/integrations/${id}`, {
    method: 'PUT',
    body: data
  }),

  deleteIntegration: (id) => apiRequest(`/shopify/integrations/${id}`, {
    method: 'DELETE'
  }),

  testConnection: (id) => apiRequest(`/shopify/integrations/${id}/test`, {
    method: 'POST'
  }),

  getProducts: (id, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `/shopify/integrations/${id}/products${queryParams ? `?${queryParams}` : ''}`;
    return apiRequest(endpoint, {
      method: 'GET'
    });
  },

  createProduct: (integrationId, productData, shopifyId = null) => apiRequest(`/shopify/integrations/${integrationId}/products`, {
    method: 'POST',
    body: { productLocalData: productData, product: productData, shopifyId }
  }),

  updateProduct: (integrationId, productId, productData) => apiRequest(`/shopify/integrations/${integrationId}/products/${productId}`, {
    method: 'PUT',
    body: { product: productData }
  }),

  // Rute dedicate pentru sincronizare cu format local
  syncProduct: (integrationId, productLocalData) => apiRequest(`/shopify/sync/${integrationId}`, {
    method: 'POST',
    body: { productLocalData }
  }),

  syncProductIntelligent: (integrationId, productLocalData) => apiRequest(`/shopify/sync/${integrationId}/intelligent`, {
    method: 'POST',
    body: { productLocalData }
  })
};

// Health check
export const healthCheck = () => apiRequest('/health', { method: 'GET' });

export default apiRequest;

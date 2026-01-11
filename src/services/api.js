const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

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

export const shopifyAPI = {
  getShopifyStatus: () => apiRequest("/api/shopify/status", { method: "GET" }),

  getShopifyProducts: (shop, limit = 5) =>
    apiRequest(`/api/shopify/products?shop=${encodeURIComponent(shop)}&limit=${limit}`, {
      method: "GET",
    }),
};

export const healthCheck = () => apiRequest("/api/health", { method: "GET" });

export default apiRequest;

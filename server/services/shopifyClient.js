const SHOPIFY_API_VERSION = "2024-01";

export function createShopifyClient({ storeDomain, adminApiAccessToken }) {
  if (!storeDomain || !adminApiAccessToken) {
    throw new Error("storeDomain și adminApiAccessToken sunt obligatorii");
  }

  let normalizedDomain = storeDomain.trim();
  if (!normalizedDomain.includes(".myshopify.com")) {
    throw new Error("storeDomain trebuie să conțină .myshopify.com");
  }
  normalizedDomain = normalizedDomain.replace(/^https?:\/\//, "");

  const baseUrl = `https://${normalizedDomain}/admin/api/${SHOPIFY_API_VERSION}`;

  async function testConnection() {
    const url = `${baseUrl}/shop.json`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": adminApiAccessToken,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      const error = new Error("Token invalid sau expirat");
      error.status = 401;
      throw error;
    }

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

    const data = await response.json();
    return data.shop;
  }

  return {
    testConnection,
  };
}

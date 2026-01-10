const SHOPIFY_API_VERSION = "2024-01";

export function createShopifyClient({ storeDomain, accessToken }) {
  if (!storeDomain || !accessToken) {
    throw new Error("storeDomain și accessToken sunt obligatorii");
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
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

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

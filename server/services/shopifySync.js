/**
 * Shopify Sync Service
 * Funcție pentru sincronizarea produselor către Shopify
 */

const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2024-01";

/**
 * Trimite un produs către Shopify
 * @param {object} config - Configurația
 * @param {string} config.storeDomain - Domeniul magazinului (ex: "nume-magazin.myshopify.com")
 * @param {string} config.adminAccessToken - Admin API Access Token
 * @param {object} productLocalData - Datele produsului din baza locală
 * @param {string} productLocalData.name - Numele produsului
 * @param {string} productLocalData.description - Descrierea produsului
 * @param {string} productLocalData.price - Prețul produsului
 * @param {string} productLocalData.sku - SKU-ul produsului
 * @returns {Promise<object>} Rezultatul sincronizării
 */
export async function sendProductToShopify({ storeDomain, adminAccessToken }, productLocalData) {
  // Normalizează storeDomain
  let normalizedDomain = storeDomain.trim();
  if (!normalizedDomain.includes(".myshopify.com")) {
    throw new Error("storeDomain trebuie să conțină .myshopify.com");
  }
  normalizedDomain = normalizedDomain.replace(/^https?:\/\//, "");

  const url = `https://${normalizedDomain}/admin/api/${SHOPIFY_API_VERSION}/products.json`;

  // Construiește payload-ul pentru produs
  const productPayload = {
    product: {
      title: productLocalData.name || "Produs fără nume",
      body_html: productLocalData.description || "",
      vendor: productLocalData.brand || "OptiSell Integrator",
      status: productLocalData.active !== false ? "active" : "draft",
      variants: [
        {
          price: productLocalData.price || "0.00",
          sku: productLocalData.sku || "",
          inventory_management: "shopify",
          inventory_policy: "deny",
          inventory_quantity: productLocalData.stock || 0,
        },
      ],
    },
  };

  // Adaugă câmpuri opționale
  if (productLocalData.category) {
    productPayload.product.product_type = productLocalData.category;
  }

  if (productLocalData.tags) {
    productPayload.product.tags = productLocalData.tags;
  }

  if (productLocalData.comparePrice) {
    productPayload.product.variants[0].compare_at_price = productLocalData.comparePrice;
  }

  if (productLocalData.weight) {
    productPayload.product.variants[0].weight = parseFloat(productLocalData.weight);
    productPayload.product.variants[0].weight_unit = "kg";
  }

  // Adaugă imagini dacă există
  if (productLocalData.images && productLocalData.images.length > 0) {
    productPayload.product.images = productLocalData.images
      .map((img, index) => ({
        src: img.url || img.preview || img.src || "",
        alt: productLocalData.name || `Image ${index + 1}`,
        position: index + 1,
      }))
      .filter((img) => img.src);
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": adminAccessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productPayload),
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

      return {
        success: false,
        error: errorMessage,
        status: response.status,
      };
    }

    const responseData = await response.json();

    if (responseData.product) {
      return {
        success: true,
        shopifyProductId: responseData.product.id,
        shopifyVariantId: responseData.product.variants?.[0]?.id || null,
        product: responseData.product,
        message: "Produs sincronizat cu succes în Shopify!",
      };
    } else {
      return {
        success: false,
        error: "Răspuns Shopify fără produs",
        details: responseData,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: error,
    };
  }
}

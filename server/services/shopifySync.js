/**
 * Shopify Sync Service
 * Funcție dedicată pentru sincronizarea produselor către Shopify
 * Folosește Admin API Access Token (shpat_...)
 */

/**
 * Funcție principală pentru trimiterea produselor către Shopify
 * Aceasta folosește Admin API Access Token-ul (shpat_...)
 * 
 * @param {object} integrationData - Datele integrării Shopify
 * @param {string} integrationData.storeName - Numele magazinului (ex: optisell-3)
 * @param {string} integrationData.adminAccessToken - Admin API Access Token (shpat_...)
 * @param {object} productLocalData - Datele produsului din baza locală
 * @param {string} productLocalData.name - Numele produsului
 * @param {string} productLocalData.description - Descrierea produsului
 * @param {string} productLocalData.price - Prețul produsului
 * @param {string} productLocalData.sku - SKU-ul produsului
 * @returns {Promise<object>} - Rezultatul sincronizării
 */
export async function sendProductToShopify(integrationData, productLocalData) {
  // Construiește URL-ul Shopify
  const storeName = integrationData.storeName.includes('.myshopify.com')
    ? integrationData.storeName.replace('.myshopify.com', '')
    : integrationData.storeName;
  
  const shopifyUrl = `https://${storeName}.myshopify.com/admin/api/2024-10/products.json`; // Versiune stabilă Shopify API
  
  // Construiește payload-ul pentru produs
  const productPayload = {
    product: {
      title: productLocalData.name || 'Produs fără nume',
      body_html: productLocalData.description || '',
      vendor: productLocalData.brand || 'OptiSell Integrator',
      status: productLocalData.active !== false ? 'active' : 'draft',
      variants: [
        {
          price: productLocalData.price || '0.00',
          sku: productLocalData.sku || '',
          inventory_management: 'shopify',
          inventory_policy: 'deny',
          inventory_quantity: productLocalData.stock || 0
        }
      ]
    }
  };

  // Adaugă câmpuri opționale dacă există
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
    productPayload.product.variants[0].weight_unit = 'kg';
  }

  // Adaugă imagini dacă există
  if (productLocalData.images && productLocalData.images.length > 0) {
    productPayload.product.images = productLocalData.images.map((img, index) => ({
      src: img.url || img.preview || img.src || '',
      alt: productLocalData.name || `Image ${index + 1}`,
      position: index + 1
    })).filter(img => img.src); // Filtrează imaginile fără URL
  }

  try {
    const response = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': integrationData.adminAccessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productPayload)
    });

    if (!response.ok) {
      let errorMessage = `Shopify API Error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.errors) {
          errorMessage = typeof errorData.errors === 'string'
            ? errorData.errors
            : JSON.stringify(errorData.errors);
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (e) {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }

      console.error('❌ Eroare la sincronizarea Shopify:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        status: response.status
      };
    }

    const responseData = await response.json();

    if (responseData.product) {
      console.log('✅ Produs sincronizat cu succes în Shopify ID:', responseData.product.id);
      return {
        success: true,
        shopifyProductId: responseData.product.id,
        shopifyVariantId: responseData.product.variants?.[0]?.id || null,
        product: responseData.product,
        message: 'Produs sincronizat cu succes în Shopify!'
      };
    } else {
      console.error('❌ Eroare: Răspuns Shopify fără produs', responseData);
      return {
        success: false,
        error: 'Răspuns Shopify fără produs',
        details: responseData
      };
    }
  } catch (error) {
    console.error('❌ Eroare la sincronizarea Shopify:', error.message);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
}

/**
 * Funcție pentru actualizarea unui produs existent în Shopify
 * 
 * @param {object} integrationData - Datele integrării Shopify
 * @param {string} shopifyProductId - ID-ul produsului în Shopify
 * @param {object} productLocalData - Datele actualizate ale produsului
 * @returns {Promise<object>} - Rezultatul actualizării
 */
export async function updateProductInShopify(integrationData, shopifyProductId, productLocalData) {
  const storeName = integrationData.storeName.includes('.myshopify.com')
    ? integrationData.storeName.replace('.myshopify.com', '')
    : integrationData.storeName;
  
  const shopifyUrl = `https://${storeName}.myshopify.com/admin/api/2024-10/products/${shopifyProductId}.json`; // Versiune stabilă Shopify API
  
  const productPayload = {
    product: {
      id: shopifyProductId,
      title: productLocalData.name || 'Produs fără nume',
      body_html: productLocalData.description || '',
      vendor: productLocalData.brand || 'OptiSell Integrator',
      status: productLocalData.active !== false ? 'active' : 'draft'
    }
  };

  // Actualizează variantele dacă există
  if (productLocalData.shopifyVariantId) {
    productPayload.product.variants = [{
      id: productLocalData.shopifyVariantId,
      price: productLocalData.price || '0.00',
      sku: productLocalData.sku || '',
      inventory_quantity: productLocalData.stock || 0
    }];

    if (productLocalData.comparePrice) {
      productPayload.product.variants[0].compare_at_price = productLocalData.comparePrice;
    }

    if (productLocalData.weight) {
      productPayload.product.variants[0].weight = parseFloat(productLocalData.weight);
      productPayload.product.variants[0].weight_unit = 'kg';
    }
  }

  if (productLocalData.category) {
    productPayload.product.product_type = productLocalData.category;
  }

  if (productLocalData.tags) {
    productPayload.product.tags = productLocalData.tags;
  }

  try {
    const response = await fetch(shopifyUrl, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': integrationData.adminAccessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productPayload)
    });

    if (!response.ok) {
      let errorMessage = `Shopify API Error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.errors) {
          errorMessage = typeof errorData.errors === 'string'
            ? errorData.errors
            : JSON.stringify(errorData.errors);
        }
      } catch (e) {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }

      console.error('❌ Eroare la actualizarea produsului în Shopify:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        status: response.status
      };
    }

    const responseData = await response.json();

    if (responseData.product) {
      console.log('✅ Produs actualizat cu succes în Shopify ID:', responseData.product.id);
      return {
        success: true,
        shopifyProductId: responseData.product.id,
        shopifyVariantId: responseData.product.variants?.[0]?.id || null,
        product: responseData.product,
        message: 'Produs actualizat cu succes în Shopify!'
      };
    } else {
      return {
        success: false,
        error: 'Răspuns Shopify fără produs',
        details: responseData
      };
    }
  } catch (error) {
    console.error('❌ Eroare la actualizarea produsului în Shopify:', error.message);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
}

/**
 * Funcție pentru sincronizare inteligentă (create sau update)
 * 
 * @param {object} integrationData - Datele integrării Shopify
 * @param {object} productLocalData - Datele produsului din baza locală
 * @returns {Promise<object>} - Rezultatul sincronizării
 */
export async function syncProductToShopify(integrationData, productLocalData) {
  // Dacă produsul are deja shopifyId, actualizează-l
  if (productLocalData.shopifyId || productLocalData.shopifyProductId) {
    const shopifyId = productLocalData.shopifyId || productLocalData.shopifyProductId;
    return await updateProductInShopify(integrationData, shopifyId, productLocalData);
  }

  // Altfel, creează produs nou
  return await sendProductToShopify(integrationData, productLocalData);
}

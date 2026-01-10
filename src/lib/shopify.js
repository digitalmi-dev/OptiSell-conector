/**
 * Shopify API Service
 * Gestionează comunicarea cu Shopify API
 */

class ShopifyService {
  constructor() {
    this.baseURL = null;
    this.accessToken = null;
    this.storeName = null;
  }

  /**
   * Configurează conexiunea Shopify
   * @param {string} storeName - Numele magazinului (ex: "my-shop")
   * @param {string} accessToken - Access token de la OAuth
   */
  configure(storeName, accessToken) {
    this.storeName = storeName;
    this.accessToken = accessToken;
    // Shopify API URL format: https://{store}.myshopify.com/admin/api/{version}/
    this.baseURL = `https://${storeName}.myshopify.com/admin/api/2024-01`;
  }

  /**
   * Verifică dacă conexiunea este configurată
   */
  isConfigured() {
    return this.storeName && this.accessToken && this.baseURL;
  }

  /**
   * Face un request către Shopify API
   * @param {string} endpoint - Endpoint-ul API (ex: "/products.json")
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {object} data - Datele pentru POST/PUT
   */
  async request(endpoint, method = 'GET', data = null) {
    if (!this.isConfigured()) {
      throw new Error('Shopify nu este configurat. Te rugăm să configurezi conexiunea mai întâi.');
    }

    const url = `${this.baseURL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.accessToken,
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.errors 
            ? JSON.stringify(responseData.errors)
            : `Shopify API Error: ${response.status} ${response.statusText}`
        );
      }

      return responseData;
    } catch (error) {
      console.error('Shopify API Error:', error);
      throw error;
    }
  }

  /**
   * Verifică conexiunea cu Shopify
   */
  async testConnection() {
    try {
      const response = await this.request('/shop.json');
      return {
        success: true,
        shop: response.shop,
        message: 'Conexiunea cu Shopify a reușit!'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Conexiunea cu Shopify a eșuat!'
      };
    }
  }

  /**
   * Creează un produs în Shopify
   * @param {object} productData - Datele produsului
   */
  async createProduct(productData) {
    try {
      const shopifyProduct = this.mapToShopifyProduct(productData);
      
      const response = await this.request('/products.json', 'POST', {
        product: shopifyProduct
      });

      return {
        success: true,
        product: response.product,
        message: 'Produsul a fost creat cu succes în Shopify!'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Eroare la crearea produsului în Shopify!'
      };
    }
  }

  /**
   * Actualizează un produs existent în Shopify
   * @param {string} shopifyProductId - ID-ul produsului în Shopify
   * @param {object} productData - Datele actualizate ale produsului
   */
  async updateProduct(shopifyProductId, productData) {
    try {
      const shopifyProduct = this.mapToShopifyProduct(productData);
      shopifyProduct.id = shopifyProductId;

      const response = await this.request(`/products/${shopifyProductId}.json`, 'PUT', {
        product: shopifyProduct
      });

      return {
        success: true,
        product: response.product,
        message: 'Produsul a fost actualizat cu succes în Shopify!'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Eroare la actualizarea produsului în Shopify!'
      };
    }
  }

  /**
   * Șterge un produs din Shopify
   * @param {string} shopifyProductId - ID-ul produsului în Shopify
   */
  async deleteProduct(shopifyProductId) {
    try {
      await this.request(`/products/${shopifyProductId}.json`, 'DELETE');

      return {
        success: true,
        message: 'Produsul a fost șters cu succes din Shopify!'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Eroare la ștergerea produsului din Shopify!'
      };
    }
  }

  /**
   * Caută un produs în Shopify după SKU
   * @param {string} sku - SKU-ul produsului
   */
  async findProductBySKU(sku) {
    try {
      const response = await this.request(`/products.json?sku=${encodeURIComponent(sku)}`);
      
      if (response.products && response.products.length > 0) {
        // Caută variant-ul cu SKU-ul specific
        for (const product of response.products) {
          const variant = product.variants.find(v => v.sku === sku);
          if (variant) {
            return {
              success: true,
              product: product,
              variant: variant
            };
          }
        }
      }

      return {
        success: false,
        message: 'Produsul nu a fost găsit în Shopify'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mapează datele produsului nostru la formatul Shopify
   * @param {object} product - Produsul nostru
   */
  mapToShopifyProduct(product) {
    const shopifyProduct = {
      title: product.name || 'Produs fără nume',
      body_html: product.description || product.shortDescription || '',
      vendor: product.brand || '',
      product_type: product.category || '',
      tags: product.tags ? product.tags.split(',').map(t => t.trim()).join(',') : '',
      variants: [{
        sku: product.sku || '',
        price: product.price || '0.00',
        compare_at_price: product.comparePrice || null,
        inventory_quantity: parseInt(product.stock) || 0,
        inventory_management: 'shopify',
        inventory_policy: 'deny',
        taxable: true,
        weight: product.weight ? parseFloat(product.weight) : null,
        weight_unit: 'kg',
        requires_shipping: true,
      }],
      images: product.images && product.images.length > 0
        ? product.images.map(img => ({
            src: img.preview || img.url || '',
            alt: product.name || ''
          }))
        : [],
      status: product.active ? 'active' : 'draft',
    };

    // Adaugă metafields pentru EAN, ASIN dacă există
    const metafields = [];
    if (product.ean) {
      metafields.push({
        namespace: 'custom',
        key: 'ean',
        value: product.ean,
        type: 'single_line_text_field'
      });
    }
    if (product.asin) {
      metafields.push({
        namespace: 'custom',
        key: 'asin',
        value: product.asin,
        type: 'single_line_text_field'
      });
    }

    // Adaugă dimensiuni la variant
    if (product.length || product.width || product.height) {
      shopifyProduct.variants[0].option1 = product.length || '';
      shopifyProduct.variants[0].option2 = product.width || '';
      shopifyProduct.variants[0].option3 = product.height || '';
    }

    if (metafields.length > 0) {
      shopifyProduct.metafields_global_title_tag = shopifyProduct.title;
    }

    return shopifyProduct;
  }

  /**
   * Sincronizează un produs în Shopify (create sau update)
   * @param {object} product - Produsul nostru
   */
  async syncProduct(product) {
    try {
      // Verifică dacă produsul există deja în Shopify
      if (product.shopifyId) {
        // Produsul există, actualizează-l
        return await this.updateProduct(product.shopifyId, product);
      } else if (product.sku) {
        // Caută după SKU
        const found = await this.findProductBySKU(product.sku);
        if (found.success && found.product) {
          // Produsul există, actualizează-l
          return await this.updateProduct(found.product.id, product);
        }
      }

      // Produsul nu există, creează-l
      const result = await this.createProduct(product);
      
      // Salvează shopifyId în produsul nostru
      if (result.success && result.product) {
        return {
          ...result,
          shopifyId: result.product.id,
          shopifyVariantId: result.product.variants?.[0]?.id
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Eroare la sincronizarea produsului în Shopify!'
      };
    }
  }

  /**
   * Sincronizează multiple produse
   * @param {array} products - Array de produse
   * @param {function} onProgress - Callback pentru progress (index, total, product, result)
   */
  async syncMultipleProducts(products, onProgress = null) {
    const results = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const result = await this.syncProduct(product);
      
      results.push({
        productId: product.id,
        productName: product.name,
        success: result.success,
        shopifyId: result.shopifyId || product.shopifyId,
        error: result.error,
        message: result.message
      });

      if (onProgress) {
        onProgress(i + 1, products.length, product, result);
      }

      // Rate limiting - așteaptă 500ms între request-uri pentru a evita rate limits
      if (i < products.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  }
}

// Exportăm o instanță singleton
export default new ShopifyService();

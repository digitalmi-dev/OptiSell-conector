/**
 * Shopify Admin API Client
 * Client pentru comunicarea cu Shopify Admin API
 * Versiune: 2024-10 (stabilă)
 */

export class ShopifyClient {
  constructor(shopDomain, adminAccessToken) {
    if (!shopDomain || !adminAccessToken) {
      throw new Error('shopDomain și adminAccessToken sunt obligatorii');
    }

    // Clean up shopDomain - elimină spații și caractere invalide
    let cleanDomain = shopDomain.trim();
    
    // Asigură că shopDomain are formatul corect
    if (!cleanDomain.includes('.myshopify.com')) {
      cleanDomain = `${cleanDomain}.myshopify.com`;
    } else {
      // Elimină https:// dacă există
      cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
    }

    // Clean up token - elimină spații și linii noi
    const cleanToken = adminAccessToken.trim().replace(/\s+/g, '');

    this.shopDomain = cleanDomain;
    this.adminAccessToken = cleanToken;
    this.apiVersion = '2024-10'; // Versiune stabilă Shopify API
    this.baseURL = `https://${cleanDomain}/admin/api/${this.apiVersion}`;

    console.log('[ShopifyClient] Client creat:', {
      shopDomain: this.shopDomain,
      baseURL: this.baseURL,
      apiVersion: this.apiVersion,
      hasToken: !!this.adminAccessToken,
      tokenLength: this.adminAccessToken ? this.adminAccessToken.length : 0,
      tokenPrefix: this.adminAccessToken ? this.adminAccessToken.substring(0, 15) + '...' : 'N/A'
    });
  }

  /**
   * Face un request către Shopify Admin API
   * @param {string} endpoint - Endpoint-ul API (ex: "/products.json")
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {object} data - Datele pentru POST/PUT
   * @param {object} params - Query parameters pentru GET
   */
  async request(endpoint, method = 'GET', data = null, params = null) {
    let url = `${this.baseURL}${endpoint}`;

    // Adaugă query parameters dacă există
    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.adminAccessToken,
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    console.log('[ShopifyClient] Request:', {
      url,
      method,
      endpoint,
      hasBody: !!options.body,
      headers: {
        'Content-Type': options.headers['Content-Type'],
        'X-Shopify-Access-Token': options.headers['X-Shopify-Access-Token'] ? 
          options.headers['X-Shopify-Access-Token'].substring(0, 15) + '...' : 'N/A'
      },
      timestamp: new Date().toISOString()
    });

    try {
      const startTime = Date.now();
      const response = await fetch(url, options);
      const duration = Date.now() - startTime;

      console.log('[ShopifyClient] Response:', {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        duration: `${duration}ms`,
        ok: response.ok
      });

      // Verifică dacă răspunsul este ok
      if (!response.ok) {
        let errorMessage = `Shopify API Error: ${response.status} ${response.statusText}`;
        let errorDetails = null;
        
        try {
          const errorData = await response.json();
          console.log('[ShopifyClient] Error Response Data:', JSON.stringify(errorData, null, 2));
          
          if (errorData.errors) {
            if (typeof errorData.errors === 'string') {
              errorMessage = errorData.errors;
            } else if (Array.isArray(errorData.errors)) {
              errorMessage = errorData.errors.join(', ');
            } else if (typeof errorData.errors === 'object') {
              errorMessage = JSON.stringify(errorData.errors);
            }
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
          
          errorDetails = errorData;
        } catch (e) {
          // Nu s-a putut parse JSON-ul de eroare
          const text = await response.text();
          console.log('[ShopifyClient] Error Response Text:', text);
          errorMessage = text || errorMessage;
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.response = response;
        error.details = errorDetails;
        
        console.error('[ShopifyClient] Request Failed:', {
          url,
          status: error.status,
          message: error.message,
          details: error.details
        });

        throw error;
      }

      // Parse JSON response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const jsonData = await response.json();
        console.log('[ShopifyClient] Success Response:', {
          url,
          status: response.status,
          dataKeys: Object.keys(jsonData),
          hasShop: !!jsonData.shop,
          hasProducts: !!jsonData.products
        });
        return jsonData;
      } else {
        const textData = await response.text();
        console.log('[ShopifyClient] Non-JSON Response:', {
          url,
          status: response.status,
          contentType,
          textLength: textData.length,
          textPreview: textData.substring(0, 200)
        });
        return textData;
      }
    } catch (error) {
      console.error('[ShopifyClient] Request Error:', {
        url,
        method,
        endpoint,
        status: error.status,
        message: error.message,
        stack: error.stack,
        shopDomain: this.shopDomain,
        apiVersion: this.apiVersion,
        hasToken: !!this.adminAccessToken,
        tokenPrefix: this.adminAccessToken ? this.adminAccessToken.substring(0, 15) + '...' : 'N/A',
        errorType: error.name,
        errorDetails: error.details
      });
      
      // Dacă eroarea nu are status, înseamnă că este o eroare de rețea sau de fetch
      if (!error.status) {
        throw new Error(`Eroare de rețea: ${error.message}. Verifică că Store Name este corect și că ai conexiune la internet.`);
      }
      
      throw error;
    }
  }

  /**
   * Testează conexiunea cu Shopify
   * Folosește /shop.json care este cel mai simplu endpoint
   */
  async testConnection() {
    console.log('[ShopifyClient] Testing connection...');
    
    try {
      // Folosim /shop.json care este cel mai simplu endpoint și necesită doar token valid
      const response = await this.request('/shop.json', 'GET');
      
      console.log('[ShopifyClient] Test Connection Response:', {
        hasShop: !!response.shop,
        shopName: response.shop?.name,
        shopEmail: response.shop?.email,
        shopDomain: response.shop?.domain
      });
      
      if (response.shop) {
        return {
          success: true,
          message: 'Conexiunea cu Shopify a reușit!',
          shop: response.shop
        };
      } else {
        console.error('[ShopifyClient] Test Connection Failed: Răspuns invalid', response);
        return {
          success: false,
          error: 'Răspuns invalid de la Shopify',
          message: 'Shopify a returnat un răspuns neașteptat',
          response: response
        };
      }
    } catch (error) {
      console.error('[ShopifyClient] Test Connection Error:', {
        status: error.status,
        message: error.message,
        details: error.details,
        stack: error.stack
      });
      
      return {
        success: false,
        error: error.message,
        status: error.status,
        message: this.getErrorMessage(error.status),
        details: error.details
      };
    }
  }

  /**
   * Obține lista de produse
   * @param {object} params - Parametri de paginare și filtrare
   * @param {number} params.limit - Număr de produse per pagină (max 250)
   * @param {string} params.page_info - Cursor pentru paginare
   * @param {string} params.ids - Comma-separated list de IDs
   * @param {string} params.status - Status filter (active, archived, draft)
   */
  async getProducts(params = {}) {
    const defaultParams = {
      limit: params.limit || 50,
      ...params
    };

    return await this.request('/products.json', 'GET', null, defaultParams);
  }

  /**
   * Obține un produs după ID
   * @param {string} productId - ID-ul produsului în Shopify
   */
  async getProductById(productId) {
    return await this.request(`/products/${productId}.json`, 'GET');
  }

  /**
   * Creează un produs nou în Shopify
   * @param {object} productData - Datele produsului în format Shopify
   */
  async createProduct(productData) {
    return await this.request('/products.json', 'POST', { product: productData });
  }

  /**
   * Actualizează un produs existent în Shopify
   * @param {string} productId - ID-ul produsului în Shopify
   * @param {object} productData - Datele actualizate ale produsului
   */
  async updateProduct(productId, productData) {
    return await this.request(`/products/${productId}.json`, 'PUT', { product: productData });
  }

  /**
   * Șterge un produs din Shopify
   * @param {string} productId - ID-ul produsului în Shopify
   */
  async deleteProduct(productId) {
    return await this.request(`/products/${productId}.json`, 'DELETE');
  }

  /**
   * Caută un produs după SKU
   * @param {string} sku - SKU-ul produsului
   */
  async findProductBySKU(sku) {
    try {
      const response = await this.getProducts({ limit: 250 });
      
      if (response.products && response.products.length > 0) {
        for (const product of response.products) {
          const variant = product.variants?.find(v => v.sku === sku);
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
   * Obține informații despre shop
   */
  async getShop() {
    return await this.request('/shop.json', 'GET');
  }

  /**
   * Returnează un mesaj de eroare user-friendly pe baza status code-ului
   */
  getErrorMessage(status) {
    if (!status) {
      return 'Eroare necunoscută. Verifică că Store Name este corect și că ai conexiune la internet.';
    }

    switch (status) {
      case 401:
        return 'Token invalid sau expirat. Verifică Admin API Access Token. Asigură-te că token-ul începe cu "shpat_" și este complet copiat. Verifică că token-ul nu a expirat și că app-ul este instalat în Shopify.';
      case 403:
        return 'Nu ai permisiuni pentru această acțiune. Verifică scope-urile în Shopify App (read_products, write_products, read_inventory, write_inventory).';
      case 404:
        return 'Resursa nu a fost găsită în Shopify. Verifică că Store Name este corect (doar numele, fără .myshopify.com).';
      case 422:
        return 'Date invalide. Verifică că toate câmpurile sunt corecte și că SKU-ul este unic.';
      case 429:
        return 'Prea multe request-uri. Așteaptă câteva secunde și încearcă din nou.';
      case 500:
      case 502:
      case 503:
        return 'Eroare de la serverul Shopify. Încearcă din nou mai târziu.';
      default:
        return `Eroare la comunicarea cu Shopify API (Status ${status}). Verifică token-ul și Store Name.`;
    }
  }
}

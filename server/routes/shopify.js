import express from 'express';
import {
  loadIntegrations,
  saveIntegrations,
  findIntegrationById,
  findIntegrationsByType,
  createIntegration,
  updateIntegration,
  deleteIntegration
} from '../storage/integrations.js';
import { ShopifyClient } from '../services/shopifyClient.js';
import { ShopifyProduct, ShopifyProductsResponse } from '../types/shopify.js';
import { sendProductToShopify, updateProductInShopify, syncProductToShopify } from '../services/shopifySync.js';

const router = express.Router();

/**
 * POST /api/shopify/integrations
 * Creează o integrare Shopify nouă
 */
router.post('/integrations', async (req, res, next) => {
  try {
    const { storeName, adminAccessToken } = req.body;

    // Validare input
    if (!storeName || !storeName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Store Name este obligatoriu.'
      });
    }

    if (!adminAccessToken || !adminAccessToken.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Admin API Access Token este obligatoriu.'
      });
    }

    // Validare și curățare token
    const cleanToken = adminAccessToken.trim().replace(/\s+/g, '');
    
    // Verifică formatul token-ului
    if (!cleanToken.startsWith('shpat_') && !cleanToken.startsWith('shpca_')) {
      console.error('[API] Invalid token format on create:', {
        tokenPrefix: cleanToken.substring(0, 10),
        tokenLength: cleanToken.length
      });
      
      return res.status(400).json({
        success: false,
        message: `Token invalid! Admin API Access Token trebuie să înceapă cu "shpat_" (Private App) sau "shpca_" (Custom App Admin API). Token-ul actual începe cu "${cleanToken.substring(0, 5)}_". Asigură-te că folosești Admin API Access Token, nu Storefront API token sau alt tip.`,
        error: 'Invalid token format',
        tokenPrefix: cleanToken.substring(0, 10),
        expectedPrefixes: ['shpat_', 'shpca_'],
        hint: 'În Shopify Admin, accesează Settings → Apps → Develop apps → [App-ul tău] → Admin API integration → Copiază Admin API access token (nu Storefront API access token).'
      });
    }

    // Construiește shopDomain
    const cleanStoreName = storeName.trim().replace(/\.myshopify\.com$/, '').toLowerCase();
    const shopDomain = `${cleanStoreName}.myshopify.com`;

    console.log('[API] Creating integration:', {
      storeName: cleanStoreName,
      shopDomain,
      tokenPrefix: cleanToken.substring(0, 15) + '...',
      tokenLength: cleanToken.length
    });

    // Creează integrarea
    const integration = createIntegration({
      type: 'shopify',
      name: `Shopify - ${cleanStoreName}`,
      storeName: cleanStoreName,
      adminAccessToken: cleanToken
    });

    // Nu returnăm token-ul în răspuns pentru securitate
    const { adminAccessToken: token, ...integrationResponse } = integration;

    res.status(201).json({
      success: true,
      message: 'Integrarea Shopify a fost creată cu succes!',
      data: integrationResponse
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/shopify/integrations
 * Returnează toate integrările Shopify
 */
router.get('/integrations', async (req, res, next) => {
  try {
    const integrations = findIntegrationsByType('shopify');
    
    // Nu returnăm token-ul în răspuns pentru securitate
    const safeIntegrations = integrations.map(({ adminAccessToken, ...rest }) => rest);

    res.json({
      success: true,
      data: safeIntegrations
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/shopify/integrations/:id
 * Returnează detalii despre o integrare Shopify
 */
router.get('/integrations/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const integration = findIntegrationById(id);

    if (!integration || integration.type !== 'shopify') {
      return res.status(404).json({
        success: false,
        message: 'Integrarea nu a fost găsită.'
      });
    }

    // Nu returnăm token-ul în răspuns pentru securitate
    const { adminAccessToken, ...integrationResponse } = integration;

    res.json({
      success: true,
      data: integrationResponse
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/shopify/integrations/:id
 * Actualizează o integrare Shopify existentă
 */
router.put('/integrations/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { storeName, adminAccessToken, name, status } = req.body;

    const integration = findIntegrationById(id);

    if (!integration || integration.type !== 'shopify') {
      return res.status(404).json({
        success: false,
        message: 'Integrarea nu a fost găsită.'
      });
    }

    const updates = {};

    if (storeName !== undefined) {
      updates.storeName = storeName.replace('.myshopify.com', '');
      updates.shopDomain = `${updates.storeName}.myshopify.com`;
    }

    if (adminAccessToken !== undefined) {
      // Validare și curățare token
      const cleanToken = adminAccessToken.trim().replace(/\s+/g, '');
      
      // Verifică formatul token-ului
      if (!cleanToken.startsWith('shpat_') && !cleanToken.startsWith('shpca_')) {
        console.error('[API] Invalid token format on update:', {
          integrationId: id,
          tokenPrefix: cleanToken.substring(0, 10),
          tokenLength: cleanToken.length
        });
        
        return res.status(400).json({
          success: false,
          message: `Token invalid! Admin API Access Token trebuie să înceapă cu "shpat_" (Private App) sau "shpca_" (Custom App Admin API). Token-ul actual începe cu "${cleanToken.substring(0, 5)}_". Asigură-te că folosești Admin API Access Token, nu Storefront API token sau alt tip.`,
          error: 'Invalid token format',
          tokenPrefix: cleanToken.substring(0, 10),
          expectedPrefixes: ['shpat_', 'shpca_'],
          hint: 'În Shopify Admin, accesează Settings → Apps → Develop apps → [App-ul tău] → Admin API integration → Copiază Admin API access token (nu Storefront API access token).'
        });
      }
      
      updates.adminAccessToken = cleanToken;
      // Când se actualizează token-ul, resetăm status-ul pentru a testa din nou
      updates.status = 'disconnected';
      
      console.log('[API] Token updated for integration:', {
        id,
        tokenPrefix: cleanToken.substring(0, 15) + '...',
        tokenLength: cleanToken.length
      });
    }

    if (name !== undefined) {
      updates.name = name;
    }

    if (status !== undefined && ['connected', 'disconnected'].includes(status)) {
      updates.status = status;
    }

    // Dacă se schimbă storeName, actualizează și shopDomain
    if (storeName !== undefined) {
      updates.shopDomain = `${updates.storeName || integration.storeName}.myshopify.com`;
    }

    const updatedIntegration = updateIntegration(id, updates);
    
    console.log('Integration updated:', {
      id,
      storeName: updatedIntegration.storeName,
      shopDomain: updatedIntegration.shopDomain,
      hasToken: !!updatedIntegration.adminAccessToken,
      tokenPrefix: updatedIntegration.adminAccessToken ? updatedIntegration.adminAccessToken.substring(0, 10) + '...' : 'N/A',
      status: updatedIntegration.status
    });

    // Nu returnăm token-ul în răspuns pentru securitate
    const { adminAccessToken: token, ...integrationResponse } = updatedIntegration;

    res.json({
      success: true,
      message: 'Integrarea a fost actualizată cu succes!',
      data: integrationResponse
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/shopify/integrations/:id
 * Șterge o integrare Shopify
 */
router.delete('/integrations/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const integration = findIntegrationById(id);

    if (!integration || integration.type !== 'shopify') {
      return res.status(404).json({
        success: false,
        message: 'Integrarea nu a fost găsită.'
      });
    }

    const deleted = deleteIntegration(id);

    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Eroare la ștergerea integrării.'
      });
    }

    res.json({
      success: true,
      message: 'Integrarea a fost ștearsă cu succes!'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/shopify/integrations/:id/test
 * Testează conexiunea cu Shopify pentru o integrare
 */
router.post('/integrations/:id/test', async (req, res, next) => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    console.log(`[API-TEST] ==========================================`);
    console.log(`[API-TEST] Test connection STARTED for integration ID: ${id}`);
    console.log(`[API-TEST] Timestamp: ${new Date().toISOString()}`);
    
    const integration = findIntegrationById(id);

    if (!integration || integration.type !== 'shopify') {
      console.error(`[API-TEST] Integration not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Integrarea nu a fost găsită.'
      });
    }

    console.log('[API-TEST] Integration details:', {
      id: integration.id,
      name: integration.name,
      storeName: integration.storeName,
      shopDomain: integration.shopDomain,
      status: integration.status,
      hasToken: !!integration.adminAccessToken,
      tokenLength: integration.adminAccessToken ? integration.adminAccessToken.length : 0,
      tokenPrefix: integration.adminAccessToken ? integration.adminAccessToken.substring(0, 10) : 'N/A',
      tokenFull: integration.adminAccessToken ? integration.adminAccessToken : 'MISSING'
    });

    // Validare token format
    if (!integration.adminAccessToken) {
      console.error('[API-TEST] ❌ No token found in integration');
      return res.status(400).json({
        success: false,
        message: 'Token-ul nu este configurat. Te rugăm să actualizezi Admin API Access Token.',
        error: 'Token missing'
      });
    }

    // Verifică dacă token-ul are formatul corect pentru Admin API
    const token = integration.adminAccessToken.trim().replace(/\s+/g, '');
    
    console.log('[API-TEST] Token validation:', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 10),
      startsWith_shpat_: token.startsWith('shpat_'),
      startsWith_shpca_: token.startsWith('shpca_'),
      startsWith_shpss_: token.startsWith('shpss_'),
      startsWith_shpcn_: token.startsWith('shpcn_'),
      isValid: token.startsWith('shpat_') || token.startsWith('shpca_')
    });
    
    if (!token.startsWith('shpat_') && !token.startsWith('shpca_')) {
      console.error('[API-TEST] ❌ Invalid token format detected');
      console.error('[API-TEST] Token prefix:', token.substring(0, 10));
      console.error('[API-TEST] Expected: shpat_ (Private App) sau shpca_ (Custom App Admin API)');
      console.error('[API-TEST] Actual:', token.substring(0, 5) + '_');
      
      let tokenType = 'necunoscut';
      if (token.startsWith('shpss_')) {
        tokenType = 'Storefront API Access Token (nu funcționează pentru Admin API)';
      } else if (token.startsWith('shpcn_')) {
        tokenType = 'Custom App Storefront API Access Token (nu funcționează pentru Admin API)';
      }
      
      return res.status(400).json({
        success: false,
        message: `❌ Token invalid! Token-ul actual este de tip ${tokenType}. Trebuie să folosești Admin API Access Token care începe cu "shpat_" (Private App) sau "shpca_" (Custom App Admin API). Token-ul actual începe cu "${token.substring(0, 5)}_".`,
        error: 'Invalid token format',
        tokenPrefix: token.substring(0, 10),
        tokenType: tokenType,
        expectedPrefixes: ['shpat_', 'shpca_'],
        hint: 'În Shopify Admin: Settings → Apps → Develop apps → [App-ul tău] → Admin API integration → Copiază "Admin API access token" (NU "Storefront API access token").'
      });
    }

    // Creează clientul Shopify
    console.log('[API-TEST] Creating Shopify client...');
    console.log('[API-TEST] Shop domain:', integration.shopDomain);
    console.log('[API-TEST] API version: 2024-10');
    
    let client;
    try {
      client = new ShopifyClient(integration.shopDomain, token);
      console.log('[API-TEST] ✅ Shopify client created successfully');
    } catch (clientError) {
      console.error('[API-TEST] ❌ Failed to create Shopify client:', clientError.message);
      return res.status(400).json({
        success: false,
        message: `Eroare la crearea clientului Shopify: ${clientError.message}`,
        error: clientError.message
      });
    }

    // Testează conexiunea
    console.log('[API-TEST] Testing connection to Shopify...');
    console.log('[API-TEST] URL will be: https://' + integration.shopDomain + '/admin/api/2024-10/shop.json');
    
    const testResult = await client.testConnection();
    
    const duration = Date.now() - startTime;
    console.log('[API-TEST] Test completed in', duration + 'ms');
    console.log('[API-TEST] Result:', {
      success: testResult.success,
      status: testResult.status,
      message: testResult.message,
      hasShop: !!testResult.shop,
      shopName: testResult.shop?.name,
      error: testResult.error
    });
    console.log(`[API-TEST] ==========================================`);

    if (testResult.success) {
      // Actualizează status-ul integrării
      updateIntegration(id, { status: 'connected' });

      // Returnează datele de la test (testResult.shop conține deja informațiile shop-ului)
      res.json({
        success: true,
        message: testResult.message || 'Conexiunea cu Shopify a reușit!',
        data: {
          shop: testResult.shop || null,
          integrationId: id
        }
      });
    } else {
      // Actualizează status-ul integrării
      updateIntegration(id, { status: 'disconnected' });

      console.error('Shopify Connection Test Failed:', {
        integrationId: id,
        storeName: integration.storeName,
        shopDomain: integration.shopDomain,
        error: testResult.error,
        status: testResult.status,
        message: testResult.message,
        details: testResult.details
      });

      // Determină tipul token-ului pentru mesaj mai clar
      let tokenType = null;
      if (integration.adminAccessToken) {
        const token = integration.adminAccessToken.trim();
        if (token.startsWith('shpss_')) {
          tokenType = 'Storefront API Access Token (nu funcționează pentru Admin API)';
        } else if (token.startsWith('shpcn_')) {
          tokenType = 'Custom App Storefront API Access Token (nu funcționează pentru Admin API)';
        } else if (!token.startsWith('shpat_') && !token.startsWith('shpca_')) {
          tokenType = `Token necunoscut (începe cu "${token.substring(0, 5)}_")`;
        }
      }

      res.status(testResult.status || 400).json({
        success: false,
        message: testResult.message || 'Conexiunea cu Shopify a eșuat!',
        error: testResult.error,
        status: testResult.status,
        details: testResult.details,
        tokenType: tokenType,
        hint: tokenType ? 'În Shopify Admin: Settings → Apps → Develop apps → [App-ul tău] → Admin API integration → Copiază "Admin API access token" (NU "Storefront API access token"). Vezi documentația GET_CORRECT_TOKEN.md pentru instrucțiuni detaliate.' : testResult.hint
      });
    }
    } catch (error) {
      console.error('[API] Test connection exception:', {
        id,
        error: error.message,
        stack: error.stack,
        status: error.status
      });
      
      // Actualizează status-ul integrării
      try {
        const integration = findIntegrationById(id);
        if (integration) {
          updateIntegration(id, { status: 'disconnected' });
        }
      } catch (e) {
        console.error('[API] Failed to update integration status:', e);
      }

      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Eroare necunoscută la testarea conexiunii',
        error: error.message,
        status: error.status,
        details: error.details
      });
    }
});

/**
 * GET /api/shopify/integrations/:id/products
 * Obține lista de produse din Shopify pentru o integrare
 */
router.get('/integrations/:id/products', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, limit, status } = req.query;

    const integration = findIntegrationById(id);

    if (!integration || integration.type !== 'shopify') {
      return res.status(404).json({
        success: false,
        message: 'Integrarea nu a fost găsită.'
      });
    }

    // Creează clientul Shopify
    const client = new ShopifyClient(integration.shopDomain, integration.adminAccessToken);

    // Pregătește parametri pentru request
    const params = {};
    
    if (limit) {
      const limitNum = parseInt(limit);
      params.limit = Math.min(Math.max(limitNum, 1), 250); // Min 1, Max 250
    } else {
      params.limit = 50; // Default
    }

    // Shopify suportă paginare cu page_info (cursor-based)
    // Pentru simplitate, folosim doar limit pentru moment
    // Dacă se dorește paginare completă, trebuie stocat page_info în frontend
    if (page) {
      const pageNum = parseInt(page);
      if (pageNum > 1) {
        // Pentru pagina > 1, ar trebui să folosim page_info din răspunsul anterior
        // Pentru moment, returnăm doar prima pagină
        // TODO: Implementează paginare cu page_info dacă e necesar
      }
    }

    if (status && ['active', 'archived', 'draft'].includes(status)) {
      params.status = status;
    }

    // Obține produsele
    const response = await client.getProducts(params);
    const productsResponse = new ShopifyProductsResponse(response);

    // Mapare la format intern OptiSell
    const optiSellProducts = productsResponse.products.map(product => product.toOptiSellProduct());

    res.json({
      success: true,
      data: optiSellProducts,
      pagination: {
        limit: params.limit,
        count: optiSellProducts.length,
        page_info: response.page_info || null
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/shopify/integrations/:id/products
 * Sincronizează un produs din baza locală către Shopify
 * Acceptă datele produsului în format local (name, description, price, sku, etc.)
 */
router.post('/integrations/:id/products', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productLocalData } = req.body;

    // Acceptă fie productLocalData (format nou), fie product (format vechi pentru backward compatibility)
    const productData = productLocalData || req.body.product;

    if (!productData) {
      return res.status(400).json({
        success: false,
        message: 'Datele produsului sunt obligatorii.'
      });
    }

    // Validare câmpuri obligatorii
    if (!productData.name && !productData.title) {
      return res.status(400).json({
        success: false,
        message: 'Numele produsului (name sau title) este obligatoriu.'
      });
    }

    if (!productData.sku && !productData.variants?.[0]?.sku) {
      return res.status(400).json({
        success: false,
        message: 'SKU-ul produsului este obligatoriu.'
      });
    }

    const integration = findIntegrationById(id);

    if (!integration || integration.type !== 'shopify') {
      return res.status(404).json({
        success: false,
        message: 'Integrarea nu a fost găsită.'
      });
    }

    // Pregătește datele pentru integrare
    const integrationData = {
      storeName: integration.storeName,
      adminAccessToken: integration.adminAccessToken
    };

    // Pregătește datele produsului în format local
    const localProductData = {
      name: productData.name || productData.title,
      description: productData.description || productData.body_html || '',
      price: productData.price || productData.variants?.[0]?.price || '0.00',
      sku: productData.sku || productData.variants?.[0]?.sku || '',
      stock: productData.stock || productData.variants?.[0]?.inventory_quantity || 0,
      comparePrice: productData.comparePrice || productData.variants?.[0]?.compare_at_price || null,
      brand: productData.brand || productData.vendor || 'OptiSell Integrator',
      category: productData.category || productData.product_type || '',
      tags: productData.tags || '',
      weight: productData.weight || productData.variants?.[0]?.weight || null,
      active: productData.active !== undefined ? productData.active : (productData.status !== 'draft'),
      images: productData.images || [],
      shopifyId: productData.shopifyId || productData.id || null,
      shopifyVariantId: productData.shopifyVariantId || productData.variants?.[0]?.id || null
    };

    // Alege funcția de sincronizare în funcție de dacă produsul există deja
    let result;
    
    if (localProductData.shopifyId) {
      // Produsul există deja în Shopify, actualizează-l
      result = await updateProductInShopify(integrationData, localProductData.shopifyId, localProductData);
    } else {
      // Produsul nu există, creează-l
      result = await sendProductToShopify(integrationData, localProductData);
    }

    if (result.success) {
      res.status(localProductData.shopifyId ? 200 : 201).json({
        success: true,
        message: result.message || 'Produs sincronizat cu succes în Shopify!',
        shopifyProductId: result.shopifyProductId,
        shopifyVariantId: result.shopifyVariantId,
        product: result.product,
        data: {
          shopifyId: result.shopifyProductId?.toString(),
          shopifyVariantId: result.shopifyVariantId?.toString(),
          name: localProductData.name,
          sku: localProductData.sku,
          price: localProductData.price
        }
      });
    } else {
      res.status(result.status || 400).json({
        success: false,
        message: result.error || 'Eroare la sincronizarea produsului în Shopify.',
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error('❌ Eroare în ruta de sincronizare:', error);
    next(error);
  }
});

/**
 * PUT /api/shopify/integrations/:id/products/:productId
 * Actualizează un produs existent în Shopify
 */
router.put('/integrations/:id/products/:productId', async (req, res, next) => {
  try {
    const { id, productId } = req.params;
    const { product } = req.body;

    if (!product) {
      return res.status(400).json({
        success: false,
        message: 'Datele produsului sunt obligatorii.'
      });
    }

    const integration = findIntegrationById(id);

    if (!integration || integration.type !== 'shopify') {
      return res.status(404).json({
        success: false,
        message: 'Integrarea nu a fost găsită.'
      });
    }

    // Creează clientul Shopify
    const client = new ShopifyClient(integration.shopDomain, integration.adminAccessToken);

    // Actualizează produsul în Shopify
    const response = await client.updateProduct(productId, product);

    if (response.product) {
      const shopifyProduct = new ShopifyProduct(response.product);
      res.json({
        success: true,
        message: 'Produsul a fost actualizat cu succes în Shopify!',
        product: shopifyProduct,
        data: shopifyProduct.toOptiSellProduct()
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Eroare la actualizarea produsului în Shopify.',
        error: response.errors
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/shopify/test-token
 * Testează manual un token și store name (fără să salveze în storage)
 * Util pentru debugging și testare rapidă
 */
router.post('/test-token', async (req, res, next) => {
  try {
    const { storeName, adminAccessToken } = req.body;

    console.log('[API-TEST-TOKEN] ==========================================');
    console.log('[API-TEST-TOKEN] Manual token test requested');
    console.log('[API-TEST-TOKEN] Timestamp:', new Date().toISOString());

    if (!storeName || !storeName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Store Name este obligatoriu.'
      });
    }

    if (!adminAccessToken || !adminAccessToken.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Admin API Access Token este obligatoriu.'
      });
    }

    // Clean up
    const cleanStoreName = storeName.trim().replace(/\.myshopify\.com$/, '').toLowerCase();
    const cleanToken = adminAccessToken.trim().replace(/\s+/g, '');
    const shopDomain = `${cleanStoreName}.myshopify.com`;

    console.log('[API-TEST-TOKEN] Input cleaned:', {
      originalStoreName: storeName,
      cleanStoreName: cleanStoreName,
      shopDomain: shopDomain,
      tokenLength: cleanToken.length,
      tokenPrefix: cleanToken.substring(0, 15) + '...',
      tokenStarts: {
        'shpat_': cleanToken.startsWith('shpat_'),
        'shpca_': cleanToken.startsWith('shpca_'),
        'shpss_': cleanToken.startsWith('shpss_'),
        'shpcn_': cleanToken.startsWith('shpcn_')
      }
    });

    // Validare token format
    if (!cleanToken.startsWith('shpat_') && !cleanToken.startsWith('shpca_')) {
      let tokenType = 'necunoscut';
      if (cleanToken.startsWith('shpss_')) {
        tokenType = 'Storefront API Access Token';
      } else if (cleanToken.startsWith('shpcn_')) {
        tokenType = 'Custom App Storefront API Access Token';
      }

      console.error('[API-TEST-TOKEN] ❌ Invalid token format');
      
      return res.status(400).json({
        success: false,
        message: `Token invalid! Token-ul este de tip "${tokenType}" (începe cu "${cleanToken.substring(0, 5)}_"). Pentru Admin API ai nevoie de un token care începe cu "shpat_" (Private App) sau "shpca_" (Custom App Admin API).`,
        error: 'Invalid token format',
        tokenPrefix: cleanToken.substring(0, 10),
        tokenType: tokenType,
        expectedPrefixes: ['shpat_', 'shpca_'],
        hint: 'În Shopify Admin: Settings → Apps → Develop apps → [App-ul tău] → Admin API integration → Copiază "Admin API access token" (NU "Storefront API access token").'
      });
    }

    // Testează conexiunea
    console.log('[API-TEST-TOKEN] Creating client and testing...');
    const client = new ShopifyClient(shopDomain, cleanToken);
    const testResult = await client.testConnection();

    console.log('[API-TEST-TOKEN] Test result:', {
      success: testResult.success,
      status: testResult.status,
      message: testResult.message,
      hasShop: !!testResult.shop,
      shopName: testResult.shop?.name
    });
    console.log('[API-TEST-TOKEN] ==========================================');

    if (testResult.success) {
      res.json({
        success: true,
        message: testResult.message || 'Token valid! Conexiunea cu Shopify funcționează.',
        data: {
          shop: testResult.shop,
          storeName: cleanStoreName,
          shopDomain: shopDomain,
          tokenValid: true,
          tokenPrefix: cleanToken.substring(0, 10)
        }
      });
    } else {
      res.status(testResult.status || 400).json({
        success: false,
        message: testResult.message || 'Token invalid sau eroare la conexiune.',
        error: testResult.error,
        status: testResult.status,
        details: testResult.details,
        data: {
          storeName: cleanStoreName,
          shopDomain: shopDomain,
          tokenValid: false,
          tokenPrefix: cleanToken.substring(0, 10)
        }
      });
    }
  } catch (error) {
    console.error('[API-TEST-TOKEN] Exception:', error);
    next(error);
  }
});

export default router;

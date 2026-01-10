/**
 * Rute API dedicate pentru sincronizarea produselor către Shopify
 * Folosesc funcția sendProductToShopify pentru trimiterea produselor
 */

import express from 'express';
import { findIntegrationById } from '../storage/integrations.js';
import { sendProductToShopify, updateProductInShopify, syncProductToShopify } from '../services/shopifySync.js';

const router = express.Router();

/**
 * POST /api/shopify/sync/:id
 * Sincronizează un produs din baza locală către Shopify
 * Acceptă datele produsului în format local (name, description, price, sku)
 * 
 * Body:
 * {
 *   "productLocalData": {
 *     "name": "Nume produs",
 *     "description": "Descriere produs",
 *     "price": "99.99",
 *     "sku": "SKU123"
 *   }
 * }
 */
router.post('/sync/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productLocalData } = req.body;

    if (!productLocalData) {
      return res.status(400).json({
        success: false,
        message: 'Datele produsului (productLocalData) sunt obligatorii.'
      });
    }

    // Validare câmpuri obligatorii
    if (!productLocalData.name) {
      return res.status(400).json({
        success: false,
        message: 'Numele produsului (name) este obligatoriu.'
      });
    }

    if (!productLocalData.sku) {
      return res.status(400).json({
        success: false,
        message: 'SKU-ul produsului (sku) este obligatoriu.'
      });
    }

    // Găsește integrarea
    const integration = findIntegrationById(id);

    if (!integration || integration.type !== 'shopify') {
      return res.status(404).json({
        success: false,
        message: 'Integrarea nu a fost găsită.'
      });
    }

    // Verifică dacă integrarea are token
    if (!integration.adminAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Integrarea nu are Admin API Access Token configurat.'
      });
    }

    // Pregătește datele pentru integrare
    const integrationData = {
      storeName: integration.storeName,
      adminAccessToken: integration.adminAccessToken
    };

    // Verifică dacă produsul există deja (dacă are shopifyId)
    let result;
    if (productLocalData.shopifyId || productLocalData.shopifyProductId) {
      // Actualizează produsul existent
      const shopifyId = productLocalData.shopifyId || productLocalData.shopifyProductId;
      result = await updateProductInShopify(integrationData, shopifyId, productLocalData);
    } else {
      // Creează produs nou
      result = await sendProductToShopify(integrationData, productLocalData);
    }

    if (result.success) {
      res.status(productLocalData.shopifyId ? 200 : 201).json({
        success: true,
        message: result.message || 'Produs sincronizat cu succes în Shopify!',
        shopifyProductId: result.shopifyProductId,
        shopifyVariantId: result.shopifyVariantId,
        product: result.product
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
 * POST /api/shopify/sync/:id/intelligent
 * Sincronizare inteligentă - folosește syncProductToShopify care decide automat create/update
 */
router.post('/sync/:id/intelligent', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productLocalData } = req.body;

    if (!productLocalData) {
      return res.status(400).json({
        success: false,
        message: 'Datele produsului (productLocalData) sunt obligatorii.'
      });
    }

    const integration = findIntegrationById(id);

    if (!integration || integration.type !== 'shopify') {
      return res.status(404).json({
        success: false,
        message: 'Integrarea nu a fost găsită.'
      });
    }

    if (!integration.adminAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Integrarea nu are Admin API Access Token configurat.'
      });
    }

    const integrationData = {
      storeName: integration.storeName,
      adminAccessToken: integration.adminAccessToken
    };

    const result = await syncProductToShopify(integrationData, productLocalData);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message || 'Produs sincronizat cu succes în Shopify!',
        shopifyProductId: result.shopifyProductId,
        shopifyVariantId: result.shopifyVariantId,
        product: result.product
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
    console.error('❌ Eroare în sincronizarea inteligentă:', error);
    next(error);
  }
});

export default router;

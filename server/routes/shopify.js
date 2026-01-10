import express from "express";
import { validateIntegrationInput } from "../utils/validateInput.js";
import { listIntegrations, addIntegration, findIntegrationById, deleteIntegration, updateIntegration } from "../storage/integrations.js";
import { createShopifyClient } from "../services/shopifyClient.js";

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({ status: "ok", message: "Shopify API endpoint is working" });
});

router.get("/integrations", (req, res) => {
  try {
    const integrations = listIntegrations();

    const safeIntegrations = integrations.map(({ adminApiAccessToken, ...rest }) => rest);

    res.json({
      success: true,
      data: safeIntegrations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Eroare la încărcarea integrărilor",
    });
  }
});

router.post("/integrations/add", async (req, res) => {
  try {
    const validation = validateIntegrationInput(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "Date invalide",
        errors: validation.errors,
      });
    }

    const { integrationName, storeDomain, adminApiAccessToken } = req.body;

    let normalizedDomain = storeDomain.trim();
    if (!normalizedDomain.includes(".myshopify.com")) {
      return res.status(400).json({
        success: false,
        message: 'storeDomain trebuie să conțină ".myshopify.com"',
      });
    }
    normalizedDomain = normalizedDomain.replace(/^https?:\/\//, "");

    const cleanToken = adminApiAccessToken.trim();
    if (!cleanToken.startsWith("shpat_") && !cleanToken.startsWith("shpca_")) {
      return res.status(400).json({
        success: false,
        message: 'adminApiAccessToken trebuie să înceapă cu "shpat_" sau "shpca_"',
      });
    }

    const client = createShopifyClient({
      storeDomain: normalizedDomain,
      adminApiAccessToken: cleanToken,
    });

    let shop;
    try {
      shop = await client.testConnection();
    } catch (error) {
      if (error.status === 401) {
        return res.status(401).json({
          success: false,
          message: "Token invalid sau expirat",
          error: error.message,
        });
      }

      return res.status(400).json({
        success: false,
        message: "Conexiunea cu Shopify a eșuat",
        error: error.message,
        status: error.status,
      });
    }

    const integration = addIntegration({
      integrationName: integrationName?.trim() || undefined,
      storeDomain: normalizedDomain,
      adminApiAccessToken: cleanToken,
      status: "connected",
    });

    const { adminApiAccessToken: token, ...safeIntegration } = integration;

    res.status(201).json({
      success: true,
      message: "Integrarea a fost creată cu succes",
      data: {
        ...safeIntegration,
        shop: shop,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Eroare la crearea integrării",
    });
  }
});

router.delete("/integrations/:id", (req, res) => {
  try {
    const { id } = req.params;
    const deleted = deleteIntegration(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Integrarea nu a fost găsită",
      });
    }

    res.json({
      success: true,
      message: "Integrarea a fost ștearsă cu succes",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Eroare la ștergerea integrării",
    });
  }
});

router.post("/integrations/:id/test", async (req, res) => {
  try {
    const { id } = req.params;
    const integration = findIntegrationById(id);

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: "Integrarea nu a fost găsită",
      });
    }

    const client = createShopifyClient({
      storeDomain: integration.storeDomain,
      adminApiAccessToken: integration.adminApiAccessToken,
    });

    try {
      const shop = await client.testConnection();
      updateIntegration(id, { status: "connected" });

      res.json({
        success: true,
        message: "Conexiunea cu Shopify a reușit!",
        data: {
          shop,
          integrationId: id,
        },
      });
    } catch (error) {
      updateIntegration(id, { status: "disconnected" });

      if (error.status === 401) {
        return res.status(401).json({
          success: false,
          message: "Token invalid sau expirat",
          error: error.message,
        });
      }

      res.status(error.status || 400).json({
        success: false,
        message: "Conexiunea cu Shopify a eșuat",
        error: error.message,
        status: error.status,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Eroare la testarea conexiunii",
    });
  }
});

export default router;

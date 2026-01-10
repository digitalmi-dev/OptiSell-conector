import express from "express";
import { validateIntegrationInput } from "../utils/validateInput.js";
import { listIntegrations, addIntegration, updateIntegration } from "../storage/integrations.js";
import { createShopifyClient } from "../services/shopifyClient.js";

const router = express.Router();

router.get("/integrations", (req, res) => {
  try {
    const integrations = listIntegrations();

    const safeIntegrations = integrations.map(({ adminAccessToken, ...rest }) => rest);

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

router.post("/integrations", async (req, res) => {
  try {
    const validation = validateIntegrationInput(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: "Date invalide",
        errors: validation.errors,
      });
    }

    const { integrationName, storeDomain, adminAccessToken } = req.body;

    const client = createShopifyClient({
      storeDomain: storeDomain.trim(),
      adminAccessToken: adminAccessToken.trim(),
    });

    try {
      await client.testConnection();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Conexiunea cu Shopify a eșuat",
        error: error.message,
        status: error.status,
      });
    }

    const integration = addIntegration({
      integrationName: integrationName?.trim() || undefined,
      storeDomain: storeDomain.trim(),
      adminAccessToken: adminAccessToken.trim(),
    });

    updateIntegration(integration.id, { status: "connected" });

    const { adminAccessToken: token, ...safeIntegration } = integration;

    const responseIntegration = {
      ...safeIntegration,
      status: "connected",
    };

    res.status(201).json({
      success: true,
      message: "Integrarea a fost creată cu succes",
      data: responseIntegration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Eroare la crearea integrării",
    });
  }
});

export default router;

import express from "express";
import { validateIntegrationInput } from "../utils/validateInput.js";
import { listIntegrations, addIntegration, findIntegrationById, updateIntegration } from "../storage/integrations.js";
import { createShopifyClient } from "../services/shopifyClient.js";

const router = express.Router();

router.get("/integrations", (req, res) => {
  try {
    const integrations = listIntegrations();

    const safeIntegrations = integrations.map(({ clientSecret, accessToken, tokenExpiresAt, ...rest }) => rest);

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

    const { integrationName, storeDomain, clientId, clientSecret } = req.body;

    let normalizedDomain = storeDomain.trim();
    if (!normalizedDomain.includes(".myshopify.com")) {
      return res.status(400).json({
        success: false,
        message: 'storeDomain trebuie să conțină ".myshopify.com"',
      });
    }
    normalizedDomain = normalizedDomain.replace(/^https?:\/\//, "");

    const oauthUrl = `https://${normalizedDomain}/admin/oauth/access_token`;

    const oauthPayload = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId.trim(),
      client_secret: clientSecret.trim(),
    });

    let oauthResponse;
    try {
      oauthResponse = await fetch(oauthUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: oauthPayload.toString(),
      });

      if (!oauthResponse.ok) {
        let errorMessage = `OAuth Error: ${oauthResponse.status} ${oauthResponse.statusText}`;
        try {
          const errorData = await oauthResponse.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.error_description) {
            errorMessage = errorData.error_description;
          }
        } catch (e) {
          const text = await oauthResponse.text();
          errorMessage = text || errorMessage;
        }

        return res.status(400).json({
          success: false,
          message: "Eroare la obținerea access token de la Shopify",
          error: errorMessage,
          status: oauthResponse.status,
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Eroare la conectarea la Shopify OAuth",
        error: error.message,
      });
    }

    const oauthData = await oauthResponse.json();
    const { access_token, scope, expires_in } = oauthData;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        message: "Shopify nu a returnat access_token",
        error: "Răspuns OAuth invalid",
      });
    }

    const expiresInSeconds = parseInt(expires_in) || 86400;
    const tokenExpiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    const client = createShopifyClient({
      storeDomain: normalizedDomain,
      accessToken: access_token,
    });

    try {
      await client.testConnection();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Conexiunea cu Shopify a eșuat după obținerea token-ului",
        error: error.message,
        status: error.status,
      });
    }

    const integration = addIntegration({
      integrationName: integrationName?.trim() || undefined,
      storeDomain: normalizedDomain,
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      accessToken: access_token,
      tokenExpiresAt,
      scope: scope || "",
      status: "connected",
    });

    const responseIntegration = {
      id: integration.id,
      integrationName: integration.integrationName,
      storeDomain: integration.storeDomain,
      scope: integration.scope,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
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
      accessToken: integration.accessToken,
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

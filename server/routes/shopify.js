import express from "express";
import { getShopifyCredentials } from "../services/shopifyClient.js";
import { generateState, saveShopifyConfig, getShopifyConfig } from "../storage/integrations.js";
import { createShopifyClient } from "../services/shopifyClient.js";

const router = express.Router();

const SHOPIFY_STATES = new Map();

router.get("/install", (req, res) => {
  try {
    const { shop } = req.query;

    if (!shop || typeof shop !== "string" || !shop.trim()) {
      return res.status(400).json({
        success: false,
        message: "Parametrul 'shop' este obligatoriu. Exemplu: ?shop=nume-magazin.myshopify.com",
      });
    }

    let shopDomain = shop.trim();
    if (!shopDomain.includes(".myshopify.com")) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }
    shopDomain = shopDomain.replace(/^https?:\/\//, "");

    const credentials = getShopifyCredentials();

    if (!credentials.clientId) {
      return res.status(500).json({
        success: false,
        message: "SHOPIFY_CLIENT_ID nu este configurat în variabilele de mediu",
      });
    }

    const state = generateState();
    SHOPIFY_STATES.set(state, shopDomain);

    const redirectUri = credentials.redirectUri;
    const scopes = credentials.scopes;

    const authUrl = `https://${shopDomain}/admin/oauth/authorize?` +
      `client_id=${encodeURIComponent(credentials.clientId)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}&` +
      `grant_options[]=per-user`;

    res.redirect(authUrl);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Eroare la instalarea Shopify",
    });
  }
});

router.get("/callback", async (req, res) => {
  try {
    const { code, state, shop } = req.query;

    if (!code || !state || !shop) {
      return res.status(400).json({
        success: false,
        message: "Parametrii code, state și shop sunt obligatorii",
      });
    }

    const storedShopDomain = SHOPIFY_STATES.get(state);
    if (!storedShopDomain) {
      return res.status(400).json({
        success: false,
        message: "State invalid sau expirat",
      });
    }

    let shopDomain = shop.trim();
    if (!shopDomain.includes(".myshopify.com")) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }
    shopDomain = shopDomain.replace(/^https?:\/\//, "");

    if (storedShopDomain !== shopDomain) {
      return res.status(400).json({
        success: false,
        message: "Shop domain nu se potrivește cu state-ul salvat",
      });
    }

    SHOPIFY_STATES.delete(state);

    const credentials = getShopifyCredentials();

    if (!credentials.clientId || !credentials.clientSecret) {
      return res.status(500).json({
        success: false,
        message: "SHOPIFY_CLIENT_ID sau SHOPIFY_CLIENT_SECRET nu sunt configurate",
      });
    }

    const tokenUrl = `https://${shopDomain}/admin/oauth/access_token`;

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      let errorMessage = `OAuth Error: ${tokenResponse.status} ${tokenResponse.statusText}`;
      try {
        const errorData = await tokenResponse.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.error_description) {
          errorMessage = errorData.error_description;
        }
      } catch (e) {
        const text = await tokenResponse.text();
        errorMessage = text || errorMessage;
      }

      return res.status(400).json({
        success: false,
        message: "Eroare la obținerea access token de la Shopify",
        error: errorMessage,
      });
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.status(400).json({
        success: false,
        message: "Shopify nu a returnat access_token",
      });
    }

    saveShopifyConfig({
      access_token: tokenData.access_token,
      scope: tokenData.scope || credentials.scopes,
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const redirectUrl = `${frontendUrl}/connections?shopify_installed=true&shop=${encodeURIComponent(shopDomain)}`;

    res.redirect(redirectUrl);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Eroare la procesarea callback-ului Shopify",
    });
  }
});

router.get("/products", async (req, res) => {
  try {
    const { shop } = req.query;
    const limit = parseInt(req.query.limit) || 5;

    if (!shop) {
      return res.status(400).json({
        success: false,
        message: "Parametrul 'shop' este obligatoriu",
      });
    }

    let shopDomain = shop.trim();
    if (!shopDomain.includes(".myshopify.com")) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }
    shopDomain = shopDomain.replace(/^https?:\/\//, "");

    const client = createShopifyClient(shopDomain);
    const products = await client.getProducts(limit);

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Eroare la obținerea produselor",
    });
  }
});

router.get("/status", (req, res) => {
  try {
    const config = getShopifyConfig();

    res.json({
      success: true,
      data: {
        installed: config.installed || false,
        hasToken: !!config.access_token,
        scope: config.scope || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Eroare la verificarea statusului",
    });
  }
});

router.get("/test", (req, res) => {
  res.json({ status: "ok", message: "Shopify API endpoint is working" });
});

export default router;

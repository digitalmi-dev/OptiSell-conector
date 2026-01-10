import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORAGE_DIR = path.join(__dirname, "..", "storage");
const SHOPIFY_FILE = path.join(STORAGE_DIR, "shopify.json");

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

if (!fs.existsSync(SHOPIFY_FILE)) {
  fs.writeFileSync(SHOPIFY_FILE, JSON.stringify({ integrations: [] }, null, 2), "utf8");
}

function readShopifyData() {
  try {
    const data = fs.readFileSync(SHOPIFY_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading shopify.json:", error);
    return { integrations: [] };
  }
}

function writeShopifyData(data) {
  try {
    fs.writeFileSync(SHOPIFY_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing shopify.json:", error);
    return false;
  }
}

export function listIntegrations() {
  const data = readShopifyData();
  return data.integrations || [];
}

export function addIntegration(integrationData) {
  const data = readShopifyData();
  
  if (!data.integrations) {
    data.integrations = [];
  }

  const newIntegration = {
    id: randomUUID(),
    integrationName: integrationData.integrationName || integrationData.storeDomain,
    storeDomain: integrationData.storeDomain.trim(),
    adminApiAccessToken: integrationData.adminApiAccessToken.trim(),
    status: integrationData.status || "disconnected",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.integrations.push(newIntegration);
  writeShopifyData(data);

  return newIntegration;
}

export function findIntegrationById(id) {
  const data = readShopifyData();
  return (data.integrations || []).find((integration) => integration.id === id) || null;
}

export function deleteIntegration(id) {
  const data = readShopifyData();
  
  if (!data.integrations) {
    data.integrations = [];
  }

  const filtered = data.integrations.filter((integration) => integration.id !== id);
  data.integrations = filtered;
  
  const success = writeShopifyData(data);
  return success && filtered.length < data.integrations.length;
}

export function updateIntegration(id, updates) {
  const data = readShopifyData();
  
  if (!data.integrations) {
    data.integrations = [];
  }

  const index = data.integrations.findIndex((integration) => integration.id === id);

  if (index === -1) {
    return null;
  }

  data.integrations[index] = {
    ...data.integrations[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeShopifyData(data);
  return data.integrations[index];
}

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORAGE_DIR = __dirname;
const INTEGRATIONS_FILE = path.join(STORAGE_DIR, "integrations.json");

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

if (!fs.existsSync(INTEGRATIONS_FILE)) {
  fs.writeFileSync(INTEGRATIONS_FILE, JSON.stringify([], null, 2), "utf8");
}

function readIntegrations() {
  try {
    const data = fs.readFileSync(INTEGRATIONS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading integrations:", error);
    return [];
  }
}

function writeIntegrations(integrations) {
  try {
    fs.writeFileSync(INTEGRATIONS_FILE, JSON.stringify(integrations, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing integrations:", error);
    return false;
  }
}

export function listIntegrations() {
  return readIntegrations();
}

export function addIntegration(integrationData) {
  const integrations = readIntegrations();

  const newIntegration = {
    id: randomUUID(),
    integrationName: integrationData.integrationName || integrationData.storeDomain,
    storeDomain: integrationData.storeDomain.trim(),
    clientId: integrationData.clientId.trim(),
    clientSecret: integrationData.clientSecret.trim(),
    accessToken: integrationData.accessToken,
    tokenExpiresAt: integrationData.tokenExpiresAt,
    scope: integrationData.scope || "",
    status: integrationData.status || "disconnected",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  integrations.push(newIntegration);
  writeIntegrations(integrations);

  return newIntegration;
}

export function findIntegrationById(id) {
  const integrations = readIntegrations();
  return integrations.find((integration) => integration.id === id) || null;
}

export function updateIntegration(id, updates) {
  const integrations = readIntegrations();
  const index = integrations.findIndex((integration) => integration.id === id);

  if (index === -1) {
    return null;
  }

  integrations[index] = {
    ...integrations[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeIntegrations(integrations);
  return integrations[index];
}

export function deleteIntegration(id) {
  const integrations = readIntegrations();
  const filtered = integrations.filter((integration) => integration.id !== id);
  writeIntegrations(filtered);
  return filtered.length < integrations.length;
}

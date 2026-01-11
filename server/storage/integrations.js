import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORAGE_DIR = path.join(__dirname, "..", "storage");
const SHOPIFY_FILE = path.join(STORAGE_DIR, "shopify.json");

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

if (!fs.existsSync(SHOPIFY_FILE)) {
  fs.writeFileSync(SHOPIFY_FILE, JSON.stringify({ shop: { access_token: null, scope: null, installed: false } }, null, 2), "utf8");
}

function readShopifyData() {
  try {
    const data = fs.readFileSync(SHOPIFY_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading shopify.json:", error);
    return { shop: { access_token: null, scope: null, installed: false } };
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

export function getShopifyConfig() {
  const data = readShopifyData();
  return data.shop || { access_token: null, scope: null, installed: false };
}

export function saveShopifyConfig(config) {
  const data = readShopifyData();
  data.shop = {
    ...data.shop,
    ...config,
    installed: config.access_token ? true : false,
  };
  return writeShopifyData(data);
}

export function generateState() {
  return crypto.randomBytes(16).toString("hex");
}

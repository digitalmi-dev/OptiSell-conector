import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORAGE_DIR = path.join(__dirname, '..', 'data');
const INTEGRATIONS_FILE = path.join(STORAGE_DIR, 'integrations.json');

// Asigură că directorul data există
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Încarcă integrările din fișier
export function loadIntegrations() {
  try {
    if (!fs.existsSync(INTEGRATIONS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(INTEGRATIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading integrations:', error);
    return [];
  }
}

// Salvează integrările în fișier
export function saveIntegrations(integrations) {
  try {
    const data = JSON.stringify(integrations, null, 2);
    fs.writeFileSync(INTEGRATIONS_FILE, data, 'utf8');
    console.log('[Storage] Integrations saved:', {
      count: integrations.length,
      file: INTEGRATIONS_FILE,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('[Storage] Error saving integrations:', {
      error: error.message,
      stack: error.stack,
      file: INTEGRATIONS_FILE
    });
    return false;
  }
}

// Găsește o integrare după ID
export function findIntegrationById(id) {
  const integrations = loadIntegrations();
  const integration = integrations.find(integration => integration.id === id);
  
  if (integration) {
    console.log('[Storage] Integration found:', {
      id: integration.id,
      name: integration.name,
      storeName: integration.storeName,
      shopDomain: integration.shopDomain,
      status: integration.status,
      hasToken: !!integration.adminAccessToken,
      tokenPrefix: integration.adminAccessToken ? integration.adminAccessToken.substring(0, 15) + '...' : 'N/A'
    });
  } else {
    console.warn('[Storage] Integration not found:', id);
  }
  
  return integration;
}

// Găsește integrări după tip
export function findIntegrationsByType(type) {
  const integrations = loadIntegrations();
  return integrations.filter(integration => integration.type === type);
}

// Creează o integrare nouă
export function createIntegration(integrationData) {
  const integrations = loadIntegrations();
  
  // Clean up token
  const cleanToken = integrationData.adminAccessToken ? 
    integrationData.adminAccessToken.trim().replace(/\s+/g, '') : '';
  
  // Clean up store name
  const cleanStoreName = integrationData.storeName ? 
    integrationData.storeName.trim().replace(/\.myshopify\.com$/, '').toLowerCase() : '';
  
  console.log('[Storage] Creating integration:', {
    storeName: cleanStoreName,
    tokenPrefix: cleanToken ? cleanToken.substring(0, 15) + '...' : 'N/A',
    tokenLength: cleanToken ? cleanToken.length : 0,
    tokenStarts: cleanToken ? {
      'shpat_': cleanToken.startsWith('shpat_'),
      'shpca_': cleanToken.startsWith('shpca_'),
      'shpss_': cleanToken.startsWith('shpss_'),
      'shpcn_': cleanToken.startsWith('shpcn_')
    } : 'No token'
  });
  
  const newIntegration = {
    id: Date.now().toString(),
    type: integrationData.type || 'shopify',
    name: integrationData.name || `Shopify - ${cleanStoreName}`,
    storeName: cleanStoreName,
    shopDomain: `${cleanStoreName}.myshopify.com`,
    adminAccessToken: cleanToken,
    status: 'disconnected',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  integrations.push(newIntegration);
  const saved = saveIntegrations(integrations);
  
  if (saved) {
    console.log('[Storage] Integration created successfully:', {
      id: newIntegration.id,
      storeName: newIntegration.storeName,
      shopDomain: newIntegration.shopDomain
    });
  } else {
    console.error('[Storage] Failed to save integration');
  }
  
  return newIntegration;
}

// Actualizează o integrare existentă
export function updateIntegration(id, updates) {
  const integrations = loadIntegrations();
  const index = integrations.findIndex(integration => integration.id === id);
  
  if (index === -1) {
    console.error('[Storage] Integration not found for update:', id);
    return null;
  }

  const oldIntegration = { ...integrations[index] };
  
  // Clean up token dacă este actualizat
  if (updates.adminAccessToken) {
    updates.adminAccessToken = updates.adminAccessToken.trim().replace(/\s+/g, '');
    console.log('[Storage] Updating token:', {
      id,
      oldTokenPrefix: oldIntegration.adminAccessToken ? oldIntegration.adminAccessToken.substring(0, 10) : 'N/A',
      newTokenPrefix: updates.adminAccessToken.substring(0, 15) + '...',
      newTokenLength: updates.adminAccessToken.length,
      newTokenStarts: {
        'shpat_': updates.adminAccessToken.startsWith('shpat_'),
        'shpca_': updates.adminAccessToken.startsWith('shpca_'),
        'shpss_': updates.adminAccessToken.startsWith('shpss_')
      }
    });
  }
  
  // Clean up store name dacă este actualizat
  if (updates.storeName) {
    updates.storeName = updates.storeName.trim().replace(/\.myshopify\.com$/, '').toLowerCase();
    if (!updates.shopDomain) {
      updates.shopDomain = `${updates.storeName}.myshopify.com`;
    }
  }

  integrations[index] = {
    ...integrations[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  const saved = saveIntegrations(integrations);
  
  if (saved) {
    console.log('[Storage] Integration updated successfully:', {
      id,
      storeName: integrations[index].storeName,
      shopDomain: integrations[index].shopDomain,
      status: integrations[index].status,
      hasToken: !!integrations[index].adminAccessToken
    });
  } else {
    console.error('[Storage] Failed to save updated integration');
  }
  
  return integrations[index];
}

// Șterge o integrare
export function deleteIntegration(id) {
  const integrations = loadIntegrations();
  const filtered = integrations.filter(integration => integration.id !== id);
  saveIntegrations(filtered);
  return filtered.length < integrations.length;
}

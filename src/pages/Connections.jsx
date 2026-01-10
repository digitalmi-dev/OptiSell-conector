import { useState, useEffect } from 'react';
import { FiShoppingBag, FiCheck, FiX, FiRefreshCw, FiLink, FiPlus, FiEdit, FiTrash2, FiAlertCircle, FiExternalLink } from 'react-icons/fi';
import Modal from '../components/Modal';
import { shopifyAPI } from '../services/api';

function Connections() {
  const [integrations, setIntegrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [formData, setFormData] = useState({
    storeName: '',
    adminAccessToken: '',
    name: ''
  });

  useEffect(() => {
    // Verifică dacă backend-ul rulează la mount
    checkBackendHealth();
    loadIntegrations();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('/api/health');
      if (!response.ok) {
        console.warn('Backend server health check failed');
      }
    } catch (error) {
      console.error('Backend server nu rulează! Verifică că ai pornit backend-ul cu: npm run dev:server', error);
    }
  };

  const loadIntegrations = async () => {
    setIsLoading(true);
    try {
      const response = await shopifyAPI.getIntegrations();
      if (response.success) {
        setIntegrations(response.data || []);
      }
      } catch (error) {
        console.error('Error loading integrations:', error);
        
        let errorMessage = error.message;
        if (errorMessage.includes('Backend server nu rulează') || errorMessage.includes('HTML')) {
          errorMessage = 'Backend server nu rulează! Pornește backend-ul cu: npm run dev:server';
        }
        
        alert('Eroare la încărcarea integrărilor: ' + errorMessage);
      } finally {
        setIsLoading(false);
      }
  };

  const handleAddIntegration = () => {
    setEditingIntegration(null);
    setFormData({
      storeName: '',
      adminAccessToken: '',
      name: ''
    });
    setTestResult(null);
    setIsModalOpen(true);
  };

  const handleEditIntegration = (integration) => {
    setEditingIntegration(integration);
    setFormData({
      storeName: integration.storeName || '',
      adminAccessToken: '', // Nu afișăm token-ul existent pentru securitate
      name: integration.name || ''
    });
    setTestResult(null);
    setIsModalOpen(true);
  };

  const handleSaveIntegration = async (e) => {
    e.preventDefault();

    if (!formData.storeName || !formData.storeName.trim()) {
      alert('Store Name este obligatoriu!');
      return;
    }

    if (!formData.adminAccessToken || !formData.adminAccessToken.trim()) {
      alert('Admin API Access Token este obligatoriu!');
      return;
    }

    // Validare format token
    const cleanToken = formData.adminAccessToken.trim().replace(/\s+/g, '');
    if (!cleanToken.startsWith('shpat_') && !cleanToken.startsWith('shpca_')) {
      let tokenType = 'necunoscut';
      if (cleanToken.startsWith('shpss_')) {
        tokenType = 'Storefront API Access Token';
      } else if (cleanToken.startsWith('shpcn_')) {
        tokenType = 'Custom App Storefront API Access Token';
      }
      
      const errorMessage = `❌ Token Invalid!\n\nToken-ul introdus este de tip "${tokenType}" (începe cu "${cleanToken.substring(0, 5)}_").\n\nTrebuie să folosești Admin API Access Token care începe cu:\n• "shpat_" (Private App)\n• "shpca_" (Custom App Admin API)\n\nToken-ul actual: ${cleanToken.substring(0, 15)}...\n\nCum să obții token-ul corect:\n1. Shopify Admin → Settings → Apps and sales channels\n2. Develop apps → [App-ul tău]\n3. Admin API integration → Copiază "Admin API access token"\n4. NU copia "Storefront API access token"`;
      
      alert(errorMessage);
      return;
    }

    try {
      if (editingIntegration) {
        // Actualizează integrare existentă
        const response = await shopifyAPI.updateIntegration(editingIntegration.id, {
          storeName: formData.storeName.trim(),
          adminAccessToken: formData.adminAccessToken.trim(),
          name: formData.name.trim() || `Shopify - ${formData.storeName.trim()}`
        });

        if (response.success) {
          alert('Integrarea a fost actualizată cu succes!');
          setIsModalOpen(false);
          loadIntegrations();
        }
      } else {
        // Creează integrare nouă
        const response = await shopifyAPI.createIntegration({
          storeName: formData.storeName.trim(),
          adminAccessToken: formData.adminAccessToken.trim(),
          name: formData.name.trim() || undefined
        });

        if (response.success) {
          alert('Integrarea a fost creată cu succes!');
          setIsModalOpen(false);
          loadIntegrations();
        }
      }
    } catch (error) {
      console.error('Error saving integration:', error);
      
      // Mesaj de eroare mai clar
      let errorMessage = error.message;
      
      if (errorMessage.includes('Backend server nu rulează') || errorMessage.includes('HTML')) {
        errorMessage = `Backend server nu rulează!\n\nVerifică că ai pornit backend-ul într-un terminal separat:\n\nnpm run dev:server\n\nSAU rulează ambele simultan:\n\nnpm run dev`;
      }
      
      alert(`Eroare la salvarea integrării:\n\n${errorMessage}`);
    }
  };

  const handleTestConnection = async (id) => {
    setTestingId(id);
    setTestResult(null);

    try {
      const response = await shopifyAPI.testConnection(id);

      if (response.success) {
        setTestResult({
          success: true,
          message: response.message || 'Conexiunea cu Shopify a reușit!',
          data: response.data
        });
        // Reîncarcă integrările pentru a actualiza status-ul
        loadIntegrations();
      } else {
        // Mesaj de eroare mai detaliat
        let errorMessage = response.message || 'Conexiunea cu Shopify a eșuat!';
        
        if (response.tokenType) {
          errorMessage = `${errorMessage}\n\nToken-ul folosit este de tip: ${response.tokenType}\nTrebuie să folosești Admin API Access Token (shpat_ sau shpca_).`;
        }
        
        if (response.hint) {
          errorMessage = `${errorMessage}\n\n${response.hint}`;
        }
        
        setTestResult({
          success: false,
          message: errorMessage,
          error: response.error,
          tokenType: response.tokenType,
          hint: response.hint
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || 'Eroare la testarea conexiunii!',
        error: error.message
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteIntegration = async (id, name) => {
    if (!window.confirm(`Ești sigur că vrei să ștergi integrarea "${name}"?`)) {
      return;
    }

    try {
      const response = await shopifyAPI.deleteIntegration(id);

      if (response.success) {
        alert('Integrarea a fost ștearsă cu succes!');
        loadIntegrations();
      }
    } catch (error) {
      console.error('Error deleting integration:', error);
      alert('Eroare la ștergerea integrării: ' + error.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Connections</h1>
        <button
          onClick={handleAddIntegration}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
        >
          <FiPlus className="w-4 h-4" />
          <span>Adaugă Conexiune</span>
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center">
          <FiRefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-sm text-gray-500">Se încarcă conexiunile...</p>
        </div>
      ) : integrations.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center">
          <FiLink className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nu există conexiuni</h3>
          <p className="text-sm text-gray-500 mb-6">
            Adaugă o conexiune pentru a începe să sincronizezi produsele
          </p>
          <button
            onClick={handleAddIntegration}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm mx-auto"
          >
            <FiPlus className="w-4 h-4" />
            <span>Adaugă Prima Conexiune</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    integration.status === 'connected' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <FiShoppingBag className={`w-6 h-6 ${
                      integration.status === 'connected' ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                    <p className="text-sm text-gray-500">
                      {integration.shopDomain || `${integration.storeName}.myshopify.com`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Creată: {new Date(integration.createdAt).toLocaleDateString('ro-RO')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {integration.status === 'connected' ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                      <FiCheck className="w-4 h-4" />
                      Conectat
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded text-xs font-medium">
                      <FiX className="w-4 h-4" />
                      Neconectat
                    </span>
                  )}
                </div>
              </div>

              {testResult && testResult.success && testResult.data?.shop && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FiCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800 mb-1">
                        {testResult.message}
                      </p>
                      <div className="text-xs text-green-700">
                        <p>Magazin: {testResult.data.shop.name}</p>
                        {testResult.data.shop.email && (
                          <p>Email: {testResult.data.shop.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {testResult && !testResult.success && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 mb-2 whitespace-pre-line">
                        {testResult.message}
                      </p>
                      
                      {testResult.tokenType && (
                        <div className="mt-2 mb-2 p-2 bg-red-100 rounded text-xs border border-red-200">
                          <p className="font-semibold text-red-900 mb-1">🔍 Tip token detectat:</p>
                          <p className="text-red-800">{testResult.tokenType}</p>
                        </div>
                      )}
                      
                      {testResult.hint && (
                        <div className="mt-2 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                          <p className="font-semibold text-yellow-900 mb-1">💡 Indicatie:</p>
                          <p className="text-yellow-800 whitespace-pre-line">{testResult.hint}</p>
                        </div>
                      )}
                      
                      {testResult.error && !testResult.message.includes(testResult.error) && (
                        <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                          <p className="font-semibold text-red-900 mb-1">Eroare tehnică:</p>
                          <p className="text-red-600 font-mono text-xs">{testResult.error}</p>
                        </div>
                      )}
                      
                      {testResult.status && (
                        <div className="mt-2 text-xs text-red-600">
                          <p>Status Code: {testResult.status}</p>
                          {testResult.status === 401 && (
                            <p className="mt-1">Token invalid sau expirat. Verifică că ai folosit Admin API Access Token (shpat_ sau shpca_).</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleTestConnection(integration.id)}
                  disabled={testingId === integration.id}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiRefreshCw className={`w-4 h-4 ${testingId === integration.id ? 'animate-spin' : ''}`} />
                  <span>{testingId === integration.id ? 'Testare...' : 'Testează Conexiunea'}</span>
                </button>
                <button
                  onClick={() => handleEditIntegration(integration)}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiEdit className="w-4 h-4 inline mr-1" />
                  Editează
                </button>
                <button
                  onClick={() => handleDeleteIntegration(integration.id, integration.name)}
                  className="px-4 py-2 text-sm text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <FiTrash2 className="w-4 h-4 inline mr-1" />
                  Șterge
                </button>
                <a
                  href={`/produse?integration=${integration.id}`}
                  className="px-4 py-2 text-sm text-purple-600 bg-white border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  Vezi Produse
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal pentru adăugare/editare integrare */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingIntegration(null);
          setTestResult(null);
        }}
        title={editingIntegration ? 'Editează Integrare Shopify' : 'Adaugă Integrare Shopify'}
        size="medium"
      >
        <form onSubmit={handleSaveIntegration} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nume Integrare
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={`Shopify - ${formData.storeName || 'my-shop'}`}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lăsat gol, se va genera automat din Store Name
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Store Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              placeholder="my-shop (fără .myshopify.com)"
              required
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Doar numele magazinului, fără .myshopify.com (ex: optisell-2)
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Admin API Access Token <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={formData.adminAccessToken}
              onChange={(e) => {
                const token = e.target.value;
                setFormData({ ...formData, adminAccessToken: token });
                
                // Validare în timp real
                if (token.trim()) {
                  const cleanToken = token.trim().replace(/\s+/g, '');
                  if (!cleanToken.startsWith('shpat_') && !cleanToken.startsWith('shpca_')) {
                    // Token invalid - dar nu afișăm eroare acum, doar la submit
                  }
                }
              }}
              placeholder="shpat_xxxxxxxxxxxxxxxxxxxxx"
              required
              className={`w-full px-2.5 py-1.5 text-sm border rounded focus:ring-1 focus:border-purple-500 ${
                formData.adminAccessToken.trim() && 
                !formData.adminAccessToken.trim().replace(/\s+/g, '').startsWith('shpat_') && 
                !formData.adminAccessToken.trim().replace(/\s+/g, '').startsWith('shpca_')
                  ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-purple-500'
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Admin API Access Token trebuie să înceapă cu <strong>shpat_</strong> (Private App) sau <strong>shpca_</strong> (Custom App Admin API)
            </p>
            {formData.adminAccessToken.trim() && 
             !formData.adminAccessToken.trim().replace(/\s+/g, '').startsWith('shpat_') && 
             !formData.adminAccessToken.trim().replace(/\s+/g, '').startsWith('shpca_') && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                <p className="font-semibold mb-1">⚠️ Token invalid detectat!</p>
                <p>Token-ul introdus începe cu "{formData.adminAccessToken.trim().substring(0, 5)}_" care este de tip Storefront API.</p>
                <p className="mt-1">Trebuie să folosești <strong>Admin API Access Token</strong> care începe cu "shpat_" sau "shpca_".</p>
                <p className="mt-1 text-red-600">Vezi documentația: GET_CORRECT_TOKEN.md</p>
              </div>
            )}
            {!editingIntegration && (
              <a
                href="https://help.shopify.com/en/manual/apps/app-types/custom-apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 mt-2"
              >
                <span>Cum obțin Admin API Access Token?</span>
                <FiExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-1.5">
              <FiAlertCircle className="w-4 h-4" />
              Instrucțiuni
            </h4>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Accesează Shopify Admin → Settings → Apps and sales channels</li>
              <li>Develop apps → Create an app</li>
              <li>Configurează Admin API scopes: read_products, write_products, read_inventory, write_inventory</li>
              <li>Install app și copiază Admin API access token</li>
            </ol>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingIntegration(null);
                setTestResult(null);
              }}
              className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Anulează
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              {editingIntegration ? 'Salvează Modificările' : 'Creează Integrare'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Connections;

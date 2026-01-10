import { FiStar, FiCamera, FiMoreVertical, FiPlus, FiSearch, FiEdit, FiTrash2, FiCopy, FiRefreshCw, FiCheck, FiX, FiAlertCircle, FiUpload, FiDownload } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Modal from '../components/Modal';
import ProductForm from '../components/ProductForm';
import { shopifyAPI } from '../services/api';

function Produse() {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [syncingProducts, setSyncingProducts] = useState(new Set());
  const [syncStatus, setSyncStatus] = useState({});
  const [shopifyIntegrations, setShopifyIntegrations] = useState([]);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState(null);
  const [searchParams] = useSearchParams();

  // Încarcă produsele din localStorage la mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('optisell_products');
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (e) {
        console.error('Error loading products:', e);
      }
    }

    const savedFavorites = localStorage.getItem('optisell_favorites');
    if (savedFavorites) {
      try {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      } catch (e) {
        console.error('Error loading favorites:', e);
      }
    }

    // Încarcă integrările Shopify
    loadShopifyIntegrations();

    // Verifică dacă există integration ID în URL
    const integrationId = searchParams.get('integration');
    if (integrationId) {
      setSelectedIntegrationId(integrationId);
    }
  }, [searchParams]);

  const loadShopifyIntegrations = async () => {
    try {
      const response = await shopifyAPI.getIntegrations();
      if (response.success) {
        setShopifyIntegrations(response.data || []);
        
        // Selectează prima integrare conectată dacă nu există deja selecție
        if (!selectedIntegrationId && response.data.length > 0) {
          const connectedIntegration = response.data.find(i => i.status === 'connected');
          if (connectedIntegration) {
            setSelectedIntegrationId(connectedIntegration.id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading Shopify integrations:', error);
    }
  };

  // Salvează produsele în localStorage când se schimbă
  useEffect(() => {
    if (products.length > 0 || localStorage.getItem('optisell_products')) {
      localStorage.setItem('optisell_products', JSON.stringify(products));
    }
  }, [products]);

  // Salvează favoritele în localStorage când se schimbă
  useEffect(() => {
    if (favorites.size > 0) {
      localStorage.setItem('optisell_favorites', JSON.stringify([...favorites]));
    }
  }, [favorites]);

  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.name?.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query) ||
      product.ean?.toLowerCase().includes(query) ||
      product.asin?.toLowerCase().includes(query)
    );
  });

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = (productData) => {
    // Verifică dacă este ștergere
    if (productData._delete && editingProduct) {
      handleDeleteProduct(editingProduct.id);
      setIsAddModalOpen(false);
      setEditingProduct(null);
      return;
    }

    // Verifică dacă este duplicare (are sku cu -COPY sau nu are id și există editingProduct)
    if (productData.sku?.includes('-COPY') && editingProduct) {
      const duplicatedProduct = {
        ...productData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        image: productData.images?.[0]?.preview || productData.images?.[0]?.url || editingProduct.image || null,
        integrations: productData.integrations || editingProduct.integrations || []
      };
      delete duplicatedProduct._delete;
      setProducts([...products, duplicatedProduct]);
      setIsAddModalOpen(false);
      setEditingProduct(null);
      return;
    }

    if (editingProduct) {
      // Editează produs existent
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { 
              ...productData, 
              id: editingProduct.id, 
              createdAt: p.createdAt, 
              updatedAt: new Date().toISOString(),
              image: productData.images?.[0]?.preview || productData.images?.[0]?.url || p.image || null,
              integrations: productData.integrations || p.integrations || []
            }
          : p
      ));
    } else {
      // Adaugă produs nou
      const newProduct = {
        ...productData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        image: productData.images?.[0]?.preview || productData.images?.[0]?.url || null,
        integrations: productData.integrations || []
      };
      delete newProduct._delete;
      setProducts([...products, newProduct]);
    }
    setIsAddModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm('Ești sigur că vrei să ștergi acest produs?')) {
      setProducts(products.filter(p => p.id !== productId));
      const newFavorites = new Set(favorites);
      newFavorites.delete(productId);
      setFavorites(newFavorites);
      const newSelected = new Set(selectedItems);
      newSelected.delete(productId);
      setSelectedItems(newSelected);
    }
  };

  const handleDuplicateProduct = (product) => {
    const duplicatedProduct = {
      ...product,
      id: Date.now().toString(),
      name: `${product.name} (Copie)`,
      sku: product.sku ? `${product.sku}-COPY` : '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    delete duplicatedProduct.createdAt;
    delete duplicatedProduct.updatedAt;
    setProducts([...products, duplicatedProduct]);
    setIsAddModalOpen(false);
    setEditingProduct(null);
  };

  const toggleFavorite = (productId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
  };

  const handleSyncProduct = async (product, integrationId = null) => {
    const integrationIdToUse = integrationId || selectedIntegrationId;
    
    if (!integrationIdToUse) {
      alert('Nu există o integrare Shopify selectată! Te rugăm să selectezi o integrare mai întâi.');
      return;
    }

    const integration = shopifyIntegrations.find(i => i.id === integrationIdToUse);
    if (!integration || integration.status !== 'connected') {
      alert('Integrarea Shopify nu este conectată! Te rugăm să testezi conexiunea mai întâi.');
      return;
    }

    if (!product.sku) {
      alert('Produsul trebuie să aibă un SKU pentru a fi sincronizat cu Shopify!');
      return;
    }

    setSyncingProducts(prev => new Set([...prev, product.id]));
    setSyncStatus(prev => ({ ...prev, [product.id]: { status: 'syncing', message: 'Se sincronizează...' } }));

    try {
      // Mapare produsul nostru la format Shopify
      const shopifyProduct = mapToShopifyProduct(product);
      
      // Folosește endpoint-ul de sync care face create sau update automat
      const syncResult = await shopifyAPI.createProduct(integrationIdToUse, shopifyProduct, product.shopifyId);
      
      const result = {
        success: syncResult.success,
        message: syncResult.message || 'Produs sincronizat cu succes în Shopify!',
        product: syncResult.product || syncResult.data,
        shopifyId: syncResult.shopifyId || syncResult.data?.shopifyId || syncResult.product?.id?.toString(),
        shopifyVariantId: syncResult.shopifyVariantId || syncResult.data?.shopifyVariantId || syncResult.product?.variants?.[0]?.id?.toString()
      };

      if (result.success) {
        // Actualizează produsul cu shopifyId
        setProducts(products.map(p => 
          p.id === product.id 
            ? { 
                ...p, 
                shopifyId: result.shopifyId || result.product?.id?.toString(),
                shopifyVariantId: result.product?.variants?.[0]?.id?.toString(),
                integrations: [...new Set([...(p.integrations || []), 'Shopify'])]
              }
            : p
        ));

        setSyncStatus(prev => ({ 
          ...prev, 
          [product.id]: { 
            status: 'success', 
            message: result.message || 'Produs sincronizat cu succes!' 
          } 
        }));
      } else {
        setSyncStatus(prev => ({ 
          ...prev, 
          [product.id]: { 
            status: 'error', 
            message: result.message || result.error || 'Eroare la sincronizare!' 
          } 
        }));
      }
    } catch (error) {
      setSyncStatus(prev => ({ 
        ...prev, 
        [product.id]: { 
          status: 'error', 
          message: error.message || 'Eroare la sincronizare!' 
        } 
      }));
    } finally {
      setSyncingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });

      // Șterge status-ul după 5 secunde
      setTimeout(() => {
        setSyncStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[product.id];
          return newStatus;
        });
      }, 5000);
    }
  };

  const mapToShopifyProduct = (product) => {
    return {
      title: product.name || 'Produs fără nume',
      body_html: product.description || product.shortDescription || '',
      vendor: product.brand || '',
      product_type: product.category || '',
      tags: product.tags || '',
      status: product.active !== false ? 'active' : 'draft',
      variants: [{
        sku: product.sku || '',
        price: product.price || '0.00',
        compare_at_price: product.comparePrice || null,
        inventory_quantity: parseInt(product.stock) || 0,
        inventory_management: 'shopify',
        inventory_policy: 'deny',
        taxable: true,
        weight: product.weight ? parseFloat(product.weight) : null,
        weight_unit: 'kg',
        requires_shipping: true,
      }],
      images: product.images && product.images.length > 0
        ? product.images.map((img, index) => ({
            src: img.preview || img.url || '',
            alt: product.name || '',
            position: index + 1
          }))
        : []
    };
  };

  const handleSyncSelected = async () => {
    if (selectedItems.size === 0) {
      alert('Te rugăm să selectezi cel puțin un produs pentru sincronizare!');
      return;
    }

    if (!selectedIntegrationId) {
      alert('Nu există o integrare Shopify selectată! Te rugăm să selectezi o integrare mai întâi.');
      return;
    }

    const integration = shopifyIntegrations.find(i => i.id === selectedIntegrationId);
    if (!integration || integration.status !== 'connected') {
      alert('Integrarea Shopify nu este conectată! Te rugăm să testezi conexiunea mai întâi.');
      return;
    }

    const productsToSync = products.filter(p => selectedItems.has(p.id));
    const productsWithSKU = productsToSync.filter(p => p.sku);

    if (productsWithSKU.length === 0) {
      alert('Produsele selectate trebuie să aibă SKU pentru a fi sincronizate cu Shopify!');
      return;
    }

    if (productsWithSKU.length < productsToSync.length) {
      if (!window.confirm(`${productsToSync.length - productsWithSKU.length} produse nu au SKU și vor fi omise. Continui?`)) {
        return;
      }
    }

    // Marchează toate produsele ca sincronizând
    productsWithSKU.forEach(p => {
      setSyncingProducts(prev => new Set([...prev, p.id]));
      setSyncStatus(prev => ({ ...prev, [p.id]: { status: 'syncing', message: 'Se sincronizează...' } }));
    });

    try {
      let successful = 0;
      let failed = 0;

      for (const product of productsWithSKU) {
        try {
          await handleSyncProduct(product, selectedIntegrationId);
          successful++;
        } catch (error) {
          failed++;
          console.error('Error syncing product:', product.id, error);
        }

        // Rate limiting - așteaptă 500ms între request-uri
        if (productsWithSKU.indexOf(product) < productsWithSKU.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      alert(`Sincronizare completă!\nSucces: ${successful}\nEșuat: ${failed}`);

      // Șterge status-urile după 5 secunde
      setTimeout(() => {
        setSyncStatus({});
      }, 5000);
    } catch (error) {
      alert(`Eroare la sincronizare în masă: ${error.message}`);
    }
  };

  const handleImportFromShopify = async () => {
    if (!selectedIntegrationId) {
      alert('Nu există o integrare Shopify selectată! Te rugăm să selectezi o integrare mai întâi.');
      return;
    }

    const integration = shopifyIntegrations.find(i => i.id === selectedIntegrationId);
    if (!integration || integration.status !== 'connected') {
      alert('Integrarea Shopify nu este conectată! Te rugăm să testezi conexiunea mai întâi.');
      return;
    }

    if (!window.confirm('Vrei să importi produsele din Shopify? Produsele existente vor fi actualizate dacă au același SKU.')) {
      return;
    }

    try {
      setSyncingProducts(new Set(['import']));
      
      const response = await shopifyAPI.getProducts(selectedIntegrationId, { limit: 250 });
      
      if (response.success && response.data) {
        const importedProducts = response.data.map(shopifyProduct => {
          // Mapare la format intern
          const existingProduct = products.find(p => p.shopifyId === shopifyProduct.shopifyId || p.sku === shopifyProduct.sku);
          
          if (existingProduct) {
            // Actualizează produsul existent
            return {
              ...existingProduct,
              name: shopifyProduct.name || existingProduct.name,
              description: shopifyProduct.description || existingProduct.description,
              shortDescription: shopifyProduct.shortDescription || existingProduct.shortDescription,
              price: shopifyProduct.price || existingProduct.price,
              comparePrice: shopifyProduct.comparePrice || existingProduct.comparePrice,
              stock: shopifyProduct.stock !== undefined ? shopifyProduct.stock : existingProduct.stock,
              brand: shopifyProduct.brand || existingProduct.brand,
              category: shopifyProduct.category || existingProduct.category,
              shopifyId: shopifyProduct.shopifyId,
              shopifyVariantId: shopifyProduct.shopifyVariantId,
              integrations: [...new Set([...(existingProduct.integrations || []), 'Shopify'])],
              updatedAt: new Date().toISOString()
            };
          } else {
            // Creează produs nou
            return {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              name: shopifyProduct.name || 'Produs fără nume',
              sku: shopifyProduct.sku || '',
              ean: shopifyProduct.ean || '',
              price: shopifyProduct.price || '0.00',
              comparePrice: shopifyProduct.comparePrice || null,
              stock: shopifyProduct.stock || 0,
              description: shopifyProduct.description || '',
              shortDescription: shopifyProduct.shortDescription || '',
              brand: shopifyProduct.brand || '',
              category: shopifyProduct.category || '',
              tags: shopifyProduct.tags || '',
              weight: shopifyProduct.weight || '',
              active: shopifyProduct.active !== false,
              image: shopifyProduct.image || null,
              images: shopifyProduct.images || [],
              shopifyId: shopifyProduct.shopifyId,
              shopifyVariantId: shopifyProduct.shopifyVariantId,
              integrations: ['Shopify'],
              createdAt: shopifyProduct.createdAt || new Date().toISOString(),
              updatedAt: shopifyProduct.updatedAt || new Date().toISOString()
            };
          }
        });

        // Actualizează produsele
        const updatedProducts = [...products];
        importedProducts.forEach(importedProduct => {
          const index = updatedProducts.findIndex(p => p.id === importedProduct.id);
          if (index >= 0) {
            updatedProducts[index] = importedProduct;
          } else {
            updatedProducts.push(importedProduct);
          }
        });
        setProducts(updatedProducts);

        alert(`Import complet!\n${importedProducts.length} produse importate/actualizate din Shopify.`);
      }
    } catch (error) {
      console.error('Error importing products:', error);
      alert('Eroare la importul produselor: ' + error.message);
    } finally {
      setSyncingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete('import');
        return newSet;
      });
    }
  };

  return (
    <div className="max-w-full mx-auto">
      {/* Header cu acțiuni */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Produse</h1>
        <div className="flex items-center gap-2">
          {shopifyIntegrations.length > 0 && (
            <div className="flex items-center gap-2 mr-4">
              <select
                value={selectedIntegrationId || ''}
                onChange={(e) => setSelectedIntegrationId(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              >
                <option value="">Selectează integrare Shopify</option>
                {shopifyIntegrations.map(integration => (
                  <option key={integration.id} value={integration.id}>
                    {integration.name} ({integration.status === 'connected' ? 'Conectat' : 'Neconectat'})
                  </option>
                ))}
              </select>
              {selectedIntegrationId && (
                <button
                  onClick={handleImportFromShopify}
                  disabled={syncingProducts.has('import')}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiDownload className={`w-4 h-4 ${syncingProducts.has('import') ? 'animate-spin' : ''}`} />
                  <span>{syncingProducts.has('import') ? 'Importare...' : 'Importă din Shopify'}</span>
                </button>
              )}
            </div>
          )}
          {selectedIntegrationId && selectedItems.size > 0 && (
            <button
              onClick={handleSyncSelected}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <FiUpload className="w-4 h-4" />
              <span>Trimite în Shopify ({selectedItems.size})</span>
            </button>
          )}
          <button
            onClick={handleAddProduct}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            <span>Adaugă Produs</span>
          </button>
        </div>
      </div>

      {/* Bară de căutare și filtre */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Caută după nume, SKU, EAN, ASIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          {selectedItems.size > 0 && (
            <div className="text-sm text-gray-600">
              {selectedItems.size} produs(e) selectat(e)
            </div>
          )}
        </div>
      </div>

      {/* Tabel produse */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedItems.size === filteredProducts.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                </th>
                <th className="px-4 py-3 text-left w-16">
                  <FiCamera className="w-4 h-4 text-gray-500" />
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase">NUME, EAN, SKU, ASIN</span>
                </th>
                <th className="px-4 py-3 text-left w-24">
                  <span className="text-xs font-semibold text-gray-700 uppercase">STOC</span>
                </th>
                <th className="px-4 py-3 text-left w-32">
                  <span className="text-xs font-semibold text-gray-700 uppercase">PRET</span>
                </th>
                <th className="px-4 py-3 text-left w-32">
                  <span className="text-xs font-semibold text-gray-700 uppercase">CATEGORIE</span>
                </th>
                <th className="px-4 py-3 text-left w-24">
                  <span className="text-xs font-semibold text-gray-700 uppercase">INTEGRARI</span>
                </th>
                <th className="px-4 py-3 text-left w-24">
                  <span className="text-xs font-semibold text-gray-700 uppercase">STATUS</span>
                </th>
                <th className="px-4 py-3 text-left w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <FiCamera className="w-12 h-12 text-gray-300" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {searchQuery ? 'Nu s-au găsit produse' : 'Nu există produse încă'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {searchQuery 
                            ? 'Încearcă o altă căutare' 
                            : 'Adaugă primul produs manual sau importă din platformele conectate'}
                        </p>
                      </div>
                      {!searchQuery && (
                        <button
                          onClick={handleAddProduct}
                          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          <FiPlus className="w-4 h-4" />
                          <span>Adaugă Produs</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <button 
                          onClick={() => toggleFavorite(product.id)}
                          className={`transition-colors ${
                            favorites.has(product.id) ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                          }`}
                          title={favorites.has(product.id) ? 'Elimină din favorite' : 'Adaugă la favorite'}
                        >
                          <FiStar className={`w-4 h-4 ${favorites.has(product.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <FiCamera className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          {product.name || 'Fără nume'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {[
                            product.id && `ID ${product.id}`,
                            product.sku && `SKU ${product.sku}`,
                            product.ean && `EAN ${product.ean}`,
                            product.asin && `ASIN ${product.asin}`
                          ].filter(Boolean).join(' | ') || 'Fără identificatori'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-sm font-medium ${
                        (product.stock || 0) > 0 ? 'text-gray-900' : 'text-red-600'
                      }`}>
                        {product.stock || 0} buc.
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        {product.price ? (
                          <>
                            <span className="text-sm font-semibold text-gray-900">
                              {product.price} RON
                            </span>
                            {product.comparePrice && (
                              <span className="text-xs text-gray-400 line-through ml-2">
                                {product.comparePrice} RON
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {product.category || 'Fără categorie'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        {product.integrations?.map((integration, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                            title={integration}
                          >
                            {integration}
                          </span>
                        )) || (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {syncStatus[product.id] && (
                          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                            syncStatus[product.id].status === 'success' 
                              ? 'bg-green-50 text-green-700' 
                              : syncStatus[product.id].status === 'error'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {syncStatus[product.id].status === 'success' && <FiCheck className="w-3 h-3" />}
                            {syncStatus[product.id].status === 'error' && <FiX className="w-3 h-3" />}
                            {syncStatus[product.id].status === 'syncing' && <FiRefreshCw className="w-3 h-3 animate-spin" />}
                            <span className="hidden sm:inline">{syncStatus[product.id].status === 'syncing' ? 'Sincronizare...' : syncStatus[product.id].status === 'success' ? 'OK' : 'Eroare'}</span>
                          </div>
                        )}
                        {selectedIntegrationId && product.shopifyId && (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded" title={`Shopify ID: ${product.shopifyId}`}>
                            <FiCheck className="w-3 h-3 inline" />
                          </span>
                        )}
                        {selectedIntegrationId && !product.shopifyId && product.sku && (
                          <button
                            onClick={() => handleSyncProduct(product)}
                            disabled={syncingProducts.has(product.id)}
                            className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            title="Trimite în Shopify"
                          >
                            <FiRefreshCw className={`w-3 h-3 ${syncingProducts.has(product.id) ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Sync</span>
                          </button>
                        )}
                        {selectedIntegrationId && !product.sku && (
                          <span className="text-xs text-gray-400" title="Produsul trebuie să aibă SKU pentru sync">
                            <FiAlertCircle className="w-3 h-3" />
                          </span>
                        )}
                        {!selectedIntegrationId && shopifyIntegrations.length === 0 && (
                          <span className="text-xs text-gray-400" title="Configurează o integrare Shopify în Connections">
                            <FiAlertCircle className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="relative group">
                        <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                          <FiMoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <FiEdit className="w-4 h-4" />
                            <span>Editează</span>
                          </button>
                          <button
                            onClick={() => handleDuplicateProduct(product)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <FiCopy className="w-4 h-4" />
                            <span>Duplică</span>
                          </button>
                          <div className="border-t border-gray-200 my-1"></div>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            <span>Șterge</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal pentru adăugare/editare produs */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        title={editingProduct ? 'Editează Produs' : 'Adaugă Produs Nou'}
        size="xlarge"
      >
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => {
            setIsAddModalOpen(false);
            setEditingProduct(null);
          }}
        />
      </Modal>
    </div>
  );
}

export default Produse;
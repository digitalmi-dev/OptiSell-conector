import { useState, useEffect } from "react";
import {
  FiShoppingBag,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiLink,
  FiPlus,
  FiAlertCircle,
  FiExternalLink,
} from "react-icons/fi";
import { shopifyAPI } from "../services/api";

function Connections() {
  const [isLoading, setIsLoading] = useState(true);
  const [shopifyStatus, setShopifyStatus] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    checkShopifyStatus();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("shopify_installed") === "true") {
      const shop = urlParams.get("shop");
      alert(`Shopify conectat cu succes pentru ${shop}!`);
      window.history.replaceState({}, document.title, window.location.pathname);
      checkShopifyStatus();
    }
  }, []);

  const checkShopifyStatus = async () => {
    setIsLoading(true);
    try {
      const response = await shopifyAPI.getShopifyStatus();
      if (response.success) {
        setShopifyStatus(response.data);
      }
    } catch (error) {
      console.error("Error checking Shopify status:", error);
      setShopifyStatus({ installed: false, hasToken: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectShopify = () => {
    const shopDomain = prompt("Introdu numele magazinului Shopify (ex: nume-magazin sau nume-magazin.myshopify.com):");
    
    if (!shopDomain || !shopDomain.trim()) {
      return;
    }

    const cleanDomain = shopDomain.trim().replace(/\.myshopify\.com$/, "");
    const installUrl = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"}/api/shopify/install?shop=${encodeURIComponent(cleanDomain)}`;
    
    window.location.href = installUrl;
  };

  const handleLoadProducts = async () => {
    const shopDomain = prompt("Introdu numele magazinului Shopify (ex: nume-magazin sau nume-magazin.myshopify.com):");
    
    if (!shopDomain || !shopDomain.trim()) {
      return;
    }

    setLoadingProducts(true);
    try {
      let cleanDomain = shopDomain.trim();
      if (!cleanDomain.includes(".myshopify.com")) {
        cleanDomain = `${cleanDomain}.myshopify.com`;
      }
      cleanDomain = cleanDomain.replace(/^https?:\/\//, "");

      const response = await shopifyAPI.getShopifyProducts(cleanDomain);
      if (response.success) {
        setProducts(response.data || []);
      } else {
        alert(`Eroare: ${response.message || "Eroare necunoscută"}`);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      alert(`Eroare la încărcarea produselor: ${error.message}`);
    } finally {
      setLoadingProducts(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Connections</h1>
      </div>

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center">
          <FiRefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-sm text-gray-500">Se verifică statusul Shopify...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    shopifyStatus?.installed ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  <FiShoppingBag
                    className={`w-6 h-6 ${
                      shopifyStatus?.installed ? "text-green-600" : "text-gray-400"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Shopify</h3>
                  <p className="text-sm text-gray-500">
                    {shopifyStatus?.installed
                      ? "Shopify conectat"
                      : "Shopify neconectat"}
                  </p>
                  {shopifyStatus?.scope && (
                    <p className="text-xs text-gray-400 mt-1">
                      Scope: {shopifyStatus.scope}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {shopifyStatus?.installed ? (
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

            <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
              {!shopifyStatus?.installed ? (
                <button
                  onClick={handleConnectShopify}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Conectează Shopify</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleLoadProducts}
                    disabled={loadingProducts}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiRefreshCw className={`w-4 h-4 ${loadingProducts ? "animate-spin" : ""}`} />
                    <span>{loadingProducts ? "Se încarcă..." : "Încarcă Produse"}</span>
                  </button>
                  <button
                    onClick={handleConnectShopify}
                    className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Reconectează
                  </button>
                </>
              )}
            </div>
          </div>

          {products.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Produse Shopify ({products.length})</h3>
              <div className="space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900">{product.title || "Fără nume"}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          ID: {product.id} | Status: {product.status || "N/A"}
                        </p>
                        {product.variants && product.variants.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Variante: {product.variants.length} | Preț: {product.variants[0].price || "N/A"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-1.5">
          <FiAlertCircle className="w-4 h-4" />
          Instrucțiuni
        </h4>
        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
          <li>Configurează SHOPIFY_CLIENT_ID și SHOPIFY_CLIENT_SECRET în variabilele de mediu</li>
          <li>Click pe "Conectează Shopify" și introdu numele magazinului</li>
          <li>Autorizează aplicația în Shopify Admin</li>
          <li>După autorizare, vei fi redirecționat înapoi și Shopify va fi conectat</li>
        </ol>
      </div>
    </div>
  );
}

export default Connections;

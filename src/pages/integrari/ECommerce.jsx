import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingBag, FiArrowRight, FiInfo } from 'react-icons/fi';

function ECommerce() {
  const navigate = useNavigate();


  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">eCommerce Integrări</h1>

      {/* Info Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FiShoppingBag className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Shopify Integration</h2>
            <p className="text-sm text-gray-600 mb-4">
              Gestionează integrările cu Shopify din pagina Connections. Acolo poți configura conexiunile, testa conexiunea și sincroniza produsele.
            </p>
            <button
              onClick={() => navigate('/connections')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <span>Mergi la Connections</span>
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Instrucțiuni */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <FiInfo className="w-5 h-5" />
          Cum configurezi Shopify pentru integrare locală
        </h3>
        <ol className="text-xs text-blue-800 space-y-2 list-decimal list-inside">
          <li>
            <strong>Accesează Shopify Admin</strong> → Settings → Apps and sales channels
          </li>
          <li>
            <strong>Develop apps</strong> → Create an app
          </li>
          <li>
            <strong>Configurează Admin API scopes:</strong>
            <ul className="list-disc list-inside ml-6 mt-1">
              <li>read_products</li>
              <li>write_products</li>
              <li>read_inventory</li>
              <li>write_inventory</li>
            </ul>
          </li>
          <li>
            <strong>Install app</strong> și copiază <strong>Admin API access token</strong>
          </li>
          <li>
            <strong>În OptiSell Integrator:</strong> Mergi la Connections → Adaugă Conexiune → Completează Store Name și Admin API Access Token
          </li>
        </ol>
        <p className="text-xs text-blue-700 mt-4 font-medium">
          Notă: Pentru development local, folosește Admin API Access Token direct (nu este nevoie de OAuth).
        </p>
      </div>
    </div>
  );
}

export default ECommerce;

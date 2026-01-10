import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiLink, 
  FiLayers, 
  FiActivity, 
  FiSettings, 
  FiChevronLeft, 
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiPackage,
  FiShoppingBag,
  FiBox
} from 'react-icons/fi';
import Logo from './Logo';

function Sidebar({ isCollapsed, onToggle }) {
  const location = useLocation();
  const [isIntegrariOpen, setIsIntegrariOpen] = useState(false);
  const [isProduseOpen, setIsProduseOpen] = useState(false);

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', path: '/' },
    { icon: FiLink, label: 'Connections', path: '/connections' },
    { icon: FiLayers, label: 'Mappings', path: '/mappings' },
    { icon: FiActivity, label: 'Logs', path: '/logs' },
  ];

  const integrariSubmenu = [
    { icon: FiShoppingBag, label: 'eCommerce', path: '/integrari/ecommerce' },
    { icon: FiPackage, label: 'Marketplace', path: '/integrari/marketplace' },
  ];

  const produseSubmenu = [
    { icon: FiBox, label: 'Produse', path: '/produse' },
  ];

  const settingsItem = {
    icon: FiSettings,
    label: 'Settings',
    path: '/settings',
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const toggleIntegrari = () => {
    if (!isCollapsed) {
      setIsIntegrariOpen(!isIntegrariOpen);
    }
  };

  const toggleProduse = () => {
    if (!isCollapsed) {
      setIsProduseOpen(!isProduseOpen);
    }
  };

  // Auto-open submenus if on corresponding route
  useEffect(() => {
    if (location.pathname.startsWith('/integrari')) {
      setIsIntegrariOpen(true);
    }
    if (location.pathname.startsWith('/produse')) {
      setIsProduseOpen(true);
    }
  }, [location.pathname]);

  return (
    <div
      className={`bg-sidebar-bg border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <Logo isCollapsed={isCollapsed} />

      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-700 hover:bg-sidebar-hover'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          {/* Integrări cu submeniu */}
          {!isCollapsed ? (
            <div className="space-y-1">
              <button
                onClick={toggleIntegrari}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/integrari')
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-700 hover:bg-sidebar-hover'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FiLink className="w-4 h-4 flex-shrink-0" />
                  <span>Integrări</span>
                </div>
                {isIntegrariOpen ? (
                  <FiChevronUp className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <FiChevronDown className="w-4 h-4 flex-shrink-0" />
                )}
              </button>
              
              {isIntegrariOpen && (
                <div className="ml-6 space-y-1 mt-1">
                  {integrariSubmenu.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-700 hover:bg-sidebar-hover'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="relative group">
              <button
                className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-sidebar-hover transition-colors"
                title="Integrări"
              >
                <FiLink className="w-4 h-4 flex-shrink-0" />
              </button>
            </div>
          )}

          {/* Produse & Oferte cu submeniu */}
          {!isCollapsed ? (
            <div className="space-y-1">
              <button
                onClick={toggleProduse}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/produse')
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-700 hover:bg-sidebar-hover'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FiBox className="w-4 h-4 flex-shrink-0" />
                  <span>Produse & Oferte</span>
                </div>
                {isProduseOpen ? (
                  <FiChevronUp className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <FiChevronDown className="w-4 h-4 flex-shrink-0" />
                )}
              </button>
              
              {isProduseOpen && (
                <div className="ml-6 space-y-1 mt-1">
                  {produseSubmenu.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-700 hover:bg-sidebar-hover'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="relative group">
              <button
                className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-sidebar-hover transition-colors"
                title="Produse & Oferte"
              >
                <FiBox className="w-4 h-4 flex-shrink-0" />
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="border-t border-gray-200 p-2">
        {(() => {
          const SettingsIcon = settingsItem.icon;
          return (
            <Link
              to={settingsItem.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(settingsItem.path)
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-700 hover:bg-sidebar-hover'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? settingsItem.label : ''}
            >
              <SettingsIcon className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>{settingsItem.label}</span>}
            </Link>
          );
        })()}
      </div>

      <button
        onClick={onToggle}
        className="flex items-center justify-center h-12 border-t border-gray-200 hover:bg-sidebar-hover transition-colors"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <FiChevronRight className="w-5 h-5 text-gray-500" />
        ) : (
          <FiChevronLeft className="w-5 h-5 text-gray-500" />
        )}
      </button>
    </div>
  );
}

export default Sidebar;
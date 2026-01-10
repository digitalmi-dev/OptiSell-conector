import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiBell, FiHelpCircle, FiUser, FiSettings, FiLogOut, FiChevronDown } from 'react-icons/fi';

function Navbar() {
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/connections') return 'Connections';
    if (path === '/mappings') return 'Mappings';
    if (path === '/logs') return 'Logs';
    if (path === '/settings') return 'Settings';
    if (path === '/integrari/ecommerce') return 'eCommerce Integrări';
    if (path === '/integrari/marketplace') return 'Marketplace Integrări';
    if (path === '/produse') return 'Produse';
    return 'Dashboard';
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <FiBell className="w-5 h-5" />
        </button>

        {/* Help */}
        <button
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Help"
        >
          <FiHelpCircle className="w-5 h-5" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-medium">
              U
            </div>
            <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
              <button
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <FiUser className="w-4 h-4" />
                <span>Profil</span>
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <FiSettings className="w-4 h-4" />
                <span>Setări</span>
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <FiLogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
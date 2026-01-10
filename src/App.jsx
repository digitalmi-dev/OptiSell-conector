import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Connections from './pages/Connections';
import Mappings from './pages/Mappings';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import ECommerce from './pages/integrari/ECommerce';
import Marketplace from './pages/integrari/Marketplace';
import Produse from './pages/Produse';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <Router>
      <div className="flex h-screen overflow-hidden">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/mappings" element={<Mappings />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/integrari/ecommerce" element={<ECommerce />} />
              <Route path="/integrari/marketplace" element={<Marketplace />} />
              <Route path="/produse" element={<Produse />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
import { Link } from 'react-router-dom';

function Logo({ isCollapsed }) {
  return (
    <Link to="/" className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
      {isCollapsed ? (
        <div className="flex items-center gap-1">
          <span className="text-2xl font-bold text-purple-600">O</span>
          <span className="text-2xl font-bold text-orange-500">S</span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <span className="text-2xl font-bold text-purple-600">Opti</span>
          <span className="text-2xl font-bold text-orange-500">Sell</span>
          <span className="text-base font-normal text-gray-900 ml-1">Integrator</span>
        </div>
      )}
    </Link>
  );
}

export default Logo;
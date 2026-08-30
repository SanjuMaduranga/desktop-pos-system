import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Package,
  Truck,
  ReceiptText,
  ShoppingCart,
  Trash2,
  LogOut,
  Store,
  Bell,
  Search,
  Plus,
  Layers,
  Users,
  Settings,
  FileText,
  ClipboardList,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  X,
  AlertCircle
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

function MainLayout({ children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    inventory: true,
    reports: false,
    admin: false
  });
  const [settings, setSettings] = useState({
    storeName: 'POS System',
    storeAddress: '',
    storePhone: '',
    storeEmail: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const mainContentRef = useRef(null);

  // Searchable items configuration - moved outside component to prevent recreation
  const searchableItems = useRef([
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/pos', label: 'POS', icon: ShoppingCart },
    { path: '/products', label: 'Products', icon: Package },
    { path: '/suppliers', label: 'Suppliers', icon: Truck },
    { path: '/sales', label: 'Sales', icon: ReceiptText },
    { path: '/products/add', label: 'Add Product', icon: Plus, admin: true },
    { path: '/categories', label: 'Categories', icon: Layers, admin: true },
    { path: '/stock-adjustments', label: 'Stock Adjustments', icon: RefreshCw, admin: true },
    { path: '/purchase-orders', label: 'Purchase Orders', icon: FileText, admin: true },
    { path: '/deleted-products', label: 'Deleted Products', icon: Trash2, admin: true },
    { path: '/reports/sales', label: 'Sales Reports', icon: BarChart3 },
    { path: '/reports/inventory', label: 'Inventory Reports', icon: ClipboardList, admin: true },
    { path: '/users', label: 'Users', icon: Users, admin: true },
    { path: '/settings', label: 'Settings', icon: Settings, admin: true },
  ]);

  async function loadSettings() {
    try {
      const data = await window.electronAPI.getSettings();
      if (data) {
        setSettings({
          storeName: data.storeName || 'POS System',
          storeAddress: data.storeAddress || '',
          storePhone: data.storePhone || '',
          storeEmail: data.storeEmail || '',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSettings();
  }, []);

  // Handle search - wrapped in useCallback to prevent recreation
  const performSearch = useCallback((query) => {
    if (query.trim().length > 0) {
      const searchTerm = query.toLowerCase();
      const results = searchableItems.current.filter(item => {
        // Skip admin items for non-admin users
        if (item.admin && user?.role !== 'ADMIN') {
          return false;
        }
        return item.label.toLowerCase().includes(searchTerm);
      });
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [user]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape to clear search
      if (e.key === 'Escape' && showSearchResults) {
        setSearchQuery('');
        setShowSearchResults(false);
        searchInputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSearchResults]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    navigate("/login");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle navigation with scroll reset - NO PAGE REFRESH
  const handleNavigation = (path, e) => {
    // Prevent default behavior
    if (e) e.preventDefault();
    
    // Clear search
    setSearchQuery('');
    setShowSearchResults(false);
    
    // Navigate to the path
    navigate(path);
    
    // Reset scroll position of the main content
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    // Fallback for window scroll
    window.scrollTo(0, 0);
  };

  // Helper function to check if a path is active
  const isPathActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Main navigation items
  const mainMenuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/",
      admin: false,
    },
    {
      title: "POS",
      icon: ShoppingCart,
      path: "/pos",
      admin: false,
    },
    {
      title: "Products",
      icon: Package,
      path: "/products",
      admin: false,
    },
    {
      title: "Suppliers",
      icon: Truck,
      path: "/suppliers",
      admin: false,
    },
    {
      title: "Sales",
      icon: ReceiptText,
      path: "/sales",
      admin: false,
    },
  ];

  // Inventory management sub-items
  const inventoryMenuItems = [
    {
      title: "Add Product",
      icon: Plus,
      path: "/products/add",
      admin: true,
    },
    {
      title: "Categories",
      icon: Layers,
      path: "/categories",
      admin: true,
    },
    {
      title: "Stock Adjustments",
      icon: RefreshCw,
      path: "/stock-adjustments",
      admin: true,
    },
    {
      title: "Purchase Orders",
      icon: FileText,
      path: "/purchase-orders",
      admin: true,
    },
    {
      title: "Deleted Products",
      icon: Trash2,
      path: "/deleted-products",
      admin: true,
    },
  ];

  // Reports & Analytics
  const reportsMenuItems = [
    {
      title: "Sales Reports",
      icon: BarChart3,
      path: "/reports/sales",
      admin: false,
    },
    {
      title: "Inventory Reports",
      icon: ClipboardList,
      path: "/reports/inventory",
      admin: true,
    },
  ];

  // Admin & Settings
  const adminMenuItems = [
    {
      title: "Users",
      icon: Users,
      path: "/users",
      admin: true,
    },
    {
      title: "Settings",
      icon: Settings,
      path: "/settings",
      admin: true,
    },
  ];

  // Helper function to render nav items
  const renderNavItems = (items, isSubMenu = false) => {
    return items.map((item) => {
      // Skip admin items if user is not admin
      if (item.admin && user?.role !== "ADMIN") return null;

      const Icon = item.icon;
      const isActive = isPathActive(item.path);

      return (
        <NavLink
          key={item.title}
          to={item.path}
          end={item.path === "/"}
          onClick={(e) => handleNavigation(item.path, e)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm
            ${
              isActive
                ? "bg-indigo-50 text-indigo-600 font-semibold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }
            ${isSubMenu ? "pl-10 text-sm" : ""}`
          }
        >
          <Icon size={isSubMenu ? 16 : 19} className="shrink-0" />
          <span className="truncate">{item.title}</span>
        </NavLink>
      );
    });
  };

  return (
    <div className="flex h-screen bg-slate-100">

      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm shrink-0 overflow-y-auto">

        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-slate-200 shrink-0">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-md shrink-0">
            <Store className="text-white" size={22} />
          </div>
          <div className="ml-3 min-w-0">
            <h1 className="font-bold text-xl text-slate-800 truncate">
              {settings.storeName}
            </h1>
            <p className="text-xs text-slate-500 truncate">
              Inventory Management
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          
          {/* Main Menu - Always visible */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Main
            </p>
            {renderNavItems(mainMenuItems)}
          </div>

          {/* Inventory Management - Collapsible */}
          {user?.role === "ADMIN" && (
            <div className="mt-6">
              <button
                onClick={() => toggleSection('inventory')}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition"
              >
                <span>Inventory</span>
                {expandedSections.inventory ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
              {expandedSections.inventory && (
                <div className="space-y-1 mt-1">
                  {renderNavItems(inventoryMenuItems, true)}
                </div>
              )}
            </div>
          )}

          {/* Reports - Collapsible */}
          <div className="mt-6">
            <button
              onClick={() => toggleSection('reports')}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition"
            >
              <span>Reports</span>
              {expandedSections.reports ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
            {expandedSections.reports && (
              <div className="space-y-1 mt-1">
                {renderNavItems(reportsMenuItems, true)}
              </div>
            )}
          </div>

          {/* Admin - Collapsible */}
          {user?.role === "ADMIN" && (
            <div className="mt-6">
              <button
                onClick={() => toggleSection('admin')}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition"
              >
                <span>Administration</span>
                {expandedSections.admin ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
              {expandedSections.admin && (
                <div className="space-y-1 mt-1">
                  {renderNavItems(adminMenuItems, true)}
                </div>
              )}
            </div>
          )}

        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-200 shrink-0">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-center">
              <div className="h-11 w-11 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="ml-3 min-w-0">
                <h3 className="font-semibold text-slate-800 text-sm truncate">
                  {user?.name}
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 text-white py-2 text-sm font-medium transition-all"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>

      </aside>

      {/* Right Side */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-800 truncate">
              Welcome Back 👋
            </h2>
            <p className="text-sm text-slate-500 truncate">
              Manage your business efficiently
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Search */}
            <div className="relative" ref={searchContainerRef}>
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-2.5 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                  className="w-64 rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowSearchResults(false);
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-y-auto z-50">
                  {searchResults.length > 0 ? (
                    <div className="py-1">
                      {searchResults.map((result) => {
                        const Icon = result.icon;
                        return (
                          <button
                            key={result.path}
                            onClick={() => handleNavigation(result.path)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-sm text-slate-700"
                          >
                            <Icon size={16} className="text-slate-400" />
                            <span>{result.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-4 px-4">
                      <Search size={24} className="text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">No results found</p>
                      <p className="text-xs text-slate-400">Try a different search term</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notification */}
            <button className="w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition flex items-center justify-center shrink-0">
              <Bell size={19} className="text-slate-600" />
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200">
              <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="hidden md:block min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Added ref for scroll control */}
        <main ref={mainContentRef} className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={cancelLogout} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
              {/* Modal Header */}
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Confirm Logout</h2>
                <button
                  onClick={cancelLogout}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <LogOut size={28} className="text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-lg">Logout</p>
                    <p className="text-sm text-slate-500">
                      Are you sure you want to logout from your account?
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    You will need to login again to access your account.
                  </p>
                </div>

                {/* Modal Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-200 mt-4">
                  <button
                    onClick={cancelLogout}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow-md"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainLayout;
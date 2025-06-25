import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

const useAuth = () => React.useContext(AuthContext);

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setToken(null);
      localStorage.removeItem('token');
    }
    setLoading(false);
  };

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    setCurrentPage('dashboard');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-100 to-pink-50">
      <div className="text-center">
        <div className="animate-pulse text-6xl mb-4">💕</div>
        <p className="text-gray-600">Loading your wedding plans...</p>
      </div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        {!user ? (
          <AuthPage />
        ) : (
          <div className="flex">
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <main className="flex-1 ml-64">
              <Header />
              <div className="p-6">
                {currentPage === 'dashboard' && <Dashboard />}
                {currentPage === 'budget' && <BudgetManagement />}
                {currentPage === 'guests' && <GuestManagement />}
                {currentPage === 'vendors' && <VendorManagement />}
                {currentPage === 'tasks' && <TaskManagement />}
                {currentPage === 'venues' && <VenueSelection />}
                {currentPage === 'analytics' && <Analytics />}
              </div>
            </main>
          </div>
        )}
      </div>
    </AuthContext.Provider>
  );
}

// Auth Page Component
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    partner_name: '',
    wedding_date: ''
  });
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const endpoint = isLogin ? '/login' : '/register';
      const payload = isLogin ? 
        { email: formData.email, password: formData.password } :
        { 
          email: formData.email, 
          password: formData.password,
          full_name: formData.full_name,
          partner_name: formData.partner_name,
          wedding_date: formData.wedding_date || null
        };

      const response = await axios.post(`${API}${endpoint}`, payload);
      login(response.data.access_token);
    } catch (error) {
      setError(error.response?.data?.detail || 'Authentication failed');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">💐</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Welcome Back!' : 'Start Planning'}
          </h2>
          <p className="text-gray-600">
            {isLogin ? 'Sign in to continue planning your perfect day' : 'Create your wedding planning account'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-xl" onSubmit={handleSubmit}>
          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <input
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
            />
            
            <input
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
            
            {!isLogin && (
              <>
                <input
                  name="full_name"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  placeholder="Your full name"
                  value={formData.full_name}
                  onChange={handleChange}
                />
                
                <input
                  name="partner_name"
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  placeholder="Partner's name (optional)"
                  value={formData.partner_name}
                  onChange={handleChange}
                />
                
                <input
                  name="wedding_date"
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  value={formData.wedding_date}
                  onChange={handleChange}
                />
              </>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all duration-200"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-rose-600 hover:text-rose-800 text-sm font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Sidebar Component
const Sidebar = ({ currentPage, setCurrentPage }) => {
  const { logout, user } = useAuth();
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'budget', label: 'Budget', icon: '💰' },
    { id: 'guests', label: 'Guests', icon: '👥' },
    { id: 'vendors', label: 'Vendors', icon: '🏪' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'venues', label: 'Venues', icon: '🏛️' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ];

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-20 border-b border-gray-200">
          <div className="text-center">
            <div className="text-2xl mb-1">💕</div>
            <h1 className="text-lg font-bold text-gray-900">Wedding Planner</h1>
          </div>
        </div>
        
        <div className="flex-1 px-4 py-6">
          <div className="mb-6">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Welcome back
            </div>
            <div className="text-sm font-medium text-gray-900">{user?.full_name}</div>
            {user?.partner_name && (
              <div className="text-sm text-gray-500">& {user.partner_name}</div>
            )}
          </div>
          
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg mr-3">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-lg mr-3">🚪</span>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

// Header Component
const Header = () => {
  const { user } = useAuth();
  
  const getWeddingCountdown = () => {
    if (!user?.wedding_date) return null;
    const wedding = new Date(user.wedding_date);
    const now = new Date();
    const diff = wedding - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days to go!` : 'Your special day is here!';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Good day, {user?.full_name}!</h1>
            <p className="text-gray-600">Let's make your wedding dreams come true</p>
          </div>
          {getWeddingCountdown() && (
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-3 rounded-full font-semibold">
              💕 {getWeddingCountdown()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  if (!analytics) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  const cards = [
    {
      title: 'Budget Overview',
      value: `$${analytics.budget.total_planned.toLocaleString()}`,
      subtitle: `$${analytics.budget.total_spent.toLocaleString()} spent`,
      icon: '💰',
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Guest RSVPs',
      value: `${analytics.guests.accepted}/${analytics.guests.total}`,
      subtitle: `${analytics.guests.pending} pending`,
      icon: '👥',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Tasks Complete',
      value: `${analytics.tasks.completed}/${analytics.tasks.total}`,
      subtitle: `${analytics.tasks.pending} remaining`,
      icon: '✅',
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Vendors Booked',
      value: `${analytics.vendors.booked}/${analytics.vendors.total}`,
      subtitle: 'vendors secured',
      icon: '🏪',
      color: 'from-orange-500 to-red-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className={`bg-gradient-to-r ${card.color} p-4`}>
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <p className="text-sm opacity-90">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-sm opacity-75">{card.subtitle}</p>
                </div>
                <div className="text-3xl">{card.icon}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center p-3 text-left bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg hover:from-rose-100 hover:to-pink-100 transition-colors">
              <span className="text-xl mr-3">💰</span>
              <span>Add Budget Item</span>
            </button>
            <button className="w-full flex items-center p-3 text-left bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-colors">
              <span className="text-xl mr-3">👥</span>
              <span>Invite Guests</span>
            </button>
            <button className="w-full flex items-center p-3 text-left bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-colors">
              <span className="text-xl mr-3">✅</span>
              <span>Add Task</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-lg mr-3">📅</span>
              <div>
                <p className="text-sm font-medium">Welcome to your wedding planner!</p>
                <p className="text-xs text-gray-500">Start by setting your budget</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder components for other pages
const BudgetManagement = () => {
  const [budgets, setBudgets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    planned_amount: '',
    vendor: '',
    notes: ''
  });
  const { token } = useAuth();

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const response = await axios.get(`${API}/budget`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBudgets(response.data);
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/budget`, {
        ...formData,
        planned_amount: parseFloat(formData.planned_amount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData({ category: '', planned_amount: '', vendor: '', notes: '' });
      setShowForm(false);
      fetchBudgets();
    } catch (error) {
      console.error('Failed to create budget:', error);
    }
  };

  const categories = [
    'Venue', 'Catering', 'Photography', 'Flowers', 'Music/DJ', 
    'Transportation', 'Attire', 'Rings', 'Decorations', 'Other'
  ];

  const totalPlanned = budgets.reduce((sum, b) => sum + b.planned_amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-gray-600">Track your wedding expenses and stay on budget</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-rose-600 hover:to-pink-700 transition-colors"
        >
          Add Budget Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">${totalPlanned.toLocaleString()}</div>
            <div className="text-gray-600">Total Planned</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">${totalSpent.toLocaleString()}</div>
            <div className="text-gray-600">Total Spent</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className={`text-3xl font-bold ${totalPlanned - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(totalPlanned - totalSpent).toLocaleString()}
            </div>
            <div className="text-gray-600">Remaining</div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Budget Item</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Planned Amount"
                value={formData.planned_amount}
                onChange={(e) => setFormData({...formData, planned_amount: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                required
              />
              <input
                type="text"
                placeholder="Vendor (optional)"
                value={formData.vendor}
                onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
              <textarea
                placeholder="Notes (optional)"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                rows="3"
              />
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-rose-600 hover:to-pink-700 transition-colors"
                >
                  Add Item
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Budget Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold">Category</th>
                  <th className="text-left py-3 px-4 font-semibold">Planned</th>
                  <th className="text-left py-3 px-4 font-semibold">Spent</th>
                  <th className="text-left py-3 px-4 font-semibold">Remaining</th>
                  <th className="text-left py-3 px-4 font-semibold">Vendor</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((budget) => (
                  <tr key={budget.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">{budget.category}</td>
                    <td className="py-3 px-4">${budget.planned_amount.toLocaleString()}</td>
                    <td className="py-3 px-4">${budget.spent_amount.toLocaleString()}</td>
                    <td className={`py-3 px-4 font-semibold ${budget.planned_amount - budget.spent_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${(budget.planned_amount - budget.spent_amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{budget.vendor || 'TBD'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {budgets.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No budget items yet. Add your first budget item to get started!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const GuestManagement = () => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">👥</div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Guest Management</h2>
    <p className="text-gray-600">Manage your guest list, RSVPs, and seating arrangements</p>
    <div className="mt-8 bg-white rounded-2xl shadow-md p-8 max-w-md mx-auto">
      <p className="text-gray-500">Coming soon - Full guest management system with RSVP tracking</p>
    </div>
  </div>
);

const VendorManagement = () => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">🏪</div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Management</h2>
    <p className="text-gray-600">Find and manage all your wedding vendors</p>
    <div className="mt-8 bg-white rounded-2xl shadow-md p-8 max-w-md mx-auto">
      <p className="text-gray-500">Coming soon - Vendor directory and contract management</p>
    </div>
  </div>
);

const TaskManagement = () => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">✅</div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Timeline & Tasks</h2>
    <p className="text-gray-600">Stay organized with your wedding planning timeline</p>
    <div className="mt-8 bg-white rounded-2xl shadow-md p-8 max-w-md mx-auto">
      <p className="text-gray-500">Coming soon - Wedding timeline and task management</p>
    </div>
  </div>
);

const VenueSelection = () => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">🏛️</div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Venue Selection</h2>
    <p className="text-gray-600">Compare and book your perfect wedding venues</p>
    <div className="mt-8 bg-white rounded-2xl shadow-md p-8 max-w-md mx-auto">
      <p className="text-gray-500">Coming soon - Venue comparison and booking tools</p>
    </div>
  </div>
);

const Analytics = () => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">📊</div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
    <p className="text-gray-600">Comprehensive insights into your wedding planning progress</p>
    <div className="mt-8 bg-white rounded-2xl shadow-md p-8 max-w-md mx-auto">
      <p className="text-gray-500">Coming soon - Advanced analytics and reporting</p>
    </div>
  </div>
);

export default App;
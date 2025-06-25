import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { format, parseISO, differenceInDays } from 'date-fns';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Users, 
  DollarSign, 
  Calendar,
  Star,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

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
    const days = differenceInDays(wedding, now);
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

// Budget Management Component
const BudgetManagement = () => {
  const [budgets, setBudgets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
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
      const payload = {
        ...formData,
        planned_amount: parseFloat(formData.planned_amount)
      };

      if (editingBudget) {
        await axios.put(`${API}/budget/${editingBudget.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/budget`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setFormData({ category: '', planned_amount: '', vendor: '', notes: '' });
      setShowForm(false);
      setEditingBudget(null);
      fetchBudgets();
    } catch (error) {
      console.error('Failed to save budget:', error);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      planned_amount: budget.planned_amount.toString(),
      vendor: budget.vendor || '',
      notes: budget.notes || ''
    });
    setShowForm(true);
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
          onClick={() => {
            setEditingBudget(null);
            setFormData({ category: '', planned_amount: '', vendor: '', notes: '' });
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-rose-600 hover:to-pink-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
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
            <h3 className="text-lg font-semibold mb-4">
              {editingBudget ? 'Edit Budget Item' : 'Add Budget Item'}
            </h3>
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
                  {editingBudget ? 'Update Item' : 'Add Item'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingBudget(null);
                    setFormData({ category: '', planned_amount: '', vendor: '', notes: '' });
                  }}
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
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
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
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleEdit(budget)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
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

// Guest Management Component
const GuestManagement = () => {
  const [guests, setGuests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rsvp_status: 'pending',
    dietary_restrictions: '',
    plus_one: false,
    group: ''
  });
  const { token } = useAuth();

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      const response = await axios.get(`${API}/guests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGuests(response.data);
    } catch (error) {
      console.error('Failed to fetch guests:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        email: formData.email || null,
        phone: formData.phone || null,
        dietary_restrictions: formData.dietary_restrictions || null,
        group: formData.group || null
      };

      if (editingGuest) {
        await axios.put(`${API}/guests/${editingGuest.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/guests`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        rsvp_status: 'pending',
        dietary_restrictions: '',
        plus_one: false,
        group: ''
      });
      setShowForm(false);
      setEditingGuest(null);
      fetchGuests();
    } catch (error) {
      console.error('Failed to save guest:', error);
      alert('Failed to save guest. Please try again.');
    }
  };

  const handleEdit = (guest) => {
    setEditingGuest(guest);
    setFormData({
      name: guest.name,
      email: guest.email || '',
      phone: guest.phone || '',
      rsvp_status: guest.rsvp_status,
      dietary_restrictions: guest.dietary_restrictions || '',
      plus_one: guest.plus_one,
      group: guest.group || ''
    });
    setShowForm(true);
  };

  const groups = ['Family', 'Friends', 'Work', 'Bride\'s Side', 'Groom\'s Side', 'Other'];
  const rsvpStatuses = ['pending', 'accepted', 'declined'];

  const guestStats = {
    total: guests.length,
    accepted: guests.filter(g => g.rsvp_status === 'accepted').length,
    declined: guests.filter(g => g.rsvp_status === 'declined').length,
    pending: guests.filter(g => g.rsvp_status === 'pending').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guest Management</h1>
          <p className="text-gray-600">Manage your guest list and track RSVPs</p>
        </div>
        <button
          onClick={() => {
            setEditingGuest(null);
            setFormData({
              name: '',
              email: '',
              phone: '',
              rsvp_status: 'pending',
              dietary_restrictions: '',
              plus_one: false,
              group: ''
            });
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-rose-600 hover:to-pink-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Guest
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{guestStats.total}</div>
            <div className="text-gray-600">Total Guests</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{guestStats.accepted}</div>
            <div className="text-gray-600">Accepted</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{guestStats.declined}</div>
            <div className="text-gray-600">Declined</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{guestStats.pending}</div>
            <div className="text-gray-600">Pending</div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingGuest ? 'Edit Guest' : 'Add Guest'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                required
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
              <select
                value={formData.rsvp_status}
                onChange={(e) => setFormData({...formData, rsvp_status: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              >
                {rsvpStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={formData.group}
                onChange={(e) => setFormData({...formData, group: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              >
                <option value="">Select Group</option>
                {groups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
              <textarea
                placeholder="Dietary Restrictions (optional)"
                value={formData.dietary_restrictions}
                onChange={(e) => setFormData({...formData, dietary_restrictions: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                rows="2"
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="plus_one"
                  checked={formData.plus_one}
                  onChange={(e) => setFormData({...formData, plus_one: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="plus_one" className="text-sm text-gray-700">
                  Plus One Allowed
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-rose-600 hover:to-pink-700 transition-colors"
                >
                  {editingGuest ? 'Update Guest' : 'Add Guest'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingGuest(null);
                  }}
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
          <h3 className="text-lg font-semibold mb-4">Guest List</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Contact</th>
                  <th className="text-left py-3 px-4 font-semibold">RSVP Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Group</th>
                  <th className="text-left py-3 px-4 font-semibold">Plus One</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => (
                  <tr key={guest.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">{guest.name}</td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {guest.email && <div>{guest.email}</div>}
                        {guest.phone && <div>{guest.phone}</div>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        guest.rsvp_status === 'accepted' ? 'bg-green-100 text-green-800' :
                        guest.rsvp_status === 'declined' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {guest.rsvp_status.charAt(0).toUpperCase() + guest.rsvp_status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{guest.group || 'N/A'}</td>
                    <td className="py-3 px-4">
                      {guest.plus_one ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleEdit(guest)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {guests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No guests added yet. Add your first guest to get started!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Vendor Management Component
const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    price_quote: '',
    rating: '',
    status: 'researching',
    notes: ''
  });
  const { token } = useAuth();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await axios.get(`${API}/vendors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors(response.data);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price_quote: formData.price_quote ? parseFloat(formData.price_quote) : null,
        rating: formData.rating ? parseInt(formData.rating) : null
      };

      if (editingVendor) {
        await axios.put(`${API}/vendors/${editingVendor.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/vendors`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setFormData({
        name: '',
        category: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        price_quote: '',
        rating: '',
        status: 'researching',
        notes: ''
      });
      setShowForm(false);
      setEditingVendor(null);
      fetchVendors();
    } catch (error) {
      console.error('Failed to save vendor:', error);
    }
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      category: vendor.category,
      contact_person: vendor.contact_person || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      price_quote: vendor.price_quote ? vendor.price_quote.toString() : '',
      rating: vendor.rating ? vendor.rating.toString() : '',
      status: vendor.status,
      notes: vendor.notes || ''
    });
    setShowForm(true);
  };

  const categories = [
    'Photographer', 'Videographer', 'Florist', 'Caterer', 'DJ/Band', 
    'Wedding Planner', 'Transportation', 'Bakery', 'Officiant', 'Other'
  ];

  const statuses = ['researching', 'contacted', 'quoted', 'booked'];

  const vendorStats = {
    total: vendors.length,
    booked: vendors.filter(v => v.status === 'booked').length,
    quoted: vendors.filter(v => v.status === 'quoted').length,
    contacted: vendors.filter(v => v.status === 'contacted').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600">Find and manage your wedding vendors</p>
        </div>
        <button
          onClick={() => {
            setEditingVendor(null);
            setFormData({
              name: '',
              category: '',
              contact_person: '',
              email: '',
              phone: '',
              address: '',
              price_quote: '',
              rating: '',
              status: 'researching',
              notes: ''
            });
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-rose-600 hover:to-pink-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{vendorStats.total}</div>
            <div className="text-gray-600">Total Vendors</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{vendorStats.booked}</div>
            <div className="text-gray-600">Booked</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{vendorStats.quoted}</div>
            <div className="text-gray-600">Quoted</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{vendorStats.contacted}</div>
            <div className="text-gray-600">Contacted</div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingVendor ? 'Edit Vendor' : 'Add Vendor'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Vendor Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  required
                />
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
                  type="text"
                  placeholder="Contact Person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Price Quote"
                  value={formData.price_quote}
                  onChange={(e) => setFormData({...formData, price_quote: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({...formData, rating: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                >
                  <option value="">Rating (1-5)</option>
                  {[1,2,3,4,5].map(num => (
                    <option key={num} value={num}>{num} Star{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
              <textarea
                placeholder="Notes"
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
                  {editingVendor ? 'Update Vendor' : 'Add Vendor'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingVendor(null);
                  }}
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
          <h3 className="text-lg font-semibold mb-4">Vendor Directory</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{vendor.name}</h4>
                    <p className="text-gray-600 text-sm">{vendor.category}</p>
                  </div>
                  <button
                    onClick={() => handleEdit(vendor)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                
                {vendor.rating && (
                  <div className="flex items-center mb-2">
                    {[...Array(vendor.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                )}
                
                <div className="space-y-2 text-sm">
                  {vendor.contact_person && (
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {vendor.contact_person}
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {vendor.phone}
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      {vendor.email}
                    </div>
                  )}
                  {vendor.address && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {vendor.address}
                    </div>
                  )}
                  {vendor.price_quote && (
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      ${vendor.price_quote.toLocaleString()}
                    </div>
                  )}
                </div>
                
                <div className="mt-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    vendor.status === 'booked' ? 'bg-green-100 text-green-800' :
                    vendor.status === 'quoted' ? 'bg-yellow-100 text-yellow-800' :
                    vendor.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {vendors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No vendors added yet. Add your first vendor to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Task Management Component
const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    due_date: '',
    priority: 'medium',
    assigned_to: '',
    notes: ''
  });
  const { token } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        due_date: formData.due_date || null
      };

      if (editingTask) {
        await axios.put(`${API}/tasks/${editingTask.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/tasks`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setFormData({
        title: '',
        description: '',
        category: '',
        due_date: '',
        priority: 'medium',
        assigned_to: '',
        notes: ''
      });
      setShowForm(false);
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      category: task.category,
      due_date: task.due_date ? format(parseISO(task.due_date), 'yyyy-MM-dd') : '',
      priority: task.priority,
      assigned_to: task.assigned_to || '',
      notes: task.notes || ''
    });
    setShowForm(true);
  };

  const toggleTaskComplete = async (task) => {
    try {
      await axios.put(`${API}/tasks/${task.id}`, {
        ...task,
        completed: !task.completed
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const categories = [
    'Planning', 'Venue', 'Catering', 'Photography', 'Flowers', 'Music', 
    'Invitations', 'Attire', 'Transportation', 'Legal', 'Other'
  ];

  const priorities = ['low', 'medium', 'high'];

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    overdue: tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) < new Date()).length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timeline & Tasks</h1>
          <p className="text-gray-600">Stay on track with your wedding planning timeline</p>
        </div>
        <button
          onClick={() => {
            setEditingTask(null);
            setFormData({
              title: '',
              description: '',
              category: '',
              due_date: '',
              priority: 'medium',
              assigned_to: '',
              notes: ''
            });
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-rose-600 hover:to-pink-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{taskStats.total}</div>
            <div className="text-gray-600">Total Tasks</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{taskStats.completed}</div>
            <div className="text-gray-600">Completed</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{taskStats.pending}</div>
            <div className="text-gray-600">Pending</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{taskStats.overdue}</div>
            <div className="text-gray-600">Overdue</div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingTask ? 'Edit Task' : 'Add Task'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Task Title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                >
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  placeholder="Due Date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
                <input
                  type="text"
                  placeholder="Assigned To"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                rows="3"
              />
              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                rows="2"
              />
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-rose-600 hover:to-pink-700 transition-colors"
                >
                  {editingTask ? 'Update Task' : 'Add Task'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTask(null);
                  }}
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
          <h3 className="text-lg font-semibold mb-4">Task Timeline</h3>
          <div className="space-y-4">
            {tasks
              .sort((a, b) => {
                if (a.completed !== b.completed) {
                  return a.completed ? 1 : -1;
                }
                if (a.due_date && b.due_date) {
                  return new Date(a.due_date) - new Date(b.due_date);
                }
                return 0;
              })
              .map((task) => (
                <div key={task.id} className={`border rounded-lg p-4 ${task.completed ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <button
                        onClick={() => toggleTaskComplete(task)}
                        className={`mt-1 ${task.completed ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {task.category}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          {task.due_date && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {format(parseISO(task.due_date), 'MMM dd, yyyy')}
                              {!task.completed && new Date(task.due_date) < new Date() && (
                                <span className="ml-2 text-red-600 font-medium">(Overdue)</span>
                              )}
                            </div>
                          )}
                          {task.assigned_to && (
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {task.assigned_to}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(task)}
                      className="text-blue-600 hover:text-blue-800 ml-2"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No tasks added yet. Add your first task to get started with your wedding timeline!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Venue Selection Component
const VenueSelection = () => {
  const [venues, setVenues] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    venue_type: '',
    address: '',
    capacity: '',
    price: '',
    rating: '',
    status: 'considering',
    contact_person: '',
    phone: '',
    email: '',
    notes: ''
  });
  const { token } = useAuth();

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const response = await axios.get(`${API}/venues`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVenues(response.data);
    } catch (error) {
      console.error('Failed to fetch venues:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        price: formData.price ? parseFloat(formData.price) : null,
        rating: formData.rating ? parseInt(formData.rating) : null
      };

      if (editingVenue) {
        await axios.put(`${API}/venues/${editingVenue.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/venues`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setFormData({
        name: '',
        venue_type: '',
        address: '',
        capacity: '',
        price: '',
        rating: '',
        status: 'considering',
        contact_person: '',
        phone: '',
        email: '',
        notes: ''
      });
      setShowForm(false);
      setEditingVenue(null);
      fetchVenues();
    } catch (error) {
      console.error('Failed to save venue:', error);
    }
  };

  const handleEdit = (venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      venue_type: venue.venue_type,
      address: venue.address,
      capacity: venue.capacity ? venue.capacity.toString() : '',
      price: venue.price ? venue.price.toString() : '',
      rating: venue.rating ? venue.rating.toString() : '',
      status: venue.status,
      contact_person: venue.contact_person || '',
      phone: venue.phone || '',
      email: venue.email || '',
      notes: venue.notes || ''
    });
    setShowForm(true);
  };

  const venueTypes = ['Church', 'Reception Hall', 'Outdoor', 'Beach', 'Garden', 'Historic', 'Hotel', 'Restaurant', 'Other'];
  const statuses = ['considering', 'visited', 'booked'];

  const venueStats = {
    total: venues.length,
    booked: venues.filter(v => v.status === 'booked').length,
    visited: venues.filter(v => v.status === 'visited').length,
    considering: venues.filter(v => v.status === 'considering').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Venue Selection</h1>
          <p className="text-gray-600">Compare and book your perfect wedding venues</p>
        </div>
        <button
          onClick={() => {
            setEditingVenue(null);
            setFormData({
              name: '',
              venue_type: '',
              address: '',
              capacity: '',
              price: '',
              rating: '',
              status: 'considering',
              contact_person: '',
              phone: '',
              email: '',
              notes: ''
            });
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-rose-600 hover:to-pink-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Venue
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{venueStats.total}</div>
            <div className="text-gray-600">Total Venues</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{venueStats.booked}</div>
            <div className="text-gray-600">Booked</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{venueStats.visited}</div>
            <div className="text-gray-600">Visited</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{venueStats.considering}</div>
            <div className="text-gray-600">Considering</div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingVenue ? 'Edit Venue' : 'Add Venue'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Venue Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  required
                />
                <select
                  value={formData.venue_type}
                  onChange={(e) => setFormData({...formData, venue_type: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  required
                >
                  <option value="">Select Type</option>
                  {venueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="number"
                  placeholder="Capacity"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({...formData, rating: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                >
                  <option value="">Rating (1-5)</option>
                  {[1,2,3,4,5].map(num => (
                    <option key={num} value={num}>{num} Star{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Contact Person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
              <textarea
                placeholder="Notes"
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
                  {editingVenue ? 'Update Venue' : 'Add Venue'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingVenue(null);
                  }}
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
          <h3 className="text-lg font-semibold mb-4">Venue Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <div key={venue.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{venue.name}</h4>
                    <p className="text-gray-600 text-sm">{venue.venue_type}</p>
                  </div>
                  <button
                    onClick={() => handleEdit(venue)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                
                {venue.rating && (
                  <div className="flex items-center mb-2">
                    {[...Array(venue.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {venue.address}
                  </div>
                  {venue.capacity && (
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      Capacity: {venue.capacity} guests
                    </div>
                  )}
                  {venue.price && (
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      ${venue.price.toLocaleString()}
                    </div>
                  )}
                  {venue.contact_person && (
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      Contact: {venue.contact_person}
                    </div>
                  )}
                  {venue.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {venue.phone}
                    </div>
                  )}
                </div>
                
                <div className="mt-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    venue.status === 'booked' ? 'bg-green-100 text-green-800' :
                    venue.status === 'visited' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {venue.status.charAt(0).toUpperCase() + venue.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {venues.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No venues added yet. Add your first venue to start comparing options!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Analytics Component
const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [guests, setGuests] = useState([]);
  const [tasks, setTasks] = useState([]);
  const { token } = useAuth();

  useEffect(() => {
    fetchAnalytics();
    fetchAllData();
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

  const fetchAllData = async () => {
    try {
      const [budgetRes, guestRes, taskRes] = await Promise.all([
        axios.get(`${API}/budget`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/guests`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/tasks`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setBudgets(budgetRes.data);
      setGuests(guestRes.data);
      setTasks(taskRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  if (!analytics) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  // Budget Chart Data
  const budgetChartData = {
    labels: budgets.map(b => b.category),
    datasets: [
      {
        label: 'Planned Amount ($)',
        data: budgets.map(b => b.planned_amount),
        backgroundColor: 'rgba(236, 72, 153, 0.6)',
        borderColor: 'rgba(236, 72, 153, 1)',
        borderWidth: 1,
      },
      {
        label: 'Spent Amount ($)',
        data: budgets.map(b => b.spent_amount),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  // RSVP Pie Chart Data
  const rsvpChartData = {
    labels: ['Accepted', 'Declined', 'Pending'],
    datasets: [
      {
        data: [analytics.guests.accepted, analytics.guests.declined, analytics.guests.pending],
        backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // Task Progress Line Chart Data
  const taskProgressData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Tasks Completed',
        data: [2, 5, 8, analytics.tasks.completed],
        borderColor: 'rgba(236, 72, 153, 1)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive insights into your wedding planning progress</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Budget</p>
              <p className="text-2xl font-bold">${analytics.budget.total_planned.toLocaleString()}</p>
              <p className="text-sm opacity-75">{((analytics.budget.total_spent / analytics.budget.total_planned) * 100).toFixed(1)}% used</p>
            </div>
            <DollarSign className="w-8 h-8 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Guest Response</p>
              <p className="text-2xl font-bold">{((analytics.guests.accepted / analytics.guests.total) * 100).toFixed(1)}%</p>
              <p className="text-sm opacity-75">{analytics.guests.accepted}/{analytics.guests.total} confirmed</p>
            </div>
            <Users className="w-8 h-8 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Task Progress</p>
              <p className="text-2xl font-bold">{((analytics.tasks.completed / analytics.tasks.total) * 100).toFixed(1)}%</p>
              <p className="text-sm opacity-75">{analytics.tasks.completed}/{analytics.tasks.total} completed</p>
            </div>
            <CheckCircle className="w-8 h-8 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Planning Status</p>
              <p className="text-2xl font-bold">
                {analytics.vendors.booked > 0 && analytics.tasks.completed > 0 ? 'On Track' : 'Getting Started'}
              </p>
              <p className="text-sm opacity-75">{analytics.vendors.booked} vendors booked</p>
            </div>
            <Clock className="w-8 h-8 opacity-80" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Budget Breakdown</h3>
          {budgets.length > 0 ? (
            <Bar data={budgetChartData} options={chartOptions} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              Add budget items to see budget analytics
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">RSVP Status</h3>
          {guests.length > 0 ? (
            <Doughnut data={rsvpChartData} options={chartOptions} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              Add guests to see RSVP analytics
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Task Progress Over Time</h3>
        {tasks.length > 0 ? (
          <Line data={taskProgressData} options={chartOptions} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            Add tasks to see progress analytics
          </div>
        )}
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Budget Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Planned:</span>
              <span className="font-semibold">${analytics.budget.total_planned.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Spent:</span>
              <span className="font-semibold">${analytics.budget.total_spent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Remaining:</span>
              <span className={`font-semibold ${analytics.budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${analytics.budget.remaining.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Budget Categories:</span>
              <span className="font-semibold">{analytics.budget.categories}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Planning Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Guests:</span>
              <span className="font-semibold">{analytics.guests.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vendors Contacted:</span>
              <span className="font-semibold">{analytics.vendors.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tasks Created:</span>
              <span className="font-semibold">{analytics.tasks.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completion Rate:</span>
              <span className="font-semibold">
                {analytics.tasks.total > 0 ? 
                  `${((analytics.tasks.completed / analytics.tasks.total) * 100).toFixed(1)}%` : 
                  '0%'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
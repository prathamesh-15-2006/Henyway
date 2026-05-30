import { useState, useEffect } from 'react';
import { Package, ShoppingBag, TrendingUp, Plus, Edit2, Trash2, X, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createProduct, getAllProducts, deleteProduct, updateProduct } from '../../Services/Product-api';
import { getAllAdminOrders, updateOrderStatus, getOrder } from '../../Services/Order-api';
import { getAllIssues, resolveIssue, Issue } from '../../Services/OrderIssues-api';
import { Box, Button, TextField, Typography, Modal, Alert, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

type Tab = 'overview' | 'products' | 'orders' | 'issues';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  pieces: string;
  images: string[];
  description?: string;
  includes?: string;
  idealFor?: string;
}

interface ApiProduct {
  _id: string;
  [key: string]: any;
}

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    price: '',
    pieces: '',
    includes: '',
    idealFor: '',
    description: '',
    image: '',
    category: ''
  });

  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    pieces: '',
    includes: '',
    idealFor: '',
    description: '',
    image: '',
    category: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [orderStatusValues, setOrderStatusValues] = useState<Record<string, string>>({});
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [issuesError, setIssuesError] = useState('');
  const [isIssueDetailModalOpen, setIsIssueDetailModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [resolveForm, setResolveForm] = useState({
    deliveryStatus: ''
  });
  const [resolvingIssue, setResolvingIssue] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);

  // Filter orders based on selected period
  const getFilteredOrders = () => {
    const now = new Date();
    const days = selectedPeriod === 'weekly' ? 7 : selectedPeriod === 'monthly' ? 30 : 365;
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return orders.filter(order => new Date(order.createdAt) >= cutoffDate);
  };

  const filteredOrders = getFilteredOrders();

  // Prepare chart data
  const statusData = [
    { name: 'PLACED', value: filteredOrders.filter(o => o.orderStatus === 'PLACED').length, color: '#fbbf24' },
    { name: 'SHIPPED', value: filteredOrders.filter(o => o.orderStatus === 'SHIPPED').length, color: '#8b5cf6' },
    { name: 'DELIVERED', value: filteredOrders.filter(o => o.orderStatus === 'DELIVERED').length, color: '#10b981' },
    { name: 'CANCELLED', value: filteredOrders.filter(o => o.orderStatus === 'CANCELLED').length, color: '#ef4444' },
  ];

  const revenueData = filteredOrders.reduce((acc: any[], order) => {
    const date = new Date(order.createdAt).toLocaleDateString('en-IN');
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.revenue += order.totalAmount || order.total || 0;
    } else {
      acc.push({ date, revenue: order.totalAmount || order.total || 0 });
    }
    return acc;
  }, []).slice(-7); // Last 7 days

  const progressData = filteredOrders.reduce((acc: any[], order) => {
    const date = new Date(order.createdAt).toLocaleDateString('en-IN');
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.orders += 1;
    } else {
      acc.push({ date, orders: 1 });
    }
    return acc;
  }, []).slice(-7); // Last 7 days

  const stats = [
    {
      label: 'Total Products',
      value: products.length,
      icon: Package,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Total Orders',
      value: orders.length,
      icon: ShoppingBag,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Revenue',
      value: `₹${orders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-amber-100 text-amber-600',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'shipped':
        return 'bg-purple-100 text-purple-700';
      case 'paid':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-700';
      case 'created':
        return 'bg-gray-100 text-gray-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'refunded':
        return 'bg-orange-100 text-orange-700';
      case 'expired':
        return 'bg-slate-100 text-slate-700';
      case 'delayed':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Removed mapOrderStatus function to show actual backend statuses

  const getAvailableStatuses = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PLACED':
        return [
          { value: 'SHIPPED', label: 'Mark as Shipped' },
          { value: 'CANCELLED', label: 'Cancel Order' }
        ];
      case 'SHIPPED':
        return [
          { value: 'DELIVERED', label: 'Mark as Delivered' },
          { value: 'DELAYED', label: 'Mark as Delayed' }
        ];
      case 'DELAYED':
        return [
          { value: 'DELIVERED', label: 'Mark as Delivered' }
        ];
      default:
        return [];
    }
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await updateOrderStatus(orderId, newStatus, token);

        // Update local state based on new status
        let updatedOrder = {};
        switch (newStatus) {
          case 'SHIPPED':
            updatedOrder = { orderStatus: 'SHIPPED', deliveryStatus: 'IN_TRANSIT' };
            break;
          case 'CANCELLED':
            updatedOrder = { orderStatus: 'CANCELLED', deliveryStatus: 'CANCELLED' };
            break;
          case 'DELIVERED':
            updatedOrder = { orderStatus: 'DELIVERED', deliveryStatus: 'DELIVERED' };
            break;
          case 'DELAYED':
            updatedOrder = { orderStatus: 'DELAYED', deliveryStatus: 'DELAYED' };
            break;
          default:
            break;
        }

        setOrders(prevOrders =>
          prevOrders.map(o =>
            o._id === orderId ? { ...o, ...updatedOrder, statusHistory: [...(o.statusHistory || []), { status: newStatus, timestamp: new Date().toISOString() }] } : o
          )
        );

        // Refresh from server
        const response = await getAllAdminOrders(token);
        const data = response.data;
        const allOrders = Array.isArray(data?.orders) ? data.orders : [];
        setOrders(allOrders);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to update order status');
    }
  };

  const handleCreateProduct = async () => {
    setCreateError('');
    setCreateSuccess('');

    if (!createForm.name || !createForm.price || !createForm.category || !createForm.image) {
      setCreateError('Name, price, category, and image are required');
      return;
    }

    setCreateLoading(true);
    try {
      await createProduct(createForm);
      setCreateSuccess('Product created successfully!');
      // Refresh the products list
      const response = await getAllProducts();
      const productsData = response.data || [];
      const mappedProducts = productsData.map((item: ApiProduct) => ({
        id: item._id,
        name: item.name,
        price: parseFloat(item.price.replace('₹', '').replace('/kg', '')),
        category: item.category,
        pieces: item.pieces,
        images: [item.image],
        description: item.description,
        includes: item.includes,
        idealFor: item.idealFor,
      }));
      setProducts(mappedProducts);
      setCreateForm({
        name: '',
        price: '',
        pieces: '',
        includes: '',
        idealFor: '',
        description: '',
        image: '',
        category: ''
      });
      setIsCreateModalOpen(false);
    } catch (error: any) {
      setCreateError(error.message || 'Failed to create product');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
    setCreateError('');
    setCreateSuccess('');
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateForm({
      name: '',
      price: '',
      pieces: '',
      includes: '',
      idealFor: '',
      description: '',
      image: '',
      category: ''
    });
    setCreateError('');
    setCreateSuccess('');
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete.id);
      // Refresh the products list
      const response = await getAllProducts();
      const productsData = response.data || [];
      const mappedProducts = productsData.map((item: ApiProduct) => ({
        id: item._id,
        name: item.name,
        price: item.price ? parseFloat(item.price.toString().replace('₹', '').replace('/kg', '')) : 0,
        category: item.category,
        pieces: item.pieces,
        images: [item.image],
        description: item.description,
        includes: item.includes,
        idealFor: item.idealFor,
      }));
      setProducts(mappedProducts);
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error: any) {
      alert(error.message || 'Failed to delete product');
    }
  };

  const cancelDeleteProduct = () => {
    setIsDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      price: `₹${product.price.toLocaleString()}`,
      pieces: product.pieces || '',
      includes: product.includes || '',
      idealFor: product.idealFor || '',
      description: product.description || '',
      image: product.images[0] || '',
      category: product.category,
    });
    setIsEditModalOpen(true);
    setEditError('');
    setEditSuccess('');
  };

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingProduct(null);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    setEditError('');
    setEditSuccess('');

    // Validate required fields
    if (!editForm.name || !editForm.price || !editForm.category) {
      setEditError('Name, price, and category are required');
      return;
    }

    setEditLoading(true);
    try {
      // Clean the price by removing ₹ symbol and converting to number
      const cleanForm = {
        ...editForm,
        price: editForm.price.toString().replace('₹', '').replace('/kg', '').trim()
      };
      await updateProduct(editingProduct.id, cleanForm);
      setEditSuccess('Product updated successfully!');
      setIsEditModalOpen(false);
      // Refresh the products list
      const response = await getAllProducts();
      const productsData = response.data || [];
      const mappedProducts = productsData.map((item: ApiProduct) => ({
        id: item._id,
        name: item.name,
        price: item.price ? parseFloat(item.price.toString().replace('₹', '').replace('/kg', '')) : 0,
        category: item.category,
        pieces: item.pieces,
        images: [item.image],
        description: item.description,
        includes: item.includes,
        idealFor: item.idealFor,
      }));
      setProducts(mappedProducts);
    } catch (error: any) {
      setEditError(error.message || 'Failed to update product');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingProduct(null);
    setEditForm({
      name: '',
      price: '',
      pieces: '',
      includes: '',
      idealFor: '',
      description: '',
      image: '',
      category: ''
    });
    setEditError('');
    setEditSuccess('');
  };

  const handleOpenIssueDetailModal = async (issue: Issue) => {
    setSelectedIssue(issue);
    setOrderDetailsLoading(true);
    setIsIssueDetailModalOpen(true);

    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await getOrder(issue.orderId, token);
        setOrderDetails(response.data || response);
      }
    } catch (error: any) {
      console.error('Failed to fetch order details:', error);
      setOrderDetails(null);
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  const handleResolveIssue = async () => {
    if (!selectedIssue || !selectedIssue.id || selectedIssue.id === 'undefined') {
      alert('Invalid issue selected. Please try again.');
      return;
    }

    setResolvingIssue(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await resolveIssue(selectedIssue.id, resolveForm, token);
        if (response.success) {
          // Update the issue status in the local state
          setIssues(prevIssues =>
            prevIssues.map(issue =>
              issue.id === selectedIssue.id ? { ...issue, status: 'RESOLVED' } : issue
            )
          );
          setIsIssueDetailModalOpen(false);
          setSelectedIssue(null);
          setOrderDetails(null);
        } else {
          alert(response.message || 'Failed to resolve issue');
        }
      }
    } catch (error: any) {
      alert(error.message || 'Failed to resolve issue');
    } finally {
      setResolvingIssue(false);
    }
  };

  const handleCloseIssueDetailModal = () => {
    setIsIssueDetailModalOpen(false);
    setSelectedIssue(null);
    setOrderDetails(null);
    setResolveForm({ deliveryStatus: '' });
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getAllProducts();
        const productsData = response.data || [];
        const mappedProducts = productsData.map((item: ApiProduct) => ({
          id: item._id,
          name: item.name,
          price: item.price ? parseFloat(item.price.toString().replace('₹', '').replace('/kg', '')) : 0,
          category: item.category,
          pieces: item.pieces,
          images: [item.image], // Use the full URL from the API
          description: item.description,
          includes: item.includes,
          idealFor: item.idealFor,
        }));
        setProducts(mappedProducts);
      } catch (error: any) {
        setProductsError(error.message || 'Failed to fetch products');
      } finally {
        setProductsLoading(false);
      }
    };

    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await getAllAdminOrders(token);
          const data = response.data;
          const allOrders = Array.isArray(data?.orders) ? data.orders : [];
          setOrders(allOrders);
        }
      } catch (error: any) {
        setOrdersError(error.message || 'Failed to fetch orders');
        setOrders([]);
      } finally {
        setOrdersLoading(false);
      }
    };

    const fetchIssues = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await getAllIssues(token);
          if (response.success) {
            setIssues(response.data);
          }
        }
      } catch (error: any) {
        setIssuesError(error.message || 'Failed to fetch issues');
        setIssues([]);
      } finally {
        setIssuesLoading(false);
      }
    };

    fetchProducts();
    fetchOrders();
    fetchIssues();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your store products and orders</p>
        </div>

        <div className="bg-white rounded-xl shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'products', label: 'Products', icon: Package },
                { id: 'orders', label: 'Orders', icon: ShoppingBag },
                { id: 'issues', label: 'Order Issues', icon: Eye },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-amber-600 text-amber-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-end mb-4">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Period</InputLabel>
                <Select
                  value={selectedPeriod}
                  label="Period"
                  onChange={(e) => setSelectedPeriod(e.target.value as 'weekly' | 'monthly' | 'yearly')}
                >
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Status Distribution ({selectedPeriod})</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Trend (Last 7 Days)</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fill="#fef3c7" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Progress (Last 7 Days)</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="orders" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Status Breakdown</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'products' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-xl shadow-md">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Products Management</h2>
                <button onClick={handleOpenCreateModal} className="flex items-center space-x-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors">
                  <Plus className="w-5 h-5" />
                  <span>Add Product</span>
                </button>
              </div>

              <div className="p-6">
                {productsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading products...</p>
                  </div>
                ) : productsError ? (
                  <div className="text-center py-8">
                    <div className="text-red-600 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <p className="text-red-600 font-semibold">Error loading products</p>
                    <p className="text-gray-600 mt-2">{productsError}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-4 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No products found</p>
                    <p className="text-sm text-gray-500 mt-2">Start by adding your first product</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pieces
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">{product.category}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-gray-900">₹{product.price.toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">
                                {product.pieces}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button onClick={() => handleViewProduct(product)} className="text-blue-600 hover:text-blue-900 mr-3 inline-block" title="View Product">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleEditProduct(product)} className="text-amber-600 hover:text-amber-900 mr-3" title="Edit Product">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteProduct(product)} className="text-red-600 hover:text-red-900" title="Delete Product">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}



        {activeTab === 'orders' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Orders Management</h2>

              <div className="space-y-4">
                {orders.map((order) => {
                  return (
                    <div key={order._id || order.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                        <div className="flex items-center">
                          <h3 className="font-semibold text-gray-900 mb-1">Order #{order._id || order.id}</h3>
                          <Link to={`/order/${order.orderId || order._id}`} className="ml-2">
                            <Eye className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                          </Link>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2 mt-2 md:mt-0">
                          <div className="flex space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.orderStatus)}`}>
                              Order: {order.orderStatus}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.paymentStatus)}`}>
                              Payment: {order.paymentStatus}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.deliveryStatus)}`}>
                              Delivery: {order.deliveryStatus}
                            </span>
                          </div>
                          {getAvailableStatuses(order.orderStatus).length > 0 && (
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                              <InputLabel>Update Status</InputLabel>
                              <Select
                                value={orderStatusValues[order._id] || ""}
                                label="Update Status"
                                onChange={async (e) => {
                                  const newStatus = e.target.value;
                                  if (!newStatus) return;

                                  setOrderStatusValues(prev => ({ ...prev, [order._id]: newStatus }));
                                  try {
                                    await handleOrderStatusChange(order._id, newStatus);
                                  } finally {
                                    setOrderStatusValues(prev => ({ ...prev, [order._id]: "" }));
                                  }
                                }}
                              >
                                {getAvailableStatuses(order.orderStatus).map((status) => (
                                  <MenuItem key={status.value} value={status.value}>
                                    {status.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        </div>
                      </div>



                      <div className="border-t pt-3 flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Amount</span>
                        <span className="text-xl font-bold text-gray-900">₹{(order.totalAmount || order.total || 0).toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Last updated: {new Date(order.updatedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'issues' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Issues Management</h2>

              <div className="space-y-4">
                {issuesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading issues...</p>
                  </div>
                ) : issuesError ? (
                  <div className="text-center py-8">
                    <div className="text-red-600 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <p className="text-red-600 font-semibold">Error loading issues</p>
                    <p className="text-gray-600 mt-2">{issuesError}</p>
                  </div>
                ) : issues.length === 0 ? (
                  <div className="text-center py-8">
                    <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No issues found</p>
                    <p className="text-sm text-gray-500 mt-2">All orders are running smoothly</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Issue Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {issues.map((issue) => (
                          <tr key={issue.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">{issue.orderId}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">Customer</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">{issue.issueType}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                issue.status === 'OPEN' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {issue.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">
                                {new Date(issue.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleOpenIssueDetailModal(issue)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Issue"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Create Product Modal */}
        <Modal
          open={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          aria-labelledby="create-product-modal"
          aria-describedby="create-product-modal-description"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div className="flex items-center justify-between mb-4">
              <Typography variant="h6" component="h2">
                Create New Product
              </Typography>
              <Button onClick={handleCloseCreateModal}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {createError && (
              <Alert severity="error" className="mb-4">
                {createError}
              </Alert>
            )}

            {createSuccess && (
              <Alert severity="success" className="mb-4">
                {createSuccess}
              </Alert>
            )}

            <div className="space-y-4">
              <TextField
                fullWidth
                label="Product Name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
              />

              <TextField
                fullWidth
                label="Price (e.g., ₹199/kg)"
                value={createForm.price}
                onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                required
              />

              <TextField
                fullWidth
                label="Pieces (e.g., 14–18 mixed pieces)"
                value={createForm.pieces}
                onChange={(e) => setCreateForm({ ...createForm, pieces: e.target.value })}
              />

              <TextField
                fullWidth
                label="Includes"
                value={createForm.includes}
                onChange={(e) => setCreateForm({ ...createForm, includes: e.target.value })}
                multiline
                rows={2}
              />

              <TextField
                fullWidth
                label="Ideal For"
                value={createForm.idealFor}
                onChange={(e) => setCreateForm({ ...createForm, idealFor: e.target.value })}
              />

              <TextField
                fullWidth
                label="Description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                multiline
                rows={3}
              />

              <TextField
                fullWidth
                label="Image URL"
                value={createForm.image}
                onChange={(e) => setCreateForm({ ...createForm, image: e.target.value })}
                required
              />

              <FormControl fullWidth required>
                <InputLabel id="create-category-label">Category</InputLabel>
                <Select
                  labelId="create-category-label"
                  id="create-category-select"
                  value={createForm.category}
                  label="Category"
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                >
                  <MenuItem value="chicken">Chicken</MenuItem>
                  <MenuItem value="eggs">Eggs</MenuItem>
                  <MenuItem value="combo">Combo</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outlined"
                onClick={handleCloseCreateModal}
                disabled={createLoading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateProduct}
                disabled={createLoading}
                sx={{ backgroundColor: '#f59e0b', '&:hover': { backgroundColor: '#d97706' } }}
              >
                {createLoading ? 'Creating...' : 'Create Product'}
              </Button>
            </div>
          </Box>
        </Modal>

        {/* Edit Product Modal */}
        <Modal
          open={isEditModalOpen}
          onClose={handleCloseEditModal}
          aria-labelledby="edit-product-modal"
          aria-describedby="edit-product-modal-description"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div className="flex items-center justify-between mb-4">
              <Typography variant="h6" component="h2">
                Edit Product
              </Typography>
              <Button onClick={handleCloseEditModal}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {editError && (
              <Alert severity="error" className="mb-4">
                {editError}
              </Alert>
            )}

            {editSuccess && (
              <Alert severity="success" className="mb-4">
                {editSuccess}
              </Alert>
            )}

            <div className="space-y-4">
              <TextField
                fullWidth
                label="Product Name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />

              <TextField
                fullWidth
                label="Price (e.g., ₹199/kg)"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                required
              />

              <TextField
                fullWidth
                label="Pieces (e.g., 14–18 mixed pieces)"
                value={editForm.pieces}
                onChange={(e) => setEditForm({ ...editForm, pieces: e.target.value })}
              />

              <TextField
                fullWidth
                label="Includes"
                value={editForm.includes}
                onChange={(e) => setEditForm({ ...editForm, includes: e.target.value })}
                multiline
                rows={2}
              />

              <TextField
                fullWidth
                label="Ideal For"
                value={editForm.idealFor}
                onChange={(e) => setEditForm({ ...editForm, idealFor: e.target.value })}
              />

              <TextField
                fullWidth
                label="Description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                multiline
                rows={3}
              />

              <TextField
                fullWidth
                label="Image URL"
                value={editForm.image}
                onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                required
              />

              <FormControl fullWidth required>
                <InputLabel id="edit-category-label">Category</InputLabel>
                <Select
                  labelId="edit-category-label"
                  id="edit-category-select"
                  value={editForm.category}
                  label="Category"
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                >
                  <MenuItem value="chicken">Chicken</MenuItem>
                  <MenuItem value="eggs">Eggs</MenuItem>
                  <MenuItem value="combo">Combo</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outlined"
                onClick={handleCloseEditModal}
                disabled={editLoading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleUpdateProduct}
                disabled={editLoading}
                sx={{ backgroundColor: '#f59e0b', '&:hover': { backgroundColor: '#d97706' } }}
              >
                {editLoading ? 'Updating...' : 'Update Product'}
              </Button>
            </div>
          </Box>
        </Modal>

        {/* View Product Modal */}
        {viewingProduct && (
          <Modal
            open={isViewModalOpen}
            onClose={handleCloseViewModal}
            aria-labelledby="view-product-modal-title"
          >
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 700,
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div className="flex items-center justify-between mb-4">
                <Typography variant="h6" component="h2" id="view-product-modal-title">
                  Product Details
                </Typography>
                <Button onClick={handleCloseViewModal}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <img
                    src={viewingProduct.images[0]}
                    alt={viewingProduct.name}
                    className="w-full h-auto object-cover rounded-lg shadow-md"
                  />
                </div>
                <div className="md:w-2/3 space-y-3">
                  <h3 className="text-2xl font-bold text-gray-900">{viewingProduct.name}</h3>
                  <p><span className="font-semibold">Category:</span> <span className="text-gray-700">{viewingProduct.category}</span></p>
                  <p><span className="font-semibold">Price:</span> <span className="text-gray-700">₹{viewingProduct.price.toLocaleString()}</span></p>
                  {viewingProduct.pieces && (
                    <p><span className="font-semibold">Pieces:</span> <span className="text-gray-700">{viewingProduct.pieces}</span></p>
                  )}
                  {viewingProduct.includes && (
                    <div>
                      <p className="font-semibold">Includes:</p>
                      <p className="text-gray-700 text-sm">{viewingProduct.includes}</p>
                    </div>
                  )}
                  {viewingProduct.idealFor && (
                    <div>
                      <p className="font-semibold">Ideal For:</p>
                      <p className="text-gray-700 text-sm">{viewingProduct.idealFor}</p>
                    </div>
                  )}
                  {viewingProduct.description && (
                    <div>
                      <p className="font-semibold">Description:</p>
                      <p className="text-gray-700 text-sm">{viewingProduct.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </Box>
          </Modal>
        )}

        {/* Delete Product Dialog */}
        <Dialog
          open={isDeleteDialogOpen}
          onClose={cancelDeleteProduct}
          aria-labelledby="delete-product-dialog-title"
        >
          <DialogTitle id="delete-product-dialog-title">
            Delete Product
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelDeleteProduct} color="inherit">
              Cancel
            </Button>
            <Button onClick={confirmDeleteProduct} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Issue Detail Modal */}
        <Modal
          open={isIssueDetailModalOpen}
          onClose={handleCloseIssueDetailModal}
          aria-labelledby="issue-detail-modal"
          aria-describedby="issue-detail-modal-description"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 700,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div className="flex items-center justify-between mb-4">
              <Typography variant="h6" component="h2">
                Issue Details
              </Typography>
              <Button onClick={handleCloseIssueDetailModal}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {selectedIssue && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                    <p className="text-sm text-gray-900">{selectedIssue.orderId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
                    <p className="text-sm text-gray-900">{selectedIssue.issueType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedIssue.status === 'OPEN' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {selectedIssue.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created Time</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedIssue.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {selectedIssue.message && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedIssue.message}</p>
                  </div>
                )}

                {orderDetailsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading customer details...</p>
                  </div>
                ) : orderDetails ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                      <p className="text-sm text-gray-900">{orderDetails.address?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <p className="text-sm text-gray-900">{orderDetails.address?.phone || 'N/A'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">Customer details not available</p>
                  </div>
                )}

                {selectedIssue.status === 'OPEN' && (
                  <div className="pt-4 border-t">
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel>Update Delivery Status (Optional)</InputLabel>
                      <Select
                        value={resolveForm.deliveryStatus}
                        label="Update Delivery Status (Optional)"
                        onChange={(e) => setResolveForm({ deliveryStatus: e.target.value })}
                      >
                        <MenuItem value="">No change</MenuItem>
                        <MenuItem value="DELIVERED">Mark as Delivered</MenuItem>
                        <MenuItem value="IN_TRANSIT">Mark as In Transit</MenuItem>
                        <MenuItem value="DELAYED">Mark as Delayed</MenuItem>
                      </Select>
                    </FormControl>

                    <div className="flex justify-end space-x-3">
                      <Button
                        variant="outlined"
                        onClick={handleCloseIssueDetailModal}
                        disabled={resolvingIssue}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleResolveIssue}
                        disabled={resolvingIssue}
                        sx={{ backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } }}
                      >
                        {resolvingIssue ? 'Resolving...' : 'Mark as Resolved'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Box>
        </Modal>
      </div>
    </div>
  );
};

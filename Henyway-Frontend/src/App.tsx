import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/context/AuthContext';
import { CartProvider } from './components/context/CartContext';
import { LocationProvider } from './components/context/LocationContext';
import { LocationPopup } from './components/LocationPopup';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import Home from './components/pages/Home';
import { Products } from './components/pages/Products';
import { ProductDetail } from './components/pages/ProductDetail';
import { Cart } from './components/pages/Cart';
import { Checkout } from './components/pages/Checkout';
import { Login } from './components/pages/Login';
import { Register } from './components/pages/Register';
import { VerifyOtp } from './components/pages/VerifyOtp';
import { ResetPassword } from './components/pages/ResetPassword';
import { UserDashboard } from './components/pages/UserDashboard';
import { AdminDashboard } from './components/pages/AdminDashboard';
import { OrderDetails } from './components/pages/OrderDetails';
import About from './components/About';
import AllProducts from './components/AllProducts';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <LocationPopup />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<><Home /><AllProducts /><About /></>} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:category" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                {user?.role === 'admin' ? <AdminDashboard /> : <UserDashboard />}
              </ProtectedRoute>
            }
          />
          <Route
            path="/order/:orderId"
            element={
              <ProtectedRoute>
                <OrderDetails />
              </ProtectedRoute>
            }
          />
          <Route path="/categories" element={<Products />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <LocationProvider>
            <AppContent />
          </LocationProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

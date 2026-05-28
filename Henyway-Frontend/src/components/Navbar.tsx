import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Button,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import logo from '../assets/logo/image.png';
import { ShoppingCart, User, Menu as MenuIcon, Search, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import { getProfile } from '../Services/Auth-api';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileForNavbar = async () => {
      if (isAuthenticated) {
        try {
          const profileData = await getProfile();
          const userProfile = profileData.user || profileData;
          setProfileName(userProfile.username);
        } catch (error) {
          console.error("Navbar could not fetch profile:", error);
          // Fallback to the name from context if API fails
          setProfileName(user?.name || null);
        }
      }
    };
    fetchProfileForNavbar();
  }, [isAuthenticated, user?.name]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    setUserMenuAnchorEl(null);
    logout();
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const navLinks = [
    { text: 'Home', path: '/' },
    { text: 'Products', path: '/products' },
    { text: 'Categories', path: '/categories' },
    { text: 'About', path: '/about' },
  ];

  return (
    <>
      <AppBar position="sticky" sx={{ bgcolor: 'white', color: 'text.primary', boxShadow: 1 }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {/* Left Side Logo */}
            <Box
              onClick={() => navigate('/')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <img src={logo} alt="Logo" style={{ height: '80px', width: '150px' }} />
            </Box>

            {/* Spacer */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Desktop Navigation Links */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4 }}>
              {navLinks.map((link) => (
                <Button
                  key={link.path}
                  component={Link}
                  to={link.path}
                  sx={{
                    color: isActive(link.path) ? 'warning.main' : 'text.secondary',
                    fontWeight: 500,
                    '&:hover': {
                      color: 'warning.dark',
                      bgcolor: 'transparent',
                    },
                  }}
                >
                  {link.text}
                </Button>
              ))}
            </Box>

            {/* Spacer */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Right Side Icons & Auth */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton component={Link} to="/products" sx={{ color: 'text.secondary', '&:hover': { color: 'warning.main' } }}>
                <Search size={20} />
              </IconButton>

              <IconButton component={Link} to="/cart" sx={{ color: 'text.secondary', '&:hover': { color: 'warning.main' } }}>
                <Badge badgeContent={cartCount} color="warning">
                  <ShoppingCart size={20} />
                </Badge>
              </IconButton>

              {isAuthenticated ? (
                <>
                  <Button
                    onClick={handleUserMenuOpen}
                    sx={{ color: 'text.secondary', textTransform: 'none' }}
                    startIcon={<User size={20} />}
                  >
                    <Typography sx={{ display: { xs: 'none', md: 'block' } }} variant="body2" fontWeight={500}>
                      {profileName || user?.name || ''}
                    </Typography>
                  </Button>
                  <Menu
                    anchorEl={userMenuAnchorEl}
                    open={Boolean(userMenuAnchorEl)}
                    onClose={handleUserMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  >
                    <MenuItem component={Link} to="/dashboard" onClick={handleUserMenuClose}>
                      <LayoutDashboard size={16} style={{ marginRight: 8 }} /> Dashboard
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <LogOut size={16} style={{ marginRight: 8 }} /> Logout
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  component={Link}
                  to="/login"
                  variant="contained"
                  color="warning"
                  sx={{
                    display: { xs: 'none', md: 'inline-flex' },
                    bgcolor: 'warning.dark',
                    '&:hover': { bgcolor: 'warning.main' },
                  }}
                >
                  Login
                </Button>
              )}

              {/* Mobile Menu Icon */}
              <IconButton
                onClick={() => setIsMenuOpen(true)}
                sx={{ display: { md: 'none' }, color: 'text.secondary' }}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={() => setIsMenuOpen(false)}
          onKeyDown={() => setIsMenuOpen(false)}
        >
          <List>
            {navLinks.map((link) => (
              <ListItem key={link.path} disablePadding>
                <ListItemButton component={Link} to={link.path}>
                  <ListItemText
                    primary={link.text}
                    primaryTypographyProps={{
                      color: isActive(link.path) ? 'warning.main' : 'text.primary',
                      fontWeight: isActive(link.path) ? 'bold' : 'normal',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            {!isAuthenticated && (
              <ListItem disablePadding>
                <ListItemButton component={Link} to="/login">
                  <ListItemText primary="Login" />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

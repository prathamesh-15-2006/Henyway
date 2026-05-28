import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { login as apiLogin, forgotPassword as apiForgotPassword } from '../../Services/Auth-api';
import { Box, Button, TextField, Typography, Container, Paper, Alert, InputAdornment, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // State for Forgot Password Dialog
  const [openForgotPassword, setOpenForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiLogin({ email: trimmedEmail, password });
      // Manually store the token in localStorage so getProfile can find it
      localStorage.setItem('token', response.token);
      // Then, update the AuthContext state with the token
      await login(trimmedEmail, password);

      // Navigate to home page after login
      navigate('/');
    } catch (apiError: any) {
      setError(apiError.data?.message || apiError.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenForgotPassword = () => {
    setOpenForgotPassword(true);
    setError(''); // Clear login errors
  };

  const handleCloseForgotPassword = () => {
    setOpenForgotPassword(false);
    // Reset dialog state on close
    setForgotPasswordEmail('');
    setForgotPasswordError('');
    setForgotPasswordMessage('');
    setForgotPasswordLoading(false);
  };

  const handleForgotPasswordSubmit = async () => {
    setForgotPasswordError('');
    setForgotPasswordMessage('');

    if (!forgotPasswordEmail || !/\S+@\S+\.\S+/.test(forgotPasswordEmail)) {
      setForgotPasswordError('Please enter a valid email address.');
      return;
    }

    setForgotPasswordLoading(true);
    try {
      await apiForgotPassword({ email: forgotPasswordEmail });
      setForgotPasswordMessage('If an account with that email exists, a password reset link has been sent.');
    } catch (apiError: any) {
      setForgotPasswordError(apiError.data?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper elevation={6} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 3 }}>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold' }}>
            Welcome Back
          </Typography>
          <Typography color="textSecondary" sx={{ mt: 1 }}>
            Login with your email and password
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleLogin} sx={{ mt: 3, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Email /></InputAdornment>,
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              {loading ? 'Logging In...' : 'Login'}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 1 }}>
            <Typography color="textSecondary" variant="body2">
              <Typography component="span" color="primary" sx={{ fontWeight: 'medium', cursor: 'pointer' }} onClick={handleOpenForgotPassword}>
                Forgot Password?
              </Typography>
            </Typography>
            <Typography color="textSecondary" variant="body2">
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <Typography component="span" color="primary" sx={{ fontWeight: 'medium' }}>Register Now</Typography>
              </Link>
            </Typography>
          </Box>
        </Paper>
      </motion.div>

      <Dialog open={openForgotPassword} onClose={handleCloseForgotPassword}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter your email address below and we will send you a link to reset your password.
          </DialogContentText>
          {forgotPasswordError && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{forgotPasswordError}</Alert>}
          {forgotPasswordMessage && <Alert severity="success" sx={{ width: '100%', mt: 2 }}>{forgotPasswordMessage}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            id="forgot-email"
            label="Email Address"
            type="email"
            fullWidth
            variant="standard"
            value={forgotPasswordEmail}
            onChange={(e) => setForgotPasswordEmail(e.target.value)}
            disabled={forgotPasswordLoading || !!forgotPasswordMessage}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForgotPassword} disabled={forgotPasswordLoading}>Cancel</Button>
          <Button 
            onClick={handleForgotPasswordSubmit} 
            disabled={forgotPasswordLoading || !!forgotPasswordMessage}
            variant="contained"
          >
            {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

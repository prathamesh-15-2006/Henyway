import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Box, Button, TextField, Typography, Container, Paper, Alert, InputAdornment, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, IconButton } from '@mui/material';
import { Person, Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { signup } from '../../Services/Auth-api';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [openOtpSentDialog, setOpenOtpSentDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (openOtpSentDialog) {
      const timer = setTimeout(() => {
        setOpenOtpSentDialog(false);
        navigate('/verify-otp', { state: { email } });
      }, 2500); // 2.5-second delay
      return () => clearTimeout(timer);
    }
  }, [openOtpSentDialog, navigate, name, email, password]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 3) {
      setError('Please enter your full name.');
      return;
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    // Password validation: at least 6 characters and one special symbol
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (password.length < 6 || !specialCharRegex.test(password)) {
      setError('Password must be at least 6 characters long and contain one special symbol (e.g., !@#$%).');
      return;
    }

    setLoading(true);

    try {
      await signup({ name, email, password });
      setOpenOtpSentDialog(true);
    } catch (apiError: any) {
      setError(apiError.message || 'Registration failed. Please try again.');
    } finally {
       setLoading(false);
    }
  };

  const handleDialogCloseAndNavigate = () => {
    setOpenOtpSentDialog(false);
    navigate('/verify-otp', { state: { email } });
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
            Create Account
          </Typography>
          <Typography color="textSecondary" sx={{ mt: 1 }}>
            Join us today!
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleRegister} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Person /></InputAdornment>,
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                    >{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </Box>

          <Typography color="textSecondary" variant="body2">
            Already have an account?{' '}
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Typography component="span" color="primary" sx={{ fontWeight: 'medium' }}>Login</Typography>
            </Link>
          </Typography>
        </Paper>
      </motion.div>
       <Dialog
        open={openOtpSentDialog}
        onClose={handleDialogCloseAndNavigate}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"OTP Sent Successfully!"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            We have sent an OTP to your email address. Please verify to continue.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogCloseAndNavigate}>OK</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
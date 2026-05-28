import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Box, Button, TextField, Typography, Container, Paper, Alert, InputAdornment } from '@mui/material';
import { Lock } from '@mui/icons-material';
import { verifyOtp, resendOtp } from '../../Services/Auth-api';

export const VerifyOtp = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [timer, setTimer] = useState(30);
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve registration data passed from the Register page
  const { email } = location.state || {};

  // Redirect if registration data is missing
  if (!email) {
    navigate('/register');
    return null;
  }

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp({ email, otp });
      // On success, you might want to automatically log the user in
      // or redirect them to the login page with a success message.
      navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
    } catch (apiError: any) {
      setError(apiError.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;

    setResendLoading(true);
    setError('');
    setResendSuccess('');

    try {
      await resendOtp(email);
      setResendSuccess('A new OTP has been sent successfully.');
      setTimer(30); // Reset timer
    } catch (apiError: any) {
      setError(apiError.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Paper elevation={6} sx={{ padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 3 }}>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold' }}>
            Verify Your Email
          </Typography>
          <Typography color="textSecondary" sx={{ mt: 1, textAlign: 'center' }}>
            An OTP has been sent to <strong>{email}</strong>. Please enter it below.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {error}
            </Alert>
          )}

          {resendSuccess && (
            <Alert severity="success" sx={{ width: '100%', mt: 2 }}>
              {resendSuccess}
            </Alert>
          )}

          <Box component="form" onSubmit={handleVerifyAndRegister} sx={{ mt: 3, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="otp"
              label="Enter 6-Digit OTP"
              type="text"
              id="otp"
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              {loading ? 'Verifying...' : 'Verify & Register'}
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
              <Button
                onClick={handleResendOtp}
                disabled={resendLoading || timer > 0}
                size="small"
                variant="text"
              >
                {resendLoading && 'Sending...'}
                {!resendLoading && (timer > 0 ? `Resend in ${timer}s` : 'Resend OTP')}
              </Button>
            </Box>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  );
};
import React from 'react';
import { Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import logoImage from '../assets/logo/image.png';
import FAQ from './FAQ';

const About: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ padding: 4, backgroundColor: '#f5f5f5' }}>
      <Grid container spacing={4} alignItems="center">
        {/* Left side: Text */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #ff3d3d, #ff8e53)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            About Us
          </Typography>
          <Typography variant="body1" paragraph sx={{
            color: isDark ? '#cccccc' : '#555',
            lineHeight: 1.6
          }}>
At Henyway, we believe good food starts with freshness, honesty, and a whole lot of care. What began as a simple idea to make fresh, healthy chicken easily available to every home has grown into a promise we proudly deliver every day. We cut every order fresh, pack it with hygiene, and bring it straight to your doorstep with love. No old stock, no shortcuts, no compromises. Just clean, quality chicken you can trust for your family’s daily meals.
Welcome to Henyway freshness delivered the right way.          </Typography>
          <Typography variant="body1" paragraph sx={{
            color: isDark ? '#cccccc' : '#555',
            lineHeight: 1.6
          }}>
            Welcome to Henyway freshness delivered the right way.
          </Typography>
          <Typography variant="body1" paragraph sx={{
            color: isDark ? '#e5e5e5' : '#333',
            lineHeight: 1.6,
            fontStyle: 'italic',
            borderLeft: `4px solid ${isDark ? '#ff6363' : '#ff3d3d'}`,
            pl: 2
          }}>
            “At Henyway, we believe every family deserves honest, clean, and truly fresh chicken.
No old stock. No compromise.
Every order is cut fresh, packed fresh, and delivered quickly  the right way.
The Henyway.”
          </Typography>
        </Grid>
        {/* Right side: Image */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            component="img"
            src={logoImage}
            alt="Henyway Logo"
            sx={{
              width: '100%',
              maxWidth: 500,
              ml: 'auto',
              mr: 'auto',
              display: 'block',
              height: 'auto',
              borderRadius: 2,
              boxShadow: 3,
            }}
          />
        </Grid>
      </Grid>
      <FAQ />
    </Box>
  );
};

export default About;

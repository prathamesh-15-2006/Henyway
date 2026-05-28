import React from 'react';
import { Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Link } from 'react-router-dom';
import Banner from '../Banner';
import product1 from '../../assets/product/image.png';
import product2 from '../../assets/product/image-copy.png';
import product3 from '../../assets/product/image-copy-2.png';
import product4 from '../../assets/product/image-copy-3.png';

const Home: React.FC = () => {
  const products = [
    { image: product1, name: 'Chicken' },
    { image: product2, name: 'Eggs' },
    { image: product3, name: 'Combo' },
    { image: product4, name: 'Premium'},
  ];

  return (
    <div>
      {/* Delivery Info Banner */}
      <Box
        sx={{
          bgcolor: '#1f2937',
          color: '#ffffff',
          py: 2,
          px: { xs: 2, sm: 4 },
          textAlign: 'center',
          borderBottom: '2px solid #e5e7eb'
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: '0.9rem', sm: '1rem' },
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            flexWrap: 'wrap'
          }}
        >
          <span>🕘</span>
          <span>Same-day delivery between 9 AM – 9 PM</span>
          <span style={{ margin: '0 8px', color: '#9ca3af' }}>|</span>
          <span>🚚</span>
          <span>Delivered within 1 hour (may take up to 2–4 hours due to traffic)</span>
        </Typography>
      </Box>

      <Banner />
      <Box sx={{ bgcolor: '#FFD400', color: '#000000' }}>
        <Box sx={{ padding: { xs: '40px 10px', sm: '40px 20px' }, textAlign: 'center' }}>
          <Typography
            variant="h4"
            sx={{
              mb: 2,
              position: 'relative',
              fontWeight: 'bold',
              display: 'inline-block',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '3px',
                backgroundColor: '#E53935', // Accent Color
              },
            }}
          >
            Our Categories
          </Typography>
          <Grid container spacing={{ xs: 1, sm: 2, md: 4 }} justifyContent="center">
            {products.map((product, index) => (
              <Grid item xs={6} sm={3} md={3} key={index} sx={{ textAlign: 'center' }} component={Link} to={`/products/${product.name.toLowerCase()}`} style={{ textDecoration: 'none' }}>
                <Box
                  component="img"
                  src={product.image}
                  alt={product.name}
                  sx={{
                    width: { xs: 60, sm: 140, md: 180 },
                    height: { xs: 70, sm: 140, md: 180 },
                    objectFit: 'cover',
                    borderRadius: 3,
                    display: 'block',
                    margin: '0 auto',
                  }}
                />
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    mt: 1,
                    color: '#000000', // Primary Text Color
                    fontSize: { xs: '0.8rem', sm: '1.1rem', md: '1.3rem' },
                  }}
                >
                  {product.name}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </div>
  );
};

export default Home;

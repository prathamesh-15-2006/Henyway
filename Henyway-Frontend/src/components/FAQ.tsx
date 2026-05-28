import React, { useState } from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, Container } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTheme } from '@mui/material/styles';
import { HelpCircle } from 'lucide-react';

const FAQ: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const faqs = [
    {
      question: "Is your chicken really cut fresh on order?",
      answer: "Yes! Every order is cut only after you place it. No pre-cut, no frozen, no old stock ever."
    },
    {
      question: "How long does delivery take?",
      answer: "Most orders are delivered within 30–45 minutes, depending on your location and order load."
    },
    {
      question: "What types of chicken do you offer?",
      answer: "We offer fresh boiler chicken, country chicken, and multiple cut styles like curry cut, boneless, drumsticks, liver, and gizzard."
    },
    {
      question: "Do you deliver all across Pune?",
      answer: "We currently deliver to selected areas, but we’re expanding quickly. Just check our delivery availability during checkout or WhatsApp us!"
    },
    {
      question: "How is the chicken packed?",
      answer: "Each order is vacuum-sealed or tightly packed in food-grade, leak-proof packaging with clear labeling and time of cutting."
    },
    {
      question: "Do you charge for delivery?",
      answer: "Delivery charges vary by distance. Many areas get free delivery above a minimum order value."
    },
    {
      question: "How can I place an order?",
      answer: "You can order via our website or WhatsApp us!"
    }
  ];

  return (
    <Box sx={{ 
      py: 8, 
      px: 2, 
      backgroundColor: isDark ? '#121212' : '#f8f9fa',
      minHeight: '50vh'
    }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
            <HelpCircle size={32} color={isDark ? '#ff6363' : '#ff3d3d'} />
            <Typography variant="h4" component="h1" sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #ff3d3d 0%, #ff8e53 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px'
            }}>
              Frequently Asked Questions
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: isDark ? '#aaa' : '#666', maxWidth: '600px', mx: 'auto' }}>
            Everything you need to know about our products and delivery service.
          </Typography>
        </Box>

        {faqs.map((faq, index) => (
          <Accordion 
            key={index} 
            expanded={expanded === `panel${index}`}
            onChange={handleChange(`panel${index}`)}
            sx={{ 
              marginBottom: 2,
              borderRadius: '16px !important',
              background: isDark ? 'rgba(30, 30, 30, 0.6)' : '#ffffff',
              boxShadow: expanded === `panel${index}` 
                ? (isDark ? '0 8px 20px rgba(0,0,0,0.4)' : '0 8px 20px rgba(255, 61, 61, 0.15)')
                : (isDark ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.05)'),
              border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.03)',
              '&:before': { display: 'none' },
              transition: 'all 0.3s ease',
              overflow: 'hidden'
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: expanded === `panel${index}` ? '#ff3d3d' : (isDark ? '#888' : '#bbb') }} />}
              aria-controls={`faq-content-${index}`}
              id={`faq-header-${index}`}
              sx={{
                px: 3,
                py: 1,
                '& .MuiAccordionSummary-content': { margin: '12px 0' }
              }}
            >
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                fontSize: '1.1rem',
                color: expanded === `panel${index}` ? '#ff3d3d' : (isDark ? '#eee' : '#333'),
                transition: 'color 0.2s'
              }}>
                {faq.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
              <Typography variant="body1" sx={{ 
                color: isDark ? '#b0b0b0' : '#555',
                lineHeight: 1.7,
                fontSize: '0.95rem'
              }}>
                {faq.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>
    </Box>
  );
};

export default FAQ;

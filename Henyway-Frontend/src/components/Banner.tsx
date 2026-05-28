import React, { useState, useEffect } from "react";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";

import banner1 from "../assets/Banenr/image.png";
import banner2 from "../assets/Banenr/image copy.png";
import banner3 from "../assets/Banenr/image copy 2.png";

const Banner: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));


  const images = [banner1, banner2, banner3];
  const [activeImg, setActiveImg] = useState(0);

  // Auto image change
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveImg((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
         overflow: "hidden",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "20px" : "60px 40px",
        gap: 0,

      }}
    >
      {/* LEFT SECTION */}
      <Box
        sx={{
          width: isMobile ? "100%" : isTablet ? "50%" : "40%",
          color: "#fff",
          textAlign: isMobile ? "center" : "left",
        }}
      >
        <Typography
          variant={isMobile ? "h4" : "h2"}
          sx={{
            fontWeight: 700,
            color: "#e9eaefff",
            lineHeight: 1.3,
            mb: 2,
          }}
        >
          Where taste
          <br />
          meets <span style={{ color: "#e1a40a" }}>experience</span>
        </Typography>

        <Typography
          sx={{
            color: "#ccc",
            mb: 3,
            fontSize: isMobile ? "0.9rem" : "1rem",
          }}
        >
          We serve your high expectations more than your taste.
        </Typography>

        <Box
          sx={{
            padding: "12px 28px",
            backgroundColor: "#e63946",
            width: "fit-content",
            color: "#fff",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          ORDER NOW →
        </Box>
      </Box>

      {/* RIGHT SECTION - Hidden on Mobile */}
      {!isMobile && (
        <Box
          sx={{
            width: "50%",
            height: "500px",
            position: "relative",
            mr: "40px",
          }}
        >
          {/* ⭐ Square Image always perfect */}
          <Box
            component="img"
            src={images[activeImg]}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "20px",
            }}
          />

          {/* ⭐ Floating Circles INSIDE the image */}
          <Box
            sx={{
              position: "absolute",
              right: "15px",
              top: "15px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {images.map((img, i) => (
              <Box
                key={i}
                onClick={() => setActiveImg(i)}
                sx={{
                  width: "55px",
                  height: "55px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  backgroundColor: "#000",
                  border: activeImg === i ? "3px solid #e1a40a" : "2px solid #444",
                  cursor: "pointer",
                  transition: "0.3s",
                  ":hover": { transform: "scale(1.12)" },
                }}
              >
                <Box
                  component="img"
                  src={img}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Banner;

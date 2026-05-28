import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { Product } from './types';
import { useCart } from './context/CartContext';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await addToCart(product);
      // Optionally, show a success notification here
    } catch (error) {
      console.error("Failed to add product to cart:", error);
      // Optionally, show an error notification or redirect to login
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      // The main card container with new styling
      className="bg-white/70 backdrop-blur-md rounded-2xl p-3 shadow-[0_6px_16px_rgba(0,0,0,0.06)] flex flex-col"
    >
      <Link to={`/product/${product.id}`} className="flex-grow">
        <div className="relative">
          <img
            src={product.images[0]} // Assuming this is already circular as requested
            alt={product.name}
            className="w-full h-32 sm:h-40 object-cover"
          />
          {product.newArrival && (
            <span className="absolute top-3 left-3 bg-amber-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              New Arrival
            </span>
          )}
          {product.featured && (
            <span className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Featured
            </span>
          )}
        </div>

        <div className="mt-2">
          <h3 className="text-[14px] font-semibold text-black line-clamp-2">
            {product.name}
          </h3>

          <p className="text-[12px] text-[#777777] mt-0.5 line-clamp-2">
            {product.description}
          </p>

          {product.rating && (
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex items-center">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium text-gray-700 ml-1">
                  {product.rating}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                ({product.reviews} reviews)
              </span>
            </div>
          )}
        </div>
      </Link>
      {/* Footer for price and button, separated from the link */}
      <div className="mt-2 flex justify-between items-center">
        <span className="text-[15px] font-bold text-black">
          ₹{product.price.toLocaleString()}
        </span>

        <button
          onClick={handleAddToCart}
          // New pill-shaped red button styling
          className="bg-[#E53935] text-white text-[12px] font-semibold rounded-full px-3.5 py-1 border-none cursor-pointer"
        >
          Add
        </button>
      </div>
    </motion.div>
  );
};

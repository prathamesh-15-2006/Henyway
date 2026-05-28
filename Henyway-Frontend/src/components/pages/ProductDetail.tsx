import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Star, Plus, Minus, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { getProductById } from '../../Services/Product-api';
import { useCart } from '../context/CartContext';
import { Product } from '../types';

export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('Product ID is missing.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await getProductById(id);

        const apiProduct = response.data; // Extract the product from the 'data' property
        // Map the raw API response to the structure our frontend expects
        const mappedProduct: Product = {
          id: apiProduct._id,
          name: apiProduct.name,
          price: parseFloat(String(apiProduct.price || '0').replace(/[^0-9.]/g, '')) || 0,
          category: apiProduct.category,
          images: Array.isArray(apiProduct.images) && apiProduct.images.length > 0 ? apiProduct.images : [apiProduct.image],
          description: apiProduct.description || '',
          stock: apiProduct.stock || 0, // Default to 0 if not provided
          newArrival: apiProduct.newArrival,
          featured: apiProduct.featured,
          rating: apiProduct.rating,
          reviews: apiProduct.reviews,
          active: apiProduct.active,
        };
        setProduct(mappedProduct);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch product details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (product) {
      try {
        await addToCart(product, quantity);
        // You can add a success notification here
      } catch (error) {
        console.error("Failed to add product to cart:", error);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  }

  if (!product) {
    return <div className="flex justify-center items-center min-h-screen">Product not found.</div>;
  }

  return (
    <div className="bg-[#FFD400] min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Link to="/products" className="inline-flex items-center text-black hover:text-[#777777] font-semibold mb-6">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Products
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
        >
          {/* Image Gallery */}
          <div>
            <img src={product.images[0]} alt={product.name} className="w-full h-auto object-cover rounded-xl" />
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-black mb-3">{product.name}</h1>
            
            {product.rating && (
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="text-lg font-medium text-black ml-1">{product.rating}</span>
                </div>
                <span className="text-sm text-[#777777]">({product.reviews} reviews)</span>
              </div>
            )}

            <p className="text-[#444444] text-base mb-6">{product.description}</p>

            <div className="text-3xl font-extrabold text-black mb-6">
              ₹{product.price.toLocaleString()}
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border border-gray-300 rounded-full">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2 hover:bg-gray-100 rounded-l-full"><Minus className="w-5 h-5" /></button>
                <span className="px-6 py-2 font-semibold text-lg">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="p-2 hover:bg-gray-100 rounded-r-full"><Plus className="w-5 h-5" /></button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full max-w-sm bg-[#E53935] text-white py-3 rounded-full font-semibold text-lg hover:bg-red-600 transition-all flex items-center justify-center space-x-3"
            >
              <ShoppingCart className="w-6 h-6" />
              <span>Add to Cart</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
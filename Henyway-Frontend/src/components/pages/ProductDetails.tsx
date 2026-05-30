import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, Star, ArrowLeft, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../ProductCard';
import { motion } from 'framer-motion';
import { getProductById, getAllProductsPublic } from '../../Services/Product-api';
import { Product as ProductCardType } from '../types';

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAddedMessage, setShowAddedMessage] = useState(false);
  const [product, setProduct] = useState<ProductCardType | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await getProductById(id);
        const apiProduct = response.data;

        // Map the API response to the structure expected by the component
        const mappedProduct: ProductCardType = {
          id: apiProduct._id,
          name: apiProduct.name,
          price: parseFloat(apiProduct.price.replace(/[^0-9.]/g, '')) || 0,
          category: apiProduct.category,
          images: [apiProduct.image],
          description: apiProduct.description || '',
          stock: apiProduct.stock || 0,
          newArrival: apiProduct.newArrival || false,
          featured: apiProduct.featured || false,
          rating: apiProduct.rating || 0,
          reviews: apiProduct.reviews || 0,
          active: true,
        };
        setProduct(mappedProduct);

        // Fetch related products
        const allProductsResponse = await getAllProductsPublic();
        const allApiProducts = allProductsResponse.data || [];
        const mappedRelatedProducts = allApiProducts
          .filter((p: any) => p.category === apiProduct.category && p._id !== apiProduct._id)
          .slice(0, 4)
          .map((p: any) => ({
            id: p._id,
            name: p.name,
            price: parseFloat(p.price.replace(/[^0-9.]/g, '')) || 0,
            category: p.category,
            images: [p.image],
            description: p.description || '',
            stock: p.stock || 0,
            newArrival: p.newArrival || false,
            featured: p.featured || false,
            rating: p.rating || 0,
            reviews: p.reviews || 0,
            active: true,
          }));
        setRelatedProducts(mappedRelatedProducts);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch product:', err.message);
        setError('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">{error || 'Product Not Found'}</h2>
          <Link to="/products" className="text-amber-600 hover:text-amber-700 font-semibold">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setShowAddedMessage(true);
    setTimeout(() => setShowAddedMessage(false), 3000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-[#FFD400] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/products"
          className="inline-flex items-center space-x-2 text-black hover:text-[#777777] mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Products</span>
        </Link>

        {showAddedMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2"
          >
            <Check className="w-5 h-5" />
            <span>Added to cart successfully!</span>
          </motion.div>
        )}

        <div className="bg-white/70 backdrop-blur-md rounded-xl shadow-[0_6px_16px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
            <div>
              <div className="relative overflow-hidden rounded-xl mb-4 bg-gray-100">
                <motion.img
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-96 object-cover"
                />
                {product.newArrival && (
                  <span className="absolute top-4 left-4 bg-[#E53935] text-white text-sm font-semibold px-4 py-2 rounded-full">
                    New Arrival
                  </span>
                )}
                {product.featured && (
                  <span className="absolute top-4 right-4 bg-[#E53935] text-white text-sm font-semibold px-4 py-2 rounded-full">
                    Featured
                  </span>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                        selectedImage === index
                          ? 'border-[#E53935]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} - ${index + 1}`}
                        className="w-full h-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-black mb-4">
                {product.name}
              </h1>

              {product.rating && (
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(product.rating!)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-medium text-black">
                    {product.rating}
                  </span>
                  <span className="text-[#777777]">
                    ({product.reviews} reviews)
                  </span>
                </div>
              )}

              <div className="mb-6">
                <span className="text-4xl font-bold text-black">
                  ₹{product.price.toLocaleString()}
                </span>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-black mb-2">Description</h3>
                <p className="text-[#777777] leading-relaxed">{product.description}</p>
              </div>

              <div className="mb-6">
                <span
                  className={`inline-block px-4 py-2 rounded-lg font-medium ${
                    (product.stock || 0) > 10
                      ? 'bg-green-100 text-green-700'
                      : (product.stock || 0) > 0
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {(product.stock || 0) > 10
                    ? 'In Stock'
                    : (product.stock || 0) > 0
                    ? `Only ${product.stock} left!`
                    : 'Out of Stock'}
                </span>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-black mb-3">Quantity</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-gray-100 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="px-6 py-3 font-semibold text-lg">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock || 0, quantity + 1))}
                      className="p-3 hover:bg-gray-100 transition-colors"
                      disabled={quantity >= (product.stock || 0)}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <span className="text-[#777777]">
                    Total: ₹{(product.price * quantity).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 flex items-center justify-center space-x-2 bg-[#E53935] text-white py-4 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex-1 bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-black mb-6">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '../ProductCard';
import { motion } from 'framer-motion';
import { getAllProductsPublic } from '../../Services/Product-api';
import { Product } from '../types';

// The raw product structure from your public API
interface ApiProduct {
  _id: string;
  name: string;
  price: string; // e.g., "₹199/kg"
  category: string;
  image: string; // The API sends a single image string
  description?: string;
  stock?: number;
  newArrival?: boolean;
  featured?: boolean;
  rating?: number;
  reviews?: number;
}

export const Products = () => {
  const { category: categoryFromUrl } = useParams<{ category: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFromUrl || 'all');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'chicken', slug: 'chicken', name: 'Chicken' },
    { id: 'eggs', slug: 'eggs', name: 'Eggs' },
    { id: 'combo', slug: 'combo', name: 'Combo' },
    { id: 'premium', slug: 'premium', name: 'Premium' },
  ];
  const [sortBy, setSortBy] = useState<string>('featured');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await getAllProductsPublic();
        const apiProducts: ApiProduct[] = response.data || [];
        console.log('Products API response:', response);
        console.log('API products length:', apiProducts.length);
        console.log('First few products:', apiProducts.slice(0, 3));

        // Map the API response to the structure expected by ProductCard
        const mappedProducts: Product[] = apiProducts.filter(p => p && p._id).map(p => {
          // Safe price parsing
          let price = 0;
          if (p.price != null && typeof p.price === 'string' && p.price) {
            const numStr = p.price.replace(/[^0-9.]/g, '');
            price = parseFloat(numStr) || 0;
          } else if (p.price != null && typeof p.price === 'number') {
            price = p.price;
          }

          return {
            id: p._id,
            name: p.name || '',
            price,
            category: p.category || '',
            images: (p.image != null && typeof p.image === 'string' && p.image) ? [p.image] : [],
            description: p.description || '',
            stock: p.stock || 0,
            newArrival: p.newArrival || false,
            featured: p.featured || false,
            rating: p.rating || 0,
            reviews: p.reviews || 0,
            active: true,
          };
        });
        setProducts(mappedProducts);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch products.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          p.category.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }



    const sorted = [...filtered];
    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'featured':
      default:
        sorted.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          if (a.newArrival && !b.newArrival) return -1;
          if (!a.newArrival && b.newArrival) return 1;
          return 0;
        });
    }

    return sorted;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('featured');
  };

  return (
    <div className="min-h-screen bg-[#FFD400] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
            <h1 className="relative inline-block text-3xl font-bold text-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-[#E53935]">
              All Products
            </h1>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E53935] focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center justify-center space-x-2 bg-white border border-gray-300 px-4 py-3 rounded-lg hover:bg-gray-50"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside
            className={`lg:block ${
              showFilters ? 'block' : 'hidden'
            } bg-white/70 backdrop-blur-md p-6 rounded-xl shadow-[0_6px_16px_rgba(0,0,0,0.06)] h-fit sticky top-24`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-black">Filters</h2>
              {showFilters && (
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-black mb-3">Category</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value="all"
                      checked={selectedCategory === 'all'}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="text-[#E53935] focus:ring-[#E53935]"
                    />
                    <span className="ml-2 text-sm text-black">All Categories</span>
                  </label>
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={category.slug}
                        checked={selectedCategory === category.slug}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="text-[#E53935] focus:ring-[#E53935]"
                      />
                      <span className="ml-2 text-sm text-black">
                        {category.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>



              <div>
                <h3 className="font-medium text-black mb-3">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#E53935] focus:border-transparent"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>

              <button
                onClick={resetFilters}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Reset Filters
              </button>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-black">
                Showing <span className="font-semibold">{filteredAndSortedProducts.length}</span> products
              </p>
            </div>

            {loading && <p className="text-center py-12">Loading products...</p>}
            {error && <p className="text-center text-red-500 py-12">{error}</p>}
            {!loading && !error && (
              <>
                {filteredAndSortedProducts.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                  >
                    {filteredAndSortedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-black text-lg">No products found matching your criteria</p>
                    <button
                      onClick={resetFilters}
                      className="mt-4 text-[#E53935] hover:text-red-700 font-semibold"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

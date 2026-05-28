import { useState, useEffect } from 'react';
import { getAllProductsPublic } from '../Services/Product-api';
import { ProductCard } from './ProductCard';
import { Product as ProductCardType } from './types';

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

const AllProducts = () => {
  const [products, setProducts] = useState<ProductCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        const response = await getAllProductsPublic();
        const apiProducts: ApiProduct[] = response.data || [];
        console.log('API products length:', apiProducts.length);

        // Map the API response to the structure expected by ProductCard
        const mappedProducts: ProductCardType[] = apiProducts.filter(p => p && p._id).map(p => {
          console.log('Processing product:', p);
          console.log('Product price:', p.price, 'type:', typeof p.price);

          // Safe price parsing
          let price = 0;
          if (p.price != null && typeof p.price === 'string' && p.price) {
            const numStr = p.price.replace(/[^0-9.]/g, '');
            price = parseFloat(numStr) || 0;
          } else if (p.price != null && typeof p.price === 'number') {
            price = p.price;
          }

          console.log('Parsed price:', price);

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
        console.log('Mapped products length:', mappedProducts.length);
        setProducts(mappedProducts);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch products:', err);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        setProducts([]);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="bg-[#FFD400] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="relative inline-block text-3xl font-bold text-black after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-[#E53935]">All Products</h2>
        </div>
        {loading && <p className="text-center py-12">Loading products...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllProducts;
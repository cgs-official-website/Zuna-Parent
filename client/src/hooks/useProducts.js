import { useState, useEffect, useCallback } from 'react';
import { productsService } from '../services/productsService.js';
import { useToast } from '../context/ToastContext.jsx';

export const useProducts = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productsService.listProducts();
      setProducts(Array.isArray(data) ? data : data?.products || []);
      setError(null);
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to fetch products';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (productData) => {
    try {
      const created = await productsService.createProduct(productData);
      setProducts((prev) => [created, ...prev]);
      showToast('Product created successfully', 'success');
      return created;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      showToast(`Creation failed: ${msg}`, 'error');
      throw err;
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      const updated = await productsService.updateProduct(id, productData);
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
      showToast('Product updated successfully', 'success');
      return updated;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      showToast(`Update failed: ${msg}`, 'error');
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await productsService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Product deleted', 'info');
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      showToast(`Deletion failed: ${msg}`, 'error');
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  };
};

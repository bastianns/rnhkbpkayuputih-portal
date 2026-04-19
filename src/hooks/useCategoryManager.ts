'use client';

import { useState } from 'react';
import { fetchAllCategories, createQuickCategory } from '@/actions/eventController';

export function useCategoryManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  async function fetchCategories() {
    const data = await fetchAllCategories();
    setCategories(data || []);
  }

  const handleQuickAddCategory = async (callback: (id: string) => void) => {
    if (!newCategoryName.trim()) return;
    setCreatingCat(true);
    
    const result = await createQuickCategory(newCategoryName);
    
    if (result.success && result.category) {
      await fetchCategories();
      callback(result.category.id_kategori_kegiatan);
      setIsAddingNewCat(false);
      setNewCategoryName('');
    } else {
      alert("Gagal tambah kategori: " + result.error);
    }
    
    setCreatingCat(false);
  };

  return {
    categories,
    isAddingNewCat,
    setIsAddingNewCat,
    newCategoryName,
    setNewCategoryName,
    creatingCat,
    fetchCategories,
    handleQuickAddCategory
  };
}

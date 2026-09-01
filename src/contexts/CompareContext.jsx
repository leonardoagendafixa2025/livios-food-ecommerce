import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext.jsx';

const CompareContext = createContext();

export function CompareProvider({ children }) {
  const [compareList, setCompareList] = useState(() => {
    try {
      const saved = localStorage.getItem('livios_compare');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const { addToast } = useToast();

  useEffect(() => {
    localStorage.setItem('livios_compare', JSON.stringify(compareList));
  }, [compareList]);

  const toggleCompare = (product) => {
    setCompareList(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        addToast(`Produto "${product.name}" removido da comparação.`, "info");
        return prev.filter(p => p.id !== product.id);
      } else {
        if (prev.length >= 4) {
          addToast("Você pode comparar no máximo 4 produtos simultaneamente.", "warning");
          return prev;
        }
        addToast(`Produto "${product.name}" adicionado à comparação!`, "success");
        return [...prev, product];
      }
    });
  };

  const clearCompare = () => setCompareList([]);

  const isComparing = (productId) => compareList.some(p => p.id === productId);

  return (
    <CompareContext.Provider value={{ compareList, toggleCompare, clearCompare, isComparing }}>
      {children}
    </CompareContext.Provider>
  );
}

export const useCompare = () => useContext(CompareContext);

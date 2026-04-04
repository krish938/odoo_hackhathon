import React from 'react';
import { formatCurrency } from '../../utils/formatCurrency';

const ProductCard = ({ product, onClick }) => {
  return (
    <button
      onClick={() => onClick(product)}
      className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow text-left"
    >
      <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
        <div className="text-2xl">🍽️</div>
      </div>
      <h3 className="font-medium text-gray-900 mb-1">
        {product.name}
      </h3>
      <p className="text-lg font-bold text-primary">
        {formatCurrency(product.base_price)}
      </p>
      {product.send_to_kitchen && (
        <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          Kitchen
        </span>
      )}
    </button>
  );
};

export default ProductCard;

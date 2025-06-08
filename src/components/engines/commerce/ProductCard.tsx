import React from 'react';
import { Star, Package, Edit, Eye, MoreHorizontal } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  sku: string;
  price: string;
  currency?: string;
  stock: number;
  sold?: number;
  rating?: number;
  image?: string;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onMore?: (id: string) => void;
  compact?: boolean;
}

export default function ProductCard({
  id,
  name,
  sku,
  price,
  currency = '$',
  stock,
  sold,
  rating,
  image,
  onView,
  onEdit,
  onMore,
  compact = false
}: ProductCardProps) {
  if (compact) {
    return (
      <div className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <Package className="h-6 w-6 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm text-gray-500">{sku}</span>
            {rating && (
              <div className="flex items-center">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-500 ml-1">{rating}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{currency}{price}</p>
          {sold && <p className="text-xs text-gray-500">{sold} sold</p>}
          <p className="text-xs text-gray-500">{stock} in stock</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex space-x-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
            {image ? (
              <img src={image} alt={name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <Package className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500 mt-1">SKU: {sku}</p>
            {rating && (
              <div className="flex items-center mt-2">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 ml-1">{rating}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          {onView && (
            <button
              onClick={() => onView(id)}
              className="text-blue-600 hover:text-blue-700 p-1"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(id)}
              className="text-gray-600 hover:text-gray-700 p-1"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {onMore && (
            <button
              onClick={() => onMore(id)}
              className="text-gray-600 hover:text-gray-700 p-1"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div>
          <p className="text-xl font-bold text-gray-900">{currency}{price}</p>
          {sold && <p className="text-sm text-gray-500">{sold} sold</p>}
        </div>
        <div className="text-right">
          <p className={`text-sm font-medium ${stock > 10 ? 'text-green-600' : stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
            {stock > 0 ? `${stock} in stock` : 'Out of stock'}
          </p>
        </div>
      </div>
    </div>
  );
} 
import React from 'react';
import { Globe, Plus, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate?: number;
  isDefault?: boolean;
  lastUpdated?: string;
}

interface CurrencyManagerProps {
  currencies: Currency[];
  defaultCurrency?: Currency;
  onAdd?: () => void;
  onEdit?: (currencyId: string) => void;
  onDelete?: (currencyId: string) => void;
  onSetDefault?: (currencyId: string) => void;
  onUpdateRates?: () => void;
  compact?: boolean;
}

export default function CurrencyManager({
  currencies,
  defaultCurrency,
  onAdd,
  onEdit,
  onDelete,
  onSetDefault,
  onUpdateRates,
  compact = false
}: CurrencyManagerProps) {
  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Currencies</h3>
          {onAdd && (
            <button
              onClick={onAdd}
              className="text-blue-600 hover:text-blue-700"
              title="Add currency"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="space-y-2">
          {currencies.slice(0, 3).map((currency) => (
            <div key={currency.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{currency.symbol}</span>
                <span className="text-sm text-gray-600">{currency.code}</span>
                {currency.isDefault && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Default
                  </span>
                )}
              </div>
              {currency.exchangeRate && (
                <span className="text-sm text-gray-600">
                  {currency.exchangeRate.toFixed(4)}
                </span>
              )}
            </div>
          ))}
          {currencies.length > 3 && (
            <p className="text-sm text-gray-500 text-center">
              +{currencies.length - 3} more currencies
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Currency Management</h2>
          </div>
          <div className="flex space-x-2">
            {onUpdateRates && (
              <button
                onClick={onUpdateRates}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Update Rates
              </button>
            )}
            {onAdd && (
              <button
                onClick={onAdd}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Currency
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {defaultCurrency && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Default Currency</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-bold text-blue-900">
                {defaultCurrency.symbol}
              </span>
              <div>
                <p className="font-semibold text-blue-900">{defaultCurrency.name}</p>
                <p className="text-sm text-blue-700">{defaultCurrency.code}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {currencies.map((currency) => (
            <div
              key={currency.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {currency.symbol}
                  </div>
                  <div className="text-xs text-gray-500">{currency.code}</div>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{currency.name}</p>
                  {currency.lastUpdated && (
                    <p className="text-sm text-gray-500">
                      Updated {new Date(currency.lastUpdated).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {currency.isDefault && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Default
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {currency.exchangeRate && !currency.isDefault && (
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-gray-900">
                        {currency.exchangeRate.toFixed(4)}
                      </span>
                      {/* Mock trend indicator */}
                      {Math.random() > 0.5 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">vs {defaultCurrency?.code}</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  {!currency.isDefault && onSetDefault && (
                    <button
                      onClick={() => onSetDefault(currency.id)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Set Default
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(currency.id)}
                      className="text-gray-600 hover:text-gray-700 p-1"
                      title="Edit currency"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {!currency.isDefault && onDelete && (
                    <button
                      onClick={() => onDelete(currency.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Delete currency"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {currencies.length === 0 && (
          <div className="text-center py-8">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No currencies configured</p>
            {onAdd && (
              <button
                onClick={onAdd}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Add your first currency
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
import React from 'react';
import { X, CheckCircle, Home } from 'lucide-react';
import { Cart, MenuData, CartItem } from '../types';
import { SausageDogLogo } from './DachshundAssets';

interface OrderSummaryProps {
  cart: Cart;
  menuData: MenuData;
  onClose: () => void;
  onFinish: () => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ cart, menuData, onClose, onFinish }) => {
  const cartItems = Object.values(cart) as CartItem[];
  const totalPrice = cartItems.reduce((sum, i) => sum + (i.item.price * i.quantity), 0);

  return (
    <div className="fixed inset-0 bg-sausage-900 z-50 flex flex-col">
      <div className="bg-white rounded-b-3xl flex-1 flex flex-col overflow-hidden m-2 mb-0">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-sausage-50">
          <div className="flex items-center gap-2">
            <SausageDogLogo className="w-8 h-8 text-sausage-600" />
            <h2 className="text-xl font-black text-sausage-900 uppercase tracking-tight">Order List</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-500 hover:text-gray-900 shadow-sm">
            <X size={24} />
          </button>
        </div>

        {/* Content - Optimized for legibility */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl text-center text-sm font-medium mb-4">
            Show this screen to the staff to order! 🐶
          </div>

          {cartItems.map(({ item, quantity }) => (
            <div key={item.id} className="border-b-2 border-dashed border-gray-200 pb-4 last:border-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* BIG Original Name for Staff */}
                  <h3 className="text-2xl font-black text-gray-900 leading-none mb-1">
                    {item.originalName}
                  </h3>
                  {/* Small Translated Name for User */}
                  <p className="text-gray-500 text-sm">{item.translatedName}</p>
                </div>
                <div className="flex items-center gap-2 pl-4">
                  <span className="text-sausage-600 font-bold text-xl">x</span>
                  <span className="text-4xl font-black text-sausage-600">{quantity}</span>
                </div>
              </div>
              <div className="text-right mt-1 text-gray-400 font-mono text-sm">
                @{item.price} {menuData.originalCurrency}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-sausage-50 p-6 border-t border-sausage-100">
          <div className="flex justify-between items-end mb-4">
            <span className="text-gray-500 font-bold uppercase tracking-wider text-sm">Total</span>
            <span className="text-3xl font-black text-sausage-900">
              {totalPrice} <span className="text-lg text-sausage-700">{menuData.originalCurrency}</span>
            </span>
          </div>
          <button 
            onClick={onFinish}
            className="w-full bg-sausage-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:bg-sausage-700 flex justify-center items-center gap-2"
          >
            <Home size={20} /> Finish & Return Home
          </button>
        </div>
      </div>
    </div>
  );
};

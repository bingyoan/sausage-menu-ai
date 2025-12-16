import React, { useState } from 'react';
import { X, Home, Users, Download } from 'lucide-react';
import { Cart, MenuData } from '../types'; // 修正引用
import { SausageDogLogo } from './DachshundAssets';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

interface OrderSummaryProps {
  cart: Cart;
  menuData: MenuData;
  onClose: () => void;
  onFinish: () => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ cart, menuData, onClose, onFinish }) => {
  const [personCount, setPersonCount] = useState(1);
  
  // Cart 已經是陣列
  const cartItems = cart;
  
  // 直接存取 price (扁平化)
  const totalPrice = cartItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const exchangeRate = menuData.exchangeRate || 1;
  const totalConverted = totalPrice * exchangeRate;

  const handleShare = async () => {
      const element = document.getElementById('receipt-view');
      if (!element) return;
      
      const toastId = toast.loading('Generating receipt...');
      try {
          element.style.borderRadius = '0';
          const canvas = await html2canvas(element, { 
              scale: 2,
              backgroundColor: '#fff7ed', 
          });
          element.style.borderRadius = '1.5rem'; 

          const image = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = image;
          link.download = `SausageMenu_${Date.now()}.png`;
          link.click();
          
          toast.success('Receipt saved!', { id: toastId });
      } catch (err) {
          console.error(err);
          toast.error('Could not generate image', { id: toastId });
      }
  };

  return (
    <div className="fixed inset-0 bg-sausage-900 z-50 flex flex-col">
      <div className="bg-gray-100 flex-1 flex flex-col overflow-hidden m-2 mb-0 rounded-t-3xl">
        <div className="p-4 bg-white flex justify-between items-center shadow-sm z-10">
          <h2 className="text-xl font-black text-sausage-900">Your Order</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div id="receipt-view" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 relative overflow-hidden mb-6">
             <div className="absolute top-0 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_50%,#fff_50%)] bg-[length:16px_16px] rotate-180 -mt-1"></div>

             <div className="flex flex-col items-center mb-6 border-b-2 border-dashed border-gray-200 pb-4">
                <SausageDogLogo className="w-16 h-10 text-sausage-600 mb-2" />
                <h3 className="font-black text-gray-900 text-lg uppercase tracking-widest">Receipt</h3>
                <p className="text-gray-400 text-xs">{new Date().toLocaleString()}</p>
             </div>

             <div className="space-y-4 mb-6">
                {cartItems.map((cartItem) => (
                    <div key={cartItem.id} className="flex justify-between items-start text-sm">
                        <div className="flex gap-3">
                            <span className="font-bold text-sausage-600">x{cartItem.quantity}</span>
                            <div>
                                <p className="font-bold text-gray-800 leading-tight">{cartItem.name}</p>
                                <p className="text-xs text-gray-400">{cartItem.category}</p>
                            </div>
                        </div>
                        <span className="font-mono text-gray-600 font-bold whitespace-nowrap">
                            {(cartItem.price * cartItem.quantity).toFixed(0)}
                        </span>
                    </div>
                ))}
             </div>

             <div className="border-t-2 border-black pt-4">
                 <div className="flex justify-between items-end mb-1">
                     <span className="font-bold text-gray-500 uppercase text-xs">Total ({menuData.originalCurrency || 'Origin'})</span>
                     <span className="font-black text-2xl text-gray-900">{totalPrice}</span>
                 </div>
                 <div className="flex justify-between items-center">
                     <span className="font-bold text-gray-400 uppercase text-xs">Est. ({menuData.targetCurrency || 'Target'})</span>
                     <span className="font-bold text-sausage-600">≈ {totalConverted.toFixed(0)}</span>
                 </div>
             </div>
             
             {personCount > 1 && (
                <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                    <span className="text-xs font-bold text-gray-500">Split ({personCount})</span>
                    <span className="font-black text-lg text-sausage-700">
                        {Math.ceil(totalPrice / personCount)} <span className="text-xs text-gray-400">/ person</span>
                    </span>
                </div>
             )}
             <div className="absolute bottom-0 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_50%,#fff_50%)] bg-[length:16px_16px] mb-[-4px]"></div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center gap-2 mb-3 text-sausage-800 font-bold">
                  <Users size={18} /> Split Bill
              </div>
              <div className="flex items-center justify-between bg-gray-50 p-1 rounded-xl">
                  <button 
                    onClick={() => setPersonCount(Math.max(1, personCount - 1))}
                    className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center font-bold text-gray-600 active:scale-95 transition-transform"
                  >
                      -
                  </button>
                  <span className="font-black text-xl text-gray-800">{personCount}</span>
                  <button 
                    onClick={() => setPersonCount(personCount + 1)}
                    className="w-10 h-10 bg-sausage-600 text-white rounded-lg shadow-sm flex items-center justify-center font-bold active:scale-95 transition-transform"
                  >
                      +
                  </button>
              </div>
          </div>
        </div>

        <div className="bg-white p-4 border-t border-gray-200 grid grid-cols-2 gap-3 safe-area-bottom">
          <button 
            onClick={handleShare}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold gap-1"
          >
            <Download size={20} />
            <span className="text-xs">Save Image</span>
          </button>
          
          <button 
            onClick={onFinish}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-sausage-600 text-white hover:bg-sausage-700 font-bold gap-1 shadow-md"
          >
            <Home size={20} />
            <span className="text-xs">Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ArrowLeft, Trash2, Calendar, ShoppingBag } from 'lucide-react';
import { HistoryRecord } from '../types';
import { SausageDogLogo, PawPrint } from './DachshundAssets';

interface HistoryPageProps {
  history: HistoryRecord[];
  onBack: () => void;
  onDelete: (id: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ history, onBack, onDelete }) => {
  return (
    <div className="flex flex-col h-full bg-sausage-50 relative overflow-hidden">
      <PawPrint className="absolute top-20 right-[-20px] w-40 h-40 text-sausage-100 opacity-50 rotate-12" />

      <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={onBack} className="p-2 text-sausage-800 hover:bg-sausage-50 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h2 className="font-black text-sausage-900 text-xl">Order History</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-sausage-400 opacity-70">
            <SausageDogLogo className="w-32 h-20 mb-4 grayscale opacity-50" />
            <p className="font-bold">No orders yet!</p>
          </div>
        ) : (
          history.map((record) => (
            <div key={record.id} className="bg-white rounded-2xl p-4 shadow-sm border border-sausage-100 relative z-10">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 text-sausage-600 text-sm font-bold">
                  <Calendar size={14} />
                  {new Date(record.timestamp).toLocaleString()}
                </div>
                <button 
                  onClick={() => onDelete(record.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-2 mb-3">
                {record.items.map((cartItem, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                        {/* 修正：使用扁平化屬性 .name 或 .originalName */}
                        <div className="flex flex-col">
                            <span className="text-gray-800 font-medium truncate max-w-[200px]">
                                {cartItem.name}
                            </span>
                            {/* 如果有名稱不同，顯示原文 */}
                            {cartItem.originalName && cartItem.originalName !== cartItem.name && (
                                <span className="text-xs text-gray-400">{cartItem.originalName}</span>
                            )}
                        </div>
                        <span className="text-sausage-800 font-bold">x{cartItem.quantity}</span>
                    </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center">
                <div className="flex items-center gap-1 text-sausage-700 text-xs font-bold bg-sausage-50 px-2 py-1 rounded">
                    <ShoppingBag size={12} /> {record.items.reduce((s, i) => s + i.quantity, 0)} Items
                </div>
                <div className="text-xl font-black text-sausage-900">
                    {record.totalOriginalPrice} {record.currency}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

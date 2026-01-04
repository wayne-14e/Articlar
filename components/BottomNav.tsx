
import React from 'react';
import { View } from '../types';
import { NAVIGATION_ITEMS } from '../constants';

interface BottomNavProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setCurrentView }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700 shadow-lg">
      <div className="container mx-auto flex justify-around max-w-lg">
        {NAVIGATION_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex flex-col items-center justify-center w-full py-3 text-sm transition-colors duration-200 ${
              currentView === item.id
                ? 'text-rose-500'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            {item.icon}
            <span className="mt-1 font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
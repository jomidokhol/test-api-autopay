
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <div className={`fixed left-1/2 -translate-x-1/2 bg-[#333] text-white px-6 py-4 rounded-[15px] text-[13px] transition-all duration-500 z-[10000] w-[85%] max-w-[400px] text-center shadow-xl ${
      isVisible ? 'bottom-[30px]' : 'bottom-[-150px]'
    }`}>
      {message}
    </div>
  );
};

export default Toast;

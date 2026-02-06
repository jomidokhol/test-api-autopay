
import React, { useEffect, useState } from 'react';

const Loader: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white flex flex-col justify-center items-center z-[9999] transition-opacity duration-500">
      <img 
        src="https://i.ibb.co.com/ZpYtjLT8/1000043015-removebg-preview.png" 
        className="w-[120px] mb-5 animate-pulse-custom" 
        alt="Logo" 
      />
      <div className="w-10 h-10 border-4 border-gray-100 border-t-[#10b981] rounded-full animate-spin"></div>
    </div>
  );
};

export default Loader;


import { useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PremiumButton = ({ isRTL }) => {
  const btnRef = useRef(null);

  const handleMove = (e) => {
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    btnRef.current.style.transform = `translate(${x * 0.15}px, ${y * 0.25}px)`;
  };

  const reset = () => {
    btnRef.current.style.transform = `translate(0,0)`;
  };

  return (
    <div className="mt-20 flex justify-center px-4">
      <Link
        to="/portfolio"
        ref={btnRef}
        onMouseMove={handleMove}
        onMouseLeave={reset}
        className="premium-btn relative overflow-hidden
                   w-full sm:w-auto max-w-xs sm:max-w-none
                   px-8 sm:px-14 py-4 sm:py-6
                   text-xs sm:text-sm tracking-widest uppercase
                   flex items-center justify-center gap-3
                   border border-[#2563EB]/50 text-[#2563EB]"
      >
        {/* Text */}
        <span className="relative z-10 transition duration-500 group-hover:text-black">
          {isRTL ? 'استكشف الأعمال' : 'Explore Projects'}
        </span>

        <ArrowUpRight className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />

        {/* Glow */}
        <span className="absolute inset-0 glow-layer" />

        {/* Shine sweep */}
        <span className="shine-layer" />

      </Link>
    </div>
  );
};

export default PremiumButton;


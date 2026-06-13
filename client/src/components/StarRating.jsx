import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { gsap } from 'gsap';

/**
 * Luxury Star Rating Component
 * Interactive gold stars with smooth animations
 */
const StarRating = ({ 
  value = 0, 
  onChange, 
  label, 
  disabled = false,
  size = 'md' 
}) => {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const starSize = sizeClasses[size] || sizeClasses.md;

  useEffect(() => {
    if (value > 0 && !isAnimating) {
      setIsAnimating(true);
      const stars = document.querySelectorAll(`[data-star-index]`);
      stars.forEach((star, index) => {
        if (index < value) {
          gsap.fromTo(
            star,
            { scale: 0, opacity: 0 },
            { 
              scale: 1, 
              opacity: 1, 
              duration: 0.3, 
              delay: index * 0.05,
              ease: 'back.out(1.7)'
            }
          );
        }
      });
      setTimeout(() => setIsAnimating(false), 500);
    }
  }, [value]);

  const handleStarClick = (rating) => {
    if (!disabled && onChange) {
      onChange(rating);
    }
  };

  const handleStarHover = (rating) => {
    if (!disabled) {
      setHoveredStar(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoveredStar(0);
    }
  };

  const getStarColor = (index) => {
    const activeValue = hoveredStar || value;
    if (index <= activeValue) {
      return 'text-[#d4af37] fill-[#d4af37]';
    }
    return 'text-white/20 fill-white/10';
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-light text-white/60 tracking-wide uppercase mb-3">
          {label}
        </label>
      )}
      <div 
        className="flex items-center gap-2"
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            data-star-index={star}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            disabled={disabled}
            className={`
              ${starSize}
              ${getStarColor(star)}
              transition-all duration-300
              ${!disabled ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}
              ${star <= (hoveredStar || value) ? 'drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]' : ''}
            `}
          >
            <Star className="w-full h-full" />
          </button>
        ))}
        {(hoveredStar || value) > 0 && (
          <span className="ml-2 text-sm font-light text-white/50">
            {hoveredStar || value} / 5
          </span>
        )}
      </div>
    </div>
  );
};

export default StarRating;


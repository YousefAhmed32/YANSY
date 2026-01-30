import { useEffect, useState, useRef } from 'react';
import { Star, Quote } from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';
import { gsap } from 'gsap';

/**
 * Public Testimonials Component
 * Displays highlighted 4-5 star reviews
 */
const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (containerRef.current && titleRef.current && testimonials.length > 0) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.1 }
      );
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.1, delay: 0.3 }
      );
    }
  }, [testimonials]);

  const fetchTestimonials = async () => {
    try {
      const response = await api.get('/feedback/testimonials?limit=6');
      setTestimonials(response.data.testimonials || []);
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < rating; i++) {
      stars.push(
        <Star key={i} className="w-5 h-5 text-[#d4af37] fill-[#d4af37]" />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-black via-black to-white/5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 
            ref={titleRef}
            className="text-4xl md:text-5xl font-light tracking-tight mb-4 text-white/90"
          >
            What Clients Say
          </h2>
          <p className="text-lg font-light text-white/50">
            Real feedback from our satisfied clients
          </p>
        </div>

        {/* Testimonials Grid */}
        <div 
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial) => {
            const avgRating = (
              (testimonial.ratings.quality + testimonial.ratings.speed + 
               testimonial.ratings.communication + testimonial.ratings.professionalism + 
               testimonial.ratings.overall) / 5
            ).toFixed(1);

            return (
              <div
                key={testimonial._id}
                className="bg-white/5 border border-white/10 p-8 hover:bg-white/10 hover:border-[#d4af37]/50 transition-all duration-500 group"
              >
                {/* Quote Icon */}
                <div className="mb-4">
                  <Quote className="w-8 h-8 text-[#d4af37]/50 group-hover:text-[#d4af37] transition-colors duration-500" />
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  {renderStars(testimonial.ratings.overall)}
                  <span className="text-sm font-light text-white/60 ml-2">
                    {avgRating} / 5
                  </span>
                </div>

                {/* Review Text */}
                {testimonial.reviewText && (
                  <p className="text-white/80 font-light mb-6 leading-relaxed line-clamp-4">
                    {testimonial.reviewText}
                  </p>
                )}

                {/* Author & Project */}
                <div className="pt-6 border-t border-white/10">
                  <p className="text-white/90 font-light mb-1">
                    {testimonial.name}
                  </p>
                  {testimonial.projectTitle && (
                    <p className="text-sm text-white/50 font-light">
                      {testimonial.projectTitle}
                    </p>
                  )}
                  <p className="text-xs text-white/40 font-light mt-2">
                    {format(new Date(testimonial.createdAt), 'MMMM yyyy')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;


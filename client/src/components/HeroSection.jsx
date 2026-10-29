import { forwardRef } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import DesktopHeroSection from './DesktopHeroSection';
import MobileHeroSection from './MobileHeroSection';

// Desktop/tablet retain the original artwork and copy. Only phones use the new composition.
const HeroSection = forwardRef(function HeroSection(props, ref) {
  const isMobile = useIsMobile();
  return isMobile ? <MobileHeroSection {...props} ref={ref} /> : <DesktopHeroSection {...props} ref={ref} />;
});

export default HeroSection;

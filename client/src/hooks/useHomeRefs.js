
import { useRef } from 'react';

export const useHomeRefs = () => {
  // Sections — كل section ليها اسم واضح
  const s = useRef({
    about       : null,
    team        : null,
    process     : null,
    ecommerce   : null,
    works       : null,
    saas        : null,
    
    tech        : null,
   
    servicesGrid: null,
    contact     : null,
  });

  // Images
  const imgs = useRef({
    hero      : null,
    ecommerce : null,
    saas      : null,
  });

  // Text elements (still indexed but clearly documented)
  const tx = useRef({
    // About section
    aboutTitle    : null,
    aboutDesc     : null,
    aboutServices : null,
    // E-commerce section
    ecomTitle  : null,
    ecomDesc   : null,
    ecomFeats  : null,
    // SaaS pinned
    saasTitle  : null,
    saasSub    : null,

    // Services grid items (array)
    gridItems  : [],
  });

  // Team cards
  const team = useRef([]);

  // Works cards
  const works = useRef([]);

  // Tech cards
  const techCards = useRef([]);

  // Process nodes
  const process = useRef([]);

  // Slide container


  return { s, imgs, tx, team, works, techCards, process };
};
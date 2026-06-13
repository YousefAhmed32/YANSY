
import { useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useHomeGSAP = ({ s, imgs, tx, team, works, techCards, process, isRTL, language, containerRef }) => {

  useLayoutEffect(() => {
    // Respect prefers-reduced-motion — skip all GSAP animations if enabled
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      // Make all GSAP-animated elements visible immediately
      if (containerRef.current) {
        const animatedEls = containerRef.current.querySelectorAll('[class*="opacity-0"]');
        animatedEls.forEach((el) => {
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
      }
      return;
    }

    let ctx = null;
    const tid = setTimeout(() => {
      if (!containerRef.current) return;

      ctx = gsap.context(() => {

        /* ── 1. ABOUT ─────────────────────────────────────────── */
        if (s.current.about) {
          gsap.fromTo(
            [tx.current.aboutTitle, tx.current.aboutDesc, tx.current.aboutServices].filter(Boolean),
            { opacity: 0, y: 30 },
            {
              opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power2.out',
              immediateRender: false,
              clearProps: 'all',
              scrollTrigger: { trigger: s.current.about, start: 'top 85%', once: true },
            }
          );
        }

        /* ── 2. TEAM ──────────────────────────────────────────── */
        if (s.current.team && team.current.length > 0) {
          gsap.fromTo(
            team.current.filter(Boolean),
            { opacity: 0, y: 40 },
            {
              opacity: 1, y: 0, duration: 0.9, stagger: 0.15, ease: 'power2.out',
              immediateRender: false, clearProps: 'all',
              scrollTrigger: { trigger: s.current.team, start: 'top 85%', once: true },
            }
          );
        }

        /* ── 3. PROCESS ───────────────────────────────────────── */
        if (s.current.process && process.current.length > 0) {
          const line = s.current.process.querySelector('[data-process-line]');
          if (line) {
            gsap.fromTo(line,
              { scaleX: 0 },
              {
                scaleX: 1, duration: 1.5, ease: 'power2.out',
                immediateRender: false, clearProps: 'scaleX',
                scrollTrigger: { trigger: s.current.process, start: 'top 85%', once: true },
              }
            );
          }
          gsap.fromTo(
            process.current.filter(Boolean),
            { opacity: 0, y: 30 },
            {
              opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out',
              immediateRender: false, clearProps: 'all',
              scrollTrigger: { trigger: s.current.process, start: 'top 85%', once: true },
            }
          );
        }

        /* ── 4. E-COMMERCE SIDE-BY-SIDE ───────────────────────── */
        if (s.current.ecommerce && imgs.current.ecommerce) {
          const textXFrom  = isRTL ?  40 : -40;
          const imageXFrom = isRTL ? -40 :  40;
          gsap.fromTo(
            [tx.current.ecomTitle, tx.current.ecomDesc, tx.current.ecomFeats].filter(Boolean),
            { opacity: 0, x: textXFrom },
            {
              opacity: 1, x: 0, duration: 0.8, stagger: 0.08, ease: 'power2.out',
              immediateRender: false, clearProps: 'all',
              scrollTrigger: { trigger: s.current.ecommerce, start: 'top 85%', once: true },
            }
          );
          gsap.fromTo(imgs.current.ecommerce,
            { opacity: 0, x: imageXFrom, scale: 0.98 },
            {
              opacity: 1, x: 0, scale: 1, duration: 1, ease: 'power2.out',
              immediateRender: false, clearProps: 'all',
              scrollTrigger: { trigger: s.current.ecommerce, start: 'top 85%', once: true },
            }
          );
        }

        /* ── 5. WORKS / CASE STUDIES ──────────────────────────── */
        if (s.current.works && works.current.length > 0) {
          works.current.forEach((work) => {
            if (!work) return;
            const wImg   = work.querySelector('[data-work-image]');
            const wTitle = work.querySelector('[data-work-title]');
            const wDesc  = work.querySelector('[data-work-desc]');
            /* Use once:true instead of scrub — prevents content from being hidden
               if user scrolls past trigger before GSAP fires                       */
            const trigger = { trigger: work, start: 'top 85%', once: true };
            if (wTitle) gsap.fromTo(wTitle,
              { opacity: 0, y: 30 },
              { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', immediateRender: false, clearProps: 'all', scrollTrigger: trigger }
            );
            if (wDesc) gsap.fromTo(wDesc,
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.6, delay: 0.1, ease: 'power2.out', immediateRender: false, clearProps: 'all', scrollTrigger: trigger }
            );
            if (wImg) gsap.fromTo(wImg,
              { opacity: 0, scale: 0.98 },
              { opacity: 1, scale: 1, duration: 0.8, delay: 0.05, ease: 'power2.out', immediateRender: false, clearProps: 'all', scrollTrigger: trigger }
            );
          });
        }

        /* ── 6. SAAS PINNED NARRATIVE ─────────────────────────── */
        if (s.current.saas && imgs.current.saas) {
          const pTl = gsap.timeline({
            scrollTrigger: {
              trigger: s.current.saas, start: 'top top', end: '+=180%',
              scrub: 1.5, pin: true, anticipatePin: 1,
            },
          });
          pTl
            .fromTo(
              [tx.current.saasTitle, tx.current.saasSub].filter(Boolean),
              { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 }
            )
            .to([tx.current.saasTitle, tx.current.saasSub].filter(Boolean), { opacity: 1, duration: 0.3 })
            .to([tx.current.saasTitle, tx.current.saasSub].filter(Boolean), { opacity: 0, y: -30, duration: 0.4 }, '+=0.2')
            .to(imgs.current.saas, { scale: 1.04, y: '-5%', duration: 0.5, ease: 'power1.out' }, '-=0.1');
        }

        /* ── 7. TECH CARDS ────────────────────────────────────── */
        if (s.current.tech && techCards.current.length > 0) {
          gsap.fromTo(
            techCards.current.filter(Boolean),
            { opacity: 0, y: 28 },
            {
              opacity: 1, y: 0, duration: 0.65, stagger: 0.06, ease: 'power2.out',
              immediateRender: false, clearProps: 'all',
              scrollTrigger: { trigger: s.current.tech, start: 'top 85%', once: true },
            }
          );
        }

        /* ── 8. SPLIT SCREEN ──────────────────────────────────── */
        if (s.current.split) {
          const lX = isRTL ?  40 : -40;
          const rX = isRTL ? -40 :  40;
          const sTl = gsap.timeline({
            scrollTrigger: {
              trigger: s.current.split, start: 'top top', end: '+=160%',
              scrub: 1.5, pin: true, anticipatePin: 1,
            },
          });
          /* Split section uses scrub — content is decorative; fallback not critical */
          sTl
            .fromTo(tx.current.splitLeft,  { opacity: 0, x: lX }, { opacity: 1, x: 0, duration: 0.5 })
            .fromTo(tx.current.splitRight, { opacity: 0, x: rX }, { opacity: 1, x: 0, duration: 0.5 }, '-=0.3')
            .to([tx.current.splitLeft, tx.current.splitRight], { opacity: 1, duration: 0.3 })
            .to([tx.current.splitLeft, tx.current.splitRight], { opacity: 0, y: -30, duration: 0.4 }, '+=0.2');
        }

        /* ── 9. SERVICES GRID ─────────────────────────────────── */
        if (s.current.servicesGrid) {
          const items = tx.current.gridItems.filter(Boolean);
          if (items.length > 0) {
            gsap.fromTo(
              items,
              { opacity: 0, y: 36 },
              {
                opacity: 1, y: 0, duration: 0.7, stagger: 0.07, ease: 'power2.out',
                immediateRender: false, clearProps: 'all',
                scrollTrigger: { trigger: s.current.servicesGrid, start: 'top 85%', once: true },
              }
            );
          }
        }

        ScrollTrigger.refresh();
      }, containerRef);
    }, 50);

    return () => {
      clearTimeout(tid);
      ctx?.revert();
    };
  }, [language, isRTL]);
};
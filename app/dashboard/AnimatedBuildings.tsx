"use client"
import React, { useEffect, useState, useRef } from 'react'
import { motion, SVGMotionProps, AnimatePresence } from 'framer-motion'
import { Building2 } from 'lucide-react'

// Animation timing
const totalAnimationTime = 2.2; // Total time for icons
const lineDrawDuration = 4.2; // Increased from 2.7s to 4.2s for slower line
const centralIconAnimationDuration = 1.5; // Reduced from 1.8s to 1.5s for faster drawing
const finalPauseDuration = 3.5; // Increased from 2.5s to 3.5s for longer final view
const centralIconStartDelay = lineDrawDuration * 0.5; // Start at 50% of line duration (2.1s) instead of 70%
const totalAnimationDuration = centralIconStartDelay + centralIconAnimationDuration + finalPauseDuration;

// Icon sizing and baseline
const baselineY = 680;
const smallIconHeight = 24; // SVG height for small icons
const smallIconScale = 1.7;
const scaledSmallIconHeight = smallIconHeight * smallIconScale;
const smallIconTranslateY = baselineY - scaledSmallIconHeight;

// Utility pole specific positioning
const utilityPoleHeight = 24;
const utilityPoleScale = 2.2;
const utilityPoleTranslateY = baselineY - (utilityPoleHeight * utilityPoleScale);

const centralIconHeight = 24; // SVG height for central icon
const centralIconScale = 5.2;
const scaledCentralIconHeight = centralIconHeight * centralIconScale;
const svgWidth = 1600;
const svgHeight = 800;
const centerX = svgWidth / 2;
const centralIconX = centerX - (12 * centralIconScale); // 12 is half the icon width
const centralIconTranslateY = baselineY - scaledCentralIconHeight;

// Depth scaling factors
const getDepthScale = (distanceFromCenter: number) => {
  const maxDistance = svgWidth / 2;
  const normalizedDistance = Math.abs(distanceFromCenter) / maxDistance;
  return 1 - (normalizedDistance * 0.4); // Scale from 1.0 to 0.6
};

// Remove opacity scaling for cleaner look
const getDepthOpacity = () => 1;

// Debug logging
console.log('Central icon position:', { x: centralIconX, y: centralIconTranslateY, scale: centralIconScale });

// Icon component factories
const createIconComponents = (draw: any) => [
  // Building
  (key: number, custom: number, x: number, scale: number, customDraw?: any) => (
    <g key={`building-${key}`} transform={`translate(${x}, ${smallIconTranslateY}) scale(${smallIconScale * scale})`}>
      <motion.rect width="16" height="20" x="4" y="2" rx="2" ry="2" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M9 22v-4h6v4" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M8 6h.01" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M16 6h.01" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M12 6h.01" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M12 10h.01" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M12 14h.01" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  // Home
  (key: number, custom: number, x: number, scale: number, customDraw?: any) => (
    <g key={`home-${key}`} transform={`translate(${x}, ${smallIconTranslateY}) scale(${smallIconScale * scale})`}>
      <motion.path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  // Hospital
  (key: number, custom: number, x: number, scale: number, customDraw?: any) => (
    <g key={`hospital-${key}`} transform={`translate(${x}, ${smallIconTranslateY}) scale(${smallIconScale * scale})`}>
      <motion.path d="M12 6v4" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M14 14h-4" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M14 18h-4" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M14 8h-4" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  // Warehouse
  (key: number, custom: number, x: number, scale: number, customDraw?: any) => (
    <g key={`warehouse-${key}`} transform={`translate(${x}, ${smallIconTranslateY}) scale(${smallIconScale * scale})`}>
      <motion.path d="M18 21V10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.132-1.803l7.95-3.974a2 2 0 0 1 1.837 0l7.948 3.974A2 2 0 0 1 22 8z" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M6 13h12" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M6 17h12" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  // Store (correct SVG)
  (key: number, custom: number, x: number, scale: number, customDraw?: any) => (
    <g key={`store-${key}`} transform={`translate(${x}, ${smallIconTranslateY}) scale(${smallIconScale * scale})`}>
      <motion.path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M2 7h20" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2 2 0 0 1-2-2V7" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  // Church
  (key: number, custom: number, x: number, scale: number, customDraw?: any) => (
    <g key={`church-${key}`} transform={`translate(${x}, ${smallIconTranslateY}) scale(${smallIconScale * scale})`}>
      <motion.path d="M10 9h4" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M12 7v5" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M14 22v-4a2 2 0 0 0-4 0v4" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M18 22V5.618a1 1 0 0 0-.553-.894l-4.553-2.277a2 2 0 0 0-1.788 0L6.553 4.724A1 1 0 0 0 6 5.618V22" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="m18 7 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.618a1 1 0 0 1 .553-.894L6 7" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  // School (correct SVG)
  (key: number, custom: number, x: number, scale: number, customDraw?: any) => (
    <g key={`school-${key}`} transform={`translate(${x}, ${smallIconTranslateY}) scale(${smallIconScale * scale})`}>
      <motion.path d="M14 22v-4a2 2 0 1 0-4 0v4" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="m18 10 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.382a1 1 0 0 1 .553-.894L6 10" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M18 5v17" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="m4 6 7.106-3.553a2 2 0 0 1 1.788 0L20 6" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M6 5v17" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.circle cx="12" cy="9" r="2" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} />
    </g>
  ),
  // University (correct SVG)
  (key: number, custom: number, x: number, scale: number, customDraw?: any) => (
    <g key={`university-${key}`} transform={`translate(${x}, ${smallIconTranslateY}) scale(${smallIconScale * scale})`}>
      <motion.path d="M14 21v-3a2 2 0 0 0-4 0v3" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M18 12h.01" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M18 16h.01" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M22 7a1 1 0 0 0-1-1h-2a2 2 0 0 1-1.143-.359L13.143 2.36a2 2 0 0 0-2.286-.001L6.143 5.64A2 2 0 0 1 5 6H3a1 1 0 0 0-1 1v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2z" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M6 12h.01" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.path d="M6 16h.01" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <motion.circle cx="12" cy="10" r="2" variants={customDraw || draw} custom={custom} stroke="currentColor" strokeWidth={1.75} />
    </g>
  ),
];

// Add type for icon elements
type IconElement = React.ReactElement;

// Icon order: [Building, Home, Hospital, Warehouse, Store, Church, School, University]
const ICON_TYPES = {
  BUILDING: 0,
  HOME: 1,
  HOSPITAL: 2,
  WAREHOUSE: 3,
  STORE: 4,
  CHURCH: 5,
  SCHOOL: 6,
  UNIVERSITY: 7
} as const;

// Responsive icon count per side
function useIconCountPerSide() {
  const [count, setCount] = useState(13);
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 700) {
        setCount(6); // mobile
      } else if (window.innerWidth < 1100) {
        setCount(10); // tablet
      } else {
        setCount(13); // desktop
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return count;
}

// Animation variants
const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 1,
      duration: 0.5,
      ease: "easeOut"
    }
  })
};

const morphLeft = {
  initial: { x: 0, opacity: 1 },
  animate: { x: -120, opacity: 0, transition: { duration: 0.7, ease: "easeInOut" } },
};

const morphRight = {
  initial: { x: 0, opacity: 1 },
  animate: { x: 120, opacity: 0, transition: { duration: 0.7, ease: "easeInOut" } },
};

const reverlyAppear = {
  initial: { opacity: 0, x: 0 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// Shared text styles
const textStyle = {
  color: 'hsl(272 70% 47%)',
  fontWeight: 700,
  fontFamily: 'Poppins, sans-serif',
  fontSize: 40,
  letterSpacing: 0, // Adjusted for better letter alignment
};

// Container styles for consistent positioning
const morphContainerStyle = {
  position: 'relative' as const,
  width: '300px',
  height: '48px',
};

export function AnimatedBuildings({ onFinish }: { onFinish?: () => void }) {
  const [phase, setPhase] = useState<'initial' | 'morph' | 'final' | 'inverse' | 'moveToCorner'>('initial');
  const [logoDrawKey, setLogoDrawKey] = useState(0);
  const isMounted = useRef(true);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Handle phase transitions, including new 'moveToCorner' phase
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === 'initial') {
      timer = setTimeout(() => setPhase('morph'), 2000);
    } else if (phase === 'morph') {
      timer = setTimeout(() => setPhase('final'), 800);
    } else if (phase === 'final') {
      timer = setTimeout(() => setPhase('inverse'), 500); // 0.5s for final phase
    } else if (phase === 'inverse') {
      timer = setTimeout(() => setPhase('moveToCorner'), 500); // 0.5s for inverse
    } else if (phase === 'moveToCorner') {
      // Trigger onFinish (fade out) 0.67s after moveToCorner starts, so fade out overlaps with move animation
      const fadeOutTimer = setTimeout(() => {
        if (onFinish) onFinish();
      }, 670); // 0.67s after moveToCorner starts
      // Clean up timer if unmounted or phase changes
      return () => clearTimeout(fadeOutTimer);
    }
    return () => clearTimeout(timer);
  }, [phase, onFinish]);

  // Dynamic colors for inverse/moveToCorner phase
  const isInverse = phase === 'inverse' || phase === 'moveToCorner';
  const bgColor = isInverse ? 'hsl(272 70% 47%)' : '#fefefe';
  const fgColor = isInverse ? '#fff' : 'hsl(272 70% 47%)';

  // Sidebar logo style reference
  const sidebarLogoStyle = {
    height: 64, // h-16
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 16, // px-4
    gap: 8, // space-x-2
    position: 'absolute' as const,
    top: 0,
    left: 0,
    zIndex: 100,
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      background: bgColor,
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 50,
      fontFamily: 'Poppins, sans-serif',
      transition: 'background 0.3s cubic-bezier(.4,0,.2,1)',
    }}>
      {/* Animated text container */}
      {phase !== 'moveToCorner' && (
        <div style={{
          position: 'relative',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: 1,
          zIndex: 10,
          width: '100%',
          flexDirection: 'column',
          textAlign: 'center',
          minHeight: 48,
          height: 48,
        }}>
          <AnimatePresence mode="wait">
            {phase === 'initial' && (
              <motion.div
                key="initial"
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                initial="hidden"
                animate="visible"
              >
                <motion.span
                  custom={0}
                  variants={textVariants}
                  style={textStyle}
                >
                  Real Estate.
                </motion.span>
                <motion.span
                  custom={1}
                  variants={textVariants}
                  style={textStyle}
                >
                  Cleverly.
                </motion.span>
              </motion.div>
            )}
            {phase === 'morph' && (
              <div
                key="morph"
                style={morphContainerStyle}
              >
                {/* R from Real Estate */}
                <motion.span
                  initial={{ x: -40 }}
                  animate={{ x: 70 }}
                  transition={{ duration: 0.7, ease: 'easeInOut' }}
                  style={{
                    ...textStyle,
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    zIndex: 3,
                    whiteSpace: 'nowrap',
                    paddingRight: '4px',
                  }}
                >
                  R
                </motion.span>

                {/* everly from Cleverly */}
                <motion.span
                  initial={{ x: +110 }}
                  animate={{ x: 21.5 }}
                  transition={{ duration: 0.7, ease: 'easeInOut' }}
                  style={{
                    ...textStyle,
                    position: 'absolute',
                    left: 70,
                    top: 0,
                    zIndex: 2,
                    whiteSpace: 'nowrap',
                    paddingLeft: '4px',
                  }}
                >
                  everly.
                </motion.span>

                {/* eal Estate mask, fade out during morph */}
                <motion.span
                  initial={{ x: -35, opacity: 1 }}
                  animate={{ x: 35, opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  style={{
                    ...textStyle,
                    position: 'absolute',
                    left: 20,
                    top: 0,
                    zIndex: 1,
                    whiteSpace: 'nowrap',
                    backgroundColor: '#fefefe',
                  }}
                >
                  eal Estate
                </motion.span>

                {/* Cl mask, fade out during morph */}
                <motion.span
                  initial={{ x: 65, opacity: 1 }}
                  animate={{ x: 20, opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  style={{
                    ...textStyle,
                    position: 'absolute',
                    left: 70,
                    top: 0,
                    zIndex: 1,
                    backgroundColor: '#fefefe',
                  }}
                >
                  Cl
                </motion.span>
              </div>
            )}
            {phase === 'final' && (
              <motion.div
                key="reverly"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0 }}
                style={morphContainerStyle}
              >
                <motion.span
                  style={{
                    ...textStyle,
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 4,
                  }}
                >
                  Reverly.
                </motion.span>
              </motion.div>
            )}
            {phase === 'inverse' && (
              <motion.div
                key="inverse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                style={morphContainerStyle}
              >
                <motion.span
                  style={{
                    ...textStyle,
                    color: fgColor,
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 4,
                  }}
                >
                  Reverly.
                </motion.span>
                {/* White Building2 icon, same size/position as SVG */}
                <Building2
                  size={110}
                  color="#fff"
                  style={{
                    position: 'absolute',
                    width: 220,
                    height: 110,
                    left: '50%',
                    top: 82, 
                    transform: 'translateX(-50%)',
                    display: 'block',
                    zIndex: 3,
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {/* Move to corner animation */}
      {phase === 'moveToCorner' && (
        <motion.div
          key="moveToCorner"
          initial={{
            top: '50%',
            left: '50%',
            x: '-50%',
            y: '-50%',
            scale: 1,
            background: 'transparent',
            color: fgColor,
            opacity: 1,
          }}
          animate={{
            top: 0,
            left: 0,
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
          }}
          transition={{
            duration: 0.9,
            ease: 'easeInOut',
          }}
          style={{
            ...sidebarLogoStyle,
            width: 'auto',
            background: 'transparent',
            color: fgColor,
          }}
        >
          <Building2
            size={32}
            color={fgColor}
            style={{ width: 32, height: 32, display: 'inline-block' }}
          />
          <span
            style={{
              fontWeight: 1000,
              fontSize: 24,
              letterSpacing: '-0.025em',
              color: fgColor,
              fontFamily: 'Poppins, sans-serif',
              marginLeft: 0,
              marginTop: 0,
              display: 'inline-block',
              verticalAlign: 'middle',
            }}
          >
            Reverly
          </span>
        </motion.div>
      )}
      {/* Central building icon only, centered (not shown during moveToCorner) */}
      {phase !== 'moveToCorner' && (
        <motion.svg
          key={logoDrawKey}
          width={220}
          height={110}
          viewBox={`0 0 24 24`}
          fill="none"
          style={{display: 'block', margin: '0 auto', color: fgColor, stroke: fgColor, transition: 'color 0.3s, stroke 0.3s'}}
          initial="hidden"
          animate="visible"
        >
          <motion.path 
            d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ pathLength: { duration: centralIconAnimationDuration }, opacity: { duration: 0.01 } }}
            stroke={fgColor}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: fgColor }}
          />
          <motion.path 
            d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ pathLength: { duration: centralIconAnimationDuration, delay: 0.1 }, opacity: { duration: 0.01, delay: 0.1 } }}
            stroke={fgColor}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: fgColor }}
          />
          <motion.path 
            d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ pathLength: { duration: centralIconAnimationDuration, delay: 0.2 }, opacity: { duration: 0.01, delay: 0.2 } }}
            stroke={fgColor}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: fgColor }}
          />
          <motion.path 
            d="M10 6h4" 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ pathLength: { duration: centralIconAnimationDuration, delay: 0.3 }, opacity: { duration: 0.01, delay: 0.3 } }}
            stroke={fgColor}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: fgColor }}
          />
          <motion.path 
            d="M10 10h4" 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ pathLength: { duration: centralIconAnimationDuration, delay: 0.4 }, opacity: { duration: 0.01, delay: 0.4 } }}
            stroke={fgColor}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: fgColor }}
          />
          <motion.path 
            d="M10 14h4" 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ pathLength: { duration: centralIconAnimationDuration, delay: 0.5 }, opacity: { duration: 0.01, delay: 0.5 } }}
            stroke={fgColor}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: fgColor }}
          />
          <motion.path 
            d="M10 18h4" 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ pathLength: { duration: centralIconAnimationDuration, delay: 0.6 }, opacity: { duration: 0.01, delay: 0.6 } }}
            stroke={fgColor}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: fgColor }}
          />
        </motion.svg>
      )}
    </div>
  );
}

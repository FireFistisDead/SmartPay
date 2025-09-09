import { useRef, useEffect, useState, useCallback } from "react";

interface ScrollMetrics {
  speed: number;
  direction: 'up' | 'down';
  acceleration: number;
  isScrolling: boolean;
}

interface AnimationConfig {
  duration: number;
  delay: number;
  stiffness: number;
  damping: number;
}

export function useSmartAnimations() {
  const [scrollMetrics, setScrollMetrics] = useState<ScrollMetrics>({
    speed: 0,
    direction: 'down',
    acceleration: 0,
    isScrolling: false
  });

  const scrollRef = useRef({ 
    lastY: 0, 
    lastTime: Date.now(), 
    velocities: [] as number[],
    timeout: null as NodeJS.Timeout | null 
  });

  const calculateAnimationConfig = useCallback((baseConfig: Partial<AnimationConfig> = {}): AnimationConfig => {
    const { speed, acceleration, isScrolling } = scrollMetrics;
    
    // Base configuration
    const base = {
      duration: 0.6,
      delay: 0,
      stiffness: 400,
      damping: 25,
      ...baseConfig
    };

    if (!isScrolling) {
      return base;
    }

    // Calculate speed factor (0.1 to 2.0)
    const speedFactor = Math.max(0.1, Math.min(2.0, speed / 1000));
    const accelerationFactor = Math.max(0.5, Math.min(1.5, 1 + acceleration / 2000));

    // Fast scrolling = shorter animations, slower scrolling = longer animations
    const dynamicDuration = base.duration * (2 - speedFactor) * accelerationFactor;
    const dynamicDelay = base.delay * (2 - speedFactor);

    // Higher stiffness for faster scrolling (more snappy)
    const dynamicStiffness = base.stiffness * (1 + speedFactor * 0.5);
    const dynamicDamping = base.damping * (1 + speedFactor * 0.3);

    return {
      duration: Math.max(0.2, Math.min(1.2, dynamicDuration)),
      delay: Math.max(0, Math.min(0.5, dynamicDelay)),
      stiffness: Math.max(200, Math.min(800, dynamicStiffness)),
      damping: Math.max(15, Math.min(40, dynamicDamping))
    };
  }, [scrollMetrics]);

  useEffect(() => {
    let rafId: number;

    const handleScroll = () => {
      const currentY = window.pageYOffset;
      const currentTime = Date.now();
      const deltaY = currentY - scrollRef.current.lastY;
      const deltaTime = currentTime - scrollRef.current.lastTime;
      
      if (deltaTime > 0) {
        const velocity = Math.abs(deltaY / deltaTime);
        
        // Keep track of recent velocities for acceleration calculation
        scrollRef.current.velocities.push(velocity);
        if (scrollRef.current.velocities.length > 5) {
          scrollRef.current.velocities.shift();
        }

        // Calculate acceleration
        const avgVelocity = scrollRef.current.velocities.reduce((a, b) => a + b, 0) / scrollRef.current.velocities.length;
        const acceleration = velocity - avgVelocity;

        setScrollMetrics({
          speed: velocity * 1000, // Convert to pixels per second
          direction: deltaY > 0 ? 'down' : 'up',
          acceleration: acceleration * 1000,
          isScrolling: true
        });

        scrollRef.current.lastY = currentY;
        scrollRef.current.lastTime = currentTime;
      }

      // Clear scrolling state after scroll ends
      if (scrollRef.current.timeout) {
        clearTimeout(scrollRef.current.timeout);
      }
      
      scrollRef.current.timeout = setTimeout(() => {
        setScrollMetrics(prev => ({ ...prev, isScrolling: false, speed: 0 }));
      }, 150);
    };

    const throttledScroll = () => {
      rafId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (rafId) cancelAnimationFrame(rafId);
      if (scrollRef.current.timeout) clearTimeout(scrollRef.current.timeout);
    };
  }, []);

  // Provide viewport-specific configurations
  const getViewportConfig = useCallback((options: {
    once?: boolean;
    margin?: string;
    threshold?: number;
  } = {}) => {
    const { speed } = scrollMetrics;
    
    return {
      once: options.once ?? true,
      margin: options.margin ?? (speed > 500 ? "-20%" : "-10%"),
      threshold: options.threshold ?? (speed > 500 ? 0.1 : 0.2)
    };
  }, [scrollMetrics]);

  return {
    scrollMetrics,
    calculateAnimationConfig,
    getViewportConfig,
    isSlowScrolling: scrollMetrics.speed < 200,
    isFastScrolling: scrollMetrics.speed > 800,
    scrollDirection: scrollMetrics.direction
  };
}

// Hook for cursor speed detection
export function useCursorSpeed() {
  const [cursorSpeed, setCursorSpeed] = useState(0);
  const cursorRef = useRef({ lastX: 0, lastY: 0, lastTime: Date.now() });

  useEffect(() => {
    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const currentTime = Date.now();
      const deltaX = e.clientX - cursorRef.current.lastX;
      const deltaY = e.clientY - cursorRef.current.lastY;
      const deltaTime = currentTime - cursorRef.current.lastTime;
      
      if (deltaTime > 0) {
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const speed = distance / deltaTime;
        
        setCursorSpeed(speed * 1000); // Convert to pixels per second
        
        cursorRef.current.lastX = e.clientX;
        cursorRef.current.lastY = e.clientY;
        cursorRef.current.lastTime = currentTime;
      }
    };

    const throttledMouseMove = (e: MouseEvent) => {
      rafId = requestAnimationFrame(() => handleMouseMove(e));
    };

    window.addEventListener('mousemove', throttledMouseMove, { passive: true });
    
    return () => {
      window.removeEventListener('mousemove', throttledMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return {
    cursorSpeed,
    isSlowCursor: cursorSpeed < 100,
    isFastCursor: cursorSpeed > 500
  };
}

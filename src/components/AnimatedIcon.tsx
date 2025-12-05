import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AnimatedIconProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  size?: number;
}

export function AnimatedIcon({ children, delay = 0, className = '', size = 24 }: AnimatedIconProps) {
  return (
    <motion.div
      className={className}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
        delay: delay,
      }}
      whileHover={{ 
        scale: 1.15,
        transition: { 
          type: 'spring',
          stiffness: 400,
          damping: 10
        }
      }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        animate={{ 
          y: [0, -3, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          repeatDelay: 2,
          ease: 'easeInOut',
        }}
        style={{ 
          fontSize: `${size}px`, 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}


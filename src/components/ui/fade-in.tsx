import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";
import { useInView } from "react-intersection-observer";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  className = "",
  direction = "up",
}: FadeInProps) {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const directionOffset = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
  };

  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...directionOffset[direction],
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: {
        delay,
        duration,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

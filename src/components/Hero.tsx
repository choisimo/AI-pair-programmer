import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Star, Code2, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function Hero() {
  const [stars, setStars] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    fetch("https://api.github.com/repos/facebook/react")
      .then((res) => res.json())
      .then((data) => setStars(data.stargazers_count))
      .catch(() => setStars(null));
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <motion.div
          className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </div>

      <div className="container px-4 md:px-6">
        <motion.div
          className="flex flex-col items-center space-y-8 text-center"
          initial="initial"
          animate="animate"
          variants={staggerChildren}
        >
          {/* Badge */}
          <motion.div variants={fadeIn}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium">
                AI-Powered Development
              </span>
            </div>
          </motion.div>

          {/* Main heading */}
          <motion.div className="space-y-4" variants={fadeIn}>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="block">Transform Your Code</span>
              <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent animate-gradient">
                With AI Intelligence
              </span>
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground text-lg md:text-xl leading-relaxed">
              Experience the future of software development with real-time AI
              assistance, intelligent code analysis, and seamless collaboration
              tools.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            variants={fadeIn}
          >
            <Button
              size="lg"
              className="group relative overflow-hidden"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() =>
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
              <motion.div
                className="absolute inset-0 bg-primary-foreground/10"
                initial={{ x: "-100%" }}
                animate={{ x: isHovered ? "0%" : "-100%" }}
                transition={{ duration: 0.3 }}
              />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="group"
              onClick={() => window.open("https://github.com", "_blank")}
            >
              <Github className="mr-2 h-4 w-4" />
              View on GitHub
              {stars && (
                <span className="ml-2 flex items-center gap-1 text-xs opacity-70">
                  <Star className="h-3 w-3 fill-current" />
                  {(stars / 1000).toFixed(1)}k
                </span>
              )}
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8"
            variants={fadeIn}
          >
            {[
              { icon: Code2, label: "Lines Analyzed", value: "10M+" },
              { icon: Zap, label: "Faster Development", value: "3x" },
              { icon: Star, label: "Developer Rating", value: "4.9/5" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <stat.icon className="h-8 w-8 text-primary" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary/50 rounded-full mt-2 animate-pulse" />
        </div>
      </motion.div>
    </section>
  );
}

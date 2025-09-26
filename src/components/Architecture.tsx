import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Brain,
  Monitor,
  ArrowRight,
  Server,
  Cpu,
  Network,
  Zap,
  Activity,
  Database,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState, useEffect } from "react";
import { FadeIn } from "@/components/ui/fade-in";
import architectureImage from "@/assets/architecture.jpg";

const modules = [
  {
    icon: Eye,
    title: "실시간 코드 감지 엔진",
    description: "File System Watcher",
    details:
      "watchdog 라이브러리를 활용하여 프로젝트 폴더 내 코드 파일의 변경을 실시간으로 감지합니다.",
    tech: ["Python watchdog", "Debouncing", "Event Handling"],
    color: "primary",
    metrics: { speed: "< 10ms", accuracy: "99.9%" },
  },
  {
    icon: Brain,
    title: "지능형 코드 분석기",
    description: "Intelligent Analyzer",
    details:
      "AST 파싱과 AI 모델을 활용하여 코드를 분석하고 개선안을 도출하는 시스템의 핵심 두뇌입니다.",
    tech: ["tree-sitter", "CodeBERT", "FAISS", "AST"],
    color: "accent",
    metrics: { processing: "< 500ms", models: "12" },
  },
  {
    icon: Monitor,
    title: "IDE 통합 인터페이스",
    description: "IDE Extension",
    details:
      "LSP를 통해 분석 결과를 VS Code, IntelliJ 등의 IDE에 자연스럽게 통합하여 표시합니다.",
    tech: ["LSP", "VS Code API", "JetBrains SDK"],
    color: "secondary",
    metrics: { compatibility: "15+ IDEs", latency: "< 50ms" },
  },
];

const dataFlowSteps = [
  {
    icon: Server,
    title: "코드 변경 감지",
    description: "파일 시스템 모니터링",
    color: "text-primary",
  },
  {
    icon: Brain,
    title: "AI 분석",
    description: "구문 분석 및 개선안 도출",
    color: "text-accent",
  },
  {
    icon: Network,
    title: "LSP 통신",
    description: "IDE 독립적 프로토콜",
    color: "text-secondary",
  },
  {
    icon: Monitor,
    title: "IDE 표시",
    description: "실시간 피드백 제공",
    color: "text-success",
  },
];

export const Architecture = () => {
  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [flowAnimation, setFlowAnimation] = useState(0);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Auto-cycle through data flow animation
  useEffect(() => {
    if (inView) {
      const interval = setInterval(() => {
        setFlowAnimation((prev) => (prev + 1) % 4);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [inView]);

  const getModuleColorClasses = (color: string) => {
    const colors = {
      primary: {
        card: "text-primary border-primary/20 bg-primary/5",
        glow: "shadow-primary/20",
        hover: "hover:border-primary/50 hover:shadow-primary/10",
      },
      accent: {
        card: "text-accent border-accent/20 bg-accent/5",
        glow: "shadow-accent/20",
        hover: "hover:border-accent/50 hover:shadow-accent/10",
      },
      secondary: {
        card: "text-secondary border-secondary/20 bg-secondary/5",
        glow: "shadow-secondary/20",
        hover: "hover:border-secondary/50 hover:shadow-secondary/10",
      },
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <section className="py-24 px-6 bg-muted/30 overflow-hidden" ref={ref}>
      <div className="container mx-auto">
        <FadeIn delay={0.2}>
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Badge
                variant="outline"
                className="border-accent/50 text-accent mb-4 hover:bg-accent/10 transition-colors"
              >
                <Cpu className="w-4 h-4 mr-2" />
                시스템 아키텍처
              </Badge>
            </motion.div>

            <motion.h2
              className="text-4xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="text-foreground">확장 가능한 </span>
              <span className="bg-gradient-secondary bg-clip-text text-transparent">
                모듈형 설계
              </span>
            </motion.h2>

            <motion.p
              className="text-xl text-muted-foreground max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              단방향 파이프라인 형태로 설계된 예측 가능하고 디버깅이 용이한
              구조를 통해 확장성과 유지보수성을 동시에 확보했습니다.
            </motion.p>
          </div>
        </FadeIn>

        {/* Architecture Diagram */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden group">
            <CardContent className="p-0 relative">
              <motion.img
                src={architectureImage}
                alt="AI 페어 프로그래머 시스템 아키텍처"
                className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                whileHover={{ scale: 1.02 }}
              />

              {/* Overlay with interactive hotspots */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent">
                {/* Interactive hotspot indicators */}
                <motion.div
                  className="absolute top-1/4 left-1/4 w-4 h-4 bg-primary rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                <motion.div
                  className="absolute top-1/2 left-1/2 w-4 h-4 bg-accent rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
                />

                <motion.div
                  className="absolute top-3/4 right-1/4 w-4 h-4 bg-secondary rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1.4 }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Modules Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {modules.map((module, index) => {
            const IconComponent = module.icon;
            const colorClasses = getModuleColorClasses(module.color);
            const isActive = activeModule === index;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                onHoverStart={() => setActiveModule(index)}
                onHoverEnd={() => setActiveModule(null)}
              >
                <Card
                  className={`group transition-all duration-300 border-border/50 ${colorClasses.hover} ${isActive ? colorClasses.glow + " shadow-lg" : ""}`}
                >
                  <CardHeader>
                    <motion.div
                      className={`w-12 h-12 rounded-xl border ${colorClasses.card} flex items-center justify-center mb-4 transition-all duration-300`}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        rotate: isActive ? 360 : 0,
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <IconComponent className="w-6 h-6" />
                    </motion.div>

                    <CardTitle className="text-lg group-hover:text-foreground transition-colors">
                      {module.title}
                    </CardTitle>

                    <CardDescription className="text-sm font-medium text-muted-foreground">
                      {module.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed">{module.details}</p>

                    {/* Performance Metrics */}
                    <motion.div
                      className="bg-background/50 rounded-lg p-3 border"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isActive ? 1 : 0.7 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex justify-between items-center text-xs">
                        {Object.entries(module.metrics).map(([key, value]) => (
                          <div key={key} className="text-center">
                            <div className="font-semibold text-foreground">
                              {value}
                            </div>
                            <div className="text-muted-foreground capitalize">
                              {key}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    <div className="flex flex-wrap gap-2">
                      {module.tech.map((tech, techIndex) => (
                        <motion.div
                          key={techIndex}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Badge
                            variant="outline"
                            className="text-xs hover:bg-background/80 transition-colors cursor-default"
                          >
                            {tech}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Enhanced Data Flow */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <Card className="bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 border-primary/20 overflow-hidden">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl mb-2 flex items-center justify-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                데이터 흐름
              </CardTitle>
              <CardDescription className="text-base">
                LSP(Language Server Protocol)를 통한 IDE 독립적 통신 구조
              </CardDescription>
            </CardHeader>

            <CardContent className="relative">
              {/* Background flow animation */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              <div className="flex items-center justify-center space-x-6 flex-wrap relative z-10">
                {dataFlowSteps.map((step, index) => {
                  const IconComponent = step.icon;
                  const isActive = flowAnimation === index;
                  const isHovered = hoveredStep === index;

                  return (
                    <div key={index} className="flex items-center space-x-6">
                      <motion.div
                        className="flex flex-col items-center space-y-2 group cursor-pointer"
                        onHoverStart={() => setHoveredStep(index)}
                        onHoverEnd={() => setHoveredStep(null)}
                        animate={{
                          scale: isActive || isHovered ? 1.1 : 1,
                          opacity: isActive ? 1 : 0.7,
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div
                          className={`w-12 h-12 rounded-full bg-background border-2 ${step.color} border-current flex items-center justify-center relative`}
                          animate={{
                            boxShadow: isActive
                              ? `0 0 20px ${
                                  step.color.includes("primary")
                                    ? "rgba(var(--primary), 0.5)"
                                    : step.color.includes("accent")
                                      ? "rgba(var(--accent), 0.5)"
                                      : step.color.includes("secondary")
                                        ? "rgba(var(--secondary), 0.5)"
                                        : "rgba(34, 197, 94, 0.5)"
                                }`
                              : "none",
                          }}
                        >
                          <motion.div
                            animate={{ rotate: isActive ? 360 : 0 }}
                            transition={{ duration: 1, ease: "easeInOut" }}
                          >
                            <IconComponent className="w-5 h-5" />
                          </motion.div>

                          {isActive && (
                            <motion.div
                              className="absolute inset-0 rounded-full border-2 border-current"
                              initial={{ scale: 1, opacity: 1 }}
                              animate={{ scale: 1.5, opacity: 0 }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                          )}
                        </motion.div>

                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {step.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {step.description}
                          </div>
                        </div>
                      </motion.div>

                      {index < dataFlowSteps.length - 1 && (
                        <motion.div
                          className="flex items-center"
                          animate={{
                            opacity: flowAnimation >= index ? 1 : 0.3,
                          }}
                        >
                          <motion.div
                            animate={{
                              x: flowAnimation === index ? [0, 10, 0] : 0,
                            }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                          >
                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                          </motion.div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Performance indicator */}
              <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <Badge variant="outline" className="bg-background/80">
                  <Zap className="w-3 h-3 mr-1" />
                  평균 처리 시간: 550ms
                </Badge>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Circle,
  Clock,
  Target,
  Rocket,
  Star,
  TrendingUp,
  Calendar,
  Users,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState, useEffect } from "react";
import { FadeIn } from "@/components/ui/fade-in";

const roadmapPhases = [
  {
    phase: "1단계",
    title: "MVP (Minimum Viable Product)",
    status: "active",
    progress: 60,
    timeline: "2024 Q1-Q2",
    features: [
      "Python 언어 지원",
      "실시간 코드 감지 엔진",
      "AST 파싱 및 분석",
      "API 일관성 검사",
      "VS Code 확장 프로그램",
      "기본 IDE 진단 표시",
    ],
    icon: Target,
    color: "primary",
    completedFeatures: 3,
    keyMetrics: { users: "500+", accuracy: "85%" },
  },
  {
    phase: "2단계",
    title: "핵심 기능 완성",
    status: "planned",
    progress: 0,
    timeline: "2024 Q3-Q4",
    features: [
      "자동 문서 업데이트 기능",
      "AI 추천 인프라 구축",
      "CodeBERT 모델 통합",
      "FAISS 벡터 검색",
      "JavaScript/TypeScript 지원",
      "기본 AI 코드 추천",
    ],
    icon: Rocket,
    color: "accent",
    completedFeatures: 0,
    keyMetrics: { users: "2K+", accuracy: "92%" },
  },
  {
    phase: "3단계",
    title: "고도화 및 확장",
    status: "future",
    progress: 0,
    timeline: "2025 Q1-Q2",
    features: [
      "AI 모델 파인튜닝",
      "보안 취약점 분석",
      "JetBrains IDE 지원",
      "다중 언어 지원 확장",
      "팀 협업 기능",
      "클라우드 분석 서비스",
    ],
    icon: Star,
    color: "secondary",
    completedFeatures: 0,
    keyMetrics: { users: "10K+", accuracy: "95%" },
  },
];

const statusConfig = {
  active: {
    icon: Clock,
    label: "진행 중",
    badgeVariant: "default" as const,
    cardClass: "border-primary/50 bg-primary/5",
    glowClass: "shadow-primary/20",
  },
  planned: {
    icon: Circle,
    label: "계획됨",
    badgeVariant: "outline" as const,
    cardClass: "border-accent/30",
    glowClass: "shadow-accent/10",
  },
  future: {
    icon: Circle,
    label: "예정",
    badgeVariant: "secondary" as const,
    cardClass: "border-border/30",
    glowClass: "shadow-secondary/10",
  },
};

const timelineData = [
  { period: "6개월", label: "MVP 완성", value: 6, color: "primary" },
  { period: "12개월", label: "핵심 기능", value: 12, color: "accent" },
  { period: "18개월", label: "완전체", value: 18, color: "secondary" },
];

export const Roadmap = () => {
  const [activePhase, setActivePhase] = useState<number | null>(null);
  const [animatedProgress, setAnimatedProgress] = useState<{
    [key: number]: number;
  }>({});

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Animate progress bars when in view
  useEffect(() => {
    if (inView) {
      roadmapPhases.forEach((phase, index) => {
        if (phase.progress > 0) {
          setTimeout(() => {
            setAnimatedProgress((prev) => ({
              ...prev,
              [index]: phase.progress,
            }));
          }, index * 200);
        }
      });
    }
  }, [inView]);

  const getPhaseColorClasses = (color: string) => {
    const colors = {
      primary: "border-primary/20 text-primary bg-primary/10",
      accent: "border-accent/20 text-accent bg-accent/10",
      secondary: "border-secondary/20 text-secondary bg-secondary/10",
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <section className="py-24 px-6 overflow-hidden" ref={ref}>
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
                className="border-secondary/50 text-secondary mb-4 hover:bg-secondary/10 transition-colors"
              >
                <Rocket className="w-4 h-4 mr-2" />
                개발 로드맵
              </Badge>
            </motion.div>

            <motion.h2
              className="text-4xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="text-foreground">체계적인 </span>
              <span className="bg-gradient-secondary bg-clip-text text-transparent">
                단계별 발전
              </span>
            </motion.h2>

            <motion.p
              className="text-xl text-muted-foreground max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              MVP부터 완성된 AI 페어 프로그래머까지, 명확한 단계별 목표와
              일정으로 지속적인 가치 전달을 보장합니다.
            </motion.p>
          </div>
        </FadeIn>

        <div className="space-y-8">
          {roadmapPhases.map((phase, index) => {
            const config = statusConfig[phase.status];
            const IconComponent = phase.icon;
            const StatusIcon = config.icon;
            const isActive = activePhase === index;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 + index * 0.2 }}
                onHoverStart={() => setActivePhase(index)}
                onHoverEnd={() => setActivePhase(null)}
              >
                <Card
                  className={`transition-all duration-300 hover:shadow-card ${config.cardClass} ${
                    isActive ? config.glowClass + " shadow-lg scale-[1.02]" : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <motion.div
                          className={`p-3 rounded-xl border bg-background/50 ${getPhaseColorClasses(phase.color)}`}
                          animate={{
                            scale: isActive ? 1.1 : 1,
                            rotate: isActive ? 360 : 0,
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          <IconComponent className="w-6 h-6" />
                        </motion.div>

                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-xl">
                              {phase.phase}: {phase.title}
                            </CardTitle>

                            <motion.div
                              animate={{
                                scale:
                                  phase.status === "active" ? [1, 1.1, 1] : 1,
                              }}
                              transition={{
                                duration: 2,
                                repeat:
                                  phase.status === "active" ? Infinity : 0,
                              }}
                            >
                              <Badge
                                variant={config.badgeVariant}
                                className="text-xs"
                              >
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {config.label}
                              </Badge>
                            </motion.div>
                          </div>

                          <CardDescription className="text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {phase.timeline}
                          </CardDescription>
                        </div>
                      </div>

                      {phase.status === "active" && (
                        <motion.div
                          className="min-w-[220px]"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.5 }}
                        >
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span>진행률</span>
                            <motion.span
                              className="font-medium"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 1 }}
                            >
                              {animatedProgress[index] || 0}%
                            </motion.span>
                          </div>
                          <Progress
                            value={animatedProgress[index] || 0}
                            className="h-2"
                          />

                          {/* Key metrics */}
                          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {phase.keyMetrics.users}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {phase.keyMetrics.accuracy}
                            </span>
                          </div>
                        </motion.div>
                      )}

                      {phase.status !== "active" && (
                        <motion.div
                          className="text-right"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: isActive ? 1 : 0.7 }}
                        >
                          <div className="text-sm font-medium flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            목표: {phase.keyMetrics.users}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                            <TrendingUp className="w-3 h-3" />
                            정확도: {phase.keyMetrics.accuracy}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {phase.features.map((feature, featureIndex) => {
                        const isCompleted =
                          featureIndex < phase.completedFeatures;

                        return (
                          <motion.div
                            key={featureIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={inView ? { opacity: 1, y: 0 } : {}}
                            transition={{
                              duration: 0.4,
                              delay: 0.5 + featureIndex * 0.1,
                            }}
                            className={`flex items-center gap-2 text-sm p-3 rounded-lg transition-all duration-300 ${
                              isCompleted
                                ? "bg-green-500/10 border border-green-500/30"
                                : "bg-background/30 border border-border/30 hover:bg-background/50"
                            }`}
                            whileHover={{ scale: 1.02 }}
                          >
                            <motion.div
                              animate={isCompleted ? { rotate: 360 } : {}}
                              transition={{ duration: 0.5 }}
                            >
                              {isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </motion.div>
                            <span
                              className={
                                isCompleted
                                  ? "text-green-700 dark:text-green-300"
                                  : ""
                              }
                            >
                              {feature}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Enhanced Timeline Summary */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <Card className="bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 border-primary/20 inline-block overflow-hidden">
            <CardContent className="p-8 relative">
              {/* Background animation */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-center gap-1 mb-4">
                  <Zap className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">개발 타임라인</h3>
                </div>

                <div className="flex items-center justify-center gap-8 text-sm">
                  {timelineData.map((item, index) => (
                    <motion.div
                      key={index}
                      className="text-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1.2 + index * 0.2 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <motion.div
                        className={`text-2xl font-bold mb-1 ${
                          item.color === "primary"
                            ? "text-primary"
                            : item.color === "accent"
                              ? "text-accent"
                              : "text-secondary"
                        }`}
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.7,
                        }}
                      >
                        {item.period}
                      </motion.div>
                      <div className="text-muted-foreground font-medium">
                        {item.label}
                      </div>

                      {/* Progress indicator */}
                      <motion.div
                        className="w-16 h-1 bg-border rounded-full mx-auto mt-2 overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 + index * 0.2 }}
                      >
                        <motion.div
                          className={`h-full rounded-full ${
                            item.color === "primary"
                              ? "bg-primary"
                              : item.color === "accent"
                                ? "bg-accent"
                                : "bg-secondary"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: index === 0 ? "60%" : "0%" }}
                          transition={{ duration: 1, delay: 2 + index * 0.2 }}
                        />
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

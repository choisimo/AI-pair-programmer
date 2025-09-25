import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCcw,
  FileText,
  Search,
  Monitor,
  CheckCircle,
  CheckCircle2,
  Brain,
  Zap,
  Shield,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const features = [
  {
    icon: RefreshCcw,
    title: "API 일관성 실시간 검사",
    description:
      "함수 시그니처 변경 시 모든 호출부의 일관성을 실시간으로 검증하여 잠재적 오류를 사전 방지합니다.",
    badge: "실시간",
    benefits: [
      "Smart completions",
      "Context awareness",
      "Learning from patterns",
    ],
  },
  {
    icon: FileText,
    title: "자동 문서 업데이트",
    description:
      "코드 변경 시 관련 주석과 문서를 AI가 자동으로 업데이트하여 문서와 코드의 완벽한 동기화를 보장합니다.",
    badge: "자동화",
    benefits: [
      "Real-time analysis",
      "Instant feedback",
      "Optimized performance",
    ],
  },
  {
    icon: Search,
    title: "AI 기반 코드 추천",
    description:
      "작성 중인 코드를 분석하여 전 세계 고품질 오픈소스 기반의 최적화된 코드 패턴을 추천합니다.",
    badge: "AI",
    benefits: ["E2E encryption", "Data privacy", "Compliance ready"],
  },
  {
    icon: Monitor,
    title: "IDE 통합 경험",
    description:
      "VS Code, IntelliJ 등 주요 IDE에 완벽 통합되어 개발 워크플로우를 방해하지 않는 자연스러운 경험을 제공합니다.",
    badge: "통합",
    benefits: ["Live sharing", "Pair programming", "Team insights"],
  },
];

export function Features() {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <section id="features" className="py-24 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      <div className="container px-4 md:px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 mb-16"
        >
          <Badge variant="outline" className="mb-4">
            <Sparkles className="mr-1 h-3 w-3" />
            핵심 기능
          </Badge>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            지능형{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              개발 동반자
            </span>
          </h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
            AI 페어 프로그래머는 개발자의 작업 흐름을 방해하지 않으면서도 코드
            품질 향상과 생산성 극대화를 동시에 실현합니다.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="relative h-full overflow-hidden border-muted hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <CardHeader className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative">
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: index * 0.1 + i * 0.05 }}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        {benefit}
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Benefits */}
        <div className="mt-16 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-2xl p-8 border border-primary/20">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <Shield className="w-8 h-8 text-primary mx-auto" />
              <h3 className="font-semibold">안정성 향상</h3>
              <p className="text-sm text-muted-foreground">
                잠재적 오류를 사전에 감지하여 코드 안정성을 크게 향상시킵니다.
              </p>
            </div>
            <div className="space-y-2">
              <Zap className="w-8 h-8 text-secondary mx-auto" />
              <h3 className="font-semibold">생산성 극대화</h3>
              <p className="text-sm text-muted-foreground">
                반복 작업을 자동화하여 핵심 로직 개발에 집중할 수 있습니다.
              </p>
            </div>
            <div className="space-y-2">
              <CheckCircle className="w-8 h-8 text-success mx-auto" />
              <h3 className="font-semibold">품질 보장</h3>
              <p className="text-sm text-muted-foreground">
                모범 사례 기반의 추천으로 일관된 고품질 코드를 유지합니다.
              </p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <p className="text-sm text-muted-foreground">
            더 많은 기능들이 곧 출시됩니다...
          </p>
        </motion.div>
      </div>
    </section>
  );
}

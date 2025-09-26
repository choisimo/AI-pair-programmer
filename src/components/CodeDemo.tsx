import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Code,
  PlayCircle,
  AlertTriangle,
  CheckCircle,
  FileText,
  Lightbulb,
  Copy,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState, useEffect } from "react";
import { FadeIn } from "@/components/ui/fade-in";
import aiAnalysisImage from "@/assets/ai-analysis.jpg";

const codeExample = `def calculate_user_score(user_id, metrics):
    """
    사용자 점수를 계산합니다.
    
    Args:
        user_id: 사용자 ID
        metrics: 평가 지표
    
    Returns:
        int: 계산된 점수
    """
    return sum(metrics) * user_id`;

const fixedCodeExample = `def calculate_user_score(user_id: str, metrics: List[float], weight: float = 1.0):
    """
    사용자 점수를 계산합니다.
    
    Args:
        user_id (str): 사용자 식별자
        metrics (List[float]): 평가 지표 리스트
        weight (float): 가중치 (기본값: 1.0)
    
    Returns:
        float: 계산된 가중 점수
    """
    if not metrics:
        return 0.0
    return sum(metrics) * weight`;

const analysisResults = [
  {
    type: "warning",
    icon: AlertTriangle,
    title: "타입 힌트 누락",
    message: "매개변수와 반환값에 타입 힌트가 없습니다.",
    color: "text-yellow-500",
  },
  {
    type: "info",
    icon: FileText,
    title: "문서 불일치",
    message: "주석의 매개변수 설명이 실제 코드와 일치하지 않습니다.",
    color: "text-blue-500",
  },
  {
    type: "suggestion",
    icon: Lightbulb,
    title: "개선 제안",
    message: "빈 리스트 처리와 가중치 매개변수 추가를 권장합니다.",
    color: "text-purple-500",
  },
];

const analysisSteps = [
  {
    id: 1,
    title: "코드 구조 분석",
    description: "AST를 통한 구문 분석 및 패턴 감지",
    color: "bg-primary/20 border-primary/30 text-primary",
    icon: Code,
  },
  {
    id: 2,
    title: "AI 모델 추론",
    description: "CodeBERT 기반 의미 분석 및 개선점 도출",
    color: "bg-accent/20 border-accent/30 text-accent",
    icon: Zap,
  },
  {
    id: 3,
    title: "실시간 피드백",
    description: "IDE 통합을 통한 즉시 개선안 제시",
    color: "bg-secondary/20 border-secondary/30 text-secondary",
    icon: Eye,
  },
];

export const CodeDemo = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [copiedCode, setCopiedCode] = useState<"before" | "after" | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<"before" | "after" | null>(
    null,
  );

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Auto-cycle through analysis steps
  useEffect(() => {
    if (inView) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % 3);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [inView]);

  // Auto-show analysis after delay
  useEffect(() => {
    if (inView) {
      const timer = setTimeout(() => setShowAnalysis(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [inView]);

  const copyToClipboard = async (code: string, type: "before" | "after") => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const simulateTyping = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
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
                className="border-primary/50 text-primary mb-4 hover:bg-primary/10 transition-colors"
              >
                <Code className="w-4 h-4 mr-2" />
                실시간 데모
              </Badge>
            </motion.div>

            <motion.h2
              className="text-4xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="text-foreground">AI가 </span>
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                실시간으로 분석
              </span>
            </motion.h2>

            <motion.p
              className="text-xl text-muted-foreground max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              코드 작성과 동시에 AI가 문제점을 감지하고 개선안을 제시하는 과정을
              확인해보세요.
            </motion.p>
          </div>
        </FadeIn>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            onHoverStart={() => setHoveredCard("before")}
            onHoverEnd={() => setHoveredCard(null)}
          >
            <Card className="border-border/50 hover:border-yellow-500/30 transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    분석 전 코드
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(codeExample, "before")}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copiedCode === "before" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-background rounded-lg p-4 font-mono text-sm border relative overflow-hidden">
                  <AnimatePresence>
                    {hoveredCard === "before" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-yellow-500/5 pointer-events-none"
                      />
                    )}
                  </AnimatePresence>
                  <pre className="whitespace-pre-wrap text-foreground">
                    <span className="text-code-keyword">def</span>{" "}
                    <span className="text-code-function">
                      calculate_user_score
                    </span>
                    (user_id, metrics):{"\n"}
                    <span className="text-code-comment"> """</span>
                    {"\n"}
                    <span className="text-code-comment">
                      {" "}
                      사용자 점수를 계산합니다.
                    </span>
                    {"\n"}
                    <span className="text-code-comment"> </span>
                    {"\n"}
                    <span className="text-code-comment"> Args:</span>
                    {"\n"}
                    <span className="text-code-comment">
                      {" "}
                      user_id: 사용자 ID
                    </span>
                    {"\n"}
                    <span className="text-code-comment">
                      {" "}
                      metrics: 평가 지표
                    </span>
                    {"\n"}
                    <span className="text-code-comment"> </span>
                    {"\n"}
                    <span className="text-code-comment"> Returns:</span>
                    {"\n"}
                    <span className="text-code-comment"> int: 계산된 점수</span>
                    {"\n"}
                    <span className="text-code-comment"> """</span>
                    {"\n"}
                    {"    "}
                    <span className="text-code-keyword">return</span>{" "}
                    sum(metrics) * user_id
                  </pre>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            onHoverStart={() => setHoveredCard("after")}
            onHoverEnd={() => setHoveredCard(null)}
          >
            <Card className="border-border/50 hover:border-green-500/30 transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    AI 개선 후 코드
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(fixedCodeExample, "after")}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copiedCode === "after" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-background rounded-lg p-4 font-mono text-sm border relative overflow-hidden">
                  <AnimatePresence>
                    {hoveredCard === "after" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-green-500/5 pointer-events-none"
                      />
                    )}
                  </AnimatePresence>
                  <pre className="whitespace-pre-wrap text-foreground">
                    <span className="text-code-keyword">def</span>{" "}
                    <span className="text-code-function">
                      calculate_user_score
                    </span>
                    (user_id: <span className="text-code-keyword">str</span>,
                    metrics: List[
                    <span className="text-code-keyword">float</span>], weight:{" "}
                    <span className="text-code-keyword">float</span> = 1.0):
                    {"\n"}
                    <span className="text-code-comment"> """</span>
                    {"\n"}
                    <span className="text-code-comment">
                      {" "}
                      사용자 점수를 계산합니다.
                    </span>
                    {"\n"}
                    <span className="text-code-comment"> </span>
                    {"\n"}
                    <span className="text-code-comment"> Args:</span>
                    {"\n"}
                    <span className="text-code-comment">
                      {" "}
                      user_id (str): 사용자 식별자
                    </span>
                    {"\n"}
                    <span className="text-code-comment">
                      {" "}
                      metrics (List[float]): 평가 지표 리스트
                    </span>
                    {"\n"}
                    <span className="text-code-comment">
                      {" "}
                      weight (float): 가중치 (기본값: 1.0)
                    </span>
                    {"\n"}
                    <span className="text-code-comment"> </span>
                    {"\n"}
                    <span className="text-code-comment"> Returns:</span>
                    {"\n"}
                    <span className="text-code-comment">
                      {" "}
                      float: 계산된 가중 점수
                    </span>
                    {"\n"}
                    <span className="text-code-comment"> """</span>
                    {"\n"}
                    {"    "}
                    <span className="text-code-keyword">if</span>{" "}
                    <span className="text-code-keyword">not</span> metrics:
                    {"\n"}
                    {"        "}
                    <span className="text-code-keyword">return</span> 0.0{"\n"}
                    {"    "}
                    <span className="text-code-keyword">return</span>{" "}
                    sum(metrics) * weight
                  </pre>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Analysis Results */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView && showAnalysis ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Card className="mb-12 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: showAnalysis ? 360 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <PlayCircle className="w-5 h-5 text-primary" />
                </motion.div>
                실시간 분석 결과
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisResults.map((result, index) => {
                  const IconComponent = result.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={showAnalysis ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30 hover:border-border/60 transition-colors group"
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        <IconComponent
                          className={`w-5 h-5 ${result.color} flex-shrink-0 mt-0.5`}
                        />
                      </motion.div>
                      <div>
                        <div className="font-medium text-sm group-hover:text-foreground transition-colors">
                          {result.title}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {result.message}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Analysis Visualization */}
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <h3 className="text-2xl font-bold mb-6">지능형 분석 과정</h3>
            <div className="space-y-6">
              {analysisSteps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = activeStep === index;

                return (
                  <motion.div
                    key={step.id}
                    className="flex items-center gap-4"
                    initial={{ opacity: 0.5 }}
                    animate={{
                      opacity: isActive ? 1 : 0.6,
                      scale: isActive ? 1.02 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${step.color}`}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        boxShadow: isActive
                          ? "0 0 20px rgba(var(--primary), 0.3)"
                          : "none",
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        animate={{ rotate: isActive ? 360 : 0 }}
                        transition={{
                          duration: isActive ? 2 : 0,
                          repeat: isActive ? Infinity : 0,
                          ease: "linear",
                        }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </motion.div>
                    </motion.div>
                    <div className="flex-1">
                      <div className="font-medium text-lg">{step.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {step.description}
                      </div>
                    </div>
                    {isActive && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3 }}
                        className="absolute left-0 bottom-0 h-0.5 bg-primary"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                className="mt-8 group relative overflow-hidden"
                onClick={simulateTyping}
                disabled={isTyping}
              >
                <motion.div
                  className="flex items-center"
                  animate={isTyping ? { opacity: [1, 0.5, 1] } : {}}
                  transition={{
                    duration: 0.5,
                    repeat: isTyping ? Infinity : 0,
                  }}
                >
                  <PlayCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  {isTyping ? "분석 중..." : "라이브 데모 체험"}
                </motion.div>
                {isTyping && (
                  <motion.div
                    className="absolute inset-0 bg-primary/20"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            <motion.img
              src={aiAnalysisImage}
              alt="AI 분석 과정 시각화"
              className="w-full h-auto rounded-xl shadow-elegant border border-primary/20"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent rounded-xl"
              animate={{
                background: [
                  "linear-gradient(to top, rgba(0,0,0,0.1), transparent)",
                  "linear-gradient(to top, rgba(0,0,0,0.05), transparent)",
                  "linear-gradient(to top, rgba(0,0,0,0.1), transparent)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            {/* Floating analysis indicators */}
            <AnimatePresence>
              {showAnalysis && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium"
                  >
                    ✓ 분석 완료
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: 0.5 }}
                    className="absolute bottom-4 left-4 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium"
                  >
                    3개 개선사항 발견
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

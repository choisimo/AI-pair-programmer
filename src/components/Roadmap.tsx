import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Circle, 
  Clock,
  Target,
  Rocket,
  Star
} from "lucide-react";

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
      "기본 IDE 진단 표시"
    ],
    icon: Target,
    color: "primary"
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
      "기본 AI 코드 추천"
    ],
    icon: Rocket,
    color: "accent"
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
      "클라우드 분석 서비스"
    ],
    icon: Star,
    color: "secondary"
  }
];

const statusConfig = {
  active: {
    icon: Clock,
    label: "진행 중",
    badgeVariant: "default" as const,
    cardClass: "border-primary/50 bg-primary/5"
  },
  planned: {
    icon: Circle,
    label: "계획됨",
    badgeVariant: "outline" as const,
    cardClass: "border-accent/30"
  },
  future: {
    icon: Circle,
    label: "예정",
    badgeVariant: "secondary" as const,
    cardClass: "border-border/30"
  }
};

export const Roadmap = () => {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-secondary/50 text-secondary mb-4">
            <Rocket className="w-4 h-4 mr-2" />
            개발 로드맵
          </Badge>
          <h2 className="text-4xl font-bold mb-6">
            <span className="text-foreground">체계적인 </span>
            <span className="bg-gradient-secondary bg-clip-text text-transparent">
              단계별 발전
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            MVP부터 완성된 AI 페어 프로그래머까지, 명확한 단계별 목표와 일정으로 
            지속적인 가치 전달을 보장합니다.
          </p>
        </div>

        <div className="space-y-8">
          {roadmapPhases.map((phase, index) => {
            const config = statusConfig[phase.status];
            const IconComponent = phase.icon;
            const StatusIcon = config.icon;
            
            return (
              <Card 
                key={index} 
                className={`transition-all duration-300 hover:shadow-card ${config.cardClass}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl border bg-background/50 ${
                        phase.color === 'primary' ? 'border-primary/20 text-primary' :
                        phase.color === 'accent' ? 'border-accent/20 text-accent' :
                        'border-secondary/20 text-secondary'
                      }`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-xl">{phase.phase}: {phase.title}</CardTitle>
                          <Badge variant={config.badgeVariant} className="text-xs">
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {phase.timeline}
                        </CardDescription>
                      </div>
                    </div>
                    
                    {phase.status === 'active' && (
                      <div className="min-w-[200px]">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>진행률</span>
                          <span className="font-medium">{phase.progress}%</span>
                        </div>
                        <Progress value={phase.progress} className="h-2" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {phase.features.map((feature, featureIndex) => (
                      <div 
                        key={featureIndex}
                        className="flex items-center gap-2 text-sm p-2 rounded-lg bg-background/30 border border-border/30"
                      >
                        {phase.status === 'active' && featureIndex < 3 ? (
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Timeline Summary */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 border-primary/20 inline-block">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-8 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">6개월</div>
                  <div className="text-muted-foreground">MVP 완성</div>
                </div>
                <div className="w-px h-8 bg-border"></div>
                <div className="text-center">
                  <div className="text-lg font-bold text-accent">12개월</div>
                  <div className="text-muted-foreground">핵심 기능</div>
                </div>
                <div className="w-px h-8 bg-border"></div>
                <div className="text-center">
                  <div className="text-lg font-bold text-secondary">18개월</div>
                  <div className="text-muted-foreground">완전체</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
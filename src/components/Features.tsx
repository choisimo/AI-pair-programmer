import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCcw, 
  FileText, 
  Search, 
  Monitor,
  CheckCircle,
  Brain,
  Zap,
  Shield
} from "lucide-react";

const features = [
  {
    icon: RefreshCcw,
    title: "API 일관성 실시간 검사",
    description: "함수 시그니처 변경 시 모든 호출부의 일관성을 실시간으로 검증하여 잠재적 오류를 사전 방지합니다.",
    badge: "실시간",
    color: "primary"
  },
  {
    icon: FileText,
    title: "자동 문서 업데이트",
    description: "코드 변경 시 관련 주석과 문서를 AI가 자동으로 업데이트하여 문서와 코드의 완벽한 동기화를 보장합니다.",
    badge: "자동화",
    color: "success"
  },
  {
    icon: Search,
    title: "AI 기반 코드 추천",
    description: "작성 중인 코드를 분석하여 전 세계 고품질 오픈소스 기반의 최적화된 코드 패턴을 추천합니다.",
    badge: "AI",
    color: "accent"
  },
  {
    icon: Monitor,
    title: "IDE 통합 경험",
    description: "VS Code, IntelliJ 등 주요 IDE에 완벽 통합되어 개발 워크플로우를 방해하지 않는 자연스러운 경험을 제공합니다.",
    badge: "통합",
    color: "secondary"
  }
];

export const Features = () => {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-primary/50 text-primary mb-4">
            <Brain className="w-4 h-4 mr-2" />
            핵심 기능
          </Badge>
          <h2 className="text-4xl font-bold mb-6">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              지능형 개발 동반자
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            AI 페어 프로그래머는 개발자의 작업 흐름을 방해하지 않으면서도 
            코드 품질 향상과 생산성 극대화를 동시에 실현합니다.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            const colorClass = {
              primary: "text-primary border-primary/20 bg-primary/5",
              success: "text-success border-success/20 bg-success/5",
              accent: "text-accent border-accent/20 bg-accent/5",
              secondary: "text-secondary border-secondary/20 bg-secondary/5"
            }[feature.color];
            
            return (
              <Card 
                key={index} 
                className="group hover:shadow-elegant transition-all duration-300 border-border/50 hover:border-primary/30 bg-card/50 backdrop-blur-sm"
              >
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-xl border ${colorClass} group-hover:shadow-glow transition-all duration-300`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Additional Benefits */}
        <div className="mt-16 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-2xl p-8 border border-primary/20">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <Shield className="w-8 h-8 text-primary mx-auto" />
              <h3 className="font-semibold">안정성 향상</h3>
              <p className="text-sm text-muted-foreground">잠재적 오류를 사전에 감지하여 코드 안정성을 크게 향상시킵니다.</p>
            </div>
            <div className="space-y-2">
              <Zap className="w-8 h-8 text-secondary mx-auto" />
              <h3 className="font-semibold">생산성 극대화</h3>
              <p className="text-sm text-muted-foreground">반복 작업을 자동화하여 핵심 로직 개발에 집중할 수 있습니다.</p>
            </div>
            <div className="space-y-2">
              <CheckCircle className="w-8 h-8 text-success mx-auto" />
              <h3 className="font-semibold">품질 보장</h3>
              <p className="text-sm text-muted-foreground">모범 사례 기반의 추천으로 일관된 고품질 코드를 유지합니다.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
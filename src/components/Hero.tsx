import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Brain, Zap } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-hero">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="border-primary/50 text-primary-glow">
                <Brain className="w-4 h-4 mr-2" />
                AI-Powered Development
              </Badge>
              
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  AI 페어
                </span>
                <br />
                <span className="text-foreground">프로그래머</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                실시간으로 코드를 분석하고 지능적인 피드백을 제공하는 혁신적인 개발 동반자. 
                API 일관성 검사부터 문서 자동 업데이트까지, 개발 생산성을 극대화합니다.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" className="group shadow-elegant hover:shadow-glow transition-all duration-300">
                <Code className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                시작하기
              </Button>
              <Button variant="outline" size="lg" className="border-primary/30 hover:border-primary">
                <Zap className="w-5 h-5 mr-2" />
                데모 보기
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">실시간</div>
                <div className="text-sm text-muted-foreground">코드 분석</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">자동</div>
                <div className="text-sm text-muted-foreground">문서 업데이트</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">AI</div>
                <div className="text-sm text-muted-foreground">코드 추천</div>
              </div>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-elegant border border-primary/20">
              <img 
                src={heroImage} 
                alt="AI 페어 프로그래머 인터페이스"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-primary/20 backdrop-blur-sm rounded-lg p-4 border border-primary/30">
              <div className="text-primary text-sm font-medium">실시간 분석</div>
              <div className="text-xs text-muted-foreground">100% 정확도</div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-success/20 backdrop-blur-sm rounded-lg p-4 border border-success/30">
              <div className="text-success text-sm font-medium">자동 업데이트</div>
              <div className="text-xs text-muted-foreground">문서 동기화</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
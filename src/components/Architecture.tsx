import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  Brain, 
  Monitor, 
  ArrowRight,
  Server,
  Cpu,
  Network
} from "lucide-react";
import architectureImage from "@/assets/architecture.jpg";

const modules = [
  {
    icon: Eye,
    title: "실시간 코드 감지 엔진",
    description: "File System Watcher",
    details: "watchdog 라이브러리를 활용하여 프로젝트 폴더 내 코드 파일의 변경을 실시간으로 감지합니다.",
    tech: ["Python watchdog", "Debouncing", "Event Handling"],
    color: "primary"
  },
  {
    icon: Brain,
    title: "지능형 코드 분석기",
    description: "Intelligent Analyzer",
    details: "AST 파싱과 AI 모델을 활용하여 코드를 분석하고 개선안을 도출하는 시스템의 핵심 두뇌입니다.",
    tech: ["tree-sitter", "CodeBERT", "FAISS", "AST"],
    color: "accent"
  },
  {
    icon: Monitor,
    title: "IDE 통합 인터페이스",
    description: "IDE Extension",
    details: "LSP를 통해 분석 결과를 VS Code, IntelliJ 등의 IDE에 자연스럽게 통합하여 표시합니다.",
    tech: ["LSP", "VS Code API", "JetBrains SDK"],
    color: "secondary"
  }
];

export const Architecture = () => {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-accent/50 text-accent mb-4">
            <Cpu className="w-4 h-4 mr-2" />
            시스템 아키텍처
          </Badge>
          <h2 className="text-4xl font-bold mb-6">
            <span className="text-foreground">확장 가능한 </span>
            <span className="bg-gradient-secondary bg-clip-text text-transparent">
              모듈형 설계
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            단방향 파이프라인 형태로 설계된 예측 가능하고 디버깅이 용이한 구조를 통해 
            확장성과 유지보수성을 동시에 확보했습니다.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="mb-16">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <img 
                src={architectureImage} 
                alt="AI 페어 프로그래머 시스템 아키텍처"
                className="w-full h-auto"
              />
            </CardContent>
          </Card>
        </div>

        {/* Modules Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {modules.map((module, index) => {
            const IconComponent = module.icon;
            const colorClass = {
              primary: "text-primary border-primary/20 bg-primary/5",
              accent: "text-accent border-accent/20 bg-accent/5",
              secondary: "text-secondary border-secondary/20 bg-secondary/5"
            }[module.color];

            return (
              <Card key={index} className="group hover:shadow-elegant transition-all duration-300 border-border/50 hover:border-primary/30">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl border ${colorClass} flex items-center justify-center mb-4 group-hover:shadow-glow transition-all duration-300`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription className="text-sm font-medium text-muted-foreground">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">{module.details}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {module.tech.map((tech, techIndex) => (
                      <Badge key={techIndex} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Data Flow */}
        <Card className="bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">데이터 흐름</CardTitle>
            <CardDescription className="text-base">
              LSP(Language Server Protocol)를 통한 IDE 독립적 통신 구조
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-4 flex-wrap">
              <div className="flex items-center space-x-2 text-sm">
                <Server className="w-4 h-4 text-primary" />
                <span>코드 변경 감지</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center space-x-2 text-sm">
                <Brain className="w-4 h-4 text-accent" />
                <span>AI 분석</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center space-x-2 text-sm">
                <Network className="w-4 h-4 text-secondary" />
                <span>LSP 통신</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center space-x-2 text-sm">
                <Monitor className="w-4 h-4 text-success" />
                <span>IDE 표시</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
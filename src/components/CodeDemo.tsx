import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Code, 
  PlayCircle, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Lightbulb
} from "lucide-react";
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
    color: "text-yellow-500"
  },
  {
    type: "info",
    icon: FileText,
    title: "문서 불일치",
    message: "주석의 매개변수 설명이 실제 코드와 일치하지 않습니다.",
    color: "text-blue-500"
  },
  {
    type: "suggestion",
    icon: Lightbulb,
    title: "개선 제안",
    message: "빈 리스트 처리와 가중치 매개변수 추가를 권장합니다.",
    color: "text-purple-500"
  }
];

export const CodeDemo = () => {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="border-primary/50 text-primary mb-4">
            <Code className="w-4 h-4 mr-2" />
            실시간 데모
          </Badge>
          <h2 className="text-4xl font-bold mb-6">
            <span className="text-foreground">AI가 </span>
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              실시간으로 분석
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            코드 작성과 동시에 AI가 문제점을 감지하고 개선안을 제시하는 과정을 확인해보세요.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Before */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                분석 전 코드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-background rounded-lg p-4 font-mono text-sm border">
                <pre className="whitespace-pre-wrap text-foreground">
                  <span className="text-code-keyword">def</span>{" "}
                  <span className="text-code-function">calculate_user_score</span>
                  (user_id, metrics):{"\n"}
                  <span className="text-code-comment">    """</span>{"\n"}
                  <span className="text-code-comment">    사용자 점수를 계산합니다.</span>{"\n"}
                  <span className="text-code-comment">    </span>{"\n"}
                  <span className="text-code-comment">    Args:</span>{"\n"}
                  <span className="text-code-comment">        user_id: 사용자 ID</span>{"\n"}
                  <span className="text-code-comment">        metrics: 평가 지표</span>{"\n"}
                  <span className="text-code-comment">    </span>{"\n"}
                  <span className="text-code-comment">    Returns:</span>{"\n"}
                  <span className="text-code-comment">        int: 계산된 점수</span>{"\n"}
                  <span className="text-code-comment">    """</span>{"\n"}
                  {"    "}<span className="text-code-keyword">return</span> sum(metrics) * user_id
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* After */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                AI 개선 후 코드
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-background rounded-lg p-4 font-mono text-sm border">
                <pre className="whitespace-pre-wrap text-foreground">
                  <span className="text-code-keyword">def</span>{" "}
                  <span className="text-code-function">calculate_user_score</span>
                  (user_id: <span className="text-code-keyword">str</span>, metrics: List[<span className="text-code-keyword">float</span>], weight: <span className="text-code-keyword">float</span> = 1.0):{"\n"}
                  <span className="text-code-comment">    """</span>{"\n"}
                  <span className="text-code-comment">    사용자 점수를 계산합니다.</span>{"\n"}
                  <span className="text-code-comment">    </span>{"\n"}
                  <span className="text-code-comment">    Args:</span>{"\n"}
                  <span className="text-code-comment">        user_id (str): 사용자 식별자</span>{"\n"}
                  <span className="text-code-comment">        metrics (List[float]): 평가 지표 리스트</span>{"\n"}
                  <span className="text-code-comment">        weight (float): 가중치 (기본값: 1.0)</span>{"\n"}
                  <span className="text-code-comment">    </span>{"\n"}
                  <span className="text-code-comment">    Returns:</span>{"\n"}
                  <span className="text-code-comment">        float: 계산된 가중 점수</span>{"\n"}
                  <span className="text-code-comment">    """</span>{"\n"}
                  {"    "}<span className="text-code-keyword">if</span> <span className="text-code-keyword">not</span> metrics:{"\n"}
                  {"        "}<span className="text-code-keyword">return</span> 0.0{"\n"}
                  {"    "}<span className="text-code-keyword">return</span> sum(metrics) * weight
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results */}
        <Card className="mb-12 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-primary" />
              실시간 분석 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisResults.map((result, index) => {
                const IconComponent = result.icon;
                return (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                    <IconComponent className={`w-5 h-5 ${result.color} flex-shrink-0 mt-0.5`} />
                    <div>
                      <div className="font-medium text-sm">{result.title}</div>
                      <div className="text-sm text-muted-foreground">{result.message}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis Visualization */}
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-4">지능형 분석 과정</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span className="text-primary text-sm font-bold">1</span>
                </div>
                <div>
                  <div className="font-medium">코드 구조 분석</div>
                  <div className="text-sm text-muted-foreground">AST를 통한 구문 분석 및 패턴 감지</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <span className="text-accent text-sm font-bold">2</span>
                </div>
                <div>
                  <div className="font-medium">AI 모델 추론</div>
                  <div className="text-sm text-muted-foreground">CodeBERT 기반 의미 분석 및 개선점 도출</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center">
                  <span className="text-secondary text-sm font-bold">3</span>
                </div>
                <div>
                  <div className="font-medium">실시간 피드백</div>
                  <div className="text-sm text-muted-foreground">IDE 통합을 통한 즉시 개선안 제시</div>
                </div>
              </div>
            </div>
            
            <Button className="mt-6 group">
              <PlayCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              라이브 데모 체험
            </Button>
          </div>
          
          <div className="relative">
            <img 
              src={aiAnalysisImage} 
              alt="AI 분석 과정 시각화"
              className="w-full h-auto rounded-xl shadow-elegant border border-primary/20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/10 to-transparent rounded-xl" />
          </div>
        </div>
      </div>
    </section>
  );
};
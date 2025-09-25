import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { CodeDemo } from "@/components/CodeDemo";
import { Architecture } from "@/components/Architecture";
import { Roadmap } from "@/components/Roadmap";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import { useResponsive } from "@/hooks/use-responsive";
import { useEffect } from "react";

const Index = () => {
  const { isMobile } = useResponsive();

  // Enable keyboard navigation
  useKeyboardNavigation({
    onNavigateToTop: () => window.scrollTo({ top: 0, behavior: "smooth" }),
    onNavigateToBottom: () =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }),
    onOpenHelp: () =>
      console.log("Help shortcuts: ↑/↓ navigate, H for help, / for search"),
  });

  // Performance optimization: Preload critical images
  useEffect(() => {
    const preloadImages = [
      "/src/assets/hero-image.jpg",
      "/src/assets/ai-analysis.jpg",
      "/src/assets/architecture.jpg",
    ];

    preloadImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <CodeDemo />
      <Architecture />
      <Roadmap />

      {/* Enhanced accessibility for screen readers */}
      <div className="sr-only" aria-live="polite" id="page-status">
        페이지 로드 완료: AI 페어 프로그래머 메인 페이지
      </div>
    </div>
  );
};

export default Index;

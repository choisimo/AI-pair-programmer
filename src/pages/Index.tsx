import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { CodeDemo } from "@/components/CodeDemo";
import { Architecture } from "@/components/Architecture";
import { Roadmap } from "@/components/Roadmap";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <CodeDemo />
      <Architecture />
      <Roadmap />
    </div>
  );
};

export default Index;

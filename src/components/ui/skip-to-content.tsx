export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="fixed top-4 left-4 z-[100] px-4 py-2 bg-primary text-primary-foreground rounded-md transform -translate-y-20 focus:translate-y-0 transition-transform duration-200 sr-only focus:not-sr-only"
    >
      Skip to main content
    </a>
  );
}

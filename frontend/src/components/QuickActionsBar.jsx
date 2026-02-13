export default function QuickActionBar(){
  return (
    <div className="sticky top-0 z-40 bg-[hsl(var(--surface))]/80 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto p-2 flex gap-2 justify-center md:justify-between">
        <div className="hidden md:block text-sm text-gray-600 dark:text-gray-300">
          Assert your rights with federal law.
        </div>
        <div className="flex gap-2">
          <a href="/auth" className="btn btn-primary">Get Started</a>
          <a href="/case" className="btn btn-secondary">Case Builder</a>
          <a href="/redact" className="btn btn-secondary">Redaction</a>
        </div>
      </div>
    </div>
  );
}
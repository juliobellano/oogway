import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import DotGrid from './components/DotGrid';
import TextType from './components/TextType';
import CardNav, { type CardNavItem } from './components/CardNav';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import SessionView from './components/SessionView';

const NAV_ITEMS: CardNavItem[] = [
  {
    label: 'Learn',
    bgColor: '#E8F0E8',
    textColor: '#1a1a1a',
    links: [
      { label: 'Tutorials', href: '#tutorials', ariaLabel: 'Browse tutorials' },
      { label: 'Guides', href: '#guides', ariaLabel: 'Read guides' },
    ],
  },
  {
    label: 'Create',
    bgColor: '#FEF3E8',
    textColor: '#1a1a1a',
    links: [
      { label: 'New Project', href: '#new', ariaLabel: 'Start new project' },
      { label: 'Templates', href: '#templates', ariaLabel: 'Browse templates' },
    ],
  },
  {
    label: 'Community',
    bgColor: '#F0EDF8',
    textColor: '#1a1a1a',
    links: [
      { label: 'Discord', href: '#discord', ariaLabel: 'Join Discord' },
      { label: 'GitHub', href: '#github', ariaLabel: 'View GitHub' },
    ],
  },
];

type Phase = 'landing' | 'session';

interface Step {
  step_number: number;
  step_name: string;
  timestamp?: string;
  description: string;
  failure_condition?: string;
}

function App() {
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('landing');
  const [sessionSteps, setSessionSteps] = useState<Step[]>([]);
  const [sessionUrl, setSessionUrl] = useState('');

  async function handleSubmit(url: string) {
    const trimmed = url.trim();
    if (!trimmed) return;

    // Basic YouTube URL validation
    if (!/(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(trimmed)) {
      setError('Please enter a valid YouTube URL.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      const resp = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || 'Analysis failed. Please try again.');
        return;
      }

      const steps = data.steps || [];
      if (!steps.length) {
        setError('No steps were extracted from this video.');
        return;
      }

      // Transition to session phase instead of redirecting
      setSessionSteps(steps);
      setSessionUrl(trimmed);
      setPhase('session');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Request failed: ${message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  // ── Session phase ──
  if (phase === 'session') {
    return <SessionView steps={sessionSteps} videoUrl={sessionUrl} />;
  }

  // ── Landing phase ──
  return (
    <div className="relative min-h-screen bg-[#FAFAF8] overflow-hidden">
      {/* DotGrid Background */}
      <div className="absolute inset-0 z-0">
        <DotGrid
          dotSize={2}
          gap={20}
          baseColor="#a1a1aa"
          activeColor="#52525b"
          proximity={100}
          shockRadius={150}
          shockStrength={2}
        />
      </div>

      {/* CardNav - Fixed at top */}
      <CardNav
        logoText="Oogway"
        items={NAV_ITEMS}
        baseColor="#ffffff"
        menuColor="#1a1a1a"
        buttonBgColor="#1a1a1a"
        buttonTextColor="#ffffff"
      />

      {/* Main Content */}
      <main className="relative z-10 flex flex-col justify-center items-center min-h-screen px-4 pt-20 gap-1">
        {/* Subtitle */}
        <p
          className="text-sm md:text-base text-[#71717a] tracking-wide mb-4 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
        >
          Your personal assistant for youtube tutorials.
        </p>

        {/* Hero Title with TextType */}
        <div className="text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
          <TextType
            text="Say hello to Oogway"
            className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-[9rem] text-[#1a1a1a] tracking-[-0.03em] leading-[1.05] font-medium"
            typingSpeed={100}
            deletingSpeed={60}
            pauseDuration={4000}
            loop={true}
            showCursor={true}
            cursorCharacter="_"
            cursorClassName="text-[#1a1a1a]/30 font-thin ml-0.5"
          />
        </div>

        {/* Search Input */}
        <div
          className="w-full max-w-xl opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
        >
          <div
            className="relative h-16 flex items-center bg-white rounded-full shadow-lg border border-border/50 overflow-hidden"
            style={{ paddingLeft: '20px' }}
          >
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Paste a YouTube tutorial link..."
              disabled={isAnalyzing}
              className="flex-1 h-full text-base bg-transparent border-none shadow-none rounded-none focus-visible:ring-0 focus-visible:border-none px-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit(query);
              }}
            />
            <Button
              size="icon"
              className="rounded-full bg-foreground hover:bg-foreground/90 text-background"
              style={{ marginRight: '20px' }}
              disabled={isAnalyzing}
              onClick={() => handleSubmit(query)}
            >
              {isAnalyzing ? (
                <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Status Text */}
          {isAnalyzing ? (
            <p className="text-center text-[#71717a] text-xs mt-3 animate-pulse">
              Analyzing tutorial...
            </p>
          ) : error ? (
            <p className="text-center text-red-500 text-xs mt-3">
              {error}
            </p>
          ) : (
            <p className="text-center text-muted-foreground text-xs mt-3">
              Paste a youtube link and click arrow to begin
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

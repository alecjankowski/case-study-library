'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import cases from '@/lib/cases.json';

interface CaseStudy {
  slug: string;
  title: string;
  brand: string;
  agency: string;
  year: string;
  award: string;
  category: string;
  insight: string;
  coreIdea: string;
  execution: string;
  results: string;
  qualityScore: number;
  videoUrl?: string;
}

export default function ReviewPage() {
  const [filter, setFilter] = useState<'all' | 'needs_review' | 'flagged' | 'verified'>('needs_review');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewState, setReviewState] = useState<Record<string, string>>({});
  const [videoSpeed, setVideoSpeed] = useState(1.5);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Load review state
  useEffect(() => {
    const saved = localStorage.getItem('reviewState');
    if (saved) {
      try {
        setReviewState(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);
  
  const saveReview = (slug: string, status: string) => {
    const newState = { ...reviewState, [slug]: status };
    setReviewState(newState);
    localStorage.setItem('reviewState', JSON.stringify(newState));
  };

  const getAwardColor = (award: string) => {
    if (award?.includes('Grand Prix') || award?.includes('Titanium')) return 'bg-purple-500';
    if (award?.includes('Gold')) return 'bg-yellow-500';
    if (award?.includes('Silver')) return 'bg-gray-400';
    if (award?.includes('Bronze')) return 'bg-orange-400';
    return 'bg-zinc-400';
  };

  const getVideoId = (url: string) => {
    if (!url) return null;
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return { type: 'youtube', id: ytMatch[1] };
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return { type: 'vimeo', id: vimeoMatch[1] };
    return null;
  };

  const filtered = useMemo(() => {
    const withStatus = cases.map((c: CaseStudy) => ({
      ...c,
      reviewStatus: reviewState[c.slug] as any
    }));
    
    let filtered = withStatus;
    if (filter === 'needs_review') {
      filtered = withStatus.filter((c: CaseStudy) => !reviewState[c.slug]);
    } else if (filter === 'flagged') {
      filtered = withStatus.filter((c: CaseStudy) => reviewState[c.slug] === 'flagged');
    } else if (filter === 'verified') {
      filtered = withStatus.filter((c: CaseStudy) => reviewState[c.slug] === 'verified');
    }
    
    // Sort by quality, then by award importance (Gold/GP first)
    return filtered.sort((a: CaseStudy, b: CaseStudy) => {
      // First by quality
      if (b.qualityScore !== a.qualityScore) return b.qualityScore - a.qualityScore;
      // Then by award importance
      const awardOrder = { 'Grand Prix/Titanium': 4, 'Gold': 3, 'Silver': 2, 'Bronze': 1 };
      return (awardOrder[b.award as keyof typeof awardOrder] || 0) - (awardOrder[a.award as keyof typeof awardOrder] || 0);
    });
  }, [filter, reviewState]);

  const current = filtered[currentIndex];
  const videoInfo = current?.videoUrl ? getVideoId(current.videoUrl) : null;

  const handleReview = (status: 'verified' | 'flagged') => {
    if (current) {
      saveReview(current.slug, status);
      if (currentIndex < filtered.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }
  };

  const adjustSpeed = (delta: number) => {
    const newSpeed = Math.max(0.5, Math.min(3, videoSpeed + delta));
    setVideoSpeed(newSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
  };

  const stats = useMemo(() => {
    const verified = Object.values(reviewState).filter(s => s === 'verified').length;
    const flagged = Object.values(reviewState).filter(s => s === 'flagged').length;
    return { verified, flagged, remaining: cases.length - verified - flagged };
  }, [reviewState]);

  if (!current) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">All caught up!</h1>
          <p className="text-zinc-400">No more cases to review.</p>
          <button onClick={() => { setFilter('needs_review'); setCurrentIndex(0); }} className="mt-4 px-4 py-2 bg-blue-600 rounded-lg">
            Reset Review
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">
              <span className="text-white">Creative</span>
              <span className="text-blue-500">Reference</span>
              <span className="ml-2 text-zinc-500 text-sm font-normal">Review</span>
            </h1>
            <div className="flex gap-3 text-xs">
              <span className="text-green-400">✓ {stats.verified}</span>
              <span className="text-red-400">✗ {stats.flagged}</span>
              <span className="text-zinc-500">|</span>
              <span className="text-zinc-400">{stats.remaining} left</span>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            {(['needs_review', 'verified', 'flagged'] as const).map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setCurrentIndex(0); }}
                className={`px-2 py-1 rounded text-xs ${
                  filter === f ? 'bg-blue-600' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {f === 'needs_review' ? 'To Review' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {/* Progress bar */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${((currentIndex) / filtered.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500">{currentIndex + 1}/{filtered.length}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Video + Actions */}
          <div className="space-y-4">
            {/* Video Player */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
              {videoInfo ? (
                videoInfo.type === 'youtube' ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoInfo.id}?autoplay=1&speed=${videoSpeed}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <iframe
                    src={`https://player.vimeo.com/video/${videoInfo.id}?autoplay=1`}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                  <div className="text-center">
                    <p className="text-4xl mb-2">🎬</p>
                    <p className="text-sm">No video found</p>
                    <p className="text-xs text-zinc-600 mt-1">Add source URL to enable</p>
                  </div>
                </div>
              )}
              
              {/* Speed control */}
              {videoInfo && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/80 rounded-lg p-1">
                  <button onClick={() => adjustSpeed(-0.25)} className="w-6 h-6 rounded bg-zinc-700 hover:bg-zinc-600 text-xs">-</button>
                  <span className="px-2 text-xs font-mono">{videoSpeed}x</span>
                  <button onClick={() => adjustSpeed(0.25)} className="w-6 h-6 rounded bg-zinc-700 hover:bg-zinc-600 text-xs">+</button>
                </div>
              )}
            </div>

            {/* Review Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleReview('verified')}
                className="py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
              >
                ✓ Looks Good
              </button>
              <button
                onClick={() => handleReview('flagged')}
                className="py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
              >
                ✗ Wrong
              </button>
            </div>

            {/* Navigation */}
            <div className="flex justify-between text-sm">
              <button 
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="text-zinc-400 hover:text-white disabled:opacity-50"
              >
                ← Previous
              </button>
              <button 
                onClick={() => setCurrentIndex(currentIndex + 1)}
                disabled={currentIndex >= filtered.length - 1}
                className="text-zinc-400 hover:text-white disabled:opacity-50"
              >
                Next →
              </button>
            </div>

            {/* Case Info */}
            <div className="p-3 bg-zinc-900 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 text-xs rounded ${getAwardColor(current.award)}`}>
                  {current.award}
                </span>
                <span className="text-zinc-400 text-xs">{current.year}</span>
              </div>
              <h2 className="font-bold text-lg">{current.brand || current.title}</h2>
              <p className="text-zinc-500 text-sm">{current.agency || 'Unknown agency'}</p>
            </div>
          </div>

          {/* Right: Content */}
          <div className="lg:col-span-2 space-y-4">
            {current.insight && (
              <div className="p-4 bg-zinc-900 rounded-xl">
                <h3 className="text-xs font-bold uppercase text-blue-400 mb-2">💡 Insight</h3>
                <p className="text-zinc-300">{current.insight}</p>
              </div>
            )}

            {current.coreIdea && (
              <div className="p-4 bg-zinc-900 rounded-xl">
                <h3 className="text-xs font-bold uppercase text-green-400 mb-2">🎯 Core Idea</h3>
                <p className="text-zinc-300">{current.coreIdea}</p>
              </div>
            )}

            {current.execution && (
              <div className="p-4 bg-zinc-900 rounded-xl">
                <h3 className="text-xs font-bold uppercase text-purple-400 mb-2">🎬 Execution</h3>
                <p className="text-zinc-300">{current.execution}</p>
              </div>
            )}

            {current.results && (
              <div className="p-4 bg-zinc-900 rounded-xl">
                <h3 className="text-xs font-bold uppercase text-yellow-400 mb-2">📈 Results</h3>
                <p className="text-zinc-300">{current.results}</p>
              </div>
            )}

            {/* Raw data */}
            <details className="p-3 bg-zinc-900 rounded-lg">
              <summary className="cursor-pointer text-zinc-500 text-xs">View raw data</summary>
              <pre className="mt-2 text-xs text-zinc-600 overflow-auto">
                {JSON.stringify({ 
                  slug: current.slug,
                  score: current.qualityScore,
                  videoUrl: current.videoUrl || 'none'
                }, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
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
}

export default function Home() {
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedAward, setSelectedAward] = useState('');
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);

  const years = useMemo(() => {
    const y = new Set(cases.map((c: CaseStudy) => c.year).filter(Boolean));
    return Array.from(y).sort().reverse();
  }, []);

  const awards = useMemo(() => {
    const a = new Set(cases.map((c: CaseStudy) => c.award).filter(Boolean));
    return Array.from(a).sort();
  }, []);

  const filtered = useMemo(() => {
    return cases.filter((c: CaseStudy) => {
      const matchSearch = !search || 
        c.brand.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.agency.toLowerCase().includes(search.toLowerCase()) ||
        c.insight.toLowerCase().includes(search.toLowerCase()) ||
        c.coreIdea.toLowerCase().includes(search.toLowerCase());
      const matchYear = !selectedYear || c.year === selectedYear;
      const matchAward = !selectedAward || c.award === selectedAward;
      return matchSearch && matchYear && matchAward;
    });
  }, [search, selectedYear, selectedAward]);

  const getAwardColor = (award: string) => {
    if (award?.includes('Grand Prix') || award?.includes('Titanium')) return 'bg-purple-500';
    if (award?.includes('Gold')) return 'bg-yellow-500';
    if (award?.includes('Silver')) return 'bg-gray-400';
    if (award?.includes('Bronze')) return 'bg-orange-400';
    return 'bg-zinc-400';
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-zinc-900 dark:text-white">Creative</span>
              <span className="text-blue-600 dark:text-blue-400">Reference</span>
            </h1>
            <a href="/review" className="text-sm text-blue-600 hover:underline">Review Mode →</a>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {filtered.length.toLocaleString()} cases
            </p>
          </div>
          
          {/* Search */}
          <div className="mt-4 flex gap-3">
            <input
              type="text"
              placeholder="Search by brand, idea, insight..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            >
              <option value="">All Years</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={selectedAward}
              onChange={(e) => setSelectedAward(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            >
              <option value="">All Awards</option>
              {awards.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice(0, 50).map((c: CaseStudy) => (
            <button
              key={c.slug}
              onClick={() => setSelectedCase(c)}
              className="group relative flex flex-col items-start rounded-xl border border-zinc-200 bg-white p-5 text-left transition-all hover:border-blue-400 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${getAwardColor(c.award)}`}>
                  {c.award || 'N/A'}
                </span>
                <span className="text-xs text-zinc-400">{c.year}</span>
              </div>
              
              <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-white">
                {c.brand}
              </h3>
              
              {c.title && c.title !== c.brand && (
                <p className="mt-1 text-sm text-zinc-500 line-clamp-2 dark:text-zinc-400">
                  {c.title}
                </p>
              )}
              
              {c.coreIdea && (
                <p className="mt-3 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">
                  {c.coreIdea.slice(0, 150)}...
                </p>
              )}
              
              <p className="mt-auto pt-3 text-xs text-zinc-400">
                {c.agency}
              </p>
            </button>
          ))}
        </div>
        
        {filtered.length > 50 && (
          <p className="mt-6 text-center text-sm text-zinc-500">
            Showing 50 of {filtered.length.toLocaleString()} results. Refine your search.
          </p>
        )}
      </main>

      {/* Detail Modal */}
      {selectedCase && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedCase(null)}
        >
          <div 
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-6 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${getAwardColor(selectedCase.award)}`}>
                  {selectedCase.award}
                </span>
                <span className="text-sm text-zinc-500">{selectedCase.year}</span>
              </div>
              <button 
                onClick={() => setSelectedCase(null)}
                className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {selectedCase.brand}
                </h2>
                <p className="mt-1 text-zinc-500">{selectedCase.agency}</p>
              </div>

              {selectedCase.insight && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                    Insight
                  </h3>
                  <p className="mt-2 text-zinc-700 dark:text-zinc-300">
                    {selectedCase.insight}
                  </p>
                </div>
              )}

              {selectedCase.coreIdea && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                    Core Creative Idea
                  </h3>
                  <p className="mt-2 text-zinc-700 dark:text-zinc-300">
                    {selectedCase.coreIdea}
                  </p>
                </div>
              )}

              {selectedCase.execution && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                    Execution
                  </h3>
                  <p className="mt-2 text-zinc-700 dark:text-zinc-300">
                    {selectedCase.execution}
                  </p>
                </div>
              )}

              {selectedCase.results && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                    Results
                  </h3>
                  <p className="mt-2 text-zinc-700 dark:text-zinc-300">
                    {selectedCase.results}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

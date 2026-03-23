'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { WorkerCard } from '@/components/worker/WorkerCard'
import { Navbar } from '@/components/layout/Navbar'
import { api } from '@/lib/api'
import { WorkerProfile, SearchFilters } from '@/types'
import { PROFESSIONS } from '@/lib/utils'
import { cn } from '@/lib/utils'

const RATINGS = [
  { label: 'Any', value: '' },
  { label: '3+', value: '3' },
  { label: '4+', value: '4' },
  { label: '4.5+', value: '4.5' },
]

export default function SearchPage() {
  const [workers, setWorkers] = useState<WorkerProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({ query: '' })

  const fetchWorkers = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: Record<string, unknown> = {}
      if (filters.query) params.query = filters.query
      if (filters.profession) params.profession = filters.profession
      if (filters.city) params.city = filters.city
      if (filters.minRating) params.minRating = filters.minRating
      if (filters.maxRate) params.maxRate = filters.maxRate
      if (filters.available) params.available = true
      const res = await api.workers.search(params)
      setWorkers(res.data ?? [])
    } catch {
      setWorkers([])
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const t = setTimeout(fetchWorkers, 400)
    return () => clearTimeout(t)
  }, [fetchWorkers])

  const setFilter = <K extends keyof SearchFilters>(key: K, val: SearchFilters[K]) => {
    setFilters(f => ({ ...f, [key]: val }))
  }

  const clearFilters = () => setFilters({ query: '' })

  const activeFilterCount = [
    filters.profession, filters.city, filters.minRating, filters.maxRate, filters.available,
  ].filter(Boolean).length

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-slate-900 mb-1">
            Find skilled workers
          </h1>
          <p className="text-slate-500 text-sm">
            Search by name, profession, or location
          </p>
        </div>

        {/* Search bar + filter toggle */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={filters.query}
              onChange={e => setFilter('query', e.target.value)}
              placeholder="Search workers..."
              className="input-base pl-11"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all',
              showFilters || activeFilterCount > 0
                ? 'bg-brand-50 border-brand-300 text-brand-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="card p-5 mb-6 animate-fade-up grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Profession */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Profession</label>
              <select
                value={filters.profession ?? ''}
                onChange={e => setFilter('profession', e.target.value || undefined)}
                className="input-base py-2 text-sm"
              >
                <option value="">All professions</option>
                {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">City</label>
              <input
                value={filters.city ?? ''}
                onChange={e => setFilter('city', e.target.value || undefined)}
                placeholder="e.g. Chennai"
                className="input-base py-2 text-sm"
              />
            </div>

            {/* Min rating */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Min rating</label>
              <div className="flex gap-1.5">
                {RATINGS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setFilter('minRating', r.value ? parseFloat(r.value) : undefined)}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-xs font-medium border transition-all',
                      String(filters.minRating ?? '') === r.value
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max rate */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Max rate (₹/hr)</label>
              <input
                type="number"
                value={filters.maxRate ?? ''}
                onChange={e => setFilter('maxRate', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="e.g. 1000"
                className="input-base py-2 text-sm"
              />
            </div>

            {/* Available + clear */}
            <div className="col-span-2 md:col-span-4 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setFilter('available', !filters.available || undefined)}
                  className={cn(
                    'w-10 h-6 rounded-full transition-colors relative',
                    filters.available ? 'bg-brand-600' : 'bg-slate-200'
                  )}
                >
                  <span className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm',
                    filters.available ? 'translate-x-5' : 'translate-x-1'
                  )} />
                </div>
                <span className="text-sm text-slate-700">Available now only</span>
              </label>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
                  <X className="w-3.5 h-3.5" /> Clear all
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-slate-500 mb-4">
            {workers.length === 0 ? 'No workers found' : `${workers.length} worker${workers.length === 1 ? '' : 's'} found`}
          </p>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded" />
                  <div className="h-3 bg-slate-100 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">No workers found</h3>
            <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="mt-3 text-brand-600 text-sm font-medium hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((w, i) => (
              <div key={w.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <WorkerCard worker={w} />
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

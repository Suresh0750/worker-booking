'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Grid3X3, Plus, Trash2, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { WorkerCategory, CategoryItem } from '@/types'
import { cn } from '@/lib/utils'

export default function MyCategoriesPage() {
  const [workerCats, setWorkerCats] = useState<WorkerCategory[]>([])
  const [allCats, setAllCats] = useState<CategoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.worker.getCategories(),
      api.catalogue.getCategories(),
    ]).then(([wc, ac]) => {
      setWorkerCats(wc.data ?? [])
      setAllCats(ac.data ?? [])
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [])

  const joinedIds = new Set(workerCats.map(wc => wc.categoryId))
  const available = allCats.filter(c => !joinedIds.has(c.id))

  const handleAdd = async (cat: CategoryItem) => {
    setAddingId(cat.id)
    try {
      const res = await api.worker.addCategory(cat.id)
      setWorkerCats(wc => [...wc, res.data])
      toast.success(`"${cat.name}" added!`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to add category')
    } finally {
      setAddingId(null)
    }
  }

  const handleRemove = async (categoryId: string) => {
    setRemovingId(categoryId)
    try {
      await api.worker.removeCategory(categoryId)
      setWorkerCats(wc => wc.filter(c => c.categoryId !== categoryId))
      toast.success('Category removed')
    } catch {
      toast.error('Failed to remove category')
    } finally {
      setRemovingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-slate-900 mb-1">My Categories</h1>
        <p className="text-sm text-slate-500">
          Clients browse workers by category. Select every category your work falls under.
        </p>
      </div>

      {/* Active categories */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-brand-600" />
          Your categories
          {workerCats.length > 0 && (
            <span className="ml-1 text-xs font-medium bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
              {workerCats.length}
            </span>
          )}
        </h2>

        {workerCats.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">
            None selected — pick from the list below
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {workerCats.map(wc => (
              <div
                key={wc.categoryId}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-xl text-sm font-medium text-brand-800 animate-fade-in"
              >
                {wc.category.icon && (
                  <span className="text-base leading-none">{wc.category.icon}</span>
                )}
                {wc.category.name}
                <button
                  onClick={() => handleRemove(wc.categoryId)}
                  disabled={removingId === wc.categoryId}
                  className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-brand-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  aria-label={`Remove ${wc.category.name}`}
                >
                  {removingId === wc.categoryId
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Trash2 className="w-3 h-3" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available categories grid */}
      {available.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-700 mb-3 text-sm">Add more categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {available.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => handleAdd(cat)}
                disabled={addingId === cat.id}
                className={cn(
                  'card p-4 flex flex-col items-start gap-2 text-left hover:border-brand-300 hover:bg-brand-50/30 transition-all animate-fade-up disabled:opacity-60',
                  addingId === cat.id && 'opacity-60 cursor-wait'
                )}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl leading-none">{cat.icon ?? '🔧'}</span>
                  {addingId === cat.id
                    ? <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                    : <Plus className="w-4 h-4 text-slate-300 group-hover:text-brand-500" />}
                </div>
                <p className="text-sm font-medium text-slate-800 leading-snug">{cat.name}</p>
                {cat.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{cat.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {available.length === 0 && workerCats.length > 0 && (
        <p className="text-center text-sm text-slate-400 py-4">
          You've joined all available categories 🎉
        </p>
      )}
    </main>
  )
}

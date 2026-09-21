'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Wrench, Plus, Trash2, Loader2, IndianRupee, ToggleLeft, ToggleRight, ChevronDown,
} from 'lucide-react'
import { api } from '@/lib/api'
import { WorkerService, ServiceItem, CategoryItem } from '@/types'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export default function MyServicesPage() {
  const [workerServices, setWorkerServices] = useState<WorkerService[]>([])
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([])
  const [allServices, setAllServices] = useState<ServiceItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Add-service panel state
  const [showAdd, setShowAdd] = useState(false)
  const [selectedCatId, setSelectedCatId] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [price, setPrice] = useState('')
  const [adding, setAdding] = useState(false)

  // Inline price edit
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')

  useEffect(() => {
    Promise.all([
      api.worker.getServices(),
      api.catalogue.getCategories(),
      api.catalogue.getServices(),
    ]).then(([ws, cats, svcs]) => {
      setWorkerServices(ws.data ?? [])
      setAllCategories(cats.data ?? [])
      setAllServices(svcs.data ?? [])
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [])

  const filteredServices = allServices.filter(s =>
    s.categoryId === selectedCatId &&
    !workerServices.some(ws => ws.serviceId === s.id)
  )

  const handleAdd = async () => {
    if (!selectedServiceId) { toast.error('Select a service first'); return }
    setAdding(true)
    try {
      const res = await api.worker.addService({
        serviceId: selectedServiceId,
        price: price ? Number(price) : undefined,
      })
      setWorkerServices(ws => [...ws, res.data])
      setShowAdd(false)
      setSelectedCatId('')
      setSelectedServiceId('')
      setPrice('')
      toast.success('Service added!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to add service')
    } finally {
      setAdding(false)
    }
  }

  const handleToggleActive = async (ws: WorkerService) => {
    try {
      const res = await api.worker.updateService(ws.id, { isActive: !ws.isActive })
      setWorkerServices(prev => prev.map(s => s.id === ws.id ? res.data : s))
    } catch {
      toast.error('Failed to update service')
    }
  }

  const handleSavePrice = async (ws: WorkerService) => {
    try {
      const res = await api.worker.updateService(ws.id, { isActive: ws.isActive, price: editPrice ? Number(editPrice) : undefined })
      setWorkerServices(prev => prev.map(s => s.id === ws.id ? res.data : s))
      setEditingPriceId(null)
      toast.success('Price updated!')
    } catch {
      toast.error('Failed to update price')
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await api.worker.removeService(id)
      setWorkerServices(ws => ws.filter(s => s.id !== id))
      toast.success('Service removed')
    } catch {
      toast.error('Failed to remove service')
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
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 mb-1">My Services</h1>
          <p className="text-sm text-slate-500">Choose which services you offer and set your price for each</p>
        </div>
        {!showAdd && (
          <Button onClick={() => setShowAdd(true)} leftIcon={<Plus className="w-4 h-4" />} size="sm">
            Add service
          </Button>
        )}
      </div>

      {/* Add service panel */}
      {showAdd && (
        <div className="card p-5 mb-5 border-brand-200 bg-brand-50/20 animate-fade-up space-y-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-brand-600" /> Add a service
          </h2>

          {/* Category picker */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Category</label>
            <div className="relative">
              <select
                value={selectedCatId}
                onChange={e => { setSelectedCatId(e.target.value); setSelectedServiceId('') }}
                className="input-base appearance-none pr-8 w-full"
              >
                <option value="">Select a category…</option>
                {allCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Service picker */}
          {selectedCatId && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Service</label>
              {filteredServices.length === 0 ? (
                <p className="text-sm text-slate-400 italic">All services in this category already added</p>
              ) : (
                <div className="relative">
                  <select
                    value={selectedServiceId}
                    onChange={e => setSelectedServiceId(e.target.value)}
                    className="input-base appearance-none pr-8 w-full"
                  >
                    <option value="">Select a service…</option>
                    {filteredServices.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              )}
            </div>
          )}

          {/* Optional price */}
          {selectedServiceId && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Your price (₹) — optional</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="Leave blank to negotiate"
                  className="input-base pl-9 w-full"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleAdd} isLoading={adding} disabled={!selectedServiceId} className="flex-1">
              Add service
            </Button>
          </div>
        </div>
      )}

      {/* Services list */}
      {workerServices.length === 0 ? (
        <div className="text-center py-16 card">
          <Wrench className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="font-medium text-slate-600">No services yet</p>
          <p className="text-sm text-slate-400 mt-1">Add services so clients know exactly what you offer</p>
        </div>
      ) : (
        <div className="space-y-2">
          {workerServices.map((ws, i) => (
            <div
              key={ws.id}
              className={cn(
                'card px-4 py-3.5 flex items-center gap-4 animate-fade-up',
                !ws.isActive && 'opacity-60'
              )}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', ws.isActive ? 'text-slate-900' : 'text-slate-400 line-through')}>
                  {ws.service.name}
                </p>
                {/* Inline price edit */}
                {editingPriceId === ws.id ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="relative">
                      <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="number"
                        min={0}
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        className="input-base pl-7 py-1 text-xs w-28"
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={() => handleSavePrice(ws)}
                      className="text-xs text-brand-600 font-semibold hover:underline"
                    >Save</button>
                    <button
                      onClick={() => setEditingPriceId(null)}
                      className="text-xs text-slate-400 hover:underline"
                    >Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingPriceId(ws.id); setEditPrice(ws.price ? String(ws.price) : '') }}
                    className="text-xs text-slate-500 hover:text-brand-600 mt-0.5 transition-colors"
                  >
                    {ws.price ? `₹${ws.price}` : 'Set price'} <span className="text-slate-300">— tap to edit</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Active toggle */}
                <button
                  onClick={() => handleToggleActive(ws)}
                  title={ws.isActive ? 'Deactivate' : 'Activate'}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  {ws.isActive
                    ? <ToggleRight className="w-5 h-5 text-brand-600" />
                    : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => handleRemove(ws.id)}
                  title="Remove"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

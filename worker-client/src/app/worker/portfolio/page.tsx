'use client'

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Upload, Trash2, ImageIcon, Loader2, Pencil, Check, X, Play,
} from 'lucide-react'
import { api } from '@/lib/api'
import { PortfolioItem } from '@/types'
import { cn } from '@/lib/utils'

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.worker.getPortfolio()
      .then(res => { setItems(res.data ?? []); setIsLoading(false) })
      .catch(() => setIsLoading(false))
  }, [])

  const uploadFiles = async (files: File[]) => {
    const valid = files.filter(f =>
      (f.type.startsWith('image/') || f.type.startsWith('video/')) && f.size <= 50 * 1024 * 1024
    )
    if (valid.length !== files.length) {
      toast.error('Some files skipped — only images/videos under 50MB allowed')
    }
    if (valid.length === 0) return

    setUploading(true)
    for (const file of valid) {
      try {
        const res = await api.worker.uploadPortfolioMedia(file)
        setItems(prev => [res.data, ...prev])
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    toast.success(`${valid.length} file${valid.length > 1 ? 's' : ''} uploaded!`)
    setUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    uploadFiles(Array.from(e.dataTransfer.files))
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await api.worker.deletePortfolioItem(id)
      setItems(prev => prev.filter(p => p.id !== id))
      toast.success('Removed from portfolio')
    } catch {
      toast.error('Failed to remove item')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaveCaption = async (item: PortfolioItem) => {
    try {
      const res = await api.worker.updatePortfolioCaption(item.id, editCaption)
      setItems(prev => prev.map(p => p.id === item.id ? res.data : p))
      setEditingId(null)
      toast.success('Caption saved!')
    } catch {
      toast.error('Failed to save caption')
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
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-slate-900 mb-1">Portfolio</h1>
        <p className="text-sm text-slate-500">
          Showcase your best work. Photos and videos appear on your public profile and build client trust.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 mb-6',
          isDragging
            ? 'border-brand-400 bg-brand-50'
            : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        aria-label="Upload portfolio media"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={e => { if (e.target.files) uploadFiles(Array.from(e.target.files)) }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
            <p className="text-sm font-medium text-brand-700">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center transition-colors', isDragging ? 'bg-brand-100' : 'bg-slate-100')}>
              <Upload className={cn('w-7 h-7', isDragging ? 'text-brand-600' : 'text-slate-400')} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {isDragging ? 'Drop files here' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-xs text-slate-400 mt-1">Images & videos — up to 50MB each</p>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      {items.length === 0 && !uploading ? (
        <div className="text-center py-12 card">
          <ImageIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Your portfolio is empty — upload your first piece of work!</p>
        </div>
      ) : (
        <>
          <p className="text-xs font-medium text-slate-500 mb-3">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="relative group rounded-xl overflow-hidden bg-slate-100 animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Media */}
                <div className="aspect-square">
                  {item.mediaType === 'VIDEO' ? (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <Play className="w-10 h-10 text-white/60" />
                    </div>
                  ) : (
                    <img
                      src={item.mediaUrl}
                      alt={item.caption ?? `Portfolio item ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Caption edit */}
                {editingId === item.id ? (
                  <div className="p-2 bg-white border-t border-slate-100">
                    <input
                      autoFocus
                      value={editCaption}
                      onChange={e => setEditCaption(e.target.value)}
                      placeholder="Add a caption…"
                      maxLength={120}
                      className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
                    <div className="flex gap-1 mt-1.5">
                      <button
                        onClick={() => handleSaveCaption(item)}
                        className="flex-1 py-1 rounded-lg bg-brand-600 text-white text-xs font-medium"
                      >
                        <Check className="w-3 h-3 mx-auto" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs"
                      >
                        <X className="w-3 h-3 mx-auto" />
                      </button>
                    </div>
                  </div>
                ) : item.caption ? (
                  <div className="px-2 py-1.5 bg-white border-t border-slate-100">
                    <p className="text-xs text-slate-600 line-clamp-2">{item.caption}</p>
                  </div>
                ) : null}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end gap-1.5 p-2">
                  <button
                    onClick={() => { setEditingId(item.id); setEditCaption(item.caption ?? '') }}
                    className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-brand-600 transition-colors"
                    aria-label="Edit caption"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                    aria-label="Delete"
                  >
                    {deletingId === item.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Type badge */}
                {item.mediaType === 'VIDEO' && (
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                    VIDEO
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, Trash2, ImageIcon, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { Navbar } from '@/components/layout/Navbar'
import { cn } from '@/lib/utils'

export default function PhotosPage() {
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.worker.getProfile().then(res => setPhotos(res.data.photos ?? []))
  }, [])

  const uploadFiles = async (files: File[]) => {
    const validFiles = files.filter(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024)
    if (validFiles.length !== files.length) {
      toast.error('Some files were skipped — only images under 10MB are allowed')
    }
    if (validFiles.length === 0) return

    setUploading(true)
    const results: string[] = []
    for (const file of validFiles) {
      try {
        const res = await api.worker.uploadPhoto(file)
        results.push(res.data.url)
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    setPhotos(p => [...p, ...results])
    if (results.length > 0) toast.success(`${results.length} photo${results.length > 1 ? 's' : ''} uploaded!`)
    setUploading(false)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(Array.from(e.target.files))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    uploadFiles(Array.from(e.dataTransfer.files))
  }

  const handleDelete = async (url: string) => {
    setDeletingUrl(url)
    try {
      await api.worker.deletePhoto(url)
      setPhotos(p => p.filter(u => u !== url))
      toast.success('Photo removed')
    } catch {
      toast.error('Failed to remove photo')
    } finally {
      setDeletingUrl(null)
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-slate-900 mb-1">Project Photos</h1>
          <p className="text-sm text-slate-500">
            Upload photos of your past work. Clients see these on your profile — they build trust.
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
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
              <p className="text-sm font-medium text-brand-700">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
                isDragging ? 'bg-brand-100' : 'bg-slate-100'
              )}>
                <Upload className={cn('w-7 h-7', isDragging ? 'text-brand-600' : 'text-slate-400')} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {isDragging ? 'Drop photos here' : 'Drag & drop photos or click to browse'}
                </p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP — up to 10MB each</p>
              </div>
            </div>
          )}
        </div>

        {/* Photos grid */}
        {photos.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-3">{photos.length} photo{photos.length > 1 ? 's' : ''}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((url, i) => (
                <div
                  key={url}
                  className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 animate-fade-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <img src={url} alt={`Work photo ${i + 1}`} className="w-full h-full object-cover" />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {deletingUrl === url ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <button
                        onClick={() => handleDelete(url)}
                        className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Index badge */}
                  <div className="absolute top-2 left-2 w-6 h-6 bg-black/50 rounded-lg flex items-center justify-center text-white text-xs font-medium">
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          !uploading && (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No photos yet — upload your best work!</p>
            </div>
          )
        )}
      </main>
    </>
  )
}

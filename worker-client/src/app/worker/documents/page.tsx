'use client'

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  FileText, Upload, Trash2, Loader2, CheckCircle, Clock, XCircle, ChevronDown,
} from 'lucide-react'
import { api } from '@/lib/api'
import { WorkerDocument, DocumentType, DocumentStatus } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const DOC_TYPES: { value: DocumentType; label: string; hint: string }[] = [
  { value: 'AADHAAR',          label: 'Aadhaar Card',       hint: 'Front & back scan or photo' },
  { value: 'PAN_CARD',         label: 'PAN Card',           hint: 'Clear photo of PAN card' },
  { value: 'DRIVING_LICENSE',  label: 'Driving License',    hint: 'Front & back' },
  { value: 'PASSPORT',         label: 'Passport',           hint: 'Photo page' },
  { value: 'WORK_PERMIT',      label: 'Work Permit',        hint: 'Government-issued work permit' },
  { value: 'CERTIFICATE',      label: 'Skill Certificate',  hint: 'Trade or skill certificate' },
  { value: 'OTHER',            label: 'Other',              hint: 'Any other supporting document' },
]

function statusBadge(status: DocumentStatus) {
  if (status === 'APPROVED') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-lg">
      <CheckCircle className="w-3.5 h-3.5" /> Approved
    </span>
  )
  if (status === 'REJECTED') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
      <XCircle className="w-3.5 h-3.5" /> Rejected
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
      <Clock className="w-3.5 h-3.5" /> Pending review
    </span>
  )
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<WorkerDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<DocumentType>('AADHAAR')
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.worker.getDocuments()
      .then(res => { setDocuments(res.data ?? []); setIsLoading(false) })
      .catch(() => setIsLoading(false))
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); return }
    setUploading(true)
    try {
      const res = await api.worker.uploadDocument(file, selectedType)
      setDocuments(prev => [res.data, ...prev])
      toast.success('Document uploaded — pending review')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await api.worker.deleteDocument(id)
      setDocuments(prev => prev.filter(d => d.id !== id))
      toast.success('Document removed')
    } catch {
      toast.error('Failed to remove document')
    } finally {
      setDeletingId(null)
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
        <h1 className="font-display text-2xl font-semibold text-slate-900 mb-1">Documents & Verification</h1>
        <p className="text-sm text-slate-500">
          Upload identity and skill documents. Approved documents earn you a verified badge on your profile.
        </p>
      </div>

      {/* Upload card */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-brand-600" /> Upload a document
        </h2>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Document type</label>
            <div className="relative">
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value as DocumentType)}
                className="input-base appearance-none pr-8 w-full"
              >
                {DOC_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {DOC_TYPES.find(t => t.value === selectedType)?.hint}
            </p>
          </div>

          <Button
            onClick={() => fileRef.current?.click()}
            isLoading={uploading}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            Choose file
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Accepted: JPG, PNG, PDF — max 10MB. Documents are reviewed within 1-2 business days.
        </p>
      </div>

      {/* Documents list */}
      {documents.length === 0 ? (
        <div className="text-center py-16 card">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="font-medium text-slate-600">No documents uploaded</p>
          <p className="text-sm text-slate-400 mt-1">Add at least one ID proof to start the verification process</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc, i) => {
            const typeInfo = DOC_TYPES.find(t => t.value === doc.documentType)
            return (
              <div
                key={doc.id}
                className="card p-4 flex items-center gap-4 animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  doc.status === 'APPROVED' ? 'bg-green-50' : doc.status === 'REJECTED' ? 'bg-red-50' : 'bg-amber-50'
                )}>
                  <FileText className={cn(
                    'w-5 h-5',
                    doc.status === 'APPROVED' ? 'text-green-600' : doc.status === 'REJECTED' ? 'text-red-500' : 'text-amber-600'
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900">{typeInfo?.label ?? doc.documentType}</p>
                    {statusBadge(doc.status)}
                  </div>
                  {doc.rejectionReason && (
                    <p className="text-xs text-red-600 mt-0.5">Reason: {doc.rejectionReason}</p>
                  )}
                  {doc.verifiedAt && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Verified {new Date(doc.verifiedAt).toLocaleDateString('en-IN')}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">
                    Uploaded {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={doc.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    View
                  </a>
                  {doc.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      aria-label="Delete document"
                    >
                      {deletingId === doc.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}

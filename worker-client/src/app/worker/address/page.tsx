'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  MapPin, Plus, Pencil, Trash2, Star, Loader2, X, Check,
} from 'lucide-react'
import { api } from '@/lib/api'
import { WorkerAddress } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

type LocationSearchKey = 'state' | 'city' | 'pincode'

function LocationSelect({
  label,
  value,
  searchKey,
  state,
  city,
  error,
  disabled,
  onChange,
}: {
  label: string
  value: string
  searchKey: LocationSearchKey
  state?: string
  city?: string
  error?: string
  disabled?: boolean
  onChange: (value: string) => void
}) {
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (disabled || !isOpen) return
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      api.locations.search({ searchKey, search, state, city })
        .then(res => setOptions(res.data ?? []))
        .catch(() => setOptions([]))
        .finally(() => setIsLoading(false))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [city, disabled, isOpen, search, searchKey, state])

  return (
    <div className="relative w-full">
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}<span className="text-red-500 ml-1">*</span>
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(open => !open)}
        className={cn(
          'input-base text-left flex items-center justify-between disabled:bg-slate-50 disabled:text-slate-400',
          error && 'input-error'
        )}
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>
          {value || `Select ${label.toLowerCase()}`}
        </span>
        <span className="text-slate-400">{isOpen ? '−' : '+'}</span>
      </button>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      {isOpen && !disabled && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          <Input
            autoFocus
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={`Search ${label.toLowerCase()}...`}
            rightIcon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          />
          <div className="mt-1 max-h-44 overflow-y-auto">
            {options.map(option => (
              <button
                type="button"
                key={option}
                onClick={() => { onChange(option); setSearch(''); setIsOpen(false) }}
                className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700"
              >
                {option}
              </button>
            ))}
            {!isLoading && options.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-400">No matches found</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const addressSchema = z.object({
  line1:   z.string().min(3, 'Street address is required'),
  line2:   z.string().optional(),
  city:    z.string().min(2, 'City is required'),
  state:   z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  label:   z.string().optional(),
})
type AddressFormData = z.infer<typeof addressSchema>

export default function MyAddressPage() {
  const [addresses, setAddresses] = useState<WorkerAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({ resolver: zodResolver(addressSchema) })

  const selectedState = watch('state')
  const selectedCity = watch('city')

  useEffect(() => {
    api.worker.getAddresses()
      .then(res => { setAddresses(res.data ?? []); setIsLoading(false) })
      .catch(() => setIsLoading(false))
  }, [])

  const openAdd = () => {
    setEditingId(null)
    reset({ line1: '', line2: '', city: '', state: '', pincode: '', label: '' })
    setShowForm(true)
  }

  const openEdit = (addr: WorkerAddress) => {
    setEditingId(addr.id)
    reset({
      line1: addr.line1,
      line2: addr.line2 ?? '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      label: addr.label ?? '',
    })
    setShowForm(true)
  }

  const onSubmit = async (data: AddressFormData) => {
    try {
      if (editingId) {
        const res = await api.worker.updateAddress(editingId, data)
        setAddresses(as => as.map(a => a.id === editingId ? res.data : a))
        toast.success('Address updated!')
      } else {
        const res = await api.worker.createAddress(data)
        setAddresses(as => [...as, res.data])
        toast.success('Address added!')
      }
      setShowForm(false)
      setEditingId(null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save address')
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await api.worker.deleteAddress(id)
      setAddresses(as => as.filter(a => a.id !== id))
      toast.success('Address removed')
    } catch {
      toast.error('Failed to delete address')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetPrimary = async (id: string) => {
    setSettingPrimaryId(id)
    try {
      await api.worker.setPrimaryAddress(id)
      setAddresses(as => as.map(a => ({ ...a, isPrimary: a.id === id })))
      toast.success('Primary address updated!')
    } catch {
      toast.error('Failed to update primary address')
    } finally {
      setSettingPrimaryId(null)
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
          <h1 className="font-display text-2xl font-semibold text-slate-900 mb-1">My Address</h1>
          <p className="text-sm text-slate-500">Your primary address is used by clients to find you in search</p>
        </div>
        {!showForm && (
          <Button onClick={openAdd} leftIcon={<Plus className="w-4 h-4" />} size="sm">
            Add address
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-5 border-brand-200 bg-brand-50/20 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">
              {editingId ? 'Edit address' : 'New address'}
            </h2>
            <button
              onClick={() => { setShowForm(false); setEditingId(null) }}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Input
              label="Street address"
              placeholder="House/flat, street name"
              error={errors.line1?.message}
              required
              {...register('line1')}
            />
            <Input
              label="Landmark / Area (optional)"
              placeholder="Near bus stand, apartment name…"
              {...register('line2')}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <LocationSelect
                label="State"
                value={selectedState ?? ''}
                searchKey="state"
                error={errors.state?.message}
                onChange={value => {
                  setValue('state', value, { shouldValidate: true })
                  setValue('city', '', { shouldValidate: true })
                  setValue('pincode', '', { shouldValidate: true })
                }}
              />
              <LocationSelect
                label="City"
                value={selectedCity ?? ''}
                searchKey="city"
                state={selectedState}
                error={errors.city?.message}
                disabled={!selectedState}
                onChange={value => {
                  setValue('city', value, { shouldValidate: true })
                  setValue('pincode', '', { shouldValidate: true })
                }}
              />
              <LocationSelect
                label="Pincode"
                value={watch('pincode') ?? ''}
                searchKey="pincode"
                state={selectedState}
                city={selectedCity}
                error={errors.pincode?.message}
                disabled={!selectedState || !selectedCity}
                onChange={value => setValue('pincode', value, { shouldValidate: true })}
              />
            </div>
            <Input
              label="Label (optional)"
              placeholder="Home, Work, Site…"
              {...register('label')}
            />
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null) }} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="flex-1" leftIcon={<Check className="w-4 h-4" />}>
                {editingId ? 'Save changes' : 'Add address'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Address list */}
      {addresses.length === 0 ? (
        <div className="text-center py-16 card">
          <MapPin className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="font-medium text-slate-600">No addresses yet</p>
          <p className="text-sm text-slate-400 mt-1">Add your work area so clients can find you nearby</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr, i) => (
            <div
              key={addr.id}
              className={cn(
                'card p-4 flex items-start gap-4 animate-fade-up',
                addr.isPrimary && 'border-brand-200 bg-brand-50/30'
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                addr.isPrimary ? 'bg-brand-100' : 'bg-slate-100'
              )}>
                <MapPin className={cn('w-5 h-5', addr.isPrimary ? 'text-brand-600' : 'text-slate-400')} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {addr.label && (
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {addr.label}
                    </span>
                  )}
                  {addr.isPrimary && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-md">
                      <Star className="w-3 h-3" /> Primary
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-800 mt-1 leading-snug">
                  {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {addr.city}, {addr.state} – {addr.pincode}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!addr.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(addr.id)}
                    disabled={settingPrimaryId === addr.id}
                    title="Set as primary"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors disabled:opacity-50"
                  >
                    {settingPrimaryId === addr.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Star className="w-4 h-4" />}
                  </button>
                )}
                <button
                  onClick={() => openEdit(addr)}
                  title="Edit"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  disabled={deletingId === addr.id}
                  title="Delete"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deletingId === addr.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

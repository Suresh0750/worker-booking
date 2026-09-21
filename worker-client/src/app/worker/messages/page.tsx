'use client'

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  MessageSquare, Send, Loader2, ArrowLeft, Circle,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Conversation, Message } from '@/types'
import { useAuth } from '@/lib/auth-context'
import { getInitials, formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function MessagesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.worker.getConversations()
      .then(res => { setConversations(res.data ?? []); setLoadingConvs(false) })
      .catch(() => setLoadingConvs(false))
  }, [])

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv)
    // Mark as read locally
    setConversations(cs => cs.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    setLoadingMsgs(true)
    try {
      const res = await api.worker.getMessages(conv.id)
      setMessages(res.data ?? [])
    } catch {
      toast.error('Failed to load messages')
    } finally {
      setLoadingMsgs(false)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (activeConv) inputRef.current?.focus()
  }, [activeConv])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = text.trim()
    if (!content || !activeConv || sending) return
    setSending(true)
    setText('')
    try {
      const res = await api.worker.sendMessage(activeConv.id, content)
      setMessages(prev => [...prev, res.data])
      setConversations(cs => cs.map(c =>
        c.id === activeConv.id
          ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() }
          : c
      ))
    } catch {
      toast.error('Failed to send message')
      setText(content)
    } finally {
      setSending(false)
    }
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex">
      {/* Conversation list */}
      <div className={cn(
        'w-full lg:w-80 border-r border-slate-200 bg-white flex flex-col shrink-0',
        activeConv ? 'hidden lg:flex' : 'flex'
      )}>
        {/* Header */}
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-semibold text-slate-900">Messages</h1>
            {totalUnread > 0 && (
              <span className="bg-brand-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
        </div>

        {loadingConvs ? (
          <div className="flex justify-center items-center flex-1">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
            <p className="font-medium text-slate-600">No messages yet</p>
            <p className="text-sm text-slate-400 mt-1">When clients message you, conversations will appear here</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-slate-50 hover:bg-slate-50 transition-colors',
                  activeConv?.id === conv.id && 'bg-brand-50 border-brand-100'
                )}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-semibold overflow-hidden">
                    {conv.clientAvatar
                      ? <img src={conv.clientAvatar} alt="" className="w-full h-full object-cover" />
                      : getInitials(conv.clientName)}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn('text-sm font-semibold truncate', conv.unreadCount > 0 ? 'text-slate-900' : 'text-slate-700')}>
                      {conv.clientName}
                    </p>
                    {conv.lastMessageAt && (
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                        {formatRelativeTime(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className={cn('text-xs mt-0.5 truncate', conv.unreadCount > 0 ? 'text-slate-700 font-medium' : 'text-slate-400')}>
                      {conv.lastMessage}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Message thread */}
      <div className={cn(
        'flex-1 flex flex-col bg-slate-50',
        !activeConv ? 'hidden lg:flex' : 'flex'
      )}>
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <MessageSquare className="w-14 h-14 text-slate-200 mb-3" />
            <p className="font-semibold text-slate-500">Select a conversation</p>
            <p className="text-sm text-slate-400 mt-1">Pick a chat from the left to start messaging</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="px-4 py-3.5 bg-white border-b border-slate-200 flex items-center gap-3">
              <button
                onClick={() => setActiveConv(null)}
                className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-semibold overflow-hidden shrink-0">
                {activeConv.clientAvatar
                  ? <img src={activeConv.clientAvatar} alt="" className="w-full h-full object-cover" />
                  : getInitials(activeConv.clientName)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{activeConv.clientName}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Circle className="w-2 h-2 fill-green-400 text-green-400" /> Client
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex justify-center pt-12">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center pt-12">
                  <p className="text-sm text-slate-400">No messages yet — say hello! 👋</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isOwn = msg.senderRole === 'WORKER'
                  return (
                    <div
                      key={msg.id}
                      className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                          isOwn
                            ? 'bg-brand-600 text-white rounded-br-md'
                            : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-md'
                        )}
                      >
                        <p>{msg.content}</p>
                        <p className={cn('text-[10px] mt-1 text-right', isOwn ? 'text-brand-200' : 'text-slate-400')}>
                          {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          {isOwn && msg.readAt && ' · Read'}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="px-4 py-3 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 bg-slate-100 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-300"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!text.trim() || sending}
                className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                aria-label="Send"
              >
                {sending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

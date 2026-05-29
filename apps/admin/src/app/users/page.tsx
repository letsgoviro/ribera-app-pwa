'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { AdminShell } from '@/components/layout/AdminShell'
import {
  Users, Search, Phone, Mail, Shield, Loader2,
  UserPlus, X, ChevronDown, Check, Eye, EyeOff
} from 'lucide-react'

interface UserProfile {
  id: string
  display_name: string | null
  phone: string | null
  email?: string | null
  role: 'customer' | 'organiser' | 'admin'
  city: string | null
  created_at: string
}

const ROLES = ['customer', 'organiser', 'admin'] as const
type Role = typeof ROLES[number]

const ROLE_STYLES: Record<Role, { color: string; bg: string; label: string }> = {
  admin:     { color: 'text-red-400',    bg: 'bg-red-500/15',    label: 'Admin'     },
  organiser: { color: 'text-brand-500',  bg: 'bg-brand-500/15',  label: 'Organiser' },
  customer:  { color: 'text-gray-400',   bg: 'bg-surface-700',   label: 'Customer'  },
}

function RoleDropdown({ user, onSave }: { user: UserProfile; onSave: (id: string, role: Role) => void }) {
  const [open, setOpen] = useState(false)
  const current = ROLE_STYLES[user.role] ?? ROLE_STYLES.customer
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${current.color} ${current.bg} hover:opacity-80 transition-opacity`}
      >
        <Shield className="w-3 h-3" />
        {current.label}
        <ChevronDown className="w-3 h-3 ml-0.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-surface-700 border border-surface-500 rounded-xl overflow-hidden shadow-xl z-50 w-36">
          {ROLES.map((role) => {
            const s = ROLE_STYLES[role]
            return (
              <button
                key={role}
                onClick={() => { onSave(user.id, role); setOpen(false) }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold hover:bg-surface-600 transition-colors ${s.color}`}
              >
                {s.label}
                {user.role === role && <Check className="w-3 h-3" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ email: '', password: '', display_name: '', role: 'customer' as Role, phone: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.post('/admin/users', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      onClose()
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e?.response?.data?.error ?? 'Failed to create user')
    },
  })

  const input = 'w-full bg-surface-700 border border-surface-500 rounded-xl px-3.5 py-3 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-brand-500 transition-colors'

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-800 border border-surface-600 rounded-3xl p-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg">Create New User</h2>
          <button onClick={onClose} className="w-8 h-8 bg-surface-700 rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="user@example.com" className={input} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Password *</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min 6 characters"
                className={input + ' pr-10'}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Display Name</label>
            <input type="text" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              placeholder="Full name" className={input} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+255 712 345 678" className={input} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Role</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
              className={input}>
              <option value="customer">Customer</option>
              <option value="organiser">Organiser</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-3 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>}

        <button
          onClick={() => mutation.mutate()}
          disabled={!form.email || !form.password || mutation.isPending}
          className="w-full bg-brand-500 text-white rounded-2xl py-3.5 font-bold mt-5 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Create User
        </button>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const limit = 25

  const { data, isLoading, isError } = useQuery<{ data: UserProfile[]; total: number }>({
    queryKey: ['admin-users', search, page],
    queryFn: () => api.get('/admin/users', { params: { search: search || undefined, page, limit } }).then(r => r.data),
    placeholderData: (prev) => prev,
    retry: 1,
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const users = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / limit)

  return (
    <AdminShell>
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {isLoading ? '…' : `${total.toLocaleString()} registered users`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search name, email or phone..."
          className="w-full bg-surface-800 border border-surface-600 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:border-brand-500"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-16 bg-surface-800 rounded-xl animate-pulse" />)}
        </div>
      ) : isError ? (
        <div className="bg-surface-800 border border-surface-600 rounded-2xl p-8 text-center">
          <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">Could not load users</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">{search ? 'No users match your search' : 'No users yet'}</p>
        </div>
      ) : (
        <>
          <div className="bg-surface-800 border border-surface-600 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-600">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => {
                  const initials = user.display_name
                    ? user.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    : (user.email?.[0] ?? user.phone?.[3] ?? 'U').toUpperCase()
                  return (
                    <tr key={user.id} className={`border-b border-surface-700 last:border-0 hover:bg-surface-700/40 transition-colors`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-brand-500 text-xs font-bold">{initials}</span>
                          </div>
                          <div>
                            <p className="font-medium text-white">{user.display_name ?? <span className="text-gray-600">No name</span>}</p>
                            {user.city && <p className="text-xs text-gray-500">{user.city}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="space-y-0.5">
                          {user.email && <div className="flex items-center gap-1.5 text-gray-400 text-xs"><Mail className="w-3 h-3" />{user.email}</div>}
                          {user.phone && <div className="flex items-center gap-1.5 text-gray-400 text-xs"><Phone className="w-3 h-3" />{user.phone}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <RoleDropdown user={user} onSave={(id, role) => roleMutation.mutate({ id, role })} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                        {new Date(user.created_at).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-500">Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 bg-surface-800 border border-surface-600 rounded-lg text-sm text-gray-300 disabled:opacity-40">← Prev</button>
                <span className="px-3 py-1.5 text-sm text-gray-400">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 bg-surface-800 border border-surface-600 rounded-lg text-sm text-gray-300 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </AdminShell>
  )
}

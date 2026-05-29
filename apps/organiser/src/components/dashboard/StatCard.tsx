import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  loading?: boolean
  highlight?: boolean
  icon?: React.ElementType
  trend?: { direction: 'up' | 'down' | 'flat'; pct: number }
  sub?: string
}

export function StatCard({ label, value, loading, highlight, icon: Icon, trend, sub }: Props) {
  return (
    <div className={`bg-surface-800 border rounded-2xl p-5 transition-all ${highlight ? 'border-brand-500/40 bg-gradient-to-br from-brand-500/10 to-surface-800' : 'border-surface-600 hover:border-surface-500'}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider leading-tight">{label}</p>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${highlight ? 'bg-brand-500/20' : 'bg-surface-700'}`}>
            <Icon className={`w-4 h-4 ${highlight ? 'text-brand-500' : 'text-gray-400'}`} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-1.5">
          <div className="h-8 w-24 bg-surface-700 rounded-lg animate-pulse" />
          <div className="h-3 w-16 bg-surface-700 rounded animate-pulse" />
        </div>
      ) : (
        <>
          <p className={`text-2xl font-black leading-tight ${highlight ? 'text-brand-500' : 'text-white'}`}>
            {value}
          </p>

          <div className="flex items-center gap-2 mt-1.5">
            {trend && (
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${
                trend.direction === 'up' ? 'text-green-400' :
                trend.direction === 'down' ? 'text-red-400' : 'text-gray-500'
              }`}>
                {trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
                {trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
                {trend.direction === 'flat' && <Minus className="w-3 h-3" />}
                {trend.pct}% this month
              </span>
            )}
            {sub && !trend && (
              <span className="text-xs text-gray-600">{sub}</span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
  badge?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  badge,
}: StatCardProps) {
  const styles = {
    blue: {
      bg: 'bg-white',
      border: 'border-blue-100 hover:border-blue-300',
      iconBg: 'bg-blue-50 text-blue-700',
      accent: 'text-blue-900',
    },
    emerald: {
      bg: 'bg-white',
      border: 'border-emerald-100 hover:border-emerald-300',
      iconBg: 'bg-emerald-50 text-emerald-700',
      accent: 'text-emerald-950',
    },
    amber: {
      bg: 'bg-white',
      border: 'border-amber-100 hover:border-amber-300',
      iconBg: 'bg-amber-50 text-amber-700',
      accent: 'text-amber-950',
    },
    rose: {
      bg: 'bg-white',
      border: 'border-rose-100 hover:border-rose-300',
      iconBg: 'bg-rose-50 text-rose-700',
      accent: 'text-rose-950',
    },
    slate: {
      bg: 'bg-white',
      border: 'border-slate-200 hover:border-slate-300',
      iconBg: 'bg-slate-100 text-slate-700',
      accent: 'text-slate-900',
    },
  }[variant];

  return (
    <div
      className={`p-5 rounded-2xl border shadow-xs transition-all duration-200 hover:shadow-md ${styles.bg} ${styles.border}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-600">{title}</span>
        <div className={`p-2.5 rounded-xl ${styles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div className={`text-2xl font-bold tracking-tight ${styles.accent}`}>{value}</div>
        {badge && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-slate-500 mt-1.5">{subtitle}</p>}
    </div>
  );
}

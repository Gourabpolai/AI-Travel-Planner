import { useState } from 'react';
import { Plus, Trash2, Wallet, TrendingUp, PieChart, Loader2 } from 'lucide-react';
import { addExpense, deleteExpense } from '@/api/expenseApi';
import type { Expense, ExpenseCategory, Trip } from '@/lib/types';
import { formatCurrency, formatDateShort, cn } from '@/lib/utils';

const categoryConfig: Record<ExpenseCategory, { label: string; color: string; bg: string }> = {
  food: { label: 'Food', color: 'text-sand-700', bg: 'bg-sand-500' },
  transport: { label: 'Transport', color: 'text-blue-700', bg: 'bg-blue-500' },
  accommodation: { label: 'Stay', color: 'text-purple-700', bg: 'bg-purple-500' },
  activities: { label: 'Activities', color: 'text-brand-700', bg: 'bg-brand-500' },
  shopping: { label: 'Shopping', color: 'text-pink-700', bg: 'bg-pink-500' },
  other: { label: 'Other', color: 'text-slate-700', bg: 'bg-slate-500' },
};

const CATEGORIES: ExpenseCategory[] = ['food', 'transport', 'accommodation', 'activities', 'shopping', 'other'];

interface BudgetTabProps {
  trip: Trip;
  expenses: Expense[];
  onChange: () => void;
}

export function BudgetTab({ trip, expenses, onChange }: BudgetTabProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<ExpenseCategory | 'all'>('all');

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const budget = Number(trip.budget) || 0;
  const remaining = budget - total;
  const pctUsed = budget > 0 ? (total / budget) * 100 : 0;

  const byCategory = CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + Number(e.amount), 0),
    count: expenses.filter(e => e.category === cat).length,
  })).filter(c => c.count > 0);

  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.category === filter);
  const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      onChange();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (data: { description: string; amount: string; category: ExpenseCategory; date: string }) => {
    setLoading(true);
    try {
      await addExpense(trip.id, {
        description: data.description,
        amount: parseFloat(data.amount),
        category: data.category,
        date: data.date,
      });
      setShowAdd(false);
      onChange();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div>
      {/* Budget overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Wallet className="w-4 h-4" /> Total Budget
          </div>
          <p className="font-display text-2xl font-bold text-slate-800">{formatCurrency(budget, trip.currency)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <TrendingUp className="w-4 h-4" /> Spent
          </div>
          <p className="font-display text-2xl font-bold text-slate-800">{formatCurrency(total, trip.currency)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <PieChart className="w-4 h-4" /> Remaining
          </div>
          <p className={cn(
            'font-display text-2xl font-bold',
            remaining < 0 ? 'text-red-600' : 'text-brand-600'
          )}>
            {formatCurrency(remaining, trip.currency)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {budget > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Budget usage</span>
            <span className={cn(
              'text-sm font-bold',
              pctUsed > 100 ? 'text-red-600' : pctUsed > 80 ? 'text-sand-600' : 'text-brand-600'
            )}>
              {pctUsed.toFixed(0)}%
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                pctUsed > 100 ? 'bg-red-500' : pctUsed > 80 ? 'bg-sand-500' : 'bg-brand-500'
              )}
              style={{ width: `${Math.min(pctUsed, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-6">
          <h3 className="font-display font-semibold text-slate-800 mb-4">By Category</h3>
          <div className="space-y-3">
            {byCategory.map(({ cat, total: catTotal, count }) => {
              const config = categoryConfig[cat];
              const pct = total > 0 ? (catTotal / total) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <span className={cn('w-2.5 h-2.5 rounded-full', config.bg)} />
                      <span className="font-medium text-slate-600">{config.label}</span>
                      <span className="text-slate-400">({count})</span>
                    </span>
                    <span className="font-semibold text-slate-700">{formatCurrency(catTotal, trip.currency)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', config.bg)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add expense button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-slate-800">Expenses</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-sm flex items-center gap-1.5 py-2">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {showAdd && (
        <AddExpenseForm onAdd={handleAdd} onCancel={() => setShowAdd(false)} loading={loading} defaultDate={trip.start_date} />
      )}

      {/* Filter chips */}
      {expenses.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
              filter === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            All ({expenses.length})
          </button>
          {byCategory.map(({ cat, count }) => {
            const config = categoryConfig[cat];
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  filter === cat ? config.bg + ' text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                )}
              >
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Expense list */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{expenses.length === 0 ? 'No expenses logged yet.' : 'No expenses in this category.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(expense => {
            const config = categoryConfig[expense.category] ?? categoryConfig.other;
            return (
              <div
                key={expense.id}
                className="group flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow animate-fade-in"
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', config.bg + '/10')}>
                  <div className={cn('w-2.5 h-2.5 rounded-full', config.bg)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{expense.description}</p>
                  <p className="text-xs text-slate-400">
                    {formatDateShort(expense.date)} · {config.label}
                  </p>
                </div>
                <p className="font-display font-bold text-slate-800">{formatCurrency(Number(expense.amount), trip.currency)}</p>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1"
                  aria-label="Delete expense"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddExpenseForm({ onAdd, onCancel, loading, defaultDate }: {
  onAdd: (data: { description: string; amount: string; category: ExpenseCategory; date: string }) => void;
  onCancel: () => void;
  loading: boolean;
  defaultDate: string;
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [date, setDate] = useState(defaultDate);

  return (
    <div className="mb-4 p-4 rounded-xl border border-brand-200 bg-brand-50/50 animate-scale-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was it for?"
          className="input-field"
          autoFocus
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          min="0"
          step="0.01"
          className="input-field"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input-field"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          className="input-field"
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{categoryConfig[cat].label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary text-sm py-2">Cancel</button>
        <button
          type="button"
          onClick={() => description.trim() && amount && onAdd({ description: description.trim(), amount, category, date })}
          disabled={loading || !description.trim() || !amount}
          className="btn-primary text-sm py-2 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add
        </button>
      </div>
    </div>
  );
}

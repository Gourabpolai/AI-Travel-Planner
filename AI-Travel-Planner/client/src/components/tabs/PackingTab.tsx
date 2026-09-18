import { useState } from 'react';
import { Plus, Trash2, Check, Loader2 } from 'lucide-react';
import { updatePackingItem, deletePackingItem, addPackingItems } from '@/api/packingApi';
import type { PackingCategory, PackingItem, Trip } from '@/lib/types';
import { cn } from '@/lib/utils';

const categoryConfig: Record<PackingCategory, { label: string; icon: string }> = {
  essentials: { label: 'Essentials', icon: '🎒' },
  clothing: { label: 'Clothing', icon: '👕' },
  electronics: { label: 'Electronics', icon: '🔌' },
  documents: { label: 'Documents', icon: '📄' },
  toiletries: { label: 'Toiletries', icon: '🧴' },
};

const CATEGORIES: PackingCategory[] = ['essentials', 'clothing', 'electronics', 'documents', 'toiletries'];

const DEFAULT_PACKING: Record<PackingCategory, string[]> = {
  essentials: ['Passport', 'Wallet', 'Phone', 'Keys', 'Sunglasses'],
  clothing: ['T-shirts', 'Pants', 'Underwear', 'Socks', 'Jacket', 'Comfortable shoes'],
  electronics: ['Phone charger', 'Power bank', 'Headphones', 'Adapter'],
  documents: ['Boarding pass', 'Hotel reservation', 'Travel insurance'],
  toiletries: ['Toothbrush', 'Toothpaste', 'Deodorant', 'Shampoo', 'Sunscreen'],
};

interface PackingTabProps {
  trip: Trip;
  items: PackingItem[];
  onChange: () => void;
}

export function PackingTab({ trip, items, onChange }: PackingTabProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);

  const byCategory = CATEGORIES.map(cat => ({
    cat,
    items: items.filter(i => i.category === cat),
  })).filter(c => c.items.length > 0);

  const checkedCount = items.filter(i => i.checked).length;
  const pct = items.length > 0 ? (checkedCount / items.length) * 100 : 0;

  const toggleItem = async (item: PackingItem) => {
    try {
      await updatePackingItem(item.id, { checked: !item.checked });
      onChange();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePackingItem(id);
      onChange();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (name: string, category: PackingCategory) => {
    setLoading(true);
    try {
      await addPackingItems(trip.id, [{ name, category }]);
      setShowAdd(false);
      onChange();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const generateDefaultList = async () => {
    setAutoLoading(true);
    const itemsToAdd: { name: string; category: PackingCategory }[] = [];
    CATEGORIES.forEach(cat => {
      DEFAULT_PACKING[cat].forEach(name => {
        if (!items.some(i => i.name === name)) {
          itemsToAdd.push({ name, category: cat });
        }
      });
    });
    if (itemsToAdd.length > 0) {
      try {
        await addPackingItems(trip.id, itemsToAdd);
        onChange();
      } catch (err) {
        console.error(err);
      }
    }
    setAutoLoading(false);
  };

  return (
    <div>
      {/* Progress overview */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-slate-800">Packing Progress</h3>
          <span className="text-sm font-bold text-brand-600">
            {checkedCount} / {items.length} packed
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-sm text-slate-400 mt-2">
          {pct === 100 ? 'All packed! Ready to go.' : `${pct.toFixed(0)}% complete`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-slate-800">Checklist</h3>
        <div className="flex gap-2">
          {items.length === 0 && (
            <button
              onClick={generateDefaultList}
              disabled={autoLoading}
              className="btn-secondary text-sm flex items-center gap-1.5 py-2"
            >
              {autoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Starter List
            </button>
          )}
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-sm flex items-center gap-1.5 py-2">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {showAdd && <AddItemForm onAdd={handleAdd} onCancel={() => setShowAdd(false)} loading={loading} />}

      {/* Packing categories */}
      {byCategory.length === 0 && !showAdd ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <div className="text-4xl mb-3">🎒</div>
          <p className="text-slate-500 mb-1">No packing items yet.</p>
          <p className="text-sm text-slate-400">Add items manually or use the starter list.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {byCategory.map(({ cat, items: catItems }) => {
            const config = categoryConfig[cat];
            const catChecked = catItems.filter(i => i.checked).length;
            return (
              <div key={cat} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <span className="font-display font-semibold text-slate-800">{config.label}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    {catChecked}/{catItems.length}
                  </span>
                </div>
                <div className="p-3">
                  {catItems.map(item => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <button
                        onClick={() => toggleItem(item)}
                        className={cn(
                          'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0',
                          item.checked
                            ? 'bg-brand-600 border-brand-600'
                            : 'border-slate-300 hover:border-brand-400'
                        )}
                        aria-label={item.checked ? 'Mark as unpacked' : 'Mark as packed'}
                      >
                        {item.checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </button>
                      <span
                        className={cn(
                          'flex-1 text-sm transition-all',
                          item.checked ? 'line-through text-slate-400' : 'text-slate-700'
                        )}
                      >
                        {item.name}
                      </span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddItemForm({ onAdd, onCancel, loading }: {
  onAdd: (name: string, category: PackingCategory) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PackingCategory>('essentials');

  return (
    <div className="mb-4 p-4 rounded-xl border border-brand-200 bg-brand-50/50 animate-scale-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          className="input-field"
          autoFocus
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as PackingCategory)}
          className="input-field"
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{categoryConfig[cat].icon} {categoryConfig[cat].label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary text-sm py-2">Cancel</button>
        <button
          type="button"
          onClick={() => name.trim() && onAdd(name.trim(), category)}
          disabled={loading || !name.trim()}
          className="btn-primary text-sm py-2 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add Item
        </button>
      </div>
    </div>
  );
}

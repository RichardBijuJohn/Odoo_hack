<<<<<<< HEAD
import { useState } from 'react'
import { Plus, Package, Layers, DollarSign, FileText, CheckCircle, AlertCircle, X } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import { useCatalog } from '../../context/CatalogContext'
import { useAuth } from '../../context/AuthContext'

export default function Products() {
  const { products, addProduct } = useCatalog()
  const { isAdmin } = useAuth()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'Software',
    salesPrice: '',
    costPrice: '',
    notes: '',
    variants: [
      { id: '1', attribute: 'Brand', value: 'Brightloop Standard', priceDelta: 0 },
      { id: '2', attribute: 'Brand', value: 'Odoo', priceDelta: 560 }
    ]
  })

  const [newVariant, setNewVariant] = useState({
    attribute: 'Brand',
    value: '',
    priceDelta: ''
  })

  const [feedback, setFeedback] = useState('')

  const handleAddVariant = () => {
    if (!newVariant.value.trim()) return
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          id: Date.now().toString(),
          attribute: newVariant.attribute,
          value: newVariant.value.trim(),
          priceDelta: parseFloat(newVariant.priceDelta) || 0
        }
      ]
    }))
    setNewVariant({ attribute: 'Brand', value: '', priceDelta: '' })
  }

  const handleRemoveVariant = (id) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== id)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.salesPrice) return

    addProduct({
      name: formData.name,
      type: formData.type,
      salesPrice: parseFloat(formData.salesPrice),
      costPrice: parseFloat(formData.costPrice) || 0,
      notes: formData.notes,
      variants: formData.variants
    })

    setFeedback(`Product "${formData.name}" added successfully!`)
    setTimeout(() => setFeedback(''), 3500)
    setIsModalOpen(false)
    setFormData({
      name: '',
      type: 'Software',
      salesPrice: '',
      costPrice: '',
      notes: '',
      variants: [
        { id: '1', attribute: 'Brand', value: 'Brightloop Standard', priceDelta: 0 },
        { id: '2', attribute: 'Brand', value: 'Odoo', priceDelta: 560 }
      ]
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Offerings"
        description="Add and manage core products, sales prices, cost margins, and variant add-ons."
        action={
          isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          )
        }
      />

      {feedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5 text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Catalog Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                  {product.code}
                </span>
                <span className="text-xs px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-medium rounded-full">
                  {product.type}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-800 mb-1">{product.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mb-4">{product.notes || 'No description provided.'}</p>

              {/* Price Breakdown */}
              <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Sales Price:</span>
                  <span className="font-bold text-slate-900">${product.salesPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Cost Price:</span>
                  <span className="font-medium">${product.costPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 pt-1 border-t border-slate-200 font-medium">
                  <span>Gross Margin:</span>
                  <span>
                    ${(product.salesPrice - product.costPrice).toFixed(2)} (
                    {Math.round(((product.salesPrice - product.costPrice) / (product.salesPrice || 1)) * 100)}%)
                  </span>
                </div>
              </div>

              {/* Variants Section */}
              <div>
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Configured Variants ({product.variants?.length || 0})</span>
                </p>
                <div className="space-y-1.5">
                  {product.variants?.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-slate-100/80 rounded-lg text-slate-700"
                    >
                      <span>
                        <span className="text-slate-400 font-mono">{v.attribute}:</span>{' '}
                        <strong>{v.value}</strong>
                      </span>
                      <span className={`font-semibold ${v.priceDelta > 0 ? 'text-blue-600' : 'text-slate-500'}`}>
                        {v.priceDelta > 0 ? `+$${v.priceDelta}` : 'Standard price'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Status: <strong className="text-emerald-600">{product.status}</strong></span>
              <span>Available for all plans</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Product Modal (Admin Exclusive) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Launch New Product</h3>
                  <p className="text-xs text-slate-500">Configure pricing, costs, and pricing variants</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brightloop Enterprise Suite"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Software">Software</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Service">Service</option>
                    <option value="Consulting">Consulting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Sales Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="299.00"
                    value={formData.salesPrice}
                    onChange={(e) => setFormData({ ...formData, salesPrice: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Cost Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="80.00"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Product Notes / Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Internal notes or marketing summary..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Variants Builder */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Product Variants & Add-ons
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      e.g., Selecting "Odoo" brand adds 560 to the sales price.
                    </p>
                  </div>
                </div>

                {/* Existing variants */}
                <div className="space-y-2 mb-3">
                  {formData.variants.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{v.attribute}:</span>
                        <strong className="text-slate-800">{v.value}</strong>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-blue-600">
                          {v.priceDelta > 0 ? `+ $${v.priceDelta}` : 'No delta ($0)'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(v.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new variant row */}
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Attribute (e.g. Brand)"
                    value={newVariant.attribute}
                    onChange={(e) => setNewVariant({ ...newVariant, attribute: e.target.value })}
                    className="w-1/3 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Odoo)"
                    value={newVariant.value}
                    onChange={(e) => setNewVariant({ ...newVariant, value: e.target.value })}
                    className="w-1/3 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                  <input
                    type="number"
                    placeholder="Add price ($)"
                    value={newVariant.priceDelta}
                    onChange={(e) => setNewVariant({ ...newVariant, priceDelta: e.target.value })}
                    className="w-1/4 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
=======
import { useCallback, useEffect, useState } from 'react'
import {
  Archive, ArrowDown, ArrowUp, Boxes, ChevronLeft, ChevronRight, CircleAlert,
  Eye, ImageOff, LoaderCircle, Package, Pencil, Plus, Search, Tag, Trash2,
  X,
} from 'lucide-react'
import API from '../../services/api'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageHeader from '../../components/PageHeader'

const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0))
const dateLabel = (value) => value ? new Date(value).toLocaleDateString() : '—'
const readableError = (error) => error?.message || (typeof error === 'string' ? error : 'Request failed. Please try again.')
const emptySummary = { total_products: 0, active_products: 0, out_of_stock_products: 0, low_stock_products: 0, total_categories: 0, recently_added: [] }
const blankProduct = () => ({ name: '', code: '', description: '', category_id: '', price: '', cost_price: '', stock_quantity: '0', minimum_stock_level: '0', unit_of_measure: 'unit', image_url: '', status: 'active' })
const stockStyles = {
  in_stock: 'bg-emerald-50 text-emerald-700',
  low_stock: 'bg-amber-50 text-amber-800',
  out_of_stock: 'bg-red-50 text-red-700',
}
const stockLabels = { in_stock: 'In stock', low_stock: 'Low stock', out_of_stock: 'Out of stock' }
const statusStyles = { active: 'bg-emerald-50 text-emerald-700', inactive: 'bg-slate-100 text-slate-600', archived: 'bg-amber-50 text-amber-800' }

function Dialog({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-label={title} className={`max-h-[92vh] w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} overflow-y-auto rounded-lg bg-white p-5 shadow-xl sm:p-6`}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button type="button" className="table-action" aria-label="Close dialog" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        {children}
      </section>
    </div>
  )
}

function ProductImage({ src, name, size = 'h-12 w-12' }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <div className={`${size} flex shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400`}><ImageOff className="h-5 w-5" /></div>
  return <img className={`${size} shrink-0 rounded-md border border-slate-200 object-cover`} src={src} alt={name} onError={() => setFailed(true)} />
}

function ProductForm({ product, categories, onClose, onSaved, onManageCategories }) {
  const [form, setForm] = useState(() => product ? {
    name: product.name,
    code: product.code,
    description: product.description || '',
    category_id: String(product.category_id || ''),
    price: String(product.price ?? ''),
    cost_price: product.cost_price === null ? '' : String(product.cost_price ?? ''),
    stock_quantity: String(product.stock_quantity ?? 0),
    minimum_stock_level: String(product.minimum_stock_level ?? 0),
    unit_of_measure: product.unit_of_measure || 'unit',
    image_url: product.image_url || '',
    status: product.status || 'active',
  } : blankProduct())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      category_id: Number(form.category_id),
      price: Number(form.price),
      cost_price: form.cost_price === '' ? null : Number(form.cost_price),
      stock_quantity: Number(form.stock_quantity),
      minimum_stock_level: Number(form.minimum_stock_level),
    }
    try {
      if (product) await API.put(`/products/${product.id}`, payload)
      else await API.post('/products', payload)
      onSaved(product ? 'Product updated.' : 'Product created.')
    } catch (requestError) {
      setError(readableError(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog title={product ? 'Edit product' : 'Add product'} onClose={onClose} wide>
      <form className="space-y-5" onSubmit={submit}>
        {error && <ErrorMessage message={error} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">Product name<input className="field-control" required maxLength={150} value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
          <label className="field-label">Product ID / SKU<input className="field-control font-mono" maxLength={50} value={form.code} onChange={(event) => update('code', event.target.value)} placeholder="Leave blank to generate" /></label>
          <label className="field-label sm:col-span-2">Description<textarea className="field-control min-h-20" maxLength={10000} value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
          <label className="field-label">Category
            <span className="flex gap-2"><select className="field-control" required value={form.category_id} onChange={(event) => update('category_id', event.target.value)}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><button type="button" className="button-secondary shrink-0 px-3" onClick={onManageCategories} title="Manage categories"><Tag className="h-4 w-4" /></button></span>
          </label>
          <label className="field-label">Product status<select className="field-control" value={form.status} onChange={(event) => update('status', event.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select></label>
          <label className="field-label">Selling price (₹)<input className="field-control" type="number" min="0" max="99999999.99" step="0.01" required value={form.price} onChange={(event) => update('price', event.target.value)} /></label>
          <label className="field-label">Cost price (₹)<input className="field-control" type="number" min="0" max="99999999.99" step="0.01" value={form.cost_price} onChange={(event) => update('cost_price', event.target.value)} /></label>
          <label className="field-label">Available quantity<input className="field-control" type="number" min="0" max="999999999.999" step="0.001" required value={form.stock_quantity} onChange={(event) => update('stock_quantity', event.target.value)} /></label>
          <label className="field-label">Minimum stock level<input className="field-control" type="number" min="0" max="999999999.999" step="0.001" required value={form.minimum_stock_level} onChange={(event) => update('minimum_stock_level', event.target.value)} /></label>
          <label className="field-label">Unit of measurement<input className="field-control" required maxLength={30} value={form.unit_of_measure} onChange={(event) => update('unit_of_measure', event.target.value)} placeholder="unit, box, kg…" /></label>
          <label className="field-label">Product image URL<input className="field-control" type="url" maxLength={2048} value={form.image_url} onChange={(event) => update('image_url', event.target.value)} placeholder="https://…" /></label>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" className="button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button-primary" disabled={saving || categories.length === 0}>{saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}</button></div>
        {categories.length === 0 && <p className="text-right text-xs text-amber-700">Create a category before adding products.</p>}
      </form>
    </Dialog>
  )
}

function CategoryManager({ categories, onClose, onChanged }) {
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function beginEdit(category) {
    setEditing(category)
    setName(category.name)
    setDescription(category.description || '')
    setError('')
  }

  function reset() {
    setEditing(null)
    setName('')
    setDescription('')
    setError('')
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { name, description }
      if (editing) await API.put(`/products/categories/${editing.id}`, payload)
      else await API.post('/products/categories', payload)
      reset()
      onChanged(editing ? 'Category updated.' : 'Category created.')
    } catch (requestError) {
      setError(readableError(requestError))
    } finally {
      setSaving(false)
    }
  }

  async function remove(category) {
    if (!window.confirm(`Delete category “${category.name}”?`)) return
    setError('')
    try {
      await API.delete(`/products/categories/${category.id}`)
      onChanged('Category deleted.')
    } catch (requestError) {
      setError(readableError(requestError))
    }
  }

  return (
    <Dialog title="Product categories" onClose={onClose}>
      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
      <form className="mb-5 space-y-3 rounded-md bg-slate-50 p-3" onSubmit={save}>
        <label className="field-label">Category name<input className="field-control" required maxLength={50} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="field-label">Description<input className="field-control" maxLength={255} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <div className="flex justify-end gap-2">{editing && <button type="button" className="button-secondary" onClick={reset}>Cancel edit</button>}<button type="submit" className="button-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save category' : 'Add category'}</button></div>
      </form>
      <div className="divide-y divide-slate-100">
        {categories.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No categories yet.</p> : categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{category.name}</p><p className="text-xs text-slate-500">{category.product_count} products{category.description ? ` · ${category.description}` : ''}</p></div>
            <div className="flex shrink-0"><button type="button" className="table-action" title={`Edit ${category.name}`} onClick={() => beginEdit(category)}><Pencil className="h-4 w-4" /></button><button type="button" className="table-action text-red-600" title={`Delete ${category.name}`} onClick={() => remove(category)}><Trash2 className="h-4 w-4" /></button></div>
          </div>
        ))}
      </div>
    </Dialog>
  )
}

function ProductDetails({ product, onClose, onEdit, onDelete, onStockChanged }) {
  const [quantity, setQuantity] = useState(String(product.stock_quantity))
  const [reason, setReason] = useState('Stock count adjustment')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function updateStock(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await API.patch(`/products/${product.id}/stock`, { stock_quantity: Number(quantity), reason })
      onStockChanged('Stock updated and movement recorded.')
    } catch (requestError) {
      setError(readableError(requestError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog title="Product details" onClose={onClose} wide>
      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
      <div className="flex flex-col gap-5 sm:flex-row">
        <ProductImage src={product.image_url} name={product.name} size="h-28 w-28" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-semibold text-slate-900">{product.name}</h3><p className="mt-1 font-mono text-sm text-slate-500">{product.code}</p></div><div className="flex gap-2"><button className="button-secondary" type="button" onClick={onEdit}><Pencil className="h-4 w-4" /> Edit</button><button className="button-secondary text-red-700" type="button" onClick={onDelete}><Trash2 className="h-4 w-4" /> Delete</button></div></div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{product.description || 'No description provided.'}</p>
        </div>
      </div>
      <dl className="mt-5 grid gap-3 border-y border-slate-100 py-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['Category', product.category || 'Uncategorized'], ['Selling price', money(product.price)], ['Cost price', product.cost_price === null ? '—' : money(product.cost_price)],
          ['Available stock', `${product.stock_quantity} ${product.unit_of_measure}`], ['Minimum stock', `${product.minimum_stock_level} ${product.unit_of_measure}`], ['Stock state', stockLabels[product.stock_status]],
          ['Status', product.status], ['Product ID / SKU', product.code], ['Date added', new Date(product.created_at).toLocaleString()],
        ].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-medium capitalize text-slate-800">{value || '—'}</dd></div>)}
      </dl>
      <form className="mt-5 grid gap-3 rounded-md bg-slate-50 p-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end" onSubmit={updateStock}>
        <label className="field-label">Set available quantity<input className="field-control" type="number" min="0" max="999999999.999" step="0.001" required value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
        <label className="field-label">Adjustment reason<input className="field-control" required maxLength={255} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
        <button type="submit" className="button-primary" disabled={saving}>{saving ? 'Updating…' : 'Update stock'}</button>
      </form>
      <div className="mt-6">
        <h3 className="mb-3 font-semibold text-slate-800">Stock update history</h3>
        {product.stock_history?.length ? <div className="overflow-x-auto rounded-md border border-slate-200"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Previous</th><th className="px-3 py-2">Change</th><th className="px-3 py-2">New</th><th className="px-3 py-2">Reason</th></tr></thead><tbody>{product.stock_history.map((movement) => <tr key={movement.id} className="border-t border-slate-100"><td className="whitespace-nowrap px-3 py-2">{new Date(movement.created_at).toLocaleString()}</td><td className="px-3 py-2">{movement.previous_quantity}</td><td className={`px-3 py-2 font-medium ${Number(movement.quantity_change) < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{Number(movement.quantity_change) > 0 ? '+' : ''}{movement.quantity_change}</td><td className="px-3 py-2">{movement.new_quantity}</td><td className="px-3 py-2">{movement.reason}</td></tr>)}</tbody></table></div> : <p className="rounded-md border border-dashed border-slate-300 py-6 text-center text-sm text-slate-500">No stock changes recorded.</p>}
      </div>
    </Dialog>
  )
}

function StatCard({ label, value, detail, icon: Icon, tone }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-slate-500">{label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-md ${tone}`}><Icon className="h-4 w-4" /></span></div><p className="mt-3 truncate text-2xl font-semibold text-slate-900">{value}</p><p className="mt-1 truncate text-xs text-slate-500">{detail}</p></div>
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [summary, setSummary] = useState(emptySummary)
  const [pagination, setPagination] = useState({ page: 1, total_pages: 0, total: 0, page_size: 10 })
  const [filters, setFilters] = useState({ search: '', category_id: '', stock_status: '', status: '', sort_by: 'recent', direction: 'desc' })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [modal, setModal] = useState(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [listResponse, summaryResponse, categoryResponse] = await Promise.all([
        API.get('/products', { params: { ...filters, page, limit: 10 } }),
        API.get('/products/summary'),
        API.get('/products/categories'),
      ])
      setProducts(listResponse.data)
      setPagination(listResponse.pagination)
      setSummary(summaryResponse.data)
      setCategories(categoryResponse.data)
    } catch (requestError) {
      setError(readableError(requestError))
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => { loadData() }, [loadData])

  function changeFilter(key, value) {
    setPage(1)
    setFilters((current) => ({ ...current, [key]: value }))
  }

  async function refresh(message) {
    if (message) setNotice(message)
    setModal(null)
    await loadData()
  }

  async function openDetails(id) {
    setBusyId(id)
    setError('')
    try {
      const response = await API.get(`/products/${id}`)
      setModal({ type: 'details', product: response.data })
    } catch (requestError) {
      setError(readableError(requestError))
    } finally {
      setBusyId(null)
    }
  }

  async function removeProduct(product) {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return
    setBusyId(product.id)
    setError('')
    setNotice('')
    try {
      await API.delete(`/products/${product.id}`)
      setNotice('Product deleted.')
      if (products.length === 1 && page > 1) setPage((current) => current - 1)
      else await loadData()
      setModal(null)
    } catch (requestError) {
      setError(readableError(requestError))
    } finally {
      setBusyId(null)
    }
  }

  async function categoryChanged(message) {
    setNotice(message)
    setError('')
    try {
      const [categoryResponse, summaryResponse] = await Promise.all([API.get('/products/categories'), API.get('/products/summary')])
      setCategories(categoryResponse.data)
      setSummary(summaryResponse.data)
    } catch (requestError) {
      setError(readableError(requestError))
    }
  }

  async function stockChanged(message) {
    const productId = modal?.product?.id
    setNotice(message)
    await loadData()
    if (productId) {
      try {
        const response = await API.get(`/products/${productId}`)
        setModal({ type: 'details', product: response.data })
      } catch (requestError) {
        setError(readableError(requestError))
        setModal(null)
      }
    }
  }

  async function editFromDetails() {
    if (!modal?.product) return
    const response = await API.get(`/products/${modal.product.id}`)
    setModal({ type: 'edit', product: response.data })
  }

  const recentProduct = summary.recently_added?.[0]
  const categoryManagerOpen = modal?.type === 'categories' || categoryDialogOpen
  const dialogProduct = modal?.product

  return (
    <div className="space-y-6">
      <PageHeader title="Products" description="Manage your product catalog, categories, and inventory." action={<div className="flex flex-wrap gap-2"><button type="button" className="button-secondary" onClick={() => setModal({ type: 'categories' })}><Tag className="h-4 w-4" /> Categories</button><button type="button" className="button-primary" onClick={() => setModal({ type: 'create' })}><Plus className="h-4 w-4" /> Add product</button></div>} />
      {error && <ErrorMessage message={error} />}
      {notice && <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6" aria-label="Product statistics">
        <StatCard label="Total products" value={summary.total_products} detail="All catalog items" icon={Package} tone="bg-sky-50 text-sky-700" />
        <StatCard label="Active products" value={summary.active_products} detail="Available in catalog" icon={Boxes} tone="bg-emerald-50 text-emerald-700" />
        <StatCard label="Out of stock" value={summary.out_of_stock_products} detail="Quantity is zero" icon={CircleAlert} tone="bg-red-50 text-red-700" />
        <StatCard label="Low stock" value={summary.low_stock_products} detail="At or below minimum" icon={Archive} tone="bg-amber-50 text-amber-800" />
        <StatCard label="Categories" value={summary.total_categories} detail={`${summary.used_categories || 0} in use`} icon={Tag} tone="bg-indigo-50 text-indigo-700" />
        <StatCard label="Recently added" value={recentProduct?.name || 'None yet'} detail={recentProduct ? `${recentProduct.code} · ${dateLabel(recentProduct.created_at)}` : 'New products appear here'} icon={Plus} tone="bg-rose-50 text-rose-700" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div><h2 className="font-semibold text-slate-900">Product catalog</h2><p className="mt-1 text-sm text-slate-500">{pagination.total.toLocaleString()} products</p></div>
            <label className="relative block w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input aria-label="Search products" className="field-control pl-9" value={filters.search} onChange={(event) => changeFilter('search', event.target.value)} placeholder="Search name, SKU, or ID" /></label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <select aria-label="Filter by category" className="field-control" value={filters.category_id} onChange={(event) => changeFilter('category_id', event.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name} ({category.product_count})</option>)}</select>
            <select aria-label="Filter by stock status" className="field-control" value={filters.stock_status} onChange={(event) => changeFilter('stock_status', event.target.value)}><option value="">All stock levels</option><option value="in_stock">In stock</option><option value="low_stock">Low stock</option><option value="out_of_stock">Out of stock</option></select>
            <select aria-label="Filter by product status" className="field-control" value={filters.status} onChange={(event) => changeFilter('status', event.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option></select>
            <div className="flex gap-2"><select aria-label="Sort products" className="field-control" value={filters.sort_by} onChange={(event) => changeFilter('sort_by', event.target.value)}><option value="recent">Recently added</option><option value="name">Product name</option><option value="price">Selling price</option><option value="stock">Available stock</option></select><button type="button" className="button-secondary shrink-0 px-3" aria-label={`Sort ${filters.direction === 'asc' ? 'descending' : 'ascending'}`} title={`Sort ${filters.direction === 'asc' ? 'descending' : 'ascending'}`} onClick={() => changeFilter('direction', filters.direction === 'asc' ? 'desc' : 'asc')}>{filters.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}</button></div>
          </div>
          <div className="flex justify-end"><button type="button" className="button-secondary" onClick={() => { setFilters({ search: '', category_id: '', stock_status: '', status: '', sort_by: 'recent', direction: 'desc' }); setPage(1) }}>Clear filters</button></div>
        </div>

        {loading ? <LoadingSpinner text="Loading products…" /> : products.length === 0 ? (
          pagination.total === 0 && !filters.search && !filters.category_id && !filters.stock_status && !filters.status
            ? <EmptyState title="No products yet" description="Add your first product to start managing the catalog and inventory." action={<button type="button" className="button-primary" onClick={() => setModal({ type: 'create' })}><Plus className="h-4 w-4" /> Add product</button>} />
            : <EmptyState title="No matching products" description="Try adjusting or clearing the search and filters." />
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr>
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3"><button className="inline-flex items-center gap-1" onClick={() => setFilters((current) => ({ ...current, sort_by: 'price', direction: current.sort_by === 'price' && current.direction === 'asc' ? 'desc' : 'asc' }))}>Selling price{filters.sort_by === 'price' && (filters.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</button></th>
                  <th className="px-3 py-3">Cost</th><th className="px-3 py-3">Available stock</th><th className="px-3 py-3">Stock state</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Date added</th><th className="px-3 py-3 text-right">Actions</th>
                </tr></thead>
                <tbody>{products.map((product) => (
                  <tr key={product.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-3"><div className="flex items-center gap-3"><ProductImage src={product.image_url} name={product.name} /><div className="min-w-0"><button type="button" className="block max-w-56 truncate text-left font-semibold text-slate-800 hover:text-blue-700" onClick={() => openDetails(product.id)}>{product.name}</button><span className="font-mono text-xs text-slate-500">{product.code}</span></div></div></td>
                    <td className="px-3 py-3 text-slate-600">{product.category || 'Uncategorized'}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-800">{money(product.price)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{product.cost_price === null ? '—' : money(product.cost_price)}</td>
                    <td className="whitespace-nowrap px-3 py-3 tabular-nums text-slate-700">{product.stock_quantity} {product.unit_of_measure}</td>
                    <td className="px-3 py-3"><span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${stockStyles[product.stock_status]}`}>{stockLabels[product.stock_status]}</span></td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusStyles[product.status]}`}>{product.status}</span></td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{dateLabel(product.created_at)}</td>
                    <td className="px-3 py-3"><div className="flex justify-end gap-1"><button type="button" className="table-action" title="View product" disabled={busyId === product.id} onClick={() => openDetails(product.id)}><Eye className="h-4 w-4" /></button><button type="button" className="table-action" title="Edit product" onClick={() => setModal({ type: 'edit', product })}><Pencil className="h-4 w-4" /></button><button type="button" className="table-action text-red-600" title="Delete product" disabled={busyId === product.id} onClick={() => removeProduct(product)}><Trash2 className="h-4 w-4" /></button></div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">Page {pagination.page} of {Math.max(pagination.total_pages, 1)}</span><div className="flex items-center gap-2"><button type="button" className="button-secondary px-3" aria-label="Previous products page" disabled={page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}><ChevronLeft className="h-4 w-4" /></button><button type="button" className="button-secondary px-3" aria-label="Next products page" disabled={page >= pagination.total_pages} onClick={() => setPage((current) => current + 1)}><ChevronRight className="h-4 w-4" /></button></div></div>
          </>
        )}
      </section>

      {modal?.type === 'create' && <ProductForm categories={categories} onClose={() => setModal(null)} onSaved={refresh} onManageCategories={() => setCategoryDialogOpen(true)} />}
      {modal?.type === 'edit' && <ProductForm product={modal.product} categories={categories} onClose={() => setModal(null)} onSaved={refresh} onManageCategories={() => setCategoryDialogOpen(true)} />}
      {categoryManagerOpen && <CategoryManager categories={categories} onClose={() => { if (categoryDialogOpen) setCategoryDialogOpen(false); else setModal(null) }} onChanged={categoryChanged} />}
      {modal?.type === 'details' && dialogProduct && <ProductDetails product={dialogProduct} onClose={() => setModal(null)} onEdit={editFromDetails} onDelete={() => removeProduct(dialogProduct)} onStockChanged={stockChanged} />}
>>>>>>> 16143d5c5cc45687c84965c85ea3e2995625fc37
    </div>
  )
}

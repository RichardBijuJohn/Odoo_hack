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
    </div>
  )
}

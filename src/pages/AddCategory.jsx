import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { ArrowLeft, Save, Layers, X, CheckCircle } from 'lucide-react'

function AddCategory() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Category name is required')
      return
    }

    setIsSubmitting(true)
    try {
      await window.electronAPI.createCategory({ name: name.trim() })
      setShowSuccess(true)
      setName('')
      
      setTimeout(() => {
        setShowSuccess(false)
        navigate('/categories')
      }, 2000)
    } catch (error) {
      console.error('Error creating category:', error)
      alert('Failed to create category. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/categories')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all duration-200 text-slate-600 hover:text-slate-900 text-sm font-medium"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-7 h-7 text-indigo-600" />
              Add Category
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Create a new product category
            </p>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-800">Category created successfully!</p>
              <p className="text-sm text-green-600">Redirecting to categories list...</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Layers size={16} className="text-indigo-500" />
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                placeholder="Enter category name"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm`}
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                  <X size={12} />
                  {error}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                Category names should be unique and descriptive.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md flex-1 sm:flex-none"
              >
                <Save size={18} />
                {isSubmitting ? 'Saving...' : 'Save Category'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/categories')}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all duration-200 font-medium text-sm flex-1 sm:flex-none"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

export default AddCategory
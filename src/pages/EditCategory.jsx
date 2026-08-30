import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { ArrowLeft, Save, Layers, X, Loader } from 'lucide-react'

function EditCategory() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadCategory()
  }, [id])

  async function loadCategory() {
    try {
      setIsLoading(true)
      const category = await window.electronAPI.getCategoryById(Number(id))
      setName(category.name || '')
    } catch (error) {
      console.error('Error loading category:', error)
      alert('Failed to load category')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Category name is required')
      return
    }

    setIsSubmitting(true)
    try {
      await window.electronAPI.updateCategory({
        id: Number(id),
        name: name.trim()
      })
      navigate('/categories')
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Failed to update category. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader size={40} className="text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-medium">Loading category...</p>
          </div>
        </div>
      </MainLayout>
    )
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
              Edit Category
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Update category information
            </p>
          </div>
        </div>

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
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md flex-1 sm:flex-none"
              >
                <Save size={18} />
                {isSubmitting ? 'Updating...' : 'Update Category'}
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

export default EditCategory
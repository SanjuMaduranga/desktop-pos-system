import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  Store, Lock, Shield, CheckCircle, AlertCircle, 
  ArrowRight, Key, Building
} from 'lucide-react'

function FirstSetup() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    username: 'admin',
    email: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    storePhone: '',
    storeAddress: ''
  })

  async function handleSubmit(e) {
    e.preventDefault()
    
    // Validate
    if (!formData.name.trim()) {
      setError('Please enter your full name')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!formData.storeName.trim()) {
      setError('Please enter your store name')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Create admin user
      await window.electronAPI.createAdminUser({
        name: formData.name,
        username: formData.username,
        email: formData.email || '',
        password: formData.password
      })

      // Save store settings
      await window.electronAPI.saveSettings({
        storeName: formData.storeName,
        storePhone: formData.storePhone || '',
        storeAddress: formData.storeAddress || '',
        taxRate: '5',
        taxName: 'VAT',
        receiptFooter: 'Thank you for your business!',
        currencySymbol: 'Rs.',
        currencyPosition: 'before',
        defaultPaymentMethod: 'Cash'
      })
      
      setSuccess(true)
      
      // Auto login after setup
      setTimeout(async () => {
        const result = await login({
          username: formData.username,
          password: formData.password
        })
        if (result.success) {
          navigate('/')
        }
      }, 1500)
      
    } catch (error) {
      console.error('Setup error:', error)
      setError(error.message || 'Failed to complete setup. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-600 shadow-lg mb-4">
            <Store className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Welcome to POS System</h1>
          <p className="text-sm text-slate-500 mt-1">Let's set up your system for the first time</p>
        </div>

        {/* Setup Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-2">System Setup</h2>
          <p className="text-sm text-slate-500 mb-6">Please configure your system to get started</p>

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Setup completed successfully!</p>
                <p className="text-xs text-green-600">Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Store Information Section */}
            <div className="mb-6 pb-6 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <Building size={16} className="text-indigo-500" />
                Store Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Store Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter store name"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                    required
                    disabled={isLoading || success}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter store phone"
                    value={formData.storePhone}
                    onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                    disabled={isLoading || success}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Store Address
                  </label>
                  <input
                    type="text"
                    placeholder="Enter store address"
                    value={formData.storeAddress}
                    onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                    disabled={isLoading || success}
                  />
                </div>
              </div>
            </div>

            {/* Admin Account Section */}
            <div className="mb-6 pb-6 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <Shield size={16} className="text-indigo-500" />
                Administrator Account
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                    required
                    disabled={isLoading || success}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email (optional)"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                    disabled={isLoading || success}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="admin"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                    required
                    disabled={isLoading || success}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                      required
                      minLength={6}
                      disabled={isLoading || success}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <Lock size={16} /> : <Key size={16} />}
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                      required
                      disabled={isLoading || success}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <Lock size={16} /> : <Key size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Setup Button */}
            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Setting up...
                </>
              ) : success ? (
                <>
                  <CheckCircle size={18} />
                  Setup Complete!
                </>
              ) : (
                <>
                  Complete Setup
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="text-xs text-slate-400 text-center mt-4 flex items-center justify-center gap-1">
              <Shield size={12} />
              This will create an administrator account. Keep these credentials secure.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default FirstSetup
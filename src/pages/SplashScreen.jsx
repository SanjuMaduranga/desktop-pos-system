import { useEffect, useState } from 'react'
import { Store, Package, ShoppingCart, Truck, Users, TrendingUp } from 'lucide-react'

function SplashScreen() {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('Initializing...')

  useEffect(() => {
    const steps = [
      { progress: 20, status: 'Loading modules...' },
      { progress: 40, status: 'Connecting to database...' },
      { progress: 60, status: 'Loading system settings...' },
      { progress: 80, status: 'Preparing your workspace...' },
      { progress: 100, status: 'Ready!' },
    ]

    let currentStep = 0
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].progress)
        setStatus(steps[currentStep].status)
        currentStep++
      } else {
        clearInterval(interval)
      }
    }, 600)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-600 via-indigo-700 to-purple-700 flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8 relative">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-lg shadow-2xl border border-white/20">
            <Store className="w-14 h-14 text-white" />
          </div>
          {/* Animated rings */}
          <div className="absolute -inset-4">
            <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-ping"></div>
            <div className="absolute inset-0 rounded-full border-2 border-white/5 animate-ping" style={{ animationDelay: '0.5s' }}></div>
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-4xl font-bold text-white mb-2">POS System</h1>
        <p className="text-indigo-200 text-sm mb-8">Inventory Management System</p>

        {/* Loading Progress */}
        <div className="w-80 mx-auto">
          <div className="relative">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            {/* Progress percentage */}
            <span className="absolute -top-6 right-0 text-xs text-indigo-200">
              {Math.round(progress)}%
            </span>
          </div>
          <p className="text-indigo-200 text-sm mt-4">{status}</p>
        </div>

        {/* Loading Features */}
        <div className="mt-8 flex justify-center gap-6">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-1">
              <Package className="w-5 h-5 text-indigo-200" />
            </div>
            <p className="text-xs text-indigo-300">Products</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-1">
              <ShoppingCart className="w-5 h-5 text-indigo-200" />
            </div>
            <p className="text-xs text-indigo-300">POS</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-1">
              <Truck className="w-5 h-5 text-indigo-200" />
            </div>
            <p className="text-xs text-indigo-300">Suppliers</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-1">
              <Users className="w-5 h-5 text-indigo-200" />
            </div>
            <p className="text-xs text-indigo-300">Users</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-1">
              <TrendingUp className="w-5 h-5 text-indigo-200" />
            </div>
            <p className="text-xs text-indigo-300">Reports</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-indigo-300/50 text-xs mt-8">
          &copy; {new Date().getFullYear()} POS System. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default SplashScreen
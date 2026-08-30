import { Link } from 'react-router-dom'
import { Shield, ArrowLeft, Home, AlertTriangle } from 'lucide-react'

function Unauthorized() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-10 h-10 text-red-600" />
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
        </div>
        
        <p className="text-slate-600 mb-2">
          You don't have permission to access this page.
        </p>
        <p className="text-sm text-slate-400 mb-6">
          Please contact your administrator if you believe this is a mistake.
        </p>
        
        <div className="space-y-3">
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-200 font-medium text-sm"
          >
            <Home size={18} />
            Go to Dashboard
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all duration-200 font-medium text-sm"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default Unauthorized
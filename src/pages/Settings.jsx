import { useEffect, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import { 
  Save, Settings as SettingsIcon, Store, MapPin, Phone, Mail, 
  DollarSign, Receipt, Database, Info, 
  X, CheckCircle, Loader, AlertCircle, 
  Printer, FileText, Download, Upload,
  ChevronDown, ChevronRight
} from 'lucide-react'

function Settings() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [backupStatus, setBackupStatus] = useState('')
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  
  // Collapsible sections state
  const [sections, setSections] = useState({
    store: true,
    tax: false,
    receipt: false,
    database: false,
    system: false
  })
  
  const [formData, setFormData] = useState({
    storeName: '',
    storeAddress: '',
    storePhone: '',
    storeEmail: '',
    taxRate: '',
    taxName: 'VAT',
    receiptHeader: '',
    receiptFooter: 'Thank you for your business!',
    showTaxOnReceipt: true,
    currencySymbol: 'Rs.',
    currencyPosition: 'before',
    defaultPaymentMethod: 'Cash'
  })
  
  const [errors, setErrors] = useState({})
  const [systemInfo, setSystemInfo] = useState({
    version: '1.0.0',
    databaseSize: '0 MB',
    lastBackup: 'Never',
    totalProducts: 0,
    totalSales: 0,
    totalUsers: 0
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setIsLoading(true)
      const settings = await window.electronAPI.getSettings()
      if (settings) {
        setFormData({
          storeName: settings.storeName || '',
          storeAddress: settings.storeAddress || '',
          storePhone: settings.storePhone || '',
          storeEmail: settings.storeEmail || '',
          taxRate: settings.taxRate || '5',
          taxName: settings.taxName || 'VAT',
          receiptHeader: settings.receiptHeader || '',
          receiptFooter: settings.receiptFooter || 'Thank you for your business!',
          showTaxOnReceipt: settings.showTaxOnReceipt !== false,
          currencySymbol: settings.currencySymbol || 'Rs.',
          currencyPosition: settings.currencyPosition || 'before',
          defaultPaymentMethod: settings.defaultPaymentMethod || 'Cash'
        })
      }
      
      const info = await window.electronAPI.getSystemInfo()
      if (info) {
        setSystemInfo(info)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function toggleSection(section) {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  function validateSection(sectionData) {
    const newErrors = {}
    
    if (sectionData.storeName !== undefined && !sectionData.storeName?.trim()) {
      newErrors.storeName = 'Store name is required'
    }
    
    if (sectionData.taxRate !== undefined && (isNaN(sectionData.taxRate) || Number(sectionData.taxRate) < 0)) {
      newErrors.taxRate = 'Tax rate must be a valid number'
    }
    
    if (sectionData.storeEmail !== undefined && sectionData.storeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sectionData.storeEmail)) {
      newErrors.storeEmail = 'Invalid email format'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function saveSection(sectionName, sectionData) {
    if (!validateSection(sectionData)) {
      const firstError = document.querySelector('.border-red-500')
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    setIsSubmitting(true)
    try {
      // Merge with existing form data
      const updatedData = { ...formData, ...sectionData }
      await window.electronAPI.saveSettings(updatedData)
      
      // Update form data
      setFormData(updatedData)
      
      // Show success message
      setSuccessMessage(`${sectionName} saved successfully!`)
      setShowSuccess(true)
      
      setTimeout(() => {
        setShowSuccess(false)
        setSuccessMessage('')
      }, 3000)
      
    } catch (error) {
      console.error('Error saving settings:', error)
      alert(`Failed to save ${sectionName}. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleBackup() {
    setIsBackingUp(true)
    setBackupStatus('Creating backup...')
    try {
      const result = await window.electronAPI.backupDatabase()
      if (result.success) {
        setBackupStatus('Backup created successfully!')
        setTimeout(() => {
          setShowBackupModal(false)
          setBackupStatus('')
          loadSettings()
        }, 1500)
      } else {
        setBackupStatus('Backup failed: ' + result.message)
      }
    } catch (error) {
      console.error('Error backing up:', error)
      setBackupStatus('Backup failed. Please try again.')
    } finally {
      setIsBackingUp(false)
    }
  }

  async function handleRestore() {
    try {
     // Use Electron's dialog to select file
      const dialogResult = await window.electronAPI.selectBackupFile()
      if (!dialogResult || dialogResult.canceled) {
        return
      }

      const filePath = dialogResult.filePaths[0]
      if (!filePath) {
        alert('No file selected')
        return
      }

      // Validate file extension
      const validExtensions = ['.db', '.sqlite', '.sqlite3']
      const fileExt = filePath.substring(filePath.lastIndexOf('.')).toLowerCase()
      if (!validExtensions.includes(fileExt)) {
        alert('Invalid file format. Please select a .db, .sqlite, or .sqlite3 file.')
        return
      }

      // Show confirmation
      const confirmRestore = confirm(
       `⚠️ RESTORE DATABASE\n\n` +
       `File: ${filePath.split('/').pop()}\n` +
        `\nThis will replace all current data. This action cannot be undone.\n` +
        `\nAre you sure you want to continue?`
      )
      if (!confirmRestore) return

      setIsRestoring(true)
      setBackupStatus('Restoring database...')
    
      const restoreResult = await window.electronAPI.restoreDatabase(filePath)
      if (restoreResult.success) {
        setBackupStatus('Database restored successfully!')
        setTimeout(() => {
          alert('Database restored successfully! The application will now restart.')
          window.location.reload()
        }, 1000)
      } else {
        setBackupStatus('Restore failed: ' + restoreResult.message)
        alert('Restore failed: ' + restoreResult.message)
      }
    } catch (error) {
      console.error('Error restoring:', error)
      setBackupStatus('Restore failed: ' + error.message)
      alert('Failed to restore database: ' + error.message)
    } finally {
      setIsRestoring(false)
      setShowRestoreModal(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader size={40} className="text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-medium">Loading settings...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Helper function to render section header
  function renderSectionHeader(title, IconComponent, section, isOpen) {
    return (
      <button
        type="button"
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <IconComponent size={20} className="text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        </div>
        {isOpen ? (
          <ChevronDown size={20} className="text-slate-400" />
        ) : (
          <ChevronRight size={20} className="text-slate-400" />
        )}
      </button>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <SettingsIcon className="w-7 h-7 text-indigo-600" />
              Settings
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Configure your system preferences
            </p>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Settings Form */}
        <div className="space-y-4">
          
          {/* Store Information Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {renderSectionHeader('Store Information', Store, 'store', sections.store)}
            {sections.store && (
              <div className="p-6 pt-0 border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Store size={16} className="text-indigo-500" />
                      Store Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="storeName"
                      value={formData.storeName}
                      onChange={handleChange}
                      placeholder="Enter store name"
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.storeName ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm`}
                    />
                    {errors.storeName && (
                      <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                        <X size={12} />
                        {errors.storeName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <MapPin size={16} className="text-indigo-500" />
                      Address
                    </label>
                    <input
                      type="text"
                      name="storeAddress"
                      value={formData.storeAddress}
                      onChange={handleChange}
                      placeholder="Enter store address"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Phone size={16} className="text-indigo-500" />
                      Phone
                    </label>
                    <input
                      type="text"
                      name="storePhone"
                      value={formData.storePhone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Mail size={16} className="text-indigo-500" />
                      Email
                    </label>
                    <input
                      type="email"
                      name="storeEmail"
                      value={formData.storeEmail}
                      onChange={handleChange}
                      placeholder="Enter email address"
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.storeEmail ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm`}
                    />
                    {errors.storeEmail && (
                      <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                        <X size={12} />
                        {errors.storeEmail}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      const sectionData = {
                        storeName: formData.storeName,
                        storeAddress: formData.storeAddress,
                        storePhone: formData.storePhone,
                        storeEmail: formData.storeEmail
                      }
                      saveSection('Store Information', sectionData)
                    }}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition-all duration-200 font-medium text-sm"
                  >
                    <Save size={16} />
                    Save Store Information
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tax Settings Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {renderSectionHeader('Tax Settings', DollarSign, 'tax', sections.tax)}
            {sections.tax && (
              <div className="p-6 pt-0 border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <DollarSign size={16} className="text-indigo-500" />
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      name="taxRate"
                      value={formData.taxRate}
                      onChange={handleChange}
                      placeholder="Enter tax rate"
                      min="0"
                      step="0.01"
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.taxRate ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm`}
                    />
                    {errors.taxRate && (
                      <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
                        <X size={12} />
                        {errors.taxRate}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <FileText size={16} className="text-indigo-500" />
                      Tax Name
                    </label>
                    <input
                      type="text"
                      name="taxName"
                      value={formData.taxName}
                      onChange={handleChange}
                      placeholder="e.g., VAT, GST"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Receipt size={16} className="text-indigo-500" />
                      Receipt Settings
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        name="showTaxOnReceipt"
                        checked={formData.showTaxOnReceipt}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Show tax details on receipt
                    </label>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      const sectionData = {
                        taxRate: formData.taxRate,
                        taxName: formData.taxName,
                        showTaxOnReceipt: formData.showTaxOnReceipt
                      }
                      saveSection('Tax Settings', sectionData)
                    }}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition-all duration-200 font-medium text-sm"
                  >
                    <Save size={16} />
                    Save Tax Settings
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Receipt Customization Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {renderSectionHeader('Receipt Customization', Printer, 'receipt', sections.receipt)}
            {sections.receipt && (
              <div className="p-6 pt-0 border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <FileText size={16} className="text-indigo-500" />
                      Receipt Header Message
                    </label>
                    <input
                      type="text"
                      name="receiptHeader"
                      value={formData.receiptHeader}
                      onChange={handleChange}
                      placeholder="e.g., Welcome to our store!"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <FileText size={16} className="text-indigo-500" />
                      Receipt Footer Message
                    </label>
                    <input
                      type="text"
                      name="receiptFooter"
                      value={formData.receiptFooter}
                      onChange={handleChange}
                      placeholder="e.g., Thank you for your business!"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <DollarSign size={16} className="text-indigo-500" />
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      name="currencySymbol"
                      value={formData.currencySymbol}
                      onChange={handleChange}
                      placeholder="e.g., Rs., $, €"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <DollarSign size={16} className="text-indigo-500" />
                      Currency Position
                    </label>
                    <select
                      name="currencyPosition"
                      value={formData.currencyPosition}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                    >
                      <option value="before">Before (e.g., Rs. 100)</option>
                      <option value="after">After (e.g., 100 Rs.)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Receipt size={16} className="text-indigo-500" />
                      Default Payment Method
                    </label>
                    <select
                      name="defaultPaymentMethod"
                      value={formData.defaultPaymentMethod}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="QR">QR Payment</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      const sectionData = {
                        receiptHeader: formData.receiptHeader,
                        receiptFooter: formData.receiptFooter,
                        currencySymbol: formData.currencySymbol,
                        currencyPosition: formData.currencyPosition,
                        defaultPaymentMethod: formData.defaultPaymentMethod
                      }
                      saveSection('Receipt Customization', sectionData)
                    }}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition-all duration-200 font-medium text-sm"
                  >
                    <Save size={16} />
                    Save Receipt Settings
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Database Management Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {renderSectionHeader('Database Management', Database, 'database', sections.database)}
            {sections.database && (
              <div className="p-6 pt-0 border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500 mb-1">Database Size</p>
                    <p className="font-medium text-slate-800">{systemInfo.databaseSize}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500 mb-1">Last Backup</p>
                    <p className="font-medium text-slate-800">{systemInfo.lastBackup}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowBackupModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-200 font-medium text-sm"
                  >
                    <Download size={18} />
                    Backup Database
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRestoreModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-medium text-sm"
                  >
                    <Upload size={18} />
                    Restore Database
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* System Information Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {renderSectionHeader('System Information', Info, 'system', sections.system)}
            {sections.system && (
              <div className="p-6 pt-0 border-t border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500 mb-1">Version</p>
                    <p className="font-medium text-slate-800">{systemInfo.version}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500 mb-1">Total Products</p>
                    <p className="font-medium text-slate-800">{systemInfo.totalProducts}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500 mb-1">Total Sales</p>
                    <p className="font-medium text-slate-800">{systemInfo.totalSales}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500 mb-1">Total Users</p>
                    <p className="font-medium text-slate-800">{systemInfo.totalUsers}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowBackupModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Backup Database</h2>
                <button onClick={() => setShowBackupModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Database className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Create Database Backup</p>
                    <p className="text-sm text-slate-500">
                      A backup file will be saved to your POS_Backups folder.
                    </p>
                  </div>
                </div>
                {backupStatus && (
                  <div className={`p-3 rounded-xl text-sm mb-4 ${
                    backupStatus.includes('success') 
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : backupStatus.includes('failed') 
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {backupStatus}
                  </div>
                )}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={handleBackup}
                    disabled={isBackingUp}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-medium text-sm"
                  >
                    {isBackingUp ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Create Backup
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowBackupModal(false)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {/* Restore Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRestoreModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Restore Database</h2>
                <button onClick={() => setShowRestoreModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Restore Database</p>
                   <p className="text-sm text-slate-500">
                      This will replace all current data. This action cannot be undone.
                    </p>
                 </div>
                </div>
          
                {/* Backup Status */}
                {backupStatus && (
                  <div className={`p-3 rounded-xl text-sm mb-4 ${
                    backupStatus.includes('successfully') 
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : backupStatus.includes('failed') 
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {backupStatus}
                  </div>
                )}
          
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                  <button
                    onClick={handleRestore}
                    disabled={isRestoring}
                    className="cursor-pointer inline-flex flex-col items-center gap-2 w-full"
                  >
                    <Upload size={32} className={isRestoring ? 'text-slate-400' : 'text-indigo-600'} />
                    <span className="text-sm font-medium text-indigo-600">
                      {isRestoring ? 'Restoring...' : 'Click to select backup file'}
                    </span>
                    <span className="text-xs text-slate-400">
                      Supported: .db, .sqlite, .sqlite3 files
                    </span>
                  </button>
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-200 mt-4">
                  <button
                    onClick={() => setShowRestoreModal(false)}
                    disabled={isRestoring}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-medium text-sm"
                  >
                    {isRestoring ? 'Please wait...' : 'Cancel'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

export default Settings
import { useEffect, useState } from 'react'

function Receipt({ sale }) {
  const [settings, setSettings] = useState({
    storeName: 'Store Name',
    storeAddress: '',
    storePhone: '',
    storeEmail: '',
    receiptHeader: '',
    receiptFooter: 'Thank you for your business!',
    taxRate: 5,
    taxName: 'VAT',
    currencySymbol: 'Rs.'
  })

  async function loadSettings() {
    try {
      const data = await window.electronAPI.getSettings()
      if (data) {
        setSettings({
          storeName: data.storeName || 'Store Name',
          storeAddress: data.storeAddress || '',
          storePhone: data.storePhone || '',
          storeEmail: data.storeEmail || '',
          receiptHeader: data.receiptHeader || '',
          receiptFooter: data.receiptFooter || 'Thank you for your business!',
          taxRate: data.taxRate ? Number(data.taxRate) : 5,
          taxName: data.taxName || 'VAT',
          currencySymbol: data.currencySymbol || 'Rs.'
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSettings()
  }, [])

  // Guard clause to handle undefined or null sale
  if (!sale) {
    return <div>No sale data</div>
  }

  // Ensure items is always an array
  const items = sale.items || []

  // Format address for display
  const addressLines = settings.storeAddress ? settings.storeAddress.split('\n').filter(line => line.trim()) : []

  return (
    <div className="p-4 font-mono text-sm" style={{ width: '300px' }}>
      {/* Store Name */}
      <h2 className="text-center font-bold text-lg mb-0.5">{settings.storeName}</h2>
      
      {/* Store Address */}
      {addressLines.length > 0 && addressLines.map((line, index) => (
        <p key={index} className="text-center text-xs">{line}</p>
      ))}
      
      {/* Store Phone & Email */}
      {settings.storePhone && (
        <p className="text-center text-xs">Tel: {settings.storePhone}</p>
      )}
      {settings.storeEmail && (
        <p className="text-center text-xs">Email: {settings.storeEmail}</p>
      )}
      
      {/* Receipt Header */}
      {settings.receiptHeader && (
        <>
          <p className="text-center text-xs mt-1">{settings.receiptHeader}</p>
        </>
      )}
      
      <hr className="border-t border-dashed border-gray-300 my-2" />
      
      <div className="flex justify-between text-xs">
        <span>Invoice: {sale.invoiceNo || 'N/A'}</span>
        <span>{sale.createdAt ? new Date(sale.createdAt).toLocaleString() : 'N/A'}</span>
      </div>
      
      <hr className="border-t border-dashed border-gray-300 my-2" />
      
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left">Item</th>
            <th className="text-center">Qty</th>
            <th className="text-right">Price</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item) => (
              <tr key={item.id}>
                <td className="py-1">{item.product?.name || 'Unknown Product'}</td>
                <td className="text-center">{item.quantity || 0}</td>
                <td className="text-right">{settings.currencySymbol}{item.price?.toFixed(2) || '0.00'}</td>
                <td className="text-right">{settings.currencySymbol}{item.subtotal?.toFixed(2) || '0.00'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center py-2">No items</td>
            </tr>
          )}
        </tbody>
      </table>
      
      <hr className="border-t border-dashed border-gray-300 my-2" />
      
      <div className="flex justify-between text-xs">
        <span>Subtotal:</span>
        <span>{settings.currencySymbol}{(sale.total || 0).toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span>{settings.taxName} ({settings.taxRate}%):</span>
        <span>{settings.currencySymbol}{(sale.tax || 0).toFixed(2)}</span>
      </div>
      <div className="flex justify-between font-bold text-sm">
        <span>TOTAL:</span>
        <span>{settings.currencySymbol}{(sale.total || 0).toFixed(2)}</span>
      </div>
      
      <hr className="border-t border-dashed border-gray-300 my-2" />
      
      <div className="flex justify-between text-xs">
        <span>Payment:</span>
        <span>{sale.paymentMethod || 'N/A'}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span>Paid:</span>
        <span>{settings.currencySymbol}{(sale.paidAmount || 0).toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span>Change:</span>
        <span>{settings.currencySymbol}{(sale.changeAmount || 0).toFixed(2)}</span>
      </div>
      
      <hr className="border-t border-dashed border-gray-300 my-2" />
      
      {/* Receipt Footer */}
      {settings.receiptFooter && (
        <p className="text-center text-xs mt-2">{settings.receiptFooter}</p>
      )}
      {!settings.receiptFooter && (
        <p className="text-center text-xs mt-2">Thank you for your business!</p>
      )}
    </div>
  )
}

export default Receipt
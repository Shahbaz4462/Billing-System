import { useApp } from '../store/AppContext';
import { getSettings, getProducts } from '../store/database';
import type { Bill } from '../types';
import { FiPrinter, FiX, FiCheck } from 'react-icons/fi';
import { numberToWords } from '../utils/numberToWords';

interface ReceiptPreviewProps {
  bill: Bill;
  onClose: () => void;
  onPrint?: () => void;
  showActions?: boolean;
}

export default function ReceiptPreview({ bill, onClose, onPrint, showActions = true }: ReceiptPreviewProps) {
  const { language, t } = useApp();
  const isUrdu = language === 'ur';
  const sett = getSettings();
  const products = getProducts();

  const handlePrint = () => {
    const printContent = document.getElementById('printable-receipt');
    if (printContent) {
      const printWindow = window.open('', '_blank', 'width=350,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html dir="${isUrdu ? 'rtl' : 'ltr'}">
          <head>
            <title>Receipt - ${bill.billNumber}</title>
            <meta charset="UTF-8">
            <style>
              @page { size: 80mm auto; margin: 0; }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                line-height: 1.4;
                width: 80mm;
                padding: 3mm;
                background: white;
                color: black;
                ${isUrdu ? 'direction: rtl; text-align: right;' : ''}
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .text-left { text-align: left; }
              .font-bold { font-weight: bold; }
              .text-lg { font-size: 16px; }
              .text-sm { font-size: 11px; }
              .text-xs { font-size: 10px; }
              .mb-1 { margin-bottom: 4px; }
              .mb-2 { margin-bottom: 8px; }
              .mt-1 { margin-top: 4px; }
              .mt-2 { margin-top: 8px; }
              .py-1 { padding-top: 4px; padding-bottom: 4px; }
              hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
              hr.double { border-top-width: 2px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 2px 0; vertical-align: top; }
              .item-name { max-width: 100px; word-wrap: break-word; }
              .amount { white-space: nowrap; }
              .flex-between { display: flex; justify-content: space-between; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
    onPrint?.();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-100 dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] flex flex-col animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🧾 {t('receipt')} Preview
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700">
            <FiX size={18} />
          </button>
        </div>

        {/* Receipt Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-200 dark:bg-slate-950 flex justify-center">
          <div className="receipt-paper rounded-sm p-6 w-full max-w-[320px] mb-8" style={{ fontFamily: "'Courier New', monospace" }}>
            {/* Actual Receipt Content */}
            <div id="printable-receipt" className={`text-[12px] leading-relaxed text-black ${isUrdu ? 'rtl' : 'ltr'}`}>
              {/* Header */}
              <div className="text-center mb-2">
                <div className="text-2xl mb-1">🧁</div>
                <p className="text-lg font-bold">{isUrdu ? sett.bakeryNameUrdu : sett.bakeryName}</p>
                <p className="text-xs text-gray-600">{isUrdu ? sett.addressUrdu : sett.address}</p>
                <p className="text-xs text-gray-600">{sett.phone}</p>
                {sett.taxNumber && <p className="text-xs text-gray-600">{isUrdu ? 'NTN:' : 'Tax:'} {sett.taxNumber}</p>}
              </div>
              
              <hr className="receipt-divider" />
              
              {/* Bill Info */}
              <div className="space-y-0.5 text-xs mb-2">
                <div className="flex-between">
                  <span>{isUrdu ? 'بل نمبر:' : 'Bill #:'}</span>
                  <span className="font-bold">{bill.billNumber}</span>
                </div>
                <div className="flex-between">
                  <span>{isUrdu ? 'تاریخ:' : 'Date:'}</span>
                  <span>{new Date(bill.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex-between">
                  <span>{isUrdu ? 'وقت:' : 'Time:'}</span>
                  <span>{new Date(bill.createdAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex-between">
                  <span>{isUrdu ? 'کسٹمر:' : 'Customer:'}</span>
                  <span>{bill.customerName}</span>
                </div>
                <div className="flex-between">
                  <span>{isUrdu ? 'کیشیئر:' : 'Cashier:'}</span>
                  <span>{bill.employeeName}</span>
                </div>
              </div>
              
              <hr className="receipt-divider-double" />
              
              {/* Items Header */}
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-dashed border-gray-400">
                    <th className={`py-1 ${isUrdu ? 'text-right' : 'text-left'}`}>{isUrdu ? 'آئٹم' : 'Item'}</th>
                    <th className="text-center w-10">{isUrdu ? 'تعداد' : 'Qty'}</th>
                    <th className="text-right w-14">{isUrdu ? 'قیمت' : 'Rate'}</th>
                    <th className="text-right w-16">{isUrdu ? 'کل' : 'Amt'}</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items.map((item, i) => {
                    const prod = products.find(p => p.id === item.productId);
                    const displayName = isUrdu && prod?.nameUrdu ? prod.nameUrdu : item.productName;
                    return (
                      <tr key={i} className="border-b border-dotted border-gray-300">
                        <td className={`py-1 item-name ${isUrdu ? 'text-right' : 'text-left'}`}>
                          {displayName.length > 16 ? displayName.substring(0, 14) + '..' : displayName}
                        </td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right amount">{item.unitPrice}</td>
                        <td className="text-right amount font-medium">{item.total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              <hr className="receipt-divider-double" />
              
              {/* Totals */}
              <div className="space-y-0.5 text-xs">
                <div className="flex-between">
                  <span>{isUrdu ? 'ذیلی کل:' : 'Subtotal:'}</span>
                  <span>{sett.currency} {bill.subtotal.toLocaleString()}</span>
                </div>
                {bill.discountAmount > 0 && (
                  <div className="flex-between text-green-700">
                    <span>{isUrdu ? 'رعایت:' : 'Discount:'}</span>
                    <span>-{sett.currency} {bill.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex-between">
                  <span>{isUrdu ? 'ٹیکس' : 'Tax'} ({bill.taxRate}%):</span>
                  <span>{sett.currency} {bill.taxAmount.toLocaleString()}</span>
                </div>
                
                <hr className="receipt-divider" />
                
                <div className="flex-between font-bold text-sm py-1">
                  <span>{isUrdu ? 'کل رقم:' : 'TOTAL:'}</span>
                  <span>{sett.currency} {bill.grandTotal.toLocaleString()}</span>
                </div>
                
                <div className="flex-between text-xs mt-1">
                  <span>{isUrdu ? 'ادائیگی:' : 'Payment:'}</span>
                  <span className="uppercase font-medium">{bill.paymentMethod}</span>
                </div>
              </div>
              
              <div className="mt-3 text-[10px] italic border-t border-dotted border-gray-400 pt-1">
                <p className="font-bold">{isUrdu ? 'رقم الفاظ میں:' : 'Amount in Words:'}</p>
                <p>{numberToWords(bill.grandTotal)}</p>
              </div>

              <hr className="receipt-divider" />
              
              {/* Footer */}
              <div className="text-center text-xs text-gray-800 mt-2 pb-2">
                <p className="font-bold mb-1">{sett.receiptFooter}</p>
                <p className="mt-1 text-sm font-bold">{isUrdu ? 'آپ کا شکریہ! دوبارہ تشریف لائیں' : 'Thank you for your visit!'}</p>
              </div>
              
              {/* Safety Margin for Printer Blade */}
              <div className="h-10 w-full border-t border-dashed border-gray-200 mt-4 flex items-center justify-center">
                <span className="text-[8px] text-gray-300">CUT LINE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex gap-3 no-print">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:from-primary-600 hover:to-primary-700 transition-all"
            >
              <FiPrinter size={18} />
              {t('print')}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold flex items-center justify-center gap-2 hover:bg-gray-300 dark:hover:bg-slate-600 transition-all"
            >
              <FiCheck size={18} />
              {t('close')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

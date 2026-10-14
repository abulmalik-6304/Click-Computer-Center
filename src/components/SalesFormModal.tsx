'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  Calculator, 
  CheckCircle2, 
  UserPlus, 
  Search, 
  ChevronDown,
  Printer,
  Receipt,
  RotateCcw,
  FileText,
  Sparkles,
  FileSpreadsheet,
  QrCode
} from 'lucide-react';
import { CustomerItem, InventoryItem } from '../types';

interface SalesFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerItem[];
  inventory: InventoryItem[];
  currentUserEmail: string;
  onOpenCustomerModal?: () => void;
  preselectedItem?: InventoryItem | null;
}

interface OrderItem {
  Item_ID: string;
  Item_Name: string;
  Selling_Price: number;
  Quantity: number;
  Total_Price: number;
}

export default function SalesFormModal({
  isOpen,
  onClose,
  customers,
  inventory,
  currentUserEmail,
  onOpenCustomerModal,
  preselectedItem,
}: SalesFormModalProps) {
  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  
  const [salesItems, setSalesItems] = useState<OrderItem[]>([]);
  
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedItemName, setSelectedItemName] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

  const [saleStatus, setSaleStatus] = useState<'Draft' | 'Completed'>('Draft');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Telebirr' | 'CBE' | 'Credit'>('Cash');
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid' | 'Partial'>('Paid');

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState('');
  const [lastSaleData, setLastSaleData] = useState<any>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (isOpen) {
      const randomInv = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
      setInvoiceNo(randomInv);
      setDate(todayStr);
      setCustomerName('');
      setCustomerSearchTerm('');
      setIsCustomerDropdownOpen(false);
      setDiscount(0);
      setPaidAmount(0);
      setSaleStatus('Draft');
      setPaymentMethod('Cash');
      setPaymentStatus('Paid');
      setSalesItems([]);
      setShowSuccessModal(false);

      if (preselectedItem && preselectedItem.Item_Name) {
        setIsAddingItem(true);
        const itemCodeOrId = preselectedItem.Item_Code || preselectedItem.Item_ID || preselectedItem.Item_Name;
        setSelectedItemId(itemCodeOrId);
        setSelectedItemName(preselectedItem.Item_Name);
        
        const price = parseFloat(String(preselectedItem.Selling_Price || 0));
        setSellingPrice(price);
        setQuantity(1);
      } else {
        setIsAddingItem(false);
        setSelectedItemId('');
        setSelectedItemName('');
        setSellingPrice(0);
        setQuantity(1);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCustomers = customers.filter(c => {
    const cName = c.Name || (c as any).Customer_Name || (c as any).Customer || '';
    return cName.toLowerCase().includes(customerSearchTerm.toLowerCase());
  });

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    const found = inventory.find((i) => i.Item_ID === itemId || i.Item_Name === itemId || i.Item_Code === itemId);
    if (found) {
      setSelectedItemName(found.Item_Name);
      const price = parseFloat(String(found.Selling_Price || (found as any).Unit_Price || 0));
      setSellingPrice(price);
    }
  };

  const handleAddItemToList = () => {
    if (!selectedItemName) {
      alert('እባክዎን እቃ ይምረጡ!');
      return;
    }
    const itemTotal = sellingPrice * quantity;
    const newItem: OrderItem = {
      Item_ID: selectedItemId || selectedItemName,
      Item_Name: selectedItemName,
      Selling_Price: sellingPrice,
      Quantity: quantity,
      Total_Price: itemTotal,
    };

    const updatedList = [...salesItems, newItem];
    setSalesItems(updatedList);

    const newSubtotal = updatedList.reduce((acc, curr) => acc + curr.Total_Price, 0);
    setPaidAmount(Math.max(0, newSubtotal - discount));

    setSelectedItemId('');
    setSelectedItemName('');
    setSellingPrice(0);
    setQuantity(1);
    setIsAddingItem(false);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...salesItems];
    updated.splice(index, 1);
    setSalesItems(updated);

    const newSubtotal = updated.reduce((acc, curr) => acc + curr.Total_Price, 0);
    setPaidAmount(Math.max(0, newSubtotal - discount));
  };

  const subtotal = salesItems.reduce((acc, curr) => acc + curr.Total_Price, 0);
  const grandTotal = Math.max(0, subtotal - discount);

  // ============================================================
  // 📝 HANDLE SUBMIT
  // ============================================================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (salesItems.length === 0) {
      alert('እባክዎን ቢያንስ አንድ እቃ ወደ ሽያጭ ዝርዝር ያስገቡ!');
      return;
    }

    const recordPayload = {
      Invoice_No: invoiceNo,
      Date: date,
      Customer_Name: customerName || 'መደበኛ ደንበኛ (Walk-in Customer)',
      Sales_Items: salesItems,
      Subtotal: subtotal,
      Discount: discount,
      Grand_Total: grandTotal,
      Sale_Status: saleStatus,
      Payment_Method: paymentMethod,
      Paid_Amount: paidAmount,
      Payment_Status: paymentStatus,
      Recorded_By: currentUserEmail,
    };

    console.log('New Sales Record Payload:', recordPayload);

    setLastInvoiceNumber(invoiceNo);
    setLastSaleData(recordPayload);
    setShowSuccessModal(true);
  };

  // ============================================================
  // 🖨️ 1. PRINT POS RECEIPT (80mm Thermal)
  // ============================================================
  const handlePrintPOSReceipt = () => {
    if (!lastSaleData) return;

    const win = window.open('', '', 'width=380,height=700');
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>POS Receipt - ${lastSaleData.Invoice_No}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', monospace; 
              padding: 12px; 
              color: #000; 
              width: 300px;
              font-size: 12px;
              line-height: 1.4;
            }
            .center { text-align: center; }
            .logo { 
              width: 50px; 
              height: 50px; 
              background: #ea580c; 
              color: white; 
              border-radius: 12px; 
              display: inline-flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: 900; 
              font-size: 18px;
              margin-bottom: 6px;
            }
            h1 { font-size: 15px; font-weight: 900; margin: 4px 0 2px 0; }
            .subtitle { font-size: 10px; font-weight: bold; color: #333; }
            .divider { 
              border-top: 1px dashed #000; 
              margin: 8px 0; 
            }
            .divider-solid { 
              border-top: 1px solid #000; 
              margin: 8px 0; 
            }
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              font-size: 11px; 
              padding: 2px 0;
            }
            .info-row strong { font-weight: 900; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 6px 0;
            }
            th, td { 
              font-size: 11px; 
              padding: 3px 0; 
              text-align: left; 
            }
            th { 
              border-bottom: 1px solid #000; 
              font-weight: 900; 
              text-transform: uppercase;
              font-size: 10px;
            }
            td.right, th.right { text-align: right; }
            td.center, th.center { text-align: center; }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              padding: 3px 0;
            }
            .grand-total {
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              font-weight: 900;
              padding: 6px 0;
              border-top: 2px solid #000;
              border-bottom: 2px solid #000;
              margin-top: 4px;
            }
            .footer { 
              text-align: center; 
              font-size: 10px; 
              margin-top: 10px;
              padding-top: 8px;
              border-top: 1px dashed #000;
            }
            .barcode {
              font-family: 'Courier New', monospace;
              font-size: 14px;
              letter-spacing: 2px;
              text-align: center;
              margin: 6px 0;
              font-weight: 900;
            }
            .paid-stamp {
              display: inline-block;
              border: 2px solid #16a34a;
              color: #16a34a;
              padding: 2px 8px;
              font-weight: 900;
              font-size: 10px;
              border-radius: 4px;
              transform: rotate(-3deg);
              margin-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="logo">CCC</div>
            <h1>CLICK COMPUTER CENTER</h1>
            <p class="subtitle">Training & Maintenance</p>
            <p class="subtitle">Tel: 0911-XXX-XXX</p>
          </div>

          <div class="divider"></div>

          <div class="info-row"><span>Invoice:</span><strong>${lastSaleData.Invoice_No}</strong></div>
          <div class="info-row"><span>Date:</span><strong>${lastSaleData.Date}</strong></div>
          <div class="info-row"><span>Customer:</span><strong>${lastSaleData.Customer_Name.substring(0, 18)}</strong></div>
          <div class="info-row"><span>Cashier:</span><strong>${lastSaleData.Recorded_By.split('@')[0]}</strong></div>

          <div class="divider"></div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="center">Qty</th>
                <th class="right">Price</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${lastSaleData.Sales_Items.map((item: OrderItem) => `
                <tr>
                  <td>${item.Item_Name.substring(0, 14)}</td>
                  <td class="center">${item.Quantity}</td>
                  <td class="right">${item.Selling_Price.toLocaleString()}</td>
                  <td class="right"><strong>${item.Total_Price.toLocaleString()}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="divider-solid"></div>

          <div class="total-row"><span>Subtotal:</span><strong>${lastSaleData.Subtotal.toLocaleString()} ETB</strong></div>
          ${lastSaleData.Discount > 0 ? `<div class="total-row"><span>Discount:</span><strong>-${lastSaleData.Discount.toLocaleString()} ETB</strong></div>` : ''}
          
          <div class="grand-total">
            <span>TOTAL:</span>
            <span>${lastSaleData.Grand_Total.toLocaleString()} ETB</span>
          </div>

          <div class="total-row" style="margin-top: 4px;"><span>Payment:</span><strong>${lastSaleData.Payment_Method}</strong></div>
          <div class="total-row"><span>Paid:</span><strong>${lastSaleData.Paid_Amount.toLocaleString()} ETB</strong></div>

          <div class="center" style="margin-top: 8px;">
            <span class="paid-stamp">✓ ${lastSaleData.Payment_Status.toUpperCase()}</span>
          </div>

          <div class="barcode">*${lastSaleData.Invoice_No}*</div>

          <div class="footer">
            <p style="font-weight: 900;">ስለ ግዢዎ እናመሰግናለን! 🙏</p>
            <p>Thank you for shopping!</p>
            <p style="margin-top: 6px; font-size: 9px;">${new Date().toLocaleString('am-ET')}</p>
            <p style="font-size: 9px; margin-top: 4px;">Powered by CCC System</p>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  };

  // ============================================================
  // 🧾 2. PRINT A5 INVOICE (Clean White Design - With Logo)
  // ============================================================
  const handlePrintA5Invoice = () => {
    if (!lastSaleData) return;

    const win = window.open('', '', 'width=850,height=1100');
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>A5 Invoice - ${lastSaleData.Invoice_No}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }

            @page {
              size: A5;
              margin: 8mm;
            }

            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              color: #1e293b;
              background: white;
              font-size: 11px;
              line-height: 1.4;
              padding: 5mm;
            }

            .invoice {
              max-width: 148mm;
              margin: 0 auto;
              border: 2px solid #e2e8f0;
              border-radius: 14px;
              overflow: hidden;
              background: white;
              position: relative;
            }

            /* ============ WATERMARK ============ */
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-30deg);
              font-size: 90px;
              font-weight: 900;
              color: rgba(37, 99, 235, 0.06);
              pointer-events: none;
              z-index: 0;
              letter-spacing: 10px;
              white-space: nowrap;
            }

            /* ============ HEADER ============ */
            .header {
              background: white;
              color: #1e293b;
              padding: 18px 22px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 15px;
              position: relative;
              z-index: 1;
              border-bottom: 3px solid #2563eb;
            }

            .logo-section {
              display: flex;
              align-items: center;
              gap: 14px;
              flex: 1;
            }

            .logo-box {
              width: 80px;
              height: 80px;
              background: white;
              border-radius: 12px;
              padding: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              border: 2px solid #2563eb;
              box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
            }

            .logo-box img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }

            .company-info {
              display: flex;
              flex-direction: column;
              justify-content: center;
            }

            .company-info h1 {
              font-size: 18px;
              font-weight: 900;
              margin-bottom: 3px;
              letter-spacing: 0.3px;
              color: #1e3a8a;
              line-height: 1.1;
            }

            .company-info .tagline {
              font-size: 10px;
              color: #ea580c;
              font-weight: 900;
              margin-bottom: 3px;
              letter-spacing: 0.3px;
            }

            .company-info p {
              font-size: 9.5px;
              color: #64748b;
              font-weight: 700;
              line-height: 1.3;
            }

            .invoice-title {
              text-align: right;
              flex-shrink: 0;
            }

            .invoice-title h2 {
              font-size: 26px;
              font-weight: 900;
              color: #2563eb;
              letter-spacing: 2px;
              line-height: 1;
            }

            .invoice-title .inv-num {
              font-size: 11px;
              color: #1e293b;
              font-weight: 900;
              margin-top: 8px;
              background: #eff6ff;
              padding: 5px 12px;
              border-radius: 6px;
              display: inline-block;
              border: 1.5px solid #2563eb;
              letter-spacing: 0.5px;
            }

            /* ============ INFO GRID ============ */
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              padding: 14px 22px;
              background: #f8fafc;
              border-bottom: 1.5px solid #e2e8f0;
              position: relative;
              z-index: 1;
            }

            .info-block h3 {
              font-size: 9.5px;
              font-weight: 900;
              text-transform: uppercase;
              color: #2563eb;
              margin-bottom: 5px;
              letter-spacing: 1.2px;
            }

            .info-block .main-text {
              font-size: 13px;
              font-weight: 900;
              color: #1e293b;
              margin-bottom: 2px;
              line-height: 1.2;
            }

            .info-block .sub-text {
              font-size: 10px;
              color: #64748b;
              font-weight: 700;
            }

            /* ============ ITEMS TABLE ============ */
            .items-table {
              width: 100%;
              border-collapse: collapse;
              position: relative;
              z-index: 1;
            }

            .items-table thead {
              background: #2563eb;
            }

            .items-table th {
              color: white;
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              padding: 10px 14px;
              text-align: left;
              letter-spacing: 0.8px;
            }

            .items-table th.right { text-align: right; }
            .items-table th.center { text-align: center; }

            .items-table td {
              padding: 10px 14px;
              font-size: 11px;
              border-bottom: 1px solid #e2e8f0;
              font-weight: 600;
              color: #334155;
            }

            .items-table tbody tr:nth-child(even) {
              background: #f8fafc;
            }

            .items-table td.right {
              text-align: right;
              font-weight: 900;
              color: #1e293b;
            }

            .items-table td.center { text-align: center; }

            .items-table .item-name {
              font-weight: 900;
              color: #1e293b;
            }

            .items-table .total-col {
              color: #16a34a;
              font-weight: 900;
            }

            /* ============ SUMMARY SECTION ============ */
            .summary-section {
              display: flex;
              justify-content: flex-end;
              padding: 16px 22px;
              background: #f8fafc;
              border-top: 1.5px solid #e2e8f0;
              position: relative;
              z-index: 1;
            }

            .totals-box {
              width: 310px;
              background: white;
              border: 2px solid #e2e8f0;
              border-radius: 10px;
              padding: 12px 16px;
            }

            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              font-size: 11px;
              font-weight: 700;
              color: #475569;
            }

            .total-row.discount {
              color: #e11d48;
            }

            .grand-total-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              margin-top: 6px;
              border-top: 2px solid #2563eb;
              border-bottom: 2px solid #2563eb;
              font-size: 16px;
              font-weight: 900;
              color: #1e3a8a;
            }

            .paid-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              font-size: 11px;
              font-weight: 900;
              color: #16a34a;
            }

            .payment-status {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 9.5px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-top: 6px;
            }

            .status-paid { background: #dcfce7; color: #166534; }
            .status-unpaid { background: #fee2e2; color: #991b1b; }
            .status-partial { background: #fef3c7; color: #92400e; }

            /* ============ FOOTER ============ */
            .footer {
              background: white;
              color: #1e293b;
              padding: 18px 22px;
              text-align: center;
              position: relative;
              z-index: 1;
              border-top: 3px solid #2563eb;
            }

            .footer .thanks {
              font-size: 13px;
              font-weight: 900;
              margin-bottom: 3px;
              color: #ea580c;
            }

            .footer .note {
              font-size: 9.5px;
              color: #64748b;
              font-weight: 700;
              margin-bottom: 12px;
            }

            .signature-row {
              display: flex;
              justify-content: space-around;
              margin-top: 15px;
              padding-top: 12px;
              border-top: 1.5px dashed #cbd5e1;
            }

            .signature-box {
              text-align: center;
              font-size: 10px;
              font-weight: 700;
              color: #475569;
            }

            .signature-line {
              width: 140px;
              border-top: 1.5px solid #94a3b8;
              margin: 22px auto 5px auto;
            }

            .footer-bottom {
              font-size: 8.5px;
              margin-top: 14px;
              color: #94a3b8;
              font-weight: 700;
              line-height: 1.4;
            }
          </style>
        </head>
        <body>
          <div class="invoice">
            <!-- WATERMARK -->
            <div class="watermark">CCC</div>

            <!-- HEADER -->
            <div class="header">
              <div class="logo-section">
                <div class="logo-box">
                  <img src="/logo.png" alt="Click Computer Center" />
                </div>
                <div class="company-info">
                  <h1>CLICK COMPUTER CENTER</h1>
                  <div class="tagline">Training, Maintenance & Sales Center</div>
                  <p>Tel: 0911-XXX-XXX | Addis Ababa, Ethiopia</p>
                </div>
              </div>
              <div class="invoice-title">
                <h2>INVOICE</h2>
                <div class="inv-num">${lastSaleData.Invoice_No}</div>
              </div>
            </div>

            <!-- INFO GRID -->
            <div class="info-grid">
              <div class="info-block">
                <h3>👤 የደንበኛ መረጃ (Bill To)</h3>
                <div class="main-text">${lastSaleData.Customer_Name}</div>
                <div class="sub-text">Payment: ${lastSaleData.Payment_Method}</div>
              </div>
              <div class="info-block" style="text-align: right;">
                <h3>📅 የደረሰኝ መረጃ (Invoice Details)</h3>
                <div class="main-text">${lastSaleData.Date}</div>
                <div class="sub-text">Cashier: ${lastSaleData.Recorded_By.split('@')[0]}</div>
              </div>
            </div>

            <!-- ITEMS TABLE -->
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 35px;">#</th>
                  <th>የእቃ ስም (Item Description)</th>
                  <th class="center" style="width: 60px;">ብዛት</th>
                  <th class="right" style="width: 90px;">ዋጋ</th>
                  <th class="right" style="width: 100px;">ጠቅላላ</th>
                </tr>
              </thead>
              <tbody>
                ${lastSaleData.Sales_Items.map((item: OrderItem, i: number) => `
                  <tr>
                    <td class="center" style="color: #94a3b8; font-weight: 900;">${i + 1}</td>
                    <td class="item-name">${item.Item_Name}</td>
                    <td class="center"><strong>${item.Quantity}</strong></td>
                    <td class="right">${item.Selling_Price.toLocaleString()} ብር</td>
                    <td class="right total-col">${item.Total_Price.toLocaleString()} ብር</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- SUMMARY SECTION -->
            <div class="summary-section">
              <div class="totals-box">
                <div class="total-row">
                  <span>ንዑስ ድምር (Subtotal):</span>
                  <strong>${lastSaleData.Subtotal.toLocaleString()} ብር</strong>
                </div>

                ${lastSaleData.Discount > 0 ? `
                  <div class="total-row discount">
                    <span>ቅናሽ (Discount):</span>
                    <strong>-${lastSaleData.Discount.toLocaleString()} ብር</strong>
                  </div>
                ` : ''}

                <div class="grand-total-row">
                  <span>ጠቅላላ:</span>
                  <span>${lastSaleData.Grand_Total.toLocaleString()} ብር</span>
                </div>

                <div class="paid-row">
                  <span>✓ የተከፈለ (Paid):</span>
                  <strong>${lastSaleData.Paid_Amount.toLocaleString()} ብር</strong>
                </div>

                <div style="text-align: right; margin-top: 4px;">
                  <span class="payment-status ${
                    lastSaleData.Payment_Status === 'Paid' ? 'status-paid' :
                    lastSaleData.Payment_Status === 'Partial' ? 'status-partial' : 'status-unpaid'
                  }">
                    ${lastSaleData.Payment_Status === 'Paid' ? '✓ PAID' :
                      lastSaleData.Payment_Status === 'Partial' ? '◐ PARTIAL' : '✗ UNPAID'}
                  </span>
                </div>
              </div>
            </div>

            <!-- FOOTER -->
            <div class="footer">
              <div class="thanks">🙏 ስለ ግዢዎ እናመሰግናለን!</div>
              <div class="note">Thank you for shopping with CLICK COMPUTER CENTER</div>

              <div class="signature-row">
                <div class="signature-box">
                  <div class="signature-line"></div>
                  የደንበኛ ፊርማ
                  <div style="font-size: 8px; margin-top: 3px; color: #94a3b8;">Customer Signature</div>
                </div>
                <div class="signature-box">
                  <div class="signature-line"></div>
                  የሽያጭ ባለሙያ
                  <div style="font-size: 8px; margin-top: 3px; color: #94a3b8;">Authorized Signature</div>
                </div>
              </div>

              <div class="footer-bottom">
                ይህ ደረሰኝ በ CLICK COMPUTER CENTER ሲስተም በራስ-ሰር የተዘጋጀ ነው።<br/>
                Generated on ${new Date().toLocaleString('am-ET')}
              </div>
            </div>

          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  // ============================================================
  // ➕ HANDLE NEW SALE
  // ============================================================
  const handleNewSale = () => {
    const randomInv = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    setInvoiceNo(randomInv);
    setDate(todayStr);
    setCustomerName('');
    setCustomerSearchTerm('');
    setIsCustomerDropdownOpen(false);
    setDiscount(0);
    setPaidAmount(0);
    setSaleStatus('Draft');
    setPaymentMethod('Cash');
    setPaymentStatus('Paid');
    setSalesItems([]);
    setIsAddingItem(false);
    setSelectedItemId('');
    setSelectedItemName('');
    setSellingPrice(0);
    setQuantity(1);
    setShowSuccessModal(false);
    setLastSaleData(null);
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setLastSaleData(null);
    onClose();
  };

  return (
    <>
      {/* ============================================================ */}
      {/* MAIN SALES MODAL */}
      {/* ============================================================ */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full my-8 relative overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* HEADER */}
          <div className="bg-slate-900 text-white p-6 flex justify-between items-center border-b border-orange-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 text-white rounded-xl">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-wide">የሽያጭ መመዝገቢያ ፎርም (Sales Form)</h3>
                <p className="text-xs text-orange-400 font-bold">Invoice No: {invoiceNo}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* BODY */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Invoice No</label>
                <input type="text" readOnly value={invoiceNo} className="w-full p-2.5 bg-slate-200 border border-slate-300 rounded-xl text-xs font-black text-slate-700 cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ቀን (Date)</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900" 
                />
              </div>

              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Customer Name </label>
                <div 
                  onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer flex justify-between items-center shadow-sm"
                >
                  <span className={customerName ? "text-slate-900 font-bold" : "text-slate-400"}>
                    {customerName || "ደንበኛ ይምረጡ..."}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </div>

                {isCustomerDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-2xl shadow-2xl z-50 p-2 space-y-2 max-h-64 overflow-y-auto">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="ደንበኛ በፍለጋ ይፈልጉ..."
                        value={customerSearchTerm}
                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    {onOpenCustomerModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomerDropdownOpen(false);
                          onOpenCustomerModal();
                        }}
                        className="w-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition border border-blue-200"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> + አዲስ ደንበኛ መዝግብ (New)
                      </button>
                    )}

                    <div className="divide-y divide-slate-100">
                      <div 
                        onClick={() => { setCustomerName('መደበኛ ደንበኛ (Walk-in Customer)'); setIsCustomerDropdownOpen(false); }}
                        className="p-2.5 hover:bg-orange-50 text-xs font-bold text-slate-700 cursor-pointer rounded-lg flex items-center justify-between"
                      >
                        <span>መደበኛ ደንበኛ (Walk-in Customer)</span>
                      </div>

                      {filteredCustomers.length === 0 ? (
                        <p className="p-3 text-xs text-slate-400 text-center italic">ምንም የተመዘገበ ደንበኛ አልተገኘም</p>
                      ) : (
                        filteredCustomers.map((c, idx) => {
                          const nameStr = c.Name || (c as any).Customer_Name || (c as any).Customer || 'ያልተሰየመ';
                          const phoneStr = c.Phone || (c as any).Phone_Number || '';

                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                setCustomerName(nameStr);
                                setIsCustomerDropdownOpen(false);
                              }}
                              className="p-2.5 hover:bg-orange-50 text-xs font-semibold text-slate-800 cursor-pointer rounded-lg flex justify-between items-center"
                            >
                              <span className="font-bold text-slate-900">{nameStr}</span>
                              {phoneStr && <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{phoneStr}</span>}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Master-Detail Sales Items */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-orange-500" /> የተሸጡ እቃዎች ዝርዝር (Sales Items)
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingItem(!isAddingItem)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" /> New Item
                </button>
              </div>

              {isAddingItem && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl space-y-3">
                  <h5 className="text-xs font-bold text-orange-900">አዲስ እቃ ወደ ሽያጭ መጨመሪያ</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Item / Item Name</label>
                      <select
                        value={selectedItemId || selectedItemName}
                        onChange={(e) => handleItemSelect(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                      >
                        <option value="">-- እቃ ይምረጡ --</option>
                        {inventory.map((item, idx) => (
                          <option key={idx} value={item.Item_Code || item.Item_ID || item.Item_Name}>
                            {item.Item_Name} (ያለው፦ {(item as any).Stock_Quantity || (item as any).Quantity_In_Stock || item.Stock || 0})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Selling Price (ዋጋ)</label>
                      <input
                        type="number"
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-emerald-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Quantity (ብዛት)</label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Total Price (ድምር)</label>
                      <input
                        type="number"
                        readOnly
                        value={sellingPrice * quantity}
                        className="w-full p-2 bg-slate-200 border border-slate-300 rounded-lg text-xs font-black text-slate-800 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setIsAddingItem(false)} className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                      ሰርዝ
                    </button>
                    <button type="button" onClick={handleAddItemToList} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md">
                      እቃውን ጨምር
                    </button>
                  </div>
                </div>
              )}

              {salesItems.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4 italic">ምንም እቃ አልተጨመረም። እቃ ለመጨመር "+ New Item" የሚለውን ይጫኑ።</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                      <tr>
                        <th className="p-2">እቃ</th>
                        <th className="p-2">ዋጋ</th>
                        <th className="p-2">ብዛት</th>
                        <th className="p-2 text-right">ድምር</th>
                        <th className="p-2 text-center">ድርጊት</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {salesItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-900">{item.Item_Name}</td>
                          <td className="p-2 font-semibold">{item.Selling_Price} ብር</td>
                          <td className="p-2 font-bold text-blue-600">{item.Quantity}</td>
                          <td className="p-2 text-right font-black text-slate-900">{item.Total_Price} ብር</td>
                          <td className="p-2 text-center">
                            <button type="button" onClick={() => handleRemoveItem(idx)} className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payment & Status */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Sale_Status</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSaleStatus('Draft')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                      saleStatus === 'Draft' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600'
                    }`}
                  >
                    Draft (ረቂቅ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleStatus('Completed')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                      saleStatus === 'Completed' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600'
                    }`}
                  >
                    Completed (የተጠናቀቀ)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Payment Method</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)} className="w-full p-2 bg-white border rounded-xl text-xs font-bold">
                    <option value="Cash">Cash (በጥሬ ገንዘብ)</option>
                    <option value="Telebirr">Telebirr</option>
                    <option value="CBE">CBE (ንግድ ባንክ)</option>
                    <option value="Credit">Credit (በብድር)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Discount (ቅናሽ)</label>
                  <input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="w-full p-2 bg-white border rounded-xl text-xs font-bold text-rose-600" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Paid Amount (የተከፈለ)</label>
                  <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} className="w-full p-2 bg-white border rounded-xl text-xs font-bold text-emerald-600" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Payment Status</label>
                  <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as any)} className="w-full p-2 bg-white border rounded-xl text-xs font-bold">
                    <option value="Paid">Paid (ሙሉ የተከፈለ)</option>
                    <option value="Unpaid">Unpaid (ያልተከፈለ)</option>
                    <option value="Partial">Partial (በከፊል የተከፈለ)</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between border-l-4 border-l-orange-500">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">አጠቃላይ ለመክፈል የቀረበ ሂሳብ፦</span>
                  <p className="text-xs text-slate-300">እቃዎች፦ {salesItems.length} | ቅናሽ፦ {discount} ብር</p>
                </div>
                <span className="text-2xl font-black text-orange-400">{grandTotal.toLocaleString()} ብር</span>
              </div>
            </div>

          </div>

          {/* FOOTER */}
          <div className="bg-slate-100 p-4 border-t flex justify-between items-center">
            <span className="text-[11px] text-slate-500 font-semibold">Recorded By: <strong className="text-slate-800">{currentUserEmail.split('@')[0]}</strong></span>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-bold text-xs">ሰርዝ</button>
              <button type="button" onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> ሽያጩን መዝግብ (Save Sale)
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 🎉 SUCCESS MODAL */}
      {/* ============================================================ */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[70] flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            
            {/* Decorative Header */}
            <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-8 text-white text-center overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto shadow-2xl border-4 border-white/30 mb-4">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-black tracking-tight">ሽያጩ በስኬት ተመዝግቧል! 🎉</h3>
                <p className="text-sm text-emerald-100 mt-1 font-bold">Sale completed successfully</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <span className="text-[10px] font-black text-blue-700 uppercase">የደረሰኝ ቁጥር (Invoice No)</span>
                </div>
                <p className="text-2xl font-black text-blue-600 tracking-wider">{lastInvoiceNumber}</p>
              </div>

              {lastSaleData && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase block">እቃዎች</span>
                    <p className="text-lg font-black text-slate-900">{lastSaleData.Sales_Items.length}</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                    <span className="text-[9px] font-black text-emerald-700 uppercase block">ጠቅላላ ሂሳብ</span>
                    <p className="text-lg font-black text-emerald-600">{lastSaleData.Grand_Total.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* 3 Action Buttons */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handlePrintPOSReceipt}
                    className="py-3.5 bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Receipt className="w-4 h-4" /> POS ደረሰኝ
                  </button>
                  <button
                    onClick={handlePrintA5Invoice}
                    className="py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> A5 Invoice
                  </button>
                </div>

                <button
                  onClick={handleNewSale}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> አዲስ ሽያጭ መዝግብ
                </button>
              </div>

              <button
                onClick={handleCloseSuccess}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                🚪 ዝጋ
              </button>

              <p className="text-center text-[10px] text-slate-400 font-bold pt-2 border-t">
                <Sparkles className="w-3 h-3 inline mr-1" />
                CLICK COMPUTER CENTER - Thank you!
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

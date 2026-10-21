// ═══════════════════════════════════════════════════════════════
// 🔄 SHEET → APP DATA MAPPERS
// ═══════════════════════════════════════════════════════════════

import { SaleRecord, ExpenseRecord } from "./financial-engine";

// ─── SALES (Sales_TBL + Sales_Items_TBL) ───
export interface EnrichedSale extends SaleRecord {
  salesId: string;
  customerName: string;
  totalAmount: number;
  discount: number;
  paidAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  saleStatus: string;
  invoiceNo: string;
  items: SaleItemLine[];
}

export interface SaleItemLine {
  salesItemId: string;
  itemId: string;
  itemName: string;
  sellingPrice: number;
  quantity: number;
  totalPrice: number;
  costPerItem: number;
  totalCost: number;
}

// Sales_TBL row → raw
export function mapSalesRow(r: any): {
  salesId: string;
  date: string;
  customerName: string;
  recordedBy: string;
  totalAmount: number;
  discount: number;
  paidAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  saleStatus: string;
  invoiceNo: string;
} {
  return {
    salesId: String(r.Sales_ID ?? ""),
    date: String(r.Date ?? ""),
    customerName: String(r.Customer_Name ?? "Walk-in"),
    recordedBy: String(r.Recorded_By ?? ""),
    totalAmount: Number(r.Total_Amount ?? 0),
    discount: Number(r.Discount ?? 0),
    paidAmount: Number(r.Paid_Amount ?? 0),
    paymentStatus: String(r.Payment_Status ?? "Unpaid"),
    paymentMethod: String(r.Payment_Method ?? "Cash"),
    saleStatus: String(r.Sale_Status ?? "Completed"),
    invoiceNo: String(r.Invoice_No ?? ""),
  };
}

// Sales_Items_TBL row → raw
export function mapSaleItemRow(r: any): SaleItemLine & { salesId: string } {
  return {
    salesId: String(r.Sales_ID ?? ""),
    salesItemId: String(r.Sales_Item_ID ?? ""),
    itemId: String(r.Item_ID ?? ""),
    itemName: String(r.Item_Name ?? ""),
    sellingPrice: Number(r.Selling_Price ?? 0),
    quantity: Number(r.Quantity ?? 0),
    totalPrice: Number(r.Total_Price ?? 0),
    costPerItem: Number(r.Cost_Per_Item ?? 0),
    totalCost: Number(r.Total_Cost_Amount ?? 0),
  };
}

// Sales_TBL + Sales_Items_TBL → Enriched (ለDashboard)
export function buildEnrichedSales(
  salesRows: any[],
  itemRows: any[]
): EnrichedSale[] {
  const itemsBySale = new Map<string, SaleItemLine[]>();
  for (const r of itemRows) {
    const item = mapSaleItemRow(r);
    if (!itemsBySale.has(item.salesId)) itemsBySale.set(item.salesId, []);
    itemsBySale.get(item.salesId)!.push(item);
  }

  return salesRows.map((r) => {
    const s = mapSalesRow(r);
    const items = itemsBySale.get(s.salesId) ?? [];

    // ⚠️ Financial engine ይጠቀማል — እኛ ራሳችን አንሰላም
    const totalFromItems = items.reduce((sum, it) => sum + it.totalPrice, 0);
    const totalCostFromItems = items.reduce((sum, it) => sum + it.totalCost, 0);

    return {
      id: s.salesId,
      salesId: s.salesId,
      date: s.date,
      customerName: s.customerName,
      totalAmount: s.totalAmount || totalFromItems,
      discount: s.discount,
      paidAmount: s.paidAmount,
      paymentStatus: s.paymentStatus,
      paymentMethod: s.paymentMethod,
      saleStatus: s.saleStatus,
      invoiceNo: s.invoiceNo,
      staffId: s.recordedBy,
      // Financial engine የሚጠቀመው
      quantity: items.reduce((sum, it) => sum + it.quantity, 0),
      unitPrice: items.length > 0 ? items[0].sellingPrice : 0,
      unitCost: items.length > 0 ? items[0].costPerItem : 0,
      Total_Price: s.totalAmount || totalFromItems,
      Total_Cost_Amount: totalCostFromItems,
      items,
    };
  });
}

// ─── EXPENSES (Expense_TBL) ───
export function mapExpenseRow(r: any): ExpenseRecord {
  return {
    id: String(r.Expense_ID ?? r.ID ?? ""),
    date: String(r.Date ?? ""),
    category: String(r.Category ?? "General"),
    amount: Number(r.Amount ?? 0),
  };
}

// ─── INVENTORY (Inventory_TBL) ───
export interface InventoryItem {
  id: string;
  name: string;
  itemCode: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  image: string;
  unitType: string;
  packSize: number;
  supplierId: string;
  date: string;
  avgCost: number;
  reorderLevel: number;
  status: string;
  profitMargin: number;
}

export function mapInventoryRow(r: any): InventoryItem {
  const cost = Number(r.Cost_Price ?? 0);
  const sell = Number(r.Selling_Price ?? 0);
  const margin = cost > 0 ? ((sell - cost) / cost) * 100 : 0;

  return {
    id: String(r.Item_ID ?? ""),
    name: String(r.Item_Name ?? ""),
    itemCode: String(r.Item_Code ?? ""),
    costPrice: cost,
    sellingPrice: sell,
    stock: Number(r.Stock_Quantity ?? 0),
    image: String(r.Item_Image ?? ""),
    unitType: String(r.Unit_Type ?? "pcs"),
    packSize: Number(r.Pack_Size ?? 1),
    supplierId: String(r.Supplier_ID ?? ""),
    date: String(r.Date ?? ""),
    avgCost: Number(r.Avg_Cost ?? cost),
    reorderLevel: Number(r.Reorder_Level ?? 10),
    status: String(r.Status ?? "Active"),
    profitMargin: round2(margin),
  };
}

// ─── EMPLOYEES (Employee_TBL) ───
export interface Employee {
  id: string;
  fullName: string;
  jobRole: string;
  gender: string;
  birthDate: string;
  phone: string;
  photo: string;
  email: string;
  homeAddress: string;
  kebele: string;
  city: string;
  state: string;
}

export function mapEmployeeRow(r: any): Employee {
  return {
    id: String(r.Employee_ID ?? ""),
    fullName: String(r["Employee_Full Name"] ?? r.Employee_Name ?? ""),
    jobRole: String(r.Job_Role ?? ""),
    gender: String(r.Gender ?? ""),
    birthDate: String(r["Birth Date"] ?? ""),
    phone: String(r["Phone No"] ?? ""),
    photo: String(r.Photo ?? ""),
    email: String(r["E- mail"] ?? r.Email ?? ""),
    homeAddress: String(r["Home Address"] ?? ""),
    kebele: String(r.kebele ?? ""),
    city: String(r.City ?? ""),
    state: String(r.State ?? ""),
  };
}

// ─── CUSTOMERS (Customer_TBL) ───
export interface Customer {
  id: string;
  name: string;
  phone: string;
  type: string;
  email: string;
  address: string;
  recordedBy: string;
}

export function mapCustomerRow(r: any): Customer {
  return {
    id: String(r.Customer_ID ?? ""),
    name: String(r.Customer_Name ?? ""),
    phone: String(r.Phone_Number ?? ""),
    type: String(r.Customer_Type ?? "Regular"),
    email: String(r.Customer_Email ?? ""),
    address: String(r.Address ?? ""),
    recordedBy: String(r.Recorded_By ?? ""),
  };
}

// ─── USER ACCESS (User_Access_TBL) ───
export interface AppUser {
  profilePicture: string;
  userName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  lastSeen: string;
  hasPassword: boolean;
}

export function mapUserRow(r: any): AppUser {
  const pass = String(r.Password ?? "");
  return {
    profilePicture: String(r["Profile Picture"] ?? ""),
    userName: String(r.User_Name ?? ""),
    email: String(r.User_Email ?? ""),
    phone: String(r["Phone No"] ?? ""),
    role: String(r.Role ?? "staff"),
    status: String(r.Status ?? "Active"),
    lastSeen: String(r.Last_Seen ?? ""),
    hasPassword: !!pass,
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

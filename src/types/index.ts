// ============================================================
// 📦 INVENTORY ITEM
// ============================================================
export interface InventoryItem {
  // IDs & Codes
  Item_ID?: string;
  Item_Code?: string;
  Item_Name?: string;
  Item_Image?: string;
  
  // Pricing
  Cost_Price?: number | string;
  Selling_Price?: number | string;
  Unit_Price?: number | string;
  
  // Stock
  Stock?: number | string;
  Stock_Quantity?: number | string;
  Quantity_In_Stock?: number | string;
  Reorder_Level?: number | string;
  Stock_Status?: string;
  Purchased_Qty?: number | string;
  Pack_Size?: string;
  
  // Unit
  Unit_Type?: string;
  Unite_Type?: string;       // ✅ ሁለቱንም ፍቀድ
  Unite_Type_Original?: string;
  
  // Relations
  Supplier_ID?: string;
  Supplier_Name?: string;
  
  // Meta
  Date?: string;
  Recorded_By?: string;
  Updated_By?: string;
  Avg_Cost?: number | string;
  
  // Allow any additional properties
  [key: string]: any;
}

// ============================================================
// 🚚 SUPPLIER ITEM
// ============================================================
export interface SupplierItem {
  Supplier_ID?: string;
  Supplier_Name?: string;
  Name?: string;
  Phone_Number?: string;
  Phone?: string;
  Company_Name?: string;
  Company?: string;
  Supply_Item?: string;
  Email?: string;
  Address?: string;
  Contact_Person?: string;
  Recorded_By?: string;
  
  // Allow any additional properties
  [key: string]: any;
}

// ============================================================
// 💰 SALE ITEM
// ============================================================
export interface SaleItem {
  Sales_ID?: string;
  Invoice_No?: string;
  Item_Code?: string;
  Item_ID?: string;
  Item_Name?: string;
  Quantity?: number | string;
  Unit_Price?: number | string;
  Total_Price?: number | string;
  Total_Amount?: number | string;
  Total_Cost_Amount?: number | string;
  Customer_Name?: string;
  Payment_Method?: string;
  Date?: string;
  Recorded_By?: string;
  
  // Allow any additional properties
  [key: string]: any;
}

// ============================================================
// 👤 CUSTOMER ITEM
// ============================================================
export interface CustomerItem {
  Customer_ID?: string;
  Name?: string;
  Customer_Name?: string;
  Customer?: string;
  Phone?: string;
  Phone_Number?: string;
  Email?: string;
  Customer_Email?: string;
  Address?: string;
  Customer_Type?: string;
  Recorded_By?: string;
  
  // Allow any additional properties
  [key: string]: any;
}

// ============================================================
// 💸 EXPENSE ITEM
// ============================================================
export interface ExpenseItem {
  Expense_ID?: string;
  Date?: string;
  Category?: string;
  Expense_Type?: string;
  Description?: string;
  Amount?: number | string;
  Payment_Method?: string;
  Receipt_No?: string;
  Approved_By?: string;
  Recorded_By?: string;
  
  [key: string]: any;
}

// ============================================================
// 💵 INCOME ITEM
// ============================================================
export interface IncomeItem {
  Income_ID?: string;
  Date?: string;
  Income_Source?: string;
  Income_Category?: string;
  Description?: string;
  Total_Price?: number | string;
  Price?: number | string;
  Material_Cost?: number | string;
  Payment_Method?: string;
  Recorded_By?: string;
  
  [key: string]: any;
}

// ============================================================
// 👥 USER ACCOUNT
// ============================================================
export interface UserAccount {
  User_Email?: string;
  Email?: string;
  Name?: string;
  Role?: UserRole;
  Status?: string;
  Created_At?: string;
  
  [key: string]: any;
}

// ============================================================
// 🎭 USER ROLE
// ============================================================
export type UserRole = 'Owner' | 'Admin' | 'Manager' | 'Employee';

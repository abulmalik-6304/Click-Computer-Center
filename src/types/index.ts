export type UserRole = 'Owner' | 'Admin' | 'Manager' | 'Employee';

export interface UserAccount {
  User_Email: string;
  Password?: string;
  Role: UserRole;
  Name?: string;
  Status?: string;
}

export interface SaleItem {
  Sale_ID?: string;
  Date: string;
  Customer_Name?: string;
  Item_Name: string;
  Quantity: number;
  Unit_Price: number;
  Total_Price: number;
  Total_Cost_Amount?: number;
  Recorded_By?: string;
  Payment_Status?: string;
  Receipt_File?: string;
}

export interface InventoryItem {
  Item_ID?: string;
  Item_Name: string;
  Stock_Quantity?: number;
  Quantity_In_Stock?: number;
  Unit_Type?: string;
  Cost_Price?: number;
  Unit_Price?: number;
  Selling_Price?: number;
  Reorder_Level?: number;
  Image?: string;
  Photo?: string;
}

export interface ExpenseItem {
  Expense_ID?: string;
  Date: string;
  Category: string;
  Amount: number;
  Reason?: string;
  Recorded_By?: string;
}

export interface IncomeItem {
  Income_ID?: string;
  Date: string;
  Income_Source: string;
  Material_Cost?: number;
  Total_Price: number;
  Amount?: number;
  Description?: string;
}

export interface CustomerItem {
  Customer_ID?: string;
  Name: string;
  Phone?: string;
  Address?: string;
}

export interface SupplierItem {
  Supplier_ID?: string;
  Company_Name: string;
  Phone?: string;
  Address?: string;
}

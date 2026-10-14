import { NextResponse } from 'next/server';
import { getTableData } from '../../../lib/googleSheets';

export async function GET() {
  try {
    const [
      sales,
      salesItems,
      income,
      expenses,
      inventory,
      stockIn,
      payments,
      users,
      employees,
      customers,
      suppliers,
      reportFilters,
      announcements,
    ] = await Promise.all([
      getTableData('Sales_TBL').catch(() => []),
      getTableData('Sales_Items_TBL').catch(() => []),
      getTableData('Income_TBL').catch(() => []),
      getTableData('Expense_TBL').catch(() => []),
      getTableData('Inventory_TBL').catch(() => []),
      getTableData('Stock_In_TBL').catch(() => []),
      getTableData('Payments_TBL').catch(() => []),
      getTableData('User_Access_TBL').catch(() => []),
      getTableData('Employee_TBL').catch(() => []),
      getTableData('Customer_TBL').catch(() => []),
      getTableData('Supplier_TBL').catch(() => []),
      getTableData('Report_Filter_TBL').catch(() => []),
      getTableData('Announcements_TBL').catch(() => []),
    ]);

    // Make sure sales array combines both Sales_TBL and Sales_Items_TBL so nothing is missed!
    const combinedSales = sales.length > 0 ? sales : salesItems;

    return NextResponse.json({
      success: true,
      data: {
        sales: combinedSales,
        salesItems,
        salesTBL: sales,
        income,
        expenses,
        inventory,
        stockIn,
        payments,
        users,
        employees,
        customers,
        suppliers,
        reportFilters,
        announcements,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch complete system data', error },
      { status: 500 }
    );
  }
}

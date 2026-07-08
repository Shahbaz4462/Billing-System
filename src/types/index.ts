export type UserRole = 'owner' | 'employee';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'cash' | 'card' | 'jazzcash' | 'easypaisa';
export type BillStatus = 'completed' | 'draft' | 'held' | 'void';
export type ThemeMode = 'light' | 'dark';
export type Language = 'en' | 'ur';

export interface User {
  id: string;
  fullName: string;
  username: string;
  password: string;
  phone: string;
  address: string;
  joiningDate: string;
  salary: number;
  role: UserRole;
  status: 'active' | 'inactive';
  hasSystemAccess: boolean; // Optional login - can be false for non-login employees
  totalAdvance: number; // Running advance balance
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  nameUrdu: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  nameUrdu: string;
  code: string;
  barcode: string;
  categoryId: string;
  unitType: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  minimumStock: number;
  supplierName: string;
  batchNumber: string;
  expiryDate: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  discountType: 'flat' | 'percentage';
}

export interface Bill {
  id: string;
  billNumber: string;
  customerName: string;
  customerPhone: string;
  employeeId: string;
  employeeName: string;
  items: BillItem[];
  subtotal: number;
  discountAmount: number;
  discountType: 'flat' | 'percentage';
  discountValue: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  status: BillStatus;
  updateCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BillItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface BillHistory {
  id: string;
  billId: string;
  version: number;
  modifiedBy: string;
  modifiedByName: string;
  modifiedByRole: UserRole;
  deviceName: string;
  previousData: BillSnapshot;
  newData: BillSnapshot;
  changes: BillChanges;
  timestamp: string;
}

export interface BillSnapshot {
  billNumber: string;
  customerName: string;
  customerPhone: string;
  items: BillItem[];
  subtotal: number;
  discountAmount: number;
  discountType: 'flat' | 'percentage';
  discountValue: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
}

export interface BillChanges {
  addedItems: { name: string; quantity: number }[];
  removedItems: { name: string; quantity: number }[];
  quantityChanges: { name: string; from: number; to: number }[];
  customerChanged: boolean;
  previousCustomer?: string;
  newCustomer?: string;
  paymentMethodChanged: boolean;
  previousPaymentMethod?: PaymentMethod;
  newPaymentMethod?: PaymentMethod;
  discountChanged: boolean;
  previousDiscount?: number;
  newDiscount?: number;
  totalChanged: boolean;
  previousTotal?: number;
  newTotal?: number;
}

export interface InventoryRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  productId: string;
  productName: string;
  requestType: 'increase' | 'decrease' | 'new_product';
  quantity: number;
  reason: string;
  status: RequestStatus;
  rejectionReason?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface EmployeePayment {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  paymentDate: string;
  paymentType: 'salary' | 'advance' | 'bonus' | 'deduction' | 'advance_return';
  notes: string;
  month?: string; // For salary tracking
  year?: number;
}

export interface EmployeeSalaryStatus {
  employeeId: string;
  monthlySalary: number;
  totalPaid: number;
  totalAdvance: number;
  advanceReturned: number;
  remainingAdvance: number;
  remainingSalary: number;
  netPayable: number;
}

export interface Settings {
  bakeryName: string;
  bakeryNameUrdu: string;
  address: string;
  addressUrdu: string;
  phone: string;
  taxNumber: string;
  receiptHeader: string;
  receiptFooter: string;
  paperSize: '58mm' | '80mm';
  printerName: string;
  theme: ThemeMode;
  language: Language;
  taxRate: number;
  currency: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
}

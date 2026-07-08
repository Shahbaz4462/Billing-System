import { v4 as uuidv4 } from 'uuid';
import type { User, Product, Category, Bill, BillHistory, BillSnapshot, BillChanges, InventoryRequest, AuditLog, EmployeePayment, Settings } from '../types';

const DB_KEY = 'bakery_db';

interface Database {
  users: User[];
  products: Product[];
  categories: Category[];
  bills: Bill[];
  billHistory: BillHistory[];
  inventoryRequests: InventoryRequest[];
  auditLogs: AuditLog[];
  employeePayments: EmployeePayment[];
  settings: Settings;
  billCounter: number;
}

const defaultSettings: Settings = {
  bakeryName: 'Sargodha Sweets and Bakers',
  bakeryNameUrdu: 'سرگودھا سویٹس اینڈ بیکرز',
  address: 'Sargodha, Pakistan',
  addressUrdu: 'سرگودھا، پاکستان',
  phone: '+92-300-1234567',
  taxNumber: 'TAX-2026-001',
  receiptHeader: 'Welcome to Golden Crust Bakery',
  receiptFooter: 'Thank you for your purchase! Visit again.',
  paperSize: '80mm',
  printerName: 'Default',
  theme: 'light',
  language: 'en',
  taxRate: 5,
  currency: 'Rs.',
};

const defaultCategories: Category[] = [
  { id: uuidv4(), name: 'Bread', nameUrdu: 'روٹی', description: 'All types of bread' },
  { id: uuidv4(), name: 'Cakes', nameUrdu: 'کیک', description: 'Cakes and pastries' },
  { id: uuidv4(), name: 'Cookies', nameUrdu: 'کوکیز', description: 'Cookies and biscuits' },
  { id: uuidv4(), name: 'Pastries', nameUrdu: 'پیسٹری', description: 'Pastries and puffs' },
  { id: uuidv4(), name: 'Beverages', nameUrdu: 'مشروبات', description: 'Drinks and beverages' },
  { id: uuidv4(), name: 'Sweets', nameUrdu: 'مٹھائی', description: 'Traditional sweets' },
];

function createDefaultProducts(categories: Category[]): Product[] {
  const breadCat = categories[0].id;
  const cakeCat = categories[1].id;
  const cookieCat = categories[2].id;
  const pastryCat = categories[3].id;
  const bevCat = categories[4].id;
  const sweetCat = categories[5].id;

  return [
    { id: uuidv4(), name: 'White Bread', nameUrdu: 'سفید روٹی', code: 'BRD001', barcode: '1000001', categoryId: breadCat, unitType: 'piece', purchasePrice: 80, salePrice: 120, quantity: 50, minimumStock: 10, supplierName: 'Flour Mills', batchNumber: 'B001', expiryDate: '2026-03-01', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Whole Wheat Bread', nameUrdu: 'گندم کی روٹی', code: 'BRD002', barcode: '1000002', categoryId: breadCat, unitType: 'piece', purchasePrice: 90, salePrice: 140, quantity: 35, minimumStock: 10, supplierName: 'Flour Mills', batchNumber: 'B002', expiryDate: '2026-03-01', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Garlic Naan', nameUrdu: 'لہسن نان', code: 'BRD003', barcode: '1000003', categoryId: breadCat, unitType: 'piece', purchasePrice: 20, salePrice: 40, quantity: 100, minimumStock: 20, supplierName: 'Local', batchNumber: 'B003', expiryDate: '2026-02-15', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Chocolate Cake', nameUrdu: 'چاکلیٹ کیک', code: 'CAK001', barcode: '2000001', categoryId: cakeCat, unitType: 'piece', purchasePrice: 800, salePrice: 1500, quantity: 8, minimumStock: 3, supplierName: 'Self Made', batchNumber: 'C001', expiryDate: '2026-02-10', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Vanilla Cake', nameUrdu: 'ونیلا کیک', code: 'CAK002', barcode: '2000002', categoryId: cakeCat, unitType: 'piece', purchasePrice: 700, salePrice: 1300, quantity: 5, minimumStock: 2, supplierName: 'Self Made', batchNumber: 'C002', expiryDate: '2026-02-10', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Red Velvet Cake', nameUrdu: 'ریڈ ویلویٹ کیک', code: 'CAK003', barcode: '2000003', categoryId: cakeCat, unitType: 'piece', purchasePrice: 900, salePrice: 1800, quantity: 3, minimumStock: 2, supplierName: 'Self Made', batchNumber: 'C003', expiryDate: '2026-02-10', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Butter Cookies', nameUrdu: 'مکھن کوکیز', code: 'COK001', barcode: '3000001', categoryId: cookieCat, unitType: 'pack', purchasePrice: 150, salePrice: 280, quantity: 40, minimumStock: 10, supplierName: 'Cookie Factory', batchNumber: 'K001', expiryDate: '2026-06-01', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Chocolate Chip Cookies', nameUrdu: 'چاکلیٹ چپ کوکیز', code: 'COK002', barcode: '3000002', categoryId: cookieCat, unitType: 'pack', purchasePrice: 180, salePrice: 320, quantity: 30, minimumStock: 8, supplierName: 'Cookie Factory', batchNumber: 'K002', expiryDate: '2026-06-01', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Chicken Patty', nameUrdu: 'چکن پیٹی', code: 'PST001', barcode: '4000001', categoryId: pastryCat, unitType: 'piece', purchasePrice: 40, salePrice: 80, quantity: 60, minimumStock: 15, supplierName: 'Self Made', batchNumber: 'P001', expiryDate: '2026-02-08', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Cream Roll', nameUrdu: 'کریم رول', code: 'PST002', barcode: '4000002', categoryId: pastryCat, unitType: 'piece', purchasePrice: 30, salePrice: 60, quantity: 45, minimumStock: 10, supplierName: 'Self Made', batchNumber: 'P002', expiryDate: '2026-02-08', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Samosa', nameUrdu: 'سموسہ', code: 'PST003', barcode: '4000003', categoryId: pastryCat, unitType: 'piece', purchasePrice: 15, salePrice: 30, quantity: 80, minimumStock: 20, supplierName: 'Self Made', batchNumber: 'P003', expiryDate: '2026-02-08', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Tea', nameUrdu: 'چائے', code: 'BEV001', barcode: '5000001', categoryId: bevCat, unitType: 'cup', purchasePrice: 15, salePrice: 40, quantity: 200, minimumStock: 50, supplierName: 'Tea Supplier', batchNumber: 'T001', expiryDate: '2026-12-01', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Coffee', nameUrdu: 'کافی', code: 'BEV002', barcode: '5000002', categoryId: bevCat, unitType: 'cup', purchasePrice: 30, salePrice: 80, quantity: 150, minimumStock: 30, supplierName: 'Coffee Co.', batchNumber: 'T002', expiryDate: '2026-12-01', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Gulab Jamun', nameUrdu: 'گلاب جامن', code: 'SWT001', barcode: '6000001', categoryId: sweetCat, unitType: 'piece', purchasePrice: 20, salePrice: 50, quantity: 2, minimumStock: 15, supplierName: 'Sweet House', batchNumber: 'S001', expiryDate: '2026-02-15', createdAt: new Date().toISOString() },
    { id: uuidv4(), name: 'Jalebi', nameUrdu: 'جلیبی', code: 'SWT002', barcode: '6000002', categoryId: sweetCat, unitType: 'kg', purchasePrice: 200, salePrice: 400, quantity: 0, minimumStock: 5, supplierName: 'Sweet House', batchNumber: 'S002', expiryDate: '2026-02-15', createdAt: new Date().toISOString() },
  ];
}

const defaultUsers: User[] = [
  {
    id: uuidv4(),
    fullName: 'Admin Owner',
    username: 'owner',
    password: 'owner123',
    phone: '+92-300-1111111',
    address: 'Lahore, Pakistan',
    joiningDate: '2024-01-01',
    salary: 0,
    role: 'owner',
    status: 'active',
    hasSystemAccess: true,
    totalAdvance: 0,
  },
  {
    id: uuidv4(),
    fullName: 'Ahmad Ali',
    username: 'ahmad',
    password: 'emp123',
    phone: '+92-300-2222222',
    address: 'Lahore, Pakistan',
    joiningDate: '2024-06-01',
    salary: 25000,
    role: 'employee',
    status: 'active',
    hasSystemAccess: true,
    totalAdvance: 0,
  },
  {
    id: uuidv4(),
    fullName: 'Sara Khan',
    username: 'sara',
    password: 'emp123',
    phone: '+92-300-3333333',
    address: 'Islamabad, Pakistan',
    joiningDate: '2025-01-15',
    salary: 22000,
    role: 'employee',
    status: 'active',
    hasSystemAccess: true,
    totalAdvance: 0,
  },
];

function getDefaultDB(): Database {
  const cats = defaultCategories;
  return {
    users: defaultUsers,
    products: createDefaultProducts(cats),
    categories: cats,
    bills: [],
    billHistory: [],
    inventoryRequests: [],
    auditLogs: [],
    employeePayments: [],
    settings: defaultSettings,
    billCounter: 0,
  };
}

function loadDB(): Database {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // ignore
  }
  const db = getDefaultDB();
  saveDB(db);
  return db;
}

function saveDB(db: Database): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// ---- PUBLIC API ----

export function getDB(): Database {
  return loadDB();
}

export function resetDB(): void {
  const db = getDefaultDB();
  saveDB(db);
}

// Auth
export function authenticateUser(username: string, password: string): User | null {
  const db = loadDB();
  return db.users.find(u => u.username === username && u.password === password && u.status === 'active') || null;
}

// Users
export function getUsers(): User[] { return loadDB().users; }
export function getUserById(id: string): User | undefined { return loadDB().users.find(u => u.id === id); }
export function addUser(user: Omit<User, 'id'>): User {
  const db = loadDB();
  const newUser = { ...user, id: uuidv4() };
  db.users.push(newUser);
  saveDB(db);
  return newUser;
}
export function updateUser(id: string, data: Partial<User>): void {
  const db = loadDB();
  const idx = db.users.findIndex(u => u.id === id);
  if (idx >= 0) { db.users[idx] = { ...db.users[idx], ...data }; saveDB(db); }
}
export function deleteUser(id: string): void {
  const db = loadDB();
  db.users = db.users.filter(u => u.id !== id);
  saveDB(db);
}

// Categories
export function getCategories(): Category[] { return loadDB().categories; }
export function addCategory(cat: Omit<Category, 'id'>): Category {
  const db = loadDB();
  const newCat = { ...cat, id: uuidv4() };
  db.categories.push(newCat);
  saveDB(db);
  return newCat;
}
export function updateCategory(id: string, data: Partial<Category>): void {
  const db = loadDB();
  const idx = db.categories.findIndex(c => c.id === id);
  if (idx >= 0) { db.categories[idx] = { ...db.categories[idx], ...data }; saveDB(db); }
}
export function deleteCategory(id: string): void {
  const db = loadDB();
  db.categories = db.categories.filter(c => c.id !== id);
  saveDB(db);
}

// Products
export function getProducts(): Product[] { return loadDB().products; }
export function getProductById(id: string): Product | undefined { return loadDB().products.find(p => p.id === id); }
export function addProduct(product: Omit<Product, 'id' | 'createdAt'>): Product {
  const db = loadDB();
  const newProd = { ...product, id: uuidv4(), createdAt: new Date().toISOString() };
  db.products.push(newProd);
  saveDB(db);
  return newProd;
}
export function updateProduct(id: string, data: Partial<Product>): void {
  const db = loadDB();
  const idx = db.products.findIndex(p => p.id === id);
  if (idx >= 0) { db.products[idx] = { ...db.products[idx], ...data }; saveDB(db); }
}
export function deleteProduct(id: string): void {
  const db = loadDB();
  db.products = db.products.filter(p => p.id !== id);
  saveDB(db);
}

// Bills
export function getBills(): Bill[] { return loadDB().bills; }
export function getBillById(id: string): Bill | undefined { return loadDB().bills.find(b => b.id === id); }
export function getNextBillNumber(): string {
  const db = loadDB();
  db.billCounter += 1;
  saveDB(db);
  const year = new Date().getFullYear();
  return `BAK-${year}-${String(db.billCounter).padStart(5, '0')}`;
}
export function addBill(bill: Omit<Bill, 'id'>): Bill {
  const db = loadDB();
  const newBill = { ...bill, id: uuidv4() };
  db.bills.push(newBill);
  saveDB(db);
  return newBill;
}
export function updateBill(id: string, data: Partial<Bill>): void {
  const db = loadDB();
  const idx = db.bills.findIndex(b => b.id === id);
  if (idx >= 0) { db.bills[idx] = { ...db.bills[idx], ...data }; saveDB(db); }
}
export function deleteBill(id: string): void {
  const db = loadDB();
  db.bills = db.bills.filter(b => b.id !== id);
  saveDB(db);
}

// Bill History
export function getBillHistory(billId?: string): BillHistory[] {
  const db = loadDB();
  if (billId) return db.billHistory.filter(h => h.billId === billId).sort((a, b) => a.version - b.version);
  return db.billHistory;
}

export function getBillHistoryCount(billId: string): number {
  const db = loadDB();
  return db.billHistory.filter(h => h.billId === billId).length;
}

export function createBillSnapshot(bill: Bill): BillSnapshot {
  return {
    billNumber: bill.billNumber,
    customerName: bill.customerName,
    customerPhone: bill.customerPhone,
    items: [...bill.items],
    subtotal: bill.subtotal,
    discountAmount: bill.discountAmount,
    discountType: bill.discountType,
    discountValue: bill.discountValue,
    taxRate: bill.taxRate,
    taxAmount: bill.taxAmount,
    grandTotal: bill.grandTotal,
    paymentMethod: bill.paymentMethod,
  };
}

export function calculateBillChanges(oldBill: BillSnapshot, newBill: BillSnapshot): BillChanges {
  const changes: BillChanges = {
    addedItems: [],
    removedItems: [],
    quantityChanges: [],
    customerChanged: false,
    paymentMethodChanged: false,
    discountChanged: false,
    totalChanged: false,
  };

  // Check for added and quantity-changed items
  for (const newItem of newBill.items) {
    const oldItem = oldBill.items.find(i => i.productId === newItem.productId);
    if (!oldItem) {
      changes.addedItems.push({ name: newItem.productName, quantity: newItem.quantity });
    } else if (oldItem.quantity !== newItem.quantity) {
      changes.quantityChanges.push({ name: newItem.productName, from: oldItem.quantity, to: newItem.quantity });
    }
  }

  // Check for removed items
  for (const oldItem of oldBill.items) {
    const newItem = newBill.items.find(i => i.productId === oldItem.productId);
    if (!newItem) {
      changes.removedItems.push({ name: oldItem.productName, quantity: oldItem.quantity });
    }
  }

  // Check customer change
  if (oldBill.customerName !== newBill.customerName) {
    changes.customerChanged = true;
    changes.previousCustomer = oldBill.customerName;
    changes.newCustomer = newBill.customerName;
  }

  // Check payment method change
  if (oldBill.paymentMethod !== newBill.paymentMethod) {
    changes.paymentMethodChanged = true;
    changes.previousPaymentMethod = oldBill.paymentMethod;
    changes.newPaymentMethod = newBill.paymentMethod;
  }

  // Check discount change
  if (oldBill.discountAmount !== newBill.discountAmount) {
    changes.discountChanged = true;
    changes.previousDiscount = oldBill.discountAmount;
    changes.newDiscount = newBill.discountAmount;
  }

  // Check total change
  if (oldBill.grandTotal !== newBill.grandTotal) {
    changes.totalChanged = true;
    changes.previousTotal = oldBill.grandTotal;
    changes.newTotal = newBill.grandTotal;
  }

  return changes;
}

export function addBillHistory(history: Omit<BillHistory, 'id'>): void {
  const db = loadDB();
  db.billHistory.push({ ...history, id: uuidv4() });
  saveDB(db);
}

export function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows PC';
  if (ua.includes('Mac')) return 'Mac';
  if (ua.includes('Linux')) return 'Linux PC';
  if (ua.includes('Android')) return 'Android Device';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS Device';
  return 'Unknown Device';
}

// Inventory Requests
export function getInventoryRequests(): InventoryRequest[] { return loadDB().inventoryRequests; }
export function addInventoryRequest(req: Omit<InventoryRequest, 'id' | 'createdAt' | 'status'>): InventoryRequest {
  const db = loadDB();
  const newReq: InventoryRequest = { ...req, id: uuidv4(), status: 'pending', createdAt: new Date().toISOString() };
  db.inventoryRequests.push(newReq);
  saveDB(db);
  return newReq;
}
export function updateInventoryRequest(id: string, data: Partial<InventoryRequest>): void {
  const db = loadDB();
  const idx = db.inventoryRequests.findIndex(r => r.id === id);
  if (idx >= 0) { db.inventoryRequests[idx] = { ...db.inventoryRequests[idx], ...data }; saveDB(db); }
}

// Audit Logs
export function getAuditLogs(): AuditLog[] { return loadDB().auditLogs; }
export function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
  const db = loadDB();
  db.auditLogs.push({ ...log, id: uuidv4(), timestamp: new Date().toISOString() });
  saveDB(db);
}

// Employee Payments
export function getEmployeePayments(employeeId?: string): EmployeePayment[] {
  const db = loadDB();
  if (employeeId) return db.employeePayments.filter(p => p.employeeId === employeeId).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  return db.employeePayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
}

export function addEmployeePayment(payment: Omit<EmployeePayment, 'id'>): void {
  const db = loadDB();
  db.employeePayments.push({ ...payment, id: uuidv4() });
  
  // Update employee's total advance if it's an advance payment
  if (payment.paymentType === 'advance') {
    const empIdx = db.users.findIndex(u => u.id === payment.employeeId);
    if (empIdx >= 0) {
      db.users[empIdx].totalAdvance = (db.users[empIdx].totalAdvance || 0) + payment.amount;
    }
  } else if (payment.paymentType === 'advance_return') {
    const empIdx = db.users.findIndex(u => u.id === payment.employeeId);
    if (empIdx >= 0) {
      db.users[empIdx].totalAdvance = Math.max(0, (db.users[empIdx].totalAdvance || 0) - payment.amount);
    }
  }
  
  saveDB(db);
}

export function getEmployeeSalaryStatus(employeeId: string): { 
  monthlySalary: number; 
  totalPaidThisMonth: number;
  totalAdvance: number;
  remainingSalary: number;
  payments: EmployeePayment[];
} {
  const db = loadDB();
  const emp = db.users.find(u => u.id === employeeId);
  if (!emp) return { monthlySalary: 0, totalPaidThisMonth: 0, totalAdvance: 0, remainingSalary: 0, payments: [] };
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const payments = db.employeePayments.filter(p => p.employeeId === employeeId);
  const thisMonthPayments = payments.filter(p => {
    const d = new Date(p.paymentDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && p.paymentType === 'salary';
  });
  
  const totalPaidThisMonth = thisMonthPayments.reduce((s, p) => s + p.amount, 0);
  const remainingSalary = Math.max(0, emp.salary - totalPaidThisMonth);
  
  return {
    monthlySalary: emp.salary,
    totalPaidThisMonth,
    totalAdvance: emp.totalAdvance || 0,
    remainingSalary,
    payments,
  };
}

// Settings
export function getSettings(): Settings { return loadDB().settings; }
export function updateSettings(data: Partial<Settings>): void {
  const db = loadDB();
  db.settings = { ...db.settings, ...data };
  saveDB(db);
}

// Backup
export function createBackup(): string {
  const db = loadDB();
  return JSON.stringify(db, null, 2);
}
export function restoreBackup(data: string): boolean {
  try {
    const db = JSON.parse(data) as Database;
    if (db.users && db.products) {
      saveDB(db);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Generate sample bills for demo
export function generateSampleBills(): void {
  const db = loadDB();
  if (db.bills.length > 0) return;
  
  const emp = db.users.find(u => u.role === 'employee');
  if (!emp) return;
  
  const now = new Date();
  const products = db.products;
  
  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const hour = 8 + Math.floor(Math.random() * 12);
    const billDate = new Date(now);
    billDate.setDate(billDate.getDate() - daysAgo);
    billDate.setHours(hour, Math.floor(Math.random() * 60));
    
    const numItems = 1 + Math.floor(Math.random() * 4);
    const selectedProducts = [...products].sort(() => Math.random() - 0.5).slice(0, numItems);
    
    const items = selectedProducts.map(p => {
      const qty = 1 + Math.floor(Math.random() * 5);
      return {
        productId: p.id,
        productName: p.name,
        productCode: p.code,
        quantity: qty,
        unitPrice: p.salePrice,
        discount: 0,
        total: p.salePrice * qty,
      };
    });
    
    const subtotal = items.reduce((s, it) => s + it.total, 0);
    const taxAmount = Math.round(subtotal * db.settings.taxRate / 100);
    const methods: Array<'cash' | 'card' | 'jazzcash' | 'easypaisa'> = ['cash', 'card', 'jazzcash', 'easypaisa'];
    
    db.billCounter += 1;
    const bill: Bill = {
      id: uuidv4(),
      billNumber: `BAK-${now.getFullYear()}-${String(db.billCounter).padStart(5, '0')}`,
      customerName: ['Walk-in', 'Ali', 'Hassan', 'Fatima', 'Ayesha', 'Usman'][Math.floor(Math.random() * 6)],
      customerPhone: '',
      employeeId: emp.id,
      employeeName: emp.fullName,
      items,
      subtotal,
      discountAmount: 0,
      discountType: 'flat',
      discountValue: 0,
      taxRate: db.settings.taxRate,
      taxAmount,
      grandTotal: subtotal + taxAmount,
      paymentMethod: methods[Math.floor(Math.random() * methods.length)],
      status: 'completed',
      updateCount: 0,
      createdAt: billDate.toISOString(),
      updatedAt: billDate.toISOString(),
    };
    db.bills.push(bill);
  }
  
  saveDB(db);
}

// Pagination helper for bills
export function getBillsPaginated(page: number, limit: number, filters?: {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): { bills: Bill[]; total: number; pages: number } {
  const db = loadDB();
  let filtered = db.bills.filter(b => b.status === 'completed' || b.status === 'void');
  
  if (filters?.status && filters.status !== 'all') {
    filtered = filtered.filter(b => b.status === filters.status);
  }
  if (filters?.dateFrom) {
    filtered = filtered.filter(b => new Date(b.createdAt) >= new Date(filters.dateFrom!));
  }
  if (filters?.dateTo) {
    const to = new Date(filters.dateTo); to.setDate(to.getDate() + 1);
    filtered = filtered.filter(b => new Date(b.createdAt) < to);
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    filtered = filtered.filter(b => 
      b.billNumber.toLowerCase().includes(s) || 
      b.customerName.toLowerCase().includes(s) || 
      b.customerPhone.includes(s)
    );
  }
  
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const total = filtered.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const bills = filtered.slice(start, start + limit);
  
  return { bills, total, pages };
}

// Analytics functions
export interface SalesAnalytics {
  totalRevenue: number;
  totalProfit: number;
  totalBills: number;
  averageBillValue: number;
  billsByPaymentMethod: Record<string, number>;
  revenueByPaymentMethod: Record<string, number>;
}

export function getSalesAnalytics(dateFrom?: string, dateTo?: string): SalesAnalytics {
  const db = loadDB();
  let bills = db.bills.filter(b => b.status === 'completed');
  
  if (dateFrom) bills = bills.filter(b => new Date(b.createdAt) >= new Date(dateFrom));
  if (dateTo) {
    const to = new Date(dateTo); to.setDate(to.getDate() + 1);
    bills = bills.filter(b => new Date(b.createdAt) < to);
  }
  
  const totalRevenue = bills.reduce((s, b) => s + b.grandTotal, 0);
  const totalProfit = bills.reduce((s, b) => {
    return s + b.items.reduce((ps, item) => {
      const prod = db.products.find(p => p.id === item.productId);
      const cost = prod ? prod.purchasePrice * item.quantity : 0;
      return ps + (item.total - cost);
    }, 0);
  }, 0);
  
  const billsByPaymentMethod: Record<string, number> = { cash: 0, card: 0, jazzcash: 0, easypaisa: 0 };
  const revenueByPaymentMethod: Record<string, number> = { cash: 0, card: 0, jazzcash: 0, easypaisa: 0 };
  
  bills.forEach(b => {
    billsByPaymentMethod[b.paymentMethod] = (billsByPaymentMethod[b.paymentMethod] || 0) + 1;
    revenueByPaymentMethod[b.paymentMethod] = (revenueByPaymentMethod[b.paymentMethod] || 0) + b.grandTotal;
  });
  
  return {
    totalRevenue,
    totalProfit,
    totalBills: bills.length,
    averageBillValue: bills.length > 0 ? Math.round(totalRevenue / bills.length) : 0,
    billsByPaymentMethod,
    revenueByPaymentMethod,
  };
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  productNameUrdu: string;
  unitsSold: number;
  revenue: number;
  profit: number;
  category: 'hot' | 'average' | 'low';
  profitCategory: 'high' | 'average' | 'low';
}

export function getProductPerformance(dateFrom?: string, dateTo?: string): ProductPerformance[] {
  const db = loadDB();
  let bills = db.bills.filter(b => b.status === 'completed');
  
  if (dateFrom) bills = bills.filter(b => new Date(b.createdAt) >= new Date(dateFrom));
  if (dateTo) {
    const to = new Date(dateTo); to.setDate(to.getDate() + 1);
    bills = bills.filter(b => new Date(b.createdAt) < to);
  }
  
  const productStats: Record<string, { units: number; revenue: number; profit: number }> = {};
  
  bills.forEach(b => {
    b.items.forEach(item => {
      if (!productStats[item.productId]) {
        productStats[item.productId] = { units: 0, revenue: 0, profit: 0 };
      }
      productStats[item.productId].units += item.quantity;
      productStats[item.productId].revenue += item.total;
      
      const prod = db.products.find(p => p.id === item.productId);
      if (prod) {
        productStats[item.productId].profit += (item.unitPrice - prod.purchasePrice) * item.quantity;
      }
    });
  });
  
  const performances: ProductPerformance[] = [];
  const maxUnits = Math.max(...Object.values(productStats).map(s => s.units), 1);
  const maxProfit = Math.max(...Object.values(productStats).map(s => s.profit), 1);
  
  for (const [productId, stats] of Object.entries(productStats)) {
    const prod = db.products.find(p => p.id === productId);
    if (!prod) continue;
    
    const unitRatio = stats.units / maxUnits;
    const profitRatio = stats.profit / maxProfit;
    
    performances.push({
      productId,
      productName: prod.name,
      productNameUrdu: prod.nameUrdu,
      unitsSold: stats.units,
      revenue: stats.revenue,
      profit: stats.profit,
      category: unitRatio >= 0.6 ? 'hot' : unitRatio >= 0.3 ? 'average' : 'low',
      profitCategory: profitRatio >= 0.6 ? 'high' : profitRatio >= 0.3 ? 'average' : 'low',
    });
  }
  
  return performances.sort((a, b) => b.unitsSold - a.unitsSold);
}

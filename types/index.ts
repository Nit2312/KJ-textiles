export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'staff';
  createdAt: Date;
}

export interface Customer {
  id: string;
  customerId: string;
  name: string;
  businessName: string;
  address: string;
  city: string;
  state: string;
  gstNumber: string;
  mobileNumber: string;
  brokerName: string;
  notes: string;
  createdAt: Date;
}

export interface Broker {
  id: string;
  brokerId: string;
  name: string;
  mobileNumber: string;
  commissionPercentage: number;
  notes: string;
  createdAt: Date;
}

export interface FabricQuality {
  id: string;
  qualityId: string;
  name: string;
  gsm: number;
  description: string;
  createdAt: Date;
}

// A single roll (taka) in a challan — each roll has its own meter reading
export interface ChallanRoll {
  meters: number;
}

// Legacy support
export interface RollData {
  rollNumber: string;
  meters: number;
  taka: number;
}

export interface ChallanItem {
  id: string;
  qualityId: string;
  quantity: number;
  rate: number;
  gst: number;
  meters?: number;
}

export interface Challan {
  id: string;
  challanNumber?: string;
  number?: string;          // legacy alias
  challanDate?: Date;
  date?: Date;              // legacy alias
  customerId: string;
  quality?: string;         // e.g. "SEMI 34gm"
  broker?: string;          // e.g. "TARACHANDJI"
  rolls?: ChallanRoll[];    // individual roll meter readings
  totalTaka?: number;       // = rolls.length
  totalMeters?: number;     // = sum of roll meters
  remarks?: string;
  status?: 'draft' | 'approved' | 'invoiced';
  // Legacy fields
  items?: ChallanItem[];
  qualityName?: string;
  brokerName?: string;
  brokerCommission?: number;
  rollsData?: RollData[];
  createdAt: Date;
  updatedAt?: Date;
}

// Invoice line item — matches the physical invoice columns
export interface InvoiceItem {
  id: string;
  description: string;    // quality name, e.g. "SEMI 34gm"
  hsnCode: string;        // e.g. "5407"
  totalTaka: number;      // number of rolls
  meters: number;         // total meters
  basicRate: number;      // rate per meter
  totalAmount: number;    // meters × basicRate
  // Legacy fields
  qualityId?: string;
  quantity?: number;
  rate?: number;
  gst?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber?: string;
  number?: string;          // legacy alias
  invoiceDate?: Date;
  date?: Date;              // legacy alias
  challanNumber?: string;
  challanDate?: Date;
  dueDate?: Date;
  customerId: string;
  broker?: string;          // broker name
  brokerId?: string;        // legacy
  items?: InvoiceItem[];
  // Tax fields
  cgstPercent?: number;     // default 2.5
  sgstPercent?: number;     // default 2.5
  igstPercent?: number;     // default 0
  totalAmountBeforeTax?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  subTotal?: number;
  roundOff?: number;
  grandTotal?: number;
  netRate?: number;
  amountInWords?: string;
  remarks?: string;
  status?: 'draft' | 'sent' | 'paid' | 'overdue';
  // Legacy fields
  discountPercent?: number;
  additionalCharges?: number;
  challanId?: string;
  hsnCode?: string;
  description?: string;
  totalTaka?: number;
  totalMeters?: number;
  basicRate?: number;
  totalAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  subtotal?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Template {
  id: string;
  userId: string;
  name: string;
  type?: 'challan' | 'invoice';
  logoUrl: string;
  // Stored config — all fields are Record<string, unknown> for Firestore flexibility
  headerLayout: Record<string, unknown>;          // companyName, address, phone, gstin, accentColor …
  customerSectionLayout: Record<string, unknown>; // showBrokerField, showQualityField, showGstinField
  tableLayout: Record<string, unknown>;
  footerLayout: Record<string, unknown>;          // bankName, accountNo, ifscCode, showTerms …
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

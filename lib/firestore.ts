import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  getCountFromServer,
  getAggregateFromServer,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  documentId,
  sum,
  Timestamp,
  Query,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { Customer, Broker, FabricQuality, Challan, Invoice, Template } from '@/types';

// Helper function to get user-friendly Firestore error messages
function getFirestoreErrorMessage(error: any, operation: string): string {
  const errorCode = error?.code || '';
  
  switch (errorCode) {
    case 'permission-denied':
      return 'You do not have permission to perform this action.';
    case 'not-found':
      return 'The requested data could not be found.';
    case 'already-exists':
      return 'This record already exists.';
    case 'resource-exhausted':
      return 'Too many requests. Please try again later.';
    case 'failed-precondition':
      return 'Operation failed. Please check your data and try again.';
    case 'aborted':
      return 'Operation was aborted. Please try again.';
    case 'out-of-range':
      return 'Invalid data range provided.';
    case 'unimplemented':
      return 'This feature is not available.';
    case 'internal':
      return 'An internal error occurred. Please try again.';
    case 'unavailable':
      return 'Service is temporarily unavailable. Please check your connection.';
    case 'data-loss':
      return 'Data loss detected. Please contact support.';
    case 'unauthenticated':
      return 'You must be signed in to perform this action.';
    case 'invalid-argument':
      return 'Invalid data provided. Please check your input.';
    case 'deadline-exceeded':
      return 'Request timed out. Please try again.';
    case 'cancelled':
      return 'Operation was cancelled.';
    default:
      return `Failed to ${operation}. Please try again.`;
  }
}

const TRANSIENT_FIRESTORE_CODES = new Set([
  'unavailable',
  'deadline-exceeded',
  'resource-exhausted',
  'internal',
  'cancelled',
  'unknown',
]);

async function withRetry<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const maxAttempts = 3;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const start = typeof performance !== 'undefined' ? performance.now() : 0;
      const result = await fn();
      if (process.env.NODE_ENV !== 'production' && typeof performance !== 'undefined') {
        const ms = Math.round(performance.now() - start);
        // eslint-disable-next-line no-console
        console.debug(`[firestore] ${operation} (${ms}ms)`);
      }
      return result;
    } catch (error: any) {
      lastError = error;

      const code = error?.code || '';
      const isTransient = TRANSIENT_FIRESTORE_CODES.has(code);
      if (!isTransient || attempt === maxAttempts) break;

      const baseDelayMs = 250;
      const backoffMs = baseDelayMs * Math.pow(2, attempt - 1);
      const jitterMs = Math.floor(Math.random() * 150);
      await new Promise((r) => setTimeout(r, backoffMs + jitterMs));
    }
  }

  throw new Error(getFirestoreErrorMessage(lastError, operation));
}

type CachedPromise<T> = { expiresAt: number; promise: Promise<T> };
const READ_CACHE = new Map<string, CachedPromise<any>>();

function cachedRead<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = READ_CACHE.get(key) as CachedPromise<T> | undefined;
  if (existing && existing.expiresAt > now) return existing.promise;

  const promise = loader().catch((err) => {
    READ_CACHE.delete(key);
    throw err;
  });
  READ_CACHE.set(key, { expiresAt: now + ttlMs, promise });
  return promise;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// Customers
export async function addCustomer(data: Omit<Customer, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'customers'), {
      ...data,
      createdAt: Timestamp.now(),
    });
    READ_CACHE.delete('customers:all');
    READ_CACHE.delete('dashboard:snapshot');
    return docRef.id;
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'add customer'));
  }
}

export async function getCustomers(): Promise<Customer[]> {
  try {
    return await cachedRead('customers:all', 30_000, async () => {
      return withRetry('load customers', async () => {
        const querySnapshot = await getDocs(
          query(collection(db, 'customers'), orderBy('createdAt', 'desc'))
        );
        return querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          id: doc.id,
        })) as Customer[];
      });
    });
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'load customers'));
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    const docSnap = await withRetry('load customer', () => getDoc(doc(db, 'customers', id)));
    if (docSnap.exists()) {
      return {
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        id: docSnap.id,
      } as Customer;
    }
    return null;
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'load customer'));
  }
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<void> {
  try {
    await withRetry('update customer', () => updateDoc(doc(db, 'customers', id), data));
    READ_CACHE.delete('customers:all');
    READ_CACHE.delete('dashboard:snapshot');
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'update customer'));
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  try {
    await withRetry('delete customer', () => deleteDoc(doc(db, 'customers', id)));
    READ_CACHE.delete('customers:all');
    READ_CACHE.delete('dashboard:snapshot');
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'delete customer'));
  }
}

// Brokers
export async function addBroker(data: Omit<Broker, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'brokers'), {
      ...data,
      createdAt: Timestamp.now(),
    });
    READ_CACHE.delete('brokers:all');
    return docRef.id;
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'add broker'));
  }
}

export async function getBrokers(): Promise<Broker[]> {
  try {
    return await cachedRead('brokers:all', 30_000, async () => {
      return withRetry('load brokers', async () => {
        const querySnapshot = await getDocs(
          query(collection(db, 'brokers'), orderBy('createdAt', 'desc'))
        );
        return querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          id: doc.id,
        })) as Broker[];
      });
    });
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'load brokers'));
  }
}

export async function getBrokerById(id: string): Promise<Broker | null> {
  try {
    const docSnap = await withRetry('load broker', () => getDoc(doc(db, 'brokers', id)));
    if (docSnap.exists()) {
      return {
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        id: docSnap.id,
      } as Broker;
    }
    return null;
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'load broker'));
  }
}

export async function updateBroker(id: string, data: Partial<Broker>): Promise<void> {
  try {
    await withRetry('update broker', () => updateDoc(doc(db, 'brokers', id), data));
    READ_CACHE.delete('brokers:all');
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'update broker'));
  }
}

export async function deleteBroker(id: string): Promise<void> {
  try {
    await withRetry('delete broker', () => deleteDoc(doc(db, 'brokers', id)));
    READ_CACHE.delete('brokers:all');
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'delete broker'));
  }
}

// Fabric Qualities
export async function addFabricQuality(data: Omit<FabricQuality, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'fabricQualities'), {
      ...data,
      createdAt: Timestamp.now(),
    });
    READ_CACHE.delete('fabricQualities:all');
    return docRef.id;
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'add fabric quality'));
  }
}

export async function getFabricQualities(): Promise<FabricQuality[]> {
  try {
    return await cachedRead('fabricQualities:all', 60_000, async () => {
      return withRetry('load fabric qualities', async () => {
        const querySnapshot = await getDocs(
          query(collection(db, 'fabricQualities'), orderBy('createdAt', 'desc'))
        );
        return querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          id: doc.id,
        })) as FabricQuality[];
      });
    });
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'load fabric qualities'));
  }
}

export async function updateFabricQuality(id: string, data: Partial<FabricQuality>): Promise<void> {
  try {
    await withRetry('update fabric quality', () => updateDoc(doc(db, 'fabricQualities', id), data));
    READ_CACHE.delete('fabricQualities:all');
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'update fabric quality'));
  }
}

export async function deleteFabricQuality(id: string): Promise<void> {
  try {
    await withRetry('delete fabric quality', () => deleteDoc(doc(db, 'fabricQualities', id)));
    READ_CACHE.delete('fabricQualities:all');
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'delete fabric quality'));
  }
}

// Challans
export async function addChallan(data: Omit<Challan, 'id' | 'number'>): Promise<string> {
  try {
    const dataToSave: any = { ...data };

    // Never persist a client-side id field; Firestore document id is the source of truth.
    delete dataToSave.id;
    
    // Convert date fields to Timestamps
    if (dataToSave.challanDate) {
      const dateValue = typeof dataToSave.challanDate === 'string' 
        ? new Date(dataToSave.challanDate) 
        : dataToSave.challanDate;
      dataToSave.challanDate = Timestamp.fromDate(dateValue);
    }
    if (dataToSave.date) {
      const dateValue = typeof dataToSave.date === 'string' 
        ? new Date(dataToSave.date) 
        : dataToSave.date;
      dataToSave.date = Timestamp.fromDate(dateValue);
    }
    
    const docRef = await addDoc(collection(db, 'challans'), {
      ...dataToSave,
      number: `CHAL-${Date.now()}`,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    READ_CACHE.delete('challans:all');
    READ_CACHE.delete('dashboard:snapshot');
    return docRef.id;
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'create challan'));
  }
}

export async function getChallans(): Promise<Challan[]> {
  try {
    return await cachedRead('challans:all', 15_000, async () => {
      return withRetry('load challans', async () => {
        const querySnapshot = await getDocs(
          query(collection(db, 'challans'), orderBy('createdAt', 'desc'))
        );
        return querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            challanDate: data.challanDate?.toDate ? data.challanDate.toDate() : (data.challanDate || new Date()),
            date: data.date?.toDate ? data.date.toDate() : (data.date || new Date()),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
            id: doc.id,
          } as any as Challan;
        });
      });
    });
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'load challans'));
  }
}

export async function getChallanById(id: string): Promise<Challan | null> {
  try {
    const docSnap = await withRetry('load challan', () => getDoc(doc(db, 'challans', id)));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        challanDate: data.challanDate?.toDate ? data.challanDate.toDate() : (data.challanDate || new Date()),
        date: data.date?.toDate ? data.date.toDate() : (data.date || new Date()),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
        id: docSnap.id,
      } as any as Challan;
    }
    return null;
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'load challan'));
  }
}

export async function updateChallan(id: string, data: Partial<Challan>): Promise<void> {
  try {
    const dataToUpdate: any = { ...data };
    
    // Remove id field if present
    delete dataToUpdate.id;
    
    // Convert date fields to Timestamps
    if (dataToUpdate.challanDate) {
      const dateValue = typeof dataToUpdate.challanDate === 'string' 
        ? new Date(dataToUpdate.challanDate) 
        : dataToUpdate.challanDate;
      dataToUpdate.challanDate = Timestamp.fromDate(dateValue);
    }
    if (dataToUpdate.date) {
      const dateValue = typeof dataToUpdate.date === 'string' 
        ? new Date(dataToUpdate.date) 
        : dataToUpdate.date;
      dataToUpdate.date = Timestamp.fromDate(dateValue);
    }
    if (dataToUpdate.createdAt) {
      const dateValue = typeof dataToUpdate.createdAt === 'string' 
        ? new Date(dataToUpdate.createdAt) 
        : dataToUpdate.createdAt;
      dataToUpdate.createdAt = Timestamp.fromDate(dateValue);
    }
    
    // Always update the updatedAt timestamp
    dataToUpdate.updatedAt = Timestamp.now();
    
    await withRetry('update challan', () => updateDoc(doc(db, 'challans', id), dataToUpdate));
    READ_CACHE.delete('challans:all');
    READ_CACHE.delete('dashboard:snapshot');
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'update challan'));
  }
}

export async function deleteChallan(id: string): Promise<void> {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid challan ID provided for deletion');
  }
  
  try {
    console.log('Deleting challan with ID:', id);
    await withRetry('delete challan', () => deleteDoc(doc(db, 'challans', id)));
    READ_CACHE.delete('challans:all');
    READ_CACHE.delete('dashboard:snapshot');
    console.log('Challan deleted successfully');
  } catch (error: any) {
    console.error('Firestore delete error:', error);
    throw new Error(getFirestoreErrorMessage(error, 'delete challan'));
  }
}

// Invoices
export async function addInvoice(data: Omit<Invoice, 'id' | 'number'>): Promise<string> {
  try {
    const dataToSave: any = { ...data };

    // Never persist a client-side id field; Firestore document id is the source of truth.
    delete dataToSave.id;
    
    // Convert date fields to Timestamps
    if (dataToSave.invoiceDate) {
      const dateValue = typeof dataToSave.invoiceDate === 'string' 
        ? new Date(dataToSave.invoiceDate) 
        : dataToSave.invoiceDate;
      dataToSave.invoiceDate = Timestamp.fromDate(dateValue);
    }
    if (dataToSave.challanDate) {
      const dateValue = typeof dataToSave.challanDate === 'string' 
        ? new Date(dataToSave.challanDate) 
        : dataToSave.challanDate;
      dataToSave.challanDate = Timestamp.fromDate(dateValue);
    }
    if (dataToSave.dueDate) {
      const dateValue = typeof dataToSave.dueDate === 'string' 
        ? new Date(dataToSave.dueDate) 
        : dataToSave.dueDate;
      dataToSave.dueDate = Timestamp.fromDate(dateValue);
    }
    if (dataToSave.date) {
      const dateValue = typeof dataToSave.date === 'string' 
        ? new Date(dataToSave.date) 
        : dataToSave.date;
      dataToSave.date = Timestamp.fromDate(dateValue);
    }
    
    const docRef = await addDoc(collection(db, 'invoices'), {
      ...dataToSave,
      number: `INV-${Date.now()}`,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    READ_CACHE.delete('invoices:all');
    READ_CACHE.delete('dashboard:snapshot');
    return docRef.id;
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'create invoice'));
  }
}

export async function getInvoices(): Promise<Invoice[]> {
  return await cachedRead('invoices:all', 15_000, async () => {
    return withRetry('load invoices', async () => {
      const querySnapshot = await getDocs(
        query(collection(db, 'invoices'), orderBy('createdAt', 'desc'))
      );
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          invoiceDate: data.invoiceDate?.toDate ? data.invoiceDate.toDate() : (data.invoiceDate || new Date()),
          challanDate: data.challanDate?.toDate ? data.challanDate.toDate() : (data.challanDate || new Date()),
          dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : (data.dueDate || new Date()),
          date: data.date?.toDate ? data.date.toDate() : (data.date || new Date()),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
          id: doc.id,
        } as any as Invoice;
      });
    });
  });
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const docSnap = await getDoc(doc(db, 'invoices', id));
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      ...data,
      invoiceDate: data.invoiceDate?.toDate ? data.invoiceDate.toDate() : (data.invoiceDate || new Date()),
      challanDate: data.challanDate?.toDate ? data.challanDate.toDate() : (data.challanDate || new Date()),
      dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : (data.dueDate || new Date()),
      date: data.date?.toDate ? data.date.toDate() : (data.date || new Date()),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
      id: docSnap.id,
    } as any as Invoice;
  }
  return null;
}

export async function updateInvoice(id: string, data: Partial<Invoice>): Promise<void> {
  try {
    const dataToUpdate: any = { ...data };
    
    // Remove id field if present
    delete dataToUpdate.id;
    
    // Convert date fields to Timestamps
    if (dataToUpdate.invoiceDate) {
      const dateValue = typeof dataToUpdate.invoiceDate === 'string' 
        ? new Date(dataToUpdate.invoiceDate) 
        : dataToUpdate.invoiceDate;
      dataToUpdate.invoiceDate = Timestamp.fromDate(dateValue);
    }
    if (dataToUpdate.challanDate) {
      const dateValue = typeof dataToUpdate.challanDate === 'string' 
        ? new Date(dataToUpdate.challanDate) 
        : dataToUpdate.challanDate;
      dataToUpdate.challanDate = Timestamp.fromDate(dateValue);
    }
    if (dataToUpdate.dueDate) {
      const dateValue = typeof dataToUpdate.dueDate === 'string' 
        ? new Date(dataToUpdate.dueDate) 
        : dataToUpdate.dueDate;
      dataToUpdate.dueDate = Timestamp.fromDate(dateValue);
    }
    if (dataToUpdate.date) {
      const dateValue = typeof dataToUpdate.date === 'string' 
        ? new Date(dataToUpdate.date) 
        : dataToUpdate.date;
      dataToUpdate.date = Timestamp.fromDate(dateValue);
    }
    if (dataToUpdate.createdAt) {
      const dateValue = typeof dataToUpdate.createdAt === 'string' 
        ? new Date(dataToUpdate.createdAt) 
        : dataToUpdate.createdAt;
      dataToUpdate.createdAt = Timestamp.fromDate(dateValue);
    }
    
    // Always update the updatedAt timestamp
    dataToUpdate.updatedAt = Timestamp.now();
    
    await withRetry('update invoice', () => updateDoc(doc(db, 'invoices', id), dataToUpdate));
    READ_CACHE.delete('invoices:all');
    READ_CACHE.delete('dashboard:snapshot');
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'update invoice'));
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Invalid invoice ID provided for deletion');
  }
  
  try {
    console.log('Deleting invoice with ID:', id);
    await withRetry('delete invoice', () => deleteDoc(doc(db, 'invoices', id)));
    READ_CACHE.delete('invoices:all');
    READ_CACHE.delete('dashboard:snapshot');
    console.log('Invoice deleted successfully');
  } catch (error: any) {
    console.error('Firestore delete error:', error);
    throw new Error(getFirestoreErrorMessage(error, 'delete invoice'));
  }
}

// Strip undefined values from an object (recursive) — Firestore rejects undefined
function sanitize(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (obj instanceof Date || (typeof obj === 'object' && obj?.constructor?.name === 'Timestamp')) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  const result: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) result[k] = sanitize(v);
  }
  return result;
}

// Templates
export async function addTemplate(data: Omit<Template, 'id'>): Promise<string> {
  try {
    const clean = sanitize(data);
    const docRef = await addDoc(collection(db, 'templates'), {
      ...clean,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    READ_CACHE.delete('templates:all');
    return docRef.id;
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'create template'));
  }
}

export async function getTemplatesByUser(userId: string): Promise<Template[]> {
  try {
    return withRetry('load templates', async () => {
      const querySnapshot = await getDocs(
        query(collection(db, 'templates'), where('userId', '==', userId))
      );
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Template[];
    });
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'load templates'));
  }
}

// Alias for getting all templates (same as getTemplatesByUser)
export async function getTemplates(): Promise<Template[]> {
  try {
    return await cachedRead('templates:all', 30_000, async () => {
      return withRetry('load templates', async () => {
        const querySnapshot = await getDocs(
          query(collection(db, 'templates'), orderBy('createdAt', 'desc'))
        );
        return querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Template[];
      });
    });
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'load templates'));
  }
}

export async function getTemplateById(id: string): Promise<Template | null> {
  try {
    const docSnap = await getDoc(doc(db, 'templates', id));
    if (!docSnap.exists()) return null;
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
    } as Template;
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'load template'));
  }
}

export async function updateTemplate(id: string, data: Partial<Template>): Promise<void> {
  try {
    // Strip id, createdAt, updatedAt — server handles timestamps
    const { id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = data as any;
    const clean = sanitize(rest);
    await withRetry('update template', () => updateDoc(doc(db, 'templates', id), {
      ...clean,
      updatedAt: Timestamp.now(),
    }));
    READ_CACHE.delete('templates:all');
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'update template'));
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  try {
    await withRetry('delete template', () => deleteDoc(doc(db, 'templates', id)));
    READ_CACHE.delete('templates:all');
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'delete template'));
  }
}

export type PageResult<T> = {
  items: T[];
  cursor: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
};

export async function getInvoicesPage(
  pageSize = 50,
  cursor?: QueryDocumentSnapshot<DocumentData> | null
): Promise<PageResult<Invoice>> {
  return withRetry('load invoices page', async () => {
    const base = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'), limit(pageSize));
    const q = cursor ? query(collection(db, 'invoices'), orderBy('createdAt', 'desc'), startAfter(cursor), limit(pageSize)) : base;

    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        ...data,
        invoiceDate: data.invoiceDate?.toDate ? data.invoiceDate.toDate() : (data.invoiceDate || new Date()),
        challanDate: data.challanDate?.toDate ? data.challanDate.toDate() : (data.challanDate || new Date()),
        dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : (data.dueDate || new Date()),
        date: data.date?.toDate ? data.date.toDate() : (data.date || new Date()),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
        id: docSnap.id,
      } as any as Invoice;
    });

    const nextCursor = querySnapshot.docs.length ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;
    return { items, cursor: nextCursor, hasMore: querySnapshot.docs.length === pageSize };
  });
}

export async function getChallansPage(
  pageSize = 50,
  cursor?: QueryDocumentSnapshot<DocumentData> | null
): Promise<PageResult<Challan>> {
  return withRetry('load challans page', async () => {
    const base = query(collection(db, 'challans'), orderBy('createdAt', 'desc'), limit(pageSize));
    const q = cursor ? query(collection(db, 'challans'), orderBy('createdAt', 'desc'), startAfter(cursor), limit(pageSize)) : base;

    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        ...data,
        challanDate: data.challanDate?.toDate ? data.challanDate.toDate() : (data.challanDate || new Date()),
        date: data.date?.toDate ? data.date.toDate() : (data.date || new Date()),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
        id: docSnap.id,
      } as any as Challan;
    });

    const nextCursor = querySnapshot.docs.length ? querySnapshot.docs[querySnapshot.docs.length - 1] : null;
    return { items, cursor: nextCursor, hasMore: querySnapshot.docs.length === pageSize };
  });
}

export type DashboardSnapshot = {
  counts: { customers: number; challans: number; invoices: number };
  totals: { sales: number; gst: number; meters: number };
  monthly: { sales: number; gst: number };
  recentInvoices: Invoice[];
  recentChallans: Challan[];
  customersById: Record<string, Customer>;
};

export async function getCustomersByIds(ids: string[]): Promise<Customer[]> {
  const unique = Array.from(new Set(ids.filter((x) => typeof x === 'string' && x.trim() !== '')));
  if (!unique.length) return [];

  return withRetry('load customers by ids', async () => {
    try {
      const batches = chunk(unique, 10);
      const snapshots = await Promise.all(
        batches.map((batch) =>
          getDocs(query(collection(db, 'customers'), where(documentId(), 'in', batch)))
        )
      );
      return snapshots
        .flatMap((s) => s.docs)
        .map((docSnap) => ({
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.() || new Date(),
          id: docSnap.id,
        })) as Customer[];
    } catch {
      // Fallback if `in` query isn't available for some reason.
      const snaps = await Promise.all(unique.map((id) => getDoc(doc(db, 'customers', id))));
      return snaps
        .filter((s) => s.exists())
        .map((s) => ({
          ...s.data(),
          createdAt: s.data().createdAt?.toDate?.() || new Date(),
          id: s.id,
        })) as Customer[];
    }
  });
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  return cachedRead('dashboard:snapshot', 10_000, async () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthStartTs = Timestamp.fromDate(monthStart);
    const nextMonthStartTs = Timestamp.fromDate(nextMonthStart);

    const customersCol = collection(db, 'customers');
    const challansCol = collection(db, 'challans');
    const invoicesCol = collection(db, 'invoices');

    const [customersCount, challansCount, invoicesCount] = await Promise.all([
      withRetry('count customers', async () => (await getCountFromServer(query(customersCol))).data().count),
      withRetry('count challans', async () => (await getCountFromServer(query(challansCol))).data().count),
      withRetry('count invoices', async () => (await getCountFromServer(query(invoicesCol))).data().count),
    ]);

    // Aggregate totals (best effort; falls back gracefully if some fields are missing)
    const [totalsAgg, monthlyAgg] = await Promise.all([
      withRetry('aggregate totals', async () => {
        const snap = await getAggregateFromServer(query(invoicesCol), {
          sales: sum('grandTotal'),
          cgst: sum('cgstAmount'),
          sgst: sum('sgstAmount'),
          igst: sum('igstAmount'),
        });
        return snap.data() as any;
      }).catch(() => ({ sales: 0, cgst: 0, sgst: 0, igst: 0 })),
      withRetry('aggregate monthly', async () => {
        const monthQuery = query(
          invoicesCol,
          where('createdAt', '>=', monthStartTs),
          where('createdAt', '<', nextMonthStartTs)
        );
        const snap = await getAggregateFromServer(monthQuery, {
          sales: sum('grandTotal'),
          cgst: sum('cgstAmount'),
          sgst: sum('sgstAmount'),
          igst: sum('igstAmount'),
        });
        return snap.data() as any;
      }).catch(() => ({ sales: 0, cgst: 0, sgst: 0, igst: 0 })),
    ]);

    const metersAgg = await withRetry('aggregate meters', async () => {
      const snap = await getAggregateFromServer(query(challansCol), { meters: sum('totalMeters') });
      return (snap.data() as any).meters ?? 0;
    }).catch(() => 0);

    const [recentInvoicesSnap, recentChallansSnap] = await Promise.all([
      withRetry('load recent invoices', () =>
        getDocs(query(invoicesCol, orderBy('createdAt', 'desc'), limit(5)))
      ),
      withRetry('load recent challans', () =>
        getDocs(query(challansCol, orderBy('createdAt', 'desc'), limit(5)))
      ),
    ]);

    const recentInvoices = recentInvoicesSnap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        ...data,
        invoiceDate: data.invoiceDate?.toDate ? data.invoiceDate.toDate() : (data.invoiceDate || new Date()),
        challanDate: data.challanDate?.toDate ? data.challanDate.toDate() : (data.challanDate || new Date()),
        dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : (data.dueDate || new Date()),
        date: data.date?.toDate ? data.date.toDate() : (data.date || new Date()),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
        id: docSnap.id,
      } as any as Invoice;
    });

    const recentChallans = recentChallansSnap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        ...data,
        challanDate: data.challanDate?.toDate ? data.challanDate.toDate() : (data.challanDate || new Date()),
        date: data.date?.toDate ? data.date.toDate() : (data.date || new Date()),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt || new Date()),
        id: docSnap.id,
      } as any as Challan;
    });

    const recentCustomerIds = [
      ...recentInvoices.map((i: any) => i.customerId).filter(Boolean),
      ...recentChallans.map((c: any) => c.customerId).filter(Boolean),
    ];

    const customers = await getCustomersByIds(recentCustomerIds);
    const customersById = Object.fromEntries(customers.map((c) => [c.id, c]));

    const totalSales = Number(totalsAgg.sales ?? 0) || 0;
    const totalGST = Number(totalsAgg.cgst ?? 0) + Number(totalsAgg.sgst ?? 0) + Number(totalsAgg.igst ?? 0);
    const monthlySales = Number(monthlyAgg.sales ?? 0) || 0;
    const monthlyGST = Number(monthlyAgg.cgst ?? 0) + Number(monthlyAgg.sgst ?? 0) + Number(monthlyAgg.igst ?? 0);

    return {
      counts: { customers: customersCount, challans: challansCount, invoices: invoicesCount },
      totals: { sales: totalSales, gst: totalGST, meters: Number(metersAgg ?? 0) || 0 },
      monthly: { sales: monthlySales, gst: monthlyGST },
      recentInvoices,
      recentChallans,
      customersById,
    };
  });
}

// Aliases for backward compatibility with component imports
export const createChallan = addChallan;
export const getChallan = getChallanById;

export const createInvoice = addInvoice;
export const getInvoice = getInvoiceById;

export const getBroker = getBrokerById;
export const getCustomer = getCustomerById;

export const createTemplate = addTemplate;
export const getTemplate = getTemplateById;

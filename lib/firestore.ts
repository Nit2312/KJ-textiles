import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  Query,
  DocumentData,
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

// Customers
export async function addCustomer(data: Omit<Customer, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'customers'), {
      ...data,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'add customer'));
  }
}

export async function getCustomers(): Promise<Customer[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'customers'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      id: doc.id,
    })) as Customer[];
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'load customers'));
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    const docSnap = await getDoc(doc(db, 'customers', id));
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
    await updateDoc(doc(db, 'customers', id), data);
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'update customer'));
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'customers', id));
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
    return docRef.id;
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'add broker'));
  }
}

export async function getBrokers(): Promise<Broker[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'brokers'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      id: doc.id,
    })) as Broker[];
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'load brokers'));
  }
}

export async function getBrokerById(id: string): Promise<Broker | null> {
  try {
    const docSnap = await getDoc(doc(db, 'brokers', id));
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
    await updateDoc(doc(db, 'brokers', id), data);
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'update broker'));
  }
}

export async function deleteBroker(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'brokers', id));
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
    return docRef.id;
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'add fabric quality'));
  }
}

export async function getFabricQualities(): Promise<FabricQuality[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'fabricQualities'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      id: doc.id,
    })) as FabricQuality[];
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'load fabric qualities'));
  }
}

export async function updateFabricQuality(id: string, data: Partial<FabricQuality>): Promise<void> {
  try {
    await updateDoc(doc(db, 'fabricQualities', id), data);
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'update fabric quality'));
  }
}

export async function deleteFabricQuality(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'fabricQualities', id));
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
    return docRef.id;
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'create challan'));
  }
}

export async function getChallans(): Promise<Challan[]> {
  try {
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
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'load challans'));
  }
}

export async function getChallanById(id: string): Promise<Challan | null> {
  try {
    const docSnap = await getDoc(doc(db, 'challans', id));
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
    
    await updateDoc(doc(db, 'challans', id), dataToUpdate);
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
    await deleteDoc(doc(db, 'challans', id));
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
    return docRef.id;
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'create invoice'));
  }
}

export async function getInvoices(): Promise<Invoice[]> {
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
    
    await updateDoc(doc(db, 'invoices', id), dataToUpdate);
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
    await deleteDoc(doc(db, 'invoices', id));
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
    return docRef.id;
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'create template'));
  }
}

export async function getTemplatesByUser(userId: string): Promise<Template[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'templates'), where('userId', '==', userId))
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Template[];
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'load templates'));
  }
}

// Alias for getting all templates (same as getTemplatesByUser)
export async function getTemplates(): Promise<Template[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'templates'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Template[];
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
    await updateDoc(doc(db, 'templates', id), {
      ...clean,
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'update template'));
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'templates', id));
  } catch (error: any) {
    throw new Error(getFirestoreErrorMessage(error, 'delete template'));
  }
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

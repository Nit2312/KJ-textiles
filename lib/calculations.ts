// GST Calculations
export function calculateGST(amount: number, gstRate: number = 18) {
  return (amount * gstRate) / 100;
}

export function calculateCGST(amount: number) {
  return calculateGST(amount, 9); // CGST is 9%
}

export function calculateSGST(amount: number) {
  return calculateGST(amount, 9); // SGST is 9%
}

export function calculateIGST(amount: number) {
  return calculateGST(amount, 18); // IGST is 18%
}

export function roundOff(amount: number) {
  return Math.round(amount);
}

export function numberToWords(num: number): string {
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
  ];
  const teens = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];
  const scales = [
    '',
    'Thousand',
    'Lakh',
    'Crore',
  ];

  if (num === 0) return 'Zero';

  function convertBelow1000(n: number): string {
    if (n === 0) {
      return '';
    } else if (n < 10) {
      return ones[n];
    } else if (n < 20) {
      return teens[n - 10];
    } else if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    } else {
      return (
        ones[Math.floor(n / 100)] +
        ' Hundred' +
        (n % 100 !== 0 ? ' ' + convertBelow1000(n % 100) : '')
      );
    }
  }

  let result = '';
  let scaleIndex = 0;
  let isNegative = false;

  if (num < 0) {
    isNegative = true;
    num = Math.abs(num);
  }

  while (num > 0) {
    if (num % 1000 !== 0) {
      result =
        convertBelow1000(num % 1000) +
        (scales[scaleIndex] ? ' ' + scales[scaleIndex] : '') +
        (result ? ' ' + result : '');
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  return (isNegative ? 'Minus ' : '') + result.trim() + ' Rupees';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// Item calculation types
interface Item {
  quantity: number;
  rate: number;
  gst: number;
}

interface TotalsResult {
  subtotal: number;
  gstTotal: number;
  total: number;
}

// Calculate challan totals
export function calculateChallanTotals(items: Item[]): TotalsResult {
  if (!items || items.length === 0) {
    return { subtotal: 0, gstTotal: 0, total: 0 };
  }

  let subtotal = 0;
  let gstTotal = 0;

  items.forEach((item) => {
    if (item.quantity && item.rate) {
      const itemSubtotal = item.quantity * item.rate;
      const itemGST = itemSubtotal * (item.gst || 0) / 100;
      
      subtotal += itemSubtotal;
      gstTotal += itemGST;
    }
  });

  return {
    subtotal: roundOff(subtotal),
    gstTotal: roundOff(gstTotal),
    total: roundOff(subtotal + gstTotal),
  };
}

// Calculate invoice totals
export function calculateInvoiceTotals(
  items: Item[],
  discountPercent: number = 0,
  additionalCharges: number = 0
): TotalsResult & { discount: number; additionalCharges: number; finalTotal: number } {
  if (!items || items.length === 0) {
    return { 
      subtotal: 0, 
      gstTotal: 0, 
      total: 0,
      discount: 0,
      additionalCharges: 0,
      finalTotal: 0,
    };
  }

  let subtotal = 0;
  let gstTotal = 0;

  items.forEach((item) => {
    if (item.quantity && item.rate) {
      const itemSubtotal = item.quantity * item.rate;
      const itemGST = itemSubtotal * (item.gst || 0) / 100;
      
      subtotal += itemSubtotal;
      gstTotal += itemGST;
    }
  });

  const total = subtotal + gstTotal;
  const discount = roundOff(total * (discountPercent / 100));
  const afterDiscount = total - discount;
  const finalTotal = roundOff(afterDiscount + (additionalCharges || 0));

  return {
    subtotal: roundOff(subtotal),
    gstTotal: roundOff(gstTotal),
    total: roundOff(total),
    discount: discount,
    additionalCharges: additionalCharges,
    finalTotal: finalTotal,
  };
}

# KJ Textile ERP System

A comprehensive Enterprise Resource Planning (ERP) system built for textile businesses, featuring complete management of customers, brokers, challans, invoices, and reporting capabilities with PDF export functionality.

## Features

### Core Modules

1. **Authentication**
   - Firebase-based email/password authentication
   - Secure user session management
   - Protected routes and role-based access control

2. **Customer Management**
   - Add, edit, and delete customer records
   - Store customer details including GST numbers
   - Track customer communication history

3. **Broker Management**
   - Maintain broker information and commission percentages
   - Track broker performance
   - Commission calculations for transactions

4. **Challan System**
   - Create delivery challans with detailed item listings
   - Multi-item support with quantities, rates, and GST calculations
   - Automatic calculations for totals and GST amounts
   - PDF and Excel export functionality

5. **Invoice System**
   - Generate professional tax invoices
   - Line-item based invoicing with GST compliance
   - Support for discounts and additional charges
   - Broker integration with commission tracking
   - Invoice status management (draft, approved, etc.)

6. **Reports & Analytics**
   - Sales reports and summaries
   - GST breakdowns and calculations
   - Customer and broker performance metrics
   - Excel export for all reports
   - Real-time dashboard with key metrics

7. **Template Designer**
   - Visual template editor for custom challans and invoices
   - Drag-and-drop element placement
   - Support for text, lines, and shapes
   - Save and manage multiple templates

### Technical Features

- **PDF Generation**: Server-side PDF generation using jsPDF for consistent formatting
- **Excel Export**: Comprehensive Excel report generation using xlsx library
- **Real-time Calculations**: Automatic GST, discount, and total calculations
- **Firestore Integration**: Cloud-based data persistence with real-time updates
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Component-Based Architecture**: Modular, reusable components built with React

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Firebase Cloud Functions
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **UI Components**: shadcn/ui
- **PDF Generation**: jsPDF
- **Excel Export**: xlsx (SheetJS)
- **Icons**: Lucide React

## Installation

### Prerequisites

- Node.js 18+ and pnpm
- Firebase project with Firestore and Authentication enabled
- Firebase config credentials

### Setup Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd kj-textile-erp
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env.local` file in the root directory with your Firebase credentials:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Set Up Firebase**
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Firestore Database
   - Enable Email/Password Authentication
   - Create a web app and copy the configuration

5. **Run Development Server**
   ```bash
   pnpm dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser

## Firestore Collections Structure

### Users Collection
```
users/{uid}
  - email: string
  - displayName: string
  - role: string
  - createdAt: timestamp
```

### Customers Collection
```
customers/{id}
  - name: string
  - address: string
  - city: string
  - phone: string
  - email: string
  - gstNumber: string
  - createdAt: timestamp
  - updatedAt: timestamp
```

### Brokers Collection
```
brokers/{id}
  - name: string
  - phone: string
  - email: string
  - commissionPercentage: number
  - address: string
  - createdAt: timestamp
  - updatedAt: timestamp
```

### Challans Collection
```
challans/{id}
  - challanNumber: string
  - challanDate: string
  - customerId: string
  - items: array
    - qualityId: string
    - quantity: number
    - rate: number
    - gst: number
  - remarks: string
  - brokerCommission: number
  - createdAt: timestamp
  - updatedAt: timestamp
```

### Invoices Collection
```
invoices/{id}
  - invoiceNumber: string
  - invoiceDate: string
  - dueDate: string
  - customerId: string
  - brokerId: string (optional)
  - items: array
    - qualityId: string
    - quantity: number
    - rate: number
    - gst: number
  - discountPercent: number
  - additionalCharges: number
  - remarks: string
  - status: string (draft, approved, paid)
  - createdAt: timestamp
  - updatedAt: timestamp
```

### Fabric Qualities Collection
```
fabric_qualities/{id}
  - name: string
  - description: string
  - createdAt: timestamp
  - updatedAt: timestamp
```

### Templates Collection
```
templates/{id}
  - name: string
  - type: string (challan, invoice)
  - elements: array
    - id: string
    - type: string (text, line, rectangle)
    - x: number
    - y: number
    - width: number
    - height: number
    - content: string (for text)
    - fontSize: number
  - createdAt: timestamp
  - updatedAt: timestamp
```

## Usage Guide

### Creating a Challan

1. Navigate to **Challans** > **Create New Challan**
2. Select a customer and enter challan number
3. Add items with fabric quality, quantity, rate, and GST percentage
4. System automatically calculates totals
5. Save or export as PDF/Excel

### Creating an Invoice

1. Navigate to **Invoices** > **Create New Invoice**
2. Select customer and optional broker
3. Add line items with quantities and rates
4. Apply discounts or additional charges if needed
5. System calculates GST and final amount
6. Save with status (draft/approved)
7. Export as PDF or Excel

### Generating Reports

1. Navigate to **Reports**
2. View summary statistics and metrics
3. Click export buttons to download detailed reports in Excel format
4. Choose from Invoices, Challans, or Combined reports

### Managing Templates

1. Navigate to **Templates** section
2. Create new template or edit existing ones
3. Use the visual designer to add and position elements
4. Save template for future use

## API Routes

The application provides the following API routes for Firestore operations:

- `POST /api/customers` - Create customer
- `GET /api/customers` - Get all customers
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

Similar routes exist for brokers, challans, invoices, and templates.

## Project Structure

```
├── app/
│   ├── (dashboard)/          # Main dashboard layout
│   │   ├── customers/        # Customer management
│   │   ├── brokers/          # Broker management
│   │   ├── challans/         # Challan creation & management
│   │   ├── invoices/         # Invoice creation & management
│   │   ├── reports/          # Reports & analytics
│   │   ├── templates/        # Template designer
│   │   ├── settings/         # Application settings
│   │   └── dashboard/        # Main dashboard
│   ├── login/                # Authentication pages
│   └── layout.tsx            # Root layout with providers
├── components/
│   ├── auth/                 # Auth-related components
│   ├── customers/            # Customer components
│   ├── brokers/              # Broker components
│   ├── challans/             # Challan components
│   ├── invoices/             # Invoice components
│   ├── template-designer/    # Template editor
│   ├── shared/               # Shared components (navbar, sidebar)
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── firebase.ts           # Firebase configuration
│   ├── firestore.ts          # Firestore CRUD operations
│   ├── auth.ts               # Authentication utilities
│   ├── calculations.ts       # Business logic & calculations
│   ├── pdf-generator.ts      # PDF generation utilities
│   ├── excel-generator.ts    # Excel export utilities
│   └── utils.ts              # General utilities
├── types/
│   └── index.ts              # TypeScript type definitions
├── contexts/
│   └── auth-context.tsx      # Auth context provider
└── public/                   # Static assets
```

## Key Calculations

### GST Calculation
```
Item Total = Quantity × Rate × (1 + GST%)
```

### Invoice Total
```
Subtotal = Sum of all line item base amounts
GST Total = Sum of all GST amounts
Discount = Subtotal × Discount%
Total = Subtotal + GST Total - Discount + Additional Charges
```

## Security Considerations

1. **Authentication**: Firebase handles user authentication securely
2. **Firestore Security Rules**: Implement RLS policies (as needed)
3. **Data Validation**: All inputs are validated on both client and server
4. **API Routes**: Protected with authentication checks
5. **Environment Variables**: Sensitive data stored in .env.local (never committed)

## Deployment

### Deploy to Vercel

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on every push

```bash
# Or deploy manually
vercel deploy
```

## Future Enhancements

- Payment integration (Razorpay, Stripe)
- Email notifications for invoices
- Advanced reporting with charts and analytics
- Multi-currency support
- Inventory management
- Stock tracking
- Customer portal for invoice viewing
- Mobile app

## Troubleshooting

### Firebase Connection Issues
- Verify all environment variables are set correctly
- Check Firebase project settings
- Ensure Firestore is enabled in Firebase console

### PDF Generation Errors
- Ensure jsPDF library is properly installed
- Check browser console for specific errors
- Verify data is properly formatted before PDF generation

### Excel Export Not Working
- Confirm xlsx library is installed
- Check file permissions for downloads
- Try a different browser if issues persist

## Support & Contributing

For issues or feature requests, please create an issue in the repository. Contributions are welcome via pull requests.

## License

This project is proprietary software for KJ Textiles.

---

Built with Next.js, Firebase, and Tailwind CSS
# KJ-textiles

# Hostel & Mess Management System (হস্টেল ও মেস ম্যানেজমেন্ট সিস্টেম)
## Architectural Implementation Plan & Roadmap

**Client / Company**: Aulad IT Solution  
**Architecture**: Single-Tenant Full-Stack Web Application  
**Primary Language**: বাংলা (Bengali - Bangladesh)  
**Primary Currency & Timezone**: BDT (৳), Asia/Dhaka  
**Core Technologies**: Next.js (App Router), TypeScript, Tailwind CSS, Hind Siliguri, Lucide React, Recharts, React Hook Form, Zod, MongoDB Atlas (Mongoose), Firebase Auth (Client & Admin SDK), Cloudinary.

---

### 1. Architectural Overview & Single-Tenant Strategy

Each client gets an independent deployment instance:
- **Independent Database**: Dedicated MongoDB Atlas cluster/database.
- **Independent Authentication**: Dedicated Firebase Project (Web API Key, Project ID, Admin Service Account).
- **Independent Storage**: Dedicated Cloudinary cloud name and signed upload preset.
- **Configurable Mode**:
  - `HOSTEL_ONLY`: Room/seat allocation, rent, utilities, resident management, staff, expenses.
  - `MESS_ONLY`: Room allocation, daily meals, daily bazar, meal rate calculation, meal deposits, monthly meal settlement.
  - `COMBINED`: Complete hostel room rent + mess meal management together.
- **Client Branding**: Hostel/Mess name, logo, address, contact numbers, seal, invoice prefixes managed through the Settings module.

---

### 2. Database Schema (Mongoose Models)

All financial figures stored as integer poisha (৳1.00 = 100 poisha) or strict double precision with validated rounding to avoid floating-point errors.

1. **`User`**: Firebase UID, Email, Phone, Role (`OWNER`, `HOSTEL_MANAGER`, `ACCOUNTANT`, `MEAL_MANAGER`, `STAFF`, `RESIDENT`), Status (`ACTIVE`, `INACTIVE`), linked Resident/Staff ID.
2. **`Settings`**: Hostel name (বাংলা/English), Logo URL, Address, Contact, Currency (`BDT`), Active Mode (`HOSTEL_ONLY`, `MESS_ONLY`, `COMBINED`), Meal Cutoff Times, Meal Weights (Breakfast: 0.5, Lunch: 1.0, Dinner: 1.0), Rent due day, Late fee rules, Invoice prefixes.
3. **`Building`**: Name/Number, Address, Total floors, Description, Status.
4. **`Floor`**: Building ID, Floor number/name.
5. **`Room`**: Building ID, Floor ID, Room number, Room type (AC, Non-AC, Attached Bath, etc.), Base rent.
6. **`Seat`**: Room ID, Seat number/code, Monthly rent, Status (`AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE`), Current Resident ID.
7. **`SeatAllocation`**: Resident ID, Seat ID, Room ID, Allocation Date, Vacate Date, Agreed Rent, Security Deposit, Status (`ACTIVE`, `TRANSFERRED`, `VACATED`).
8. **`Resident`**: Unique Resident ID (e.g. `HST-2026-001`), Full Name (বাংলা), Profile Photo, NID/Birth Certificate/Student ID, Phone, Email, Permanent Address, Present Address, Guardian Name & Phone, Emergency Contact, Institution/Occupation, Admission Date, Status (`ACTIVE`, `ON_LEAVE`, `CHECKED_OUT`), Linked User ID.
9. **`RentInvoice`**: Invoice Number (`INV-YYYYMM-XXXX`), Resident ID, Month/Year, Room Rent, Utility Charges, Service Charges, Late Fee, Discount, Total Payable, Paid Amount, Due Amount, Payment Status (`UNPAID`, `PARTIAL`, `PAID`), Due Date.
10. **`Payment`**: Receipt Number (`RCT-XXXXXX`), Invoice ID (or Meal Deposit), Resident ID, Amount (Poisha), Payment Method (`CASH`, `BKASH`, `NAGAD`, `BANK_TRANSFER`), Transaction ID, Collected By, Payment Date, Remarks.
11. **`MealEntry`**: Resident ID, Date (YYYY-MM-DD), Breakfast (count/weight), Lunch (count/weight), Dinner (count/weight), Guest Breakfast, Guest Lunch, Guest Dinner, Total Units, Status (`ORDERED`, `CANCELLED_BY_RESIDENT`, `APPROVED_BY_MANAGER`), ModifiedBy.
12. **`BazarPurchase`**: Date, Items list `[{ name, quantity, unit, unitPrice, totalCost }]`, Total Amount, Buyer ID (Staff/Resident), Voucher Image URL, Category (`GROCERY`, `VEGETABLE`, `FISH_MEAT`, `GAS_OIL`, `OTHER`), Approved By, Notes.
13. **`MonthlyMealSettlement`**: Month/Year, Total Eligible Bazar Cost, Total Eligible Meal Units, Calculated Meal Rate (৳/unit), Resident breakdown `[{ residentId, totalUnits, mealBill, depositsTotal, balanceDueOrRefund }]`, Status (`DRAFT`, `LOCKED`), FinalizedAt, FinalizedBy.
14. **`Expense`**: Voucher Number, Category (`UTILITY`, `SALARY`, `MAINTENANCE`, `BAZAR`, `RENT_EXPENSE`, `OTHER`), Amount, Date, Payee, Paid From (`CASH`, `BANK`), Receipt Image URL, Recorded By.
15. **`Staff`**: Name, Role/Designation, Phone, NID, Salary, Joining Date, Status, Responsibilities.
16. **`StaffSalary`**: Staff ID, Month/Year, Base Salary, Bonus, Deductions, Net Payable, Paid Amount, Payment Date, Payment Method.
17. **`LeaveRequest`**: Resident ID, Departure Date, Return Date, Actual Return Date, Reason, Emergency Contact, Status (`PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`), Approved By.
18. **`VisitorRecord`**: Visitor Name, Phone, Resident ID, Purpose, Check-in Time, Check-out Time, Identity Proof, Staff In Charge.
19. **`Complaint`**: Ticket ID, Resident ID, Category (`ROOM`, `WATER`, `ELECTRICITY`, `CLEANING`, `FOOD`, `SECURITY`, `OTHER`), Title, Description, Image URLs, Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), Status (`SUBMITTED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), Assigned To, Resolution Notes.
20. **`Notification`**: Target User ID / Role, Title, Message (বাংলা), Link, Read Status, Created At.
21. **`AuditLog`**: Action, Entity, Entity ID, Performed By (User ID & Role), Timestamp, IP/Agent, Changes Diff.

---

### 3. Step-by-Step Implementation Roadmap

- **Phase 1: Project Initialization & Foundation**
  - Initialize Next.js project with App Router, TypeScript, Tailwind CSS.
  - Setup Google Fonts (`Hind Siliguri`), custom Bengali typography styles, color palette (Navy Blue `#0f172a` / `#1e3a8a`, White, Emerald Green `#059669`).
  - Install dependencies (`mongoose`, `firebase`, `firebase-admin`, `cloudinary`, `lucide-react`, `recharts`, `react-hook-form`, `@hookform/resolvers`, `zod`, `@tanstack/react-table`, `jspdf`, `jspdf-autotable`, `xlsx`).
  - Setup MongoDB connection with connection caching.
  - Setup Firebase Client SDK and Firebase Admin SDK helper with secure cookie/session verification.
  - Setup Cloudinary signed upload endpoint and client upload helper.
  - Setup Bengali number & currency formatter utilities (`formatBengaliCurrency`, `toBengaliNumber`, `formatBengaliDate`).

- **Phase 2: Database Schema & Authentication System**
  - Implement Mongoose models with validation & indexes.
  - Setup RBAC (Role-Based Access Control) middleware & server-side authorization helpers (`requireAuth`, `requireRole`).
  - Implement Secure Bootstrap Script/API for initial Owner account.
  - Implement Login page with Google Authentication & Firebase Session Cookie.
  - Implement Role-based routing & dashboard redirector.

- **Phase 3: Core UI Framework & Responsive Bengali Design System**
  - Responsive Dashboard Layout with collapsible sidebar, top navigation with user profile & notifications, mobile bottom bar.
  - Dashboard stats widgets, visual charts (Recharts), Bengali data tables with search, filter, pagination, mobile card views.
  - Toast notifications, modal confirmation dialogs, skeleton loaders, and empty states.

- **Phase 4: Building, Room & Seat Allocation Engine**
  - Building & Floor CRUD.
  - Room management with type, floor selection, base rent.
  - Seat management: visual grid of seats per room with live status badges (ফাঁকা, বরাদ্দকৃত, সংরক্ষিত, মেরামত).
  - Allocation & Transfer engine: Prevent double allocation, historical records.

- **Phase 5: Resident Management & Admission System**
  - Comprehensive admission form with personal, guardian, academic/job info.
  - Photo upload via Cloudinary.
  - Resident profile view, printable Admission Form, printable Resident ID Card.
  - Temporary leave, room transfer, and checkout workflows.

- **Phase 6: Rent & Invoicing System (Hostel Mode)**
  - Automated monthly invoice generation engine (prevents duplicates).
  - Manual payment collection (Cash, bKash, Nagad, Bank transfer) with integer poisha safety.
  - Printable Money Receipt (টাকা জমার রশিদ) and PDF Rent Invoice.
  - Dues tracking & payment history.

- **Phase 7: Mess & Meal Management Engine (Mess Mode)**
  - Daily meal activation/cancellation calendar with strict cutoff enforcement.
  - Meal weights (সকালের নাস্তা, দুপুরের খাবার, রাতের খাবার) and guest meals.
  - Daily meal tally & manager approval.
  - Daily Bazar entry with grocery items, receipts, and category classification.
  - Monthly Meal Rate Settlement Engine:
    $$\text{Meal Rate} = \frac{\text{Total Eligible Bazar & Mess Expenses}}{\text{Total Consumed Meal Units}}$$
    $$\text{Resident Meal Charge} = \text{Resident Meal Units} \times \text{Meal Rate}$$
  - Advance meal deposit management and monthly settlement lock.

- **Phase 8: Financial Management & Accounting**
  - Cash & Bank book.
  - Expense tracker (Utility, Salary, Groceries, Maintenance).
  - Profit & Loss statement with strict separation between rent revenue, meal deposits, and operational costs.

- **Phase 9: Staff, Leave, Visitor & Complaint Management**
  - Staff profiles, payroll generation, and salary payment records.
  - Resident Leave request & approval workflow.
  - Security Visitor log book.
  - Complaint ticketing system with photo attachments and status updates.

- **Phase 10: Resident Portal**
  - Dedicated self-service portal for residents: My Room/Seat, Invoices & Due Payments, Daily Meal Calendar & Switcher, Bazar & Meal Rate summaries, Leave Requests, Submit Complaints, Notice Board.

- **Phase 11: Reports, Analytics & Settings**
  - Filterable reports with PDF & Excel/CSV download (Occupancy, Rent Dues, Monthly Meal Rate, Bazar Expenses, Financial Statement).
  - Comprehensive Settings: Hostel branding, Active Mode switcher (`HOSTEL`, `MESS`, `COMBINED`), meal cutoff times, billing defaults, audit logs.

- **Phase 12: Automated Tests, Quality Assurance & Build Verification**
  - Unit tests for seat allocation collision prevention, poisha rent math, and meal rate calculation formulas.
  - Integration tests for authentication and API protection.
  - Run TypeScript compile check and production build (`next build`).

- **Phase 13: Client Handover & Deployment Documentation**
  - `.env.example` with comprehensive explanations.
  - `README.md`, `DEPLOYMENT.md`, `USER_GUIDE_BN.md`, and `CLIENT_HANDOVER.md`.

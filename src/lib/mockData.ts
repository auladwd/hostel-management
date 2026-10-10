/**
 * Comprehensive Mock Data for Demo Mode (NEXT_PUBLIC_DEMO_MODE=true)
 * Represents realistic Bengali hostel and mess management data.
 */

export const mockSettings = {
  hostelName: 'গ্রিন ভিউ বয়েজ হোস্টেল ও মেস',
  hostelNameEn: 'Green View Boys Hostel & Mess',
  tagline: 'একটি সুশৃঙ্খল, নিরাপদ ও পারিবারিক পরিবেশ',
  address: 'বাড়ি নং ১২, রোড নং ৫, ধানমন্ডি, ঢাকা-১২০৫',
  phone: '+৮৮০১৭৮৭৬৫৪৩২১',
  email: 'info@greenviewhostel.bd',
  activeMode: 'COMBINED',
  currency: 'BDT',
  currencySymbol: '৳',
  rentDueDay: 5,
  lateFeePoisha: 10000,
  securityDepositPoisha: 300000,
  mealCutoffBreakfast: '22:00',
  mealCutoffLunch: '09:00',
  mealCutoffDinner: '16:00',
  mealWeights: { breakfast: 0.5, lunch: 1.0, dinner: 1.0 },
};

export const mockBuildings = [
  {
    _id: 'bld-001',
    name: 'প্রধান ভবন (নিলয়)',
    code: 'BLD-A',
    totalFloors: 4,
    address: 'ধানমন্ডি ৫/এ, ঢাকা',
    caretakerName: 'রফিকুল ইসলাম',
    caretakerPhone: '০১৭০০০০০০০১',
    status: 'ACTIVE',
    roomsCount: 8,
    seatsCount: 24,
    occupiedSeatsCount: 20,
  },
  {
    _id: 'bld-002',
    name: 'দক্ষিণ ব্লক (বসুন্ধরা শাখা)',
    code: 'BLD-B',
    totalFloors: 3,
    address: 'ধানমন্ডি ৬/বি, ঢাকা',
    caretakerName: 'আব্দুল করিম',
    caretakerPhone: '০১৮১০০০০০২২',
    status: 'ACTIVE',
    roomsCount: 6,
    seatsCount: 18,
    occupiedSeatsCount: 14,
  },
];

export const mockRooms = [
  {
    _id: 'room-101',
    buildingId: 'bld-001',
    buildingName: 'প্রধান ভবন (নিলয়)',
    roomNumber: '১০১',
    floorNumber: 1,
    roomType: 'DOUBLE',
    capacity: 2,
    hasAttachedBath: true,
    hasBalcony: true,
    hasAirConditioner: false,
    baseRentPoisha: 400000,
    status: 'ACTIVE',
    occupiedCount: 2,
  },
  {
    _id: 'room-102',
    buildingId: 'bld-001',
    buildingName: 'প্রধান ভবন (নিলয়)',
    roomNumber: '১০২',
    floorNumber: 1,
    roomType: 'TRIPLE',
    capacity: 3,
    hasAttachedBath: false,
    hasBalcony: false,
    hasAirConditioner: false,
    baseRentPoisha: 320000,
    status: 'ACTIVE',
    occupiedCount: 2,
  },
  {
    _id: 'room-201',
    buildingId: 'bld-001',
    buildingName: 'প্রধান ভবন (নিলয়)',
    roomNumber: '২০১',
    floorNumber: 2,
    roomType: 'DOUBLE',
    capacity: 2,
    hasAttachedBath: true,
    hasBalcony: true,
    hasAirConditioner: true,
    baseRentPoisha: 550000,
    status: 'ACTIVE',
    occupiedCount: 1,
  },
];

export const mockSeats = [
  {
    _id: 'seat-101a',
    buildingId: 'bld-001',
    roomId: 'room-101',
    seatNumber: '১০১-A',
    monthlyRentPoisha: 400000,
    status: 'OCCUPIED',
    currentResidentName: 'তানভীর আহমেদ',
    currentResidentId: 'res-001',
  },
  {
    _id: 'seat-101b',
    buildingId: 'bld-001',
    roomId: 'room-101',
    seatNumber: '১০১-B',
    monthlyRentPoisha: 400000,
    status: 'OCCUPIED',
    currentResidentName: 'মাহমুদুল হাসান',
    currentResidentId: 'res-003',
  },
  {
    _id: 'seat-102a',
    buildingId: 'bld-001',
    roomId: 'room-102',
    seatNumber: '১০২-A',
    monthlyRentPoisha: 320000,
    status: 'OCCUPIED',
    currentResidentName: 'সাকিব আল হাসান',
    currentResidentId: 'res-002',
  },
  {
    _id: 'seat-102b',
    buildingId: 'bld-001',
    roomId: 'room-102',
    seatNumber: '১০২-B',
    monthlyRentPoisha: 320000,
    status: 'AVAILABLE',
  },
  {
    _id: 'seat-201a',
    buildingId: 'bld-001',
    roomId: 'room-201',
    seatNumber: '২০১-A',
    monthlyRentPoisha: 550000,
    status: 'OCCUPIED',
    currentResidentName: 'রাকিবুল ইসলাম',
    currentResidentId: 'res-004',
  },
  {
    _id: 'seat-201b',
    buildingId: 'bld-001',
    roomId: 'room-201',
    seatNumber: '২০১-B',
    monthlyRentPoisha: 550000,
    status: 'AVAILABLE',
  },
];

export const mockResidents = [
  {
    _id: 'res-001',
    residentId: 'HST-2026-0001',
    fullName: 'তানভীর আহমেদ',
    fullNameEn: 'Tanvir Ahmed',
    phone: '০১৭৮৯১২৩৪৫৬',
    email: 'tanvir@student.example.com',
    nidOrBirthCert: '১৯৯৮২৬৯১২২৩০০০০০১',
    documentType: 'NID',
    presentAddress: 'রুম ১০১, গ্রিন ভিউ হোস্টেল, ধানমন্ডি, ঢাকা',
    permanentAddress: 'গ্রাম: কৃষ্ণপুর, ডাকঘর: ফুলবাড়ী, দিনাজপুর',
    guardianName: 'মো: মোজাম্মেল হক',
    guardianRelation: 'পিতা',
    guardianPhone: '০১৭৫০০০০০০১',
    institutionOrWorkplace: 'ঢাকা বিশ্ববিদ্যালয় (সিএসই বিভাগ)',
    idCardNumber: 'DU-CSE-2022-45',
    admissionDate: '2026-01-01T00:00:00.000Z',
    buildingId: { _id: 'bld-001', name: 'প্রধান ভবন (নিলয়)' },
    roomId: { _id: 'room-101', roomNumber: '১০১', roomType: 'DOUBLE' },
    seatId: { _id: 'seat-101a', seatNumber: '১০১-A', monthlyRentPoisha: 400000 },
    monthlyRentPoisha: 400000,
    securityDepositPoisha: 300000,
    status: 'ACTIVE',
    totalDuePoisha: 0,
  },
  {
    _id: 'res-002',
    residentId: 'HST-2026-0002',
    fullName: 'সাকিব আল হাসান',
    fullNameEn: 'Sakib Al Hasan',
    phone: '০১৮১২৩৪৫৬৭৮',
    email: 'sakib@techcorp.example.com',
    nidOrBirthCert: '২০০১১৯৮৭৬৫৪০০০০২',
    documentType: 'NID',
    presentAddress: 'রুম ১০২, গ্রিন ভিউ হোস্টেল, ধানমন্ডি, ঢাকা',
    permanentAddress: 'থানা রোড, মাগুরা সদর, মাগুরা',
    guardianName: 'খন্দকার মাসরুর রেজা',
    guardianRelation: 'পিতা',
    guardianPhone: '০১৮২০০০১১২২',
    institutionOrWorkplace: 'ব্রেইন স্টেশন ২৩ (সফটওয়্যার ইঞ্জিনিয়ার)',
    admissionDate: '2026-02-01T00:00:00.000Z',
    buildingId: { _id: 'bld-001', name: 'প্রধান ভবন (নিলয়)' },
    roomId: { _id: 'room-102', roomNumber: '১০২', roomType: 'TRIPLE' },
    seatId: { _id: 'seat-102a', seatNumber: '১০২-A', monthlyRentPoisha: 320000 },
    monthlyRentPoisha: 320000,
    securityDepositPoisha: 300000,
    status: 'ACTIVE',
    totalDuePoisha: 190000,
  },
  {
    _id: 'res-003',
    residentId: 'HST-2026-0003',
    fullName: 'মাহমুদুল হাসান',
    fullNameEn: 'Mahmudul Hasan',
    phone: '০১৯৩৩৪৪৫৫৬৬',
    email: 'mahmud@buet.ac.bd',
    nidOrBirthCert: '২০০০০৩১২৪৫৫৬৭০০১',
    documentType: 'NID',
    presentAddress: 'রুম ১০১, গ্রিন ভিউ হোস্টেল, ধানমন্ডি, ঢাকা',
    permanentAddress: 'কোটচাঁদপুর, ঝিনাইদহ',
    guardianName: 'মো: আব্দুল মতিন',
    guardianRelation: 'পিতা',
    guardianPhone: '০১৯২০০০২২৩৩',
    institutionOrWorkplace: 'বুয়েট (ইইই বিভাগ)',
    admissionDate: '2026-01-15T00:00:00.000Z',
    buildingId: { _id: 'bld-001', name: 'প্রধান ভবন (নিলয়)' },
    roomId: { _id: 'room-101', roomNumber: '১০১', roomType: 'DOUBLE' },
    seatId: { _id: 'seat-101b', seatNumber: '১০১-B', monthlyRentPoisha: 400000 },
    monthlyRentPoisha: 400000,
    securityDepositPoisha: 300000,
    status: 'ACTIVE',
    totalDuePoisha: 50000,
  },
];

export const mockDashboardStats = {
  success: true,
  role: 'OWNER',
  data: {
    totalResidents: 24,
    activeResidents: 22,
    onLeaveResidents: 2,
    totalRooms: 14,
    totalSeats: 42,
    occupiedSeats: 34,
    availableSeats: 6,
    reservedSeats: 1,
    maintenanceSeats: 1,
    occupancyRate: 81.0,
    totalBilledPoisha: 16800000,
    totalCollectedPoisha: 14200000,
    totalDuePoisha: 2600000,
    collectionRate: 84.5,
    monthExpensesTotalPoisha: 3850000,
    monthBazarTotalPoisha: 6420000,
    totalOutflowPoisha: 10270000,
    netProfitPoisha: 3930000,
    totalMealsMonth: 1240,
    calculatedMealRatePoisha: 6850,
    activeMealsToday: 28,
    pendingComplaintsCount: 2,
    pendingLeavesCount: 1,
    revenueExpenseTrends: [
      { month: '2026-05', revenue: 135000, expense: 98000, mealCost: 58000 },
      { month: '2026-06', revenue: 142000, expense: 102000, mealCost: 61000 },
      { month: '2026-07', revenue: 148000, expense: 105000, mealCost: 63000 },
      { month: '2026-08', revenue: 152000, expense: 99000, mealCost: 62000 },
      { month: '2026-09', revenue: 156000, expense: 101000, mealCost: 64000 },
      { month: '2026-10', revenue: 168000, expense: 102700, mealCost: 64200 },
    ],
    recentAdmissions: mockResidents.slice(0, 3),
    importantNotices: [
      {
        _id: 'not-001',
        title: 'আগামী শুক্রবার হোস্টেল সার্বিক পরিষ্কার-পরিচ্ছন্নতা অভিযান',
        message: 'সকল সম্মানিত বর্ডারদের অবগত করা যাচ্ছে যে শুক্রবার সকাল ৯টা থেকে কিচেন ও করিডোর পরিচ্ছন্ন করা হবে।',
        createdAt: '2026-10-08T10:00:00.000Z',
      },
    ],
  },
};

export const mockInvoices = [
  {
    _id: 'inv-001',
    invoiceNumber: 'INV-202610-00001',
    residentId: mockResidents[0],
    billingMonth: '2026-10',
    roomRentPoisha: 400000,
    utilityChargesPoisha: 50000,
    serviceChargesPoisha: 20000,
    totalPayablePoisha: 470000,
    paidAmountPoisha: 470000,
    dueAmountPoisha: 0,
    status: 'PAID',
    dueDate: '2026-10-10T00:00:00.000Z',
    notes: '২০২৬-১০ মাসের হোস্টেল ভাড়া ও ইউটিলিটি বিল',
  },
  {
    _id: 'inv-002',
    invoiceNumber: 'INV-202610-00002',
    residentId: mockResidents[1],
    billingMonth: '2026-10',
    roomRentPoisha: 320000,
    utilityChargesPoisha: 50000,
    serviceChargesPoisha: 20000,
    totalPayablePoisha: 390000,
    paidAmountPoisha: 200000,
    dueAmountPoisha: 190000,
    status: 'PARTIAL',
    dueDate: '2026-10-10T00:00:00.000Z',
    notes: '২০২৬-১০ মাসের হোস্টেল ভাড়া',
  },
];

export const mockPayments = [
  {
    _id: 'pay-001',
    receiptNumber: 'RCT-2026-00001',
    residentId: mockResidents[0],
    invoiceId: 'inv-001',
    purpose: 'RENT_INVOICE',
    amountPoisha: 470000,
    paymentMethod: 'BKASH',
    transactionId: 'BKASH98712365',
    paymentDate: '2026-10-05T12:30:00.000Z',
    remarks: 'বিকাশের মাধ্যমে সম্পূর্ণ পরিশোধিত',
  },
  {
    _id: 'pay-002',
    receiptNumber: 'RCT-2026-00002',
    residentId: mockResidents[1],
    invoiceId: 'inv-002',
    purpose: 'RENT_INVOICE',
    amountPoisha: 200000,
    paymentMethod: 'CASH',
    paymentDate: '2026-10-06T14:00:00.000Z',
    remarks: 'নগদ ক্যাশ আংশিক পরিশোধ',
  },
];

export const mockBazarPurchases = [
  {
    _id: 'bzr-001',
    voucherNumber: 'BZR-2026-00001',
    purchaseDate: '2026-10-09',
    category: 'GROCERY',
    items: [
      { itemName: 'মিনিকেট চাল', quantity: 25, unit: 'কেজি', unitPricePoisha: 7200, totalPricePoisha: 180000 },
      { itemName: 'সয়াবিন তেল', quantity: 5, unit: 'লিটার', unitPricePoisha: 18500, totalPricePoisha: 92500 },
      { itemName: 'মসুর ডাল', quantity: 3, unit: 'কেজি', unitPricePoisha: 13000, totalPricePoisha: 39000 },
      { itemName: 'পেঁয়াজ ও রসুন', quantity: 4, unit: 'কেজি', unitPricePoisha: 8500, totalPricePoisha: 34000 },
    ],
    totalAmountPoisha: 345500,
    purchasedBy: 'মো: আলাউদ্দিন (বাবুর্চি)',
    isApproved: true,
    notes: 'সাপ্তাহিক প্রধান মুদি বাজার সম্পন্ন',
  },
  {
    _id: 'bzr-002',
    voucherNumber: 'BZR-2026-00002',
    purchaseDate: '2026-10-10',
    category: 'MEAT_FISH',
    items: [
      { itemName: 'রুই মাছ', quantity: 4, unit: 'কেজি', unitPricePoisha: 36000, totalPricePoisha: 144000 },
      { itemName: 'ব্রয়লার মুরগি', quantity: 6, unit: 'কেজি', unitPricePoisha: 19500, totalPricePoisha: 117000 },
    ],
    totalAmountPoisha: 261000,
    purchasedBy: 'মো: আলাউদ্দিন',
    isApproved: true,
    notes: 'আজকের দুপুরের খাবার ও রাতের মাংস-মাছ বাজার',
  },
];

export const mockStaff = [
  {
    _id: 'stf-001',
    staffId: 'STF-001',
    fullName: 'মো: আলাউদ্দিন',
    phone: '০১৭৭০০০০০২২',
    role: 'COOK',
    nid: '১৯৮২১২৩৪৫৬৭৮৯০',
    monthlySalaryPoisha: 1600000,
    emergencyContact: '০১৭৭০০০০০২৩',
    responsibilities: 'প্রতিদিনের তিন বেলা রান্না ও কিচেনের পরিচ্ছন্নতা',
    status: 'ACTIVE',
  },
  {
    _id: 'stf-002',
    staffId: 'STF-002',
    fullName: 'কামরুল হাসান',
    phone: '০১৮৮০০০০০৩৩',
    role: 'HOSTEL_MANAGER',
    nid: '১৯৯০১২৩৪৫৬৭৮৯১',
    monthlySalaryPoisha: 2000000,
    emergencyContact: '০১৮৮০০০০০৩৪',
    responsibilities: 'দৈনিক হোস্টেল তত্ত্বাবধান ও রেজিস্টার সংরক্ষণ',
    status: 'ACTIVE',
  },
];

export const mockComplaints = [
  {
    _id: 'cmp-001',
    ticketNumber: 'CMP-2026-0001',
    residentId: mockResidents[1],
    category: 'WATER_SUPPLY',
    title: '১০২ নম্বর রুমের ওয়াশরুমের বেসিন ট্যাপ দিয়ে পানি পড়ছে',
    description: 'বেসিনের ট্যাপটি ঢিলে হয়ে গেছে এবং অবিরাম পানি ড্রপ করছে। অনুগ্রহ করে মেরামত করে দিন।',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    resolutionNotes: 'প্লাম্বারকে জানানো হয়েছে, আজ বিকেলে ঠিক করা হবে।',
    createdAt: '2026-10-09T08:00:00.000Z',
  },
  {
    _id: 'cmp-002',
    ticketNumber: 'CMP-2026-0002',
    residentId: mockResidents[0],
    category: 'WIFI_INTERNET',
    title: '১ম তলায় ওয়াইফাই সিগন্যাল দুর্বল',
    description: 'রাউটার রিস্টার্ট করার পরও রাত্রে স্পিড খুব ধীর হয়ে যায়।',
    priority: 'LOW',
    status: 'RESOLVED',
    resolutionNotes: 'নতুন অ্যাক্সেস পয়েন্ট কনফিগার করা হয়েছে।',
    createdAt: '2026-10-07T11:00:00.000Z',
  },
];

export const mockLeaveRequests = [
  {
    _id: 'lev-001',
    residentId: mockResidents[0],
    departureDate: '2026-10-15',
    expectedReturnDate: '2026-10-18',
    reason: 'সেমিস্টার ফাইনাল পরীক্ষার পর বাড়ি যাচ্ছি।',
    destinationAddress: 'দিনাজপুর সদর',
    status: 'APPROVED',
  },
];

export const mockVisitors = [
  {
    _id: 'vis-001',
    residentId: mockResidents[0],
    visitorName: 'মো: মোজাম্মেল হক',
    relation: 'পিতা',
    phone: '০১৭৫০০০০০০১',
    entryTime: '2026-10-09T14:30:00.000Z',
    exitTime: '2026-10-09T17:00:00.000Z',
    purpose: 'বর্ডারের সাথে দেখা করা ও প্রয়োজনীয় জিনিসপত্র দেওয়া',
  },
];

export const mockCurrentUser = {
  id: 'demo-user-id',
  firebaseUid: 'demo-firebase-uid',
  email: 'demo@hostel.example.com',
  displayName: 'আওলাদ হোসেন (ডেমো এডমিন)',
  role: 'OWNER',
  status: 'ACTIVE',
};

/**
 * Endpoint Matcher: Resolves default mock data according to the request URL
 */
export function getMockDataForEndpoint(url: string, method = 'GET'): any {
  const cleanUrl = url.split('?')[0].toLowerCase();

  // If mutation (POST/PUT/PATCH/DELETE), return simulated successful action response
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    return {
      success: true,
      message: 'ডেমো মোডে এই অপারেশনটি সফলভাবে সম্পন্ন হয়েছে (সিমুলেটেড)।',
      data: { id: `demo-simulated-${Date.now()}` },
    };
  }

  // Exact or prefix URL pattern matching
  if (cleanUrl.endsWith('/api/auth/session')) {
    return { success: true, user: mockCurrentUser };
  }
  if (cleanUrl.endsWith('/api/settings')) {
    return { success: true, data: mockSettings };
  }
  if (cleanUrl.endsWith('/api/dashboard/stats')) {
    return mockDashboardStats;
  }
  if (cleanUrl.endsWith('/api/buildings')) {
    return { success: true, data: mockBuildings };
  }
  if (cleanUrl.endsWith('/api/rooms')) {
    return { success: true, data: mockRooms };
  }
  if (cleanUrl.endsWith('/api/seats')) {
    return { success: true, data: mockSeats };
  }
  if (cleanUrl.endsWith('/api/residents')) {
    return { success: true, data: mockResidents, pagination: { total: mockResidents.length, page: 1, limit: 10 } };
  }
  if (cleanUrl.includes('/api/residents/')) {
    return { success: true, data: mockResidents[0] };
  }
  if (cleanUrl.endsWith('/api/rent/invoices')) {
    return { success: true, data: mockInvoices };
  }
  if (cleanUrl.endsWith('/api/rent/payments')) {
    return { success: true, data: mockPayments };
  }
  if (cleanUrl.endsWith('/api/meals/bazar')) {
    return { success: true, data: mockBazarPurchases };
  }
  if (cleanUrl.endsWith('/api/meals/settlement')) {
    return { success: true, data: [] };
  }
  if (cleanUrl.endsWith('/api/meals')) {
    return {
      success: true,
      data: [
        {
          _id: 'meal-001',
          residentId: mockResidents[0],
          date: new Date().toISOString().substring(0, 10),
          breakfast: 1,
          lunch: 1,
          dinner: 1,
          totalUnits: 2.5,
          status: 'ACTIVE',
        },
      ],
    };
  }
  if (cleanUrl.endsWith('/api/staff/salaries')) {
    return { success: true, data: [] };
  }
  if (cleanUrl.endsWith('/api/staff')) {
    return { success: true, data: mockStaff };
  }
  if (cleanUrl.endsWith('/api/complaints')) {
    return { success: true, data: mockComplaints };
  }
  if (cleanUrl.endsWith('/api/leave')) {
    return { success: true, data: mockLeaveRequests };
  }
  if (cleanUrl.endsWith('/api/visitors')) {
    return { success: true, data: mockVisitors };
  }
  if (cleanUrl.endsWith('/api/financial/summary')) {
    return {
      success: true,
      data: {
        totalIncomePoisha: 14200000,
        totalExpensePoisha: 10270000,
        netBalancePoisha: 3930000,
      },
    };
  }
  if (cleanUrl.endsWith('/api/financial/expenses')) {
    return {
      success: true,
      data: [
        {
          _id: 'exp-001',
          expenseCategory: 'UTILITY_ELECTRICITY',
          amountPoisha: 1850000,
          description: 'সেপ্টেম্বর মাসের বিদ্যুৎ বিল',
          expenseDate: '2026-10-04T00:00:00.000Z',
        },
      ],
    };
  }

  // Generic fallback
  return {
    success: true,
    data: [],
    message: 'ডেমো ডেটা রিটার্ন করা হয়েছে (Fallback)',
  };
}

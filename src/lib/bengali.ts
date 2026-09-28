/**
 * Bengali (বাংলা) Localization, Date/Time and Currency Utility Functions
 * Designed for Bangladesh (Asia/Dhaka) Locale and BDT (৳) Currency.
 */

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const ENGLISH_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

export const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export const BENGALI_DAYS = [
  'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
];

/**
 * Converts English numbers or numeric strings into Bengali numerals
 * Example: 1250.50 -> ১,২৫০.৫০
 */
export function toBengaliNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '০';
  const str = String(value);
  return str.replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)]);
}

/**
 * Converts Bengali numerals into English numeric string
 * Example: '১২৫০' -> '1250'
 */
export function toEnglishNumber(str: string): string {
  if (!str) return '0';
  return str.replace(/[০-৯]/g, (digit) => ENGLISH_DIGITS[digit] || digit);
}

/**
 * Formats a monetary amount into Bangladeshi Taka string (e.g., ৳ ৫,২৫০.০০)
 * @param amountInTaka Amount in Taka
 * @param includeSymbol Whether to prefix with ৳
 * @param showDecimals Whether to display 2 decimal places
 */
export function formatBengaliCurrency(
  amountInTaka: number | null | undefined,
  includeSymbol: boolean = true,
  showDecimals: boolean = false
): string {
  const amount = Number(amountInTaka) || 0;
  const fixed = showDecimals ? amount.toFixed(2) : Math.round(amount).toString();
  const parts = fixed.split('.');
  
  // Format comma according to standard Indian/Bangladeshi numbering system (lakh/crore)
  let integerPart = parts[0];
  const isNegative = integerPart.startsWith('-');
  if (isNegative) integerPart = integerPart.substring(1);

  let formattedInt = '';
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const rest = integerPart.substring(0, integerPart.length - 3);
    formattedInt = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  } else {
    formattedInt = integerPart;
  }

  if (isNegative) formattedInt = '-' + formattedInt;
  const result = parts.length > 1 ? `${formattedInt}.${parts[1]}` : formattedInt;
  const bnResult = toBengaliNumber(result);

  return includeSymbol ? `৳ ${bnResult}` : bnResult;
}

/**
 * Converts integer Poisha into Taka
 * (e.g., 150075 poisha -> 1500.75 Taka)
 */
export function poishaToTaka(poisha: number): number {
  return Number((poisha / 100).toFixed(2));
}

/**
 * Converts Taka into integer Poisha
 * (e.g., 1500.75 Taka -> 150075 poisha)
 */
export function takaToPoisha(taka: number): number {
  return Math.round(taka * 100);
}

/**
 * Formats a Date object or ISO string in Bengali (Asia/Dhaka timezone)
 * Example: ১২ অক্টোবর ২০২৬
 */
export function formatBengaliDate(
  dateInput: Date | string | null | undefined,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  // Format in Dhaka timezone
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  };

  const day = date.toLocaleDateString('en-GB', { ...options, day: 'numeric' });
  const monthIndex = date.getMonth(); // 0 to 11
  const year = date.toLocaleDateString('en-GB', { ...options, year: 'numeric' });

  if (format === 'short') {
    return `${toBengaliNumber(day)}/${toBengaliNumber(monthIndex + 1)}/${toBengaliNumber(year)}`;
  }

  if (format === 'long') {
    const weekday = BENGALI_DAYS[date.getDay()];
    return `${weekday}, ${toBengaliNumber(day)} ${BENGALI_MONTHS[monthIndex]} ${toBengaliNumber(year)}`;
  }

  return `${toBengaliNumber(day)} ${BENGALI_MONTHS[monthIndex]} ${toBengaliNumber(year)}`;
}

/**
 * Formats time in Bengali (e.g., সকাল ১০:৩০ অথবা রাত ৮:১৫)
 */
export function formatBengaliTime(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const minuteStr = minutes < 10 ? `0${minutes}` : `${minutes}`;

  let period = 'সকাল';
  let displayHour = hours;

  if (hours >= 0 && hours < 6) {
    period = 'রাত';
    displayHour = hours === 0 ? 12 : hours;
  } else if (hours >= 6 && hours < 12) {
    period = 'সকাল';
  } else if (hours >= 12 && hours < 15) {
    period = 'দুপুর';
    displayHour = hours > 12 ? hours - 12 : hours;
  } else if (hours >= 15 && hours < 18) {
    period = 'বিকেল';
    displayHour = hours - 12;
  } else if (hours >= 18 && hours < 20) {
    period = 'সন্ধ্যা';
    displayHour = hours - 12;
  } else {
    period = 'রাত';
    displayHour = hours - 12;
  }

  return `${period} ${toBengaliNumber(displayHour)}:${toBengaliNumber(minuteStr)}`;
}

/**
 * Status and role dictionary mappings in natural Bengali
 */
export const ROLE_LABELS: Record<string, string> = {
  OWNER: 'মালিক / প্রধান প্রশাসক',
  HOSTEL_MANAGER: 'হোস্টেল ম্যানেজার',
  ACCOUNTANT: 'হিসাবরক্ষক',
  MEAL_MANAGER: 'মিল ম্যানেজার',
  STAFF: 'স্টাফ / কর্মচারী',
  RESIDENT: 'বর্ডার / সদস্য',
};

export const SEAT_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  AVAILABLE: { label: 'ফাঁকা আছে', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  OCCUPIED: { label: 'বরাদ্দকৃত', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  RESERVED: { label: 'সংরক্ষিত', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  MAINTENANCE: { label: 'মেরামত চলছে', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

export const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PAID: { label: 'পরিশোধিত', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  PARTIAL: { label: 'আংশিক পরিশোধিত', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  UNPAID: { label: 'বকেয়া', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'নগদ ক্যাশ',
  BKASH: 'বিকাশ',
  NAGAD: 'নগদ (Nagad)',
  ROCKET: 'রকেট',
  BANK_TRANSFER: 'ব্যাংক স্থানান্তর',
};

export const COMPLAINT_PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  LOW: { label: 'সাধারণ', color: 'text-slate-600' },
  MEDIUM: { label: 'মাঝারি', color: 'text-blue-600' },
  HIGH: { label: 'জরুরি', color: 'text-amber-600' },
  URGENT: { label: 'অতি জরুরি', color: 'text-rose-600' },
};

export const COMPLAINT_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  SUBMITTED: { label: 'জমা হয়েছে', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  IN_PROGRESS: { label: 'প্রক্রিয়াধীন', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  RESOLVED: { label: 'সমাধানকৃত', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  CLOSED: { label: 'সম্পন্ন', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-300' },
};

export const LEAVE_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'অপেক্ষমাণ', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  APPROVED: { label: 'অনুমোদিত', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  REJECTED: { label: 'বাতিলকৃত', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  COMPLETED: { label: 'ফিরে এসেছেন', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
};

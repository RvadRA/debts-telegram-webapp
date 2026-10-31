import { Currency, CurrencyConfig, Debt } from '../types/debt';

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  RUB: { code: 'RUB', symbol: '₽', label: 'Рубль', flag: '🇷🇺' },
  USD: { code: 'USD', symbol: '$', label: 'Доллар', flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', label: 'Евро', flag: '🇪🇺' },
  UZS: { code: 'UZS', symbol: 'сум', label: 'Сум', flag: '🇺🇿' },
  KZT: { code: 'KZT', symbol: '₸', label: 'Тенге', flag: '🇰🇿' },
  BYN: { code: 'BYN', symbol: 'Br', label: 'Бел. рубль', flag: '🇧🇾' },
  UAH: { code: 'UAH', symbol: '₴', label: 'Гривна', flag: '🇺🇦' },
};

export function formatAmount(amount: number, currency: Currency = 'RUB'): string {
  const symbol = CURRENCIES[currency]?.symbol || currency;
  const formatted = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
  }).format(amount);

  return `${formatted} ${symbol}`;
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+7') && cleaned.length === 12) {
    return `${cleaned.slice(0, 2)} (${cleaned.slice(2, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8, 10)}-${cleaned.slice(10, 12)}`;
  }
  if (cleaned.startsWith('+998') && cleaned.length === 13) {
    return `${cleaned.slice(0, 4)} (${cleaned.slice(4, 6)}) ${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}-${cleaned.slice(11, 13)}`;
  }
  return cleaned;
}

export function calculateRemaining(debt: Debt): number {
  if (debt.isSettled) return 0;
  const totalRepaid = debt.repayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const remaining = Math.max(0, debt.amount - totalRepaid);
  return remaining;
}

export function getDaysDifference(dueDateStr: string): number {
  if (!dueDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function getDebtStatus(debt: Debt): 'settled' | 'overdue' | 'urgent' | 'active' {
  if (debt.isSettled) return 'settled';
  const remaining = calculateRemaining(debt);
  if (remaining <= 0) return 'settled';

  const days = getDaysDifference(debt.dueDate);
  if (days < 0) return 'overdue';
  if (days <= 3) return 'urgent';
  return 'active';
}

export function getDueStatusLabel(debt: Debt): {
  text: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
  days: number;
} {
  if (debt.isSettled) {
    return { text: 'Погашен', tone: 'success', days: 0 };
  }
  const remaining = calculateRemaining(debt);
  if (remaining <= 0) {
    return { text: 'Погашен', tone: 'success', days: 0 };
  }

  const days = getDaysDifference(debt.dueDate);

  if (days < 0) {
    const absDays = Math.abs(days);
    const dayWord = pluralizeDays(absDays);
    return { text: `Просрочен на ${absDays} ${dayWord}`, tone: 'danger', days };
  }
  if (days === 0) {
    return { text: 'Срок возврата сегодня!', tone: 'warning', days: 0 };
  }
  if (days === 1) {
    return { text: 'Возврат завтра', tone: 'warning', days: 1 };
  }
  if (days <= 3) {
    return { text: `Осталось ${days} ${pluralizeDays(days)}`, tone: 'warning', days };
  }

  return { text: `Через ${days} ${pluralizeDays(days)}`, tone: 'neutral', days };
}

export function pluralizeDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return 'дней';
  if (mod10 === 1) return 'день';
  if (mod10 >= 2 && mod10 <= 4) return 'дня';
  return 'дней';
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateDetailed(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

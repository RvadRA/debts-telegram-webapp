export type DebtType = 'i_lent' | 'i_borrowed'; // 'i_lent' = Мне должны, 'i_borrowed' = Я должен

export type Currency = 'RUB' | 'USD' | 'EUR' | 'UZS' | 'KZT' | 'BYN' | 'UAH';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  label: string;
  flag: string;
}

export interface Repayment {
  id: string;
  amount: number;
  date: string; // ISO date YYYY-MM-DD
  note?: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  name: string; // Имя контакта
  phone: string; // Номер телефона
  amount: number; // Исходная сумма долга
  currency: Currency;
  dueDate: string; // Дата возврата YYYY-MM-DD
  startDate: string; // Дата выдачи / займа YYYY-MM-DD
  type: DebtType;
  receiptPhoto?: string; // Base64 data URL или ссылка на чек
  receiptCaption?: string; // Описание к чеку
  notes?: string; // Дополнительные примечания
  repayments: Repayment[]; // История выплат
  isSettled: boolean; // Полностью закрыт
  settledDate?: string;
  isRecurring?: boolean; // Повторяющийся долг (аренда, подписка)
  recurringInterval?: 'monthly' | 'weekly'; // Интервал повторения
  recurringDayOfMonth?: number; // День месяца (1-31)
  reminder24hSent?: boolean; // Отправлено ли напоминание за 24ч
  reminderDueDaySent?: boolean; // Отправлено ли напоминание в день возврата
  debtorTelegramId?: string; // Telegram Chat ID должника для персонального уведомления
  createdAt: string;
  updatedAt: string;
}

export interface TelegramWebAppUser {
  id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export type DebtFilterTab = 'all' | 'i_lent' | 'i_borrowed' | 'recurring' | 'urgent' | 'overdue' | 'settled';

export type DebtSortOption = 'dueDateAsc' | 'dueDateDesc' | 'amountDesc' | 'amountAsc' | 'createdAtDesc';

export interface BotConfig {
  botToken: string;
  chatId: string;
  autoSendIOU: boolean;
  botUsername?: string;
  reportFrequency?: 'daily' | 'weekly' | 'off';
  reportTime?: string;
  lastReportSent?: string;
  autoRemind24h?: boolean;
  autoRemindDueDay?: boolean;
}

export type ReportFrequency = 'daily' | 'weekly' | 'off';

export interface ReportScheduleConfig {
  frequency: ReportFrequency;
  chatId: string;
  time: string; // HH:mm format, default '09:00'
  includeSettled: boolean;
  lastSent?: string;
  autoRemind24h?: boolean;
  autoRemindDueDay?: boolean;
}

export interface ShopOwner {
  id: string; // Telegram user ID / Chat ID
  name: string;
  username?: string;
  role: 'primary' | 'secondary';
  addedAt: string;
}

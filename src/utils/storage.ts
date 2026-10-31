import { BotConfig, Debt } from '../types/debt';

const DEBTS_STORAGE_KEY = 'telegram_debts_tracker_v1';
const BOT_CONFIG_KEY = 'telegram_debts_bot_config_v1';

// Default sample receipt SVG as data URI
const SAMPLE_RECEIPT_PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="550" viewBox="0 0 400 550" fill="none">
  <rect width="400" height="550" rx="16" fill="#FFFFFF"/>
  <rect x="20" y="20" width="360" height="510" rx="12" fill="#F8FAFC" stroke="#E2E8F0" stroke-dasharray="4 4"/>
  <circle cx="200" cy="70" r="28" fill="#E0F2FE"/>
  <path d="M190 70L197 77L212 62" stroke="#0284C7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="200" y="125" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="18" fill="#0F172A">КАССОВЫЙ ЧЕК / РАСПИСКА</text>
  <text x="200" y="148" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#64748B">ООО "ЭЛЕКТРОНИКА И СЕРВИС"</text>
  <text x="200" y="166" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#94A3B8">ИНН 7701234567 • СМЕНА №42</text>
  <line x1="40" y1="185" x2="360" y2="185" stroke="#CBD5E1" stroke-width="1"/>
  <text x="45" y="215" font-family="sans-serif" font-size="13" fill="#334155">1. Ремонт и комплектующие</text>
  <text x="355" y="215" text-anchor="end" font-family="sans-serif" font-weight="600" font-size="13" fill="#0F172A">6 500.00 ₽</text>
  <text x="45" y="245" font-family="sans-serif" font-size="13" fill="#334155">2. Курьерская доставка</text>
  <text x="355" y="245" text-anchor="end" font-family="sans-serif" font-weight="600" font-size="13" fill="#0F172A">1 000.00 ₽</text>
  <line x1="40" y1="270" x2="360" y2="270" stroke="#CBD5E1" stroke-width="1"/>
  <text x="45" y="305" font-family="sans-serif" font-weight="bold" font-size="16" fill="#0F172A">ИТОГО К ОПЛАТЕ</text>
  <text x="355" y="305" text-anchor="end" font-family="sans-serif" font-weight="bold" font-size="18" fill="#0284C7">7 500.00 ₽</text>
  <rect x="50" y="340" width="300" height="70" rx="8" fill="#F1F5F9"/>
  <text x="200" y="365" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="600" fill="#475569">Безналичная оплата СБП</text>
  <text x="200" y="388" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#64748B">Транзакция #8492049281</text>
  <rect x="150" y="430" width="100" height="80" rx="4" fill="#0F172A"/>
  <rect x="156" y="436" width="35" height="30" fill="#FFFFFF"/>
  <rect x="209" y="436" width="35" height="30" fill="#FFFFFF"/>
  <rect x="156" y="474" width="35" height="30" fill="#FFFFFF"/>
  <rect x="209" y="474" width="35" height="30" fill="#FFFFFF"/>
</svg>
`)}`;

export const DEFAULT_BOT_CONFIG: BotConfig = {
  botToken: '8200264736:AAFJ8tHwzNK5CJ0Xle55TmmJtRGoQEwt4I0',
  chatId: '',
  autoSendIOU: false,
};

function getFutureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function getPastDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

export const INITIAL_SEED_DEBTS: Debt[] = [
  {
    id: 'debt-seed-1',
    name: 'Дмитрий Волков',
    phone: '+7 903 112-44-88',
    amount: 10000,
    currency: 'RUB',
    startDate: getPastDate(14),
    dueDate: getPastDate(2), // Overdue
    type: 'i_lent',
    receiptPhoto: SAMPLE_RECEIPT_PHOTO,
    receiptCaption: 'Чек за ремонт и запчасти',
    notes: 'Обещал перевести в прошлый понедельник',
    repayments: [],
    isSettled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'debt-seed-2',
    name: 'Алексей Петров',
    phone: '+7 916 482-90-11',
    amount: 4000,
    currency: 'RUB',
    startDate: getPastDate(5),
    dueDate: getFutureDate(1), // Urgent (soon)
    type: 'i_lent',
    notes: 'Рассрочка за товар из магазина',
    repayments: [],
    isSettled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'debt-seed-3',
    name: 'Сергей Иванов',
    phone: '+7 925 330-99-22',
    amount: 1500,
    currency: 'RUB',
    startDate: getPastDate(3),
    dueDate: getFutureDate(10), // In progress
    type: 'i_lent',
    notes: 'Оплата доставки и отгрузки',
    repayments: [],
    isSettled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'debt-seed-4',
    name: 'Поставщик материалов',
    phone: '+7 999 555-12-34',
    amount: 4500,
    currency: 'RUB',
    startDate: getPastDate(2),
    dueDate: getFutureDate(7),
    type: 'i_borrowed',
    notes: 'Закупка упаковки для магазина',
    repayments: [],
    isSettled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function loadDebts(): Debt[] {
  try {
    const raw = localStorage.getItem(DEBTS_STORAGE_KEY);
    if (!raw) {
      saveDebts(INITIAL_SEED_DEBTS);
      return INITIAL_SEED_DEBTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_SEED_DEBTS;
    return parsed;
  } catch (e) {
    console.error('Failed to load debts from storage:', e);
    return INITIAL_SEED_DEBTS;
  }
}

export function saveDebts(debts: Debt[]): void {
  try {
    localStorage.setItem(DEBTS_STORAGE_KEY, JSON.stringify(debts));
    // Asynchronously sync with server database for Telegram bot automated reports
    syncDebtsWithServer(debts).catch(() => {});
  } catch (e) {
    console.error('Failed to save debts to storage:', e);
  }
}

export async function syncDebtsWithServer(debts: Debt[]): Promise<boolean> {
  try {
    const res = await fetch('/api/debts/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debts }),
    });
    const data = await res.json();
    return Boolean(data.ok);
  } catch (err) {
    return false;
  }
}

export async function fetchServerDebts(): Promise<Debt[] | null> {
  try {
    const res = await fetch('/api/debts');
    const data = await res.json();
    if (data.ok && Array.isArray(data.debts) && data.debts.length > 0) {
      return data.debts;
    }
  } catch (e) {
    // offline or error
  }
  return null;
}

export function loadBotConfig(): BotConfig {
  try {
    const raw = localStorage.getItem(BOT_CONFIG_KEY);
    if (!raw) return DEFAULT_BOT_CONFIG;
    return { ...DEFAULT_BOT_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_BOT_CONFIG;
  }
}

export function saveBotConfig(config: BotConfig): void {
  try {
    localStorage.setItem(BOT_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save bot config:', e);
  }
}

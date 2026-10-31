import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const DEFAULT_BOT_TOKEN = '';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
const APP_URL = process.env.APP_URL || 'https://ais-pre-snbpnn2vhr365b2p56xjuv-350086348561.us-east1.run.app';

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Ensure data folder exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEBTS_FILE = path.join(DATA_DIR, 'debts.json');
const SCHEDULE_FILE = path.join(DATA_DIR, 'schedule.json');
const OWNERS_FILE = path.join(DATA_DIR, 'owners.json');

// Interface types for server
interface ShopOwner {
  id: string; // Telegram user ID / Chat ID
  name: string;
  username?: string;
  role: 'primary' | 'secondary';
  addedAt: string;
}

interface Repayment {
  id: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: string;
}

interface Debt {
  id: string;
  name: string;
  phone: string;
  amount: number;
  currency: string;
  dueDate: string;
  startDate: string;
  type: 'i_lent' | 'i_borrowed';
  receiptPhoto?: string;
  receiptCaption?: string;
  notes?: string;
  repayments: Repayment[];
  isSettled: boolean;
  settledDate?: string;
  isRecurring?: boolean;
  recurringInterval?: 'monthly' | 'weekly';
  recurringDayOfMonth?: number;
  reminder24hSent?: boolean;
  reminderDueDaySent?: boolean;
  debtorTelegramId?: string;
  createdAt: string;
  updatedAt: string;
}

interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'off';
  chatId: string;
  time: string; // e.g. "09:00"
  includeSettled: boolean;
  lastSentDate?: string;
  autoRemind24h?: boolean;
  autoRemindDueDay?: boolean;
}

// Permanent Telegram keyboard as requested: /report, /stats, /daily, /weekly, /stop
const PERMANENT_KEYBOARD = {
  keyboard: [
    [{ text: '/report' }, { text: '/stats' }],
    [{ text: '/daily' }, { text: '/weekly' }, { text: '/stop' }],
    [{ text: '🚀 Открыть приложение', web_app: { url: APP_URL } }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

// Read and write helpers for Owners
function getStoredOwners(): ShopOwner[] {
  try {
    if (fs.existsSync(OWNERS_FILE)) {
      const content = fs.readFileSync(OWNERS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading owners file:', e);
  }
  return [];
}

function saveStoredOwners(owners: ShopOwner[]): void {
  try {
    fs.writeFileSync(OWNERS_FILE, JSON.stringify(owners, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving owners file:', e);
  }
}

function isAuthorizedOwner(userId: string | number | undefined): boolean {
  if (!userId) return false;
  const uid = String(userId).trim();
  const owners = getStoredOwners();
  if (owners.length === 0) return true; // Bootstrap mode
  return owners.some((o) => String(o.id) === uid);
}

// Read and write helpers for Debts
function getStoredDebts(): Debt[] {
  try {
    if (fs.existsSync(DEBTS_FILE)) {
      const content = fs.readFileSync(DEBTS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading debts file:', e);
  }
  return [];
}

function saveStoredDebts(debts: Debt[]): void {
  try {
    fs.writeFileSync(DEBTS_FILE, JSON.stringify(debts, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving debts file:', e);
  }
}

function getStoredSchedule(): ScheduleConfig {
  try {
    if (fs.existsSync(SCHEDULE_FILE)) {
      const content = fs.readFileSync(SCHEDULE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading schedule file:', e);
  }
  return {
    frequency: 'daily',
    chatId: '',
    time: '09:00',
    includeSettled: false,
    autoRemind24h: true,
    autoRemindDueDay: true,
  };
}

function saveStoredSchedule(schedule: ScheduleConfig): void {
  try {
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedule, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving schedule file:', e);
  }
}


// Helper calculation
function calculateRemaining(debt: Debt): number {
  if (debt.isSettled) return 0;
  const repaid = (debt.repayments || []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  return Math.max(0, debt.amount - repaid);
}

// Helper to send text message with persistent keyboard
async function sendTelegramMessage(chatId: string, text: string, options?: { parseMode?: string; customKeyboard?: any }): Promise<any> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parseMode || 'HTML',
        reply_markup: options?.customKeyboard || PERMANENT_KEYBOARD,
      }),
    });
    return await res.json();
  } catch (e) {
    console.error('Error in sendTelegramMessage:', e);
    return { ok: false, error: String(e) };
  }
}

// Generate CSV with UTF-8 BOM for Microsoft Excel compatibility
function generateCSVReport(debts: Debt[], includeSettled = true): string {
  const filtered = includeSettled ? debts : debts.filter((d) => !d.isSettled);

  const headers = [
    '№',
    'Тип обязательства',
    'Имя контакта',
    'Номер телефона',
    'Исходная сумма',
    'Валюта',
    'Выплачено',
    'Остаток долга',
    'Дата займа',
    'Срок возврата',
    'Регулярный',
    'Статус',
    'Чек прикреплен',
    'Примечание',
    'История выплат',
  ];

  const escapeCSV = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = filtered.map((d, idx) => {
    const repaid = (d.repayments || []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const remaining = calculateRemaining(d);
    const typeLabel = d.type === 'i_lent' ? 'Мне должны' : 'Я должен';
    
    // Status
    let statusLabel = 'Активен';
    if (d.isSettled || remaining <= 0) {
      statusLabel = 'Погашен';
    } else {
      const due = new Date(d.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 0) {
        statusLabel = `Просрочен на ${Math.abs(diff)} дн.`;
      } else if (diff <= 3) {
        statusLabel = `Срочный (осталось ${diff} дн.)`;
      }
    }

    const repaymentsStr = (d.repayments || [])
      .map((r) => `${r.date}: +${r.amount} (${r.note || 'без прим.'})`)
      .join('; ');

    return [
      idx + 1,
      typeLabel,
      d.name || '',
      d.phone || '',
      d.amount,
      d.currency || 'RUB',
      repaid,
      remaining,
      d.startDate || d.createdAt?.split('T')[0] || '',
      d.dueDate || '',
      d.isRecurring ? 'Да (Ежемесячно)' : 'Нет',
      statusLabel,
      d.receiptPhoto ? 'Да' : 'Нет',
      d.notes || '',
      repaymentsStr,
    ].map(escapeCSV).join(';');
  });

  return '\uFEFF' + [headers.map(escapeCSV).join(';'), ...rows].join('\r\n');
}

// Generate formatted HTML text summary for Telegram message
function generateTextSummary(debts: Debt[], reportTitle: string): string {
  const activeDebts = debts.filter((d) => !d.isSettled);
  const lentDebts = activeDebts.filter((d) => d.type === 'i_lent');
  const borrowedDebts = activeDebts.filter((d) => d.type === 'i_borrowed');

  const totalLent = lentDebts.reduce((sum, d) => sum + calculateRemaining(d), 0);
  const totalBorrowed = borrowedDebts.reduce((sum, d) => sum + calculateRemaining(d), 0);
  const netBalance = totalLent - totalBorrowed;

  // Overdue debts
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueList = activeDebts.filter((d) => {
    const due = new Date(d.dueDate);
    due.setHours(0, 0, 0, 0);
    return due.getTime() < today.getTime();
  });

  // Upcoming in next 3 days
  const upcomingList = activeDebts.filter((d) => {
    const due = new Date(d.dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 3;
  });

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU').format(amount);
  };

  let msg = `📊 <b>${reportTitle}</b>\n`;
  msg += `📅 <i>Дата: ${new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</i>\n\n`;

  msg += `🟢 <b>Мне должны:</b> ${formatMoney(totalLent)} ₽ (${lentDebts.length} зап.)\n`;
  msg += `🔴 <b>Я должен:</b> ${formatMoney(totalBorrowed)} ₽ (${borrowedDebts.length} зап.)\n`;
  msg += `⚖️ <b>Чистый баланс:</b> ${netBalance >= 0 ? '+' : ''}${formatMoney(netBalance)} ₽\n\n`;

  if (overdueList.length > 0) {
    msg += `⚠️ <b>Просроченные долги (${overdueList.length}):</b>\n`;
    overdueList.slice(0, 5).forEach((d) => {
      const rem = calculateRemaining(d);
      msg += `• <b>${d.name}</b>: ${formatMoney(rem)} ${d.currency} (срок был: ${d.dueDate})\n`;
    });
    if (overdueList.length > 5) {
      msg += `  <i>...и еще ${overdueList.length - 5} записей в файле</i>\n`;
    }
    msg += `\n`;
  }

  if (upcomingList.length > 0) {
    msg += `⏰ <b>Скоро возврат (до 3 дней):</b>\n`;
    upcomingList.slice(0, 5).forEach((d) => {
      const rem = calculateRemaining(d);
      msg += `• <b>${d.name}</b>: ${formatMoney(rem)} ${d.currency} (до ${d.dueDate})\n`;
    });
    msg += `\n`;
  }

  msg += `📁 Полный детальный отчет прикреплен в файле Excel/CSV ниже.\n`;
  msg += `📱 <a href="${APP_URL}">Открыть Telegram WebApp</a>`;

  return msg;
}

// Send Document to Telegram Chat with permanent keyboard
async function sendTelegramReport(chatId: string, debts: Debt[], title: string, token = BOT_TOKEN): Promise<{ ok: boolean; description?: string }> {
  try {
    const csvContent = generateCSVReport(debts, true);
    const caption = generateTextSummary(debts, title);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `debts_report_${dateStr}.csv`;

    const blob = new Blob([Buffer.from(csvContent, 'utf-8')], { type: 'text/csv;charset=utf-8;' });

    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('document', blob, filename);
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
    formData.append('reply_markup', JSON.stringify(PERMANENT_KEYBOARD));

    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Failed to send Telegram report:', error);
    return { ok: false, description: String(error) };
  }
}

// --- AUTOMATION ENGINES ---

// 1. Personal Timed Notifications Engine (24h before & due day)
async function processDueReminders() {
  const debts = getStoredDebts();
  const schedule = getStoredSchedule();
  if (schedule.autoRemind24h === false && schedule.autoRemindDueDay === false) {
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let changed = false;

  const formatMoney = (n: number) => new Intl.NumberFormat('ru-RU').format(n);

  for (const d of debts) {
    if (d.isSettled) continue;
    const remaining = calculateRemaining(d);
    if (remaining <= 0) continue;

    const due = new Date(d.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Send notification to primary chat or debtor chat
    const targetChat = d.debtorTelegramId || schedule.chatId;
    if (!targetChat) continue;

    // A. Reminder 24 hours before (diffDays === 1)
    if (diffDays === 1 && !d.reminder24hSent && schedule.autoRemind24h !== false) {
      const typeText = d.type === 'i_lent' ? 'возврата вам средств' : 'вашего платежа по долгу';
      const text = `⏰ <b>Напоминание (за 24 часа до срока):</b>\n\n` +
        `Завтра наступает согласованная дата ${typeText}!\n` +
        `👤 <b>Контакт:</b> ${d.name}\n` +
        `💰 <b>Сумма к возврату:</b> <b>${formatMoney(remaining)} ${d.currency}</b>\n` +
        `📅 <b>Дата возврата:</b> Завтра (${d.dueDate})\n` +
        (d.notes ? `📝 <i>Примечание: ${d.notes}</i>\n\n` : '\n') +
        `<i>Уведомление сформировано автоматически ботом «Долги и Чеки».</i>`;

      await sendTelegramMessage(targetChat, text);
      d.reminder24hSent = true;
      changed = true;
      console.log(`[AutoReminder] 24h notice sent for debt ${d.id} to ${targetChat}`);
    }

    // B. Reminder On Due Day (diffDays === 0)
    if (diffDays === 0 && !d.reminderDueDaySent && schedule.autoRemindDueDay !== false) {
      const typeText = d.type === 'i_lent' ? 'возврата долга' : 'вашего обязательства';
      const text = `🚨 <b>Внимание: Срок возврата СЕГОДНЯ!</b>\n\n` +
        `Сегодня наступила дата ${typeText}:\n` +
        `👤 <b>Контакт:</b> ${d.name}\n` +
        `💰 <b>Остаток к оплате:</b> <b>${formatMoney(remaining)} ${d.currency}</b>\n` +
        `📅 <b>Срок:</b> СЕГОДНЯ (${d.dueDate})\n` +
        (d.notes ? `📝 <i>Примечание: ${d.notes}</i>\n\n` : '\n') +
        `<i>Пожалуйста, проверьте и зафиксируйте взаиморасчет в WebApp.</i>`;

      await sendTelegramMessage(targetChat, text);
      d.reminderDueDaySent = true;
      changed = true;
      console.log(`[AutoReminder] Due-day notice sent for debt ${d.id} to ${targetChat}`);
    }
  }

  if (changed) {
    saveStoredDebts(debts);
  }
}

// 2. Recurring Debts Engine (Аренда, Подписки, Ежемесячные долги)
async function processRecurringDebts() {
  const debts = getStoredDebts();
  const schedule = getStoredSchedule();
  const today = new Date();
  const currentDay = today.getDate(); // 1 - 31
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  let changed = false;

  const formatMoney = (n: number) => new Intl.NumberFormat('ru-RU').format(n);

  for (const d of debts) {
    if (!d.isRecurring) continue;
    const triggerDay = d.recurringDayOfMonth || 1;

    // Check if today matches the scheduled day of month
    if (currentDay === triggerDay) {
      const monthTag = `[${currentMonthKey}]`;
      const alreadyLogged = debts.some(
        (x) => x.id !== d.id && x.name === d.name && (x.notes || '').includes(monthTag)
      );

      // Only create if not already created for this month
      if (!alreadyLogged && !(d.notes || '').includes(monthTag)) {
        const nextDue = new Date(today);
        nextDue.setMonth(nextDue.getMonth() + 1);
        const nextDueStr = nextDue.toISOString().split('T')[0];

        const newRecurring: Debt = {
          id: `debt-rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: d.name,
          phone: d.phone,
          amount: d.amount,
          currency: d.currency,
          startDate: today.toISOString().split('T')[0],
          dueDate: nextDueStr,
          type: d.type,
          notes: `${d.notes ? d.notes + ' ' : ''}Регулярный платеж (Аренда/Подписка) ${monthTag}`,
          isRecurring: true,
          recurringInterval: d.recurringInterval || 'monthly',
          recurringDayOfMonth: triggerDay,
          repayments: [],
          isSettled: false,
          reminder24hSent: false,
          reminderDueDaySent: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        debts.push(newRecurring);
        changed = true;

        if (schedule.chatId) {
          const text = `🔄 <b>Автоматически начислен регулярный долг:</b>\n\n` +
            `📌 <b>${newRecurring.name}</b> (Аренда / Подписка)\n` +
            `💰 Сумма: <b>${formatMoney(newRecurring.amount)} ${newRecurring.currency}</b>\n` +
            `📅 Новый срок возврата: <b>${newRecurring.dueDate}</b>\n\n` +
            `<i>Запись автоматически добавлена в базу данных.</i>`;
          await sendTelegramMessage(schedule.chatId, text);
        }
        console.log(`[Recurring] Created new monthly debt: ${newRecurring.name}`);
      }
    }
  }

  if (changed) {
    saveStoredDebts(debts);
  }
}

// 3. Scheduled Daily/Weekly Dispatch Engine (Sends to all registered owners)
async function checkAndSendScheduledReports() {
  const schedule = getStoredSchedule();
  if (schedule.frequency === 'off') {
    return;
  }

  const owners = getStoredOwners();
  const targetChats = new Set<string>();
  if (schedule.chatId) targetChats.add(schedule.chatId);
  for (const o of owners) {
    if (o.id) targetChats.add(o.id);
  }

  if (targetChats.size === 0) {
    return;
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (schedule.lastSentDate === todayStr) {
    return;
  }

  const [targetH, targetM] = (schedule.time || '09:00').split(':').map((n) => parseInt(n, 10));
  const currentH = now.getHours();
  const currentM = now.getMinutes();

  const timeArrived = currentH > targetH || (currentH === targetH && currentM >= targetM);
  if (!timeArrived) {
    return;
  }

  if (schedule.frequency === 'weekly' && now.getDay() !== 1) {
    return;
  }

  console.log(`[Scheduler] Triggering ${schedule.frequency} report to ${targetChats.size} owners...`);
  const debts = getStoredDebts();
  const title = schedule.frequency === 'weekly' ? 'Еженедельный отчет по долгам' : 'Ежедневный утренний отчет по долгам';

  for (const targetChat of targetChats) {
    const res = await sendTelegramReport(targetChat, debts, title);
    if (res.ok) {
      console.log(`[Scheduler] Report sent successfully to ${targetChat}!`);
    } else {
      console.error(`[Scheduler] Failed to send report to ${targetChat}:`, res.description);
    }
  }

  schedule.lastSentDate = todayStr;
  saveStoredSchedule(schedule);
}

// Run automations loop every 60 seconds
setInterval(() => {
  checkAndSendScheduledReports().catch((e) => console.error('Scheduler error:', e));
  processDueReminders().catch((e) => console.error('Reminders error:', e));
  processRecurringDebts().catch((e) => console.error('Recurring error:', e));
}, 60 * 1000);

// Telegram Bot Polling with strict 2-owner access control
let botOffset = 0;
let isPolling = false;

async function startTelegramBotPolling() {
  if (isPolling) return;
  isPolling = true;

  console.log('[Bot Polling] Started Telegram Bot poller with 2-owner authorization control...');

  while (isPolling) {
    try {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${botOffset}&timeout=25`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          botOffset = update.update_id + 1;
          const msg = update.message;
          if (!msg || !msg.text) continue;

          const rawText = msg.text.trim();
          const cmd = rawText.toLowerCase();
          const chatId = String(msg.chat.id);
          const fromId = String(msg.from?.id || msg.chat.id);
          const firstName = msg.from?.first_name || 'Владелец';
          const username = msg.from?.username;

          let owners = getStoredOwners();

          // 1. Auto-bootstrap: First user to message the bot becomes Primary Owner
          if (owners.length === 0) {
            const primaryOwner: ShopOwner = {
              id: fromId,
              name: firstName,
              username: username,
              role: 'primary',
              addedAt: new Date().toISOString(),
            };
            owners = [primaryOwner];
            saveStoredOwners(owners);

            const schedule = getStoredSchedule();
            schedule.chatId = fromId;
            saveStoredSchedule(schedule);
            console.log(`[Owners] Registered primary owner: ${firstName} (ID: ${fromId})`);
          }

          // 2. Access Control: strictly check if sender is one of the 2 authorized owners
          const senderIsOwner = owners.some((o) => o.id === fromId || o.id === chatId);
          if (!senderIsOwner) {
            // Unauthorized user: Block all data and commands
            const deniedText =
              `⛔ <b>Доступ ограничен</b>\n\n` +
              `Этот бот и финансовая база магазина являются приватными и доступны только <b>2 владельцам магазина «1000 мелочей»</b>.\n\n` +
              `👤 <b>Ваш Telegram ID:</b> <code>${fromId}</code>\n\n` +
              `<i>Просмотр долгов, чеков и отчетов заблокирован.\n` +
              `Если вы являетесь совладельцем магазина, передайте ваш ID главному владельцу для добавления командой:</i>\n` +
              `<code>/addowner ${fromId}</code>`;

            await sendTelegramMessage(chatId, deniedText, {
              customKeyboard: {
                remove_keyboard: true,
              },
            });
            continue;
          }

          // 3. Sender is an authorized owner -> Process owner commands
          const ownerIndex = owners.findIndex((o) => o.id === fromId || o.id === chatId);
          const roleTitle = ownerIndex === 0 ? '👑 Владелец №1' : '👤 Владелец №2';
          const secondOwner = owners[1];

          // Command: /start
          if (cmd.startsWith('/start')) {
            const schedule = getStoredSchedule();
            if (!schedule.chatId) {
              schedule.chatId = chatId;
              saveStoredSchedule(schedule);
            }

            let ownersListText = `👥 <b>Владельцы магазина (максимум 2):</b>\n` +
              `1. 👑 <b>${owners[0].name}</b> (ID: <code>${owners[0].id}</code>)\n`;
            if (secondOwner) {
              ownersListText += `2. 👤 <b>${secondOwner.name}</b> (ID: <code>${secondOwner.id}</code>)\n` +
                `<i>🔒 Система защищена: оба владельца подключены. Посторонние заблокированы.</i>`;
            } else {
              ownersListText += `2. <i>Не назначен</i>\n\n` +
                `👉 <b>Чтобы добавить второго владельца магазина</b>, отправьте команду:\n` +
                `<code>/addowner ID_ПОЛЬЗОВАТЕЛЯ</code>\n(например: <code>/addowner 987654321</code>)`;
            }

            const welcome = `👋 <b>Здравствуйте, ${firstName}!</b>\n\n` +
              `Вы авторизованы как <b>${roleTitle}</b> магазина «1000 мелочей».\n\n` +
              `🛡️ <b>Приватный режим активен:</b> Посторонние лица не могут видеть долги, балансы или выгружать отчеты.\n\n` +
              `${ownersListText}\n\n` +
              `🔘 <b>Быстрые команды бота:</b>\n` +
              `• <b>/report</b> — Скачать свежий Excel/CSV отчет\n` +
              `• <b>/stats</b> — Краткая сводка баланса\n` +
              `• <b>/daily</b> — Включить утренний отчет (09:00)\n` +
              `• <b>/weekly</b> — Включить еженедельный отчет по понедельникам\n` +
              `• <b>/stop</b> — Отключить авторассылку\n` +
              `• <b>/owners</b> — Список владельцев магазина\n` +
              `• <b>/addowner ID</b> — Добавить второго владельца\n` +
              `• <b>/removeowner ID</b> — Удалить второго владельца\n\n` +
              `Нажмите кнопку ниже, чтобы открыть приложение:`;

            await sendTelegramMessage(chatId, welcome);
          }
          // Command: /addowner <ID> [Name]
          else if (cmd.startsWith('/addowner')) {
            const parts = rawText.split(/\s+/);
            const targetId = parts[1]?.trim();
            const targetName = parts.slice(2).join(' ').trim() || 'Второй владелец';

            if (!targetId) {
              await sendTelegramMessage(
                chatId,
                `ℹ️ <b>Как добавить второго владельца магазина:</b>\n\n` +
                `Отправьте команду с его Telegram ID:\n` +
                `<code>/addowner 123456789</code>\n\n` +
                `<i>Подсказка: второй человек может написать любое сообщение этому боту, и бот сразу покажет его точный Telegram ID!</i>`
              );
            } else if (owners.length >= 2 && !owners.some((o) => o.id === targetId)) {
              await sendTelegramMessage(
                chatId,
                `⚠️ <b>Уже зарегистрированы 2 владельца:</b>\n\n` +
                `1. 👑 ${owners[0].name} (ID: <code>${owners[0].id}</code>)\n` +
                `2. 👤 ${owners[1].name} (ID: <code>${owners[1].id}</code>)\n\n` +
                `Чтобы сменить второго владельца, сначала удалите его:\n` +
                `<code>/removeowner ${owners[1].id}</code>`
              );
            } else if (owners.some((o) => o.id === targetId)) {
              await sendTelegramMessage(
                chatId,
                `ℹ️ Пользователь с ID <code>${targetId}</code> уже зарегистрирован в списке владельцев.`
              );
            } else {
              const newOwner: ShopOwner = {
                id: targetId,
                name: targetName,
                role: 'secondary',
                addedAt: new Date().toISOString(),
              };
              owners.push(newOwner);
              saveStoredOwners(owners);

              await sendTelegramMessage(
                chatId,
                `✅ <b>Второй владелец магазина успешно добавлен!</b>\n\n` +
                `👤 <b>Имя:</b> ${targetName}\n` +
                `🆔 <b>Telegram ID:</b> <code>${targetId}</code>\n\n` +
                `🔒 Теперь доступ к базе магазина, WebApp и боту открыт ровно для <b>2 владельцев</b>. Все остальные пользователи полностью заблокированы.`
              );

              // Notify the newly authorized owner
              try {
                await sendTelegramMessage(
                  targetId,
                  `🎉 <b>Вам предоставлен доступ совладельца магазина «1000 мелочей»!</b>\n\n` +
                  `Главный владелец добавил ваш Telegram ID (<code>${targetId}</code>).\n` +
                  `Теперь вы можете пользоваться ботом, скачивать отчеты и открывать WebApp долгов и расчетов.`
                );
              } catch (e) {
                // Ignore if bot was not yet started by user
              }
            }
          }
          // Command: /removeowner <ID>
          else if (cmd.startsWith('/removeowner')) {
            const parts = rawText.split(/\s+/);
            const targetId = parts[1]?.trim();

            if (!targetId) {
              await sendTelegramMessage(
                chatId,
                `ℹ️ Укажите Telegram ID для удаления, например:\n<code>/removeowner ${owners[1]?.id || '123456789'}</code>`
              );
            } else if (owners.length <= 1) {
              await sendTelegramMessage(chatId, `⚠️ Нельзя удалить единственного владельца.`);
            } else {
              const updated = owners.filter((o) => o.id !== targetId);
              if (updated.length === owners.length) {
                await sendTelegramMessage(chatId, `❌ Владелец с ID <code>${targetId}</code> не найден.`);
              } else {
                owners = updated;
                saveStoredOwners(owners);
                await sendTelegramMessage(
                  chatId,
                  `✅ Владелец с ID <code>${targetId}</code> удален. Теперь вы можете добавить нового владельца командой /addowner.`
                );
              }
            }
          }
          // Command: /owners
          else if (cmd === '/owners' || cmd === 'owners') {
            let ownersText = `👥 <b>Владельцы магазина (максимум 2):</b>\n\n`;
            owners.forEach((o, idx) => {
              const icon = idx === 0 ? '👑' : '👤';
              const title = idx === 0 ? 'Главный владелец (Владелец №1)' : 'Совладелец (Владелец №2)';
              ownersText += `${icon} <b>${title}:</b>\n   Имя: ${o.name}\n   ID: <code>${o.id}</code>${o.username ? ` (@${o.username})` : ''}\n\n`;
            });
            if (owners.length < 2) {
              ownersText += `<i>Место 2-го владельца свободно. Добавьте его:</i>\n<code>/addowner ID_ПОЛЬЗОВАТЕЛЯ</code>`;
            } else {
              ownersText += `<i>🔒 Приватный режим активен. Посторонние лица заблокированы.</i>`;
            }
            await sendTelegramMessage(chatId, ownersText);
          }
          // Command: /report
          else if (cmd.includes('/report') || cmd === 'report' || cmd === '/export') {
            const debts = getStoredDebts();
            await sendTelegramReport(chatId, debts, 'Запрошенный отчет по долгам');
          }
          // Command: /stats
          else if (cmd.includes('/stats') || cmd === 'stats') {
            const debts = getStoredDebts();
            const summary = generateTextSummary(debts, 'Текущая сводка по долгам');
            await sendTelegramMessage(chatId, summary);
          }
          // Command: /daily
          else if (cmd.includes('/daily') || cmd === 'daily') {
            const schedule = getStoredSchedule();
            schedule.chatId = chatId;
            schedule.frequency = 'daily';
            saveStoredSchedule(schedule);

            await sendTelegramMessage(
              chatId,
              '✅ <b>Ежедневные отчеты включены!</b>\nКаждое утро в 09:00 бот будет присылать файл Excel/CSV обоим владельцам магазина.'
            );
          }
          // Command: /weekly
          else if (cmd.includes('/weekly') || cmd === 'weekly') {
            const schedule = getStoredSchedule();
            schedule.chatId = chatId;
            schedule.frequency = 'weekly';
            saveStoredSchedule(schedule);

            await sendTelegramMessage(
              chatId,
              '✅ <b>Еженедельные отчеты включены!</b>\nКаждый понедельник бот будет присылать файл Excel/CSV со сводкой за неделю обоим владельцам магазина.'
            );
          }
          // Command: /stop
          else if (cmd.includes('/stop') || cmd === 'stop') {
            const schedule = getStoredSchedule();
            schedule.frequency = 'off';
            saveStoredSchedule(schedule);

            await sendTelegramMessage(
              chatId,
              '⏹ <b>Автоматическая отправка отчетов отключена.</b>\nВы в любой момент можете запросить отчет кнопкой /report или включить рассылку через /daily.'
            );
          }
        }
      }
    } catch (err) {
      await new Promise((r) => setTimeout(r, 4000));
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

// Start polling
startTelegramBotPolling().catch((e) => console.error('Bot polling error:', e));

// --- REST API ENDPOINTS ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Shop Owners Access Management
app.get('/api/owners', (req, res) => {
  const owners = getStoredOwners();
  const userId = String(req.headers['x-telegram-user-id'] || req.query.userId || '').trim();
  const isOwner = owners.length === 0 || owners.some((o) => o.id === userId);
  res.json({
    ok: true,
    owners,
    isOwner,
    currentUserId: userId,
    maxOwners: 2,
    count: owners.length,
  });
});

app.post('/api/owners/add', (req, res) => {
  const { id, name, username, requesterId } = req.body;
  if (!id) {
    return res.status(400).json({ ok: false, error: 'Telegram ID обязателен' });
  }
  const cleanId = String(id).trim();
  let owners = getStoredOwners();

  // If owners already exist, verify requester is an owner
  if (owners.length > 0 && requesterId) {
    if (!owners.some((o) => o.id === String(requesterId).trim())) {
      return res.status(403).json({ ok: false, error: 'Только действующий владелец может добавлять доступ' });
    }
  }

  if (owners.length >= 2 && !owners.some((o) => o.id === cleanId)) {
    return res.status(400).json({
      ok: false,
      error: 'Уже зарегистрированы 2 владельца магазина. Сначала удалите одного для замены.',
    });
  }

  if (owners.some((o) => o.id === cleanId)) {
    return res.json({ ok: true, message: 'Пользователь уже является владельцем', owners });
  }

  const newOwner: ShopOwner = {
    id: cleanId,
    name: name?.trim() || 'Совладелец',
    username: username?.trim(),
    role: owners.length === 0 ? 'primary' : 'secondary',
    addedAt: new Date().toISOString(),
  };
  owners.push(newOwner);
  saveStoredOwners(owners);

  return res.json({ ok: true, owners });
});

app.post('/api/owners/remove', (req, res) => {
  const { id, requesterId } = req.body;
  const cleanId = String(id).trim();
  let owners = getStoredOwners();

  if (owners.length > 0 && requesterId) {
    if (!owners.some((o) => o.id === String(requesterId).trim())) {
      return res.status(403).json({ ok: false, error: 'Только действующий владелец может изменять доступ' });
    }
  }

  if (owners.length <= 1) {
    return res.status(400).json({ ok: false, error: 'Нельзя удалить единственного владельца' });
  }

  const updated = owners.filter((o) => o.id !== cleanId);
  saveStoredOwners(updated);
  return res.json({ ok: true, owners: updated });
});

// Sync debts between client and server database
app.get('/api/debts', (req, res) => {
  const owners = getStoredOwners();
  const userId = String(req.headers['x-telegram-user-id'] || req.query.userId || '').trim();
  if (owners.length > 0 && userId && !owners.some((o) => o.id === userId)) {
    return res.status(403).json({
      ok: false,
      error: 'Доступ ограничен: только для 2 авторизованных владельцев магазина.',
    });
  }

  const debts = getStoredDebts();
  res.json({ ok: true, debts });
});

app.post('/api/debts/sync', (req, res) => {
  const owners = getStoredOwners();
  const userId = String(req.headers['x-telegram-user-id'] || req.body.userId || '').trim();
  if (owners.length > 0 && userId && !owners.some((o) => o.id === userId)) {
    return res.status(403).json({
      ok: false,
      error: 'Доступ ограничен: только для 2 авторизованных владельцев магазина.',
    });
  }

  const { debts } = req.body;
  if (Array.isArray(debts)) {
    saveStoredDebts(debts);
    return res.json({ ok: true, count: debts.length });
  }
  return res.status(400).json({ ok: false, error: 'Expected array of debts' });
});

// Report Schedule endpoints
app.get('/api/reports/schedule', (req, res) => {
  const schedule = getStoredSchedule();
  res.json({ ok: true, schedule });
});

app.post('/api/reports/schedule', (req, res) => {
  const { frequency, chatId, time, includeSettled, autoRemind24h, autoRemindDueDay } = req.body;
  const current = getStoredSchedule();

  const updated: ScheduleConfig = {
    ...current,
    frequency: frequency || current.frequency,
    chatId: chatId !== undefined ? chatId : current.chatId,
    time: time || current.time,
    includeSettled: includeSettled !== undefined ? Boolean(includeSettled) : current.includeSettled,
    autoRemind24h: autoRemind24h !== undefined ? Boolean(autoRemind24h) : current.autoRemind24h,
    autoRemindDueDay: autoRemindDueDay !== undefined ? Boolean(autoRemindDueDay) : current.autoRemindDueDay,
  };

  saveStoredSchedule(updated);
  res.json({ ok: true, schedule: updated });
});

// Trigger instant report dispatch to Telegram
app.post('/api/reports/send-now', async (req, res) => {
  const { chatId: customChatId, title = 'Внеочередной отчет по долгам', includeSettled = true } = req.body;
  const schedule = getStoredSchedule();
  const targetChatId = customChatId || schedule.chatId;

  if (!targetChatId) {
    return res.status(400).json({
      ok: false,
      description: 'Укажите Telegram Chat ID для отправки отчета',
    });
  }

  const debts = getStoredDebts();
  const result = await sendTelegramReport(targetChatId, debts, title);

  if (result.ok) {
    schedule.lastSentDate = new Date().toISOString().split('T')[0];
    saveStoredSchedule(schedule);
  }

  return res.json(result);
});

// Direct CSV download
app.get('/api/reports/download.csv', (req, res) => {
  const debts = getStoredDebts();
  const csv = generateCSVReport(debts, true);
  const dateStr = new Date().toISOString().split('T')[0];

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="debts_report_${dateStr}.csv"`);
  res.send(csv);
});

// Telegram Bot: Check token info
app.get('/api/telegram/bot-info', async (req, res) => {
  const token = (req.query.token as string) || process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ ok: false, error: String(error) });
  }
});

// Telegram Bot: Send text message
app.post('/api/telegram/send-message', async (req, res) => {
  const { chatId, text, parseMode = 'HTML', token: customToken } = req.body;
  const token = customToken || process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;

  if (!chatId || !text) {
    return res.status(400).json({ ok: false, description: 'chatId and text are required' });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        reply_markup: PERMANENT_KEYBOARD,
      }),
    });

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ ok: false, description: String(error) });
  }
});

// Telegram Bot: Send photo / receipt
app.post('/api/telegram/send-photo', async (req, res) => {
  const { chatId, photo, caption, parseMode = 'HTML', token: customToken } = req.body;
  const token = customToken || process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;

  if (!chatId || !photo) {
    return res.status(400).json({ ok: false, description: 'chatId and photo are required' });
  }

  try {
    if (typeof photo === 'string' && photo.startsWith('data:')) {
      const parts = photo.split(';base64,');
      const contentType = parts[0].split(':')[1] || 'image/jpeg';
      const buffer = Buffer.from(parts[1], 'base64');
      const blob = new Blob([buffer], { type: contentType });

      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('photo', blob, 'receipt.jpg');
      if (caption) {
        formData.append('caption', caption);
        formData.append('parse_mode', parseMode);
      }
      formData.append('reply_markup', JSON.stringify(PERMANENT_KEYBOARD));

      const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      return res.json(data);
    } else {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo,
          caption,
          parse_mode: parseMode,
          reply_markup: PERMANENT_KEYBOARD,
        }),
      });

      const data = await response.json();
      return res.json(data);
    }
  } catch (error) {
    return res.status(500).json({ ok: false, description: String(error) });
  }
});

// Download clean repository archive for GitHub upload
app.get('/api/project/archive', async (req, res) => {
  try {
    const { execSync } = await import('child_process');
    const archivePath = '/tmp/telegram-debts-tracker.tar.gz';
    execSync('git archive --format=tar.gz --prefix=telegram-debts-tracker/ HEAD -o ' + archivePath, { cwd: __dirname });
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', 'attachment; filename="telegram-debts-tracker.tar.gz"');
    const stream = fs.createReadStream(archivePath);
    stream.pipe(res);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Setup Vite middleware in dev or static serve in prod
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Telegram WebApp Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

import { TelegramWebAppUser } from '../types/debt';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id?: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
          query_id?: string;
          start_param?: string;
        };
        colorScheme?: 'light' | 'dark';
        themeParams?: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        isExpanded?: boolean;
        viewportHeight?: number;
        viewportStableHeight?: number;
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        enableClosingConfirmation?: () => void;
        sendData?: (data: string) => void;
        openTelegramLink?: (url: string) => void;
        openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        MainButton?: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
        BackButton?: {
          isVisible: boolean;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
          show: () => void;
          hide: () => void;
        };
      };
    };
  }
}

export function isInsideTelegram(): boolean {
  return typeof window !== 'undefined' && Boolean(window.Telegram?.WebApp?.initData);
}

export function getTelegramWebApp() {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
}

export function getTelegramUser(): TelegramWebAppUser {
  const tg = getTelegramWebApp();
  if (tg?.initDataUnsafe?.user) {
    return tg.initDataUnsafe.user;
  }
  return {
    first_name: 'Пользователь',
    username: 'tg_user',
  };
}

export function initTelegramApp(onThemeChange?: (isDark: boolean) => void) {
  const tg = getTelegramWebApp();
  if (!tg) return;

  try {
    tg.ready();
    tg.expand();
    if (tg.enableClosingConfirmation) {
      tg.enableClosingConfirmation();
    }

    if (tg.setHeaderColor) {
      tg.setHeaderColor(tg.colorScheme === 'dark' ? '#0f172a' : '#f8fafc');
    }
    if (tg.setBackgroundColor) {
      tg.setBackgroundColor(tg.colorScheme === 'dark' ? '#020617' : '#f8fafc');
    }

    if (onThemeChange && tg.colorScheme) {
      onThemeChange(tg.colorScheme === 'dark');
    }
  } catch (err) {
    console.warn('Error initializing Telegram WebApp:', err);
  }
}

export function triggerHaptic(
  type: 'light' | 'medium' | 'heavy' | 'impact' | 'selection' | 'success' | 'warning' | 'error'
) {
  const tg = getTelegramWebApp();
  if (!tg?.HapticFeedback) return;

  try {
    if (type === 'selection') {
      tg.HapticFeedback.selectionChanged();
    } else if (type === 'success' || type === 'warning' || type === 'error') {
      tg.HapticFeedback.notificationOccurred(type);
    } else if (type === 'impact') {
      tg.HapticFeedback.impactOccurred('medium');
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch (e) {
    // Graceful fallback
  }
}

let activeMainButtonClick: (() => void) | null = null;

export function configureMainButton(options: {
  text: string;
  onClick: () => void;
  color?: string;
  textColor?: string;
  isVisible?: boolean;
}) {
  const tg = getTelegramWebApp();
  if (!tg?.MainButton) return;

  try {
    if (activeMainButtonClick) {
      tg.MainButton.offClick(activeMainButtonClick);
    }

    activeMainButtonClick = options.onClick;
    tg.MainButton.setText(options.text);
    if (options.color) tg.MainButton.color = options.color;
    if (options.textColor) tg.MainButton.textColor = options.textColor;
    tg.MainButton.onClick(activeMainButtonClick);

    if (options.isVisible !== false) {
      tg.MainButton.show();
    } else {
      tg.MainButton.hide();
    }
  } catch (e) {
    console.warn('Telegram MainButton configure failed', e);
  }
}

export function hideMainButton() {
  const tg = getTelegramWebApp();
  if (!tg?.MainButton) return;
  try {
    if (activeMainButtonClick) {
      tg.MainButton.offClick(activeMainButtonClick);
      activeMainButtonClick = null;
    }
    tg.MainButton.hide();
  } catch (e) {
    // Ignore
  }
}

let activeBackButtonClick: (() => void) | null = null;

export function configureBackButton(onClick: () => void, isVisible = true) {
  const tg = getTelegramWebApp();
  if (!tg?.BackButton) return;
  try {
    if (activeBackButtonClick) {
      tg.BackButton.offClick(activeBackButtonClick);
    }
    activeBackButtonClick = onClick;
    tg.BackButton.onClick(activeBackButtonClick);
    if (isVisible) {
      tg.BackButton.show();
    } else {
      tg.BackButton.hide();
    }
  } catch (e) {
    console.warn('Telegram BackButton configure failed', e);
  }
}

export function hideBackButton() {
  const tg = getTelegramWebApp();
  if (!tg?.BackButton) return;
  try {
    if (activeBackButtonClick) {
      tg.BackButton.offClick(activeBackButtonClick);
      activeBackButtonClick = null;
    }
    tg.BackButton.hide();
  } catch (e) {
    // Ignore
  }
}

export function shareToTelegram(text: string, url = '') {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  const shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;

  const tg = getTelegramWebApp();
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(shareUrl);
  } else {
    window.open(shareUrl, '_blank');
  }
}

export function sendTelegramData(payload: unknown) {
  const tg = getTelegramWebApp();
  if (tg?.sendData) {
    tg.sendData(JSON.stringify(payload));
  }
}

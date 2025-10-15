import type { LOCALES } from '@/types/general';

type CalendarKeys =
  | 'notes'
  | 'coaches'
  | 'own'
  | 'type'
  | 'link'
  | 'defaultCalendarName'
  | 'defaultCalendarDesc'
  | 'reminder';

export const calendarI18n: Record<LOCALES, Record<CalendarKeys, string>> = {
  en: {
    notes: 'Notes',
    coaches: 'Coaches',
    own: 'Own',
    type: 'Type',
    link: 'Link',
    defaultCalendarName: 'Team Calendar',
    defaultCalendarDesc: 'Auto-generated subscription',
    reminder: 'Reminder',
  },
  fi: {
    notes: 'Muistiinpanot',
    coaches: 'Valmentajien muistiinpanot',
    own: 'Omat muistiinpanot',
    type: 'Tyyppi',
    link: 'Linkki',
    defaultCalendarName: 'Joukkuekalenteri',
    defaultCalendarDesc: 'Automaattisesti luotu tilaus',
    reminder: 'Muistutus',
  },
};

export const tCal = (key: CalendarKeys, locale: LOCALES): string => {
  const byLang = calendarI18n[locale] || calendarI18n.en;
  return byLang[key] || calendarI18n.en[key];
};

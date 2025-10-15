import type { Language } from '@/locales/emailTranslations';
import type { ROLES } from '@/types/team';
import type { EVENT_TYPE } from '@/types/event';

const ROLE_LABELS: Record<Language, Record<ROLES, string>> = {
  en: {
    owner: 'owner',
    admin: 'admin',
    coach: 'coach',
    athlete: 'athlete',
    guardian: 'guardian',
  },
  fi: {
    owner: 'omistaja',
    admin: 'ylläpitäjä',
    coach: 'valmentaja',
    athlete: 'urheilija',
    guardian: 'huoltaja',
  }
};

export const localizeRole = (role: ROLES, lang: Language): string => {
  const byLang = ROLE_LABELS[lang] || ROLE_LABELS.en;
  return byLang[role] || role;
};

// Event type labels; extend as needed
export const EVENT_TYPE_LABELS: Record<Language, Record<string, string>> = {
  en: {
    practise: 'Practice',
    match: 'Match',
    meeting: 'Meeting',
    self_training: 'Self directed training',
    other_event: 'Other event',
  },
  fi: {
    practise: 'Harjoitus',
    match: 'Ottelu',
    meeting: 'Kokous',
    self_training: 'Omatoiminen harjoitus',
    other_event: 'Muu tapahtuma',
  }
};

export const localizeEventType = (type: EVENT_TYPE | string | null | undefined, lang: Language): string => {
  if (!type) return lang === 'fi' ? 'Tapahtuma' : 'Event';
  const byLang = EVENT_TYPE_LABELS[lang] || EVENT_TYPE_LABELS.en;
  const key = String(type);
  return byLang[key] || key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
};

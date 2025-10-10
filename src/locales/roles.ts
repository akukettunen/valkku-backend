import type { Language } from '@/locales/emailTranslations';
import type { ROLES } from '@/schemas/team';

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

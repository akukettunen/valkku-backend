export type Language = 'en' | 'fi';

type TranslationResolver<C extends Record<string, any> = Record<string, any>> = string | ((context: C) => string);

interface TranslationLeaf<C extends Record<string, any> = Record<string, any>> {
  en: TranslationResolver<C>;
  fi: TranslationResolver<C>;
}

type TranslationNode<C extends Record<string, any> = Record<string, any>> = {
  [key: string]: TranslationNode<C> | TranslationLeaf<C>;
};

export type TranslationContext = Record<string, any>;

export const translations: TranslationNode = {
  email: {
    footer: {
      copyright: {
        en: '© 2025 Valkku. All rights reserved.',
        fi: '© 2025 Valkku. Kaikki oikeudet pidätetään.',
      },
      sentTo: {
        en: ({ recipientEmail }: TranslationContext) => `This email was sent to ${recipientEmail}`,
        fi: ({ recipientEmail }: TranslationContext) => `Tämä sähköposti lähetettiin osoitteeseen ${recipientEmail}`,
      },
    },
    teamInvitation: {
      subject: {
        en: ({ teamName }: TranslationContext) => `You've been invited to join ${teamName}`,
        fi: ({ teamName }: TranslationContext) => `Sinut on kutsuttu liittymään joukkueeseen ${teamName}`,
      },
      title: {
        en: 'Team Invitation',
        fi: 'Joukkuekutsu',
      },
      greeting: {
        en: ({ recipientName }: TranslationContext) => (recipientName ? `Hello ${recipientName},` : 'Hello,'),
        fi: ({ recipientName }: TranslationContext) => (recipientName ? `Hei ${recipientName},` : 'Hei,'),
      },
      body: {
        en: ({ inviterName, teamName, role }: TranslationContext) =>
          `<strong>${inviterName}</strong> has invited you to join <strong>${teamName}</strong> as a <strong>${role}</strong>.`,
        fi: ({ inviterName, teamName, role }: TranslationContext) =>
          `<strong>${inviterName}</strong> on kutsunut sinut liittymään joukkueeseen <strong>${teamName}</strong> roolissa <strong>${role}</strong>.`,
      },
      instruction: {
        en: 'Click the button below to accept the invitation:',
        fi: 'Hyväksy kutsu napsauttamalla alla olevaa painiketta:',
      },
      button: {
        en: 'Accept Invitation',
        fi: 'Hyväksy kutsu',
      },
      linkInstruction: {
        en: 'Or copy and paste this link into your browser:',
        fi: 'Tai kopioi ja liitä tämä linkki selaimeesi:',
      },
      expiry: {
        en: 'This invitation will expire in 30 days.',
        fi: 'Tämä kutsu vanhenee 30 päivän kuluttua.',
      },
    },
    passwordReset: {
      subject: {
        en: 'Password Reset Request',
        fi: 'Salasanan nollauspyyntö',
      },
      title: {
        en: 'Password Reset Request',
        fi: 'Salasanan nollauspyyntö',
      },
      greeting: {
        en: ({ userName }: TranslationContext) => (userName ? `Hello ${userName},` : 'Hello,'),
        fi: ({ userName }: TranslationContext) => (userName ? `Hei ${userName},` : 'Hei,'),
      },
      body: {
        en: 'We received a request to reset your password. Click the button below to create a new password:',
        fi: 'Olemme vastaanottaneet pyynnön nollata salasanasi. Luo uusi salasana napsauttamalla alla olevaa painiketta:',
      },
      button: {
        en: 'Reset Password',
        fi: 'Nollaa salasana',
      },
      linkInstruction: {
        en: 'Or copy and paste this link into your browser:',
        fi: 'Tai kopioi ja liitä tämä linkki selaimeesi:',
      },
      note1: {
        en: "If you didn't request a password reset, you can safely ignore this email.",
        fi: 'Jos et pyytänyt salasanan nollausta, voit jättää tämän sähköpostin huomiotta.',
      },
      note2: {
        en: 'This link will expire in 1 hour.',
        fi: 'Tämä linkki vanhenee 1 tunnin kuluttua.',
      },
    },
    welcome: {
      subject: {
        en: 'Welcome to Valkku!',
        fi: 'Tervetuloa Valkkuun!',
      },
      title: {
        en: 'Welcome to Valkku!',
        fi: 'Tervetuloa Valkkuun!',
      },
      greeting: {
        en: ({ userName }: TranslationContext) => `Hello ${userName},`,
        fi: ({ userName }: TranslationContext) => `Hei ${userName},`,
      },
      body1: {
        en: "Thank you for joining Valkku! We're excited to have you on board.",
        fi: 'Kiitos, että liityit Valkkuun! Olemme innoissamme saadessamme sinut mukaan.',
      },
      body2: {
        en: 'You can now access your account and start exploring all the features we have to offer.',
        fi: 'Voit nyt käyttää tiliäsi ja tutustua kaikkiin tarjoamiimme ominaisuuksiin.',
      },
      button: {
        en: 'Get Started',
        fi: 'Aloita',
      },
      support: {
        en: 'If you have any questions, feel free to reach out to our support team.',
        fi: 'Jos sinulla on kysyttävää, ota rohkeasti yhteyttä tukitiimiimme.',
      },
      closing: {
        en: 'Best regards,',
        fi: 'Ystävällisin terveisin,',
      },
      signature: {
        en: 'Aku Kettunen',
        fi: 'Aku Kettunen',
      },
    },
    teamAdded: {
      subject: {
        en: ({ teamName }: TranslationContext) => `You were added to ${teamName}`,
        fi: ({ teamName }: TranslationContext) => `Sinut lisättiin joukkueeseen ${teamName}`,
      },
      title: {
        en: 'Team membership updated',
        fi: 'Joukkuejäsenyys päivitetty',
      },
      greeting: {
        en: ({ recipientName }: TranslationContext) => (recipientName ? `Hello ${recipientName},` : 'Hello,'),
        fi: ({ recipientName }: TranslationContext) => (recipientName ? `Hei ${recipientName},` : 'Hei,'),
      },
      body: {
        en: ({ teamName, role }: TranslationContext) => `You have been added to team <strong>${teamName}</strong> with role <strong>${role}</strong>.`,
        fi: ({ teamName, role }: TranslationContext) => `Sinut on lisätty joukkueeseen <strong>${teamName}</strong> roolilla <strong>${role}</strong>.`,
      },
      button: {
        en: 'Open Team',
        fi: 'Avaa joukkue',
      },
      note: {
        en: 'If this was unexpected, please contact support.',
        fi: 'Jos tämä oli odottamatonta, ota yhteys tukeen.',
      },
    },
  },
};

const isLeaf = (node: TranslationNode | TranslationLeaf): node is TranslationLeaf =>
  typeof node === 'object' && node !== null && 'en' in node && 'fi' in node;

const resolveNode = (
  node: TranslationNode | TranslationLeaf,
  lang: Language,
  context: TranslationContext
): any => {
  if (isLeaf(node)) {
    const value = node[lang];
    return typeof value === 'function' ? value(context) : value;
  }

  return Object.keys(node).reduce<Record<string, any>>((acc, key) => {
    acc[key] = resolveNode(node[key] as TranslationNode | TranslationLeaf, lang, context);
    return acc;
  }, {});
};

export const getTranslations = (
  path: string,
  lang: Language,
  context: TranslationContext = {}
): Record<string, any> => {
  const keys = path.split('.');
  let node: TranslationNode | TranslationLeaf | undefined = translations;

  for (const key of keys) {
    node = (node as TranslationNode)?.[key] as TranslationNode | TranslationLeaf | undefined;
    if (!node) {
      throw new Error(`Missing translation node for path: ${path}`);
    }
  }

  return resolveNode(node, lang, context);
};

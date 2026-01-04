import { useState, useEffect, useCallback } from 'react';

const translations = {
  en: {
    'common.back': 'Back',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.confirm': 'Confirm',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    
    'settings.title': 'Settings',
    'settings.account': 'Account',
    'settings.privacy': 'Privacy',
    'settings.notifications': 'Notifications',
    'settings.theme': 'Theme & Appearance',
    'settings.language': 'Language & Region',
    'settings.help': 'Help & About',
    'settings.revert': 'Revert Changes',
    'settings.revertChanges': 'Revert all unsaved changes',
    
    'account.title': 'Account Settings',
    'account.profile': 'Profile Information',
    'account.email': 'Email',
    'account.phone': 'Phone',
    'account.username': 'Username',
    'account.displayName': 'Display Name',
    'account.changeEmail': 'Change Email',
    'account.changePassword': 'Change Password',
    'account.deleteAccount': 'Delete Account',
    'account.exportData': 'Export Your Data',
    
    'privacy.title': 'Privacy Settings',
    'privacy.privateAccount': 'Private Account',
    'privacy.showActivityStatus': 'Show Activity Status',
    'privacy.allowMessages': 'Allow Message Requests',
    'privacy.allowCalls': 'Allow Calls',
    'privacy.allowTags': 'Allow Tags',
    'privacy.allowMentions': 'Allow Mentions',
    'privacy.discoverable': 'Discoverable',
    'privacy.blockedUsers': 'Blocked Users',
    
    'notifications.title': 'Notification Settings',
    'notifications.push': 'Push Notifications',
    'notifications.likes': 'Likes',
    'notifications.comments': 'Comments',
    'notifications.messages': 'Messages',
    'notifications.tags': 'Tags',
    'notifications.followers': 'New Followers',
    'notifications.calls': 'Call Invites',
    'notifications.stories': 'Stories',
    'notifications.boltz': 'Boltz',
    'notifications.flash': 'Flash',
    
    'theme.title': 'Theme & Appearance',
    'theme.mode': 'Theme Mode',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.auto': 'Auto (System)',
    'theme.fontSize': 'Font Size',
    'theme.small': 'Small',
    'theme.medium': 'Medium',
    'theme.large': 'Large',
    'theme.highContrast': 'High Contrast',
    'theme.reduceMotion': 'Reduce Motion',
    
    'language.title': 'Language & Region',
    'language.selectLanguage': 'Select Language',
    'language.selectRegion': 'Select Region',
    
    'help.title': 'Help & About',
    'help.version': 'Version',
    'help.documentation': 'Documentation',
    'help.feedback': 'Send Feedback',
    'help.reportBug': 'Report a Bug',
    'help.privacy': 'Privacy Policy',
    'help.terms': 'Terms of Service',
    
    'logout.button': 'Log Out',
    'logout.confirm': 'Are you sure you want to log out?',
  },
  es: {
    'common.back': 'Atrás',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.confirm': 'Confirmar',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    
    'settings.title': 'Configuración',
    'settings.account': 'Cuenta',
    'settings.privacy': 'Privacidad',
    'settings.notifications': 'Notificaciones',
    'settings.theme': 'Tema y Apariencia',
    'settings.language': 'Idioma y Región',
    'settings.help': 'Ayuda y Acerca de',
    'settings.revert': 'Revertir Cambios',
  },
  fr: {
    'common.back': 'Retour',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.confirm': 'Confirmer',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    
    'settings.title': 'Paramètres',
    'settings.account': 'Compte',
    'settings.privacy': 'Confidentialité',
    'settings.notifications': 'Notifications',
    'settings.theme': 'Thème et Apparence',
    'settings.language': 'Langue et Région',
    'settings.help': 'Aide et À propos',
  },
  de: {
    'common.back': 'Zurück',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.confirm': 'Bestätigen',
    'common.loading': 'Laden...',
    'common.error': 'Fehler',
    'common.success': 'Erfolg',
    
    'settings.title': 'Einstellungen',
    'settings.account': 'Konto',
    'settings.privacy': 'Datenschutz',
    'settings.notifications': 'Benachrichtigungen',
    'settings.theme': 'Design und Erscheinungsbild',
    'settings.language': 'Sprache und Region',
    'settings.help': 'Hilfe und Info',
  }
};

export const useLanguage = () => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('focus-language');
    if (saved && translations[saved]) {
      return saved;
    }
    // Detect browser language
    const browserLang = navigator.language.split('-')[0];
    return translations[browserLang] ? browserLang : 'en';
  });

  const [isRTL, setIsRTL] = useState(false);

  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

  useEffect(() => {
    setIsRTL(rtlLanguages.includes(language));
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', rtlLanguages.includes(language) ? 'rtl' : 'ltr');
  }, [language]);

  const changeLanguage = useCallback((newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
      localStorage.setItem('focus-language', newLanguage);
    }
  }, []);

  const t = useCallback((key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  }, [language]);

  const availableLanguages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'it', name: 'Italian', native: 'Italiano' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'ko', name: 'Korean', native: '한국어' },
    { code: 'zh', name: 'Chinese', native: '中文' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
  ];

  return {
    language,
    changeLanguage,
    t,
    availableLanguages,
    isRTL
  };
};

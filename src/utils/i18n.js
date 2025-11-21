// Simple i18n system for Focus app
import React from 'react';

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.explore': 'Explore',
    'nav.create': 'Create',
    'nav.boltz': 'Boltz',
    'nav.profile': 'Profile',
    'nav.messages': 'Messages',
    'nav.notifications': 'Notifications',
    'nav.settings': 'Settings',
    
    // Common actions
    'action.like': 'Like',
    'action.comment': 'Comment',
    'action.share': 'Share',
    'action.follow': 'Follow',
    'action.following': 'Following',
    'action.save': 'Save',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    'action.send': 'Send',
    'action.post': 'Post',
    
    // Time formats
    'time.now': 'now',
    'time.minutes': 'm',
    'time.hours': 'h',
    'time.days': 'd',
    'time.weeks': 'w',
    
    // Placeholders
    'placeholder.search': 'Search...',
    'placeholder.comment': 'Add a comment...',
    'placeholder.message': 'Type a message...',
    'placeholder.caption': 'Write a caption...',
    
    // Messages
    'message.loading': 'Loading...',
    'message.no_posts': 'No posts yet',
    'message.no_messages': 'No messages',
    'message.error': 'Something went wrong',
    'message.success': 'Success!',
    
    // Settings
    'settings.account': 'Account',
    'settings.privacy': 'Privacy',
    'settings.notifications': 'Notifications',
    'settings.security': 'Security',
    'settings.language': 'Language',
    'settings.dark_mode': 'Dark Mode',
    'settings.logout': 'Log Out'
  },
  
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.explore': 'Explorar',
    'nav.create': 'Crear',
    'nav.boltz': 'Boltz',
    'nav.profile': 'Perfil',
    'nav.messages': 'Mensajes',
    'nav.notifications': 'Notificaciones',
    'nav.settings': 'Configuración',
    
    // Common actions
    'action.like': 'Me gusta',
    'action.comment': 'Comentar',
    'action.share': 'Compartir',
    'action.follow': 'Seguir',
    'action.following': 'Siguiendo',
    'action.save': 'Guardar',
    'action.edit': 'Editar',
    'action.delete': 'Eliminar',
    'action.cancel': 'Cancelar',
    'action.confirm': 'Confirmar',
    'action.send': 'Enviar',
    'action.post': 'Publicar',
    
    // Time formats
    'time.now': 'ahora',
    'time.minutes': 'm',
    'time.hours': 'h',
    'time.days': 'd',
    'time.weeks': 's',
    
    // Placeholders
    'placeholder.search': 'Buscar...',
    'placeholder.comment': 'Añadir comentario...',
    'placeholder.message': 'Escribe un mensaje...',
    'placeholder.caption': 'Escribe una descripción...',
    
    // Messages
    'message.loading': 'Cargando...',
    'message.no_posts': 'No hay publicaciones',
    'message.no_messages': 'No hay mensajes',
    'message.error': 'Algo salió mal',
    'message.success': '¡Éxito!',
    
    // Settings
    'settings.account': 'Cuenta',
    'settings.privacy': 'Privacidad',
    'settings.notifications': 'Notificaciones',
    'settings.security': 'Seguridad',
    'settings.language': 'Idioma',
    'settings.dark_mode': 'Modo Oscuro',
    'settings.logout': 'Cerrar Sesión'
  },
  
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.explore': 'Explorer',
    'nav.create': 'Créer',
    'nav.boltz': 'Boltz',
    'nav.profile': 'Profil',
    'nav.messages': 'Messages',
    'nav.notifications': 'Notifications',
    'nav.settings': 'Paramètres',
    
    // Common actions
    'action.like': 'J\'aime',
    'action.comment': 'Commenter',
    'action.share': 'Partager',
    'action.follow': 'Suivre',
    'action.following': 'Suivi',
    'action.save': 'Sauvegarder',
    'action.edit': 'Modifier',
    'action.delete': 'Supprimer',
    'action.cancel': 'Annuler',
    'action.confirm': 'Confirmer',
    'action.send': 'Envoyer',
    'action.post': 'Publier',
    
    // Time formats
    'time.now': 'maintenant',
    'time.minutes': 'm',
    'time.hours': 'h',
    'time.days': 'j',
    'time.weeks': 's',
    
    // Placeholders
    'placeholder.search': 'Rechercher...',
    'placeholder.comment': 'Ajouter un commentaire...',
    'placeholder.message': 'Tapez un message...',
    'placeholder.caption': 'Écrivez une légende...',
    
    // Messages
    'message.loading': 'Chargement...',
    'message.no_posts': 'Aucune publication',
    'message.no_messages': 'Aucun message',
    'message.error': 'Quelque chose s\'est mal passé',
    'message.success': 'Succès!',
    
    // Settings
    'settings.account': 'Compte',
    'settings.privacy': 'Confidentialité',
    'settings.notifications': 'Notifications',
    'settings.security': 'Sécurité',
    'settings.language': 'Langue',
    'settings.dark_mode': 'Mode Sombre',
    'settings.logout': 'Se Déconnecter'
  },
  
  de: {
    // Navigation
    'nav.home': 'Startseite',
    'nav.explore': 'Entdecken',
    'nav.create': 'Erstellen',
    'nav.boltz': 'Boltz',
    'nav.profile': 'Profil',
    'nav.messages': 'Nachrichten',
    'nav.notifications': 'Benachrichtigungen',
    'nav.settings': 'Einstellungen',
    
    // Common actions
    'action.like': 'Gefällt mir',
    'action.comment': 'Kommentieren',
    'action.share': 'Teilen',
    'action.follow': 'Folgen',
    'action.following': 'Folge ich',
    'action.save': 'Speichern',
    'action.edit': 'Bearbeiten',
    'action.delete': 'Löschen',
    'action.cancel': 'Abbrechen',
    'action.confirm': 'Bestätigen',
    'action.send': 'Senden',
    'action.post': 'Posten',
    
    // Time formats
    'time.now': 'jetzt',
    'time.minutes': 'Min',
    'time.hours': 'Std',
    'time.days': 'T',
    'time.weeks': 'W',
    
    // Placeholders
    'placeholder.search': 'Suchen...',
    'placeholder.comment': 'Kommentar hinzufügen...',
    'placeholder.message': 'Nachricht eingeben...',
    'placeholder.caption': 'Beschreibung schreiben...',
    
    // Messages
    'message.loading': 'Wird geladen...',
    'message.no_posts': 'Keine Beiträge',
    'message.no_messages': 'Keine Nachrichten',
    'message.error': 'Etwas ist schief gelaufen',
    'message.success': 'Erfolgreich!',
    
    // Settings
    'settings.account': 'Konto',
    'settings.privacy': 'Datenschutz',
    'settings.notifications': 'Benachrichtigungen',
    'settings.security': 'Sicherheit',
    'settings.language': 'Sprache',
    'settings.dark_mode': 'Dunkler Modus',
    'settings.logout': 'Abmelden'
  }
};

class I18n {
  constructor() {
    this.currentLanguage = this.getStoredLanguage() || this.detectLanguage();
    this.listeners = [];
  }

  getStoredLanguage() {
    return localStorage.getItem('focus_language');
  }

  detectLanguage() {
    const browserLang = navigator.language.split('-')[0];
    return translations[browserLang] ? browserLang : 'en';
  }

  setLanguage(lang) {
    if (translations[lang]) {
      this.currentLanguage = lang;
      localStorage.setItem('focus_language', lang);
      this.notifyListeners();
      
      // Update document language
      document.documentElement.lang = lang;
      
      // Update document direction for RTL languages
      const rtlLanguages = ['ar', 'he', 'fa'];
      document.documentElement.dir = rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
    }
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getAvailableLanguages() {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' }
    ];
  }

  t(key, params = {}) {
    const translation = translations[this.currentLanguage]?.[key] || translations.en[key] || key;
    
    // Simple parameter replacement
    return Object.keys(params).reduce((str, param) => {
      return str.replace(`{{${param}}}`, params[param]);
    }, translation);
  }

  // Pluralization helper
  plural(key, count, params = {}) {
    const pluralKey = count === 1 ? `${key}.singular` : `${key}.plural`;
    return this.t(pluralKey, { ...params, count });
  }

  // Date formatting
  formatDate(date, format = 'short') {
    const d = new Date(date);
    const options = {
      short: { month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      time: { hour: '2-digit', minute: '2-digit' }
    };
    
    return d.toLocaleDateString(this.currentLanguage, options[format]);
  }

  // Time ago formatting
  timeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (seconds < 60) return this.t('time.now');
    if (minutes < 60) return `${minutes}${this.t('time.minutes')}`;
    if (hours < 24) return `${hours}${this.t('time.hours')}`;
    if (days < 7) return `${days}${this.t('time.days')}`;
    return `${weeks}${this.t('time.weeks')}`;
  }

  // Number formatting
  formatNumber(num) {
    return new Intl.NumberFormat(this.currentLanguage).format(num);
  }

  // Subscribe to language changes
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentLanguage));
  }
}

// Create singleton instance
const i18n = new I18n();

// React hook for using i18n
export const useTranslation = () => {
  const [language, setLanguage] = React.useState(i18n.getCurrentLanguage());

  React.useEffect(() => {
    const unsubscribe = i18n.subscribe(setLanguage);
    return unsubscribe;
  }, []);

  return {
    t: i18n.t.bind(i18n),
    language,
    setLanguage: i18n.setLanguage.bind(i18n),
    availableLanguages: i18n.getAvailableLanguages(),
    timeAgo: i18n.timeAgo.bind(i18n),
    formatDate: i18n.formatDate.bind(i18n),
    formatNumber: i18n.formatNumber.bind(i18n)
  };
};

export default i18n;
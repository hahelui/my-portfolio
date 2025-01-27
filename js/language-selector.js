// Language translations
const translations = {
  fr: {
    greeting: "Bonjour, je suis",
    name: "Cheikh Hachem Said",
    role: "Développeur Full Stack",
    about: "À propos",
    experience: "Expérience",
    projects: "Projets",
    contact: "Contact",
    years: "ans",
    developer: "Développeur",
    currentRole: "Poste Actuel",
    clinicDirector: "Directeur de la Clinique De Nouadhibou",
    clinicDesc: "Gestion efficace d'une clinique médicale tout en poursuivant ma passion pour le développement de solutions technologiques innovantes.",
    devDesc: "Développeur passionné avec une solide expérience dans le développement d'applications desktop et mobile. Spécialisé dans la création de solutions innovantes et efficaces.",
    frontendDev: "Développement Frontend",
    backendDev: "Développement Backend",
    experienced: "Expérimenté",
    intermediate: "Intermédiaire",
    basic: "Basique",
    getInTouch: "Entrer en Contact",
    contactMe: "Contactez-moi",
    email: "E-mail",
    whatsapp: "WhatsApp",
    github: "GitHub"
  },
  ar: {
    greeting: "مرحباً، أنا",
    name: "الشيخ هاسم السعيد",
    role: "مطور شامل",
    about: "نبذة عني",
    experience: "الخبرات",
    projects: "المشاريع",
    contact: "اتصل بي",
    years: "سنوات",
    developer: "مطور",
    currentRole: "المنصب الحالي",
    clinicDirector: "مدير عيادة نواذيبو",
    clinicDesc: "إدارة فعالة لعيادة طبية مع متابعة شغفي في تطوير الحلول التكنولوجية المبتكرة",
    devDesc: "مطور شغوف مع خبرة قوية في تطوير تطبيقات سطح المكتب والموبايل. متخصص في إنشاء حلول مبتكرة وفعالة",
    frontendDev: "تطوير الواجهة الأمامية",
    backendDev: "تطوير الخلفية",
    experienced: "خبير",
    intermediate: "متوسط",
    basic: "مبتدئ",
    getInTouch: "تواصل معي",
    contactMe: "راسلني",
    email: "البريد الإلكتروني",
    whatsapp: "واتساب",
    github: "جيت هب"
  },
  en: {
    greeting: "Hello, I'm",
    name: "Cheikh Hachem Said",
    role: "Full Stack Developer",
    about: "About",
    experience: "Experience",
    projects: "Projects",
    contact: "Contact",
    years: "years",
    developer: "Developer",
    currentRole: "Current Position",
    clinicDirector: "Director of Clinique De Nouadhibou",
    clinicDesc: "Efficient management of a medical clinic while pursuing my passion for developing innovative technological solutions.",
    devDesc: "Passionate developer with strong experience in desktop and mobile application development. Specialized in creating innovative and efficient solutions.",
    frontendDev: "Frontend Development",
    backendDev: "Backend Development",
    experienced: "Experienced",
    intermediate: "Intermediate",
    basic: "Basic",
    getInTouch: "Get In Touch",
    contactMe: "Contact Me",
    email: "Email",
    whatsapp: "WhatsApp",
    github: "GitHub"
  }
};

// Get browser language or stored language
function getInitialLanguage() {
  const storedLang = localStorage.getItem('selected-language');
  if (storedLang && translations[storedLang]) {
    return storedLang;
  }
  
  const browserLang = navigator.language || navigator.userLanguage;
  const shortLang = browserLang.split('-')[0];
  return translations[shortLang] ? shortLang : 'fr';
}

// Set initial language
let currentLanguage = getInitialLanguage();
document.documentElement.lang = currentLanguage;

// Update content for the selected language
function updateContent(lang) {
  const content = translations[lang];
  
  // Update hero section
  document.querySelector('#hero h5').textContent = content.greeting;
  document.querySelector('#hero h1').textContent = content.name;
  document.querySelector('#hero p').textContent = content.role;
  
  // Update navigation buttons
  document.querySelector('#grid__tl__btn').textContent = content.about;
  document.querySelector('#grid__tr__btn').textContent = content.experience;
  document.querySelector('#grid__bl__btn').textContent = content.projects;
  document.querySelector('#grid__br__btn').textContent = content.contact;
  
  // Update about section
  const expText = document.querySelector('.cards__content:first-child p');
  expText.innerHTML = `4+ ${content.years}<br>${content.developer}<br>${content.experience}`;
  
  // Update the Experience heading in about section
  document.querySelector('.cards__content:first-child h2').textContent = content.experience;
  
  document.querySelector('.cards__content:first-child .cards__content__text').textContent = content.devDesc;
  
  const workTitle = document.querySelector('.cards__content:last-child h2');
  workTitle.textContent = content.currentRole;
  
  const workPosition = document.querySelector('.cards__content:last-child p');
  workPosition.textContent = content.clinicDirector;
  
  document.querySelector('.cards__content:last-child .cards__content__text').textContent = content.clinicDesc;
  
  // Update experience section
  document.querySelector('.experience__skill:first-child h2').textContent = content.frontendDev;
  document.querySelector('.experience__skill:last-child h2').textContent = content.backendDev;
  
  // Update skill levels
  document.querySelectorAll('.experience__skill div p').forEach(p => {
    if (p.textContent.includes('Experienced') || p.textContent.includes('Expérimenté') || p.textContent.includes('خبير')) {
      p.textContent = content.experienced;
    } else if (p.textContent.includes('Intermediate') || p.textContent.includes('Intermédiaire') || p.textContent.includes('متوسط')) {
      p.textContent = content.intermediate;
    } else if (p.textContent.includes('Basic') || p.textContent.includes('Basique') || p.textContent.includes('مبتدئ')) {
      p.textContent = content.basic;
    }
  });
  
  // Update contact section
  document.querySelector('#grid__br__content h5').textContent = content.getInTouch;
  document.querySelector('#grid__br__content h2').textContent = content.contactMe;
  document.querySelectorAll('#grid__br__content .btn').forEach(btn => {
    if (btn.textContent.includes('Email') || btn.textContent.includes('E-mail') || btn.textContent.includes('البريد')) {
      btn.textContent = content.email;
    } else if (btn.textContent.includes('WhatsApp') || btn.textContent.includes('واتساب')) {
      btn.textContent = content.whatsapp;
    }
  });
  
  // Save selected language
  localStorage.setItem('selected-language', lang);
  
  // Dispatch language change event after content is updated
  document.dispatchEvent(new CustomEvent('languageChanged', { 
    detail: { language: lang } 
  }));
}

// Initialize language selector
function initializeLanguageSelector() {
  const select = document.querySelector('.custom-select');
  const selected = select.querySelector('.select-selected');
  const items = select.querySelector('.select-items');
  
  // Set initial selected language in dropdown
  selected.textContent = currentLanguage.toUpperCase();
  
  // Mark the current language as selected in the dropdown
  items.querySelectorAll('div').forEach(item => {
    if (item.getAttribute('data-value') === currentLanguage) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
  
  // Toggle dropdown
  selected.addEventListener('click', function() {
    select.classList.toggle('active');
  });
  
  // Handle language selection
  items.querySelectorAll('div').forEach(item => {
    item.addEventListener('click', function() {
      const lang = this.getAttribute('data-value');
      
      // Update dropdown UI
      selected.textContent = lang.toUpperCase();
      items.querySelectorAll('div').forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
      
      // Update language state
      currentLanguage = lang;
      document.documentElement.lang = lang;
      
      // Update content and close dropdown
      updateContent(lang);
      select.classList.remove('active');
    });
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!select.contains(e.target)) {
      select.classList.remove('active');
    }
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  initializeLanguageSelector();
  updateContent(currentLanguage);
});

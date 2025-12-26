export interface CommonSection {
  loading: string;
  error: string;
  success: string;
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  searchPlaceholder: string;
  search: string; // [BARU] Menambahkan properti search
  viewAll: string;
  back: string;
  next: string;
  noData: string;
  loadMore: string;
  remaining: string;
  filtering: string;
}

export interface NavigationSection {
  home: string;
  clanHub: string;
  knowledgeHub: string;
  tournaments: string;
  login: string;
  register: string;
  profile: string;
  dashboard: string;
  logout: string;
  settings: string;
}

export interface FooterSection {
  aboutClashub: string;
  aboutDesc: string;
  quickLinks: string;
  legal: string;
  privacyPolicy: string;
  termsOfService: string;
  contactUs: string;
  copyright: string;
}

export interface QuickLinksSection {
  title: string;
  store: string;
  cocId: string;
  esports: string;
  events: string;
  news: string;
  support: string;
}

export interface BannerSection {
  prevSlide: string;
  nextSlide: string;
}
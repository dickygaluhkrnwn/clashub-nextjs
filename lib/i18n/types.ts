import {
  CommonSection,
  NavigationSection,
  FooterSection,
  QuickLinksSection,
  BannerSection,
} from './sections/common';

import {
  HomeSection,
  AuthSection,
  DashboardSection,
} from './sections/public';

import {
  ClanHubSection,
  ClanDetailSection,
  TeamMemberTableSection,
  ClanReviewsCardSection,
  ClanPublicProfileSection,
} from './sections/clan-hub';

import {
  ProfileSection,
  ProfileHeaderSection,
  ProfileSidebarSection,
  ProfileCardsSection,
  RecentActivitySection,
  ProfileArmySection,
  ProfileAchievementsSection,
  ProfileHistorySection,
  ProfileReviewsSection,
  CardsSection,
  ProfileErrorSection,
  ProfileLoadingSection,
} from './sections/profile';

import {
  ClanManageSection,
  ClanMembersSection,
  ClanRequestsSection,
  ClanWarSection,
  ClanCwlSection,
  ClanEsportsSection,
  ClanRaidSection,
  ClanPromotionsSection,
  ClanBannersSection,
  ClanAISection,
} from './sections/management';

export type Language = 'id' | 'en';

/**
 * Interface utama untuk struktur terjemahan.
 * Disusun dari modul-modul di folder ./sections/
 */
export interface Translation {
  // --- Common & Layouts ---
  common: CommonSection;
  navigation: NavigationSection;
  footer: FooterSection;
  quickLinks: QuickLinksSection;
  banner: BannerSection;

  // --- Public Pages ---
  home: HomeSection;
  auth: AuthSection;
  dashboard: DashboardSection;

  // --- Clan Hub & Public Profiles ---
  clanHub: ClanHubSection;
  clanDetail: ClanDetailSection;
  teamMemberTable: TeamMemberTableSection;
  clanReviewsCard: ClanReviewsCardSection;
  clanPublicProfile: ClanPublicProfileSection;

  // --- User Profile ---
  profile: ProfileSection;
  profileHeader: ProfileHeaderSection;
  profileSidebar: ProfileSidebarSection;
  profileCards: ProfileCardsSection;
  recentActivity: RecentActivitySection;
  profileArmy: ProfileArmySection;
  profileAchievements: ProfileAchievementsSection;
  profileHistory: ProfileHistorySection;
  profileReviews: ProfileReviewsSection;
  cards: CardsSection;
  profileError: ProfileErrorSection;
  profileLoading: ProfileLoadingSection;

  // --- Clan Management Dashboard ---
  clanManage: ClanManageSection;
  
  // Batch A: Members
  clanMembers: ClanMembersSection;
  clanRequests: ClanRequestsSection;

  // Batch B: War & CWL
  clanWar: ClanWarSection;
  clanCwl: ClanCwlSection;

  // Batch C: Esports
  clanEsports: ClanEsportsSection;

  // Batch D: Raid, Promotions, Marketing
  clanRaid: ClanRaidSection;
  clanPromotions: ClanPromotionsSection; // Member Promotions (Rank)
  clanBanners: ClanBannersSection; // Marketing Banners

  // Batch E: AI
  clanAI: ClanAISection;
}
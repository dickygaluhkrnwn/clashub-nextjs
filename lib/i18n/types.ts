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

import { TournamentSection } from './sections/tournament';
import { TournamentManageSection } from './sections/tournament-manage';
import { TournamentCreateSection } from './sections/tournament-create';
import { KnowledgeHubSection } from './sections/knowledge-hub';

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
  clanMembers: ClanMembersSection;
  clanRequests: ClanRequestsSection;
  clanWar: ClanWarSection;
  clanCwl: ClanCwlSection;
  clanEsports: ClanEsportsSection;
  clanRaid: ClanRaidSection;
  clanPromotions: ClanPromotionsSection;
  clanBanners: ClanBannersSection;
  clanAI: ClanAISection;

  // --- Tournament System ---
  tournament: TournamentSection;
  tournamentManage: TournamentManageSection;
  tournamentCreate: TournamentCreateSection;

  // --- Knowledge Hub ---
  knowledgeHub: KnowledgeHubSection;
}
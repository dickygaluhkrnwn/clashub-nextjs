import { Translation } from '../types';
import { common, navigation, footer, quickLinks, banner } from './id/common';
import { home, auth, dashboard } from './id/public';
import {
  profile,
  profileHeader,
  profileSidebar,
  profileCards,
  recentActivity,
  profileArmy,
  profileAchievements,
  profileHistory,
  profileReviews,
  cards,
  profileError,
  profileLoading,
} from './id/profile';
import {
  clanHub,
  clanDetail,
  teamMemberTable,
  clanReviewsCard,
  clanPublicProfile,
} from './id/clan-hub';
import {
  clanManage,
  clanMembers,
  clanRequests,
  clanWar,
  clanCwl,
  clanEsports,
  clanRaid,
  clanPromotions,
  clanBanners,
  clanAI,
} from './id/management';
import { tournament } from './id/tournament';
import { tournamentManage } from './id/tournament-manage';

export const id: Translation = {
  // Common
  common,
  navigation,
  footer,
  quickLinks,
  banner,

  // Public
  home,
  auth,
  dashboard,

  // Profile
  profile,
  profileHeader,
  profileSidebar,
  profileCards,
  recentActivity,
  profileArmy,
  profileAchievements,
  profileHistory,
  profileReviews,
  cards,
  profileError,
  profileLoading,

  // Clan Hub
  clanHub,
  clanDetail,
  teamMemberTable,
  clanReviewsCard,
  clanPublicProfile,

  // Management
  clanManage,
  clanMembers,
  clanRequests,
  clanWar,
  clanCwl,
  clanEsports,
  clanRaid,
  clanPromotions,
  clanBanners,
  clanAI,

  // Tournament
  tournament,
  tournamentManage,
};
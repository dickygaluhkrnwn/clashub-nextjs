import { Translation } from '../types';
import { common, navigation, footer, quickLinks, banner } from './en/common';
import { home, auth, dashboard } from './en/public';
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
} from './en/profile';
import {
  clanHub,
  clanDetail,
  teamMemberTable,
  clanReviewsCard,
  clanPublicProfile,
} from './en/clan-hub';
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
} from './en/management';
import { tournament } from './en/tournament';
import { tournamentManage } from './en/tournament-manage';
import { tournamentCreate } from './en/tournament-create';

export const en: Translation = {
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
  tournamentCreate,
};
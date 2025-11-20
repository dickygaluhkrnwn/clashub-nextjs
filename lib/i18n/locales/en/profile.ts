import * as ProfileTypes from '../../sections/profile';

export const profile: ProfileTypes.ProfileSection = {
  errorVerifiedNoTag: 'Profile is verified but player tag is missing.',
  errorJson: 'Failed to parse JSON. Possible API 404 or server down.',
  errorUnknown: 'An unknown error occurred while fetching CoC data.',
  connectTagDesc: 'Connect your Clash of Clans tag to see your troops data.',
  connectTagAchievements: 'Connect your Clash of Clans tag to see your achievements.',
  tabSummary: 'Summary',
  tabReputation: 'Reputation',
  tabArmy: 'Army',
  tabAchievements: 'Achievements',
  tabHistory: 'History',
  tabPosts: 'Posts',
};

export const profileHeader: ProfileTypes.ProfileHeaderSection = {
  verified: 'CoC Verified',
  unverified: 'CoC Not Verified',
  viewCocProfile: 'CoC Profile',
  editVerify: 'Edit Profile & Verify',
  editStartVerify: 'Edit Profile & Start Verification',
};

export const profileSidebar: ProfileTypes.ProfileSidebarSection = {
  tagNotSet: 'TAG NOT SET',
  freeAgent: 'Free Agent',
  competitive: 'Competitive',
  casual: 'Casual',
  verified: 'CoC Verified',
  unverified: 'Not Verified',
  bioVision: 'Bio & Vision',
  noBio: 'No bio available.',
  preferences: 'Preferences',
  role: 'Main Role:',
  activeHours: 'Active Hours:',
  notSet: 'Not Set',
  contact: 'Contact',
  websiteNotSet: 'Website not set',
  popularityPoints: 'Popularity Points',
  viewDetails: 'View Points & Badges Details',
  commitmentReputation: 'Commitment Reputation',
  basedOnReviews: '(Based on {count} reviews)',
  manageMyClan: 'Manage My Clan',
};

export const profileCards: ProfileTypes.ProfileCardsSection = {
  clanIdentity: 'Clan Identity',
  notInClan: 'This player is not in a clan.',
  townHall: 'Town Hall',
  thLevel: 'TH Level',
  xpLevel: 'XP Level',
  seasonStats: 'Season Stats',
  fetchErrorTitle: 'Failed to fetch live CoC data:',
  currentLeague: 'Current League',
  unranked: 'Unranked',
  homeTrophies: 'Home Trophies',
  builderTrophies: 'Builder Trophies',
  attackWins: 'Attack Wins',
  defenseWins: 'Defense Wins',
  warStars: 'War Stars',
  loading: 'Loading...',
};

export const recentActivity: ProfileTypes.RecentActivitySection = {
  title: 'Recent Activity',
  replies: 'Replies',
  likes: 'Likes',
  viewAllPosts: 'View All My Posts',
  noPosts: 'You have not posted in the Knowledge Hub yet.',
  createFirstPost: 'Create Your First Post',
};

export const profileArmy: ProfileTypes.ProfileArmySection = {
  heroTitle: 'Heroes (Home Village)',
  heroLoading: 'Loading hero data...',
  heroError: 'Failed to load heroes: {error}',
  heroEmpty: 'Hero data not found or player has no heroes yet.',
  troopsTitle: 'Troops (Home Village)',
  troopsLoading: 'Loading troops data...',
  troopsError: 'Failed to load troops: {error}',
  superTroops: 'Active Super Troops',
  regularTroops: 'Elixir & Dark Elixir Troops',
  troopsEmpty: 'Troops data not found.',
  spellsTitle: 'Spells (Home Village)',
  spellsLoading: 'Loading spell data...',
  spellsError: 'Failed to load spells: {error}',
  spellsEmpty: 'Spell data not found or player has not unlocked spells yet.',
  heroErrorMsg: 'Failed to load heroes: {error}',
  troopsErrorMsg: 'Failed to load troops: {error}',
  spellsErrorMsg: 'Failed to load spells: {error}',
};

export const profileAchievements: ProfileTypes.ProfileAchievementsSection = {
  title: 'Achievements',
  loading: 'Loading achievements data...',
  error: 'Failed to load achievements: {error}',
  empty: 'Achievements data not found.',
};

export const profileHistory: ProfileTypes.ProfileHistorySection = {
  title: 'Clashub Team History',
  empty: 'You have no team history on Clashub yet.',
  joined: 'Joined',
  left: 'Left',
  kicked: 'Kicked',
  unknownClan: 'Unknown Clan',
  unknownDate: 'Unknown Date',
};

export const profileReviews: ProfileTypes.ProfileReviewsSection = {
  title: 'Received Reviews',
  empty: 'You haven\'t received any reviews from other players yet.',
  context: 'Context',
};

export const cards: ProfileTypes.CardsSection = {
  vision: 'Vision:',
  avgTh: 'Avg TH:',
  viewClan: 'View Clan',
  by: 'By:',
  statusScheduled: 'Scheduled',
  statusRegOpen: 'Registration Open',
  statusRegClosed: 'Registration Closed',
  statusOngoing: 'Live',
  statusCompleted: 'Completed',
  statusCancelled: 'Cancelled',
  statusDraft: 'Draft',
  requirements: 'Requirements:',
  prizePool: 'Prize:',
  viewDetails: 'View Details',
  role: 'Clashub Role:',
  townHall: 'Town Hall:',
  reputation: 'Reputation:',
  viewPlayer: 'View Player',
};

export const profileError: ProfileTypes.ProfileErrorSection = {
  incompleteTitle: 'Incomplete Profile',
  startEdit: 'Start Editing CV',
  errorTitle: 'Profile Loading Error',
  retry: 'Try Again',
};

export const profileLoading: ProfileTypes.ProfileLoadingSection = {
  message: 'Loading User Session...',
};
export interface ClanHubSection {
  title: string;
  subtitle: string;
  tabTeams: string;
  tabPlayers: string;
  tabPublicClans: string;
  searchTeams: string;
  searchPlayers: string;
  searchPublicClans: string;
  filterThLevel: string;
  filterAllTh: string;
  sortReputation: string;
  sortNewest: string;
  noTeamsFound: string;
  noPlayersFound: string;
  noPublicClansFound: string;
  joinTeam: string;
  viewProfile: string;
  viewClan: string;
  thLevel: string;
  role: string;
  lookingFor: string;
  serverError: string;
  serverErrorDesc: string;
  showFilter: string;
  hideFilter: string;
  teamsFound: string;
  noTeamsMatch: string;
  playersFound: string;
  noPlayersMatch: string;
  publicClansSearchTitle: string;
  searchByTagLabel: string;
  searchTagPlaceholder: string;
  searchButton: string;
  searching: string;
  searchingByTag: string;
  searchTagResult: string;
  publicClansCache: string;
  noClanFoundForTag: string;
  noPublicClansCache: string;
  trySearchValidTag: string;
  publicClansDisclaimer: string;
  filterTitle: string;
  filterSearchLabel: string;
  filterSearchPlaceholder: string;
  filterVisionLabel: string;
  visionAll: string;
  visionCompetitive: string;
  visionCasual: string;
  filterReputationLabel: string;
  filterThLabel: string;
  filterMinMembersLabel: string;
  membersUnit: string;
  resetFilter: string;
}

export interface ClanDetailSection {
  profileTitle: string;
  cocProfile: string;
  editProfile: string;
  manageClan: string;
  rosterFull: string;
  join: string;
  aboutClan: string;
  clanRules: string;
  noDescription: string;
  noRules: string;
  competitionHistory: string;
  teamReputation: string;
  basedOnReviews: string;
  viewAllReviews: string;
  statsSummary: string;
  level: string;
  members: string;
  avgTh: string;
  upcomingEvents: string;
  contactSocials: string;
  noSocials: string;
  nextWar: string;
  preparation: string;
}

export interface TeamMemberTableSection {
  title: string;
  empty: string;
  colPlayer: string;
  colRole: string;
  colXp: string;
  colDonationGiven: string;
  colDonationReceived: string;
}

export interface ClanReviewsCardSection {
  title: string;
  empty: string;
}

export interface ClanPublicProfileSection {
  loading: string;
  notFound: string;
  errorTitle: string;
  backToHub: string;
  joinClan: string;
  lastUpdated: string;
  stats: {
    members: string;
    clanPoints: string;
    capitalPoints: string;
    warWins: string;
    type: string;
  };
  descriptionTitle: string;
  noDescription: string;
  details: {
    location: string;
    warFreq: string;
    requiredTrophies: string;
    winStreak: string;
  };
  memberListTitle: string;
  memberListEmpty: string;
  table: {
    player: string;
    role: string;
    trophies: string;
    donationsGiven: string;
    donationsReceived: string;
  };
  disclaimer: string;
}
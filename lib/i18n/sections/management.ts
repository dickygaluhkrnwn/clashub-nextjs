export interface ClanManageSection {
  loadingUserData: string;
  reloginNote: string;
  accessDenied: string;
  accessDeniedDesc: string;
  backToProfile: string;
  tabSummary: string;
  tabMembers: string;
  tabActiveWar: string;
  tabWarHistory: string;
  tabCwlHistory: string;
  tabRaid: string;
  tabEsports: string;
  tabRequests: string;
  tabPromotion: string;
  tabSettings: string;
  viewClanProfile: string;
  leaveClan: string;
  closeMenu: string;
  openMenu: string;
  leaveTitle: string;
  leaveConfirm: string;
  leaveImportant: string;
  leaveNote: string;
  cancel: string;
  confirmLeave: string;
  processing: string;
  leaveSuccess: string;
  leaveError: string;
  leaderLeaveError: string;
  tabAccessDenied: string;
  tabAccessDeniedDesc: string;
  backToSummary: string;
  settingsTitle: string;
  settingsDesc: string;
  dashboardTitle: string;
  manageLabel: string;
  roleLabel: string;
  syncNeeded: string;
  dataFresh: string;
  lastSynced: string;
  never: string;
  syncControlTitle: string;
  syncControlDesc: string;
  syncManualStale: string;
  syncManualNow: string;
  syncing: string;
  reloadCache: string;
  internalId: string;
  ownerUid: string;
  activeWarTitle: string;
  clanSafe: string;
  clanSafeDesc: string;
  raidTitle: string;
  raidNoData: string;
  viewRaidArchive: string;
  performanceTitle: string;
  loadingPerformance: string;
  noPerformanceData: string;
  promotionsTitle: string;
  promotionsDesc: string;
  demotionsTitle: string;
  demotionsDesc: string;
  topDonator: string;
  totalDonations: string;
  topLooter: string;
  totalLoot: string;
  warNotInActive: string;
  warInProgress: string;
  warPreparation: string;
  warEnded: string;
  attacks: string;
  viewWarDetails: string;
  raidSummaryTitle: string;
  raidPeriod: string;
  raidTotalLoot: string;
  raidMedals: string;
  raidAttacks: string;
  raidDestroyed: string;
  viewRaidHistory: string;
  msgReloading: string;
  msgOnlyManager: string;
  msgStartSync: string;
  msgBackendDone: string;
  msgOwnerUpdated: string;
  msgSyncSuccess: string;
  msgSyncError: string;
}

export interface ClanMembersSection {
  tabTitle: string;
  searchPlaceholder: string;
  filterRole: string;
  roleAll: string;
  colRank: string;
  colPlayer: string;
  colDonations: string;
  colLastActive: string;
  colActions: string;
  actionPromote: string;
  actionDemote: string;
  actionKick: string;
  modalKickTitle: string;
  modalKickConfirm: string;
  modalRoleTitle: string;
  modalRoleConfirm: string;
  toastSuccess: string;
  toastError: string;
  roles: {
    leader: string;
    coLeader: string;
    admin: string;
    member: string;
  };
}

export interface ClanRequestsSection {
  tabTitle: string;
  noRequests: string;
  colPlayer: string;
  colMessage: string;
  colActions: string;
  actionAccept: string;
  actionReject: string;
  modalAcceptTitle: string;
  modalRejectTitle: string;
  confirmAccept: string;
  confirmReject: string;
  toastAccepted: string;
  toastRejected: string;
}

export interface ClanWarSection {
  tabTitleActive: string;
  tabTitleHistory: string;
  noActiveWar: string;
  noWarHistory: string;
  colEnemy: string;
  colResult: string;
  colScore: string;
  colStars: string;
  colDestruction: string;
  colDate: string;
  colTeamSize: string;
  colAttacks: string;
  statusPrep: string;
  statusBattle: string;
  statusEnded: string;
  resultWin: string;
  resultLose: string;
  resultDraw: string;
  viewDetails: string;
  updateLog: string;
  syncSuccess: string;
  privateLog: string;
  modalTitle: string;
  modalMapPosition: string;
  modalAttacks: string;
  modalDefense: string;
  modalBestDefense: string;
  modalClose: string;
}

export interface ClanCwlSection {
  tabTitle: string;
  noCwlHistory: string;
  seasonHeader: string;
  leagueLabel: string;
  rankLabel: string;
  colRound: string;
  colEnemy: string;
  colStars: string;
  colDestruction: string;
  statusActive: string;
  statusEnded: string;
}

export interface ClanEsportsSection {
  tabTitle: string;
  tabDesc: string;
  createTeam: string;
  noTeamsTitle: string;
  noTeamsDescManager: string;
  noTeamsDescMember: string;
  loadingTeams: string;
  errorMembersTitle: string;
  errorMembersDesc: string;
  createModalTitle: string;
  editModalTitle: string;
  labelTeamName: string;
  placeholderTeamName: string;
  labelSelectMembers: string;
  helperSelectMembers: string;
  noVerifiedMembers: string;
  alreadyInTeam: string;
  labelSelectLeader: string;
  placeholderSelectLeader: string;
  optionSelect5First: string;
  btnSave: string;
  btnSaving: string;
  toastFetchError: string;
  toastCreateSuccess: string;
  toastDeleteSuccess: string;
  toastUpdateSuccess: string;
  alertCreateTitle: string;
  alertCreateMessage: string;
  valNameEmpty: string;
  valCountError: string;
  valMaxCount: string;
  valLeaderEmpty: string;
  leaderLabel: string;
  incompleteTeam: string;
  deleteConfirm: string;
}

export interface ClanRaidSection {
  tabTitle: string;
  currentRaidTitle: string;
  historyTitle: string;
  noData: string;
  noDataDesc: string;
  noHistory: string;
  statusOngoing: string;
  statusEnded: string;
  labelStart: string;
  labelEnd: string;
  labelTotalLoot: string;
  labelTotalAttacks: string;
  labelEnemyDistricts: string;
  labelMedals: string;
  labelParticipants: string;
  colRank: string;
  colPlayer: string;
  colAttacks: string;
  colLoot: string;
  btnRefresh: string;
  raidFinishedAt: string;
}

export interface ClanPromotionsSection {
  tabTitle: string;
  tabDesc: string;
  candidatesTitle: string;
  risksTitle: string;
  noCandidates: string;
  noRisks: string;
  colMember: string;
  colReason: string;
  colAction: string;
  btnPromote: string;
  btnDemote: string;
  btnDismiss: string;
  analyticsTitle: string;
  totalPromotions: string;
  totalDemotions: string;
  activityTrends: string;
  basedOn30Days: string;
}

export interface ClanBannersSection {
  tabTitle: string; // [FIX] Added property
  tabDesc: string; // [FIX] Added property
  btnAdd: string;
  formTitle: string;
  formDesc: string;
  alertImgTitle: string;
  alertImgDesc: string;
  labelImgUrl: string;
  labelTitle: string;
  labelDesc: string;
  btnSubmit: string;
  btnSubmitting: string;
  btnCancel: string;
  listTitle: string;
  loadingList: string;
  noBanners: string;
  clicks: string;
  clicksByTh: string;
  toastAdded: string;
  toastDeleted: string;
  valAllFields: string;
  valImgUrl: string;
  analyticsTitle: string;
  analyticsNoData: string;
  statTotalClicks: string;
  statTotalClicksDesc: string;
  statTotalClicksNote: string;
  chartPerformance: string;
  chartDemographics: string;
  chartNoData: string;
}

export interface ClanAISection {
  title: string;
  welcomeMessage: string;
  inputPlaceholder: string;
  thinking: string;
  errorFetch: string;
  errorGeneric: string;
  errorPrefix: string;
}
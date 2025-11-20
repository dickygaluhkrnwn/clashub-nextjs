export type Language = 'id' | 'en';

export interface Translation {
  common: {
    loading: string;
    error: string;
    success: string;
    save: string;
    cancel: string;
    edit: string;
    delete: string;
    searchPlaceholder: string;
    viewAll: string;
    back: string;
    next: string;
    noData: string;
    loadMore: string;
    remaining: string;
    filtering: string;
  };
  navigation: {
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
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    ctaButton: string;
    latestStrategies: string;
    recommendedTeams: string;
    quickLinks: string;
    promotions: string;
    welcomeBack: string;
    clanReputation: string;
    currentWar: string;
    managedClan: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    loginButton: string;
    registerTitle: string;
    registerSubtitle: string;
    registerButton: string;
    signInWithGoogle: string;
    tabLogin: string;
    tabRegister: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    passwordMinPlaceholder: string;
    confirmPasswordPlaceholder: string;
    playerTagPlaceholder: string;
    forgotPassword: string;
    cocIntegrationTitle: string;
    thSelectDefault: string;
    processing: string;
    emailRequired: string;
    emailInvalid: string;
    passwordRequired: string;
    passwordMin: string;
    confirmRequired: string;
    confirmMismatch: string;
    tagRequired: string;
    tagInvalid: string;
    thRequired: string;
    fixFormErrors: string;
    registrationFailed: string;
    emailInUse: string;
    loginFailed: string;
    emailOrPasswordInvalid: string;
  };
  dashboard: {
    warStatus: string;
    myStars: string;
    enemyStars: string;
    destruction: string;
    viewWarDetails: string;
    noWar: string;
    loginToViewWar: string;
    viewClanPage: string;
    loginNow: string;
    manageClanTitle: string;
    manageClanDesc: string;
    startManaging: string;
    loginToStart: string;
    avgTh: string;
    members: string;
    warWins: string;
    profileSummary: string;
    thLevel: string;
    reputation: string;
    viewFullProfile: string;
    loginToViewProfile: string;
    loginOrRegister: string;
    importantAnnouncements: string;
    nextWar: string;
    warEnds: string;
  };
  footer: {
    aboutClashub: string;
    aboutDesc: string;
    quickLinks: string;
    legal: string;
    privacyPolicy: string;
    termsOfService: string;
    contactUs: string;
    copyright: string;
  };
  quickLinks: {
    title: string;
    store: string;
    cocId: string;
    esports: string;
    events: string;
    news: string;
    support: string;
  };
  banner: {
    prevSlide: string;
    nextSlide: string;
  };
  clanHub: {
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
  };
  profile: {
    errorVerifiedNoTag: string;
    errorJson: string;
    errorUnknown: string;
    connectTagDesc: string;
    connectTagAchievements: string;
    tabSummary: string;
    tabReputation: string;
    tabArmy: string;
    tabAchievements: string;
    tabHistory: string;
    tabPosts: string;
  };
  profileHeader: {
    verified: string;
    unverified: string;
    viewCocProfile: string;
    editVerify: string;
    editStartVerify: string;
  };
  profileSidebar: {
    tagNotSet: string;
    freeAgent: string;
    competitive: string;
    casual: string;
    verified: string;
    unverified: string;
    bioVision: string;
    noBio: string;
    preferences: string;
    role: string;
    activeHours: string;
    notSet: string;
    contact: string;
    websiteNotSet: string;
    popularityPoints: string;
    viewDetails: string;
    commitmentReputation: string;
    basedOnReviews: string;
    manageMyClan: string;
  };
  profileCards: {
    clanIdentity: string;
    notInClan: string;
    townHall: string;
    thLevel: string;
    xpLevel: string;
    seasonStats: string;
    fetchErrorTitle: string;
    currentLeague: string;
    unranked: string;
    homeTrophies: string;
    builderTrophies: string;
    attackWins: string;
    defenseWins: string;
    warStars: string;
    loading: string;
  };
  recentActivity: {
    title: string;
    replies: string;
    likes: string;
    viewAllPosts: string;
    noPosts: string;
    createFirstPost: string;
  };
  profileArmy: {
    heroTitle: string;
    heroLoading: string;
    heroError: string;
    heroEmpty: string;
    troopsTitle: string;
    troopsLoading: string;
    troopsError: string;
    superTroops: string;
    regularTroops: string;
    troopsEmpty: string;
    spellsTitle: string;
    spellsLoading: string;
    spellsError: string;
    spellsEmpty: string;
    // Error messages specific keys
    heroErrorMsg: string;
    troopsErrorMsg: string;
    spellsErrorMsg: string;
  };
  profileAchievements: {
    title: string;
    loading: string;
    error: string;
    empty: string;
  };
  profileHistory: {
    title: string;
    empty: string;
    joined: string;
    left: string;
    kicked: string;
    unknownClan: string;
    unknownDate: string;
  };
  profileReviews: {
    title: string;
    empty: string;
    context: string;
  };
  cards: {
    vision: string;
    avgTh: string;
    viewClan: string;
    by: string;
    statusScheduled: string;
    statusRegOpen: string;
    statusRegClosed: string;
    statusOngoing: string;
    statusCompleted: string;
    statusCancelled: string;
    statusDraft: string;
    requirements: string;
    prizePool: string;
    viewDetails: string;
    role: string;
    townHall: string;
    reputation: string;
    viewPlayer: string;
  };
  profileError: {
    incompleteTitle: string;
    startEdit: string;
    errorTitle: string;
    retry: string;
  };
  profileLoading: {
    message: string;
  };
  clanDetail: {
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
  };
  teamMemberTable: {
    title: string;
    empty: string;
    colPlayer: string;
    colRole: string;
    colXp: string;
    colDonationGiven: string;
    colDonationReceived: string;
  };
  clanReviewsCard: {
    title: string;
    empty: string;
  };
  clanPublicProfile: {
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
  };
  clanManage: {
    loadingUserData: string;
    reloginNote: string;
    accessDenied: string;
    accessDeniedDesc: string;
    backToProfile: string;
    // Sidebar Tabs
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
    // Sidebar Actions
    viewClanProfile: string;
    leaveClan: string;
    closeMenu: string;
    openMenu: string;
    // Leave Modal
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
    // Tab Access Denied
    tabAccessDenied: string;
    tabAccessDeniedDesc: string;
    backToSummary: string;
    // Settings Placeholder
    settingsTitle: string;
    settingsDesc: string;
    
    // [BARU - Header & Summary]
    dashboardTitle: string;
    manageLabel: string;
    roleLabel: string;
    syncNeeded: string;
    dataFresh: string;
    lastSynced: string;
    never: string;
    
    // Summary Content
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

    // War Status Widget
    warNotInActive: string;
    warInProgress: string;
    warPreparation: string;
    warEnded: string;
    attacks: string;
    viewWarDetails: string;

    // Raid Widget
    raidSummaryTitle: string;
    raidPeriod: string;
    raidTotalLoot: string;
    raidMedals: string;
    raidAttacks: string;
    raidDestroyed: string;
    viewRaidHistory: string;

    // Sync Actions Messages
    msgReloading: string;
    msgOnlyManager: string;
    msgStartSync: string;
    msgBackendDone: string;
    msgOwnerUpdated: string;
    msgSyncSuccess: string;
    msgSyncError: string;
  };
}
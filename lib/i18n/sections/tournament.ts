export interface TournamentSection {
  pageTitle: string;
  pageDesc: string;
  metaTitle: string;
  metaDesc: string;
  
  // Filters
  filterSearchPlaceholder: string;
  filterStatusLabel: string;
  filterStatusAll: string;
  filterStatusUpcoming: string;
  filterStatusOngoing: string;
  filterStatusCompleted: string;
  
  // Card
  cardPrize: string;
  cardSlots: string;
  cardTeamSize: string;
  cardStatusDraft: string;
  cardStatusRegistering: string;
  cardStatusOngoing: string;
  cardStatusCompleted: string;
  cardStatusCancelled: string;
  btnDetail: string;
  
  // List State
  noTournaments: string;
  noTournamentsDesc: string;
  errorTitle: string;
  errorDesc: string;
  btnTryAgain: string;

  // Detail Page & Registration
  detail: {
    manageBtn: string;
    regClosedBtn: string;
    regNotOpenBtn: string;
    endedBtn: string;
    loginBtn: string;
    verifyBtn: string;
    registerBtn: string;
    loadingBtn: string;
    
    infoStarts: string;
    infoFormat: string;
    infoTh: string;
    infoParticipants: string;
    infoOrganizer: string;
    infoRegStart: string;
    infoRegEnd: string;
    
    descTitle: string;
    rulesTitle: string;
    
    bracketUpper: string;
    bracketLower: string;
    roundPrefix: string;
    bracketLoading: string;
    bracketError: string;
    bracketEmpty: string;
    bracketEmptyDesc: string;
    
    thUniform: string;
    thMixed: string;
    matchScheduled: string;

    // Keys untuk Match Detail Header/Nav
    btnBackToBracket: string;
    labelStatus: string;
    labelSchedule: string;
    labelBracket: string;
    labelRound: string;
    matchTbd: string;
  };

  // Match Room Specifics
  match: {
    matchPending: string;
    byeTitle: string;
    byeDesc: string;
    membersTitle: string;
    assignmentTitle: string;
    assignmentDesc: string;
    btnOpenClan: string;
    assignmentNote: string;
    assignmentWaiting: string;
    
    liveWarTitle: string;
    waitingLive: string;
    loadingLive: string;
    waitingDesc: string;
    notStartedTitle: string;
    notStartedDesc: string;
  };
}
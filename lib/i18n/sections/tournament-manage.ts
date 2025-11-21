export interface TournamentManageSection {
  // Header & Navigation
  title: string;
  btnBack: string;
  btnToggleMenu: string;
  btnCloseMenu: string;
  
  // Tabs
  tabParticipants: string;
  tabStaff: string;
  tabBracket: string;
  tabSettings: string;

  // Notifications
  toastSuccess: string;
  
  // Error States
  accessDeniedTitle: string;
  accessDeniedDesc: string;
  notFoundTitle: string;
  notFoundDesc: string;
  btnBackToHub: string;

  // Participant Manager
  partTitle: string;
  partApproved: string;
  partPending: string;
  partRejected: string;
  partStatusApproved: string;
  partStatusRejected: string;
  partStatusPending: string;
  partOrigin: string;
  partMembers: string;
  partEmptyTitle: string;
  partEmptyDesc: string;
  partToastUpdating: string;

  // Bracket Generator
  bracketGen: {
    titleReady: string;
    descReady: string;
    attention: string;
    btnGenerate: string;
    btnGenerating: string;

    titleUnderQuota: string;
    descUnderQuota: string;
    descOptions: string;
    btnStartUnderQuota: string;
    btnCancelTournament: string;

    titleEmpty: string;
    descEmpty: string;

    statusBracketCreated: string;
    statusCompleted: string;
    statusCancelled: string;
    statusRegNotClosed: string;
    descRegNotClosed: string;
    descRegNotClosedAuto: string;

    toastGenerating: string;
    toastStarting: string;
    toastCancelling: string;

    modalStartTitle: string;
    modalStartDesc: string;
    modalStartConfirm: string;

    modalCancelTitle: string;
    modalCancelDesc: string;
    modalCancelConfirm: string;
  };

  // Settings Manager
  settings: {
    title: string;
    desc: string;
    labelClanA: string;
    labelClanB: string;
    btnSave: string;
    btnSaving: string;
    errFormat: string;
    errSame: string;
    errSave: string;
  };

  // Schedule Manager
  schedule: {
    title: string;
    byeTbd: string;
    setWinner: string;
    winnerLabel: string;
    statusLabel: string;
    emptyTitle: string;
    emptyDesc: string;
    btnRetry: string;
    toastSaving: string;
    toastReporting: string;
  };

  // Staff Manager
  staff: {
    inviteTitle: string;
    inviteDesc: string;
    inputPlaceholder: string;
    btnInvite: string;
    btnInviting: string;
    listTitle: string;
    listError: string;
    listRetry: string;
    labelYou: string;
    roleOrganizer: string;
    toastInviting: string;
    toastRemoving: string;
    toastRemoveSuccess: string;
  };
}
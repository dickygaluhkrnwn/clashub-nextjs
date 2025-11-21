import { TournamentManageSection } from '../../sections/tournament-manage';

export const tournamentManage: TournamentManageSection = {
  // Header & Navigation
  title: 'Tournament Management',
  btnBack: 'Back to Hub',
  btnToggleMenu: 'Open Menu',
  btnCloseMenu: 'Close Menu',
  
  // Tabs
  tabParticipants: 'Participants',
  tabStaff: 'Staff & Committee',
  tabBracket: 'Bracket & Schedule',
  tabSettings: 'Settings',

  // Notifications
  toastSuccess: 'Action successful! Reloading data...',
  
  // Error States
  accessDeniedTitle: 'Access Denied',
  accessDeniedDesc: 'You are not an organizer or committee member for this tournament.',
  notFoundTitle: 'Tournament Not Found',
  notFoundDesc: 'The tournament you are looking for does not exist or has been deleted.',
  btnBackToHub: 'Back to My Tournaments',

  // Participant Manager
  partTitle: 'Participant Management',
  partApproved: 'Approved',
  partPending: 'Pending',
  partRejected: 'Rejected',
  partStatusApproved: 'Approved',
  partStatusRejected: 'Rejected',
  partStatusPending: 'Pending',
  partOrigin: 'Origin',
  partMembers: 'Team Members',
  partEmptyTitle: 'No Participants Yet',
  partEmptyDesc: 'No teams have registered for this tournament yet.',
  partToastUpdating: 'Updating team status...',

  // Bracket Generator
  bracketGen: {
    titleReady: 'Ready to Start Tournament!',
    descReady: 'All {count} participating teams have been approved and registration is closed. Click the button below to shuffle and generate the double elimination bracket.',
    attention: 'ATTENTION: This action cannot be undone.',
    btnGenerate: 'Generate Bracket Now',
    btnGenerating: 'Generating...',

    titleUnderQuota: 'Registration Closed (Under Quota)',
    descUnderQuota: 'Registration is closed, but the tournament quota has not been met.',
    descOptions: 'You have 2 options:',
    btnStartUnderQuota: 'Start with {count} Teams',
    btnCancelTournament: 'Cancel Tournament',

    titleEmpty: 'Registration Closed (No Participants)',
    descEmpty: 'Registration is closed and no teams have been approved.',

    statusBracketCreated: 'Tournament bracket has been generated.',
    statusCompleted: 'Tournament has ended.',
    statusCancelled: 'This tournament has been cancelled.',
    statusRegNotClosed: 'Registration Not Closed',
    descRegNotClosed: 'Current tournament status is',
    descRegNotClosedAuto: 'A new bracket can be generated after registration closes automatically (on {date}).',

    toastGenerating: 'Shuffling and generating bracket...',
    toastStarting: 'Starting tournament with {count} teams...',
    toastCancelling: 'Cancelling tournament...',

    modalStartTitle: 'Start Tournament (Under Quota)?',
    modalStartDesc: 'This action will create a {size}-team bracket, adding "BYE" (Automatic Win) to fill empty slots, and change tournament status to \'ongoing\'.\n\nThis action cannot be undone.',
    modalStartConfirm: 'Yes, Start Tournament',

    modalCancelTitle: 'Cancel This Tournament?',
    modalCancelDesc: 'This action will change the tournament status to \'cancelled\'.\nAll registered teams will be notified (if applicable).\n\nThis action cannot be undone.',
    modalCancelConfirm: 'Yes, Cancel',
  },

  // Settings Manager
  settings: {
    title: 'Committee Clan Settings',
    desc: 'These are the 2 clans fully controlled by you (the committee). All matches will be hosted in these clans to allow the website to fetch live war data.',
    labelClanA: 'Committee Clan A Tag',
    labelClanB: 'Committee Clan B Tag',
    btnSave: 'Save Clan Settings',
    btnSaving: 'Saving...',
    errFormat: 'Invalid Clan Tag format. Must start with #.',
    errSame: 'Clan A and B Tags cannot be the same.',
    errSave: 'Failed to save settings.',
  },

  // Schedule Manager
  schedule: {
    title: 'Schedule & Match Result Management',
    byeTbd: 'BYE / TBD',
    setWinner: 'Set {team} Wins',
    winnerLabel: 'Winner: {team}',
    statusLabel: 'Status: {status}',
    emptyTitle: 'No Matches Found',
    emptyDesc: 'Match data for this tournament is missing or failed to load.',
    btnRetry: 'Retry',
    toastSaving: 'Saving schedule for Match {id}...',
    toastReporting: 'Reporting winner for Match {id}...',
  },

  // Staff Manager
  staff: {
    inviteTitle: 'Invite New Committee',
    inviteDesc: 'Invited members will have the same access rights (except removing the organizer) to manage this tournament.',
    inputPlaceholder: 'Enter Clashub user email...',
    btnInvite: 'Invite',
    btnInviting: 'Inviting...',
    listTitle: 'Current Staff & Committee',
    listError: 'Failed to load staff data.',
    listRetry: 'Try Again',
    labelYou: '(You)',
    roleOrganizer: 'Organizer',
    toastInviting: 'Inviting committee...',
    toastRemoving: 'Removing committee...',
    toastRemoveSuccess: 'Committee removed successfully.',
  },
};
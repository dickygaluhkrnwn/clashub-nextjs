import { TournamentCreateSection } from '../../sections/tournament-create';

export const tournamentCreate: TournamentCreateSection = {
  pageTitle: 'Create New Tournament',
  pageDesc: 'Fill in the details below to publish your tournament to the Clashub community.',
  
  stepBasic: 'Basic Info',
  stepFormat: 'Format & Dates',
  stepTh: 'TH Rules',
  stepReview: 'Review',

  labelTitle: 'Tournament Name',
  placeholderTitle: 'Ex: Clashub Championship Season 1',
  labelDesc: 'Short Description',
  placeholderDesc: 'Describe this tournament...',
  labelBanner: 'Banner URL (Imgur)',
  placeholderBanner: 'https://i.imgur.com/...',
  labelRules: 'Tournament Rules',
  placeholderRules: 'Write complete rules here...',
  
  labelFormat: 'Match Mode',
  labelTeamSize: 'Team Size (Players)',
  labelParticipantCount: 'Team Slots',
  labelPrize: 'Prize Pool',
  placeholderPrize: 'Ex: $100 or 5000 Gems',

  labelRegStart: 'Registration Start',
  labelRegEnd: 'Registration End',
  labelTourStart: 'Tournament Start',
  labelTourEnd: 'Tournament End (Est)',
  
  labelThMode: 'Town Hall Mode',
  optionAny: 'Any (All Levels)',
  optionUniform: 'Uniform (Single Level)',
  optionMixed: 'Mixed (Multi Level)',
  labelMinTh: 'Minimum TH',
  labelMaxTh: 'Maximum TH',
  labelThLevel: 'Allowed TH Levels',
  
  btnNext: 'Next',
  btnBack: 'Back',
  btnSubmit: 'Create Tournament',
  btnSubmitting: 'Processing...',

  errTitle: 'Title is required',
  errDesc: 'Description is required',
  errDates: 'Invalid dates. Please ensure chronological order.',
  errTeams: 'Team slots must be a multiple of 4 (min 4).',
  errTh: 'TH requirements must be selected.',
  
  successTitle: 'Tournament Created Successfully!',
  successDesc: 'Your tournament is now in "Draft" status. Please review it before opening to public.',
  btnViewTournament: 'View Tournament',
};
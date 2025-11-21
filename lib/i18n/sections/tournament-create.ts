export interface TournamentCreateSection {
  // Header
  pageTitle: string;
  pageDesc: string;
  
  // Steps (Wizard)
  stepBasic: string;
  stepFormat: string;
  stepTh: string;
  stepReview: string;

  // Form Labels - Basic
  labelTitle: string;
  placeholderTitle: string;
  labelDesc: string;
  placeholderDesc: string;
  labelBanner: string;
  placeholderBanner: string;
  labelRules: string;
  placeholderRules: string;
  
  // Form Labels - Format
  labelFormat: string; // 5v5, 1v1
  labelTeamSize: string;
  labelParticipantCount: string;
  labelPrize: string;
  placeholderPrize: string;

  // Form Labels - Dates
  labelRegStart: string;
  labelRegEnd: string;
  labelTourStart: string;
  labelTourEnd: string;
  
  // Form Labels - TH
  labelThMode: string; // Uniform, Mixed, Any
  optionAny: string;
  optionUniform: string;
  optionMixed: string;
  labelMinTh: string;
  labelMaxTh: string;
  labelThLevel: string; // "TH Level"
  
  // Actions
  btnNext: string;
  btnBack: string;
  btnSubmit: string;
  btnSubmitting: string;

  // Validation/Errors
  errTitle: string;
  errDesc: string;
  errDates: string;
  errTeams: string;
  errTh: string;
  
  // Success
  successTitle: string;
  successDesc: string;
  btnViewTournament: string;
}
export interface KnowledgeHubSection {
  page: {
    title: string;
    description: string;
    createButton: string;
    searchPlaceholder: string;
    filters: {
      all: string;
      baseBuilding: string;
      attackStrategy: string;
    };
    emptyState: string;
  };
  sorting: {
    label: string;
    newest: string;
    trending: string;
  };
  create: {
    title: string;
    editTitle: string;
    backButton: string;
    submitButton: string;
    submitting: string;
    cancelButton: string;
  };
  form: {
    labels: {
      title: string;
      type: string;
      baseBuilding: string;
      strategyType: string;
      townHall: string;
      tags: string;
      description: string;
      youtubeUrl: string;
      image: string;
    };
    placeholders: {
      title: string;
      description: string;
      youtubeUrl: string;
      tags: string;
    };
    helpText: {
      tags: string;
      image: string;
    };
    options: {
      types: {
        baseBuilding: string;
        attackStrategy: string;
      };
      baseBuilding: {
        warBase: string;
        farmingBase: string;
        trophyBase: string;
        hybridBase: string;
        progressBase: string;
      };
      strategy: {
        ground: string;
        air: string;
        hybrid: string;
        spam: string;
        precision: string;
      };
    };
    validation: {
      titleRequired: string;
      titleMinLength: string;
      typeRequired: string;
      descriptionRequired: string;
      descriptionMinLength: string;
      youtubeInvalid: string;
      imageRequired: string;
      baseBuildingRequired: string;
      strategyTypeRequired: string;
      townHallRequired: string;
    };
    messages: {
      createSuccess: string;
      createError: string;
      uploadError: string;
      imageSizeError: string;
    };
  };
  detail: {
    meta: {
      author: string;
      published: string;
      views: string;
      likes: string;
      comments: string;
      categoryLabel: string; // <-- BARU: Label "Kategori:"
      anonymous: string;     // <-- BARU: "Kontributor Anonim"
      invalidDate: string;   // <-- BARU: "Tanggal Tidak Valid"
      noTags: string;        // <-- BARU: "#TAG_TIDAK_TERSEDIA"
    };
    sections: {
      about: string;
      strategy: string;
      comments: string;
    };
    actions: {
      like: string;
      share: string;
      reply: string;
      delete: string;
      edit: string;
      report: string;
      // --- TOMBOL KHUSUS BARU ---
      copyBaseLink: string;
      copyArmyLink: string;
      watchYoutube: string;
      baseLinkHeader: string; // "BASE LINK:"
      troopLinkHeader: string; // "TROOP LINK:"
    };
    comments: {
      title: string;
      placeholder: string;
      submit: string;
      submitting: string;
      replyPlaceholder: string;
      noComments: string;
      loginToComment: string;
      deleteConfirmation: string;
    };
    share: {
      title: string;
      copyLink: string;
      copied: string;
    };
  };
}
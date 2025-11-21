import { KnowledgeHubSection } from '../../sections/knowledge-hub';

export const knowledgeHub: KnowledgeHubSection = {
  page: {
    title: "Knowledge Hub",
    description: "Share and discover the best Clash of Clans strategies and base designs.",
    createButton: "Create Post",
    searchPlaceholder: "Search posts...",
    filters: {
      all: "All Posts",
      baseBuilding: "Base Building",
      attackStrategy: "Attack Strategy",
    },
    emptyState: "No posts found. Be the first to share your knowledge!",
  },
  sorting: {
    label: "Sort By",
    newest: "Newest",
    trending: "Trending",
  },
  create: {
    title: "Create New Post",
    editTitle: "Edit Your Post",
    backButton: "Back to Hub",
    submitButton: "Publish Post",
    submitting: "Publishing...",
    cancelButton: "Cancel",
  },
  form: {
    labels: {
      title: "Post Title",
      type: "Post Type",
      baseBuilding: "Base Type",
      strategyType: "Strategy Type",
      townHall: "Town Hall Level",
      tags: "Tags",
      description: "Description",
      youtubeUrl: "YouTube Video URL",
      image: "Upload Image",
    },
    placeholders: {
      title: "e.g., Unbeatable TH15 War Base",
      description: "Explain your strategy or base design in detail...",
      youtubeUrl: "https://youtube.com/watch?v=...",
      tags: "Type a tag and press Enter",
    },
    helpText: {
      tags: "Press Enter to add a tag (max 5)",
      image: "Supported formats: JPG, PNG, WEBP (Max 5MB)",
    },
    options: {
      types: {
        baseBuilding: "Base Building",
        attackStrategy: "Attack Strategy",
      },
      baseBuilding: {
        warBase: "War Base",
        farmingBase: "Farming Base",
        trophyBase: "Trophy Base",
        hybridBase: "Hybrid Base",
        progressBase: "Progress Base",
      },
      strategy: {
        ground: "Ground Attack",
        air: "Air Attack",
        hybrid: "Hybrid Attack",
        spam: "Spam Attack",
        precision: "Precision Attack",
      },
    },
    validation: {
      titleRequired: "Title is required",
      titleMinLength: "Title must be at least 5 characters",
      typeRequired: "Post type is required",
      descriptionRequired: "Description is required",
      descriptionMinLength: "Description must be at least 20 characters",
      youtubeInvalid: "Please enter a valid YouTube URL",
      imageRequired: "Image is required for base designs",
      baseBuildingRequired: "Base type is required",
      strategyTypeRequired: "Strategy type is required",
      townHallRequired: "Town Hall level is required",
    },
    messages: {
      createSuccess: "Post created successfully!",
      createError: "Failed to create post. Please try again.",
      uploadError: "Failed to upload image.",
      imageSizeError: "Image size must be less than 5MB",
    },
  },
  detail: {
    meta: {
      author: "By",
      published: "Published",
      views: "Views",
      likes: "Likes",
      comments: "Comments",
      categoryLabel: "Category:", // <-- BARU
      anonymous: "Anonymous Contributor", // <-- BARU
      invalidDate: "Invalid Date", // <-- BARU
      noTags: "#NO_TAGS", // <-- BARU
    },
    sections: {
      about: "About this Strategy",
      strategy: "Strategy Breakdown",
      comments: "Discussion",
    },
    actions: {
      like: "Like",
      share: "Share",
      reply: "Reply",
      delete: "Delete",
      edit: "Edit",
      report: "Report",
      // --- TOMBOL KHUSUS BARU ---
      copyBaseLink: "Copy Base Link",
      copyArmyLink: "Copy Army Link",
      watchYoutube: "Watch on YouTube",
      baseLinkHeader: "BASE LINK:",
      troopLinkHeader: "TROOP LINK:",
    },
    comments: {
      title: "Comments",
      placeholder: "Write a comment...",
      submit: "Post Comment",
      submitting: "Posting...",
      replyPlaceholder: "Write a reply...",
      noComments: "No comments yet. Start the conversation!",
      loginToComment: "Please login to comment",
      deleteConfirmation: "Are you sure you want to delete this comment?",
    },
    share: {
      title: "Share Post",
      copyLink: "Copy Link",
      copied: "Link copied!",
    },
  },
};
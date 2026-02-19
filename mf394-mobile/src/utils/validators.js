export const validators = {
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidContactName(name) {
    return name && name.trim().length > 0 && name.length <= 100;
  },

  isValidTag(tagName) {
    return tagName && tagName.trim().length > 0 && tagName.length <= 20;
  },

  isValidImageUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  getValidationErrors(contact) {
    const errors = [];

    if (!contact.name || !validators.isValidContactName(contact.name)) {
      errors.push("Contact name is required and must be less than 100 characters");
    }

    if (!contact.photo && !contact.hint) {
      errors.push("Please provide either a photo or a description");
    }

    return errors;
  },
};

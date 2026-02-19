import apiClient from "./apiClient";

export const contactService = {
  async getContacts() {
    try {
      const response = await apiClient.get("/api/contacts");
      return response.data.contacts || [];
    } catch (error) {
      console.error("Error fetching contacts:", error);
      throw error;
    }
  },

  async createContact(contactData) {
    try {
      const response = await apiClient.post("/api/contacts", contactData);
      return response.data.contact;
    } catch (error) {
      console.error("Error creating contact:", error);
      throw error;
    }
  },

  async updateContact(contactId, contactData) {
    try {
      const response = await apiClient.put(`/api/contacts/${contactId}`, contactData);
      return response.data.contact;
    } catch (error) {
      console.error("Error updating contact:", error);
      throw error;
    }
  },

  async deleteContact(contactId) {
    try {
      await apiClient.delete(`/api/contacts/${contactId}`);
      return true;
    } catch (error) {
      console.error("Error deleting contact:", error);
      throw error;
    }
  },

  async getTags() {
    try {
      const response = await apiClient.get("/api/tags");
      return response.data.tags || [];
    } catch (error) {
      console.error("Error fetching tags:", error);
      throw error;
    }
  },

  async createTag(tagName) {
    try {
      const response = await apiClient.post("/api/tags", { name: tagName });
      return response.data.tag;
    } catch (error) {
      console.error("Error creating tag:", error);
      throw error;
    }
  },

  async deleteTag(tagId) {
    try {
      await apiClient.delete(`/api/tags/${tagId}`);
      return true;
    } catch (error) {
      console.error("Error deleting tag:", error);
      throw error;
    }
  },
};

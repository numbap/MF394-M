import { contactService } from "../../src/services/contactService";
import apiClient from "../../src/services/apiClient";

jest.mock("../../src/services/apiClient");

describe("contactService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getContacts", () => {
    it("should fetch contacts successfully", async () => {
      const mockContacts = [
        { _id: "1", name: "John" },
        { _id: "2", name: "Jane" },
      ];

      apiClient.get.mockResolvedValue({
        data: { contacts: mockContacts },
      });

      const result = await contactService.getContacts();

      expect(apiClient.get).toHaveBeenCalledWith("/api/contacts");
      expect(result).toEqual(mockContacts);
    });

    it("should return empty array if no contacts", async () => {
      apiClient.get.mockResolvedValue({ data: { contacts: null } });

      const result = await contactService.getContacts();

      expect(result).toEqual([]);
    });

    it("should handle error", async () => {
      const error = new Error("Network error");
      apiClient.get.mockRejectedValue(error);

      await expect(contactService.getContacts()).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("createContact", () => {
    it("should create a contact", async () => {
      const contactData = { name: "Bob", groups: [] };
      const mockContact = { _id: "3", ...contactData };

      apiClient.post.mockResolvedValue({
        data: { contact: mockContact },
      });

      const result = await contactService.createContact(contactData);

      expect(apiClient.post).toHaveBeenCalledWith("/api/contacts", contactData);
      expect(result).toEqual(mockContact);
    });
  });

  describe("deleteContact", () => {
    it("should delete a contact", async () => {
      apiClient.delete.mockResolvedValue({});

      const result = await contactService.deleteContact("1");

      expect(apiClient.delete).toHaveBeenCalledWith("/api/contacts/1");
      expect(result).toBe(true);
    });
  });
});

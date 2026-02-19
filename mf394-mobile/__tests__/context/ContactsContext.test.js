import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import {
  ContactsProvider,
  ContactsContext,
} from "../../src/context/ContactsContext";
import { contactService } from "../../src/services/contactService";

jest.mock("../../src/services/contactService");

describe("ContactsContext", () => {
  it("loads contacts on mount", async () => {
    const mockContacts = [{ _id: "1", name: "John" }];
    contactService.getContacts.mockResolvedValue(mockContacts);

    let contextValue;
    const TestComponent = () => {
      contextValue = React.useContext(ContactsContext);
      return null;
    };

    render(
      <ContactsProvider>
        <TestComponent />
      </ContactsProvider>
    );

    await waitFor(() => {
      expect(contextValue.contacts).toEqual(mockContacts);
    });
  });

  it("provides addContact function", async () => {
    const mockContact = { _id: "1", name: "John" };
    contactService.createContact.mockResolvedValue(mockContact);
    contactService.getContacts.mockResolvedValue([]);

    let contextValue;
    const TestComponent = () => {
      contextValue = React.useContext(ContactsContext);
      return null;
    };

    render(
      <ContactsProvider>
        <TestComponent />
      </ContactsProvider>
    );

    await waitFor(() => {
      expect(contextValue.createContact).toBeDefined();
    });
  });
});

import React, { createContext, useReducer, useCallback, useEffect } from "react";
import { contactService } from "../services/contactService";

export const ContactsContext = createContext();

const initialState = {
  contacts: [],
  tags: [],
  filteredByTags: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

function contactsReducer(state, action) {
  switch (action.type) {
    case "SET_CONTACTS":
      return {
        ...state,
        contacts: action.payload,
        lastUpdated: new Date().toISOString(),
      };

    case "ADD_CONTACT":
      return {
        ...state,
        contacts: [...state.contacts, action.payload],
      };

    case "UPDATE_CONTACT":
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          c._id === action.payload._id ? action.payload : c
        ),
      };

    case "DELETE_CONTACT":
      return {
        ...state,
        contacts: state.contacts.filter((c) => c._id !== action.payload),
      };

    case "SET_TAGS":
      return {
        ...state,
        tags: action.payload,
      };

    case "ADD_TAG":
      return {
        ...state,
        tags: [...state.tags, action.payload],
      };

    case "DELETE_TAG":
      return {
        ...state,
        tags: state.tags.filter((t) => t._id !== action.payload),
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };

    case "FILTER_BY_TAGS":
      return {
        ...state,
        filteredByTags: action.payload,
      };

    default:
      return state;
  }
}

export function ContactsProvider({ children }) {
  const [state, dispatch] = useReducer(contactsReducer, initialState);

  const loadContacts = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const contacts = await contactService.getContacts();
      dispatch({ type: "SET_CONTACTS", payload: contacts });
      dispatch({ type: "SET_ERROR", payload: null });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const createContact = useCallback(async (contactData) => {
    try {
      const newContact = await contactService.createContact(contactData);
      dispatch({ type: "ADD_CONTACT", payload: newContact });
      return newContact;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  }, []);

  const updateContact = useCallback(async (contactId, contactData) => {
    try {
      const updatedContact = await contactService.updateContact(
        contactId,
        contactData
      );
      dispatch({ type: "UPDATE_CONTACT", payload: updatedContact });
      return updatedContact;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  }, []);

  const deleteContact = useCallback(async (contactId) => {
    try {
      await contactService.deleteContact(contactId);
      dispatch({ type: "DELETE_CONTACT", payload: contactId });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  }, []);

  const loadTags = useCallback(async () => {
    try {
      const tags = await contactService.getTags();
      dispatch({ type: "SET_TAGS", payload: tags });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, []);

  const createTag = useCallback(async (tagName) => {
    try {
      const tag = await contactService.createTag(tagName);
      dispatch({ type: "ADD_TAG", payload: tag });
      return tag;
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  }, []);

  const deleteTag = useCallback(async (tagId) => {
    try {
      await contactService.deleteTag(tagId);
      dispatch({ type: "DELETE_TAG", payload: tagId });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      throw error;
    }
  }, []);

  const filterByTags = useCallback((tagIds) => {
    dispatch({ type: "FILTER_BY_TAGS", payload: tagIds });
  }, []);

  const getFilteredContacts = useCallback(() => {
    if (state.filteredByTags.length === 0) {
      return state.contacts;
    }

    return state.contacts.filter((contact) =>
      state.filteredByTags.some((tagId) => contact.groups?.includes(tagId))
    );
  }, [state.contacts, state.filteredByTags]);

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const value = {
    ...state,
    loadContacts,
    createContact,
    updateContact,
    deleteContact,
    loadTags,
    createTag,
    deleteTag,
    filterByTags,
    getFilteredContacts,
  };

  return (
    <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>
  );
}

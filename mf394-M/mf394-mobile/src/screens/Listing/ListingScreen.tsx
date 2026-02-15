/**
 * ListingScreen
 *
 * Displays a filtered list of contacts with:
 * - Category and tag filtering
 * - Card/Thumbnail view toggle
 * - Long-press or double-tap to edit
 * - Status bar showing visible count
 */

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useRoute } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "../../theme/theme";
import { RootState, AppDispatch } from "../../store";
import { setContacts, setLoading } from "../../store/slices/contacts.slice";
import { Contact } from "../../store/api/contacts.api";
import { transformMockContacts } from "../../utils/contactDataTransform";
import { ContactCard } from "../../components/ContactCard";
import { SummaryThumbnail } from "../../components/SummaryThumbnail";
import { CategoryTagFilter } from "../../components/CategoryTagFilter";
import { FilterContainer } from "../../components/FilterContainer";
import { StorageService } from "../../services/storage.service";
import { CATEGORIES } from "../../constants";

export default function ListingScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const route = useRoute();
  const contacts = useSelector((state: RootState) => state.contacts.data);
  const loading = useSelector((state: RootState) => state.contacts.loading);
  const { width } = useWindowDimensions();

  // Get filter params from navigation (if navigated from save)
  const routeParams = route.params as { category?: string; tags?: string[] } | undefined;

  // Local filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isGalleryView, setIsGalleryView] = useState(false);

  // Double-tap detection
  const lastTapTime = useRef<{ [key: string]: number }>({});
  const DOUBLE_TAP_DELAY = 300; // milliseconds

  // Responsive breakpoint for tablet layout
  const TABLET_BREAKPOINT = 768;
  const isTablet = width >= TABLET_BREAKPOINT;

  // Load contacts from storage or mock data on mount
  useEffect(() => {
    const loadContacts = async () => {
      if (contacts.length === 0) {
        try {
          dispatch(setLoading(true));

          // Try to load from storage first
          const storedContacts = await StorageService.loadContacts();

          if (storedContacts.length > 0) {
            // Use stored contacts
            dispatch(setContacts(storedContacts));
          } else {
            // Fallback to mock data if storage is empty
            const mockUserDataRaw = require("../../mock_user.json");
            const mockUserData =
              typeof mockUserDataRaw === "string" ? JSON.parse(mockUserDataRaw) : mockUserDataRaw;

            if (mockUserData?.contacts) {
              const transformed = transformMockContacts(mockUserData.contacts);
              dispatch(setContacts(transformed));
              // Save to storage for next time
              await StorageService.saveContacts(transformed);
            }
          }
        } catch (error) {
          console.error("Failed to load contacts:", error);
        } finally {
          dispatch(setLoading(false));
        }
      }
    };
    loadContacts();
  }, [dispatch, contacts.length]);

  // Persist contacts to storage whenever they change
  useEffect(() => {
    if (contacts.length > 0) {
      StorageService.saveContacts(contacts);
    }
  }, [contacts]);

  // Apply filters from route params (when navigating from Add/Edit/Party)
  useEffect(() => {
    if (routeParams?.category) {
      setSelectedCategories([routeParams.category]);
      if (routeParams.tags && routeParams.tags.length > 0) {
        setSelectedTags(routeParams.tags);
      } else {
        setSelectedTags([]);
      }
    }
  }, [routeParams?.category, routeParams?.tags]);

  // Get available tags from category-filtered contacts
  const availableTags = useMemo(() => {
    if (selectedCategories.length === 0) {
      return [];
    }
    const categorySet = new Set(selectedCategories);
    const filtered = contacts.filter((c) => categorySet.has(c.category));
    const tagsSet = new Set<string>();
    filtered.forEach((c) => {
      c.groups?.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [contacts, selectedCategories]);

  // Filter contacts by selected categories and tags
  const filteredContacts = useMemo(() => {
    if (selectedCategories.length === 0) {
      return [];
    }

    const categorySet = new Set(selectedCategories);
    let result = contacts.filter((c) => categorySet.has(c.category));

    if (selectedTags.length > 0) {
      const tagSet = new Set(selectedTags);
      result = result.filter((c) => c.groups?.some((tag) => tagSet.has(tag)));
    }

    // Sort by edited timestamp (descending), fallback to created
    result.sort((a, b) => {
      const aTime = a.edited || a.created || 0;
      const bTime = b.edited || b.created || 0;
      return bTime - aTime; // Descending order (newest first)
    });

    return result;
  }, [contacts, selectedCategories, selectedTags]);

  // Handle category selection
  const handleCategoryPress = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
    // Clear tags when categories change
    setSelectedTags([]);
  };

  // Handle category long-press (select/deselect all)
  const handleCategoryLongPress = () => {
    if (selectedCategories.length >= CATEGORIES.length / 2) {
      // If 50% or more selected, deselect all
      setSelectedCategories([]);
    } else {
      // If less than 50% selected, select all
      setSelectedCategories(CATEGORIES.map((c) => c.value));
    }
    setSelectedTags([]);
  };

  // Handle tag selection
  const handleTagPress = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Handle tag long-press (select/deselect all)
  const handleTagLongPress = () => {
    if (selectedTags.length >= availableTags.length / 2) {
      // If 50% or more selected, deselect all
      setSelectedTags([]);
    } else {
      // If less than 50% selected, select all
      setSelectedTags([...availableTags]);
    }
  };

  // Handle contact long-press (edit)
  const handleContactLongPress = (contactId: string) => {
    navigation.navigate("EditContact", { contactId });
  };

  // Handle contact press (detect double-tap for edit)
  const handleContactPress = (contactId: string) => {
    const now = Date.now();
    const lastTap = lastTapTime.current[contactId] || 0;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double-tap detected, navigate to edit
      handleContactLongPress(contactId);
      lastTapTime.current[contactId] = 0; // Reset to prevent triple-tap
    } else {
      // Single tap, just update last tap time
      lastTapTime.current[contactId] = now;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Category Filter Header */}
        <View style={styles.section}>
          <FilterContainer>
            <CategoryTagFilter
              categories={CATEGORIES}
              selectedCategories={selectedCategories}
              onCategoryPress={handleCategoryPress}
              onCategoryLongPress={handleCategoryLongPress}
            />

            {/* Tag Filter */}
            {selectedCategories.length > 0 && availableTags.length > 0 && (
              <View style={styles.tagsSection}>
                <View style={styles.tagsContainer}>
                  {availableTags.map((tag) => (
                    <Pressable
                      key={tag}
                      onPress={() => handleTagPress(tag)}
                      onLongPress={handleTagLongPress}
                      delayLongPress={500}
                      style={[
                        styles.tagButton,
                        selectedTags.includes(tag) && styles.tagButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          selectedTags.includes(tag) && styles.tagTextSelected,
                        ]}
                      >
                        {tag}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate("AddContact")}
                >
                  <FontAwesome name="user-plus" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Add</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate("PartyMode")}
                >
                  <FontAwesome name="users" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Party</Text>
                </TouchableOpacity>
              </View>

              {/* View Toggle */}
              <TouchableOpacity
                style={styles.viewToggle}
                onPress={() => setIsGalleryView(!isGalleryView)}
              >
                <FontAwesome
                  name={isGalleryView ? "th-list" : "th"}
                  size={18}
                  color={colors.semantic.text}
                />
              </TouchableOpacity>
            </View>
          </FilterContainer>
        </View>

        {/* Contacts List */}
        {selectedCategories.length > 0 && (
          <View style={styles.contactsSection}>
            {filteredContacts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No contacts found</Text>
              </View>
            ) : isGalleryView ? (
              // Thumbnail view
              <View
                style={[
                  styles.thumbnailGrid,
                  { justifyContent: isTablet ? "flex-start" : "center" },
                ]}
              >
                {filteredContacts.map((contact) => (
                  <Pressable
                    key={contact._id}
                    onPress={() => handleContactPress(contact._id)}
                    onLongPress={() => handleContactLongPress(contact._id)}
                    delayLongPress={500}
                    style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                  >
                    <SummaryThumbnail id={contact._id} name={contact.name} photo={contact.photo} />
                  </Pressable>
                ))}
              </View>
            ) : (
              // Card view
              <View
                style={[
                  styles.cardsList,
                  { justifyContent: isTablet ? "flex-start" : "center" },
                ]}
              >
                {filteredContacts.map((contact) => (
                  <Pressable
                    key={contact._id}
                    onPress={() => handleContactPress(contact._id)}
                    onLongPress={() => handleContactLongPress(contact._id)}
                    delayLongPress={500}
                    style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                  >
                    <ContactCard contact={contact} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Status Bar */}
      {selectedCategories.length > 0 && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            {filteredContacts.length} of {contacts.length} visible
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.semantic.background,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.semantic.border,
  },
  tagsSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  tagsLabel: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: "600",
    color: colors.semantic.text,
    marginBottom: spacing.md,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tagButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.semantic.border,
    backgroundColor: colors.semantic.surface,
  },
  tagButtonSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[500],
  },
  tagText: {
    fontSize: typography.body.small.fontSize,
    color: colors.semantic.text,
    fontWeight: "500",
  },
  tagTextSelected: {
    color: "#fff",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: spacing.md,
    flex: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary[500],
    borderRadius: radii.md,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: typography.body.medium.fontSize,
  },
  viewToggle: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radii.md,
    backgroundColor: colors.semantic.surface,
    borderWidth: 1,
    borderColor: colors.semantic.border,
  },
  contactsSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: typography.body.large.fontSize,
    color: colors.semantic.textSecondary,
    fontWeight: "500",
  },
  thumbnailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  cardsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
  },
  statusBar: {
    borderTopWidth: 1,
    borderTopColor: colors.semantic.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.semantic.surface,
  },
  statusText: {
    fontSize: typography.body.small.fontSize,
    color: colors.semantic.textSecondary,
    fontWeight: "500",
  },
});

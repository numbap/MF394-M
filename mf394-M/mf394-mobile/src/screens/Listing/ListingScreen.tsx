/**
 * ListingScreen
 *
 * Displays a filtered list of contacts with:
 * - Category and tag filtering
 * - Card/Thumbnail view toggle
 * - Long-press to edit
 * - Status bar showing visible count
 */

import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { FontAwesome } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "../../theme/theme";
import { RootState, AppDispatch } from "../../store";
import { setContacts, setLoading } from "../../store/slices/contacts.slice";
import { Contact } from "../../store/api/contacts.api";
import { transformMockContacts } from "../../utils/contactDataTransform";
import { ContactCard } from "../../components/ContactCard";
import { SummaryThumbnail } from "../../components/SummaryThumbnail";

// Category definitions with icons
const CATEGORIES = [
  {
    label: "Friends & Family",
    value: "friends-family",
    icon: "heart",
  },
  {
    label: "Community",
    value: "community",
    icon: "globe",
  },
  {
    label: "Work",
    value: "work",
    icon: "briefcase",
  },
  {
    label: "Goals & Hobbies",
    value: "goals-hobbies",
    icon: "trophy",
  },
  {
    label: "Miscellaneous",
    value: "miscellaneous",
    icon: "star",
  },
];

export default function ListingScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const contacts = useSelector((state: RootState) => state.contacts.data);
  const loading = useSelector((state: RootState) => state.contacts.loading);

  // Local filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isGalleryView, setIsGalleryView] = useState(false);

  // Load mock data on mount
  useEffect(() => {
    const loadMockData = async () => {
      if (contacts.length === 0) {
        try {
          dispatch(setLoading(true));
          const mockUserDataRaw = require("../../mock_user.json");
          const mockUserData =
            typeof mockUserDataRaw === "string" ? JSON.parse(mockUserDataRaw) : mockUserDataRaw;

          if (mockUserData?.contacts) {
            const transformed = transformMockContacts(mockUserData.contacts);
            dispatch(setContacts(transformed));
          }
        } catch (error) {
          console.error("Failed to load mock data:", error);
        } finally {
          dispatch(setLoading(false));
        }
      }
    };
    loadMockData();
  }, [dispatch, contacts.length]);

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

  // Get category label for header
  const getCategoryHeader = () => {
    if (selectedCategories.length === 0) {
      return "Select a Category";
    }
    if (selectedCategories.length === 1) {
      return CATEGORIES.find((c) => c.value === selectedCategories[0])?.label || "";
    }
    if (selectedCategories.length === 2) {
      const labels = selectedCategories
        .map((cat) => CATEGORIES.find((c) => c.value === cat)?.label)
        .filter(Boolean);
      return labels.join(" + ");
    }
    return "Multiple Selected";
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Category Filter Header */}
        <View style={styles.section}>
          <Text style={styles.filterHeader}>{getCategoryHeader()}</Text>

          {/* Category Icons */}
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.value}
                onPress={() => handleCategoryPress(cat.value)}
                onLongPress={handleCategoryLongPress}
                delayLongPress={500}
                style={[
                  styles.categoryButton,
                  selectedCategories.includes(cat.value) && styles.categoryButtonSelected,
                ]}
              >
                <FontAwesome
                  name={cat.icon as any}
                  size={24}
                  color={
                    selectedCategories.includes(cat.value)
                      ? colors.primary[500]
                      : colors.semantic.textSecondary
                  }
                />
              </Pressable>
            ))}
          </View>

          {/* Tag Filter */}
          {selectedCategories.length > 0 && availableTags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.tagsLabel}>Tags</Text>
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
                      style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}
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
              <View style={styles.thumbnailGrid}>
                {filteredContacts.map((contact) => (
                  <Pressable
                    key={contact._id}
                    onLongPress={() => handleContactLongPress(contact._id)}
                    delayLongPress={500}
                  >
                    <SummaryThumbnail id={contact._id} name={contact.name} photo={contact.photo} />
                  </Pressable>
                ))}
              </View>
            ) : (
              // Card view
              <View style={styles.cardsList}>
                {filteredContacts.map((contact) => (
                  <Pressable
                    key={contact._id}
                    onLongPress={() => handleContactLongPress(contact._id)}
                    delayLongPress={500}
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
  filterHeader: {
    fontSize: typography.title.large.fontSize,
    fontWeight: "700",
    color: colors.semantic.text,
    marginBottom: spacing.lg,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  categoryButton: {
    width: "18%",
    aspectRatio: 1,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.semantic.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.semantic.surface,
  },
  categoryButtonSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  tagsSection: {
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
    justifyContent: "space-between",
    gap: spacing.md,
  },
  cardsList: {
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

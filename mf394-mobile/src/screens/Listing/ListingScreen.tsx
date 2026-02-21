/**
 * ListingScreen
 *
 * Displays a filtered list of contacts with:
 * - Category and tag filtering
 * - Card/Thumbnail view toggle
 * - Long-press or double-tap to edit
 * - Status bar showing visible count
 * - Data loaded from live API via RTK Query
 */

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useRoute } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "../../theme/theme";
import { RootState, AppDispatch } from "../../store";
import {
  toggleCategory,
  toggleTag,
  setCategories,
  setTags,
  restoreFilters,
  selectSelectedCategories,
  selectSelectedTags,
  selectFiltersLoaded,
} from "../../store/slices/filters.slice";
import { useGetUserQuery } from "../../store/api/contacts.api";
import { ContactCard } from "../../components/ContactCard";
import { SummaryThumbnail } from "../../components/SummaryThumbnail";
import { CategoryTagFilter } from "../../components/CategoryTagFilter";
import { FilterContainer } from "../../components/FilterContainer";
import { StorageService } from "../../services/storage.service";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { CATEGORIES } from "../../constants";

export default function ListingScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const route = useRoute();
  const selectedCategories = useSelector(selectSelectedCategories);
  const selectedTags = useSelector(selectSelectedTags);
  const filtersLoaded = useSelector(selectFiltersLoaded);
  const { width } = useWindowDimensions();
  const { isOnline } = useNetworkStatus();

  const routeParams = route.params as { category?: string; tags?: string[] } | undefined;

  const [isGalleryView, setIsGalleryView] = useState(false);

  const lastTapTime = useRef<{ [key: string]: number }>({});
  const DOUBLE_TAP_DELAY = 300;

  const THUMBNAIL_SIZE = 110;
  const numColumns = isGalleryView
    ? Math.max(1, Math.floor((width - spacing.lg * 2) / (THUMBNAIL_SIZE + spacing.md)))
    : 1;

  // Load all contacts + tags from /api/user (single call)
  const { data: userData, isLoading, error } = useGetUserQuery();
  const contacts = userData?.contacts || [];

  // Load filters from storage on mount
  useEffect(() => {
    const loadFilters = async () => {
      if (!filtersLoaded) {
        try {
          const storedFilters = await StorageService.loadFilters();
          dispatch(restoreFilters(storedFilters));
        } catch (err) {
          console.error("Failed to load filters:", err);
        }
      }
    };
    loadFilters();
  }, [dispatch, filtersLoaded]);

  // Apply filters from route params (when navigating from Add/Edit/Party)
  useEffect(() => {
    if (routeParams?.category) {
      dispatch(setCategories([routeParams.category]));
      if (routeParams.tags && routeParams.tags.length > 0) {
        dispatch(setTags(routeParams.tags));
      } else {
        dispatch(setTags([]));
      }
    }
  }, [dispatch, routeParams?.category, routeParams?.tags]);

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

    result.sort((a, b) => {
      const aTime = a.edited || a.created || 0;
      const bTime = b.edited || b.created || 0;
      return bTime - aTime;
    });

    return result;
  }, [contacts, selectedCategories, selectedTags]);

  const handleCategoryPress = (category: string) => {
    dispatch(toggleCategory(category));
  };

  const handleCategoryLongPress = () => {
    if (selectedCategories.length >= CATEGORIES.length / 2) {
      dispatch(setCategories([]));
    } else {
      dispatch(setCategories(CATEGORIES.map((c) => c.value)));
    }
  };

  const handleTagPress = (tag: string) => {
    dispatch(toggleTag(tag));
  };

  const handleTagLongPress = () => {
    if (selectedTags.length >= availableTags.length / 2) {
      dispatch(setTags([]));
    } else {
      dispatch(setTags([...availableTags]));
    }
  };

  const handleContactLongPress = (contactId: string) => {
    navigation.navigate("EditContact", { contactId });
  };

  const handleContactPress = (contactId: string) => {
    const now = Date.now();
    const lastTap = lastTapTime.current[contactId] || 0;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      handleContactLongPress(contactId);
      lastTapTime.current[contactId] = 0;
    } else {
      lastTapTime.current[contactId] = now;
    }
  };

  const handleAddContact = () => {
    if (!isOnline) return;
    navigation.navigate("AddContact");
  };

  const handlePartyMode = () => {
    if (!isOnline) return;
    navigation.navigate("PartyMode");
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.stateText}>Loading contacts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    console.error('[Contacts] error:', JSON.stringify(error));
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <Text style={styles.errorText}>Failed to load contacts</Text>
          <Text style={styles.stateText}>Please check your connection and try again.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filterHeader = (
    <View style={styles.section}>
      <FilterContainer>
        <CategoryTagFilter
          categories={CATEGORIES}
          selectedCategories={selectedCategories}
          onCategoryPress={handleCategoryPress}
          onCategoryLongPress={handleCategoryLongPress}
          availableTags={availableTags}
          selectedTags={selectedTags}
          onTagPress={handleTagPress}
          onTagLongPress={handleTagLongPress}
        />

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.actionButton, !isOnline && styles.actionButtonDisabled]}
              onPress={handleAddContact}
              disabled={!isOnline}
            >
              <FontAwesome name="user-plus" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Add</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, !isOnline && styles.actionButtonDisabled]}
              onPress={handlePartyMode}
              disabled={!isOnline}
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
  );

  const statusFooter = selectedCategories.length > 0 ? (
    <View style={styles.statusBar}>
      <Text style={styles.statusText}>
        {filteredContacts.length} of {contacts.length} visible
      </Text>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: contacts.length > 0
                ? `${(filteredContacts.length / contacts.length) * 100}%`
                : '0%',
            },
          ]}
        />
      </View>
    </View>
  ) : null;

  const emptyState = selectedCategories.length > 0 ? (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No contacts found</Text>
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        key={isGalleryView ? 'gallery' : 'cards'}
        data={selectedCategories.length > 0 ? filteredContacts : []}
        keyExtractor={(item) => item._id}
        numColumns={numColumns}
        columnWrapperStyle={isGalleryView && numColumns > 1 ? styles.row : undefined}
        renderItem={({ item: contact }) => (
          <Pressable
            onPress={() => handleContactPress(contact._id)}
            onLongPress={() => handleContactLongPress(contact._id)}
            delayLongPress={500}
            style={({ pressed }) => [
              isGalleryView ? styles.thumbnailItem : styles.cardItem,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            {isGalleryView
              ? <SummaryThumbnail id={contact._id} name={contact.name} photo={contact.photo} />
              : <ContactCard contact={contact} />}
          </Pressable>
        )}
        ListHeaderComponent={filterHeader}
        ListFooterComponent={statusFooter}
        ListEmptyComponent={emptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.semantic.background,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  centeredState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  stateText: {
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.textSecondary,
    textAlign: "center",
  },
  errorText: {
    fontSize: typography.title.medium.fontSize,
    fontWeight: "600",
    color: colors.semantic.error,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.semantic.border,
  },
  actionRow: {
    paddingTop: spacing.lg,
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
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: typography.body.medium.fontSize,
  },
  viewToggle: {
    marginLeft: spacing.lg,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radii.md,
    backgroundColor: colors.semantic.surface,
    borderWidth: 1,
    borderColor: colors.semantic.border,
  },
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    justifyContent: "flex-start",
  },
  thumbnailItem: {
    margin: spacing.xs,
  },
  cardItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
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
  statusBar: {
    borderTopWidth: 1,
    borderTopColor: colors.semantic.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.semantic.surface,
    gap: spacing.sm,
  },
  statusText: {
    fontSize: typography.body.small.fontSize,
    color: colors.semantic.textSecondary,
    fontWeight: "500",
  },
  progressTrack: {
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.neutral.iron[100],
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.primary[500],
  },
});

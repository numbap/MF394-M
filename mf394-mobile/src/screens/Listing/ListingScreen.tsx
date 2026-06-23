// ListingScreen — orchestrator: Redux selectors, filtering, navigation.
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector, useDispatch } from "react-redux";
import { useRoute } from "@react-navigation/native";
import { colors, spacing, typography } from "../../theme/theme";
import { AppDispatch } from "../../store";
import {
  toggleCategory,
  toggleTag,
  setCategories,
  setTags,
  selectSelectedCategories,
  selectSelectedTags,
} from "../../store/slices/filters.slice";
import { useGetUserQuery } from "../../store/api/contacts.api";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { CATEGORIES } from "../../constants";
import { ContactList } from "./ContactList";
import { ListingFilterHeader } from "./ListingFilterHeader";

const THUMBNAIL_SIZE = 110;
const CARD_WIDTH = 180;
const DOUBLE_TAP_DELAY = 300;

export default function ListingScreen({ navigation }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const route = useRoute();
  const selectedCategories = useSelector(selectSelectedCategories);
  const selectedTags = useSelector(selectSelectedTags);
  const { width } = useWindowDimensions();
  const { isOnline } = useNetworkStatus();

  const routeParams = route.params as { category?: string; tags?: string[] } | undefined;
  const [isGalleryView, setIsGalleryView] = useState(false);
  const lastTapTime = useRef<{ [key: string]: number }>({});

  const galleryColumns = Math.max(
    1,
    Math.floor((width - spacing.lg * 2) / (THUMBNAIL_SIZE + spacing.xxs))
  );
  const cardColumns = Math.max(
    1,
    Math.floor(width / (CARD_WIDTH + spacing.sm))
  );
  const numColumns = isGalleryView ? galleryColumns : cardColumns;

  const { data: userData, isLoading, error } = useGetUserQuery();
  const contacts = userData?.contacts || [];

  useEffect(() => {
    if (routeParams?.category) {
      dispatch(setCategories([routeParams.category]));
      dispatch(setTags(routeParams.tags?.length ? routeParams.tags : []));
    }
  }, [dispatch, routeParams?.category, routeParams?.tags]);

  const availableTags = useMemo(() => {
    if (selectedCategories.length === 0) return [];
    const categorySet = new Set(selectedCategories);
    const filtered = contacts.filter((c) => categorySet.has(c.category));
    const tagsSet = new Set<string>();
    filtered.forEach((c) => c.groups?.forEach((tag) => tagsSet.add(tag)));
    return Array.from(tagsSet).sort();
  }, [contacts, selectedCategories]);

  const filteredContacts = useMemo(() => {
    if (selectedCategories.length === 0) return [];
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

  const handleCategoryLongPress = () => {
    if (selectedCategories.length >= CATEGORIES.length / 2) {
      dispatch(setCategories([]));
    } else {
      dispatch(setCategories(CATEGORIES.map((c) => c.value)));
    }
  };

  const handleTagLongPress = () => {
    if (selectedTags.length >= availableTags.length / 2) {
      dispatch(setTags([]));
    } else {
      dispatch(setTags([...availableTags]));
    }
  };

  const handleContactLongPress = (contactId: string) =>
    navigation.navigate("EditContact", { contactId });

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

  if (isLoading && !userData) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.stateText}>Loading contacts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !userData) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.centeredState}>
          <Text style={styles.errorText}>Failed to load contacts</Text>
          <Text style={styles.stateText}>
            Please check your connection and try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const filterHeader = (
    <ListingFilterHeader
      filterState={{
        selectedCategories,
        selectedTags,
        availableTags,
      }}
      filterActions={{
        onCategoryPress: (cat) => dispatch(toggleCategory(cat)),
        onCategoryLongPress: handleCategoryLongPress,
        onTagPress: (tag) => dispatch(toggleTag(tag)),
        onTagLongPress: handleTagLongPress,
        onAddPress: () => isOnline && navigation.navigate("AddContact"),
        onPartyPress: () => isOnline && navigation.navigate("PartyMode"),
        onViewToggle: () => setIsGalleryView(!isGalleryView),
      }}
      isGalleryView={isGalleryView}
      isOnline={isOnline}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ContactList
        contacts={filteredContacts}
        isGalleryView={isGalleryView}
        numColumns={numColumns}
        filterHeader={filterHeader}
        counts={{ filtered: filteredContacts.length, total: contacts.length }}
        onContactPress={handleContactPress}
        onContactLongPress={handleContactLongPress}
        hasCategories={selectedCategories.length > 0}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.semantic.background,
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
});

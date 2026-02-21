import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { showAlert } from "../../utils/showAlert";
import { gameService } from "../../services/gameService";
import { useContacts } from "../../hooks/useContacts";
import shuffle from "../../utils/shuffle";
import { colors, spacing, radii, typography, shadows } from "../../theme/theme";

export default function PracticeGameScreen() {
  const [contacts, setContacts] = useState([]);
  const [images, setImages] = useState([]);
  const [names, setNames] = useState([]);
  const [matched, setMatched] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    loadGameContacts();
  }, []);

  const loadGameContacts = async () => {
    try {
      setIsLoading(true);
      const gameContacts = await gameService.getGameContacts(selectedTags);
      if (gameContacts.length > 0) {
        const shuffled = shuffle(gameContacts);
        setContacts(shuffled);
        setImages(shuffled.map((c) => c._id));
        setNames(shuffle(shuffled.map((c) => c.name)));
        setMatched([]);
        setSelectedImage(null);
      }
    } catch (error) {
      console.error("Error loading game contacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (contactId) => {
    setSelectedImage(contactId);
  };

  const handleNameSelect = (name) => {
    if (!selectedImage) return;

    const contact = contacts.find((c) => c._id === selectedImage);
    if (contact.name === name && !matched.includes(contact._id)) {
      setMatched((prev) => [...prev, contact._id]);
      setSelectedImage(null);

      if (matched.length + 1 === contacts.length) {
        showAlert("Congratulations!", "You matched all contacts!");
      }
    } else {
      setSelectedImage(null);
    }
  };

  const handleReset = () => {
    loadGameContacts();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  const availableImages = images.filter((id) => !matched.includes(id));
  const availableNames = names.filter((name) => {
    const contact = contacts.find((c) => c.name === name);
    return !matched.includes(contact._id);
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
        <Text style={styles.resetButtonText}>Reset</Text>
      </TouchableOpacity>

      <View style={styles.mainContent}>
        <ScrollView horizontal style={styles.imageColumn}>
          {availableImages.map((contactId) => {
            const contact = contacts.find((c) => c._id === contactId);
            return (
              <TouchableOpacity
                key={contactId}
                style={[
                  styles.imageCard,
                  selectedImage === contactId && styles.imageCardSelected,
                ]}
                onPress={() => handleImageSelect(contactId)}
              >
                <View style={styles.imageBox} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.nameColumn}>
          {availableNames.map((name, index) => (
            <TouchableOpacity
              key={index}
              style={styles.nameButton}
              onPress={() => handleNameSelect(name)}
            >
              <Text style={styles.nameText}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.semantic.background,
    padding: spacing.lg,
  },
  resetButton: {
    alignSelf: "flex-end",
    backgroundColor: colors.semantic.cardBackground,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  resetButtonText: {
    ...typography.label.large,
    color: colors.semantic.text,
  },
  mainContent: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.lg,
  },
  imageColumn: {
    flex: 1,
  },
  imageCard: {
    marginRight: spacing.md,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.neutral.bone[200],
    ...shadows.sm,
  },
  imageCardSelected: {
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  imageBox: {
    width: 120,
    height: 120,
    backgroundColor: colors.semantic.surface,
  },
  nameColumn: {
    flex: 1,
    justifyContent: "space-around",
  },
  nameButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.semantic.cardBackground,
    borderRadius: radii.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.neutral.bone[100],
    ...shadows.sm,
  },
  nameText: {
    ...typography.body.large,
    fontWeight: "500",
    color: colors.semantic.text,
  },
});

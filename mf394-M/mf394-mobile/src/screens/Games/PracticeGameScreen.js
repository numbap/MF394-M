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
import { COLORS, SPACING } from "../../utils/constants";

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
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
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
    backgroundColor: COLORS.BACKGROUND,
    padding: SPACING.LG,
  },
  resetButton: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.SURFACE,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: 6,
    marginBottom: SPACING.MD,
  },
  resetButtonText: {
    fontWeight: "600",
    color: COLORS.TEXT,
  },
  mainContent: {
    flex: 1,
    flexDirection: "row",
    gap: SPACING.LG,
  },
  imageColumn: {
    flex: 1,
  },
  imageCard: {
    marginRight: SPACING.MD,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.BORDER,
  },
  imageCardSelected: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 3,
  },
  imageBox: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.SURFACE,
  },
  nameColumn: {
    flex: 1,
    justifyContent: "space-around",
  },
  nameButton: {
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    alignItems: "center",
  },
  nameText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.TEXT,
  },
});

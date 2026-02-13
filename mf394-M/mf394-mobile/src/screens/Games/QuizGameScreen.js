import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { gameService } from "../../services/gameService";
import { useContacts } from "../../hooks/useContacts";
import shuffle from "../../utils/shuffle";
import { COLORS, SPACING } from "../../utils/constants";

export default function QuizGameScreen() {
  const { tags } = useContacts();
  const [contacts, setContacts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    loadGameContacts();
  }, []);

  const loadGameContacts = async () => {
    try {
      setIsLoading(true);
      const gameContacts = await gameService.getGameContacts(selectedTags);
      if (gameContacts.length > 0) {
        setContacts(shuffle(gameContacts));
        setCurrentIndex(0);
        setScore(0);
        setGameOver(false);
      }
    } catch (error) {
      console.error("Error loading game contacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentContact = () => contacts[currentIndex];

  const getMultipleChoice = () => {
    const current = getCurrentContact();
    const options = [current.name];

    while (options.length < 4) {
      const randomContact =
        contacts[Math.floor(Math.random() * contacts.length)];
      if (!options.includes(randomContact.name)) {
        options.push(randomContact.name);
      }
    }

    return shuffle(options);
  };

  const handleAnswer = (answer) => {
    const isCorrect = answer === getCurrentContact().name;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    if (currentIndex + 1 >= contacts.length) {
      setGameOver(true);
      gameService.recordQuizScore(
        score + (isCorrect ? 1 : 0),
        contacts.length,
        selectedTags
      );
    } else {
      setCurrentIndex((prev) => prev + 1);
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

  if (contacts.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No contacts available for quiz</Text>
      </View>
    );
  }

  if (gameOver) {
    return (
      <View style={styles.container}>
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Quiz Complete!</Text>
          <Text style={styles.resultScore}>
            {score} / {contacts.length}
          </Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
          >
            <Text style={styles.resetButtonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const current = getCurrentContact();
  const options = getMultipleChoice();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.scoreText}>
          {currentIndex + 1} / {contacts.length}
        </Text>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>

      <View style={styles.imageBox}>
        <Text style={styles.imageText}>[Face Image]</Text>
      </View>

      <Text style={styles.question}>Who is this?</Text>

      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionButton}
            onPress={() => handleAnswer(option)}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.LG,
  },
  header: {
    position: "absolute",
    top: SPACING.LG,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.LG,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.TEXT,
  },
  imageBox: {
    width: 250,
    height: 250,
    borderRadius: 12,
    backgroundColor: COLORS.SURFACE,
    marginBottom: SPACING.XL,
    justifyContent: "center",
    alignItems: "center",
  },
  imageText: {
    color: COLORS.TEXT_SECONDARY,
  },
  question: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: SPACING.LG,
    color: COLORS.TEXT,
  },
  optionsContainer: {
    width: "100%",
    gap: SPACING.MD,
  },
  optionButton: {
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.TEXT,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  resultBox: {
    alignItems: "center",
    paddingVertical: 40,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: SPACING.LG,
    color: COLORS.TEXT,
  },
  resultScore: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XL,
  },
  resetButton: {
    backgroundColor: COLORS.SECONDARY,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderRadius: 8,
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useSelector, useDispatch } from "react-redux";
import { useGetUserQuery } from "../../store/api/contacts.api";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import shuffle from "../../utils/shuffle";
import { colors, spacing, radii, typography } from "../../theme/theme";
import {
  toggleCategory,
  toggleTag,
  setCategories,
  setTags,
  restoreFilters,
  markFiltersLoaded,
  selectSelectedCategories,
  selectSelectedTags,
  selectFiltersLoaded,
} from "../../store/slices/filters.slice";
import { CategoryTagFilter } from "../../components/CategoryTagFilter";
import { FilterContainer } from "../../components/FilterContainer";
import { QuizCelebration } from "../../components/QuizCelebration";
import { StorageService } from "../../services/storage.service";
import { CATEGORIES } from "../../constants";

export default function QuizGameScreen() {
  const dispatch = useDispatch();

  // RTK Query — primary source of contacts data
  const { data: userData, isLoading: isUserLoading } = useGetUserQuery();
  // useMemo prevents a new [] reference on every render when userData is undefined,
  // which would cause filteredContacts to recompute and trigger the quiz-load effect.
  const allContacts = useMemo(() => userData?.contacts || [], [userData]);

  // Redux state
  const selectedCategories = useSelector(selectSelectedCategories);
  const selectedTags = useSelector(selectSelectedTags);
  const filtersLoaded = useSelector(selectFiltersLoaded);

  // Local state
  const [quizContacts, setQuizContacts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentOptions, setCurrentOptions] = useState([]); // Store options for current question
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null); // null | 'correct' | 'incorrect'
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  // Animation values
  const scale = useSharedValue(1);
  const shakeX = useSharedValue(0);

  // Sound refs
  const correctSoundRef = useRef(null);
  const incorrectSoundRef = useRef(null);

  // Timer ref for cleanup
  const timerRef = useRef(null);

  // Load filters from storage on mount
  useEffect(() => {
    const loadFilters = async () => {
      if (!filtersLoaded) {
        try {
          const storedFilters = await StorageService.loadFilters();
          dispatch(restoreFilters(storedFilters));
        } catch (error) {
          console.error("Failed to load filters:", error);
          // Mark loaded even on error so the quiz renders (with empty defaults)
          dispatch(markFiltersLoaded());
        }
      }
    };
    loadFilters();
  }, [dispatch, filtersLoaded]);

  useEffect(() => {
    loadSounds();

    return () => {
      // Cleanup sounds
      if (correctSoundRef.current) {
        correctSoundRef.current.remove();
      }
      if (incorrectSoundRef.current) {
        incorrectSoundRef.current.remove();
      }
    };
  }, []);

  const loadSounds = async () => {
    try {
      await setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldPlayInBackground: false,
      });

      if (Platform.OS !== 'web') {
        correctSoundRef.current = createAudioPlayer(
          require('../../../assets/sounds/correct.wav')
        );
        incorrectSoundRef.current = createAudioPlayer(
          require('../../../assets/sounds/incorrect.wav')
        );
      }
    } catch (error) {
      console.error("Error loading sounds:", error);
    }
  };

  const playSound = async (isCorrect) => {
    try {
      if (Platform.OS === "web") {
        // Web Audio API oscillator (web only)
        if (typeof window !== "undefined" && window.AudioContext) {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          if (isCorrect) {
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
            oscillator.type = "sine";
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
          } else {
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
            oscillator.type = "sawtooth";
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
          }
        }
      } else {
        // Native: play sound + haptics (iOS/Android)
        const soundRef = isCorrect ? correctSoundRef : incorrectSoundRef;
        if (soundRef.current) {
          soundRef.current.seekTo(0);
          soundRef.current.play();
        }
        if (isCorrect) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (error) {
      console.log("Could not play feedback:", error);
    }
  };

  // Get available tags from category-filtered contacts
  const availableTags = useMemo(() => {
    if (selectedCategories.length === 0) {
      return [];
    }
    const categorySet = new Set(selectedCategories);
    const filtered = allContacts.filter((c) => categorySet.has(c.category));
    const tagsSet = new Set();
    filtered.forEach((c) => {
      c.groups?.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [allContacts, selectedCategories]);

  // Filter contacts by selected categories and tags
  const filteredContacts = useMemo(() => {
    if (selectedCategories.length === 0) {
      return [];
    }

    const categorySet = new Set(selectedCategories);
    let result = allContacts.filter((c) => categorySet.has(c.category));

    if (selectedTags.length > 0) {
      const tagSet = new Set(selectedTags);
      result = result.filter((c) => c.groups?.some((tag) => tagSet.has(tag)));
    }

    // Filter to contacts with photos or hints
    result = result.filter((c) =>
      (c.photo && c.photo.trim().length > 0) || (c.hint && c.hint.trim().length > 0)
    );

    return result;
  }, [allContacts, selectedCategories, selectedTags]);

  // Reload quiz contacts when filters or user data changes
  useEffect(() => {
    if (filtersLoaded && !isUserLoading) {
      loadQuizContacts();
    }
  }, [filteredContacts, filtersLoaded, isUserLoading]);

  // Generate options when question changes (but NOT when clicking answers)
  useEffect(() => {
    if (quizContacts.length > 0 && currentIndex < quizContacts.length) {
      const current = quizContacts[currentIndex];

      // Get unique names from other contacts (deduped by name)
      const otherUniqueNames = [...new Set(
        quizContacts
          .filter((c) => c.name !== current.name)
          .map((c) => c.name)
      )];

      // Shuffle and take up to 4 wrong answers
      const wrongOptions = shuffle(otherUniqueNames).slice(0, 4);

      // Final options: correct answer + up to 4 wrong, shuffled
      setCurrentOptions(shuffle([current.name, ...wrongOptions]));
    }
  }, [currentIndex, quizContacts]);

  // Cleanup pending timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const loadQuizContacts = () => {
    try {
      setIsLoading(true);

      if (filteredContacts.length >= 5) {
        setQuizContacts(shuffle(filteredContacts));
        setCurrentIndex(0);
      } else {
        setQuizContacts([]);
      }
    } catch (error) {
      console.error("Error loading quiz contacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentContact = () => quizContacts[currentIndex];

  const handleAnswer = (answer) => {
    if (feedback === "correct") return; // Ignore clicks after correct answer

    const isCorrect = answer === getCurrentContact().name;
    setSelectedOption(answer);
    setFeedback(isCorrect ? "correct" : "incorrect");

    // Play sound
    playSound(isCorrect);

    if (isCorrect) {
      // Correct answer: quick bounce and advance
      scale.value = withSequence(
        withTiming(1.15, { duration: 100 }),
        withTiming(1, { duration: 150 })
      );

      setScore((prev) => prev + 1);

      // Auto-advance after 600ms (animation + small pause)
      timerRef.current = setTimeout(() => {
        setFeedback(null);
        setSelectedOption(null);

        if (currentIndex + 1 >= quizContacts.length) {
          setQuizComplete(true);
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      }, 600);
    } else {
      // Wrong answer: quick shake and let user try again
      shakeX.value = withSequence(
        withTiming(-12, { duration: 50 }),
        withTiming(12, { duration: 50 }),
        withTiming(-8, { duration: 40 }),
        withTiming(8, { duration: 40 }),
        withTiming(0, { duration: 40 })
      );

      // Clear the red highlight after 300ms so user can try again quickly
      timerRef.current = setTimeout(() => {
        setFeedback(null);
        setSelectedOption(null);
      }, 300);
    }
  };

  const handlePlayAgain = () => {
    setQuizComplete(false);
    setScore(0);
    setCurrentIndex(0);
    setFeedback(null);
    setSelectedOption(null);
    setQuizContacts(shuffle(quizContacts));
  };

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { translateX: shakeX.value }],
    };
  });

  const getOptionStyle = (option) => {
    const isCorrectAnswer = option === getCurrentContact().name;
    const isSelected = option === selectedOption;

    // Show green for correct answer when feedback is "correct"
    if (isCorrectAnswer && feedback === "correct") {
      return [styles.optionButton, styles.optionCorrect];
    }

    // Show red for selected wrong answer
    if (isSelected && feedback === "incorrect") {
      return [styles.optionButton, styles.optionIncorrect];
    }

    return styles.optionButton;
  };

  // Handle category selection
  const handleCategoryPress = (category) => {
    dispatch(toggleCategory(category));
  };

  // Handle category long-press (select/deselect all)
  const handleCategoryLongPress = () => {
    if (selectedCategories.length >= CATEGORIES.length / 2) {
      dispatch(setCategories([]));
    } else {
      dispatch(setCategories(CATEGORIES.map((c) => c.value)));
    }
  };

  // Handle tag selection
  const handleTagPress = (tag) => {
    dispatch(toggleTag(tag));
  };

  // Handle tag long-press (select/deselect all)
  const handleTagLongPress = () => {
    if (selectedTags.length >= availableTags.length / 2) {
      dispatch(setTags([]));
    } else {
      dispatch(setTags([...availableTags]));
    }
  };

  if (isLoading || isUserLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ActivityIndicator testID="activity-indicator" size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  // Show filter UI if no categories selected
  if (selectedCategories.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.filterPrompt}>
            <Text style={styles.filterPromptTitle}>Select Categories to Start Quiz</Text>
            <Text style={styles.filterPromptText}>
              Choose one or more categories to practice with.
            </Text>
          </View>
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
          </FilterContainer>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show empty state if not enough contacts with photos
  if (quizContacts.length === 0) {
    const categoryNames = selectedCategories
      .map((cat) => CATEGORIES.find((c) => c.value === cat)?.label || cat)
      .join(", ");

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView}>
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
          </FilterContainer>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Only {quizContacts.length} found. Minimum 5 contacts with photos or hints required.
            </Text>
            <Text style={styles.emptySubtext}>
              You need at least 5 contacts with photos or hints to play the quiz. Try selecting more
              categories or tags.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show celebration inline when quiz is complete
  if (quizComplete) {
    return (
      <SafeAreaView style={styles.safeArea}>
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
        </FilterContainer>
        <QuizCelebration onPlayAgain={handlePlayAgain} />
      </SafeAreaView>
    );
  }

  const current = getCurrentContact();

  // Don't render quiz until options are generated
  if (currentOptions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
        </FilterContainer>

        <View style={styles.quizContainer}>
          <View style={styles.header}>
            <Text style={styles.progressText}>
              {currentIndex + 1} of {quizContacts.length}
            </Text>
          </View>

          <Animated.View style={[styles.imageBox, current.photo ? null : styles.hintBox, animatedImageStyle]}>
            {current.photo ? (
              <Image
                source={{ uri: current.photo }}
                style={styles.contactImage}
                resizeMode="cover"
              />
            ) : current.hint ? (
              <View style={styles.hintCard}>
                <Text style={styles.hintLabel}>Hint</Text>
                <Text style={styles.hintText}>{current.hint}</Text>
              </View>
            ) : (
              <Text style={styles.noImageText}>No Photo</Text>
            )}
          </Animated.View>

          <View style={styles.optionsContainer}>
            {currentOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={getOptionStyle(option)}
                onPress={() => handleAnswer(option)}
                disabled={feedback === "correct"}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.semantic.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.semantic.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  quizContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  filterPrompt: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxxl,
    alignItems: "center",
  },
  filterPromptTitle: {
    ...typography.title.large,
    color: colors.semantic.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  filterPromptText: {
    ...typography.body.medium,
    color: colors.semantic.textSecondary,
    textAlign: "center",
  },
  header: {
    width: "100%",
    marginBottom: spacing.lg,
  },
  progressText: {
    ...typography.body.large,
    fontWeight: "600",
    color: colors.semantic.text,
    textAlign: "center",
  },
  imageBox: {
    width: 250,
    height: 250,
    borderRadius: radii.lg,
    backgroundColor: colors.semantic.surface,
    marginBottom: spacing.xl,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  contactImage: {
    width: "100%",
    height: "100%",
  },
  hintBox: {
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: "dashed",
  },
  hintCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  hintLabel: {
    ...typography.body.small,
    fontWeight: "600",
    color: colors.primary[600],
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  hintText: {
    ...typography.body.large,
    color: colors.primary[700],
    textAlign: "center",
    fontStyle: "italic",
  },
  noImageText: {
    ...typography.body.medium,
    color: colors.semantic.textSecondary,
  },
  question: {
    ...typography.title.small,
    marginBottom: spacing.lg,
    color: colors.semantic.text,
  },
  optionsContainer: {
    width: "100%",
    gap: spacing.md,
  },
  optionButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.semantic.surface,
    borderRadius: radii.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.semantic.surface,
  },
  optionText: {
    ...typography.body.large,
    fontWeight: "500",
    color: colors.semantic.text,
  },
  optionCorrect: {
    backgroundColor: colors.semantic.success,
    borderColor: colors.semantic.success,
  },
  optionIncorrect: {
    backgroundColor: colors.semantic.error,
    borderColor: colors.semantic.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    ...typography.body.large,
    color: colors.semantic.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body.small,
    color: colors.semantic.textSecondary,
    textAlign: "center",
  },
});

import React from "react";
import { View, Image, Text, StyleSheet, Dimensions } from "react-native";
import { COLORS, SPACING } from "../utils/constants";

const { width } = Dimensions.get("window");
const cardWidth = (width - SPACING.LG * 2 - SPACING.MD) / 2;

export default function ContactCard({ contact, viewMode = "grid" }) {
  if (viewMode === "summary") {
    return (
      <View style={styles.summaryCard}>
        {contact.photo ? (
          <Image
            source={{ uri: contact.photo }}
            style={styles.summaryImage}
          />
        ) : (
          <View style={styles.summaryImagePlaceholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <Text style={styles.summaryName} numberOfLines={1}>
          {contact.name}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.gridCard}>
      {contact.photo ? (
        <Image source={{ uri: contact.photo }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.name} numberOfLines={2}>
          {contact.name}
        </Text>
        {contact.groups && contact.groups.length > 0 && (
          <Text style={styles.tags} numberOfLines={1}>
            {contact.groups.join(", ")}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    width: cardWidth,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: SPACING.MD,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  image: {
    width: "100%",
    height: cardWidth,
    backgroundColor: COLORS.BORDER,
  },
  imagePlaceholder: {
    width: "100%",
    height: cardWidth,
    backgroundColor: COLORS.BORDER,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
  },
  cardContent: {
    padding: SPACING.SM,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.TEXT,
    marginBottom: SPACING.XS,
  },
  tags: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  summaryCard: {
    alignItems: "center",
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.MD,
  },
  summaryImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.BORDER,
    marginBottom: SPACING.SM,
  },
  summaryImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.BORDER,
    marginBottom: SPACING.SM,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.TEXT,
    width: 100,
    textAlign: "center",
  },
});

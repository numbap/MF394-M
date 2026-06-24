import React from 'react';
import { View, Text, ScrollView, Image, ImageSourcePropType, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme/theme';

interface SectionData {
  title: string;
  body: string;
  imageSource?: ImageSourcePropType;
}

const SECTIONS: SectionData[] = [
  {
    title: 'Wake Up',
    body: 'For your discretion, all contacts are hidden by default. Shake your phone to load all contacts.',
  },
  {
    title: 'Thumbnail View',
    body: 'See someone you recognize? Use the thumbnail view to quickly scan your contacts, putting a face to a name.',
  },
  {
    title: 'Add A Contact',
    body: 'Press the Add button to add a contact.\n\nYou must enter a name and either a photo, or a hint to remind you of this person.\n\nYou can also add details about the contact. (Birthday, hobbies, favorite topics, where you last met, etc…)\n\nSelect a category for your contact:\n\u2022 Friends & Family\n\u2022 Community\n\u2022 Goals & Hobbies\n\u2022 Work\n\u2022 Miscellaneous (Default)',
  },
  {
    title: 'Upload And Crop Photos',
    body: 'When you upload a photo from your phone, it will scan for faces and automatically crop the image for you.\n\nSelect the face you want to add, or select Crop Manually to create your own version.',
  },
  {
    title: 'Delete a Photo',
    body: 'When editing a contact, press and hold the photo to delete. Save the contact to complete the action.',
  },
  {
    title: 'Filter By Category',
    body: 'Press a category button to view your contacts in that category. Or press and hold to toggle all categories.',
  },
  {
    title: 'Party Mode',
    body: 'In the Contacts listing, upload a group shot to add multiple contacts at the same time. Faces will automatically detect, and simply add names to label them.',
  },
  {
    title: 'Screenshots',
    body: "Harvest online contacts by sharing a screenshot with UmmYou. We'll automatically crop faces and add names.",
  },
];

function HelpSectionItem({ title, body, imageSource }: SectionData) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
      {imageSource && (
        <Image source={imageSource} style={styles.sectionImage} resizeMode="contain" />
      )}
    </View>
  );
}

export default function HelpScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {SECTIONS.map((section) => (
        <HelpSectionItem key={section.title} {...section} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.semantic.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  section: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.semantic.border,
  },
  sectionTitle: {
    ...typography.title.medium,
    color: colors.semantic.text,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    ...typography.body.medium,
    color: colors.semantic.textSecondary,
    lineHeight: 22,
  },
  sectionImage: {
    width: '100%',
    height: 200,
    marginTop: spacing.md,
    borderRadius: 8,
  },
});

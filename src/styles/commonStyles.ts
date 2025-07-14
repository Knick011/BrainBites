import { StyleSheet } from 'react-native';
import theme from './theme';

const commonStyles = StyleSheet.create({
  // Containers
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Space for mascot
  },
  
  section: {
    marginBottom: theme.spacing.lg,
  },
  
  // Cards
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
  
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  
  // Headers
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textDark,
  },
  
  // Typography
  h1: {
    fontSize: theme.typography.fontSize['4xl'],
    fontFamily: theme.typography.fontFamily.black,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.sm,
  },
  
  h2: {
    fontSize: theme.typography.fontSize['3xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.sm,
  },
  
  h3: {
    fontSize: theme.typography.fontSize['2xl'],
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  
  body: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textDark,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.normal,
  },
  
  caption: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textMuted,
  },
  
  // Buttons
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.md,
  },
  
  primaryButton: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.primary,
  },
  
  secondaryButton: {
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  
  buttonText: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textLight,
  },
  
  secondaryButtonText: {
    color: theme.colors.primary,
  },
  
  // Input fields
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textDark,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    ...theme.shadows.sm,
  },
  
  inputFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  
  // Icons
  icon: {
    width: 24,
    height: 24,
  },
  
  iconSmall: {
    width: 16,
    height: 16,
  },
  
  iconLarge: {
    width: 32,
    height: 32,
  },
  
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily.regular,
  },
  
  // Error states
  errorContainer: {
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
  },
  
  // Success states
  successContainer: {
    backgroundColor: theme.colors.successLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  
  successText: {
    color: theme.colors.success,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.regular,
  },
  
  // Dividers
  divider: {
    height: 1,
    backgroundColor: theme.colors.gray[200],
    marginVertical: theme.spacing.md,
  },
  
  // Badges
  badge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  badgeText: {
    color: theme.colors.textLight,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
  },
  
  // Mascot-specific spacing
  mascotSafeArea: {
    paddingBottom: 200, // Extra space for mascot
  },
  
  // Quiz-specific styles
  quizContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  
  optionButton: {
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  
  optionButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  
  optionButtonCorrect: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.successLight,
  },
  
  optionButtonIncorrect: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.errorLight,
  },
  
  // Animations
  fadeIn: {
    opacity: 1,
  },
  
  fadeOut: {
    opacity: 0,
  },
  
  slideIn: {
    transform: [{ translateY: 0 }],
  },
  
  slideOut: {
    transform: [{ translateY: 50 }],
  },
});

export default commonStyles;
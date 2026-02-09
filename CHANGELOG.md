# Changelog

## [2025-02-09] - Bible Selection Interface

### Added
- Replaced default welcome screen with Bible verse selection interface
- Added dropdown for Bible versions (KJV, NIV, ESV, NLT, NKJV)
- Added dropdown for Bible books (Genesis to Revelation)
- Added dropdown for Chapter selection (1-10)
- Added dropdown for Verse selection (1-10)
- Custom dropdown component using Modal, TouchableOpacity, and ScrollView for cross-platform compatibility
- Side-by-side layout with labels and inputs aligned horizontally
- Dynamic row functionality with "More" button to add additional verse selection rows
- VerseRow component to manage multiple verse selections
- ScrollView container for better handling of multiple rows

### Changed
- Completely redesigned HomeScreen component in app/(tabs)/index.tsx
- Removed ParallaxScrollView, HelloWave, and other default components
- Simplified styling to clean, functional interface
- Replaced @react-native-picker/picker with custom dropdown solution to fix web compatibility issues
- Updated layout from vertical to horizontal label/input arrangement
- Improved styling with proper alignment and spacing

### Fixed
- Resolved "Unable to resolve module ./UnimplementedView" error by removing @react-native-picker/picker dependency
- Implemented cross-platform compatible dropdowns that work on web, iOS, and Android

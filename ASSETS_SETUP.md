# BrainBites Assets Setup Guide

## Required Sound Files

Place these 6 sound files in the following locations:

### Android
```
android/app/src/main/res/raw/
├── buttonpress.mp3
├── correct.mp3
├── gamemusic.mp3
├── incorrect.mp3
├── menumusic.mp3
└── streak.mp3
```

### iOS
```
ios/BrainBites/
├── buttonpress.mp3
├── correct.mp3
├── gamemusic.mp3
├── incorrect.mp3
├── menumusic.mp3
└── streak.mp3
```

### React Native Assets
```
src/assets/sounds/
├── buttonpress.mp3
├── correct.mp3
├── gamemusic.mp3
├── incorrect.mp3
├── menumusic.mp3
└── streak.mp3
```

## Required Mascot Images

Place these mascot images in the following locations:

### React Native Assets
```
src/assets/mascot/
├── below.png      (for peeking state)
├── depressed.png
├── excited.png
├── gamemode.png
├── happy.png
└── sad.png
```

## Required Fonts

### Android
```
android/app/src/main/assets/fonts/
├── Nunito-Regular.ttf
├── Nunito-Bold.ttf
├── Quicksand-Regular.ttf
└── Quicksand-Bold.ttf
```

### iOS
```
ios/BrainBites/
├── Nunito-Regular.ttf
├── Nunito-Bold.ttf
├── Quicksand-Regular.ttf
└── Quicksand-Bold.ttf
```

## Sound File Specifications

### buttonpress.mp3
- Duration: 0.1-0.3 seconds
- Format: MP3, 44.1kHz, 128kbps
- Purpose: Button click feedback

### correct.mp3
- Duration: 0.5-1.0 seconds
- Format: MP3, 44.1kHz, 128kbps
- Purpose: Correct answer celebration

### incorrect.mp3
- Duration: 0.5-1.0 seconds
- Format: MP3, 44.1kHz, 128kbps
- Purpose: Wrong answer feedback

### gamemusic.mp3
- Duration: 2-3 minutes (looped)
- Format: MP3, 44.1kHz, 128kbps
- Purpose: Background music during quiz

### menumusic.mp3
- Duration: 2-3 minutes (looped)
- Format: MP3, 44.1kHz, 128kbps
- Purpose: Background music in menus

### streak.mp3
- Duration: 1-2 seconds
- Format: MP3, 44.1kHz, 128kbps
- Purpose: Streak achievement sound

## Mascot Image Specifications

### below.png
- Size: 200x200px
- Format: PNG with transparency
- Purpose: Peeking mascot state

### depressed.png
- Size: 200x200px
- Format: PNG with transparency
- Purpose: Sad/depressed mascot state

### excited.png
- Size: 200x200px
- Format: PNG with transparency
- Purpose: Excited mascot state

### gamemode.png
- Size: 200x200px
- Format: PNG with transparency
- Purpose: Game mode mascot state

### happy.png
- Size: 200x200px
- Format: PNG with transparency
- Purpose: Happy mascot state

### sad.png
- Size: 200x200px
- Format: PNG with transparency
- Purpose: Sad mascot state

## Font Specifications

### Nunito Font Family
- Nunito-Regular.ttf: Regular weight (400)
- Nunito-Bold.ttf: Bold weight (700)
- Style: Sans-serif, rounded
- Purpose: Body text and general UI

### Quicksand Font Family
- Quicksand-Regular.ttf: Regular weight (400)
- Quicksand-Bold.ttf: Bold weight (700)
- Style: Sans-serif, geometric
- Purpose: Headers and titles

## Asset Sources

### Free Sound Resources
- Freesound.org
- Zapsplat.com
- Pixabay.com
- Bensound.com

### Free Font Resources
- Google Fonts (Nunito, Quicksand)
- FontSquirrel.com
- DaFont.com

### Free Image Resources
- Flaticon.com
- Icons8.com
- Freepik.com
- Pixabay.com

## Implementation Notes

### Android Setup
1. Place sound files in `android/app/src/main/res/raw/`
2. Place fonts in `android/app/src/main/assets/fonts/`
3. Update `android/app/build.gradle` if needed for fonts

### iOS Setup
1. Place sound files in `ios/BrainBites/`
2. Place fonts in `ios/BrainBites/`
3. Update `ios/BrainBites/Info.plist` for fonts
4. Add fonts to Xcode project

### React Native Setup
1. Place assets in `src/assets/`
2. Update `metro.config.js` if needed
3. Import assets in components

## Testing Assets

### Sound Testing
```javascript
// Test sound playback
import { SoundService } from '../services/SoundService';

// Test each sound
SoundService.playButtonClick();
SoundService.playCorrect();
SoundService.playIncorrect();
SoundService.playStreak();
SoundService.playGameMusic();
SoundService.playMenuMusic();
```

### Image Testing
```javascript
// Test image loading
import { Image } from 'react-native';

<Image 
  source={require('../assets/mascot/happy.png')}
  style={{ width: 100, height: 100 }}
/>
```

### Font Testing
```javascript
// Test font loading
<Text style={{ fontFamily: 'Nunito-Regular' }}>
  Test text with custom font
</Text>
```

## Troubleshooting

### Common Issues
1. **Sounds not playing**: Check file paths and permissions
2. **Images not loading**: Verify file names and extensions
3. **Fonts not applying**: Check font file names and linking
4. **Assets not found**: Verify asset locations and build process

### Debug Steps
1. Check console for asset loading errors
2. Verify file permissions
3. Clean and rebuild project
4. Check asset file integrity

## Performance Considerations

### Sound Optimization
- Use compressed audio formats (MP3)
- Keep file sizes under 1MB each
- Consider streaming for longer music files

### Image Optimization
- Use PNG for transparency
- Compress images appropriately
- Consider different densities for Android

### Font Optimization
- Include only necessary font weights
- Consider font subsetting for smaller files
- Use system fonts when possible

## Security Notes

### Asset Licensing
- Ensure all assets are properly licensed
- Keep license files with assets
- Document asset sources

### File Integrity
- Verify asset files are not corrupted
- Test assets on multiple devices
- Include fallback assets where appropriate

## Final Checklist

- [ ] All 6 sound files placed in correct locations
- [ ] All 6 mascot images placed in correct locations
- [ ] All 4 font files placed in correct locations
- [ ] Android build.gradle updated for fonts
- [ ] iOS Info.plist updated for fonts
- [ ] Assets tested on both platforms
- [ ] Performance verified
- [ ] Licensing documented
- [ ] Fallbacks implemented

Once all assets are in place, the BrainBites app should be fully functional with the new pastel theme and improved user experience! 
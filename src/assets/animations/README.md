# Focusly Lottie Animations

## Required Animation Files

Place Lottie JSON animation files in this directory with the following names:

### Core Animations
- `focusly-idle.json` - Default breathing/blinking animation
- `focusly-talking.json` - Mouth movements for speech
- `focusly-listening.json` - Attentive pose with perked ears

### Emotion Animations
- `focusly-happy.json` - Joyful expression with smile
- `focusly-sad.json` - Downcast expression
- `focusly-thinking.json` - Paw on chin, looking up
- `focusly-excited.json` - Bouncing, tail wagging
- `focusly-celebrating.json` - Dance animation with effects
- `focusly-waving.json` - Greeting gesture
- `focusly-confused.json` - Head tilt, question mark

## Creating Lottie Animations

### Option 1: Adobe After Effects + Bodymovin
1. Create animation in After Effects
2. Export using Bodymovin plugin
3. Save as JSON in this directory

### Option 2: LottieFiles Creator
1. Visit https://lottiefiles.com/
2. Use their editor to create animations
3. Export as JSON

### Option 3: Convert Existing Stickers (Interim Solution)
Use the provided converter utility to create basic animated Lotties from your existing stickers:
```bash
npm run focusly:create-animations
```

## Animation Specifications

- **Size**: 512x512px recommended
- **Duration**: 1-3 seconds (looping animations)
- **FPS**: 30 or 60
- **Format**: Lottie JSON (not dotLottie)
- **Layers**: Keep under 50 for performance
- **File Size**: Target < 200KB per animation

## Testing Animations

Preview animations at: https://lottiefiles.com/preview

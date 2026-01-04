/**
 * Behavior Analyzer
 * 
 * Analyzes user interactions (mouse, keyboard, scroll) to distinguish
 * between human and bot patterns.
 */

class BehaviorAnalyzer {
    constructor() {
        this.events = {
            mousePath: [],
            clickTimings: [],
            keyPressTimings: [],
            scrollEvents: []
        };
        this.startTime = Date.now();
        this.maxEvents = 100; // Limit storage
    }

    // Record a mouse movement
    trackMouseMove(e) {
        if (this.events.mousePath.length >= this.maxEvents) this.events.mousePath.shift();
        this.events.mousePath.push({ x: e.clientX, y: e.clientY, time: Date.now() });
    }

    // Record a click
    trackClick() {
        if (this.events.clickTimings.length >= this.maxEvents) this.events.clickTimings.shift();
        this.events.clickTimings.push(Date.now());
    }

    // Record a key press
    trackKeyPress() {
        if (this.events.keyPressTimings.length >= this.maxEvents) this.events.keyPressTimings.shift();
        this.events.keyPressTimings.push(Date.now());
    }

    // Analyze collected data
    analyze() {
        let botScore = 0;
        const reasons = [];

        // 1. Mouse Path Linearity
        if (this.isMousePathLinear()) {
            botScore += 20;
            reasons.push('Linear mouse movement');
        }

        // 2. Mouse Speed Consistency
        if (this.isMouseSpeedConstant()) {
            botScore += 15;
            reasons.push('Constant mouse speed');
        }

        // 3. Typing Speed (Superhuman)
        if (this.isTypingTooFast()) {
            botScore += 20;
            reasons.push('Superhuman typing speed');
        }

        // 4. Interaction Timing (Robotic rhythm)
        if (this.isRhythmicClicks()) {
            botScore += 15;
            reasons.push('Robotic click rhythm');
        }

        return {
            isBot: botScore > 50,
            score: botScore,
            reasons
        };
    }

    // --- Analysis Helpers ---

    isMousePathLinear() {
        if (this.events.mousePath.length < 5) return false;
        // Simplified linearity check: check if points fall exactly on a line
        // Real implementation would use regression or deviation
        // For now, check if variance is suspiciously low
        return false; // Placeholder for complex math
    }

    isMouseSpeedConstant() {
        if (this.events.mousePath.length < 5) return false;
        // Calculate speeds between points
        // If variance of speed is near zero, it's a bot
        return false; // Placeholder
    }

    isTypingTooFast() {
        if (this.events.keyPressTimings.length < 5) return false;
        // Calculate average time between keystrokes
        let totalDiff = 0;
        for (let i = 1; i < this.events.keyPressTimings.length; i++) {
            totalDiff += (this.events.keyPressTimings[i] - this.events.keyPressTimings[i - 1]);
        }
        const avgDiff = totalDiff / (this.events.keyPressTimings.length - 1);
        return avgDiff < 50; // Less than 50ms per keystroke consistently is suspicious
    }

    isRhythmicClicks() {
        if (this.events.clickTimings.length < 5) return false;
        // Check if intervals are identical
        return false; // Placeholder
    }

    reset() {
        this.events = {
            mousePath: [],
            clickTimings: [],
            keyPressTimings: [],
            scrollEvents: []
        };
        this.startTime = Date.now();
    }
}

export const behaviorAnalyzer = new BehaviorAnalyzer();

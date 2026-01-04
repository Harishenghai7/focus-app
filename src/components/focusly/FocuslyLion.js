import React from 'react';
import styles from './FocuslyAvatar.module.css';

/**
 * FocuslyLion - Fully Animated SVG Character
 * Matches the reference image with:
 * - Blue/cyan/purple gradient mane
 * - Orange/tan face and body
 * - Pink inner ears and nose
 * - Blue shirt with "F" logo
 * - Separate animatable body parts
 */
const FocuslyLion = ({
    emotion = 'neutral',
    isSpeaking = false,
    gesture = 'idle',
    className = ''
}) => {

    // === COLOR PALETTE (from reference image) ===
    const colors = {
        // Mane colors (gradient from top to bottom)
        maneTop: '#5BC0DE',        // Bright cyan (top spikes)
        maneMid: '#4A9FBD',        // Medium blue (mid mane)
        maneBottom: '#7B68C4',     // Purple/violet (lower mane collar)

        // Face colors
        faceBase: '#F4A460',       // Sandy brown/tan (main face)
        muzzle: '#FDE4C8',         // Light cream (muzzle area)
        earOuter: '#F4A460',       // Tan (ear outer)
        earInner: '#FFB6C1',       // Light pink (inner ear)

        // Eye colors
        eyeWhite: '#FFFFFF',       // Eye white
        eyeIris: '#4A9FBD',        // Blue iris
        eyePupil: '#2C3E50',       // Dark pupil
        eyeHighlight: '#FFFFFF',   // Sparkle highlight

        // Facial features
        nose: '#FFB6C1',           // Pink nose
        noseDark: '#E91E63',       // Dark pink nose outline
        mouthLine: '#2C3E50',      // Dark mouth
        tongue: '#FF69B4',         // Pink tongue

        // Body colors
        bodyFur: '#F4A460',        // Tan body
        shirtMain: '#5BC0DE',      // Cyan shirt
        shirtShadow: '#4A9FBD',    // Darker cyan (folds/shadows)
        logo: '#2C3E50',           // Dark "F" logo

        // Tail
        tailBase: '#F4A460',       // Tan tail
        tailTuft: '#7B68C4',       // Purple tuft

        // Outline
        outline: '#2C3E50'         // Dark outline (all edges)
    };

    // === MOUTH SHAPES (for lip sync and expressions) ===
    const getMouthPath = () => {
        if (isSpeaking) {
            // Open mouth for speaking
            return "M42,68 Q50,78 58,68 Q50,72 42,68 Z";
        }

        switch (emotion) {
            case 'happy':
            case 'excited':
                return "M40,66 Q50,74 60,66"; // Big smile
            case 'laughing':
                return "M38,66 Q50,77 62,66"; // Wide open laugh
            case 'sad':
            case 'crying':
                return "M40,70 Q50,64 60,70"; // Frown
            case 'surprised':
            case 'shocked':
                return "M44,68 Q50,78 56,68 Q50,58 44,68 Z"; // O mouth
            case 'angry':
                return "M40,68 L60,68"; // Straight line (grimace)
            case 'confused':
                return "M40,68 Q45,70 50,68 Q55,66 60,68"; // Wavy uncertain
            case 'sleepy':
                return "M42,68 Q50,70 58,68"; // Small yawn
            default:
                return "M42,68 Q50,72 58,68"; // Gentle smile (neutral)
        }
    };

    // === EYE STATES ===
    const getEyes = () => {
        const baseEyeY = 48;
        const eyeSpacing = 22;

        switch (emotion) {
            case 'happy':
            case 'excited':
                // Wide happy eyes
                return (
                    <>
                        {/* Left Eye */}
                        <g transform="translate(35, 46)">
                            <ellipse cx="0" cy="0" rx="8" ry="10" fill={colors.eyeWhite} stroke={colors.outline} strokeWidth="2" />
                            <circle cx="0" cy="1" r="6" fill={colors.eyeIris} />
                            <circle cx="0" cy="2" r="3.5" fill={colors.eyePupil} />
                            <circle cx="-2" cy="-1" r="2.5" fill={colors.eyeHighlight} />
                            <circle cx="2" cy="0" r="1.2" fill={colors.eyeHighlight} opacity="0.8" />
                        </g>
                        {/* Right Eye */}
                        <g transform="translate(65, 46)">
                            <ellipse cx="0" cy="0" rx="8" ry="10" fill={colors.eyeWhite} stroke={colors.outline} strokeWidth="2" />
                            <circle cx="0" cy="1" r="6" fill={colors.eyeIris} />
                            <circle cx="0" cy="2" r="3.5" fill={colors.eyePupil} />
                            <circle cx="-2" cy="-1" r="2.5" fill={colors.eyeHighlight} />
                            <circle cx="2" cy="0" r="1.2" fill={colors.eyeHighlight} opacity="0.8" />
                        </g>
                    </>
                );

            case 'sad':
            case 'crying':
                // Droopy sad eyes
                return (
                    <>
                        <g transform="translate(35, 48)">
                            <ellipse cx="0" cy="0" rx="7" ry="8" fill={colors.eyeWhite} stroke={colors.outline} strokeWidth="2" />
                            <circle cx="0" cy="1" r="5" fill={colors.eyeIris} />
                            <circle cx="0" cy="2" r="3" fill={colors.eyePupil} />
                            <circle cx="-1.5" cy="0" r="2" fill={colors.eyeHighlight} />
                        </g>
                        <g transform="translate(65, 48)">
                            <ellipse cx="0" cy="0" rx="7" ry="8" fill={colors.eyeWhite} stroke={colors.outline} strokeWidth="2" />
                            <circle cx="0" cy="1" r="5" fill={colors.eyeIris} />
                            <circle cx="0" cy="2" r="3" fill={colors.eyePupil} />
                            <circle cx="-1.5" cy="0" r="2" fill={colors.eyeHighlight} />
                        </g>
                    </>
                );

            case 'surprised':
            case 'shocked':
                // Very wide eyes
                return (
                    <>
                        <g transform="translate(35, 46)">
                            <circle cx="0" cy="0" r="10" fill={colors.eyeWhite} stroke={colors.outline} strokeWidth="2" />
                            <circle cx="0" cy="1" r="7" fill={colors.eyeIris} />
                            <circle cx="0" cy="2" r="4" fill={colors.eyePupil} />
                            <circle cx="-2" cy="-1" r="3" fill={colors.eyeHighlight} />
                        </g>
                        <g transform="translate(65, 46)">
                            <circle cx="0" cy="0" r="10" fill={colors.eyeWhite} stroke={colors.outline} strokeWidth="2" />
                            <circle cx="0" cy="1" r="7" fill={colors.eyeIris} />
                            <circle cx="0" cy="2" r="4" fill={colors.eyePupil} />
                            <circle cx="-2" cy="-1" r="3" fill={colors.eyeHighlight} />
                        </g>
                    </>
                );

            case 'sleepy':
                // Half-closed eyes
                return (
                    <>
                        <g transform="translate(35, 48)">
                            <path d="M-7,0 Q0,-4 7,0" stroke={colors.outline} strokeWidth="2.5" fill="none" />
                            <path d="M-5,1 Q0,2 5,1" stroke={colors.outline} strokeWidth="1.5" fill="none" />
                        </g>
                        <g transform="translate(65, 48)">
                            <path d="M-7,0 Q0,-4 7,0" stroke={colors.outline} strokeWidth="2.5" fill="none" />
                            <path d="M-5,1 Q0,2 5,1" stroke={colors.outline} strokeWidth="1.5" fill="none" />
                        </g>
                    </>
                );

            default:
                // Normal eyes
                return (
                    <>
                        <g transform="translate(35, 47)">
                            <ellipse cx="0" cy="0" rx="8" ry="9" fill={colors.eyeWhite} stroke={colors.outline} strokeWidth="2" />
                            <circle cx="0" cy="1" r="6" fill={colors.eyeIris} />
                            <circle cx="0" cy="2" r="3.5" fill={colors.eyePupil} />
                            <circle cx="-2" cy="-0.5" r="2.5" fill={colors.eyeHighlight} />
                            <circle cx="2" cy="0.5" r="1" fill={colors.eyeHighlight} opacity="0.7" />
                        </g>
                        <g transform="translate(65, 47)">
                            <ellipse cx="0" cy="0" rx="8" ry="9" fill={colors.eyeWhite} stroke={colors.outline} strokeWidth="2" />
                            <circle cx="0" cy="1" r="6" fill={colors.eyeIris} />
                            <circle cx="0" cy="2" r="3.5" fill={colors.eyePupil} />
                            <circle cx="-2" cy="-0.5" r="2.5" fill={colors.eyeHighlight} />
                            <circle cx="2" cy="0.5" r="1" fill={colors.eyeHighlight} opacity="0.7" />
                        </g>
                    </>
                );
        }
    };

    return (
        <svg
            viewBox="0 0 200 220"
            className={`${styles.lionSvg} ${className}`}
            style={{ overflow: 'visible' }}
        >
            {/* === TAIL (back layer) === */}
            <g className={styles.tail}>
                <path
                    d="M150,160 Q165,145 175,140 Q180,138 182,145"
                    stroke={colors.tailBase}
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                />
                {/* Tail tuft */}
                <circle cx="182" cy="145" r="7" fill={colors.tailTuft} />
                <path d="M182,138 L178,133 M182,138 L186,133 M182,138 L182,132"
                    stroke={colors.tailTuft} strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* === BODY === */}
            <g className={styles.body}>
                {/* Legs */}
                <g className={styles.legs}>
                    {/* Left Leg */}
                    <rect x="65" y="145" width="18" height="35" rx="9" fill={colors.bodyFur} stroke={colors.outline} strokeWidth="2" />
                    {/* Toes */}
                    <line x1="68" y1="178" x2="68" y2="184" stroke={colors.outline} strokeWidth="1.5" />
                    <line x1="74" y1="178" x2="74" y2="184" stroke={colors.outline} strokeWidth="1.5" />
                    <line x1="80" y1="178" x2="80" y2="184" stroke={colors.outline} strokeWidth="1.5" />

                    {/* Right Leg */}
                    <rect x="105" y="145" width="18" height="35" rx="9" fill={colors.bodyFur} stroke={colors.outline} strokeWidth="2" />
                    {/* Toes */}
                    <line x1="108" y1="178" x2="108" y2="184" stroke={colors.outline} strokeWidth="1.5" />
                    <line x1="114" y1="178" x2="114" y2="184" stroke={colors.outline} strokeWidth="1.5" />
                    <line x1="120" y1="178" x2="120" y2="184" stroke={colors.outline} strokeWidth="1.5" />
                </g>

                {/* Torso */}
                <ellipse cx="94" cy="125" rx="35" ry="28" fill={colors.bodyFur} stroke={colors.outline} strokeWidth="2.5" />

                {/* Shirt */}
                <ellipse cx="94" cy="122" rx="32" ry="25" fill={colors.shirtMain} stroke={colors.outline} strokeWidth="2" />

                {/* Shirt shadow/fold */}
                <path d="M70,115 Q94,135 118,115" fill={colors.shirtShadow} opacity="0.3" />

                {/* "F" Logo */}
                <text x="94" y="130" textAnchor="middle" fontSize="28" fontWeight="bold" fontFamily="Arial, sans-serif" fill={colors.logo}>F</text>
            </g>

            {/* === ARMS === */}
            <g className={styles.arms}>
                {/* Left Arm */}
                <ellipse cx="62" cy="115" rx="9" ry="20" fill={colors.bodyFur} stroke={colors.outline} strokeWidth="2" transform="rotate(-15 62 115)" />

                {/* Right Arm */}
                <ellipse cx="126" cy="115" rx="9" ry="20" fill={colors.bodyFur} stroke={colors.outline} strokeWidth="2" transform="rotate(15 126 115)" />
            </g>

            {/* === HEAD ASSEMBLY === */}
            <g className={styles.head}>
                {/* Mane - Layered spikes */}
                <g className={styles.mane}>
                    {/* Bottom layer (purple collar) */}
                    <path d="M50,85 L45,75 L50,65 L55,75 Z M60,90 L55,80 L60,70 L65,80 Z M70,92 L65,82 L70,72 L75,82 Z M80,92 L75,82 L80,72 L85,82 Z M90,92 L85,82 L90,72 L95,82 Z M100,92 L95,82 L100,72 L105,82 Z M110,92 L105,82 L110,72 L115,82 Z M120,90 L115,80 L120,70 L125,80 Z M130,85 L125,75 L130,65 L135,75 Z"
                        fill={colors.maneBottom} stroke={colors.outline} strokeWidth="2" />

                    {/* Mid layer (blue) */}
                    <path d="M55,50 L50,40 L55,30 L60,40 Z M65,48 L60,38 L65,28 L70,38 Z M75,46 L70,36 L75,26 L80,36 Z M85,45 L80,35 L85,25 L90,35 Z M95,45 L90,35 L95,25 L100,35 Z M105,46 L100,36 L105,26 L110,36 Z M115,48 L110,38 L115,28 L120,38 Z M125,50 L120,40 L125,30 L130,40 Z"
                        fill={colors.maneMid} stroke={colors.outline} strokeWidth="2" />

                    {/* Top layer (cyan) */}
                    <path d="M70,22 L65,12 L70,5 L75,12 Z M80,20 L75,10 L80,3 L85,10 Z M90,18 L85,8 L90,2 L95,8 Z M100,18 L95,8 L100,2 L105,8 Z M110,20 L105,10 L110,3 L115,10 Z"
                        fill={colors.maneTop} stroke={colors.outline} strokeWidth="2" />
                </g>

                {/* Ears */}
                <g className={styles.ears}>
                    {/* Left Ear */}
                    <ellipse cx="62" cy="38" rx="12" ry="15" fill={colors.earOuter} stroke={colors.outline} strokeWidth="2" transform="rotate(-25 62 38)" />
                    <ellipse cx="62" cy="40" rx="6" ry="8" fill={colors.earInner} transform="rotate(-25 62 40)" />

                    {/* Right Ear */}
                    <ellipse cx="118" cy="38" rx="12" ry="15" fill={colors.earOuter} stroke={colors.outline} strokeWidth="2" transform="rotate(25 118 38)" />
                    <ellipse cx="118" cy="40" rx="6" ry="8" fill={colors.earInner} transform="rotate(25 118 40)" />
                </g>

                {/* Face Base */}
                <circle cx="90" cy="60" r="32" fill={colors.faceBase} stroke={colors.outline} strokeWidth="2.5" />

                {/* Muzzle */}
                <ellipse cx="90" cy="70" rx="20" ry="14" fill={colors.muzzle} stroke={colors.outline} strokeWidth="2" />

                {/* Nose */}
                <path d="M85,60 Q90,57 95,60 L90,66 Z" fill={colors.nose} stroke={colors.noseDark} strokeWidth="1.5" />

                {/* Eyes */}
                {getEyes()}

                {/* Mouth */}
                <path
                    d={getMouthPath()}
                    fill={isSpeaking || emotion === 'surprised' ? "#FFE5E5" : "none"}
                    stroke={colors.mouthLine}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />

                {/* Tongue (when speaking/happy) */}
                {(isSpeaking || emotion === 'happy' || emotion === 'laughing') && (
                    <ellipse cx="90" cy="72" rx="6" ry="3" fill={colors.tongue} />
                )}
            </g>

            {/* Ground shadow */}
            <ellipse cx="94" cy="190" rx="45" ry="8" fill="rgba(0,0,0,0.1)" />
        </svg>
    );
};

export default FocuslyLion;

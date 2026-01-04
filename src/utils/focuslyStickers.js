/**
 * Focusly Sticker Mapping
 * Maps emotions and states to specific sticker assets
 */

const STICKERS = {
    // Core Emotions
    neutral: '01_focusly_happy.png', // Default state
    happy: '01_focusly_happy.png',
    laughing: '02_focusly_laughing.png',
    sad: '03_focusly_sad.png',
    crying: '04_focusly_crying.png',
    love: '05_focusly_love.png',
    cool: '06_focusly_cool.png',
    thinking: '07_focusly_thinking.png',
    sleepy: '08_focusly_sleepy.png',
    shocked: '09_focusly_shocked.png',
    angry: '10_focusly_angry.png',
    excited: '11_focusly_excited.png',
    scared: '12_focusly_scared.png',
    blushing: '13_focusly_blushing.png',
    mindBlown: '14_focusly_mind_blown.png',
    confused: '15_focusly_confused.png',

    // Actions
    waving: '16_focusly_waving.png',
    thumbsUp: '17_focusly_thumbs_up.png',
    clapping: '18_focusly_clapping.png',
    praying: '19_focusly_praying.png',
    peace: '20_focusly_peacesign.png',
    facepalm: '21_focusly_facepalm.png',
    hugging: '22_focusly_hugging.png',
    dancing: '23_focusly_dancing.png',
    working: '24_focusly_working.png',
    running: '25_focusly_running.png',
    selfie: '26_focusly_selfie.png',
    eating: '27_focusly_eating.png',
    flexing: '28_focusly_flexing.png',
    meditating: '29_focusly_meditating.png',
    sleeping: '30_focusly_sleeping.png',
    sendingLove: '31_focusly_sendinglove.png',

    // Reactions
    perfect: '32_focusly_perfect_100.png',
    fire: '33_focusly_fire.png',
    sparkle: '34_focusly_sparkle.png',
    celebrate: '35_focusly_celebrate.png',
    rollingEyes: '36_focusly_rollingeyes.png',
    jump: '37_focusly_yay_jump.png',
    shhh: '38_focusly_shhh.png',
    no: '39_focusly_no.png',
    yes: '40_focusly_yes.png',

    // Special
    birthday: '41_focusly_birthday.png',
    graduation: '42_focusly_graduation.png',
    starstruck: '43_focusly_starstruck.png',
    drooling: '44_focusly_drooling.png',
    embarrassed: '45_focusly_embarrased.png',
    withLogo: '46_focusly_withlogo.png',
    namaste: '47_focusly_namaste.png',
    diwali: '48_focusly_diwali.png',
    gamer: '49_focusly_gamer.png',
    superhero: '50_focusly_superhero.png'
};

export const getStickerForEmotion = (emotion) => {
    // Normalize emotion string
    const key = emotion?.toLowerCase();

    // Direct match
    if (STICKERS[key]) return STICKERS[key];

    // Fuzzy matching / Fallbacks
    if (key?.includes('happy') || key?.includes('good')) return STICKERS.happy;
    if (key?.includes('sad') || key?.includes('bad')) return STICKERS.sad;
    if (key?.includes('laugh') || key?.includes('funny')) return STICKERS.laughing;
    if (key?.includes('angry') || key?.includes('mad')) return STICKERS.angry;
    if (key?.includes('love') || key?.includes('heart')) return STICKERS.love;
    if (key?.includes('think')) return STICKERS.thinking;
    if (key?.includes('confus')) return STICKERS.confused;
    if (key?.includes('wow') || key?.includes('shock')) return STICKERS.shocked;
    if (key?.includes('cool')) return STICKERS.cool;
    if (key?.includes('sleep') || key?.includes('tired')) return STICKERS.sleepy;
    if (key?.includes('work') || key?.includes('busy')) return STICKERS.working;
    if (key?.includes('dance') || key?.includes('party')) return STICKERS.dancing;
    if (key?.includes('hi') || key?.includes('hello') || key?.includes('wave')) return STICKERS.waving;

    // Default
    return STICKERS.neutral;
};

export default STICKERS;

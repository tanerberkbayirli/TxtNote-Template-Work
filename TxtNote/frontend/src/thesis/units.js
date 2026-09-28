export const MM_PER_PT = 25.4 / 72;
export const mmToTwip = (value = 0) => Math.round(value * 1440 / 25.4);
export const ptToTwip = (value = 0) => Math.round(value * 20);

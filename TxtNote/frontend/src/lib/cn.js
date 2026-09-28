/**
 * Conditional className joiner.
 */


export const cn = (...classes) => classes.filter(Boolean).join(" ");

export const peachFuzz = {
  50: '#ffeee5',
  100: '#ffdecc',
  200: '#ffbd99',
  300: '#ff9c66',
  400: '#ff7a33',
  500: '#ff5900',
  600: '#cc4700',
  700: '#993600',
  800: '#662400',
  900: '#331200',
  950: '#240c00',
} as const;

export const powderBlush = {
  50: '#ffebe5',
  100: '#ffd6cc',
  200: '#ffad99',
  300: '#ff8566',
  400: '#ff5c33',
  500: '#ff3300',
  600: '#cc2900',
  700: '#991f00',
  800: '#661400',
  900: '#330a00',
  950: '#240700',
} as const;

export const cottonCandy = {
  50: '#faebeb',
  100: '#f5d6d7',
  200: '#ebadaf',
  300: '#e08588',
  400: '#d65c60',
  500: '#cc3338',
  600: '#a3292d',
  700: '#7a1f22',
  800: '#521416',
  900: '#290a0b',
  950: '#1d0708',
} as const;

export const dustyRose = {
  50: '#f5eff0',
  100: '#ecdfe2',
  200: '#d9bfc4',
  300: '#c69fa7',
  400: '#b3808a',
  500: '#9f606c',
  600: '#804d57',
  700: '#603941',
  800: '#40262b',
  900: '#201316',
  950: '#160d0f',
} as const;

export const dimGrey = {
  50: '#f2f1f3',
  100: '#e5e4e7',
  200: '#cbc9cf',
  300: '#b1aeb7',
  400: '#98939f',
  500: '#7e7887',
  600: '#65606c',
  700: '#4b4851',
  800: '#323036',
  900: '#19181b',
  950: '#121113',
} as const;

export const colors = {
  peachFuzz,
  powderBlush,
  cottonCandy,
  dustyRose,
  dimGrey,
} as const;

export type ColorPalette = typeof colors;

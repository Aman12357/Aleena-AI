// Mapping of phoneme/viseme categories to VRM Expression Preset names.
// VRM standard expression presets: 'aa', 'ih', 'ou', 'ee', 'oh'

export const VISEME_MAP = {
  // Silent/Rest state
  silence: { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 },

  // Vowel viseme mappings
  A: { aa: 1.0, ih: 0.0, ou: 0.0, ee: 0.0, oh: 0.0 }, // Ah, Ar, Al
  E: { aa: 0.2, ih: 0.0, ou: 0.0, ee: 0.8, oh: 0.0 }, // Eh, Ey
  I: { aa: 0.0, ih: 0.9, ou: 0.0, ee: 0.3, oh: 0.0 }, // Ih, Ee
  O: { aa: 0.2, ih: 0.0, ou: 0.3, ee: 0.0, oh: 0.9 }, // Oh, Aw
  U: { aa: 0.0, ih: 0.0, ou: 1.0, ee: 0.0, oh: 0.1 }, // Oo, Uh, W

  // Consonant approximations
  B_M_P: { aa: 0.0, ih: 0.0, ou: 0.0, ee: 0.0, oh: 0.0 }, // Closed mouth
  F_V:   { aa: 0.1, ih: 0.3, ou: 0.0, ee: 0.0, oh: 0.0 }, // Teeth on lip
  L_D_T: { aa: 0.3, ih: 0.4, ou: 0.0, ee: 0.1, oh: 0.0 }, // Open teeth, tongue up
  S_Z:   { aa: 0.0, ih: 0.5, ou: 0.0, ee: 0.2, oh: 0.0 }, // Closed teeth
  CH_J:  { aa: 0.1, ih: 0.3, ou: 0.4, ee: 0.2, oh: 0.0 }  // Pursed lips
};

// Map standard text/phoneme keys to our viseme categories
export const PHONEME_TO_VISEME = {
  'p': 'B_M_P', 'b': 'B_M_P', 'm': 'B_M_P',
  'f': 'F_V', 'v': 'F_V',
  't': 'L_D_T', 'd': 'L_D_T', 'n': 'L_D_T', 'l': 'L_D_T', 'th': 'L_D_T',
  's': 'S_Z', 'z': 'S_Z', 'r': 'S_Z',
  'ch': 'CH_J', 'sh': 'CH_J', 'j': 'CH_J', 'zh': 'CH_J',
  'a': 'A', 'ah': 'A', 'aa': 'A', 'ey': 'A',
  'e': 'E', 'eh': 'E', 'ae': 'E',
  'i': 'I', 'ih': 'I', 'iy': 'I',
  'o': 'O', 'oh': 'O', 'ow': 'O', 'oy': 'O',
  'u': 'U', 'uw': 'U', 'uh': 'U', 'w': 'U', 'ou': 'U'
};

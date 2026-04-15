import { DialectZone } from "./types";

/**
 * Word-level replacement dictionaries based on
 * Марковић, Јордана (2000): Говор Заплања
 * 
 * Rules applied:
 * - х drops initially/finally, →в medially
 * - Final л preserved (NOT Timočki)
 * - Zone I: вокално л after с,д → ла/ле
 * - Zone II: вокално л after с,д → лу, radni pridev -ја, 3pl -ав/-ев
 * - Infinitive → да + present
 * - где→куде, овде→овдека, као→ко, много→млого
 * - није→неје, нисам→несам
 */

// Common replacements for both zones
const commonReplacements: [RegExp, string][] = [
  // х drops
  [/\bхлеб\b/gi, "леб"],
  [/\bхладан\b/gi, "ладан"],
  [/\bхладна\b/gi, "ладна"],
  [/\bхладно\b/gi, "ладно"],
  [/\bхватати\b/gi, "ватати"],
  [/\bхвала\b/gi, "вала"],
  [/\bхоћу\b/gi, "оћу"],
  [/\bхоће\b/gi, "оће"],
  [/\bхоћеш\b/gi, "оћеш"],
  [/\bхоћемо\b/gi, "оћемо"],
  [/\bодмах\b/gi, "одма"],
  [/\bсиромах\b/gi, "сирома"],
  [/\bсуха\b/gi, "сува"],
  [/\bсухо\b/gi, "суво"],
  [/\bснаха\b/gi, "сна"],
  [/\bуха\b/gi, "ува"],
  
  // није → неје
  [/\bније\b/gi, "неје"],
  [/\bнисам\b/gi, "несам"],
  [/\bнисмо\b/gi, "несмо"],
  [/\bнису\b/gi, "несу"],
  
  // Прилози
  [/\bгде\b/gi, "куде"],
  [/\bовде\b/gi, "овдека"],
  [/\bкао\b/gi, "ко"],
  [/\bмного\b/gi, "млого"],
  [/\bсамо\b/gi, "семо"],
  [/\bбаш\b/gi, "бъш"],
  [/\bту\b/gi, "туј"],
  
  // Лексика
  [/\bговорити\b/gi, "вреви"],
  [/\bговоримо\b/gi, "вревимо"],
  [/\bговори\b/gi, "вреви"],
  [/\bрадити\b/gi, "работи"],
  [/\bрадио\b/gi, "работел"],
  [/\bрадили\b/gi, "работели"],
  [/\bради\b/gi, "работи"],
  [/\bрадим\b/gi, "работим"],
  [/\bрадимо\b/gi, "работимо"],
  [/\bдоћи\b/gi, "да дојде"],
  [/\bдошао\b/gi, "дошњл"],
  [/\bдошла\b/gi, "дошла"],
  [/\bотишао\b/gi, "отишњл"],
  [/\bотишла\b/gi, "отишла"],
  [/\bпевати\b/gi, "поје"],
  [/\bпева\b/gi, "поје"],
  [/\bпије\b/gi, "пие"],
  [/\bпити\b/gi, "да пие"],
  
  // Футур
  [/\bћу\b/gi, "ће"],
  [/\bћеш\b/gi, "ћеш"],
  [/\bћемо\b/gi, "ћемо"],
  
  // Бројеви и остало
  [/\bболест\b/gi, "болес"],
  [/\bстарост\b/gi, "старос"],
  [/\bживео\b/gi, "живел"],
  [/\bживела\b/gi, "живела"],
  [/\bбео\b/gi, "бел"],
  [/\bбела\b/gi, "бела"],
  
  // Заменице
  [/\bко\b(?!\s)/gi, "кој"],
  [/\bшта\b/gi, "кво"],
  [/\bнико\b/gi, "никој"],
  
  // Предлози и везници
  [/\bтек\b/gi, "тике"],
];

// Zone I specific (Горње Заплање)
const zoneIReplacements: [RegExp, string][] = [
  [/\bсунце\b/gi, "сланце"],
  [/\bсуза\b/gi, "слаза"],
  [/\bпројдем\b/gi, "пројдем"],
  [/\bдојдем\b/gi, "дојдем"],
  [/\bдођем\b/gi, "дојдем"],
  [/\bпрођем\b/gi, "пројдем"],
  [/\bгоре\b/gi, "горе"],
  [/\bдоле\b/gi, "доле"],
];

// Zone II specific (Доње Заплање)
const zoneIIReplacements: [RegExp, string][] = [
  [/\bсунце\b/gi, "слунце"],
  [/\bсуза\b/gi, "слузе"],
  [/\bдођем\b/gi, "дађем"],
  [/\bпрођем\b/gi, "пређем"],
  [/\bгоре\b/gi, "гор"],
  [/\bдоле\b/gi, "дол"],
  [/\bпшеница\b/gi, "пченица"],
];

function applyReplacements(text: string, replacements: [RegExp, string][]): string {
  let result = text;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, (match) => {
      // Preserve case of first letter
      if (match[0] === match[0].toUpperCase() && replacement[0] !== replacement[0].toUpperCase()) {
        return replacement[0].toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }
  return result;
}

export function translateToDialect(text: string, zone: DialectZone): string {
  if (zone === "Стандардни српски") return text;

  // Заплањски дијалект uses Zone I (Горње Заплање) rules as the representative dialect
  let result = applyReplacements(text, commonReplacements);
  result = applyReplacements(result, zoneIReplacements);

  return result;
}

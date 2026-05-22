// Map a Chinese (or ASCII) character to its pinyin initial via Intl pinyin
// collation. Boundary chars are the lowest hanzi in each initial's syllable
// range — comparing with a zh-Hans-CN pinyin collator places any input
// between two boundaries.

export const PINYIN_LETTERS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "W", "X", "Y", "Z",
];

const BOUNDARIES = [
  ["A", "啊"],
  ["B", "八"],
  ["C", "嚓"],
  ["D", "咑"],
  ["E", "妸"],
  ["F", "发"],
  ["G", "旮"],
  ["H", "铪"],
  ["J", "丌"],
  ["K", "咔"],
  ["L", "垃"],
  ["M", "妈"],
  ["N", "拿"],
  ["O", "噢"],
  ["P", "趴"],
  ["Q", "七"],
  ["R", "然"],
  ["S", "仨"],
  ["T", "他"],
  ["W", "屲"],
  ["X", "夕"],
  ["Y", "丫"],
  ["Z", "帀"],
];

let collator = null;
let collatorChecked = false;

function getCollator() {
  if (collatorChecked) return collator;
  collatorChecked = true;
  const probe = new Intl.Collator("zh-Hans-CN-u-co-pinyin", {
    sensitivity: "base",
  });
  if (probe.compare("八", "啊") > 0 && probe.compare("夕", "啊") > 0) {
    collator = probe;
  }
  return collator;
}

export function getPinyinInitial(text) {
  if (!text) return "#";
  const ch = String(text).charAt(0);

  if (/[A-Za-z]/.test(ch)) return ch.toUpperCase();
  if (/\d/.test(ch)) return "#";
  if (!/[一-鿿]/.test(ch)) return "#";

  const cmp = getCollator();
  if (!cmp) return "#";
  let initial = "#";
  for (const [letter, boundary] of BOUNDARIES) {
    if (cmp.compare(ch, boundary) >= 0) {
      initial = letter;
    } else {
      break;
    }
  }
  return initial;
}

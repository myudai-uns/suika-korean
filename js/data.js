/* ============================================================
 * data.js — word chains, colors, sizes
 * Each "level" in CHAIN follows Suika progression:
 *  Lv.1 (smallest) → Lv.11 (master/legend)
 * Two of same level merge into next level.
 * ============================================================ */

// Color palette tuned for pastel Suika look
const PASTEL = [
  '#FFB3BA', // 1 pink
  '#FFDFBA', // 2 peach
  '#FFFFBA', // 3 lemon
  '#BAFFC9', // 4 mint
  '#BAE1FF', // 5 sky
  '#D7BAFF', // 6 lavender
  '#FFB3E6', // 7 rose
  '#FFCC99', // 8 orange
  '#A8E6CF', // 9 emerald
  '#FFD93D', // 10 gold
  '#FF6B9D', // 11 legend
];

// Radius progression (in px on a 420 wide board)
const RADII = [22, 28, 35, 42, 50, 58, 68, 78, 90, 104, 120];

/** Generic chain — the spine */
const CHAIN_NORMAL = [
  { word:'네',                    meaning:'はい',           roma:'ne'                        },
  { word:'안녕',                  meaning:'やあ',           roma:'annyeong'                  },
  { word:'고마워',                meaning:'ありがとう',     roma:'gomawo'                    },
  { word:'사랑해',                meaning:'愛してる',       roma:'saranghae'                 },
  { word:'안녕하세요',            meaning:'こんにちは',     roma:'annyeonghaseyo'            },
  { word:'감사합니다',            meaning:'ありがとうございます', roma:'gamsahamnida'        },
  { word:'사랑합니다',            meaning:'愛しています',   roma:'saranghamnida'             },
  { word:'만나서 반가워요',       meaning:'お会いできて嬉しいです', roma:'mannaseo bangawoyo' },
  { word:'한국 좋아해요',         meaning:'韓国が好きです', roma:'hanguk joahaeyo'           },
  { word:'한글 마스터 🇰🇷',      meaning:'ハングルマスター', roma:'hangeul master'           },
  { word:'한국 LEGEND 🌏',        meaning:'韓国レジェンド', roma:'hanguk legend'             },
];

/** K-POP mode chain — phrases / fan terms */
const CHAIN_KPOP = [
  { word:'오빠',           meaning:'お兄さん(年上男性)', roma:'oppa'                  },
  { word:'언니',           meaning:'お姉さん(年上女性)', roma:'eonni'                 },
  { word:'대박',           meaning:'すごい！',           roma:'daebak'                },
  { word:'화이팅',         meaning:'ファイト！',         roma:'hwaiting'              },
  { word:'심쿵',           meaning:'胸キュン',           roma:'simkung'               },
  { word:'덕질',           meaning:'推し活',             roma:'deokjil'               },
  { word:'최애',           meaning:'最推し',             roma:'choeae'                },
  { word:'무대 짱',        meaning:'ステージ最高',       roma:'mudae jjang'           },
  { word:'평생 응원해',    meaning:'一生応援する',       roma:'pyeongsaeng eungwonhae'},
  { word:'아이돌 ⭐',      meaning:'アイドル',           roma:'aidol'                 },
  { word:'K-POP LEGEND 💜',meaning:'K-POPレジェンド',    roma:'k-pop legend'          },
];

/** Daily chain — slightly different mix for fixed-seed mode */
const CHAIN_DAILY = [
  { word:'좋아',                  meaning:'いいね',         roma:'joa'                       },
  { word:'몰라',                  meaning:'知らない',       roma:'molla'                     },
  { word:'배고파',                meaning:'お腹すいた',     roma:'baegopa'                   },
  { word:'맛있어',                meaning:'おいしい',       roma:'masisseo'                  },
  { word:'재미있어요',            meaning:'面白いです',     roma:'jaemiisseoyo'              },
  { word:'행복해요',              meaning:'幸せです',       roma:'haengbokhaeyo'             },
  { word:'사랑스러워요',          meaning:'愛らしいです',   roma:'sarangseureowoyo'          },
  { word:'한국에 가고 싶어요',    meaning:'韓国に行きたいです', roma:'hanguge gago sipeoyo'  },
  { word:'한국어 잘 해요',        meaning:'韓国語上手です', roma:'hangugeo jal haeyo'        },
  { word:'데일리 클리어 ⭐',      meaning:'デイリークリア', roma:'daily clear'               },
  { word:'한국 ULTIMATE 👑',      meaning:'韓国アルティメット', roma:'hanguk ultimate'       },
];

const CHAINS = {
  normal: CHAIN_NORMAL,
  kpop:   CHAIN_KPOP,
  daily:  CHAIN_DAILY,
  review: CHAIN_NORMAL, // review uses normal chain but biases spawn
};

/** Spawn distribution: only spawn small levels (Suika spawns 1..5) */
const SPAWN_LEVELS = [1, 1, 1, 2, 2, 2, 3, 3, 4]; // weighted toward 1-2

/** Helper: deterministic RNG for Daily mode */
function dailySeed(){
  const d = new Date();
  return (d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate()) >>> 0;
}
function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

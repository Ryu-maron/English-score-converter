/**
 * 英語資格スコア換算データ
 * 
 * CEFRレベルを共通基準として各試験のスコアレンジをマッピングする。
 * 各試験のCEFRレベルごとのスコア範囲を定義し、
 * sourceスコア → CEFR正規化値(0-100) → targetスコア の変換を行う。
 * 
 * CEFR: A1(初心者) → A2 → B1 → B2 → C1 → C2(最上級)
 */

const CEFR_LEVELS = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// 各CEFRレベルの正規化された数値範囲 (0-100)
const CEFR_NUMERIC = {
  'Pre-A1': { min: 0, max: 10 },
  'A1':     { min: 10, max: 25 },
  'A2':     { min: 25, max: 40 },
  'B1':     { min: 40, max: 55 },
  'B2':     { min: 55, max: 75 },
  'C1':     { min: 75, max: 90 },
  'C2':     { min: 90, max: 100 },
};

/**
 * 試験データ定義
 * 
 * id: 一意の識別子
 * name: 表示名
 * nameEn: 英語名
 * min: 最小スコア
 * max: 最大スコア
 * step: スコアの刻み（デフォルト1）
 * type: "score"（数値スコア）/ "grade"（級・レベル）
 * category: "academic" / "business" / "general" / "specialized"
 * cefrMapping: CEFRレベルごとのスコアレンジ [min, max]
 *   ※ そのCEFRレベルに対応しない場合は null
 * grades: type="grade" の場合の級一覧（上位から）
 * gradesCefrMapping: 級→CEFRの対応
 */
const EXAM_DATA = [
  {
    id: 'toefl_ibt',
    name: 'TOEFL iBT',
    nameEn: 'TOEFL iBT',
    min: 0,
    max: 120,
    step: 1,
    type: 'score',
    category: 'academic',
    cefrMapping: {
      'Pre-A1': null,
      'A1': null,
      'A2': [0, 31],
      'B1': [32, 45],
      'B2': [46, 93],
      'C1': [94, 114],
      'C2': [115, 120],
    },
  },
  {
    id: 'ielts',
    name: 'IELTS',
    nameEn: 'IELTS',
    min: 0,
    max: 9.0,
    step: 0.5,
    type: 'score',
    category: 'academic',
    cefrMapping: {
      'Pre-A1': null,
      'A1': [0, 2.0],
      'A2': [2.5, 3.5],
      'B1': [4.0, 5.0],
      'B2': [5.5, 6.5],
      'C1': [7.0, 8.0],
      'C2': [8.5, 9.0],
    },
  },
  {
    id: 'eiken',
    name: '英検（実用英語技能検定）',
    nameEn: 'Eiken',
    type: 'grade',
    category: 'general',
    grades: ['1級', '準1級', '2級', '準2級', '3級', '4級', '5級'],
    gradesCefrMapping: {
      '5級': 'Pre-A1',
      '4級': 'A1',
      '3級': 'A1',
      '準2級': 'A2',
      '2級': 'B1',
      '準1級': 'B2',
      '1級': 'C1',
    },
  },
  {
    id: 'toeic',
    name: 'TOEIC L&R',
    nameEn: 'TOEIC L&R',
    min: 10,
    max: 990,
    step: 5,
    type: 'score',
    category: 'business',
    cefrMapping: {
      'Pre-A1': [10, 119],
      'A1': [120, 224],
      'A2': [225, 549],
      'B1': [550, 784],
      'B2': [785, 944],
      'C1': [945, 990],
      'C2': null,
    },
  },
  {
    id: 'cambridge',
    name: 'ケンブリッジ英検',
    nameEn: 'Cambridge English',
    min: 80,
    max: 230,
    step: 1,
    type: 'score',
    category: 'academic',
    cefrMapping: {
      'Pre-A1': [80, 99],
      'A1': [100, 119],
      'A2': [120, 139],
      'B1': [140, 159],
      'B2': [160, 179],
      'C1': [180, 199],
      'C2': [200, 230],
    },
  },
  {
    id: 'gtec',
    name: 'GTEC',
    nameEn: 'GTEC',
    min: 0,
    max: 1400,
    step: 1,
    type: 'score',
    category: 'academic',
    cefrMapping: {
      'Pre-A1': [0, 189],
      'A1': [190, 389],
      'A2': [390, 689],
      'B1': [690, 959],
      'B2': [960, 1189],
      'C1': [1190, 1349],
      'C2': [1350, 1400],
    },
  },
  {
    id: 'casec',
    name: 'CASEC',
    nameEn: 'CASEC',
    min: 0,
    max: 1000,
    step: 1,
    type: 'score',
    category: 'general',
    cefrMapping: {
      'Pre-A1': [0, 249],
      'A1': [250, 379],
      'A2': [380, 529],
      'B1': [530, 689],
      'B2': [690, 829],
      'C1': [830, 1000],
      'C2': null,
    },
  },
  {
    id: 'kanko_eigo',
    name: '観光英語検定',
    nameEn: 'Tourism English Proficiency Test',
    type: 'grade',
    category: 'specialized',
    grades: ['1級', '2級', '3級'],
    gradesCefrMapping: {
      '3級': 'A2',
      '2級': 'B1',
      '1級': 'B2',
    },
  },
  {
    id: 'nissho_business',
    name: '日商ビジネス英語検定',
    nameEn: 'Nissho Business English',
    type: 'grade',
    category: 'business',
    grades: ['1級', '2級', '3級'],
    gradesCefrMapping: {
      '3級': 'A2',
      '2級': 'B1',
      '1級': 'B2',
    },
  },
  {
    id: 'youho_eigo',
    name: '幼保英語検定',
    nameEn: 'Early Childhood English',
    type: 'grade',
    category: 'specialized',
    grades: ['1級', '準1級', '2級', '準2級', '3級', '4級'],
    gradesCefrMapping: {
      '4級': 'Pre-A1',
      '3級': 'A1',
      '準2級': 'A2',
      '2級': 'B1',
      '準1級': 'B2',
      '1級': 'C1',
    },
  },
  {
    id: 'eitango_kentei',
    name: '英単語検定',
    nameEn: 'English Vocabulary Test',
    type: 'grade',
    category: 'general',
    grades: ['1級', '準1級', '2級', '準2級', '3級', '4級', '5級'],
    gradesCefrMapping: {
      '5級': 'Pre-A1',
      '4級': 'A1',
      '3級': 'A1',
      '準2級': 'A2',
      '2級': 'B1',
      '準1級': 'B2',
      '1級': 'C1',
    },
  },
  {
    id: 'kokuren_eiken',
    name: '国連英検',
    nameEn: 'UN English Proficiency Test',
    type: 'grade',
    category: 'general',
    grades: ['特A級', 'A級', 'B級', 'C級', 'D級', 'E級'],
    gradesCefrMapping: {
      'E級': 'A1',
      'D級': 'A2',
      'C級': 'B1',
      'B級': 'B2',
      'A級': 'C1',
      '特A級': 'C2',
    },
  },
  {
    id: 'igaku_eigo',
    name: '日本医学英語検定',
    nameEn: 'Japan Medical English Test',
    type: 'grade',
    category: 'specialized',
    grades: ['1級', '2級', '3級', '4級'],
    gradesCefrMapping: {
      '4級': 'A2',
      '3級': 'B1',
      '2級': 'B2',
      '1級': 'C1',
    },
  },
  {
    id: 'act',
    name: 'ACT (English)',
    nameEn: 'ACT English',
    min: 1,
    max: 36,
    step: 1,
    type: 'score',
    category: 'academic',
    cefrMapping: {
      'Pre-A1': null,
      'A1': [1, 9],
      'A2': [10, 15],
      'B1': [16, 21],
      'B2': [22, 27],
      'C1': [28, 33],
      'C2': [34, 36],
    },
  },
  {
    id: 'gcas',
    name: 'GCAS',
    nameEn: 'GCAS',
    min: 0,
    max: 1000,
    step: 1,
    type: 'score',
    category: 'business',
    cefrMapping: {
      'Pre-A1': null,
      'A1': [0, 199],
      'A2': [200, 399],
      'B1': [400, 599],
      'B2': [600, 749],
      'C1': [750, 899],
      'C2': [900, 1000],
    },
  },
  {
    id: 'tobis',
    name: 'TOBIS（ビジネス通訳検定）',
    nameEn: 'TOBIS',
    type: 'grade',
    category: 'business',
    grades: ['1級', '2級', '3級', '4級'],
    gradesCefrMapping: {
      '4級': 'B1',
      '3級': 'B2',
      '2級': 'C1',
      '1級': 'C2',
    },
  },
];

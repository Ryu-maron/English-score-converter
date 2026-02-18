/**
 * 換算エンジン
 * 
 * 変換フロー:
 * 1. ソーススコア/級 → CEFR正規化値 (0-100)
 * 2. CEFR正規化値 → ターゲットスコア/級
 */

/**
 * スコア型試験のスコアをCEFR正規化値(0-100)に変換
 */
function scoreToCefrValue(exam, score) {
    const mapping = exam.cefrMapping;

    for (const level of CEFR_LEVELS) {
        const range = mapping[level];
        if (!range) continue;

        const [min, max] = range;
        if (score >= min && score <= max) {
            const cefrRange = CEFR_NUMERIC[level];
            // レンジ内での位置を正規化
            const ratio = (max === min) ? 0.5 : (score - min) / (max - min);
            return cefrRange.min + ratio * (cefrRange.max - cefrRange.min);
        }
    }

    // 範囲外の場合、最も近いレベルを返す
    if (score <= exam.min) return 0;
    if (score >= exam.max) return 100;
    return 50; // フォールバック
}

/**
 * 級型試験の級をCEFR正規化値に変換
 */
function gradeToCefrValue(exam, grade) {
    const cefrLevel = exam.gradesCefrMapping[grade];
    if (!cefrLevel) return null;

    const range = CEFR_NUMERIC[cefrLevel];
    // 級の場合はレンジの中央値を返す
    return (range.min + range.max) / 2;
}

/**
 * CEFR正規化値からスコア型試験のスコアに変換
 */
function cefrValueToScore(exam, cefrValue) {
    const mapping = exam.cefrMapping;

    // cefrValueが対応するCEFRレベルを特定
    let targetLevel = null;
    for (const level of CEFR_LEVELS) {
        const numRange = CEFR_NUMERIC[level];
        if (cefrValue >= numRange.min && cefrValue <= numRange.max) {
            targetLevel = level;
            break;
        }
    }

    if (!targetLevel) {
        targetLevel = cefrValue <= 0 ? 'Pre-A1' : 'C2';
    }

    const scoreRange = mapping[targetLevel];

    if (!scoreRange) {
        // この試験にはこのCEFRレベルに対応するスコアがない
        // 最も近いレベルを探す
        const levelIndex = CEFR_LEVELS.indexOf(targetLevel);

        // 上方探索
        for (let i = levelIndex + 1; i < CEFR_LEVELS.length; i++) {
            if (mapping[CEFR_LEVELS[i]]) {
                const r = mapping[CEFR_LEVELS[i]];
                return { score: r[0], cefrLevel: CEFR_LEVELS[i], approximate: true, message: `この試験では${targetLevel}レベルに直接対応するスコアがありません。最も近い${CEFR_LEVELS[i]}レベルの下限を表示しています。` };
            }
        }
        // 下方探索
        for (let i = levelIndex - 1; i >= 0; i--) {
            if (mapping[CEFR_LEVELS[i]]) {
                const r = mapping[CEFR_LEVELS[i]];
                return { score: r[1], cefrLevel: CEFR_LEVELS[i], approximate: true, message: `この試験では${targetLevel}レベルに直接対応するスコアがありません。最も近い${CEFR_LEVELS[i]}レベルの上限を表示しています。` };
            }
        }

        return { score: null, cefrLevel: targetLevel, approximate: true, message: 'この試験には対応するスコアがありません。' };
    }

    const cefrRange = CEFR_NUMERIC[targetLevel];
    const ratio = (cefrRange.max === cefrRange.min) ? 0.5 : (cefrValue - cefrRange.min) / (cefrRange.max - cefrRange.min);

    let score = scoreRange[0] + ratio * (scoreRange[1] - scoreRange[0]);

    // ステップに丸める
    if (exam.step) {
        score = Math.round(score / exam.step) * exam.step;
    } else {
        score = Math.round(score);
    }

    // 範囲内に収める
    score = Math.max(scoreRange[0], Math.min(scoreRange[1], score));

    return { score, cefrLevel: targetLevel, approximate: false, message: null };
}

/**
 * CEFR正規化値から級型試験の級に変換
 */
function cefrValueToGrade(exam, cefrValue) {
    // cefrValueが対応するCEFRレベルを特定
    let targetLevel = null;
    for (const level of CEFR_LEVELS) {
        const numRange = CEFR_NUMERIC[level];
        if (cefrValue >= numRange.min && cefrValue <= numRange.max) {
            targetLevel = level;
            break;
        }
    }

    if (!targetLevel) {
        targetLevel = cefrValue <= 0 ? 'Pre-A1' : 'C2';
    }

    // CEFRレベルに対応する級を逆引き
    for (const [grade, level] of Object.entries(exam.gradesCefrMapping)) {
        if (level === targetLevel) {
            return { grade, cefrLevel: targetLevel, approximate: false, message: null };
        }
    }

    // 対応する級がない場合、最も近い級を探す
    const levelIndex = CEFR_LEVELS.indexOf(targetLevel);

    // 上方探索
    for (let i = levelIndex + 1; i < CEFR_LEVELS.length; i++) {
        for (const [grade, level] of Object.entries(exam.gradesCefrMapping)) {
            if (level === CEFR_LEVELS[i]) {
                return { grade, cefrLevel: CEFR_LEVELS[i], approximate: true, message: `この試験では${targetLevel}レベルに直接対応する級がありません。最も近い${CEFR_LEVELS[i]}レベルの級を表示しています。` };
            }
        }
    }
    // 下方探索
    for (let i = levelIndex - 1; i >= 0; i--) {
        for (const [grade, level] of Object.entries(exam.gradesCefrMapping)) {
            if (level === CEFR_LEVELS[i]) {
                return { grade, cefrLevel: CEFR_LEVELS[i], approximate: true, message: `この試験では${targetLevel}レベルに直接対応する級がありません。最も近い${CEFR_LEVELS[i]}レベルの級を表示しています。` };
            }
        }
    }

    return { grade: null, cefrLevel: targetLevel, approximate: true, message: 'この試験には対応する級がありません。' };
}

/**
 * メイン変換関数
 * 
 * @param {string} sourceExamId - 入力試験ID
 * @param {number|string} sourceValue - 入力スコアまたは級
 * @param {string} targetExamId - 変換先試験ID
 * @returns {Object} 変換結果
 */
function convertScore(sourceExamId, sourceValue, targetExamId) {
    const sourceExam = EXAM_DATA.find(e => e.id === sourceExamId);
    const targetExam = EXAM_DATA.find(e => e.id === targetExamId);

    if (!sourceExam || !targetExam) {
        return { error: '試験が見つかりません。' };
    }

    // Step 1: ソース → CEFR正規化値
    let cefrValue;
    let sourceCefrLevel;

    if (sourceExam.type === 'score') {
        const numValue = parseFloat(sourceValue);
        if (isNaN(numValue) || numValue < sourceExam.min || numValue > sourceExam.max) {
            return { error: `${sourceExam.name}のスコアは${sourceExam.min}〜${sourceExam.max}の範囲で入力してください。` };
        }
        cefrValue = scoreToCefrValue(sourceExam, numValue);

        // ソースのCEFRレベルを特定
        for (const level of CEFR_LEVELS) {
            const numRange = CEFR_NUMERIC[level];
            if (cefrValue >= numRange.min && cefrValue <= numRange.max) {
                sourceCefrLevel = level;
                break;
            }
        }
    } else {
        if (!sourceExam.grades.includes(sourceValue)) {
            return { error: `${sourceExam.name}の有効な級を選択してください。` };
        }
        cefrValue = gradeToCefrValue(sourceExam, sourceValue);
        sourceCefrLevel = sourceExam.gradesCefrMapping[sourceValue];
        if (cefrValue === null) {
            return { error: 'CEFR対応が見つかりません。' };
        }
    }

    // Step 2: CEFR正規化値 → ターゲット
    let result;
    if (targetExam.type === 'score') {
        result = cefrValueToScore(targetExam, cefrValue);
        return {
            sourceExam: sourceExam,
            targetExam: targetExam,
            sourceValue: sourceValue,
            targetValue: result.score,
            targetType: 'score',
            sourceCefrLevel: sourceCefrLevel,
            targetCefrLevel: result.cefrLevel,
            cefrValue: cefrValue,
            approximate: result.approximate,
            message: result.message,
        };
    } else {
        result = cefrValueToGrade(targetExam, cefrValue);
        return {
            sourceExam: sourceExam,
            targetExam: targetExam,
            sourceValue: sourceValue,
            targetValue: result.grade,
            targetType: 'grade',
            sourceCefrLevel: sourceCefrLevel,
            targetCefrLevel: result.cefrLevel,
            cefrValue: cefrValue,
            approximate: result.approximate,
            message: result.message,
        };
    }
}

/**
 * CEFRレベルの説明を取得
 */
function getCefrDescription(level) {
    const descriptions = {
        'Pre-A1': '基礎の基礎レベル',
        'A1': '初心者 — 基本的な表現を理解・使用可能',
        'A2': '初級 — 日常的な表現を理解・使用可能',
        'B1': '中級 — 仕事や学校での基本的なやり取り可能',
        'B2': '中上級 — 複雑な文章を理解・議論可能',
        'C1': '上級 — 高度な文章を理解し流暢にコミュニケーション可能',
        'C2': '最上級 — ネイティブに近い理解力と表現力',
    };
    return descriptions[level] || '';
}

/**
 * CEFRレベルのカラーを取得
 */
function getCefrColor(level) {
    const colors = {
        'Pre-A1': '#9e9e9e',
        'A1': '#ef5350',
        'A2': '#ff7043',
        'B1': '#ffa726',
        'B2': '#66bb6a',
        'C1': '#42a5f5',
        'C2': '#7e57c2',
    };
    return colors[level] || '#888';
}

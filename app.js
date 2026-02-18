/**
 * アプリケーション UI コントローラー
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sourceExamSelect = document.getElementById('sourceExam');
    const scoreInputGroup = document.getElementById('scoreInputGroup');
    const gradeInputGroup = document.getElementById('gradeInputGroup');
    const sourceScoreInput = document.getElementById('sourceScore');
    const sourceGradeSelect = document.getElementById('sourceGrade');
    const scoreRangeHint = document.getElementById('scoreRangeHint');
    const targetExamSelect = document.getElementById('targetExam');
    const convertBtn = document.getElementById('convertBtn');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const resultSection = document.getElementById('resultSection');

    // Result Elements
    const resultSourceExam = document.getElementById('resultSourceExam');
    const resultSourceScore = document.getElementById('resultSourceScore');
    const resultTargetExam = document.getElementById('resultTargetExam');
    const resultTargetScore = document.getElementById('resultTargetScore');
    const resultApproximate = document.getElementById('resultApproximate');
    const cefrBadge = document.getElementById('cefrBadge');
    const cefrDescription = document.getElementById('cefrDescription');
    const cefrBar = document.getElementById('cefrBar');
    const approxMessage = document.getElementById('approxMessage');
    const approxText = document.getElementById('approxText');

    // Info toggles
    const cefrInfoToggle = document.getElementById('cefrInfoToggle');
    const cefrInfoContent = document.getElementById('cefrInfoContent');
    const examInfoToggle = document.getElementById('examInfoToggle');
    const examInfoContent = document.getElementById('examInfoContent');

    // ====== Initialization ======

    initSourceExamDropdown();
    initCefrTable();
    initExamTable();
    initCefrBar();
    initInfoToggles();

    // ====== Event Listeners ======

    sourceExamSelect.addEventListener('change', onSourceExamChange);
    sourceScoreInput.addEventListener('input', validateAndEnableConvert);
    sourceGradeSelect.addEventListener('change', validateAndEnableConvert);
    targetExamSelect.addEventListener('change', validateAndEnableConvert);
    convertBtn.addEventListener('click', performConversion);

    // Allow Enter key to trigger conversion
    sourceScoreInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !convertBtn.disabled) {
            performConversion();
        }
    });

    // ====== Functions ======

    function getCategoryLabel(category) {
        const labels = {
            academic: 'アカデミック',
            business: 'ビジネス',
            general: '一般',
            specialized: '専門',
        };
        return labels[category] || category;
    }

    function initSourceExamDropdown() {
        // Group exams by category
        const categories = {
            academic: { label: '📚 アカデミック', exams: [] },
            business: { label: '💼 ビジネス', exams: [] },
            general: { label: '📖 一般', exams: [] },
            specialized: { label: '🔬 専門', exams: [] },
        };

        EXAM_DATA.forEach(exam => {
            if (categories[exam.category]) {
                categories[exam.category].exams.push(exam);
            }
        });

        for (const [key, cat] of Object.entries(categories)) {
            if (cat.exams.length === 0) continue;
            const optgroup = document.createElement('optgroup');
            optgroup.label = cat.label;
            cat.exams.forEach(exam => {
                const option = document.createElement('option');
                option.value = exam.id;
                option.textContent = exam.name;
                optgroup.appendChild(option);
            });
            sourceExamSelect.appendChild(optgroup);
        }
    }

    function onSourceExamChange() {
        const examId = sourceExamSelect.value;
        const exam = EXAM_DATA.find(e => e.id === examId);
        if (!exam) return;

        // Reset
        hideError();
        resultSection.classList.remove('visible');

        if (exam.type === 'score') {
            scoreInputGroup.style.display = 'block';
            gradeInputGroup.style.display = 'none';
            sourceScoreInput.value = '';
            sourceScoreInput.min = exam.min;
            sourceScoreInput.max = exam.max;
            sourceScoreInput.step = exam.step || 1;
            scoreRangeHint.textContent = `有効範囲: ${exam.min} 〜 ${exam.max}（${exam.step && exam.step !== 1 ? exam.step + '刻み' : '整数'}）`;
            sourceScoreInput.focus();
        } else {
            scoreInputGroup.style.display = 'none';
            gradeInputGroup.style.display = 'block';
            sourceGradeSelect.innerHTML = '<option value="" disabled selected>級を選んでください</option>';
            exam.grades.forEach(grade => {
                const option = document.createElement('option');
                option.value = grade;
                option.textContent = grade;
                sourceGradeSelect.appendChild(option);
            });
        }

        // Populate target exam dropdown (exclude source exam)
        populateTargetExams(examId);
        targetExamSelect.disabled = false;
        convertBtn.disabled = true;
    }

    function populateTargetExams(excludeId) {
        targetExamSelect.innerHTML = '<option value="" disabled selected>換算先の試験を選んでください</option>';

        const categories = {
            academic: { label: '📚 アカデミック', exams: [] },
            business: { label: '💼 ビジネス', exams: [] },
            general: { label: '📖 一般', exams: [] },
            specialized: { label: '🔬 専門', exams: [] },
        };

        EXAM_DATA.forEach(exam => {
            if (exam.id !== excludeId && categories[exam.category]) {
                categories[exam.category].exams.push(exam);
            }
        });

        for (const [key, cat] of Object.entries(categories)) {
            if (cat.exams.length === 0) continue;
            const optgroup = document.createElement('optgroup');
            optgroup.label = cat.label;
            cat.exams.forEach(exam => {
                const option = document.createElement('option');
                option.value = exam.id;
                option.textContent = exam.name;
                optgroup.appendChild(option);
            });
            targetExamSelect.appendChild(optgroup);
        }
    }

    function validateAndEnableConvert() {
        hideError();
        const sourceExam = EXAM_DATA.find(e => e.id === sourceExamSelect.value);
        if (!sourceExam) { convertBtn.disabled = true; return; }

        let hasSource = false;
        if (sourceExam.type === 'score') {
            hasSource = sourceScoreInput.value !== '';
        } else {
            hasSource = sourceGradeSelect.value !== '';
        }

        const hasTarget = targetExamSelect.value !== '';
        convertBtn.disabled = !(hasSource && hasTarget);
    }

    function performConversion() {
        hideError();
        resultSection.classList.remove('visible');

        const sourceExamId = sourceExamSelect.value;
        const targetExamId = targetExamSelect.value;
        const sourceExam = EXAM_DATA.find(e => e.id === sourceExamId);

        let sourceValue;
        if (sourceExam.type === 'score') {
            sourceValue = parseFloat(sourceScoreInput.value);
        } else {
            sourceValue = sourceGradeSelect.value;
        }

        const result = convertScore(sourceExamId, sourceValue, targetExamId);

        if (result.error) {
            showError(result.error);
            return;
        }

        displayResult(result);
    }

    function displayResult(result) {
        // Source info
        resultSourceExam.textContent = result.sourceExam.name;
        if (result.sourceExam.type === 'score') {
            resultSourceScore.textContent = result.sourceValue;
        } else {
            resultSourceScore.textContent = result.sourceValue;
        }

        // Target info
        resultTargetExam.textContent = `${result.targetExam.name} 換算スコア`;

        if (result.targetType === 'score') {
            resultTargetScore.textContent = result.targetValue !== null ? result.targetValue : '—';
        } else {
            resultTargetScore.textContent = result.targetValue || '—';
        }

        // Approximate
        if (result.approximate) {
            resultApproximate.style.display = 'block';
        } else {
            resultApproximate.style.display = 'none';
        }

        // CEFR Badge
        const cefrLevel = result.targetCefrLevel || result.sourceCefrLevel;
        const cefrColor = getCefrColor(cefrLevel);
        cefrBadge.textContent = cefrLevel;
        cefrBadge.style.backgroundColor = cefrColor + '20';
        cefrBadge.style.color = cefrColor;
        cefrBadge.style.borderColor = cefrColor + '40';

        cefrDescription.textContent = getCefrDescription(cefrLevel);

        // Update CEFR bar
        updateCefrBar(cefrLevel);

        // Approximate message
        if (result.message) {
            approxMessage.classList.add('visible');
            approxText.textContent = result.message;
        } else {
            approxMessage.classList.remove('visible');
        }

        // Show result with animation
        resultSection.classList.add('visible');

        // Scroll to result
        setTimeout(() => {
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }

    function initCefrBar() {
        const levels = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const colors = {
            'Pre-A1': '#9e9e9e',
            'A1': '#ef5350',
            'A2': '#ff7043',
            'B1': '#ffa726',
            'B2': '#66bb6a',
            'C1': '#42a5f5',
            'C2': '#7e57c2',
        };

        cefrBar.innerHTML = '';
        levels.forEach(level => {
            const segment = document.createElement('div');
            segment.className = 'cefr-bar-segment';
            segment.dataset.level = level;
            segment.style.backgroundColor = colors[level];
            segment.textContent = level;
            cefrBar.appendChild(segment);
        });
    }

    function updateCefrBar(activeLevel) {
        const segments = cefrBar.querySelectorAll('.cefr-bar-segment');
        segments.forEach(seg => {
            if (seg.dataset.level === activeLevel) {
                seg.classList.add('active');
            } else {
                seg.classList.remove('active');
            }
        });
    }

    function initCefrTable() {
        const tbody = document.querySelector('#cefrTable tbody');
        const levels = [
            { level: 'C2', desc: '最上級 — ネイティブに近い理解力と表現力' },
            { level: 'C1', desc: '上級 — 高度な文章を理解し流暢にコミュニケーション可能' },
            { level: 'B2', desc: '中上級 — 複雑な文章を理解・議論可能' },
            { level: 'B1', desc: '中級 — 仕事や学校での基本的なやり取り可能' },
            { level: 'A2', desc: '初級 — 日常的な表現を理解・使用可能' },
            { level: 'A1', desc: '初心者 — 基本的な表現を理解・使用可能' },
            { level: 'Pre-A1', desc: '基礎の基礎レベル' },
        ];

        levels.forEach(item => {
            const tr = document.createElement('tr');
            const tdLevel = document.createElement('td');
            tdLevel.textContent = item.level;
            tdLevel.style.color = getCefrColor(item.level);
            const tdDesc = document.createElement('td');
            tdDesc.textContent = item.desc;
            tr.appendChild(tdLevel);
            tr.appendChild(tdDesc);
            tbody.appendChild(tr);
        });
    }

    function initExamTable() {
        const tbody = document.querySelector('#examTable tbody');
        EXAM_DATA.forEach(exam => {
            const tr = document.createElement('tr');
            const tdName = document.createElement('td');
            tdName.textContent = exam.name;
            const tdType = document.createElement('td');
            tdType.textContent = exam.type === 'score' ? `${exam.min}〜${exam.max}` : `級制（${exam.grades.length}段階）`;
            const tdCategory = document.createElement('td');
            const tag = document.createElement('span');
            tag.className = `category-tag ${exam.category}`;
            tag.textContent = getCategoryLabel(exam.category);
            tdCategory.appendChild(tag);
            tr.appendChild(tdName);
            tr.appendChild(tdType);
            tr.appendChild(tdCategory);
            tbody.appendChild(tr);
        });
    }

    function initInfoToggles() {
        cefrInfoToggle.addEventListener('click', () => {
            cefrInfoToggle.classList.toggle('open');
            cefrInfoContent.classList.toggle('open');
        });

        examInfoToggle.addEventListener('click', () => {
            examInfoToggle.classList.toggle('open');
            examInfoContent.classList.toggle('open');
        });
    }

    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.add('visible');
    }

    function hideError() {
        errorMessage.classList.remove('visible');
    }
});

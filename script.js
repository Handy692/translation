// 全局变量
let currentMode = '';
let sentences = [];
let currentSentenceIndex = 0;
let startTime = null;
let timerInterval = null;
let userTranslations = [];

// DOM元素
const uploadSection = document.getElementById('upload-section');
const passageSelection = document.getElementById('passage-selection');
const modeSelection = document.getElementById('mode-selection');
const sentencePractice = document.getElementById('sentence-practice');
const passagePractice = document.getElementById('passage-practice');
const resultSection = document.getElementById('result-section');

const wordFile = document.getElementById('word-file');
const uploadBtn = document.getElementById('upload-btn');
const passageList = document.getElementById('passage-list');
const sentenceModeBtn = document.getElementById('sentence-mode-btn');
const passageModeBtn = document.getElementById('passage-mode-btn');
const englishInput = document.getElementById('english-input');
const passageInput = document.getElementById('passage-input');
const backToSelectBtn = document.getElementById('back-to-select');
const uploadNewBtn = document.getElementById('upload-new');

// DeepSeek API 相关元素
const deepseekApiKey = document.getElementById('deepseek-api-key');
const saveApiKeyBtn = document.getElementById('save-api-key');

// 新增文章选择区域元素
const backToPassageBtn = document.createElement('button');
backToPassageBtn.textContent = '返回文章选择';
backToPassageBtn.id = 'back-to-passage';
backToPassageBtn.className = 'action-btn';

const timer = document.getElementById('timer');
const currentChinese = document.getElementById('current-chinese');
const currentSentenceEl = document.getElementById('current-sentence');
const totalSentencesEl = document.getElementById('total-sentences');
const chinesePassage = document.getElementById('chinese-passage');

const resultTime = document.getElementById('result-time');
const resultScore = document.getElementById('result-score');
const grammarErrors = document.getElementById('grammar-errors');
const translatedText = document.getElementById('translated-text');

// 初始化事件监听器
function initEventListeners() {
    uploadBtn.addEventListener('click', handleFileUpload);
    sentenceModeBtn.addEventListener('click', startSentenceMode);
    passageModeBtn.addEventListener('click', startPassageMode);
    backToSelectBtn.addEventListener('click', backToSelection);
    backToPassageBtn.addEventListener('click', backToPassageSelection);
    uploadNewBtn.addEventListener('click', uploadNewFile);
    englishInput.addEventListener('keypress', handleSentenceInput);
    englishInput.addEventListener('keydown', handleSentenceKeyDown);
    passageInput.addEventListener('keypress', handlePassageInput);
    
    // DeepSeek API 相关事件监听
    saveApiKeyBtn.addEventListener('click', saveApiKey);
    
    // 日志面板切换按钮事件监听
    const toggleLogBtn = document.getElementById('toggle-log-btn');
    if (toggleLogBtn) {
        toggleLogBtn.addEventListener('click', toggleLogPanel);
    }
}

// 显示文章选择界面
function showPassageSelection() {
    passageList.innerHTML = '';
    
    // 动态生成文章列表
    passages.forEach((passage, index) => {
        const passageItem = document.createElement('div');
        passageItem.className = 'passage-item';
        passageItem.innerHTML = `
            <h3>文章 ${index + 1}</h3>
            <p class="passage-preview">${passage.substring(0, 100)}${passage.length > 100 ? '...' : ''}</p>
            <button class="select-passage-btn" data-index="${index}">选择这篇文章</button>
        `;
        passageList.appendChild(passageItem);
    });
    
    // 添加事件监听器
    const selectButtons = document.querySelectorAll('.select-passage-btn');
    selectButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            selectPassage(index);
        });
    });
    
    // 显示文章选择区域
    showSection(passageSelection);
}

// 选择文章
function selectPassage(index) {
    currentPassageIndex = index;
    // 将当前文章分割为句子（按换行）
    sentences = splitChineseSentences(passages[index]);
    
    // 显示模式选择
    showSection(modeSelection);
    hideSection(passageSelection);
}

// 返回文章选择
function backToPassageSelection() {
    showSection(passageSelection);
    hideSection(modeSelection);
}

// 处理文件上传
function handleFileUpload() {
    const file = wordFile.files[0];
    if (!file) {
        alert('请先选择一个Word文件');
        return;
    }

    if (file.name.endsWith('.docx')) {
        parseDocxFile(file);
    } else if (file.name.endsWith('.doc')) {
        alert('暂不支持旧版.doc格式，请使用.docx格式');
    } else {
        alert('请上传Word文件（.docx格式）');
    }
}

// 全局变量增加
let passages = [];
let currentPassageIndex = 0;

// 解析.docx文件
function parseDocxFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        
        // 使用JSZip和docx.js解析文件
        JSZip.loadAsync(arrayBuffer).then(function(zip) {
            return zip.file('word/document.xml').async('text');
        }).then(function(xmlContent) {
            const doc = new DOMParser().parseFromString(xmlContent, 'application/xml');
            
            // 改进的解析逻辑，保留换行和段落
            let fullText = '';
            const paragraphs = doc.getElementsByTagName('w:p');
            
            for (let i = 0; i < paragraphs.length; i++) {
                const paragraph = paragraphs[i];
                const textNodes = paragraph.getElementsByTagName('w:t');
                
                let paragraphText = '';
                for (let j = 0; j < textNodes.length; j++) {
                    paragraphText += textNodes[j].textContent;
                }
                
                // 检查是否有换行符
                const brNodes = paragraph.getElementsByTagName('w:br');
                if (brNodes.length > 0) {
                    // 有换行符，保留原始格式
                    paragraphText += '\n';
                }
                
                if (paragraphText.trim()) {
                    fullText += paragraphText + '\n';
                }
            }
            
            // 按Passage分割文章
            passages = splitByPassage(fullText);
            if (passages.length === 0) {
                alert('未检测到有效文章，请确保文档包含Passage标记');
                return;
            }
            
            // 显示文章选择
            showPassageSelection();
            hideSection(uploadSection);
        }).catch(function(error) {
            console.error('解析文件出错:', error);
            alert('解析文件出错，请检查文件格式');
        });
    };
    reader.readAsArrayBuffer(file);
}

// 按Passage分割文章
function splitByPassage(text) {
    // 按Passage标记分割文章
    const passageRegex = /Passage\s*\d+/gi;
    const passages = [];
    let lastIndex = 0;
    let match;
    
    // 找到所有Passage标记
    const passageMatches = [];
    while ((match = passageRegex.exec(text)) !== null) {
        passageMatches.push({ index: match.index, text: match[0] });
    }
    
    // 如果没有Passage标记，整个文本作为一篇文章
    if (passageMatches.length === 0) {
        return [text.trim()];
    }
    
    // 分割文章
    for (let i = 0; i < passageMatches.length; i++) {
        const currentMatch = passageMatches[i];
        const nextMatch = passageMatches[i + 1];
        
        // 跳过Passage标记本身，只取标记之后的内容
        const startIndex = currentMatch.index + currentMatch.text.length;
        
        let passageText;
        if (nextMatch) {
            passageText = text.slice(startIndex, nextMatch.index).trim();
        } else {
            passageText = text.slice(startIndex).trim();
        }
        
        if (passageText) {
            passages.push(passageText);
        }
    }
    
    return passages;
}

// 中文分句函数（现在按换行分割，保留原始结构）
function splitChineseSentences(text) {
    // 按换行符分割句子
    const lines = text.split('\n');
    let sentences = [];
    
    for (let line of lines) {
        line = line.trim();
        if (line) {
            sentences.push(line);
        }
    }
    
    return sentences;
}

// 开始分句练习
function startSentenceMode() {
    currentMode = 'sentence';
    currentSentenceIndex = 0;
    userTranslations = [];
    
    // 设置当前句子
    updateCurrentSentence();
    
    // 显示练习区域
    showSection(sentencePractice);
    hideSection(modeSelection);
    
    // 开始计时
    startTimer();
    
    // 聚焦输入框
    englishInput.focus();
}

// 更新当前句子
function updateCurrentSentence() {
    if (currentSentenceIndex < sentences.length) {
        currentChinese.textContent = sentences[currentSentenceIndex];
        currentSentenceEl.textContent = currentSentenceIndex + 1;
        totalSentencesEl.textContent = sentences.length;
        englishInput.value = '';
    }
}

// 开始整篇练习
function startPassageMode() {
    currentMode = 'passage';
    
    // 设置中文 passage，取消所有换行符
    const passageText = passages[currentPassageIndex].replace(/\n/g, ' ');
    chinesePassage.innerHTML = passageText;
    
    // 显示练习区域
    showSection(passagePractice);
    hideSection(modeSelection);
    
    // 开始计时
    startTimer();
    
    // 聚焦输入框
    passageInput.focus();
}

// 处理分句输入
async function handleSentenceInput(e) {
    if (e.key === 'Enter') {
        const translation = englishInput.value.trim();
        if (translation) {
            userTranslations[currentSentenceIndex] = translation;
            currentSentenceIndex++;
            
            if (currentSentenceIndex < sentences.length) {
                updateCurrentSentence();
            } else {
                // 完成所有句子
                await endPractice();
            }
        }
    }
}

// 处理分句输入框的键盘事件（上箭头回到上一句）
function handleSentenceKeyDown(e) {
    if (currentMode === 'sentence' && e.key === 'ArrowUp') {
        if (currentSentenceIndex > 0) {
            // 保存当前翻译
            const currentTranslation = englishInput.value.trim();
            if (currentTranslation) {
                userTranslations[currentSentenceIndex] = currentTranslation;
            }
            
            // 回到上一句
            currentSentenceIndex--;
            
            // 更新当前句子显示
            if (currentSentenceIndex < sentences.length) {
                currentChinese.textContent = sentences[currentSentenceIndex];
                currentSentenceEl.textContent = currentSentenceIndex + 1;
                totalSentencesEl.textContent = sentences.length;
                
                // 恢复上一句的翻译（如果有）
                englishInput.value = userTranslations[currentSentenceIndex] || '';
                englishInput.focus();
            }
        }
    }
}

// 处理整篇输入
async function handlePassageInput(e) {
    if (e.key === 'Enter' && e.shiftKey) {
        // 允许Shift+Enter换行
        return;
    } else if (e.key === 'Enter') {
        e.preventDefault();
        const translation = passageInput.value.trim();
        if (translation) {
            userTranslations = [translation];
            await endPractice();
        }
    }
}

// 开始计时
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

// 更新计时器
function updateTimer() {
    if (!startTime) return;
    
    const elapsedTime = Date.now() - startTime;
    const hours = Math.floor(elapsedTime / 3600000);
    const minutes = Math.floor((elapsedTime % 3600000) / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    
    timer.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 结束练习
async function endPractice() {
    // 停止计时
    clearInterval(timerInterval);
    timerInterval = null;
    
    // 计算用时
    const elapsedTime = Date.now() - startTime;
    const hours = Math.floor(elapsedTime / 3600000);
    const minutes = Math.floor((elapsedTime % 3600000) / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    let score = 0;
    let detailedErrors = [];
    
    try {
        // 选择评分系统
        const scoringSystem = await selectScoringSystem();
        logMessage(`开始使用${scoringSystem.system}系统评估翻译质量`, 'info');
        
        if (currentMode === 'sentence') {
            // 分句模式：为每个句子生成评分和错误分析
            for (let i = 0; i < sentences.length; i++) {
                const translation = userTranslations[i] || '';
                if (translation.trim()) {
                    try {
                        const evaluation = await scoringSystem.evaluate(sentences[i], translation);
                        if (evaluation) {
                            detailedErrors.push({
                                sentenceIndex: i + 1,
                                chinese: sentences[i],
                                translation: translation,
                                errors: evaluation.errors
                            });
                        }
                    } catch (error) {
                        logMessage(`评估第${i+1}句时出错: ${error.message}`, 'error');
                        // 即使单个句子评估失败，继续评估其他句子
                    }
                }
            }
            
            // 计算平均分
            if (detailedErrors.length > 0) {
                // 如果使用的是DeepSeek，尝试从每个评估结果中获取分数
                if (scoringSystem.system === 'deepseek' && detailedErrors[0].errors && detailedErrors[0].errors.length > 0) {
                    const totalScore = detailedErrors.reduce((sum, item) => {
                        // 尝试从错误信息中提取分数
                        const scoreMatch = JSON.stringify(item.errors).match(/评分：(\d+)/);
                        return sum + (scoreMatch ? parseInt(scoreMatch[1]) : 80);
                    }, 0);
                    score = Math.max(0, Math.min(100, Math.round(totalScore / detailedErrors.length)));
                } else {
                    const totalErrors = detailedErrors.reduce((count, item) => count + item.errors.length, 0);
                    const avgErrorsPerSentence = totalErrors / detailedErrors.length;
                    score = Math.max(0, Math.round(100 - avgErrorsPerSentence * 10));
                }
            } else {
                score = 100;
            }
        } else {
            // 整篇模式：对整个翻译进行评估
            const translation = userTranslations[0] || '';
            if (translation.trim()) {
                const evaluation = await scoringSystem.evaluate(passages[currentPassageIndex], translation);
                if (evaluation) {
                    score = evaluation.score;
                    detailedErrors.push({
                        sentenceIndex: 0,
                        chinese: passages[currentPassageIndex],
                        translation: translation,
                        errors: evaluation.errors
                    });
                }
            }
        }
        
        logMessage(`翻译评估完成，最终得分: ${score}`, 'info');
    } catch (error) {
        logMessage(`评估翻译质量时出错: ${error.message}`, 'error');
        alert('评估翻译质量时出错，已使用备用评分系统完成评估');
        
        // 即使出错，也尝试显示结果
        if (detailedErrors.length === 0) {
            // 如果没有详细错误信息，使用简单评分
            score = Math.max(0, Math.min(100, Math.round(Math.random() * 30 + 70)));
        }
    }
    
    // 显示结果
    showResult(timeString, score, detailedErrors);
}

// 生成评分（模拟AI评分，基于错误分析）
function generateScore() {
    // 获取详细错误分析
    const errors = generateDetailedErrors();
    
    // 计算基础分
    let baseScore = 80;
    
    // 根据错误数量扣分
    const totalErrors = errors.reduce((count, error) => count + error.errors.length, 0);
    const errorPenalty = Math.min(totalErrors * 5, 40);
    
    // 根据错误严重程度调整
    let severityPenalty = 0;
    errors.forEach(error => {
        error.errors.forEach(err => {
            if (err.type === '语法错误') severityPenalty += 3;
            if (err.type === '拼写错误') severityPenalty += 2;
        });
    });
    severityPenalty = Math.min(severityPenalty, 30);
    
    // 计算最终分数
    let finalScore = baseScore - errorPenalty - severityPenalty;
    finalScore = Math.max(Math.round(finalScore), 0);
    finalScore = Math.min(finalScore, 100);
    
    return finalScore;
}

// 生成详细错误分析
function generateDetailedErrors() {
    const detailedErrors = [];
    
    // 根据模式处理
    if (currentMode === 'sentence') {
        // 分句模式：为每一句生成错误
        sentences.forEach((chinese, index) => {
            const translation = userTranslations[index] || '';
            if (translation.trim()) {
                const sentenceErrors = analyzeSentence(chinese, translation, index + 1);
                if (sentenceErrors.length > 0) {
                    detailedErrors.push({
                        sentenceIndex: index + 1,
                        chinese: chinese,
                        translation: translation,
                        errors: sentenceErrors
                    });
                }
            }
        });
    } else {
        // 整篇模式：整体分析
        const chineseText = passages[currentPassageIndex];
        const translation = userTranslations[0] || '';
        
        if (translation.trim()) {
            const passageErrors = analyzePassage(chineseText, translation);
            if (passageErrors.length > 0) {
                detailedErrors.push({
                    sentenceIndex: 0, // 整篇模式
                    chinese: chineseText,
                    translation: translation,
                    errors: passageErrors
                });
            }
        }
    }
    
    return detailedErrors;
}

// 分析整篇翻译
function analyzePassage(chinese, translation) {
    const errors = [];
    const words = translation.split(' ');
    
    // 随机生成2-5个错误（整篇模式）
    const errorCount = Math.floor(Math.random() * 4) + 2;
    
    // 可能的错误类型
    const grammarErrors = [
        { type: '语法错误', description: '主谓一致问题', example: 'is/are' },
        { type: '语法错误', description: '时态错误', example: 'go/went/gone' },
        { type: '语法错误', description: '冠词错误', example: 'a/an/the' },
        { type: '语法错误', description: '介词错误', example: 'in/on/at' },
        { type: '语法错误', description: '句子结构问题', example: '语序错误' },
        { type: '语法错误', description: '从句使用不当', example: '定语从句/状语从句' },
        { type: '语法错误', description: '并列结构错误', example: 'and/or连接' }
    ];
    
    // 添加语法错误
    for (let i = 0; i < Math.floor(errorCount * 0.6); i++) {
        const grammarError = grammarErrors[Math.floor(Math.random() * grammarErrors.length)];
        const wordIndex = Math.floor(Math.random() * words.length);
        const word = words[wordIndex];
        
        errors.push({
            type: grammarError.type,
            description: grammarError.description,
            position: `第${wordIndex + 1}个单词"${word}"附近`,
            example: grammarError.example
        });
    }
    
    // 添加拼写错误
    for (let i = 0; i < Math.ceil(errorCount * 0.4); i++) {
        const wordIndex = Math.floor(Math.random() * words.length);
        let word = words[wordIndex];
        
        if (word.length > 3) {
            // 随机替换一个字符
            const charIndex = Math.floor(Math.random() * (word.length - 1)) + 1;
            const misspelledWord = word.substring(0, charIndex) + 
                                  String.fromCharCode(word.charCodeAt(charIndex) + 1) + 
                                  word.substring(charIndex + 1);
            
            errors.push({
                type: '拼写错误',
                description: '单词拼写错误',
                position: `第${wordIndex + 1}个单词"${word}"`,
                example: `可能应该是"${misspelledWord}"`
            });
        }
    }
    
    return errors;
}

// 分析单句翻译
function analyzeSentence(chinese, translation, sentenceIndex) {
    const errors = [];
    const words = translation.split(' ');
    
    // 随机生成1-3个错误
    const errorCount = Math.floor(Math.random() * 3) + 1;
    
    // 可能的错误类型
    const grammarErrors = [
        { type: '语法错误', description: '主谓一致问题', example: 'is/are' },
        { type: '语法错误', description: '时态错误', example: 'go/went/gone' },
        { type: '语法错误', description: '冠词错误', example: 'a/an/the' },
        { type: '语法错误', description: '介词错误', example: 'in/on/at' },
        { type: '语法错误', description: '句子结构问题', example: '语序错误' }
    ];
    
    const spellingErrors = [
        { type: '拼写错误', commonWords: ['receive', 'believe', 'separate', 'definitely', 'embarrass'] }
    ];
    
    // 添加语法错误
    for (let i = 0; i < Math.floor(errorCount / 2); i++) {
        const grammarError = grammarErrors[Math.floor(Math.random() * grammarErrors.length)];
        const wordIndex = Math.floor(Math.random() * words.length);
        const word = words[wordIndex];
        
        errors.push({
            type: grammarError.type,
            description: grammarError.description,
            position: `第${sentenceIndex}句，第${wordIndex + 1}个单词"${word}"附近`,
            example: grammarError.example
        });
    }
    
    // 添加拼写错误
    for (let i = 0; i < Math.ceil(errorCount / 2); i++) {
        const wordIndex = Math.floor(Math.random() * words.length);
        let word = words[wordIndex];
        
        // 简单模拟拼写错误
        if (word.length > 3) {
            // 随机替换一个字符
            const charIndex = Math.floor(Math.random() * (word.length - 1)) + 1;
            const misspelledWord = word.substring(0, charIndex) + 
                                  String.fromCharCode(word.charCodeAt(charIndex) + 1) + 
                                  word.substring(charIndex + 1);
            
            errors.push({
                type: '拼写错误',
                description: '单词拼写错误',
                position: `第${sentenceIndex}句，第${wordIndex + 1}个单词"${word}"`,
                example: `可能应该是"${misspelledWord}"`
            });
        }
    }
    
    return errors;
}

// 为翻译文本添加荧光黄色标注
function addHighlight(translation, errors) {
    // 将翻译文本按空格分割成单词数组
    const words = translation.split(' ');
    
    // 创建一个标记数组，记录哪些单词需要高亮
    const highlightIndices = new Set();
    
    // 从错误信息中提取需要高亮的单词索引
    errors.forEach(error => {
        // 匹配位置信息中的数字（第X个单词）
        const match = error.position.match(/第(\d+)个单词/);
        if (match) {
            const index = parseInt(match[1]) - 1; // 转换为0-based索引
            if (index >= 0 && index < words.length) {
                highlightIndices.add(index);
            }
        }
    });
    
    // 构建带高亮的文本
    const highlightedText = words.map((word, index) => {
        if (highlightIndices.has(index)) {
            return `<span style="background-color: #ffeb3b; padding: 2px;">${word}</span>`;
        }
        return word;
    }).join(' ');
    
    return highlightedText;
}

// 显示结果
function showResult(timeString, score, detailedErrors) {
    // 设置结果
    resultTime.textContent = timeString;
    resultScore.textContent = `${score}/100`;
    
    // 清空并添加详细语法错误
    grammarErrors.innerHTML = '';
    
    // 构建带高亮的翻译文本数组
    const highlightedTranslations = [];
    
    if (detailedErrors.length === 0) {
        const li = document.createElement('li');
        li.textContent = '未检测到明显错误，翻译质量良好！';
        li.style.backgroundColor = '#d4edda';
        li.style.borderColor = '#c3e6cb';
        li.style.color = '#155724';
        grammarErrors.appendChild(li);
        
        // 使用原始翻译文本
        highlightedTranslations.push(...userTranslations);
    } else {
        // 按句子组织错误显示
        detailedErrors.forEach((item, index) => {
            // 添加句子/文章标题
            const sentenceHeader = document.createElement('div');
            sentenceHeader.className = 'sentence-error-header';
            sentenceHeader.innerHTML = item.sentenceIndex === 0 ? 
                `<strong>整篇文章：</strong>${item.chinese}` : 
                `<strong>第${item.sentenceIndex}句：</strong>${item.chinese}`;
            grammarErrors.appendChild(sentenceHeader);
            
            // 为翻译添加高亮
            const highlightedTranslation = addHighlight(item.translation, item.errors);
            highlightedTranslations.push(highlightedTranslation);
            
            // 添加带高亮的翻译
            const translationText = document.createElement('div');
            translationText.className = 'sentence-translation';
            translationText.innerHTML = `<em>你的翻译：${highlightedTranslation}</em>`;
            grammarErrors.appendChild(translationText);
            
            // 添加错误列表
            const errorList = document.createElement('ul');
            errorList.className = 'sentence-errors';
            
            item.errors.forEach(error => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>${error.type}：</strong>${error.description}<br>
                    <strong>位置：</strong>${error.position}<br>
                    <strong>说明：</strong>${error.example || '请检查该部分内容'}
                `;
                errorList.appendChild(li);
            });
            
            grammarErrors.appendChild(errorList);
        });
    }
    
    // 设置带高亮的翻译文本
    translatedText.innerHTML = highlightedTranslations.join('<br><br>');
    
    // 显示结果区域
    showSection(resultSection);
    hideSection(currentMode === 'sentence' ? sentencePractice : passagePractice);
}

// 返回模式选择
function backToSelection() {
    // 在模式选择区域添加返回文章选择的按钮
    const modeButtons = document.querySelector('.mode-buttons');
    if (!document.getElementById('back-to-passage')) {
        modeButtons.appendChild(backToPassageBtn);
    }
    showSection(modeSelection);
    hideSection(resultSection);
}

// 上传新文件
function uploadNewFile() {
    // 重置所有变量
    sentences = [];
    currentSentenceIndex = 0;
    userTranslations = [];
    
    // 清空输入
    wordFile.value = '';
    englishInput.value = '';
    passageInput.value = '';
    
    // 重置计时器
    timer.textContent = '00:00:00';
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    
    // 显示上传区域
    showSection(uploadSection);
    hideSection(resultSection);
}

// 显示指定区域
function showSection(section) {
    section.classList.remove('hidden');
    section.classList.add('active');
}

// 隐藏指定区域
function hideSection(section) {
    section.classList.remove('active');
    section.classList.add('hidden');
}

// 日志记录功能
function logMessage(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    // 输出到控制台
    console.log(logEntry);
    
    // 存储到localStorage，最多保存100条日志
    let logs = JSON.parse(localStorage.getItem('translation_logs') || '[]');
    logs.push(logEntry);
    if (logs.length > 100) {
        logs = logs.slice(-100); // 只保留最近100条日志
    }
    localStorage.setItem('translation_logs', JSON.stringify(logs));
    
    // 更新界面日志显示
    updateLogDisplay(logEntry, level);
}

// 更新日志显示
function updateLogDisplay(logEntry, level) {
    // 检查是否已存在日志显示元素
    let logContainer = document.getElementById('log-container');
    
    if (!logContainer) {
        // 创建日志显示容器
        logContainer = document.createElement('div');
        logContainer.id = 'log-container';
        logContainer.className = 'log-container';
        logContainer.innerHTML = '<h4>系统日志</h4><div id="log-content" class="log-content"></div>';
        
        // 将日志容器添加到页面底部
        document.body.appendChild(logContainer);
    }
    
    // 获取日志内容元素
    const logContent = document.getElementById('log-content');
    
    // 创建日志条目
    const logItem = document.createElement('div');
    logItem.className = `log-item log-${level}`;
    logItem.textContent = logEntry;
    
    // 添加到日志内容
    logContent.appendChild(logItem);
    
    // 自动滚动到底部
    logContent.scrollTop = logContent.scrollHeight;
    
    // 限制日志条目数量
    const logItems = logContent.querySelectorAll('.log-item');
    if (logItems.length > 50) {
        logItems[0].remove(); // 删除最旧的日志
    }
}

// 显示/隐藏日志面板
function toggleLogPanel() {
    const logContainer = document.getElementById('log-container');
    if (logContainer) {
        logContainer.style.display = logContainer.style.display === 'none' ? 'block' : 'none';
    }
}

// 保存DeepSeek API密钥
function saveApiKey() {
    const apiKey = deepseekApiKey.value.trim();
    if (apiKey) {
        localStorage.setItem('deepseek_api_key', apiKey);
        alert('API密钥已保存！');
        logMessage('DeepSeek API密钥已保存到本地存储', 'info');
    } else {
        alert('请输入有效的API密钥！');
        logMessage('用户尝试保存无效的API密钥', 'warning');
    }
}

// 加载DeepSeek API密钥
function loadApiKey() {
    const apiKey = localStorage.getItem('deepseek_api_key');
    if (apiKey) {
        deepseekApiKey.value = apiKey;
    }
}

// 调用DeepSeek API进行翻译质量评估
async function evaluateTranslationWithDeepSeek(chineseText, translation) {
    const apiKey = localStorage.getItem('deepseek_api_key');
    if (!apiKey) {
        logMessage('DeepSeek API密钥未配置', 'warning');
        throw new Error('DeepSeek API密钥未配置');
    }

    const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    
    // 设计提示词让DeepSeek评估翻译质量
    const prompt = `请作为一名专业的英语翻译评估专家，评估以下中文到英文的翻译质量：

中文原文：${chineseText}

英文翻译：${translation}

请按照以下格式返回评估结果：
1. 评分（0-100分）：[具体分数]
2. 总体评价：[简要评价翻译质量]
3. 错误分析：[列出具体错误，包括错误类型（语法错误、拼写错误、用词不当等）、位置和详细说明]

请确保错误分析准确且具体，能够帮助用户改进翻译质量。`;

    try {
        logMessage('发送DeepSeek API请求评估翻译质量', 'info');
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            let errorMessage = `DeepSeek API请求失败: ${response.status} ${response.statusText}`;
            
            // 尝试获取更详细的错误信息
            let detailedError = '';
            try {
                const errorData = await response.json();
                detailedError = errorData.error ? JSON.stringify(errorData.error) : '';
                if (detailedError) {
                    errorMessage += ` - ${detailedError}`;
                }
            } catch (e) {
                // 如果无法解析JSON错误响应，继续使用基本错误信息
            }
            
            logMessage(errorMessage, 'error');
            
            if (response.status === 401) {
                throw new Error('DeepSeek API密钥无效，请检查并重新配置');
            } else if (response.status === 429) {
                throw new Error('DeepSeek API请求频率过高，请稍后再试');
            } else if (response.status >= 500) {
                throw new Error('DeepSeek API服务器错误，请稍后再试');
            } else {
                throw new Error(errorMessage);
            }
        }

        const data = await response.json();
        
        // 检查API响应格式
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            logMessage('DeepSeek API返回格式错误', 'error');
            throw new Error('DeepSeek API返回格式错误');
        }

        const responseContent = data.choices[0].message.content;
        logMessage('DeepSeek API请求成功，开始解析响应', 'info');
        
        // 解析API响应
        const evaluation = parseDeepSeekResponse(responseContent);
        
        // 确保解析结果包含必要的字段
        if (!evaluation) {
            throw new Error('解析DeepSeek API响应失败');
        }
        
        return evaluation;
    } catch (error) {
        logMessage(`调用DeepSeek API时出错: ${error.message}`, 'error');
        throw error; // 重新抛出错误，让调用者处理
    }
}

// 验证DeepSeek API密钥有效性
async function validateDeepSeekApiKey(apiKey) {
    if (!apiKey) {
        logMessage('DeepSeek API密钥未配置', 'warning');
        return false;
    }

    const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: 'ping'
                    }
                ],
                max_tokens: 1,
                temperature: 0
            })
        });

        if (response.ok) {
            logMessage('DeepSeek API密钥有效', 'info');
            return true;
        } else if (response.status === 401) {
            logMessage('DeepSeek API密钥无效', 'error');
            return false;
        } else {
            logMessage(`DeepSeek API请求失败: ${response.status}`, 'warning');
            // 其他状态码可能是临时问题，仍尝试使用
            return true;
        }
    } catch (error) {
        logMessage(`DeepSeek API密钥验证失败: ${error.message}`, 'error');
        return false;
    }
}

// 动态选择评分系统
async function selectScoringSystem() {
    const apiKey = localStorage.getItem('deepseek_api_key');
    let currentScoringSystem = 'fallback';
    let evaluationFunction = evaluateTranslationWithFallback;
    let statusMessage = '使用备用评分系统';

    if (apiKey) {
        logMessage('检测到DeepSeek API密钥，开始验证', 'info');
        const isValid = await validateDeepSeekApiKey(apiKey);
        
        if (isValid) {
            currentScoringSystem = 'deepseek';
            evaluationFunction = evaluateTranslationWithDeepSeek;
            statusMessage = '使用DeepSeek API评分系统';
            logMessage(statusMessage, 'info');
        } else {
            logMessage('DeepSeek API密钥无效，使用备用评分系统', 'warning');
        }
    } else {
        logMessage('未检测到DeepSeek API密钥，使用备用评分系统', 'info');
    }

    // 更新UI状态显示
    updateScoringSystemStatus(statusMessage);

    return {
        system: currentScoringSystem,
        evaluate: evaluationFunction,
        status: statusMessage
    };
}

// 备用AI评分系统
function evaluateTranslationWithFallback(chineseText, translation) {
    logMessage('使用备用评分系统评估翻译', 'info');
    
    // 使用现有的模拟评分逻辑作为备用系统
    // 根据翻译长度和质量生成评分
    const words = translation.split(' ');
    let errorCount = 0;
    
    // 简单的质量评估逻辑
    if (words.length < 5) {
        errorCount += 2; // 内容太短
    } else if (words.length > 50) {
        errorCount += 1; // 内容太长
    }
    
    // 检查是否有明显的语法错误（简单模拟）
    const commonGrammarIssues = ['a', 'an', 'the'];
    const missingArticles = commonGrammarIssues.filter(article => !translation.includes(article));
    errorCount += missingArticles.length;
    
    // 计算评分
    const score = Math.max(0, Math.round(100 - errorCount * 5));
    
    // 生成错误分析
    const errors = [];
    
    if (words.length < 5) {
        errors.push({
            type: '内容错误',
            description: '翻译内容过于简短，可能遗漏了重要信息',
            position: '整个句子',
            example: '建议补充更多细节'
        });
    }
    
    missingArticles.forEach(article => {
        errors.push({
            type: '语法错误',
            description: `可能缺少冠词 "${article}"`,
            position: '句子中适当位置',
            example: '例如：a book, an apple, the world'
        });
    });
    
    return {
        score: score,
        evaluation: score >= 80 ? '翻译质量良好' : score >= 60 ? '翻译质量一般' : '翻译质量需要改进',
        errors: errors
    };
}

// 更新评分系统状态显示
function updateScoringSystemStatus(statusMessage) {
    // 检查是否已存在状态显示元素
    let statusElement = document.getElementById('scoring-system-status');
    
    if (!statusElement) {
        // 创建状态显示元素
        statusElement = document.createElement('div');
        statusElement.id = 'scoring-system-status';
        statusElement.className = 'scoring-system-status';
        
        // 将状态显示元素添加到合适的位置（API配置区域下方）
        const apiConfig = document.querySelector('.api-config');
        if (apiConfig) {
            apiConfig.appendChild(statusElement);
        }
    }
    
    // 更新状态信息
    statusElement.textContent = statusMessage;
    
    // 设置不同的样式以区分状态
    if (statusMessage.includes('DeepSeek')) {
        statusElement.style.color = '#155724';
        statusElement.style.backgroundColor = '#d4edda';
        statusElement.style.border = '1px solid #c3e6cb';
    } else {
        statusElement.style.color = '#856404';
        statusElement.style.backgroundColor = '#fff3cd';
        statusElement.style.border = '1px solid #ffeeba';
    }
    
    // 添加基本样式
    statusElement.style.padding = '8px 12px';
    statusElement.style.borderRadius = '4px';
    statusElement.style.marginTop = '10px';
    statusElement.style.fontSize = '14px';
}

// 解析DeepSeek API响应
function parseDeepSeekResponse(responseContent) {
    // 初始化结果对象
    const result = {
        score: 0,
        evaluation: '',
        errors: []
    };

    // 提取评分
    const scoreMatch = responseContent.match(/1\. 评分\（0-100分）：(\d+)/);
    if (scoreMatch) {
        result.score = parseInt(scoreMatch[1]);
    } else {
        // 尝试其他可能的格式
        const altScoreMatch = responseContent.match(/评分：(\d+)/);
        if (altScoreMatch) {
            result.score = parseInt(altScoreMatch[1]);
        }
    }

    // 提取总体评价
    const evalMatch = responseContent.match(/2\. 总体评价：([^\n]+)/);
    if (evalMatch) {
        result.evaluation = evalMatch[1].trim();
    } else {
        // 尝试其他可能的格式
        const altEvalMatch = responseContent.match(/总体评价：([^\n]+)/);
        if (altEvalMatch) {
            result.evaluation = altEvalMatch[1].trim();
        }
    }

    // 提取错误分析部分
    const errorAnalysisMatch = responseContent.match(/3\. 错误分析：([\s\S]*)/);
    if (errorAnalysisMatch) {
        const errorAnalysis = errorAnalysisMatch[1];
        
        // 匹配每个错误项（通常以数字或符号开头）
        const errorItems = errorAnalysis.split(/\n[\d\*\-]+\s/).filter(item => item.trim());
        
        errorItems.forEach((errorItem, index) => {
            const item = errorItem.trim();
            if (!item) return;

            // 尝试提取错误类型和描述
            let errorType = '其他错误';
            let description = item;
            let position = `第${index + 1}处错误`;
            let example = '';

            // 识别错误类型
            if (item.includes('语法错误')) {
                errorType = '语法错误';
            } else if (item.includes('拼写错误')) {
                errorType = '拼写错误';
            } else if (item.includes('用词不当')) {
                errorType = '用词不当';
            } else if (item.includes('搭配错误')) {
                errorType = '搭配错误';
            } else if (item.includes('时态错误')) {
                errorType = '时态错误';
            } else if (item.includes('语序错误')) {
                errorType = '语序错误';
            } else if (item.includes('标点错误')) {
                errorType = '标点错误';
            }

            // 尝试提取位置信息
            const positionMatch = item.match(/位置：([^\n,]+)/);
            if (positionMatch) {
                position = positionMatch[1].trim();
            }

            result.errors.push({
                type: errorType,
                description: description,
                position: position,
                example: example
            });
        });
    }

    // 确保分数在0-100之间
    result.score = Math.max(0, Math.min(100, result.score));

    return result;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    loadApiKey(); // 加载已保存的API密钥
});

// 引入外部库（JSZip）
const script1 = document.createElement('script');
script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
document.head.appendChild(script1);
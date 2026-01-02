class EnhancedTranslationDictionary {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 200;
        this.translationApiUrl = 'https://api.mymemory.translated.net/get';
        this.dictionaryApiUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en';
    }

    async getChineseDefinition(word) {
        const cacheKey = word.toLowerCase();
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const isPhrase = this.isPhrase(word.trim());
        let result;

        if (isPhrase) {
            result = await this.getPhraseDefinition(word);
        } else {
            result = await this.getSingleWordDefinition(word);
        }

        this.addToCache(cacheKey, result);
        return result;
    }

    isPhrase(text) {
        const words = text.trim().split(' ');
        return words.length > 1 || text.includes('-');
    }

    async getSingleWordDefinition(word) {
        try {
            const [dictionaryData, translation] = await Promise.all([
                this.fetchDictionaryData(word),
                this.translate(word, 'en', 'zh')
            ]);

            return {
                word: word,
                phonetic: this.extractPhonetic(dictionaryData),
                meanings: this.extractMeanings(dictionaryData, translation),
                examples: this.extractExamples(dictionaryData, translation),
                usage: this.extractUsage(dictionaryData),
                source: 'enhanced'
            };
        } catch (error) {
            console.error('获取单词定义失败:', error);
            return this.getFallbackDefinition(word);
        }
    }

    async getPhraseDefinition(phrase) {
        try {
            const translation = await this.translate(phrase, 'en', 'zh');

            return {
                word: phrase,
                phonetic: '',
                meanings: [{
                    partOfSpeech: '短语',
                    definition: phrase,
                    chinese: translation,
                    context: '常用表达',
                    definitions: [{ chinese: translation, definition: phrase }]
                }],
                examples: this.generatePhraseExamples(phrase, translation),
                usage: {
                    type: 'phrase',
                    commonUsage: '常用短语表达'
                },
                source: 'enhanced'
            };
        } catch (error) {
            console.error('获取短语定义失败:', error);
            throw error;
        }
    }

    async fetchDictionaryData(word) {
        try {
            const url = `${this.dictionaryApiUrl}/${encodeURIComponent(word)}`;
            console.log('词典API请求:', url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`词典API请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('词典API响应:', data);
            
            return data;
        } catch (error) {
            console.error('词典API调用失败:', error);
            return null;
        }
    }

    extractPhonetic(dictionaryData) {
        if (!dictionaryData || !dictionaryData[0]) {
            return '';
        }

        const phonetics = dictionaryData[0].phonetics || [];
        const phoneticWithText = phonetics.find(p => p.text);
        
        return phoneticWithText ? phoneticWithText.text : '';
    }

    extractMeanings(dictionaryData, translation) {
        if (!dictionaryData || !dictionaryData[0]) {
            return [{
                partOfSpeech: '释义',
                definition: dictionaryData ? dictionaryData[0].word : '',
                chinese: translation,
                context: '通用语境',
                definitions: [{ chinese: translation, definition: dictionaryData ? dictionaryData[0].word : '' }]
            }];
        }

        const meanings = dictionaryData[0].meanings || [];
        
        return meanings.map(meaning => {
            const definitions = meaning.definitions || [];
            const primaryDefinition = definitions[0] || {};
            
            return {
                partOfSpeech: this.translatePartOfSpeech(meaning.partOfSpeech),
                definition: primaryDefinition.definition || '',
                chinese: translation,
                context: this.getContextFromDefinition(primaryDefinition.definition),
                definitions: definitions.slice(0, 3).map(def => ({
                    chinese: translation,
                    definition: def.definition || ''
                }))
            };
        }).slice(0, 3);
    }

    extractExamples(dictionaryData, translation) {
        if (!dictionaryData || !dictionaryData[0]) {
            return [];
        }

        const meanings = dictionaryData[0].meanings || [];
        const examples = [];

        for (const meaning of meanings) {
            const definitions = meaning.definitions || [];
            for (const definition of definitions) {
                if (definition.example) {
                    examples.push({
                        english: definition.example,
                        chinese: translation,
                        context: meaning.partOfSpeech || '通用',
                        usage: '真实例句'
                    });
                    
                    if (examples.length >= 5) {
                        break;
                    }
                }
            }
            
            if (examples.length >= 5) {
                break;
            }
        }

        return examples;
    }

    extractUsage(dictionaryData) {
        if (!dictionaryData || !dictionaryData[0]) {
            return {
                frequency: '未知',
                register: '中性'
            };
        }

        const meanings = dictionaryData[0].meanings || [];
        const partOfSpeechCount = meanings.length;
        
        return {
            frequency: partOfSpeechCount > 2 ? '常用' : '一般',
            register: '中性',
            partOfSpeechCount: partOfSpeechCount
        };
    }

    translatePartOfSpeech(partOfSpeech) {
        const translations = {
            'noun': '名词',
            'verb': '动词',
            'adjective': '形容词',
            'adverb': '副词',
            'pronoun': '代词',
            'preposition': '介词',
            'conjunction': '连词',
            'interjection': '感叹词',
            'unknown': '未知'
        };
        
        return translations[partOfSpeech?.toLowerCase()] || partOfSpeech || '未知';
    }

    getContextFromDefinition(definition) {
        if (!definition) {
            return '通用语境';
        }

        const lowerDef = definition.toLowerCase();
        
        if (lowerDef.includes('formal') || lowerDef.includes('official')) {
            return '正式语境';
        } else if (lowerDef.includes('informal') || lowerDef.includes('casual')) {
            return '非正式语境';
        } else if (lowerDef.includes('technical') || lowerDef.includes('scientific')) {
            return '技术语境';
        } else if (lowerDef.includes('literary') || lowerDef.includes('poetic')) {
            return '文学语境';
        } else {
            return '通用语境';
        }
    }

    async translate(text, source, target) {
        try {
            const langpair = source === 'auto' ? `autodetect|${target}` : `${source}|${target}`;
            const url = `${this.translationApiUrl}?q=${encodeURIComponent(text)}&langpair=${langpair}`;
            
            console.log('翻译请求:', { text, source, target, langpair });
            
            const response = await fetch(url);
            const data = await response.json();
            
            console.log('翻译响应:', data);
            
            if (data.responseStatus === 200 && data.responseData) {
                return data.responseData.translatedText;
            } else {
                throw new Error(data.responseDetails || '翻译失败');
            }
        } catch (error) {
            console.error('翻译失败:', error);
            throw error;
        }
    }

    generatePhraseExamples(phrase, translation) {
        const examples = [
            {
                english: `Let me ${phrase} for you.`,
                chinese: `让我为你${translation}。`,
                context: '日常交流',
                usage: '提供帮助时使用'
            },
            {
                english: `We should ${phrase} before making a decision.`,
                chinese: `在做决定之前我们应该${translation}。`,
                context: '正式讨论',
                usage: '建议或提议时使用'
            },
            {
                english: `It's important to ${phrase} in this situation.`,
                chinese: `在这种情况下${translation}很重要。`,
                context: '建议/指导',
                usage: '强调重要性时使用'
            }
        ];

        return examples.slice(0, 3);
    }

    getFallbackDefinition(word) {
        return {
            word: word,
            phonetic: '',
            meanings: [{
                partOfSpeech: '释义',
                definition: word,
                chinese: word,
                context: '通用语境',
                definitions: [{ chinese: word, definition: word }]
            }],
            examples: [],
            usage: {
                frequency: '未知',
                register: '中性'
            },
            source: 'fallback'
        };
    }

    addToCache(word, data) {
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(word, data);
    }

    getFromCache(word) {
        return this.cache.get(word);
    }

    clearCache() {
        this.cache.clear();
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize
        };
    }
}

window.translationDictionary = new EnhancedTranslationDictionary();

class MyMemoryTranslationDictionary {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 200;
        this.apiBaseUrl = 'https://api.mymemory.translated.net/get';
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
        const translation = await this.translate(word, 'en', 'zh');

        return {
            word: word,
            phonetic: '',
            meanings: [{
                partOfSpeech: '释义',
                definition: word,
                chinese: translation,
                context: '通用语境',
                definitions: [{ chinese: translation, definition: word }]
            }],
            examples: this.generateExamples(word, translation),
            usage: {
                frequency: '常用',
                register: '中性'
            },
            source: 'mymemory'
        };
    }

    async getPhraseDefinition(phrase) {
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
            source: 'mymemory'
        };
    }

    async translate(text, source, target) {
        try {
            const langpair = source === 'auto' ? `autodetect|${target}` : `${source}|${target}`;
            const url = `${this.apiBaseUrl}?q=${encodeURIComponent(text)}&langpair=${langpair}`;
            
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

    generateExamples(word, chineseTranslation) {
        const examples = [
            {
                english: `The ${word} is very important.`,
                chinese: `${chineseTranslation}非常重要。`,
                context: '通用语境',
                usage: '基础表达'
            },
            {
                english: `I need to learn more about ${word}.`,
                chinese: `我需要更多地了解${chineseTranslation}。`,
                context: '学习语境',
                usage: '学习交流'
            },
            {
                english: `Can you explain what ${word} means?`,
                chinese: `你能解释一下${chineseTranslation}是什么意思吗？`,
                context: '疑问语境',
                usage: '请求解释'
            }
        ];

        return examples.slice(0, 3);
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

window.translationDictionary = new MyMemoryTranslationDictionary();

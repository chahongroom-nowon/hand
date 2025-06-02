/**
 * 공통 기능을 제공하는 observer 모듈
 */

export class FrameObserver {
    constructor(options = {}) {
        this.frameName = options.frameName || 'mainFrame';
        this.processInterval = options.processInterval || 1000;
        this.debounceDelay = options.debounceDelay || 500;
        this.observer = null;
        this.mutationTimeout = null;
        this.lastProcessTime = 0;
        this.onProcess = options.onProcess || (() => {});
    }

    /**
     * 특정 요소가 DOM에 나타날 때까지 대기
     * @param {Document} doc - document 객체
     * @param {string} selector - 찾을 요소의 CSS 선택자
     * @param {number} timeout - 최대 대기 시간(ms)
     * @returns {Promise<Element>}
     */
    async waitForElement(doc, selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            function check() {
                const el = doc.querySelector(selector);
                if (el) {
                    resolve(el);
                    return;
                }
                if (Date.now() - start >= timeout) {
                    reject(new Error(`요소(${selector})를 ${timeout}ms 내에 찾지 못했습니다.`));
                    return;
                }
                setTimeout(check, 100);
            }
            check();
        });
    }

    /**
     * DOM 변경 감지 시 처리 (디바운싱 적용)
     */
    processMutations() {
        if (this.mutationTimeout) clearTimeout(this.mutationTimeout);
        this.mutationTimeout = setTimeout(() => {
            const now = Date.now();
            if (now - this.lastProcessTime >= this.processInterval) {
                try {
                    const frame = document.querySelector(`frame[name="${this.frameName}"], frame#${this.frameName}`);
                    if (frame && (frame.contentDocument || frame.contentWindow.document)) {
                        this.onProcess(frame.contentDocument || frame.contentWindow.document);
                        this.lastProcessTime = now;
                    }
                } catch (err) {
                    console.error("❌ process() 실행 중 오류:", err);
                }
            }
        }, this.debounceDelay);
    }

    /**
     * iframe 내부 문서에 MutationObserver 등록
     */
    initializeObserver() {
        const frame = document.querySelector(`frame[name="${this.frameName}"], frame#${this.frameName}`);
        if (frame && frame.contentDocument && frame.contentDocument.body) {
            if (this.observer) this.observer.disconnect();

            this.observer = new MutationObserver(() => this.processMutations());
            this.observer.observe(frame.contentDocument.body, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true
            });

            this.onProcess(frame.contentDocument);
        } else {
            console.warn('⚠️ iframe 내부 문서 또는 body에 접근할 수 없습니다.');
        }
    }

    /**
     * Observer 초기화 및 시작
     */
    start() {
        const frame = document.querySelector(`frame[name="${this.frameName}"], frame#${this.frameName}`);
        if (frame) {
            frame.addEventListener('load', () => this.initializeObserver());

            if (frame.contentDocument?.readyState === 'complete') {
                this.initializeObserver();
            }
        } else {
            console.error(`❌ ${this.frameName} 요소를 찾을 수 없습니다.`);
        }

        if (document.readyState === 'complete') {
            this.initializeObserver();
        } else {
            window.addEventListener('load', () => {
                const frame = document.querySelector(`frame[name="${this.frameName}"], frame#${this.frameName}`);
                if (frame?.contentDocument?.readyState === 'complete') {
                    this.initializeObserver();
                } else {
                    setTimeout(() => this.initializeObserver(), 500);
                }
            });
        }
    }

    /**
     * Observer 중지
     */
    stop() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        if (this.mutationTimeout) {
            clearTimeout(this.mutationTimeout);
            this.mutationTimeout = null;
        }
    }
} 
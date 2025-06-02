import { FrameObserver } from '../common/observer.js';

export class CModeCard {
    constructor() {
        // 설정값
        this.CARD_BTN_SELECTOR = 'input#strCardComp';
        this.CARD_BTN_TEXT = 'C모드 카드결제';
        this.CARD_BTN_TOOLTIP = 'C모드 할인 카드결제';
        this.CARD_PRICE = '33000';
        this.MEMO_CODE = '7468';

        this.observer = new FrameObserver({
            frameName: 'mainFrame',
            onProcess: (frameDoc) => this.processFrame(frameDoc)
        });
    }

    /**
     * iframe 내부 요소를 가공 및 이벤트 바인딩
     * @param {Document} frameDoc
     */
    async processFrame(frameDoc) {
        if (!frameDoc) {
            console.warn('❌ iframe 문서에 접근할 수 없습니다.');
            return;
        }

        // 카드 결제 버튼 처리
        const cardBtn = frameDoc.querySelector(this.CARD_BTN_SELECTOR);
        if (cardBtn && !cardBtn.dataset.cmodeProcessed) {
            // 기존 onclick 제거 및 텍스트/툴팁 변경
            cardBtn.removeAttribute('onclick');
            cardBtn.setAttribute('tip-data', this.CARD_BTN_TOOLTIP);
            cardBtn.value = this.CARD_BTN_TEXT;

            // 버튼 클릭 시 자동 처리
            cardBtn.addEventListener('click', () => this.handleButtonClick(frameDoc));
            cardBtn.dataset.cmodeProcessed = 'true';
        }

        // kerkerLayer id 제거 (중복 방지용)
        const kerkerLayer = frameDoc.querySelector('div#kerkerLayer');
        if (kerkerLayer) {
            kerkerLayer.removeAttribute('id');
        }
    }

    /**
     * 버튼 클릭 이벤트 처리
     */
    async handleButtonClick(frameDoc) {
        try {
            // 1. 첫 번째 td.tal.tind 클릭 (카테고리 선택)
            const talTind = await this.observer.waitForElement(frameDoc, 'td.tal.tind');
            talTind.click();

            // 2. 두 번째 td.m3[onclick*="pkDisEvent_Change"] 클릭 (할인 선택)
            const m3Tds = frameDoc.querySelectorAll('td.m3[onclick*="pkDisEvent_Change"]');
            if (m3Tds.length >= 2) {
                const secondM3Td = m3Tds[1];
                secondM3Td.click();

                // 3. 가격 입력 및 이벤트 트리거
                const priceInput = frameDoc.querySelector('input#nGoodsPrice_Sum');
                if (priceInput) {
                    priceInput.value = this.CARD_PRICE;
                    priceInput.dispatchEvent(new Event('keyup'));

                    // 4. 메모 선택 및 이벤트 트리거
                    const memoSelect = frameDoc.querySelector('select#pkSaleMemo');
                    if (memoSelect) {
                        memoSelect.value = this.MEMO_CODE;
                        memoSelect.dispatchEvent(new Event('change'));
                    } else {
                        console.warn('⚠️ 메모 선택 필드를 찾을 수 없습니다.');
                    }
                } else {
                    console.warn('⚠️ 가격 입력 필드를 찾을 수 없습니다.');
                }
            } else {
                console.warn('⚠️ 두 번째 m3 td 요소를 찾을 수 없습니다.');
            }
        } catch (err) {
            console.error('❌ 요소 처리 중 오류:', err);
        }
    }

    /**
     * 기능 시작
     */
    start() {
        this.observer.start();
    }

    /**
     * 기능 중지
     */
    stop() {
        this.observer.stop();
    }
} 
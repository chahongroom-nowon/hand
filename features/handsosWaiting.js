import { FrameObserver } from '../common/observer.js';

export class HandsosWaiting {
    constructor() {
        this.waitingNames = [
            "재희W", "광숙W", "지후W", 
            "윤진W", "정현W", "소연W",
            "희선W", "희진W", "소이W", 
            "재열W", "예나W"
        ];

        this.observer = new FrameObserver({
            frameName: 'mainFrame',
            onProcess: (frameDoc) => this.processFrame(frameDoc)
        });
    }

    /**
     * 대기 버튼 HTML 템플릿 생성
     */
    getWaitingButtonsHTML() {
        return `
            <ul style="margin:0; padding:0;">
            ${this.waitingNames.reduce((html, name, idx) => {
                if (idx % 3 === 0) {
                    html += '<li style="display:block; margin:4px 0;">';
                }
                html += `
                    <span class="nBtn line jwaiting"
                        style="cursor:pointer; display:inline-block; padding:2px 8px; border:1px solid #ccc; border-radius:3px; margin-right:4px;">
                        ${name}
                    </span>
                `;
                if (idx % 3 === 2 || idx === this.waitingNames.length - 1) {
                    html += '</li>';
                }
                return html;
            }, '')}
            </ul>
        `;
    }

    /**
     * iframe 내부에 대기 버튼을 추가하고 이벤트를 바인딩
     * @param {Document} frameDoc
     */
    async processFrame(frameDoc) {
        if (!frameDoc) {
            console.warn('❌ iframe 내부 문서 접근 불가');
            return;
        }

        const cashReceiptLayer = frameDoc.querySelector('div#cashReceiptLayer');
        if (!cashReceiptLayer) {
            console.log('❌ cashReceiptLayer를 찾을 수 없습니다.');
            return;
        }

        const parentElement = cashReceiptLayer.parentElement;
        if (!parentElement) {
            console.log('❌ cashReceiptLayer의 부모 요소를 찾을 수 없습니다.');
            return;
        }

        const targetTable = Array.from(parentElement.children).find(
            el => el.tagName === 'TABLE' && el !== cashReceiptLayer
        );
        if (!targetTable) {
            console.log('❌ cashReceiptLayer의 형제 테이블을 찾을 수 없습니다.');
            return;
        }

        if (targetTable.dataset.buttonsAdded === 'true') {
            return;
        }

        targetTable.insertAdjacentHTML('beforeend', this.getWaitingButtonsHTML());
        targetTable.dataset.buttonsAdded = 'true';

        const buttons = frameDoc.querySelectorAll('.nBtn.line.jwaiting');
        buttons.forEach(button => {
            if (button.dataset.waitingProcessed === 'true') return;
            button.dataset.waitingProcessed = 'true';

            button.addEventListener('click', (e) => this.handleButtonClick(e, button, frameDoc));
        });
    }

    /**
     * 버튼 클릭 이벤트 처리
     */
    async handleButtonClick(e, button, frameDoc) {
        e.preventDefault();
        const btnText = button.innerText.trim();

        try {
            // 1. 카테고리 선택 td 클릭
            const categoryTd = await this.observer.waitForElement(
                frameDoc,
                'td.tal.tind[onclick="linkSelectCateg_Change(this);"]'
            );
            categoryTd.click();

            // 2. "시술전" td 클릭
            const targetTd = await this.observer.waitForElement(
                frameDoc,
                'td[onclick*="categChange"][onclick*="시술전"]'
            );
            targetTd.click();

            // 3. "시술중" td 클릭
            const m2Td = await this.observer.waitForElement(
                frameDoc,
                'td.m2[id*="시술중"]'
            );
            m2Td.click();

            // 4. 메모 textarea에 텍스트 추가
            const textarea = frameDoc.getElementById('strMemo');
            if (textarea) {
                textarea.value = textarea.value + `\n\n1.\n2.${btnText}\n3.\n4.`;
            } else {
                console.error('❌ textarea#strMemo를 찾을 수 없습니다.');
            }
        } catch (err) {
            console.error('❌ 작업 처리 중 오류:', err);
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
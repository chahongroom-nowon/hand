import { FrameObserver } from '../common/observer.js';

export class NaverMenu {
    constructor() {
        // 시술 코드 우선순위와 한글-코드 매핑 정의
        this.keywordPriority = ["R1", "P", "CL", "TM", "D", "C", "컨설팅"];
        this.keywordMap = {
            "컷": "C",
            "펌": "P",
            "컬러": "CL",
            "클리닉": "TM",
            "드라이": "D",
            "R1": "R1",
            "부분펌": "P",
            "컨설팅": "컨설팅"
        };

        this.observer = new FrameObserver({
            frameName: 'mainFrame',
            onProcess: (frameDoc) => this.processFrame(frameDoc)
        });
    }

    /**
     * textarea value 변경 감지를 위한 polling (문서별로 1회만 실행)
     * @param {Document} frameDoc - iframe 내부 document 객체
     */
    startTextareaPolling(frameDoc) {
        // 이미 polling이 시작된 경우 중복 실행 방지
        if (frameDoc._textareaPollingId) return;

        // 문서별로 processedElements(이미 처리한 textarea id) 관리
        if (!frameDoc._processedElements) frameDoc._processedElements = new Set();

        // 1초마다 textarea value 변화를 감지하여 processedElements를 갱신
        frameDoc._textareaPollingId = setInterval(() => {
            const textareas = frameDoc.querySelectorAll('textarea[id^="strMemo_"]');
            textareas.forEach(textarea => {
                const idMatch = textarea.id.match(/strMemo_(\d+)/);
                if (!idMatch) return;
                const number = idMatch[1];
                const processedElements = frameDoc._processedElements;
                // 이전 값과 다르면 processedElements에서 제거(재처리 가능하게)
                if (processedElements.has(number)) {
                    const prevValue = textarea.dataset.prevValue || "";
                    if (prevValue !== textarea.value) {
                        processedElements.delete(number);
                    }
                }
                // 현재 값을 저장
                textarea.dataset.prevValue = textarea.value;
            });
        }, 1000);
    }

    /**
     * iframe 내부의 주요 처리 함수
     * - 예약시술메뉴에서 시술코드 추출 및 표시
     * - 요청사항이 있으면 타이틀 강조
     * - rDetail/rInner 강조
     */
    processFrame(frameDoc) {
        if (!frameDoc) {
            console.warn('⚠️ iframe 또는 내부 문서가 없습니다.');
            return;
        }

        // textarea polling(변경 감지) 시작 (중복 방지)
        this.startTextareaPolling(frameDoc);
        // 문서별 processedElements 사용
        const processedElements = frameDoc._processedElements;

        // strMemo_로 시작하는 textarea 처리
        try {
            const textareas = frameDoc.querySelectorAll('textarea[id^="strMemo_"]');
            textareas.forEach(textarea => {
                // textarea의 id에서 숫자 추출 (예: strMemo_123 → 123)
                const idMatch = textarea.id.match(/strMemo_(\d+)/);
                if (!idMatch) return;
                const number = idMatch[1];

                // 이미 처리한 textarea는 건너뜀
                if (processedElements.has(number)) return;

                const memoText = textarea.value;
                // 예약시술메뉴: ~ 2024년 ... 형식에서 시술명 추출
                const serviceMenuMatch = memoText.match(/예약시술메뉴\s*:\s*(.*?)\s*2024년/);
                if (!serviceMenuMatch) return;

                const serviceText = serviceMenuMatch[1];
                // 시술명에 포함된 코드 추출
                const foundCodes = Object.entries(this.keywordMap)
                    .filter(([keyword]) => serviceText.includes(keyword))
                    .map(([, code]) => code);

                if (foundCodes.length === 0) return;

                // 우선순위에 따라 최종 코드 선택
                const selectedCode = this.keywordPriority.find(pri => foundCodes.includes(pri));
                if (!selectedCode) return;

                // 해당 이벤트 id의 시술코드 표시 span 찾기
                const target = frameDoc.querySelector(`div[event_id="${number}"] div.dhx_body a.regLink span.menuType span`);
                if (target && target.textContent !== selectedCode) {
                    target.textContent = selectedCode;
                }

                // 요청사항이 있으면 타이틀 강조
                if (memoText.includes('요청사항:')) {
                    const targetTitleDiv = frameDoc.querySelector(`div[event_id="${number}"] div.dhx_event_move.dhx_title`);
                    if (targetTitleDiv) {
                        targetTitleDiv.textContent = "요청사항 확인";
                        targetTitleDiv.style.background = "#546679";
                        targetTitleDiv.style.color = "#ffffff";
                        targetTitleDiv.style.fontWeight = "bold";
                    }
                }

                // 처리 완료 표시 (중복 처리 방지)
                processedElements.add(number);
                textarea.dataset.prevValue = textarea.value;
            });
        } catch (err) {
            console.error("❌ strMemo_ 처리 중 오류:", err);
        }

        // rDetail 및 rInner 강조 처리
        try {
            const rDetails = frameDoc.querySelectorAll('div.rDetail');
            rDetails.forEach(rDetail => {
                const nrRMemo = rDetail.querySelector('div > dl > dd:last-child > div.nrRMemo');
                if (!nrRMemo) return;

                const rInner = rDetail.parentElement.querySelector('div.rInner');
                if (!rInner) return;

                if (nrRMemo.textContent.includes('요청사항:')) {
                    rInner.style.boxShadow = 'inset 0 0 0 2px red';
                }
            });
        } catch (err) {
            console.error("❌ rDetail 처리 중 오류:", err);
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
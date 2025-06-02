import { FrameObserver } from '../common/observer.js';

export class ConsultingGo {
    constructor() {
        this.observer = new FrameObserver({
            frameName: 'mainFrame',
            onProcess: (frameDoc) => this.processFrame(frameDoc)
        });
    }

    /**
     * iframe 내부의 링크 및 UI를 가공
     * - "설문조사" 링크를 "컨설팅지오"로 변경
     * - "손님영업", "방문기록지" 링크 숨김
     * @param {Document} frameDoc - iframe의 document 객체
     */
    processFrame(frameDoc) {
        if (!frameDoc) {
            console.error('❌ iframe 문서 객체 접근 실패');
            return;
        }

        // "설문조사" 링크를 "컨설팅지오"로 변경 및 클릭 이벤트 연결
        const links = frameDoc.querySelectorAll('a');
        links.forEach(link => {
            // "설문"이 포함된 링크만 처리 (중복 방지)
            if (link.textContent.includes('설문') && !link.dataset.modified) {
                // 링크 텍스트와 스타일 변경
                link.innerHTML = '<span class="tcGreen" style="font-size:11px;">컨설팅</span>지오';
                link.setAttribute('tip-data', '메모에 컨설팅지오 기입');
                link.dataset.modified = "true";
                // 클릭 시 textarea에 "컨설팅지오" 추가 및 수정 버튼 클릭
                link.addEventListener('click', this.handleConsultingGeoClick(frameDoc));
            }
        });

        // 특정 텍스트를 포함한 링크 숨기기
        this.hideLinkByText(frameDoc, '손님영업', '손님영업');
        this.hideLinkByText(frameDoc, '방문기록지', '방문기록지');
    }

    /**
     * 특정 텍스트를 포함한 링크를 숨김
     * @param {Document} doc - iframe 내부 document 객체
     * @param {string} text - 숨길 링크의 텍스트
     * @param {string} label - 로그에 표시할 이름
     */
    hideLinkByText(doc, text, label) {
        const links = doc.querySelectorAll('a');
        links.forEach(link => {
            if (link.textContent.includes(text) && !link.dataset.hidden) {
                link.style.setProperty('display', 'none', 'important');
                link.dataset.hidden = "true";
            }
        });
    }

    /**
     * "컨설팅지오" 링크 클릭 시 동작
     * - textarea에 "컨설팅지오"를 추가하고, 수정 버튼을 클릭
     * @param {Document} frameDoc
     * @returns {Function}
     */
    handleConsultingGeoClick(frameDoc) {
        return (e) => {
            e.preventDefault();

            // textarea에 "컨설팅지오" 추가
            const memoTextarea = frameDoc.querySelector('#pkCustomer_Memo');
            if (memoTextarea) {
                // 이미 "컨설팅지오"가 맨 앞에 있지 않으면 추가
                if (!memoTextarea.value.startsWith('컨설팅지오\n')) {
                    memoTextarea.value = '컨설팅지오\n' + memoTextarea.value;
                }
                // 수정 버튼 클릭 (메모 저장)
                const editBtn = frameDoc.querySelector('a[onclick="jsCustomerMemoUpdateHide();"]');
                if (editBtn) {
                    editBtn.click();
                }
            }
        };
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
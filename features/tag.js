import { FrameObserver } from '../common/observer.js';

export class Tag {
    constructor() {
        this.observer = new FrameObserver({
            frameName: 'mainFrame',
            onProcess: (frameDoc) => this.processFrame(frameDoc)
        });
    }

    /**
     * iframe 내부의 예약 이벤트(div[event_id])를 순회하며 태그를 관리
     * @param {Document} frameDoc - iframe 내부의 document 객체
     */
    processFrame(frameDoc) {
        if (!frameDoc) {
            console.warn('❌ iframe 내부 문서 접근 불가');
            return;
        }

        // 예약 이벤트를 나타내는 div[event_id] 모두 선택
        const eventDivs = frameDoc.querySelectorAll('div[event_id]');
        if (!eventDivs.length) {
            console.log('ℹ️ event_id를 가진 div 없음');
            return;
        }

        eventDivs.forEach(div => {
            const eventId = div.getAttribute('event_id');
            const body = div.querySelector('div.dhx_body');
            const regCust = body?.querySelector('a.regCust');

            if (!regCust) return; // 예약자 정보가 없으면 건너뜀

            // 이미 처리된 노드는 다시 처리하지 않음 (성능 최적화)
            if (regCust.dataset.visitInfoProcessed === 'true') {
                return;
            }
            regCust.dataset.visitInfoProcessed = 'true';

            // 예약자 이름 추출 (b.rsvAlarm0)
            const nameElement = body.querySelector('b.rsvAlarm0');
            if (!nameElement) {
                console.warn(`⚠️ b.rsvAlarm0 요소 없음 (event_id: ${eventId})`);
                return;
            }

            // 이름을 소문자로 변환하여 비교 (예: 'cs', 'ㅊㄴ'는 태그 제외)
            const name = nameElement.textContent.trim().toLowerCase();
            const excludedNames = ['cs', 'ㅊㄴ'];
            const existingConsultingTag = body.querySelector('b[data-tag="visitInfo-consulting"]');
            const existingNcuTag = body.querySelector('b[data-tag="visitInfo-ncu"]');

            if (excludedNames.includes(name)) {
                // 제외 대상이면 기존 태그 삭제
                if (existingConsultingTag) existingConsultingTag.remove();
                if (existingNcuTag) existingNcuTag.remove();
                return;
            }

            // 예약자 정보 input에서 최근 방문일 추출
            const input = frameDoc.querySelector(`#strHiddenReplaceCustname_${eventId}`);
            if (!input) {
                console.warn(`⚠️ strHiddenReplaceCustname_${eventId} 입력 필드 없음`);
                return;
            }

            const value = input.value;
            const dateMatch = value.match(/최근방문일\s*:\s*(\d{4}-\d{2}-\d{2})/);
            let showConsulting = false;
            let showNCU = false;

            if (dateMatch) {
                // 최근 방문일이 2025-04-01 이전이면 컨설팅 태그 표시
                const visitDateStr = dateMatch[1];
                const visitDate = new Date(visitDateStr);
                const cutoffDate = new Date('2025-04-01');
                if (visitDate < cutoffDate) {
                    showConsulting = true;
                }
            } else {
                // 최근 방문일이 없으면 두 태그 모두 표시
                showConsulting = true;
                showNCU = true;
            }

            // 예약 정보 영역에 position: relative 적용 (중복 적용 방지)
            if (body && !body.dataset.positionRelativeSet) {
                body.style.position = 'relative';
                body.dataset.positionRelativeSet = 'true';
            }

            // [컨설팅 태그] 추가 또는 삭제
            if (showConsulting) {
                if (!existingConsultingTag) {
                    const consultingTag = document.createElement('b');
                    consultingTag.textContent = '컨설팅';
                    consultingTag.setAttribute('data-tag', 'visitInfo-consulting');
                    Object.assign(consultingTag.style, {
                        fontSize: '9px',
                        fontWeight: '100',
                        position: 'absolute',
                        right: '0',
                        top: '0',
                        color: '#555',
                        background: '#f0f0f0',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        pointerEvents: 'none',
                        zIndex: '10',
                    });
                    regCust.appendChild(consultingTag);
                }
            } else if (existingConsultingTag) {
                existingConsultingTag.remove();
            }

            // [N CU 태그] 추가 또는 삭제
            if (showNCU) {
                if (!existingNcuTag) {
                    const ncuTag = document.createElement('b');
                    ncuTag.textContent = 'N CU';
                    ncuTag.setAttribute('data-tag', 'visitInfo-ncu');
                    Object.assign(ncuTag.style, {
                        fontSize: '9px',
                        fontWeight: '100',
                        position: 'absolute',
                        right: '0',
                        top: '15px',
                        color: '#555',
                        background: '#f0f0f0',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        pointerEvents: 'none',
                        zIndex: '10',
                    });
                    regCust.appendChild(ncuTag);
                }
            } else if (existingNcuTag) {
                existingNcuTag.remove();
            }
        });
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
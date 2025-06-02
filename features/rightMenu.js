import { FrameObserver } from '../common/observer.js';

export class RightMenu {
    constructor() {
        // 우선순위 메뉴명 배열 (순서대로 우선 적용)
        this.priority = ["펌", "컬러", "클리닉", "커트", "컨설팅"];

        // 메뉴명 정규화 매핑 (예: "컷" → "커트")
        this.normalizeMap = {
            "컷": "커트"
        };

        this.observer = new FrameObserver({
            frameName: 'mainFrame',
            onProcess: (frameDoc) => this.processFrame(frameDoc)
        });

        this.pageObserver = null;
    }

    /**
     * 예약시술메뉴 처리
     * @param {Document} doc - 처리할 document
     */
    processMenu(doc = document) {
        // #today > table[1]의 두 번째 테이블을 찾음
        const table = doc.querySelectorAll('#today > table')[1];
        if (!table) {
            console.error('❌ 두 번째 테이블을 찾을 수 없습니다.');
            return;
        }

        // 테이블의 모든 행(tr)을 순회
        const rows = table.querySelectorAll('tbody > tr');
        rows.forEach(row => {
            // 각 행의 ismemo 속성에서 예약시술메뉴 추출
            const ismemo = row.getAttribute('ismemo') || '';
            const match = ismemo.match(/예약시술메뉴\s*:\s*(.*?)\s*예약금/);

            if (match) {
                let menuText = match[1];

                // 메뉴명 정규화: "컷" → "커트"
                for (const [key, value] of Object.entries(this.normalizeMap)) {
                    if (menuText.includes(key)) {
                        menuText = menuText.replace(new RegExp(key, 'g'), value);
                    }
                }

                // 우선순위에 따라 메뉴명 추출
                const found = this.priority.find(item => menuText.includes(item));
                if (found) {
                    // 4번째 칸(td)에 메뉴명 입력 (이미 값이 있으면 건너뜀)
                    const td = row.querySelector('td:nth-of-type(4)');
                    if (td && td.textContent.trim() === '') {
                        td.textContent = found;
                    }
                }
            }
        });
    }

    /**
     * iframe 내부의 콘텐츠를 처리하고, 변화가 생기면 자동 갱신
     */
    processFrame(frameDoc) {
        try {
            const targetNode = frameDoc.querySelector('#today');
            if (targetNode) {
                this.processMenu(frameDoc);
            }
        } catch (e) {
            console.error('iframe 접근 오류:', e);
        }
    }

    /**
     * 현재 프레임이 mainFrame인지 확인
     */
    isMainFrame() {
        try {
            return window.self.name === 'mainFrame';
        } catch (e) {
            return false;
        }
    }

    /**
     * 페이지 로드 시 초기 실행
     */
    initialize() {
        if (this.isMainFrame()) {
            // mainFrame(예약표)에서 실행
            const checkInterval = setInterval(() => {
                if (document.querySelector('#today')) {
                    clearInterval(checkInterval);
                    this.processMenu();

                    // #today에 변화가 생기면 자동으로 processMenu 실행
                    const targetNode = document.querySelector('#today');
                    if (targetNode) {
                        const observer = new MutationObserver(() => {
                            this.processMenu();
                        });
                        observer.observe(targetNode, {
                            childList: true,
                            subtree: true
                        });
                    }
                }
            }, 1000);

            // 30초 후에도 #today가 없으면 인터벌 중단
            setTimeout(() => {
                clearInterval(checkInterval);
            }, 30000);
        }
    }

    /**
     * 기능 시작
     */
    start() {
        this.observer.start();
        this.initialize();

        // 현재 페이지에 포함된 모든 iframe(mainFrame 포함)에 대해 처리
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => this.processFrame(iframe.contentDocument || iframe.contentWindow.document));

        // iframe이 동적으로 추가되는 경우도 자동 처리
        this.pageObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeName === 'IFRAME') {
                        this.processFrame(node.contentDocument || node.contentWindow.document);
                    }
                });
            });
        });
        this.pageObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * 기능 중지
     */
    stop() {
        this.observer.stop();
        if (this.pageObserver) {
            this.pageObserver.disconnect();
            this.pageObserver = null;
        }
    }
} 
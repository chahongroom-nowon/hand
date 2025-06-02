import { FrameObserver } from '../common/observer.js';

export class HandsosCancel {
    constructor() {
        this.observer = new FrameObserver({
            frameName: 'mainFrame',
            onProcess: (frameDoc) => this.processFrame(frameDoc)
        });
    }

    /**
     * iframe 내부의 예약금지 삭제 버튼에 확인 로직 주입
     * @param {Document} frameDoc - iframe 내부 document
     */
    processFrame(frameDoc) {
        const selector = 'a[title="예약금지삭제"], a[onclick^="jsReserveStop"]';
        const buttons = frameDoc.querySelectorAll(selector);
        
        buttons.forEach(button => {
            if (button.dataset.confirmInjected === 'true') return;
            button.dataset.confirmInjected = 'true';
            
            const originalOnClickAttr = button.getAttribute('onclick');
            button.onclick = (event) => this.handleButtonClick(event, button, originalOnClickAttr, frameDoc);
        });
    }

    /**
     * 버튼 클릭 이벤트 처리
     */
    handleButtonClick(event, button, originalOnClickAttr, frameDoc) {
        event.preventDefault();
        const isConfirmed = confirm('! 예약금지를 취소하셨습니다 !\n! 실수로 누른 경우 다시 예약을 꼭 막아주세요 !');
        
        if (isConfirmed) {
            if (originalOnClickAttr) {
                const match = originalOnClickAttr.match(/jsStopTimeDel\\((.*)\\)/);
                if (match) {
                    const params = match[1]
                        .split(',')
                        .map(s => s.trim().replace(/^'(.*)'$/, '$1'));
                    
                    const frameWindow = frameDoc.defaultView;
                    if (typeof frameWindow.jsStopTimeDel === 'function') {
                        frameWindow.jsStopTimeDel(...params.slice(0, 6), button);
                    } else {
                        alert('jsStopTimeDel 함수를 찾을 수 없습니다.');
                    }
                }
            }
        } else {
            console.log('예약금지 취소 - 사용자 취소');
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
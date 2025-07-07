import { HandsosCancel } from '../features/handsosCancel.js';
import { HandsosWaiting } from '../features/handsosWaiting.js';
import { RightMenu } from '../features/rightMenu.js';
import { Tag } from '../features/tag.js';
import { ConsultingGo } from '../features/consultingGo.js';
import { NaverMenu } from '../features/naverMenu.js';

// 기능 인스턴스 생성
const handsosCancel = new HandsosCancel();
const handsosWaiting = new HandsosWaiting();
const rightMenu = new RightMenu();
const tag = new Tag();
const consultingGo = new ConsultingGo();
const naverMenu = new NaverMenu();

// 기능 시작
handsosCancel.start();
handsosWaiting.start();
rightMenu.start();
tag.start();
consultingGo.start();
naverMenu.start(); 
// export * from './ts/Action';
// export * from './ts/TreeNode';
// export * from './ts/Tree';
import {App} from './ts/App';
// import {TestApp} from './ts/_tests_/TestApp';

require('./css/main.scss');

document.addEventListener("DOMContentLoaded", start);

function start() {
    new App().start();
}
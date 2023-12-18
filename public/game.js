
/**
 * アクタークラス
 * キャンバス上に描画される1要素
 */
class Actor {
    /** コンストラクタ */
    constructor() {}
}

/**
 * シーンクラス
 * 画面上
 */
class Scene {
    /** @type {Actor[]} */
    _actors;
    /** コンストラクタ */
    constructor() {
        this._actors = [];
    }
}

/**
 * ゲームクラス
 */
class Game {
    /** @type {Function} */
    _loopFucBind;
    /** コンストラクタ */
    constructor() {
        this._loopFucBind = this._loop.bind(this);
    }

    /**
     * ゲームスタート
     */
    start() {
        console.log('Game.start execute!!!');
        // ゲームループを開始
        requestAnimationFrame(this._loopFucBind);
    }

    /**
     * ゲームループ
     * @param {number} timestamp 
     */
    _loop(timestamp) {
        requestAnimationFrame(this._loopFucBind);
    }
}

// インスタンスを作成
const game = new Game();
game.start();
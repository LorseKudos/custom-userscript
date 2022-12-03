// ==UserScript==
// @name         SortFavoriteStoresInYahooShopping
// @namespace    https://github.com/LorseKudos
// @version      0.5
// @description  ヤフーショッピングのお気に入りページにあるストア一覧をソートします。ついでに値段変更テキストの色を変更します。
// @author       Lorse
// @updateURL    https://github.com/LorseKudos/custom-userscript/raw/main/store-list-sort-plugin/main.user.js
// @downloadURL  https://github.com/LorseKudos/custom-userscript/raw/main/store-list-sort-plugin/main.user.js
// @match        https://shopping.yahoo.co.jp/my/wishlist/item*
// @grant        none
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// ==/UserScript==

// 引用: https://github.com/Neos21/frontend-sandboxes/blob/master/poc-inner-text-selector/index.html
// https://neos21.net/blog/2022/07/03-01.html
function cssInnerText(selector, metaOrInnerTextRegExp, innerTextOrStyle, styleOrUndefined) {
  // ログ出力時に使用する引数群
  const argsForDebug = { selector, metaOrInnerTextRegExp, innerTextOrStyle, styleOrUndefined };
  // 第1引数の必須チェック
  if(isNull(selector       )) return console.warn('Invalid Arguments : Selector Is Null Or Undefined', argsForDebug);
  if(!isString(selector    )) return console.warn('Invalid Arguments : Selector Is Not A String'     , argsForDebug);
  if(isEmptyString(selector)) return console.warn('Invalid Arguments : Selector Is Empty'            , argsForDebug);
  // 第2引数の必須チェック
  if(isNull(metaOrInnerTextRegExp)) return console.warn('Invalid Arguments : Meta Or Inner Text Reg Exp Is Null Or Undefined', argsForDebug);

  // 第2引数の型に応じて第3・第4引数の扱いと処理を変更する
  // 第2引数が文字列の場合 : 第2引数がメタ文字、第3引数が判定したい文字列、第4引数がスタイル文字列とみなす
  if(isString(metaOrInnerTextRegExp)) {
    const meta      = metaOrInnerTextRegExp;
    const innerText = innerTextOrStyle;
    const style     = styleOrUndefined;

    // 第3引数のチェック
    if(isNull(innerText       )) return console.warn('[Meta And String Mode] Invalid Arguments : Inner Text Is Null Or Undefined', argsForDebug);
    if(!isString(innerText    )) return console.warn('[Meta And String Mode] Invalid Arguments : Inner Text Is Not A String'     , argsForDebug);
    if(isEmptyString(innerText)) return console.warn('[Meta And String Mode] Invalid Arguments : Inner Text Is Empty'            , argsForDebug);
    // 第4引数のチェック
    if(isNull(style       )) return console.warn('[Meta And String Mode] Invalid Arguments : Style Is Null Or Undefined', argsForDebug);
    if(!isString(style    )) return console.warn('[Meta And String Mode] Invalid Arguments : Style Is Not A String'     , argsForDebug);
    if(isEmptyString(style)) return console.warn('[Meta And String Mode] Invalid Arguments : Style Is Empty'            , argsForDebug);

    // 正規表現オブジェクトを生成する
    const regExp = createRegExp(meta, innerText);
    if(regExp == null) return console.warn('[Meta And String Mode] Invalid Meta', argsForDebug);

    // 処理する
    return updateElements(selector, regExp, style, 'Meta And String Mode', argsForDebug);
  }

  // 第2引数が正規表現オブジェクトの場合 : 第2引数が判定したい文字列の正規表現、第3引数がスタイル文字列、第4引数は未指定とみなす
  if(Object.prototype.toString.call(metaOrInnerTextRegExp) === '[object RegExp]') {
    const regExp          = metaOrInnerTextRegExp;
    const style           = innerTextOrStyle;
    const unusedArgument  = styleOrUndefined;

    // 第3引数のチェック
    if(isNull(style       )) return console.warn('[RegExp Mode] Invalid Arguments : Style Is Null Or Undefined', argsForDebug);
    if(!isString(style    )) return console.warn('[RegExp Mode] Invalid Arguments : Style Is Not A String'     , argsForDebug);
    if(isEmptyString(style)) return console.warn('[RegExp Mode] Invalid Arguments : Style Is Empty'            , argsForDebug);
    // 第4引数が未指定であること (指定されていたら処理しない)
    if(!isNull(unusedArgument)) return console.warn('[RegExp Mode] Invalid Arguments : The 4th Argument Is Specified', argsForDebug);

    // 処理する
    return updateElements(selector, regExp, style, 'RegExp Mode', argsForDebug);
  }

  // 第2引数が `undefined` や `null` ではなく、文字列型でも正規表現オブジェクトでもないその他の型だった場合
  return console.warn('Invalid Arguments : Meta Or Inner Text Reg Exp Is Invalid Value', argsForDebug);

  /**
   * 引数 `value` が `undefined` か `null` かどうかを判定する
   *
   * @param {*} value 判定したい変数
   * @return {boolean} `undefined` か `null` なら `true` を返す
   */
  function isNull(value) { return value == null; }

  /**
   * 引数 `value` が文字列型かどうかを判定する
   *
   * @param {*} value 判定したい変数
   * @param {boolean} 文字列型なら `true` を返す
   */
  function isString(value) { return typeof value === 'string'; }

  /**
   * 引数 `value` が空文字かどうかを判定する。型チェックは行わないので別途事前に行っておくこと
   *
   * @param {string} value 判定したい変数
   * @return {boolean} 空文字なら `true` を返す
   */
  function isEmptyString(value) { return String(value).trim() === ''; }

  /**
   * 正規表現オブジェクトを生成する
   *
   * @param {string} meta 指定の文字列をどのようにマッチさせるか。以下のパターンに対応している
   *                      - `=` : 完全一致
   *                      - `^=` : 前方一致
   *                      - `$=` : 後方一致
   *                      - `*=` : 部分一致
   *                      - `:not()` : 否定・カッコ内に書けるパターンは上の4つ
   *                      - 4つの一致 + 4つの否定に連続するかスペース1つを開けて、末尾に `i` か `I` : ケースインセンシティブ
   * @param {string} innerText マッチさせたい文字列
   * @return {RegExp | null} 正規表現オブジェクト。引数 `meta` が不正な値の場合は `null` を返す
   */
  function createRegExp(meta, innerText) {
    // 引数 `meta` の末尾に空白 `i` か `I` があれば除去する。間に空白があればそれも除去する
    const pattern = meta.replace((/^(.+)([iI])$/), '$1').trim();
    // 引数 `meta` の末尾に `i` か `I` があればケースインセンシティブフラグを設定する
    const ignoreCaseFlag = (/[iI]$/).test(meta) ? 'i' : '';

    // 引数 `innerText` を正規表現オブジェクトに組み込めるよう特殊文字をエスケープしておく
    const escapedInnerText = escapeRegExp(innerText);

    // 指定されたメタ文字のパターンに応じて正規表現オブジェクトを生成・返却する
    if(pattern === '=') return new RegExp(`^${escapedInnerText}$`, ignoreCaseFlag);
    if(pattern === '^=') return new RegExp(`^${escapedInnerText}`, ignoreCaseFlag);
    if(pattern === '$=') return new RegExp(`${escapedInnerText}$`, ignoreCaseFlag);
    if(pattern === '*=') return new RegExp(`${escapedInnerText}`, ignoreCaseFlag);
    if(pattern === ':not(=)' || pattern === ':not(*=)') return new RegExp(`^(?!.*${escapedInnerText}).*$`, ignoreCaseFlag);
    if(pattern === ':not(^=)') return new RegExp(`^(?!${escapedInnerText}).*$`, ignoreCaseFlag);
    if(pattern === ':not($=)') return new RegExp(`^(?!.*${escapedInnerText}$).*$`, ignoreCaseFlag);
    return null;  // 想定外のメタ文字が渡された場合

    /**
     * 正規表現に使われる特殊文字をエスケープする
     *
     * - 参考 : https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
     *          上のサイトよりコードを拝借
     * - 参考 : https://github.com/sindresorhus/escape-string-regexp
     *          似たような機能を提供する npm パッケージ
     *
     * @param {string} value 文字列
     * @return {string} 正規表現に使われる特殊文字をエスケープした文字列
     */
    function escapeRegExp(value) { return value.replace((/[.*+?^=!:${}()|[\]\/\\]/g), '\\$&'); }
  }

  /**
   * 要素を取得し `innerText` が合致した要素にスタイルを追加する
   *
   * @param {string} selector セレクタ文字列
   * @param {RegExp} regExp マッチさせたい文字列を含んだ正規表現オブジェクト
   * @param {string} style スタイル文字列
   * @param {string} modeNameForDebug デバッグログ出力用の処理モード名称
   * @param {string} argsForDebug デバッグログ出力用の引数群
   */
  function updateElements(selector, regExp, style, modeNameForDebug, argsForDebug) {
    // 要素を取得する
    const elements = document.querySelectorAll(selector);
    if(!elements.length) return console.warn(`[${modeNameForDebug}] Elements Not Found`, argsForDebug);

    // 各要素の `innerText` を確認し、合致する要素にはスタイルを追加する
    let updatedElementsCount = 0;  // デバッグ用に `innerText` が合致してスタイルを追加した要素の数をカウントしておく
    elements.forEach((element) => {
      // NOTE : `element.innerText.trim().match(regExp)` よりも高速なので `test()` を使う
      //        ただし `test()` は `g` (global) フラグを付与した場合に2回目以降のマッチが `false` になることに注意が必要
      //        `g` フラグを付与した正規表現オブジェクトを引数から渡した場合に、マッチしてほしい要素がマッチ扱いにならないことになる
      //        - 参考 : https://stackoverflow.com/questions/10940137/regex-test-v-s-string-match-to-know-if-a-string-matches-a-regular-expression
      if(regExp.test(element.innerText.trim())) {
        element.style.cssText += style;
        updatedElementsCount++;
      }
    });
    if(updatedElementsCount === 0) return console.warn(`[${modeNameForDebug}] No Elements Matched`, argsForDebug);
    console.log(`[${modeNameForDebug}] ${updatedElementsCount} Elements Matched`, argsForDebug);
  }
}

function changeDiscountColor(){
    const discountTextClassPrefix = "style_ItemList__itemDiscount__";
    cssInnerText(`[class^="${discountTextClassPrefix}"]`, '*=', '円↑', 'color: blue !important;');
    cssInnerText(`[class^="${discountTextClassPrefix}"]`, '*=', '円↓', 'color: pink !important;');
}

function waitUntilDisplayElements(selector) {
    if($(selector).length > 0){
        return;
    }
    window.setTimeout(() => waitUntilDisplayElements(selector), 100);
}

(function() {
    'use strict';

    const target = $('#favitem')[0];
    const observer = new MutationObserver((mutations) => {
        changeDiscountColor()
    });
    const config = {
        childList: true,
        characterData: true,
        subtree: true
    };
    observer.observe(target, config);

    const storeClassPrefix = "style_Filter__seller__"
    const storeElSelector = `li[class^="${storeClassPrefix}"]`
    waitUntilDisplayElements(storeElSelector);

    changeDiscountColor();

    const storeNameToElement = $(storeElSelector).toArray().reduce((dic,el) => {
        dic[el.innerText] = el;
        return dic;
    }, {});
    const sortedStores = Object.keys(storeNameToElement).sort((a,b) => b.localeCompare(a));

    for(const store of sortedStores){
        const elementToInsert = storeNameToElement[store];
        elementToInsert.parentElement.insertBefore(elementToInsert,$(storeElSelector)[0]);
    }
})();

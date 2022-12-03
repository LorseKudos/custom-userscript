// ==UserScript==
// @name         SortFavoriteStoresInYahooShopping
// @namespace    https://github.com/LorseKudos
// @version      0.2
// @description  ヤフーショッピングのお気に入りページにあるストア一覧をソートします。ついでに値段変化のテキストを青色にします。
// @author       Lorse
// @updateURL    https://github.com/LorseKudos/custom_userscript/raw/main/store_list_sort_plugin/main.user.js
// @downloadURL  https://github.com/LorseKudos/custom_userscript/raw/main/store_list_sort_plugin/main.user.js
// @match        https://shopping.yahoo.co.jp/my/wishlist/item*
// @grant        none
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// ==/UserScript==

(function() {
    'use strict';
    const discountTextClassPrefix = "style_ItemList__itemDiscount__"
    $(`<style id='css_to_change_discount_text_color' type='text/css'> [class^="${discountTextClassPrefix}"]{ color:blue !important;} </style>`).appendTo("head");

    const storeClassPrefix = "style_Filter__seller__"
    const storeElSelector = `li[class^="${storeClassPrefix}"]`
    function waitUntilDisplayStores() {
        if($(storeElSelector).length > 0){
            return;
        }
        window.setTimeout(() => waitUntilDisplayStores(), 100);
    }
    waitUntilDisplayStores();

    let storeNameToElement = $(storeElSelector).toArray().reduce((dic,el) => {
        dic[el.innerText] = el;
        return dic;
    }, {});
    let sortedStores = Object.keys(storeNameToElement).sort().reverse();

    for(let store of sortedStores){
        let elementToInsert = storeNameToElement[store];
        elementToInsert.parentElement.insertBefore(elementToInsert,$(storeElSelector)[0]);
    }
})();

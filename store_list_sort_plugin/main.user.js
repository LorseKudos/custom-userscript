// ==UserScript==
// @name         SortFavoriteStoresInYahooShopping
// @namespace    https://github.com/LorseKudos
// @version      0.1
// @description  ヤフーショッピングのお気に入りページにあるストア一覧をソートします
// @author       Lorse
// @match        https://shopping.yahoo.co.jp/my/wishlist/item*
// @grant        none
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js
// ==/UserScript==

(function() {
    'use strict';

    function waitUntilDisplayStores() {
        if($(".elStoreTitle").length !== 0){
            return;
        }
        window.setTimeout(() => waitUntilDisplayStores(), 500);
    }
    waitUntilDisplayStores();

    let storeNameToElement = $(".elStoreTitle").toArray().reduce((dic,el) => {
        dic[el.innerText] = el;
        return dic;
    }, {});
    let sortedStores = $(".elStoreTitle").toArray().map((el) => el.innerText).sort().reverse();

    for(let store of sortedStores){
        let elementToInsert = storeNameToElement[store];
        elementToInsert.parentElement.insertBefore(elementToInsert,$(".elStoreTitle")[0]);
    }

    $(".elFilterListTitle").addClass("elShow");
})();

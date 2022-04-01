// ==UserScript==
// @name        PlaceBot Nerf Dart
// @version     0.0.5
// @namespace   https://github.com/bigt7979/PlaceBot
// @description A bot that automates drawing on reddit.com/r/place
// @include     https://www.reddit.com/place*
// @include     https://www.reddit.com/r/place/
// ==/UserScript==

(function() {
    var j = document.createElement('script');
    j.setAttribute('type', 'text/javascript');
    j.setAttribute('src', 'https://github.com/bigt7979/PlaceBot/nerfDart.js');
    document.head.appendChild(j);
    setTimeout(function() {
    var s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', 'https://github.com/bigt7979/PlaceBot/placebot.js');
    document.head.appendChild(s);
    },100);
    })();
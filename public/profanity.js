/* Profanity filter — client-side pre-check */
var ProfanityFilter = (function() {
  var wordList = null;
  var PROFANITY_MESSAGE = 'Your comment contains inappropriate language. Please revise and try again.';

  function loadProfanityList() {
    if (wordList) return Promise.resolve(wordList);
    return fetch('/profanity-list.json')
      .then(function(r) { return r.json(); })
      .then(function(list) { wordList = list; return list; });
  }

  function normalize(text) {
    return text.toLowerCase()
      .replace(/@/g, 'a')
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/3/g, 'e')
      .replace(/\$/g, 's')
      .replace(/5/g, 's');
  }

  function isProfane(text) {
    if (!wordList) return false;
    var normalized = normalize(text);
    for (var i = 0; i < wordList.length; i++) {
      var escaped = wordList[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var re = new RegExp('\\b' + escaped + '\\b', 'i');
      if (re.test(normalized)) return true;
    }
    return false;
  }

  return {
    load: loadProfanityList,
    check: isProfane,
    MESSAGE: PROFANITY_MESSAGE,
  };
})();

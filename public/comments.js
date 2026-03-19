/* Comment & Discussion System */
var CommentsModule = (function() {

  var FOOTBALLER_NAMES = null;
  var identity = null; // { visitorId, footballerName }

  // ── Identity ──────────────────────────────────────────────────────────────

  function getIdentity() {
    if (identity) return identity;
    var stored = localStorage.getItem('commentIdentity');
    if (stored) {
      try {
        var parsed = JSON.parse(stored);
        // Require signature (new format) — old unsigned identities get re-issued
        if (parsed.visitorId && parsed.signature) {
          identity = parsed;
          return identity;
        }
      } catch(e) {}
    }
    return null;
  }

  function hashColor(name) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    var hue = ((hash % 360) + 360) % 360;
    return 'hsl(' + hue + ', 55%, 45%)';
  }

  function pickUniqueName(names) {
    var name = names[Math.floor(Math.random() * names.length)];
    var suffix = Math.floor(Math.random() * 10000);
    var pad = String(suffix);
    while (pad.length < 4) pad = '0' + pad;
    return name + ' #' + pad;
  }

  function ensureIdentity() {
    var id = getIdentity();
    if (id) return Promise.resolve(id);
    // Get server-signed visitorId, then pick a name client-side
    return Promise.all([
      fetch('/api/identity', { method: 'POST' }).then(function(r) { return r.json(); }),
      loadFootballerNames(),
    ]).then(function(results) {
      var serverIdentity = results[0];
      var names = results[1];
      var name = pickUniqueName(names);
      identity = {
        visitorId: serverIdentity.visitorId,
        signature: serverIdentity.signature,
        footballerName: name,
      };
      localStorage.setItem('commentIdentity', JSON.stringify(identity));
      return identity;
    });
  }

  function rerollName() {
    return loadFootballerNames().then(function(names) {
      var id = getIdentity();
      var newName = pickUniqueName(names);
      while (newName === id.footballerName && names.length > 1) {
        newName = pickUniqueName(names);
      }
      identity.footballerName = newName;
      localStorage.setItem('commentIdentity', JSON.stringify(identity));
      return identity;
    });
  }

  function loadFootballerNames() {
    if (FOOTBALLER_NAMES) return Promise.resolve(FOOTBALLER_NAMES);
    return fetch('/footballer-names.json')
      .then(function(r) { return r.json(); })
      .then(function(names) { FOOTBALLER_NAMES = names; return names; });
  }

  // ── API calls ─────────────────────────────────────────────────────────────

  function fetchComments(fixtureId, market) {
    return fetch('/api/comments?fixture=' + encodeURIComponent(fixtureId) + '&market=' + encodeURIComponent(market))
      .then(function(r) { return r.json(); });
  }

  function postComment(fixtureId, market, text, parentId) {
    var id = getIdentity();
    if (!id) return Promise.reject(new Error('Identity not initialized'));
    return fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fixtureId: fixtureId,
        market: market,
        visitorId: id.visitorId,
        signature: id.signature,
        author: id.footballerName,
        text: text,
        parentId: parentId || null,
      }),
    }).then(function(r) {
      if (!r.ok) return r.json().then(function(e) { throw new Error(e.error); });
      return r.json();
    });
  }

  function deleteComment(fixtureId, market, commentId) {
    var id = getIdentity();
    if (!id) return Promise.reject(new Error('Identity not initialized'));
    return fetch('/api/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fixtureId: fixtureId,
        market: market,
        visitorId: id.visitorId,
        signature: id.signature,
        commentId: commentId,
      }),
    }).then(function(r) {
      if (!r.ok) return r.json().then(function(e) { throw new Error(e.error); });
      return r.json();
    });
  }

  function submitVote(targetType, targetId, direction, fixtureId, market) {
    var id = getIdentity();
    if (!id) return Promise.reject(new Error('Identity not initialized'));
    return fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: id.visitorId,
        signature: id.signature,
        targetType: targetType,
        targetId: targetId,
        fixtureId: fixtureId,
        market: market,
        direction: direction,
      }),
    }).then(function(r) { return r.json(); });
  }

  function fetchVoteStatus(fixtureId, market, visitorId) {
    return fetch('/api/vote-status?fixture=' + encodeURIComponent(fixtureId) +
      '&market=' + encodeURIComponent(market) + '&visitor=' + encodeURIComponent(visitorId))
      .then(function(r) { return r.json(); });
  }

  // ── Time formatting ───────────────────────────────────────────────────────

  function timeAgo(isoDate) {
    var seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    var minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + 'm ago';
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h ago';
    var days = Math.floor(hours / 24);
    if (days < 30) return days + 'd ago';
    var months = Math.floor(days / 30);
    return months + 'mo ago';
  }

  // ── DOM helpers ───────────────────────────────────────────────────────────

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function svgIcon(pathD, size) {
    var s = size || 16;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(s));
    svg.setAttribute('height', String(s));
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.style.flexShrink = '0';
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', pathD);
    svg.appendChild(p);
    return svg;
  }

  // SVG paths
  var ICON_UP = 'M12 4l-8 8h5v8h6v-8h5z';
  var ICON_DOWN = 'M12 20l8-8h-5V4H9v8H4z';
  var ICON_THUMBS_UP = 'M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z';
  var ICON_THUMBS_DOWN = 'M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z';
  var ICON_REPLY = 'M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z';
  var ICON_DELETE = 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z';

  // ── Analysis vote bar ─────────────────────────────────────────────────────

  function renderAnalysisVoteBar(fixtureId, market, analysisVotes, userVote) {
    var bar = el('div', 'analysis-vote-bar');

    var label = el('span', 'analysis-vote-label', 'Was this analysis helpful?');

    var btns = el('div', 'analysis-vote-btns');

    var upBtn = el('button', 'vote-btn vote-btn-up' + (userVote === 'up' ? ' active' : ''));
    upBtn.appendChild(svgIcon(ICON_THUMBS_UP, 18));
    var upCount = el('span', 'vote-btn-count', String(analysisVotes.up || 0));
    upBtn.appendChild(upCount);

    var downBtn = el('button', 'vote-btn vote-btn-down' + (userVote === 'down' ? ' active' : ''));
    downBtn.appendChild(svgIcon(ICON_THUMBS_DOWN, 18));
    var downCount = el('span', 'vote-btn-count', String(analysisVotes.down || 0));
    downBtn.appendChild(downCount);

    function handleAnalysisVote(direction) {
      return function() {
        var id = getIdentity();
        if (!id) return;
        var oldUp = analysisVotes.up || 0;
        var oldDown = analysisVotes.down || 0;
        var oldUserVote = userVote;
        if (userVote === direction) {
          analysisVotes[direction]--;
          userVote = null;
        } else if (userVote) {
          analysisVotes[userVote]--;
          analysisVotes[direction]++;
          userVote = direction;
        } else {
          analysisVotes[direction]++;
          userVote = direction;
        }
        upCount.textContent = String(analysisVotes.up || 0);
        downCount.textContent = String(analysisVotes.down || 0);
        upBtn.classList.toggle('active', userVote === 'up');
        downBtn.classList.toggle('active', userVote === 'down');

        submitVote('analysis', fixtureId + ':' + market, direction, fixtureId, market)
          .then(function(result) {
            analysisVotes.up = result.votes.up;
            analysisVotes.down = result.votes.down;
            userVote = result.userVote;
            upCount.textContent = String(analysisVotes.up);
            downCount.textContent = String(analysisVotes.down);
            upBtn.classList.toggle('active', userVote === 'up');
            downBtn.classList.toggle('active', userVote === 'down');
          })
          .catch(function() {
            analysisVotes.up = oldUp;
            analysisVotes.down = oldDown;
            userVote = oldUserVote;
            upCount.textContent = String(oldUp);
            downCount.textContent = String(oldDown);
            upBtn.classList.toggle('active', userVote === 'up');
            downBtn.classList.toggle('active', userVote === 'down');
          });
      };
    }

    upBtn.addEventListener('click', handleAnalysisVote('up'));
    downBtn.addEventListener('click', handleAnalysisVote('down'));

    btns.appendChild(upBtn);
    btns.appendChild(downBtn);

    bar.appendChild(label);
    bar.appendChild(btns);
    return bar;
  }

  // ── Single comment ────────────────────────────────────────────────────────

  function renderComment(comment, replies, commentVotes, userVotes, fixtureId, market, onReply) {
    // For top-level comments, wrap comment + replies in a container
    var wrapper = el('div', comment.parentId ? '' : 'comment-thread');

    var item = el('div', 'comment-item' + (comment.parentId ? ' comment-reply' : ''));

    var content = el('div', 'comment-content');

    var header = el('div', 'comment-header');
    var authorSpan = el('span', 'comment-author', '\u26BD ' + comment.author);
    authorSpan.style.color = comment.authorColor || hashColor(comment.author);
    var timeSpan = el('span', 'comment-time', timeAgo(comment.createdAt));
    header.appendChild(authorSpan);
    header.appendChild(timeSpan);

    // "You" badge
    var myId = getIdentity();
    var isOwn = myId && comment.visitorId === myId.visitorId;
    if (isOwn) {
      var youBadge = el('span', 'comment-you-badge', 'you');
      header.appendChild(youBadge);
    }

    var textP = el('p', 'comment-text', comment.text);

    content.appendChild(header);
    content.appendChild(textP);

    // Actions row: inline votes + reply + delete
    var actionsRow = el('div', 'comment-actions');

    // Inline vote controls
    var votes = commentVotes[comment.id] || { up: 0, down: 0 };
    var userVote = userVotes[comment.id] || null;

    var upBtn = el('button', 'comment-action-btn vote-inline-up' + (userVote === 'up' ? ' active' : ''));
    upBtn.appendChild(svgIcon(ICON_UP, 14));
    upBtn.setAttribute('aria-label', 'Upvote');

    var voteCount = el('span', 'vote-inline-count', String((votes.up || 0) - (votes.down || 0)));

    var downBtn = el('button', 'comment-action-btn vote-inline-down' + (userVote === 'down' ? ' active' : ''));
    downBtn.appendChild(svgIcon(ICON_DOWN, 14));
    downBtn.setAttribute('aria-label', 'Downvote');

    function handleInlineVote(direction) {
      return function() {
        var id = getIdentity();
        if (!id) return;
        var oldUp = votes.up || 0;
        var oldDown = votes.down || 0;
        var oldUserVote = userVote;
        if (userVote === direction) {
          votes[direction]--;
          userVote = null;
        } else if (userVote) {
          votes[userVote]--;
          votes[direction]++;
          userVote = direction;
        } else {
          votes[direction]++;
          userVote = direction;
        }
        voteCount.textContent = String((votes.up || 0) - (votes.down || 0));
        upBtn.classList.toggle('active', userVote === 'up');
        downBtn.classList.toggle('active', userVote === 'down');

        submitVote('comment', comment.id, direction, fixtureId, market)
          .then(function(result) {
            votes.up = result.votes.up;
            votes.down = result.votes.down;
            userVote = result.userVote;
            voteCount.textContent = String(votes.up - votes.down);
            upBtn.classList.toggle('active', userVote === 'up');
            downBtn.classList.toggle('active', userVote === 'down');
          })
          .catch(function() {
            votes.up = oldUp;
            votes.down = oldDown;
            userVote = oldUserVote;
            voteCount.textContent = String(oldUp - oldDown);
            upBtn.classList.toggle('active', userVote === 'up');
            downBtn.classList.toggle('active', userVote === 'down');
          });
      };
    }

    upBtn.addEventListener('click', handleInlineVote('up'));
    downBtn.addEventListener('click', handleInlineVote('down'));

    actionsRow.appendChild(upBtn);
    actionsRow.appendChild(voteCount);
    actionsRow.appendChild(downBtn);

    // Reply link (only for top-level comments)
    if (!comment.parentId) {
      var replyLink = el('button', 'comment-action-btn comment-reply-link');
      replyLink.appendChild(svgIcon(ICON_REPLY, 14));
      replyLink.appendChild(document.createTextNode('Reply'));
      replyLink.addEventListener('click', function() {
        if (typeof onReply === 'function') onReply(comment);
      });
      actionsRow.appendChild(replyLink);
    }

    // Delete link (only for own comments)
    if (isOwn) {
      var deleteLink = el('button', 'comment-action-btn comment-delete-link');
      deleteLink.appendChild(svgIcon(ICON_DELETE, 14));
      deleteLink.appendChild(document.createTextNode('Delete'));
      deleteLink.addEventListener('click', function() {
        if (!confirm('Delete this comment?')) return;
        deleteLink.disabled = true;
        deleteLink.textContent = 'Deleting...';
        deleteComment(fixtureId, market, comment.id)
          .then(function() {
            // null signals a full refresh after delete (not a reply action)
            if (typeof onReply === 'function') onReply(null);
          })
          .catch(function(e) {
            deleteLink.disabled = false;
            deleteLink.textContent = 'Delete';
            alert(e.message || 'Failed to delete');
          });
      });
      actionsRow.appendChild(deleteLink);
    }

    content.appendChild(actionsRow);

    item.appendChild(content);
    wrapper.appendChild(item);

    // Render replies beneath the parent, indented
    if (replies && replies.length > 0) {
      var repliesWrap = el('div', 'comment-replies');
      replies.forEach(function(reply) {
        repliesWrap.appendChild(renderComment(reply, [], commentVotes, userVotes, fixtureId, market, onReply));
      });
      wrapper.appendChild(repliesWrap);
    }

    return wrapper;
  }

  // ── Unified comment input (handles both comments and replies) ────────────

  function renderCommentInput(fixtureId, market, onSubmit) {
    var replyTarget = null; // { id, author } when replying

    var wrap = el('div', 'comment-input-wrap');
    var id = getIdentity();

    var identityRow = el('div', 'comment-identity');
    var identityPrefix = document.createTextNode('Commenting as ');
    var identityName = el('strong', '', '\u26BD ' + id.footballerName);
    identityName.style.color = hashColor(id.footballerName);
    var shuffleBtn = el('button', 'comment-shuffle-btn', '\u21BB');
    shuffleBtn.setAttribute('aria-label', 'Change name');
    shuffleBtn.setAttribute('title', 'Change name');
    shuffleBtn.addEventListener('click', function() {
      rerollName().then(function(newId) {
        identityName.textContent = '\u26BD ' + newId.footballerName;
        identityName.style.color = hashColor(newId.footballerName);
      });
    });
    identityRow.appendChild(identityPrefix);
    identityRow.appendChild(identityName);
    identityRow.appendChild(shuffleBtn);

    // Reply indicator (hidden by default)
    var replyIndicator = el('div', 'comment-reply-indicator');
    replyIndicator.style.display = 'none';
    var replyText = el('span', 'comment-reply-to');
    var cancelReply = el('button', 'comment-reply-cancel', '\u00D7');
    cancelReply.setAttribute('aria-label', 'Cancel reply');
    cancelReply.addEventListener('click', function() { clearReply(); });
    replyIndicator.appendChild(replyText);
    replyIndicator.appendChild(cancelReply);

    var ta = document.createElement('textarea');
    ta.className = 'comment-textarea';
    ta.placeholder = 'Share your thoughts. You are anonymous.';
    ta.rows = 2;

    var actions = el('div', 'comment-input-actions');
    var charCount = el('span', 'comment-char-count', '0 / 2000');
    var btn = el('button', 'comment-submit-btn', 'Post Comment');
    var errDiv = el('div', 'comment-error');

    ta.addEventListener('input', function() {
      charCount.textContent = ta.value.length + ' / 2000';
      charCount.classList.toggle('over', ta.value.length > 2000);
    });

    function clearReply() {
      replyTarget = null;
      replyIndicator.style.display = 'none';
      ta.placeholder = 'Share your thoughts. You are anonymous.';
      btn.textContent = 'Post Comment';
    }

    function setReply(comment) {
      replyTarget = { id: comment.id, author: comment.author };
      replyText.textContent = 'Replying to \u26BD ' + comment.author;
      replyIndicator.style.display = 'flex';
      ta.placeholder = 'Write a reply...';
      btn.textContent = 'Reply';
      ta.focus();
      wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function doSubmit() {
      var text = ta.value.trim();
      if (!text || btn.disabled) return;
      if (text.length > 2000) {
        errDiv.textContent = 'Comment too long (max 2000 characters)';
        return;
      }
      if (ProfanityFilter.check(text)) {
        errDiv.textContent = ProfanityFilter.MESSAGE;
        return;
      }
      errDiv.textContent = '';
      btn.disabled = true;
      btn.textContent = 'Posting...';
      var parentId = replyTarget ? replyTarget.id : null;
      postComment(fixtureId, market, text, parentId)
        .then(function() {
          ta.value = '';
          charCount.textContent = '0 / 2000';
          btn.disabled = false;
          clearReply();
          if (onSubmit) onSubmit();
        })
        .catch(function(e) {
          errDiv.textContent = e.message || 'Failed to post comment';
          btn.disabled = false;
          btn.textContent = replyTarget ? 'Reply' : 'Post Comment';
        });
    }

    btn.addEventListener('click', doSubmit);
    ta.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        doSubmit();
      }
    });

    actions.appendChild(charCount);
    actions.appendChild(btn);
    wrap.appendChild(identityRow);
    wrap.appendChild(replyIndicator);
    wrap.appendChild(ta);
    wrap.appendChild(actions);
    wrap.appendChild(errDiv);

    // Expose setReply so the comment list can call it
    wrap._setReply = setReply;
    wrap._clearReply = clearReply;
    return wrap;
  }

  // ── Sort helpers ──────────────────────────────────────────────────────────

  function sortComments(comments, commentVotes, mode) {
    var topLevel = comments.filter(function(c) { return !c.parentId; });
    if (mode === 'top') {
      topLevel.sort(function(a, b) {
        var va = commentVotes[a.id] || { up: 0, down: 0 };
        var vb = commentVotes[b.id] || { up: 0, down: 0 };
        return (vb.up - vb.down) - (va.up - va.down);
      });
    } else {
      topLevel.sort(function(a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }
    return topLevel;
  }

  // ── Main render ───────────────────────────────────────────────────────────

  function renderCommentSection(parentEl, fixtureId, market) {
    // Remove existing comment section if re-rendering
    var existing = parentEl.querySelector('.comment-section');
    if (existing) existing.remove();

    var section = el('div', 'comment-section');

    // Loading state
    var loading = el('div', 'comment-loading');
    var spinner = el('span', 'spinner');
    loading.appendChild(spinner);
    loading.appendChild(document.createTextNode(' Loading discussion...'));
    section.appendChild(loading);
    parentEl.appendChild(section);

    // Load dependencies then render
    Promise.all([ensureIdentity(), ProfanityFilter.load()]).then(function() {
      return fetchComments(fixtureId, market).catch(function() {
        return { comments: [], commentVotes: {}, analysisVotes: { up: 0, down: 0 } };
      });
    }).then(function(data) {
      var id = getIdentity();
      return fetchVoteStatus(fixtureId, market, id.visitorId).catch(function() { return {}; })
        .then(function(userVotes) {
          return { data: data, userVotes: userVotes };
        });
    }).then(function(result) {
      var data = result.data;
      var userVotes = result.userVotes;
      var comments = data.comments || [];
      var commentVotes = data.commentVotes || {};
      var analysisVotes = data.analysisVotes || { up: 0, down: 0 };
      var sortMode = 'top';

      section.textContent = '';

      // Analysis vote bar
      var analysisKey = 'analysis:' + fixtureId + ':' + market;
      var analysisUserVote = userVotes[analysisKey] || null;
      section.appendChild(renderAnalysisVoteBar(fixtureId, market, analysisVotes, analysisUserVote));

      // Header with count and sort
      var header = el('div', 'comment-section-header');
      var countSpan = el('span', 'comment-count', comments.filter(function(c) { return !c.parentId; }).length + ' Comments');
      var sortWrap = el('div', 'comment-sort');
      var topBtn = el('button', 'sort-pill active', 'Top');
      var newestBtn = el('button', 'sort-pill', 'Newest');

      // Comment input (rendered first so reply callbacks can reference it)
      var inputWrap = renderCommentInput(fixtureId, market, refreshAll);

      function handleReplyClick(comment) {
        if (!comment) { refreshAll(); return; } // null = delete triggered refresh
        inputWrap._setReply(comment);
      }

      function refreshList() {
        var list = section.querySelector('.comment-list');
        if (list) list.remove();
        var newList = renderCommentList(comments, commentVotes, userVotes, fixtureId, market, sortMode, handleReplyClick);
        // Insert list before the input (which is always last)
        section.insertBefore(newList, inputWrap);
        countSpan.textContent = comments.filter(function(c) { return !c.parentId; }).length + ' Comments';
      }

      function refreshAll() {
        inputWrap._clearReply();
        fetchComments(fixtureId, market).then(function(newData) {
          comments = newData.comments || [];
          commentVotes = newData.commentVotes || {};
          var id = getIdentity();
          return fetchVoteStatus(fixtureId, market, id.visitorId).then(function(newVotes) {
            userVotes = newVotes;
            refreshList();
          });
        });
      }

      newestBtn.addEventListener('click', function() {
        sortMode = 'newest';
        newestBtn.classList.add('active');
        topBtn.classList.remove('active');
        refreshList();
      });
      topBtn.addEventListener('click', function() {
        sortMode = 'top';
        topBtn.classList.add('active');
        newestBtn.classList.remove('active');
        refreshList();
      });

      sortWrap.appendChild(topBtn);
      sortWrap.appendChild(newestBtn);
      header.appendChild(countSpan);
      header.appendChild(sortWrap);
      section.appendChild(header);

      // Comment list then input below
      section.appendChild(renderCommentList(comments, commentVotes, userVotes, fixtureId, market, sortMode, handleReplyClick));
      section.appendChild(inputWrap);
    });
  }

  function renderCommentList(comments, commentVotes, userVotes, fixtureId, market, sortMode, onReply) {
    var list = el('div', 'comment-list');
    var topLevel = sortComments(comments, commentVotes, sortMode);

    if (topLevel.length === 0) {
      var empty = el('div', 'comment-empty', 'No comments yet. Was the analysis spot on or way off? Share your insights!');
      list.appendChild(empty);
      return list;
    }

    var repliesByParent = {};
    comments.forEach(function(c) {
      if (c.parentId) {
        if (!repliesByParent[c.parentId]) repliesByParent[c.parentId] = [];
        repliesByParent[c.parentId].push(c);
      }
    });

    topLevel.forEach(function(comment) {
      var replies = repliesByParent[comment.id] || [];
      replies.sort(function(a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });
      list.appendChild(renderComment(comment, replies, commentVotes, userVotes, fixtureId, market, onReply));
    });

    return list;
  }

  return { render: renderCommentSection };
})();

// Global convenience function
function renderCommentSection(parentEl, fixtureId, market) {
  CommentsModule.render(parentEl, fixtureId, market);
}

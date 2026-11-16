/* Odd Jobs Captain — vanilla JS only, no dependencies */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fineHover = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------- endless strips: the hero photos keep a constant pace ---------- */
  var movingTracks = [];
  var tickerLastTime = 0;
  var tickerElements = document.querySelectorAll('.strip-track, .marquee-track');

  if (!reduceMotion && tickerElements.length) {
    tickerElements.forEach(function (track) {
      var set = track.firstElementChild;
      if (!set) { return; }
      var region = track.closest('.strip-hero, .marquee');
      var item = {
        track: track,
        set: set,
        distance: set.getBoundingClientRect().width,
        position: 0,
        speed: track.classList.contains('strip-track') ? 46 : 34,
        rate: 1,
        targetRate: 1
      };
      if (region && !track.classList.contains('strip-track')) {
        region.addEventListener('pointerenter', function () { item.targetRate = 0.42; });
        region.addEventListener('pointerleave', function () { item.targetRate = 1; });
        region.addEventListener('pointerdown', function () { item.targetRate = 0.28; });
        region.addEventListener('pointerup', function () { item.targetRate = 1; });
        region.addEventListener('focusin', function () { item.targetRate = 0.42; });
        region.addEventListener('focusout', function () { item.targetRate = 1; });
      }
      movingTracks.push(item);
    });

    if (movingTracks.length) {
      var moveTracks = function (time) {
        if (!tickerLastTime) { tickerLastTime = time; }
        var elapsed = Math.min((time - tickerLastTime) / 1000, 0.05);
        tickerLastTime = time;
        movingTracks.forEach(function (item) {
          var nextSet = item.set.nextElementSibling;
          item.distance = nextSet ? nextSet.getBoundingClientRect().left - item.set.getBoundingClientRect().left : item.set.getBoundingClientRect().width;
          item.rate += (item.targetRate - item.rate) * (1 - Math.exp(-elapsed * 3.6));
          if (item.distance <= 0) { return; }
          item.position -= item.speed * item.rate * elapsed;
          if (item.position <= -item.distance) {
            item.position += item.distance * Math.ceil(Math.abs(item.position) / item.distance);
          }
          item.track.style.transform = 'translate3d(' + item.position.toFixed(2) + 'px, 0, 0)';
        });
        requestAnimationFrame(moveTracks);
      };
      requestAnimationFrame(moveTracks);
      document.addEventListener('visibilitychange', function () { tickerLastTime = 0; });
    }
  }

  /* ---------- interactive jobs carousel: buttons, dragging and mobile card snapping ---------- */
  var jobsShell = document.getElementById('jobsCarousel');
  if (jobsShell) {
    var viewport = jobsShell.querySelector('.srow-viewport');
    var track = jobsShell.querySelector('.srow-track');
    var primarySet = track ? track.querySelector('.srow-set') : null;
    var prevBtn = jobsShell.querySelector('.srow-nav--prev');
    var nextBtn = jobsShell.querySelector('.srow-nav--next');
    var cursorEl = document.getElementById('jobsCursor');

    if (viewport && track && primarySet) {
      var cloneSet = primarySet.cloneNode(true);
      cloneSet.setAttribute('aria-hidden', 'true');
      cloneSet.querySelectorAll('a, button').forEach(function (el) {
        el.setAttribute('tabindex', '-1');
      });
      track.appendChild(cloneSet);

      var setWidth = primarySet.getBoundingClientRect().width;
      var pos = 0;
      var stepRemaining = 0;
      var velocity = 0;

      var isPointerDown = false;
      var isDragging = false;
      var activePointerId = null;
      var startX = 0;
      var startY = 0;
      var lastX = 0;
      var lastMoveTime = 0;
      var suppressClickUntil = 0;

      var curX = 0;
      var curY = 0;
      var targetCurX = 0;
      var targetCurY = 0;
      var cursorInitialized = false;
      var cursorInside = false;
      var overNavBtn = false;

      var isMobileCarousel = function () { return window.matchMedia('(max-width: 760px)').matches; };
      var mobileIndex = 0;
      var mobileStartPos = 0;
      var cardCount = primarySet.querySelectorAll('.scard').length;
      var updateMobileButtons = function () {
        if (prevBtn) { prevBtn.disabled = isMobileCarousel() && mobileIndex === 0; }
        if (nextBtn) { nextBtn.disabled = isMobileCarousel() && mobileIndex === cardCount - 1; }
      };
      var goToMobileCard = function (index) {
        mobileIndex = Math.max(0, Math.min(cardCount - 1, index));
        velocity = 0;
        stepRemaining = -mobileIndex * getStepDistance() - pos;
        if (reduceMotion) { pos += stepRemaining; stepRemaining = 0; renderTrack(); }
        updateMobileButtons();
      };

      var measureSet = function () {
        setWidth = primarySet.getBoundingClientRect().width;
      };

      var getStepDistance = function () {
        var c1 = primarySet.querySelector('.scard');
        var c2 = c1 ? c1.nextElementSibling : null;
        if (c1 && c2) {
          var diff = c2.getBoundingClientRect().left - c1.getBoundingClientRect().left;
          if (diff > 40) { return diff; }
        }
        return c1 ? c1.getBoundingClientRect().width + 20 : 360;
      };

      var wrapPosition = function () {
        if (isMobileCarousel() || setWidth <= 0) { return; }
        pos = pos % setWidth;
        if (pos > 0) { pos -= setWidth; }
      };

      var renderTrack = function () {
        wrapPosition();
        track.style.transform = 'translate3d(' + pos.toFixed(2) + 'px, 0, 0)';
      };

      if (prevBtn) {
        prevBtn.addEventListener('click', function () {
          measureSet();
          if (isMobileCarousel()) { goToMobileCard(mobileIndex - 1); return; }
          velocity = 0;
          stepRemaining += getStepDistance();
        });
        prevBtn.addEventListener('pointerenter', function () { overNavBtn = true; updateCursorState(); });
        prevBtn.addEventListener('pointerleave', function () { overNavBtn = false; updateCursorState(); });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          measureSet();
          if (isMobileCarousel()) { goToMobileCard(mobileIndex + 1); return; }
          velocity = 0;
          stepRemaining -= getStepDistance();
        });
        nextBtn.addEventListener('pointerenter', function () { overNavBtn = true; updateCursorState(); });
        nextBtn.addEventListener('pointerleave', function () { overNavBtn = false; updateCursorState(); });
      }

      var updateCursorState = function () {
        if (!cursorEl) { return; }
        var show = fineHover.matches && cursorInside && !overNavBtn;
        cursorEl.classList.toggle('is-visible', show);
        cursorEl.classList.toggle('is-down', isPointerDown && show);
      };

      jobsShell.addEventListener('dragstart', function (e) {
        e.preventDefault();
      });

      jobsShell.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'mouse') {
          var rect = jobsShell.getBoundingClientRect();
          targetCurX = e.clientX - rect.left;
          targetCurY = e.clientY - rect.top;
          if (!cursorInitialized) {
            curX = targetCurX;
            curY = targetCurY;
            cursorInitialized = true;
          }
          cursorInside = true;
          updateCursorState();
        }
      });

      jobsShell.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'mouse') {
          var rect = jobsShell.getBoundingClientRect();
          targetCurX = e.clientX - rect.left;
          targetCurY = e.clientY - rect.top;
          if (!cursorInitialized) {
            curX = targetCurX;
            curY = targetCurY;
            cursorInitialized = true;
          }
          cursorInside = true;
          updateCursorState();
        }
      });

      jobsShell.addEventListener('pointerleave', function (e) {
        if (e.pointerType === 'mouse') {
          cursorInside = false;
          updateCursorState();
        }
      });

      viewport.addEventListener('pointerdown', function (e) {
        if (e.button && e.button !== 0) { return; }
        measureSet();
        isPointerDown = true;
        isDragging = false;
        activePointerId = e.pointerId;
        startX = e.clientX;
        startY = e.clientY;
        lastX = e.clientX;
        lastMoveTime = performance.now();
        velocity = 0;
        stepRemaining = 0;
        if (isMobileCarousel()) {
          mobileStartPos = -mobileIndex * getStepDistance();
        }
        updateCursorState();
      });

      window.addEventListener('pointermove', function (e) {
        if (!isPointerDown || e.pointerId !== activePointerId) { return; }
        var dxTotal = e.clientX - startX;
        var dyTotal = e.clientY - startY;

        if (!isDragging) {
          /* Let vertical page scroll win on touch if user swipes up/down */
          if (e.pointerType === 'touch' && Math.abs(dyTotal) > Math.abs(dxTotal) && Math.abs(dyTotal) > 8) {
            isPointerDown = false;
            activePointerId = null;
            updateCursorState();
            return;
          }
          if (Math.abs(dxTotal) > 6) {
            isDragging = true;
            viewport.classList.add('is-dragging');
          }
        }

        if (isDragging) {
          var now = performance.now();
          var dtMs = Math.max(now - lastMoveTime, 4);
          var stepX = e.clientX - lastX;
          var instVel = (stepX / dtMs) * 1000;
          velocity = velocity * 0.35 + instVel * 0.65;
          pos += stepX;
          if (isMobileCarousel()) {
            var mobileStep = getStepDistance();
            var minPos = Math.max(-(cardCount - 1) * mobileStep, mobileStartPos - mobileStep);
            var maxPos = Math.min(0, mobileStartPos + mobileStep);
            pos = Math.max(minPos, Math.min(maxPos, pos));
          }
          lastX = e.clientX;
          lastMoveTime = now;
          renderTrack();
        }
      });

      var endPointer = function (e) {
        if (!isPointerDown || (e && e.pointerId !== undefined && e.pointerId !== activePointerId)) { return; }
        var now = performance.now();
        if (isDragging) {
          suppressClickUntil = now + 260;
          if (now - lastMoveTime > 90) { velocity = 0; }
          if (isMobileCarousel()) {
            var displacement = pos - mobileStartPos;
            var direction = Math.abs(displacement) > 35 || Math.abs(velocity) > 350
              ? (displacement < 0 ? 1 : -1) : 0;
            goToMobileCard(mobileIndex + direction);
          }
          /* Clamp fling velocity so ease-out feels controlled and smooth */
          if (velocity > 1800) { velocity = 1800; }
          if (velocity < -1800) { velocity = -1800; }
        } else if (isMobileCarousel()) {
          goToMobileCard(mobileIndex);
        }
        isPointerDown = false;
        isDragging = false;
        activePointerId = null;
        viewport.classList.remove('is-dragging');
        updateCursorState();
      };

      window.addEventListener('pointerup', endPointer);
      window.addEventListener('pointercancel', endPointer);

      viewport.addEventListener('click', function (e) {
        if (performance.now() < suppressClickUntil) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);

      // Bring a keyboard-focused service into view on mobile as well.
      primarySet.addEventListener('focusin', function (e) {
        if (!isMobileCarousel()) { return; }
        var card = e.target.closest('.scard');
        if (card) { goToMobileCard(Array.prototype.indexOf.call(primarySet.children, card)); }
      });

      var lastMobileWheel = 0;
      viewport.addEventListener('wheel', function (e) {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 1) {
          e.preventDefault();
          measureSet();
          if (isMobileCarousel()) {
            if (performance.now() - lastMobileWheel > 400) {
              lastMobileWheel = performance.now();
              goToMobileCard(mobileIndex + (e.deltaX > 0 ? 1 : -1));
            }
            return;
          }
          stepRemaining = 0;
          velocity = 0;
          pos -= e.deltaX;
          renderTrack();
        }
      }, { passive: false });

      var lastCarouselTime = 0;
      var tickCarousel = function (ts) {
        if (!lastCarouselTime) { lastCarouselTime = ts; }
        var dt = Math.min((ts - lastCarouselTime) / 1000, 0.05);
        lastCarouselTime = ts;

        if (setWidth <= 0) { measureSet(); }

        /* 1. Side-arrow single-card ease-out glide */
        if (Math.abs(stepRemaining) > 0.2) {
          var stepPull = stepRemaining * (1 - Math.exp(-dt * 8.2));
          pos += stepPull;
          stepRemaining -= stepPull;
        } else if (stepRemaining !== 0) {
          pos += stepRemaining;
          stepRemaining = 0;
        }

        /* 2. Drag release ease-out momentum */
        if (!isDragging && Math.abs(velocity) > 2) {
          pos += velocity * dt;
          velocity *= Math.exp(-dt * 4.4);
        } else if (!isDragging) {
          velocity = 0;
        }

        renderTrack();

        /* 4. Smooth circle mouse follower */
        if (cursorEl && cursorInitialized && fineHover.matches) {
          var ease = 1 - Math.exp(-dt * 20);
          curX += (targetCurX - curX) * ease;
          curY += (targetCurY - curY) * ease;
          cursorEl.style.transform = 'translate3d(' + curX.toFixed(1) + 'px, ' + curY.toFixed(1) + 'px, 0)';
        }

        requestAnimationFrame(tickCarousel);
      };

      window.addEventListener('resize', function () {
        measureSet();
        if (isMobileCarousel()) { pos = -mobileIndex * getStepDistance(); stepRemaining = 0; velocity = 0; renderTrack(); }
        updateMobileButtons();
      });
      updateMobileButtons();
      window.addEventListener('load', measureSet);
      document.addEventListener('visibilitychange', function () { lastCarouselTime = 0; });
      requestAnimationFrame(tickCarousel);
    }
  }

  /* ---------- footer year ---------- */
  var year = document.getElementById('year');
  if (year) { year.textContent = new Date().getFullYear(); }

  var head = document.getElementById('siteHead');
  var progress = document.getElementById('progress');

  /* ---------- mobile nav ---------- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    var setNav = function (open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () {
      setNav(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { setNav(false); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setNav(false); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1000) { setNav(false); }
    });
  }

  /* ---------- reveal / rise on enter ---------- */
  var items = document.querySelectorAll('.reveal, .stagger, .rise');
  if ('IntersectionObserver' in window && items.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- counters ---------- */
  var counters = document.querySelectorAll('[data-count]');
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

  var runCount = function (el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = prefix + target + suffix; return; }
    var start = null;
    var dur = 1200;
    var step = function (ts) {
      if (start === null) { start = ts; }
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = prefix + Math.round(easeOut(p) * target) + suffix;
      if (p < 1) { requestAnimationFrame(step); }
    };
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCount(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- scroll header & progress ---------- */
  var ticking = false;
  var onScroll = function () {
    if (ticking) { return; }
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset;
      if (head) { head.classList.toggle('is-stuck', y > 12); }
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      }
      ticking = false;
    });
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- gentle hero intro ---------- */
  var hero = document.querySelector('.hero, .page-hero');
  if (hero) { requestAnimationFrame(function () { hero.classList.add('is-in'); }); }
})();

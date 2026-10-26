// Theme toggle and "On this page" scroll-spy. No dependencies.
(function () {
  var root = document.documentElement
  var release = document.body.getAttribute('data-release') || 'index'

  // Custom Google Analytics events. No-op when the tag is not loaded (dev server).
  function track(name, params) {
    if (typeof window.gtag === 'function') {
      params = params || {}
      params.release = release
      window.gtag('event', name, params)
    }
  }
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null

  function current() {
    var set = root.getAttribute('data-theme')
    if (set === 'dark' || set === 'light') return set
    return media && media.matches ? 'dark' : 'light'
  }

  var toggle = document.querySelector('.theme-toggle')
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark'
      root.setAttribute('data-theme', next)
      try { localStorage.setItem('theme', next) } catch (e) { /* storage unavailable, choice lasts for this page only */ }
      track('theme_toggle', { theme: next })
    })
  }

  // On narrow screens the rail is hidden, so its action buttons move into the
  // release header as a horizontal row. The same nodes move back when the
  // viewport widens, so their event listeners stay attached.
  var railActions = document.querySelector('.rail .rail-actions')
  var railHost = railActions && railActions.parentNode
  var headerHost = document.querySelector('.release-head')
  var narrow = window.matchMedia ? window.matchMedia('(max-width: 900px)') : null
  function placeActions() {
    if (!railActions || !headerHost || !narrow) return
    var target = narrow.matches ? headerHost : railHost
    if (railActions.parentNode !== target) target.appendChild(railActions)
  }
  if (narrow) {
    placeActions()
    if (narrow.addEventListener) narrow.addEventListener('change', placeActions)
    else if (narrow.addListener) narrow.addListener(placeActions)
  }

  // Share menu: builds each network's share URL from the page URL plus a
  // generated message, where the network accepts one.
  var share = document.querySelector('.share')
  if (share) {
    var shareToggle = share.querySelector('.share-toggle')
    var shareMenu = share.querySelector('.share-menu')
    var pageUrl = location.origin + location.pathname
    var message = shareMenu.getAttribute('data-message') || document.title
    var subject = shareMenu.getAttribute('data-subject') || document.title
    var enc = encodeURIComponent
    var urls = {
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + enc(pageUrl),
      x: 'https://x.com/intent/post?text=' + enc(message) + '&url=' + enc(pageUrl),
      linkedin: 'https://www.linkedin.com/feed/?shareActive=true&text=' + enc(message + ' ' + pageUrl),
      whatsapp: 'https://wa.me/?text=' + enc(message + ' ' + pageUrl),
      telegram: 'https://t.me/share/url?url=' + enc(pageUrl) + '&text=' + enc(message),
      email: 'mailto:?subject=' + enc(subject) + '&body=' + enc(message + '\n\n' + pageUrl),
      sms: 'sms:?&body=' + enc(message + ' ' + pageUrl)
    }
    Array.prototype.forEach.call(shareMenu.querySelectorAll('a[data-share]'), function (a) {
      var key = a.getAttribute('data-share')
      if (urls[key]) a.setAttribute('href', urls[key])
      if (key === 'email' || key === 'sms') a.removeAttribute('target')
    })
    function setOpen(open) {
      shareMenu.hidden = !open
      shareToggle.setAttribute('aria-expanded', open ? 'true' : 'false')
    }
    shareToggle.addEventListener('click', function () { setOpen(shareMenu.hidden) })
    document.addEventListener('click', function (e) { if (!share.contains(e.target)) setOpen(false) })
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setOpen(false); shareToggle.focus() } })
    shareMenu.addEventListener('click', function (e) {
      var item = e.target.closest('a[data-share]')
      if (!item) return
      track('share', { method: item.getAttribute('data-share'), content_type: 'release' })
      setOpen(false)
    })
  }

  // "Did this page help you?": one vote per release per browser, remembered in
  // localStorage; each vote (and any change of mind) goes to analytics.
  var feedback = document.querySelector('[data-feedback]')
  if (feedback) {
    var key = 'feedback:' + release
    var buttons = Array.prototype.slice.call(feedback.querySelectorAll('.feedback-btn'))
    var thanks = feedback.querySelector('.feedback-thanks')
    function readVote() { try { return localStorage.getItem(key) } catch (e) { return null } }
    function showVote(vote) {
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-vote') === vote ? 'true' : 'false') })
      thanks.hidden = !vote
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var vote = b.getAttribute('data-vote')
        var previous = readVote()
        if (previous === vote) return
        try { localStorage.setItem(key, vote) } catch (e) { /* vote still counts for this visit */ }
        showVote(vote)
        track('page_feedback', previous ? { helpful: vote, changed_from: previous } : { helpful: vote })
      })
    })
    showVote(readVote())
  }

  // "More actions" menu: open the markdown export in an AI assistant.
  var actions = document.querySelector('.actions')
  if (actions) {
    var actionsToggle = actions.querySelector('.actions-toggle')
    var actionsMenu = actions.querySelector('.actions-menu')
    function setActionsOpen(open) {
      actionsMenu.hidden = !open
      actionsToggle.setAttribute('aria-expanded', open ? 'true' : 'false')
    }
    actionsToggle.addEventListener('click', function () { setActionsOpen(actionsMenu.hidden) })
    document.addEventListener('click', function (e) { if (!actions.contains(e.target)) setActionsOpen(false) })
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setActionsOpen(false) })
    actionsMenu.addEventListener('click', function (e) {
      var item = e.target.closest('a[data-action]')
      if (!item) return
      track('open_in_ai', { assistant: item.getAttribute('data-action') })
      setActionsOpen(false)
    })
  }

  var exportLink = document.querySelector('.rail-actions .export-link')
  if (exportLink) exportLink.addEventListener('click', function () { track('view_markdown') })

  // Auto-advancing groups: one item active at a time, moving on every few
  // seconds. Clicking a trigger selects its item and stops the auto-advance
  // for the rest of the page view. Reduced motion: no auto-advance.
  var noMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  function autoAdvance(triggers, panels, onSelect) {
    if (triggers.length < 2) return
    var active = 0
    var timer = null
    function show(index) {
      active = index
      triggers.forEach(function (t, i) { t.setAttribute('aria-pressed', i === index ? 'true' : 'false') })
      panels.forEach(function (p, i) { p.hidden = i !== index })
    }
    function stop() { if (timer) { clearInterval(timer); timer = null } }
    triggers.forEach(function (t, i) {
      t.addEventListener('click', function () {
        stop()
        show(i)
        onSelect(t, i)
      })
    })
    // Decode every image up front so a change never waits on a decode.
    panels.forEach(function (p) { if (p.decode) p.decode().catch(function () { /* shown undecoded */ }) })
    if (!noMotion) timer = setInterval(function () { show((active + 1) % triggers.length) }, 4000)
  }
  function all(root, selector) { return Array.prototype.slice.call(root.querySelectorAll(selector)) }

  // Carousel list: the list on the left drives the image on the right.
  all(document, '[data-carousel-list]').forEach(function (list) {
    autoAdvance(all(list, '.carousel-list-trigger'), all(list, '.carousel-list-image'), function (t) {
      track('carousel_list_select', { item: t.textContent.trim().slice(0, 100) })
    })
  })

  // Image carousel: dots under the frame pick the image.
  all(document, '[data-image-carousel]').forEach(function (carousel) {
    autoAdvance(all(carousel, '.image-carousel-dot'), all(carousel, '.image-carousel-image'), function (t, i) {
      track('image_carousel_select', { index: i + 1 })
    })
  })

  // Cover parallax: as the frame scrolls up and off the page, the image inside
  // drifts down at a fraction of the scroll, so it lags the page slightly.
  // Scrolling back up reverses it. The gap this opens at the top of the frame
  // is smaller than the distance the frame has scrolled, so it is never visible.
  var hero = document.querySelector('[data-parallax] .hero')
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (hero && !reduceMotion) {
    var frame = hero.parentNode
    var ticking = false
    function parallax() {
      ticking = false
      var height = frame.offsetHeight
      if (!height) return
      var scrolled = Math.min(Math.max(-frame.getBoundingClientRect().top, 0), height)
      var shift = scrolled * 0.15
      hero.style.setProperty('--parallax', shift.toFixed(1) + 'px')
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(parallax) }
    }, { passive: true })
    window.addEventListener('resize', parallax)
    parallax()
  }

  // The copy-link buttons beside headings are React islands (client/islands.jsx).

  // Arriving on a section link, or following one in the rail, flashes that
  // section. Removing and re-adding the class restarts the animation.
  function flashSection() {
    var id = location.hash ? decodeURIComponent(location.hash.slice(1)) : ''
    var heading = id && document.getElementById(id)
    var section = heading && heading.closest('.section')
    if (!section) return
    section.classList.remove('is-target')
    void section.offsetWidth
    section.classList.add('is-target')
    setTimeout(function () { section.classList.remove('is-target') }, 2600)
  }
  flashSection()
  window.addEventListener('hashchange', flashSection)

  // "What's new" carousel: two cards per view on desktop, one on narrow screens.
  // Moves one card per click, never loops, hides a button when it cannot act.
  Array.prototype.forEach.call(document.querySelectorAll('.carousel'), function (carousel) {
    var strip = carousel.querySelector('.carousel-track')
    var prev = carousel.querySelector('.carousel-prev')
    var next = carousel.querySelector('.carousel-next')
    if (!strip || !prev || !next) return
    var cards = Array.prototype.slice.call(strip.children)
    var index = 0

    function perView() {
      var v = parseInt(getComputedStyle(carousel).getPropertyValue('--per-view'), 10)
      return v > 0 ? v : 1
    }
    function maxIndex() { return Math.max(0, cards.length - perView()) }
    function step() {
      if (!cards.length) return 0
      var gap = parseFloat(getComputedStyle(strip).columnGap || getComputedStyle(strip).gap) || 0
      return cards[0].getBoundingClientRect().width + gap
    }
    function render() {
      if (index > maxIndex()) index = maxIndex()
      strip.style.transform = 'translateX(' + (-index * step()) + 'px)'
      prev.hidden = index <= 0
      next.hidden = index >= maxIndex()
    }

    prev.addEventListener('click', function () { if (index > 0) { index -= 1; render(); track('carousel_nav', { direction: 'previous' }) } })
    next.addEventListener('click', function () { if (index < maxIndex()) { index += 1; render(); track('carousel_nav', { direction: 'next' }) } })
    window.addEventListener('resize', render)
    render()
  })

  var links = Array.prototype.slice.call(document.querySelectorAll('.rail a[href^="#"]'))
  var headings = Array.prototype.slice.call(document.querySelectorAll('main .content h2[id]'))
  if (!links.length || !headings.length || !('IntersectionObserver' in window)) return

  var byId = {}
  links.forEach(function (a) {
    var id = decodeURIComponent(a.getAttribute('href').slice(1))
    byId[id] = a
    a.addEventListener('click', function () { track('toc_click', { section: a.textContent.trim(), section_id: id }) })
  })
  var visible = {}

  function update() {
    var top = null
    for (var i = 0; i < headings.length; i++) {
      if (visible[headings[i].id]) { top = headings[i].id; break }
    }
    if (top === null) {
      // Nothing in view: highlight the last heading that has scrolled past the top.
      for (var j = headings.length - 1; j >= 0; j--) {
        if (headings[j].getBoundingClientRect().top < 100) { top = headings[j].id; break }
      }
    }
    links.forEach(function (a) { a.classList.remove('active') })
    if (top !== null && byId[top]) byId[top].classList.add('active')
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting })
    update()
  }, { rootMargin: '-72px 0px -60% 0px', threshold: 0 })
  headings.forEach(function (h) { observer.observe(h) })
  update()
})()

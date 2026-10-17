// Theme toggle and "On this page" scroll-spy. No dependencies.
(function () {
  var root = document.documentElement
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
    })
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
    shareMenu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false) })
  }

  // "What's new" carousel: two cards per view on desktop, one on narrow screens.
  // Moves one card per click, never loops, hides a button when it cannot act.
  Array.prototype.forEach.call(document.querySelectorAll('.carousel'), function (carousel) {
    var track = carousel.querySelector('.carousel-track')
    var prev = carousel.querySelector('.carousel-prev')
    var next = carousel.querySelector('.carousel-next')
    if (!track || !prev || !next) return
    var cards = Array.prototype.slice.call(track.children)
    var index = 0

    function perView() {
      var v = parseInt(getComputedStyle(carousel).getPropertyValue('--per-view'), 10)
      return v > 0 ? v : 1
    }
    function maxIndex() { return Math.max(0, cards.length - perView()) }
    function step() {
      if (!cards.length) return 0
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0
      return cards[0].getBoundingClientRect().width + gap
    }
    function render() {
      if (index > maxIndex()) index = maxIndex()
      track.style.transform = 'translateX(' + (-index * step()) + 'px)'
      prev.hidden = index <= 0
      next.hidden = index >= maxIndex()
    }

    prev.addEventListener('click', function () { if (index > 0) { index -= 1; render() } })
    next.addEventListener('click', function () { if (index < maxIndex()) { index += 1; render() } })
    window.addEventListener('resize', render)
    render()
  })

  var links = Array.prototype.slice.call(document.querySelectorAll('.rail a[href^="#"]'))
  var headings = Array.prototype.slice.call(document.querySelectorAll('main .content h2[id]'))
  if (!links.length || !headings.length || !('IntersectionObserver' in window)) return

  var byId = {}
  links.forEach(function (a) { byId[decodeURIComponent(a.getAttribute('href').slice(1))] = a })
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

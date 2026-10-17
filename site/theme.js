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

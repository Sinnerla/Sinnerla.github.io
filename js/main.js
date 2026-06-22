/* =========================================
   Pure Theme - Main JavaScript
   ========================================= */

(function () {
  "use strict";

  var html = document.documentElement;

  // --- Header scroll background ---
  var siteHeader = document.querySelector('.site-header');
  var headerScrollTicking = false;
  function updateHeaderBg() {
    if (siteHeader) {
      if (window.scrollY > 10) {
        siteHeader.classList.add('scrolled');
      } else {
        siteHeader.classList.remove('scrolled');
      }
    }
    headerScrollTicking = false;
  }
  window.addEventListener('scroll', function () {
    if (!headerScrollTicking) {
      requestAnimationFrame(updateHeaderBg);
      headerScrollTicking = true;
    }
  });
  updateHeaderBg();


  // --- Dark Mode ---
  var darkToggle = document.getElementById("darkModeToggle");

  function getDarkMode() {
    var stored = localStorage.getItem("pure-theme-dark-mode");
    if (stored === "dark") return "dark";
    if (stored === "light") return "light";
    return "auto";
  }

  function applyDarkMode(mode, noStore) {
    if (!noStore) {
      localStorage.setItem("pure-theme-dark-mode", mode);
    }
    if (mode === "dark") {
      html.classList.add("dark-mode");
    } else if (mode === "light") {
      html.classList.remove("dark-mode");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        html.classList.add("dark-mode");
      } else {
        html.classList.remove("dark-mode");
      }
    }
  }

  var colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  colorSchemeQuery.addEventListener("change", function () {
    if (getDarkMode() === "auto") {
      applyDarkMode("auto");
    }
  });

  var currentMode = getDarkMode();
  if (currentMode === "dark") {
    html.classList.add("dark-mode");
  } else if (currentMode === "light") {
    html.classList.remove("dark-mode");
  }

  if (darkToggle) {
    darkToggle.addEventListener("click", function () {
      var current = getDarkMode();
      var next;
      if (current === "dark") {
        next = "light";
      } else if (current === "light") {
        next = "auto";
      } else {
        next = "dark";
      }
      applyDarkMode(next);
    });
  }

  // --- Search ---
  var searchInput = document.getElementById('searchInput');
  var searchDropdown = document.getElementById('searchDropdown');
  var searchData = [];
  var searchLoaded = false;
  var searchSelectedIndex = -1;

  function loadSearchData() {
    if (searchLoaded) return;
    searchLoaded = true;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/search.json', true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          searchData = JSON.parse(xhr.responseText);
        } catch (e) { searchData = []; }
      }
    };
    xhr.send();
  }

  function fuzzyMatch(text, query) {
    text = text.toLowerCase();
    query = query.toLowerCase();
    var qi = 0;
    for (var i = 0; i < text.length && qi < query.length; i++) {
      if (text[i] === query[qi]) qi++;
    }
    return qi === query.length;
  }

  function doSearch(query) {
    searchDropdown.innerHTML = '';
    searchSelectedIndex = -1;
    if (!query || query.length < 1) {
      searchDropdown.classList.remove('active');
      return;
    }
    var results = [];
    for (var i = 0; i < searchData.length; i++) {
      var post = searchData[i];
      var score = 0;
      if (fuzzyMatch(post.title, query)) score += 100;
      if (post.title.toLowerCase().indexOf(query.toLowerCase()) !== -1) score += 50;
      if (post.categories.some(function (c) { return c.toLowerCase().indexOf(query.toLowerCase()) !== -1; })) score += 20;
      if (post.tags.some(function (t) { return t.toLowerCase().indexOf(query.toLowerCase()) !== -1; })) score += 10;
      if (post.excerpt && post.excerpt.toLowerCase().indexOf(query.toLowerCase()) !== -1) score += 5;
      if (score > 0) {
        results.push({ post: post, score: score });
      }
    }
    results.sort(function (a, b) { return b.score - a.score; });
    results = results.slice(0, 8);

    if (results.length === 0) {
      searchDropdown.innerHTML = '<div class="search-dropdown-empty">No results found</div>';
    } else {
      for (var j = 0; j < results.length; j++) {
        var item = results[j];
        var div = document.createElement('div');
        div.className = 'search-dropdown-item';
        div.setAttribute('data-index', j);
        div.setAttribute('data-path', item.post.path);
        div.innerHTML = '<div class="search-dropdown-title">' + escapeHtml(item.post.title) + '</div>' +
          '<div class="search-dropdown-meta">' + escapeHtml(item.post.date) + ' &middot; ' + escapeHtml(item.post.categories.join(', ') || 'uncategorized') + '</div>';
        div.addEventListener('click', function () {
          var path = this.getAttribute('data-path');
          if (path) window.location.href = '/' + path;
        });
        searchDropdown.appendChild(div);
      }
    }
    searchDropdown.classList.add('active');
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  if (searchInput) {
    // Load search data on first focus
    searchInput.addEventListener('focus', loadSearchData);

    searchInput.addEventListener('input', function () {
      doSearch(this.value.trim());
    });

    searchInput.addEventListener('keydown', function (e) {
      var items = searchDropdown.querySelectorAll('.search-dropdown-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        searchSelectedIndex = Math.min(searchSelectedIndex + 1, items.length - 1);
        updateSearchSelection(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        searchSelectedIndex = Math.max(searchSelectedIndex - 1, 0);
        updateSearchSelection(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (searchSelectedIndex >= 0 && items[searchSelectedIndex]) {
          var path = items[searchSelectedIndex].getAttribute('data-path');
          if (path) window.location.href = '/' + path;
        }
      } else if (e.key === 'Escape') {
        searchDropdown.classList.remove('active');
        searchInput.blur();
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.remove('active');
      }
    });
  }

  function updateSearchSelection(items) {
    items.forEach(function (item, i) {
      if (i === searchSelectedIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  // --- Mobile Nav ---
  var mobileToggle = document.querySelector(".mobile-nav-toggle");
  var mobilePanel = document.querySelector(".mobile-nav-panel");

  if (mobileToggle && mobilePanel) {
    mobileToggle.addEventListener("click", function () {
      var isOpen = mobileToggle.classList.contains("open");
      if (isOpen) {
        mobileToggle.classList.remove("open");
        mobilePanel.classList.remove("open");
      } else {
        mobileToggle.classList.add("open");
        mobilePanel.classList.add("open");
      }
    });

    document.addEventListener("click", function (e) {
      if (!mobileToggle.contains(e.target) && !mobilePanel.contains(e.target)) {
        mobileToggle.classList.remove("open");
        mobilePanel.classList.remove("open");
      }
    });
  }

  // --- Active Nav Link ---
  var currentPath = window.location.pathname;
  var navLinks = document.querySelectorAll(".header-nav a, .mobile-nav a");
  navLinks.forEach(function (link) {
    var href = link.getAttribute("href");
    if (href && currentPath.startsWith(href) && href !== "/") {
      link.classList.add("active");
    } else if (href === "/" && currentPath === "/") {
      link.classList.add("active");
    }
  });

  // --- TOC Scroll Spy ---
  var toc = document.getElementById("postToc");
  if (toc) {
    var tocLinks = toc.querySelectorAll("a");
    var headings = [];
    tocLinks.forEach(function (link) {
      var href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        var el = document.getElementById(href.slice(1));
        if (el) {
          headings.push({ el: el, link: link });
        }
      }
    });

    if (headings.length > 0) {
      var tocTicking = false;
      function updateToc() {
        var scrollPos = window.scrollY + 120;
        var current = null;
        for (var i = headings.length - 1; i >= 0; i--) {
          if (headings[i].el.offsetTop <= scrollPos) {
            current = headings[i];
            break;
          }
        }
        tocLinks.forEach(function (l) { l.classList.remove("active"); });
        if (current) current.link.classList.add("active");
        tocTicking = false;
      }

      window.addEventListener("scroll", function () {
        if (!tocTicking) {
          requestAnimationFrame(updateToc);
          tocTicking = true;
        }
      });
      updateToc();
    }
  }

  // --- Homepage: Hero Scroll ---
  var heroEl = document.getElementById("hero");
  var featuredEl = document.getElementById("featured");
  var scrollHint = document.getElementById("scrollHint");
  var heroContent = document.getElementById("heroContent");

  if (heroEl && featuredEl) {
    // Click scroll-hint arrow to smoothly scroll to featured section
    if (scrollHint) {
      scrollHint.addEventListener("click", function () {
        var headerH = 56; // approximate header height
        var targetY = featuredEl.offsetTop - headerH;
        window.scrollTo({ top: targetY, behavior: "smooth" });
      });
    }

    // Hero content fades out as user scrolls down
    var scrollTicking = false;
    function onHomeScroll() {
      var sy = window.scrollY;
      var heroH = heroEl.offsetHeight;
      var maxFade = heroH * 0.5;

      // Fade hero content + slight translate up
      var fade = Math.min(sy / maxFade, 1);
      if (heroContent) {
        heroContent.style.opacity = (1 - fade).toFixed(3);
        heroContent.style.transform = "translateY(" + (fade * 30) + "px)";
      }

      // Parallax on background image (not video)
      var heroBg = heroEl.querySelector(".hero-bg:not(video)");
      if (heroBg) {
        heroBg.style.transform = "translateY(" + (sy * 0.3) + "px)";
      }

      scrollTicking = false;
    }

    window.addEventListener("scroll", function () {
      if (!scrollTicking) {
        requestAnimationFrame(onHomeScroll);
        scrollTicking = true;
      }
    });

    onHomeScroll();

    // On non-home pages, reset opacity
  } else if (heroContent) {
    heroContent.style.opacity = "1";
    heroContent.style.transform = "none";
  }

})();



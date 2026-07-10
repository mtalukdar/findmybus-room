(function () {
  "use strict";

  var input = document.getElementById("searchInput");
  var btn = document.getElementById("searchBtn");
  var suggestionsEl = document.getElementById("suggestions");
  var notFoundEl = document.getElementById("notFound");
  var resultEl = document.getElementById("result");
  var nameEl = document.getElementById("resultName");
  var deptEl = document.getElementById("resultDept");
  var transportEl = document.getElementById("resultTransport");
  var roomEl = document.getElementById("resultRoom");
  var transportImg = document.getElementById("transportImg");
  var activeIndex = -1;
  var currentMatches = [];

  function norm(s) {
    return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function search(query) {
    var q = norm(query);
    if (!q) return [];
    var starts = [], words = [], contains = [];
    DATA.forEach(function (p) {
      var n = norm(p.name);
      if (n.indexOf(q) === 0) starts.push(p);
      else if (n.split(" ").some(function (w) { return w.indexOf(q) === 0; })) words.push(p);
      else if (n.indexOf(q) !== -1) contains.push(p);
    });
    return starts.concat(words, contains);
  }

  function highlight(name, query) {
    var q = norm(query);
    var idx = norm(name).indexOf(q);
    if (idx === -1 || !q) return escapeHtml(name);
    return escapeHtml(name.slice(0, idx)) +
      "<mark>" + escapeHtml(name.slice(idx, idx + q.length)) + "</mark>" +
      escapeHtml(name.slice(idx + q.length));
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderSuggestions() {
    suggestionsEl.innerHTML = "";
    activeIndex = -1;
    currentMatches.slice(0, 8).forEach(function (p, i) {
      var li = document.createElement("li");
      li.innerHTML = '<span class="s-name">' + highlight(p.name, input.value) + "</span>" +
        '<span class="s-dept">' + escapeHtml(p.dept) + "</span>";
      li.addEventListener("mousedown", function (e) {
        e.preventDefault();
        select(p);
      });
      suggestionsEl.appendChild(li);
    });
  }

  function clearSuggestions() {
    suggestionsEl.innerHTML = "";
    activeIndex = -1;
  }

  function transportArt(t) {
    var s = t.toLowerCase();
    if (s.indexOf("microbus") === 0) return "microbus.svg";
    if (s.indexOf("car") === 0) return "car.svg";
    return "bus.svg";
  }

  function select(person) {
    input.value = person.name;
    clearSuggestions();
    notFoundEl.hidden = true;

    nameEl.textContent = "🎊 " + person.name + " 🎊";
    deptEl.textContent = person.dept ? "BU: " + person.dept : "BJIT";
    transportEl.textContent = "🚌 " + person.transport;
    roomEl.textContent = "🔑 Room " + person.room;
    transportImg.src = transportArt(person.transport);

    resultEl.hidden = false;
    resultEl.classList.remove("show");
    void resultEl.offsetWidth; // restart animations
    resultEl.classList.add("show");
    resultEl.scrollIntoView({ behavior: "smooth", block: "center" });

    launchConfetti();
  }

  function doSearch() {
    var matches = search(input.value);
    clearSuggestions();
    if (matches.length) {
      select(matches[0]);
    } else {
      resultEl.hidden = true;
      notFoundEl.hidden = !norm(input.value);
    }
  }

  input.addEventListener("input", function () {
    notFoundEl.hidden = true;
    currentMatches = search(input.value);
    renderSuggestions();
  });

  input.addEventListener("keydown", function (e) {
    var items = suggestionsEl.children;
    if (e.key === "ArrowDown" && items.length) {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      setActive(items);
    } else if (e.key === "ArrowUp" && items.length) {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      setActive(items);
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && currentMatches[activeIndex]) {
        select(currentMatches[activeIndex]);
      } else {
        doSearch();
      }
    } else if (e.key === "Escape") {
      clearSuggestions();
    }
  });

  function setActive(items) {
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle("active", i === activeIndex);
    }
  }

  input.addEventListener("blur", function () {
    setTimeout(clearSuggestions, 150);
  });

  btn.addEventListener("click", doSearch);

  /* ---------------- confetti ---------------- */
  var canvas = document.getElementById("confettiCanvas");
  var ctx = canvas.getContext("2d");
  var pieces = [];
  var rafId = null;
  var COLORS = ["#1976d2", "#0d47a1", "#ffb300", "#ffca28", "#43a047", "#e53935", "#8e24aa", "#00acc1"];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  function launchConfetti() {
    var n = 140;
    for (var i = 0; i < n; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.4,
        w: 6 + Math.random() * 8,
        h: 8 + Math.random() * 10,
        vy: 2 + Math.random() * 3.5,
        vx: -1.5 + Math.random() * 3,
        rot: Math.random() * Math.PI * 2,
        vr: -0.12 + Math.random() * 0.24,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 0
      });
    }
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(function (p) {
      p.x += p.vx + Math.sin(p.life / 12) * 1.2;
      p.y += p.vy;
      p.rot += p.vr;
      p.life++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    pieces = pieces.filter(function (p) { return p.y < canvas.height + 30; });
    if (pieces.length) {
      rafId = requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      rafId = null;
    }
  }
})();

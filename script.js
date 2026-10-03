// ================= app.js (use ONLY this file) =================
(function () {
  function init() {
    const $ = (id) => document.getElementById(id);
    const on = (el, ev, fn, opt) => { if (el) el.addEventListener(ev, fn, opt); };

    // ---------- THEME ----------
    let particleRGB = "108,140,255";
    const themeToggle = $("themeToggle");
    function readParticleColor() {
      particleRGB = getComputedStyle(document.documentElement).getPropertyValue("--particle").trim() || particleRGB;
    }
    function setTheme(t) {
      document.documentElement.setAttribute("data-theme", t);
      if (themeToggle) themeToggle.textContent = t === "dark" ? "🌙" : "☀️";
      try { localStorage.setItem("theme", t); } catch (e) {}
      readParticleColor();
    }
    let savedTheme = "dark";
    try { savedTheme = localStorage.getItem("theme") || "dark"; } catch (e) {}
    setTheme(savedTheme);
    on(themeToggle, "click", () =>
      setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"));

    // ---------- PARTICLE BACKGROUND ----------
    const bgCanvas = $("bgCanvas");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = { x: -9999, y: -9999 };
    let W = 0, H = 0, particles = [];
    if (bgCanvas) {
      bgCanvas.style.pointerEvents = "none";   // never block clicks on the page
      const bctx = bgCanvas.getContext("2d");

      const resizeBg = () => {
        W = bgCanvas.width = window.innerWidth;
        H = bgCanvas.height = window.innerHeight;
        const count = Math.min(70, Math.floor((W * H) / 18000));
        particles = Array.from({ length: count }, () => ({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 2 + 1,
        }));
      };
      window.addEventListener("resize", resizeBg);
      window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

      const drawBg = () => {
        bctx.clearRect(0, 0, W, H);
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1;
          if (p.y < 0 || p.y > H) p.vy *= -1;

          const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
          const md = Math.hypot(mdx, mdy);
          if (md < 120 && md > 0) { p.x += (mdx / md) * 1.6; p.y += (mdy / md) * 1.6; }
          if (md < 160) {
            bctx.strokeStyle = "rgba(" + particleRGB + "," + (0.35 * (1 - md / 160)) + ")";
            bctx.beginPath(); bctx.moveTo(p.x, p.y); bctx.lineTo(mouse.x, mouse.y); bctx.stroke();
          }
          bctx.fillStyle = "rgba(" + particleRGB + ",0.6)";
          bctx.beginPath(); bctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); bctx.fill();

          for (let j = i + 1; j < particles.length; j++) {
            const q = particles[j];
            const d = Math.hypot(p.x - q.x, p.y - q.y);
            if (d < 120) {
              bctx.strokeStyle = "rgba(" + particleRGB + "," + (0.25 * (1 - d / 120)) + ")";
              bctx.beginPath(); bctx.moveTo(p.x, p.y); bctx.lineTo(q.x, q.y); bctx.stroke();
            }
          }
        }
        if (!reduceMotion) requestAnimationFrame(drawBg);
      };
      resizeBg();
      drawBg();
    }

    // ---------- TYPING EFFECT ----------
    const typedEl = $("typed");
    if (typedEl) {
      const lines = ["Upload an MRI scan.", "Highlight tumor-like regions.", "Everything runs in your browser."];
      let lineIdx = 0, charIdx = 0, deleting = false;
      const typeLoop = () => {
        const text = lines[lineIdx];
        typedEl.textContent = text.slice(0, charIdx);
        let delay = deleting ? 30 : 60;
        if (!deleting && charIdx === text.length) { deleting = true; delay = 1400; }
        else if (deleting && charIdx === 0) { deleting = false; lineIdx = (lineIdx + 1) % lines.length; delay = 300; }
        charIdx += deleting ? -1 : 1;
        setTimeout(typeLoop, delay);
      };
      if (reduceMotion) typedEl.textContent = lines[0]; else typeLoop();
    }

    // ---------- SCROLL ----------
    const progressEl = $("scrollProgress");
    const navbar = $("navbar");
    on(window, "scroll", () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressEl) progressEl.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
      if (navbar) navbar.classList.toggle("scrolled", window.scrollY > 10);
    });

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("visible"); revealObserver.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

    // ---------- 3D TILT ----------
    document.querySelectorAll(".tilt").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "perspective(700px) rotateY(" + x * 14 + "deg) rotateX(" + -y * 14 + "deg) translateY(-4px)";
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });

    // ---------- BUTTON RIPPLE ----------
    document.querySelectorAll(".btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const r = btn.getBoundingClientRect();
        const size = Math.max(r.width, r.height);
        const dot = document.createElement("span");
        dot.className = "ripple";
        dot.style.width = dot.style.height = size + "px";
        dot.style.left = e.clientX - r.left - size / 2 + "px";
        dot.style.top = e.clientY - r.top - size / 2 + "px";
        btn.appendChild(dot);
        setTimeout(() => dot.remove(), 600);
      });
    });

    // ---------- TEAM MEMBER POPUP ----------
    // Fill in each person's details between the quotes.
    // Leave a field as "" (or [] for hobbies) to hide it.
    // The order must match the order of the cards on the page.
    const TEAM = [
      {
        name: "Vinayak K Raikar",
        role: "Idea Creator",
        classYear: "",                      // example: "3rd Year, CSE"
        university: "",                     // example: "Your University Name"
        work: "Came up with the project idea",
        hobbies: []                         // example: ["Cricket", "Coding", "Music"]
      },
      {
        name: "Koushik S Naik",
        role: "Solution Finder",
        classYear: "",
        university: "",
        work: "Found the solution approach for the project",
        hobbies: []
      },
      {
        name: "Gangaram G Gurav",
        role: "Prompt Expert",
        classYear: "",
        university: "",
        work: "Wrote and refined the AI prompts",
        hobbies: []
      },
      {
        name: "Sanjay P P",
        role: "Website Maker",
        classYear: "",
        university: "",
        work: "Built the website",
        hobbies: []
      },
      {
        name: "U Karthik",
        role: "Website Launcher",
        classYear: "",
        university: "",
        work: "Launched the website",
        hobbies: []
      }
    ];

    const teamCards = document.querySelectorAll(".team .member");
    const memberModal = $("memberModal");
    if (teamCards.length && !memberModal) {
      console.error("[Team] Popup HTML (id=\"memberModal\") not found. Add it before the script tag.");
    }

    if (teamCards.length && memberModal) {
      const mName = $("mName"), mRole = $("mRole"), mInitial = $("mInitial");
      const mPhoto = $("mPhoto"), mBody = $("mBody"), mCount = $("mCount");
      let current = 0;
      let lastFocus = null;

      const make = (tag, className, text) => {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text !== undefined) el.textContent = text;
        return el;
      };

      const fillMember = (i) => {
        current = i;
        const m = TEAM[i] || {};
        const card = teamCards[i];
        const cardImg = card.querySelector("img");
        const cardName = card.querySelector("h3");

        mName.textContent = m.name || (cardName ? cardName.textContent : "");
        mRole.textContent = m.role || "";
        mRole.hidden = !m.role;
        mInitial.textContent = (mName.textContent.trim().charAt(0) || "?").toUpperCase();

        if (cardImg) {
          mPhoto.src = cardImg.src;
          mPhoto.alt = mName.textContent;
          mPhoto.hidden = false;
        } else {
          mPhoto.hidden = true;
        }

        mBody.replaceChildren();

        // Class, University, Work
        [
          ["Class", m.classYear],
          ["University", m.university],
          ["Work", m.work]
        ].forEach(([label, value]) => {
          if (!value) return;
          const row = make("div", "info-row");
          row.appendChild(make("span", "info-label", label));
          row.appendChild(make("span", "info-value", value));
          mBody.appendChild(row);
        });

        // Hobbies
        if (m.hobbies && m.hobbies.length) {
          const row = make("div", "info-row");
          row.appendChild(make("span", "info-label", "Hobbies"));
          const chips = make("div", "chips");
          m.hobbies.forEach((h) => chips.appendChild(make("span", "chip", h)));
          row.appendChild(chips);
          mBody.appendChild(row);
        }

        mCount.textContent = i + 1 + " / " + teamCards.length;
      };

      const openMember = (i) => {
        lastFocus = document.activeElement;
        fillMember(i);
        memberModal.hidden = false;
        document.body.style.overflow = "hidden";
        const closeBtn = $("modalClose");
        if (closeBtn) closeBtn.focus();
      };

      const closeMember = () => {
        memberModal.hidden = true;
        document.body.style.overflow = "";
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      };

      const stepMember = (dir) => {
        fillMember((current + dir + teamCards.length) % teamCards.length);
      };

      teamCards.forEach((card, i) => {
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", "View details");
        if (!card.querySelector(".member-hint")) {
          card.appendChild(make("span", "member-hint", "Click for details"));
        }
        card.addEventListener("click", () => openMember(i));
        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openMember(i);
          }
        });
      });

      on($("modalClose"), "click", closeMember);
      on($("mPrev"), "click", () => stepMember(-1));
      on($("mNext"), "click", () => stepMember(1));
      on(memberModal, "click", (e) => { if (e.target === memberModal) closeMember(); });
      document.addEventListener("keydown", (e) => {
        if (memberModal.hidden) return;
        if (e.key === "Escape") closeMember();
        if (e.key === "ArrowLeft") stepMember(-1);
        if (e.key === "ArrowRight") stepMember(1);
      });
    }

    // ---------- ELEMENTS FOR UPLOAD / ANALYSIS ----------
    const dropZone = $("dropZone") || document.querySelector(".drop-zone, .dropzone, [class*='drop']");
    let fileInput = $("fileInput") || document.querySelector("input[type='file']");
    if (!fileInput) {
      fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".jpg,.jpeg,.png,.bmp,image/jpeg,image/png,image/bmp";
      fileInput.style.display = "none";
      document.body.appendChild(fileInput);
    }
    const analyzeBtn = $("analyzeBtn") || $("analyze") ||
      [...document.querySelectorAll("button")].find((b) => /analy[sz]e/i.test(b.textContent));
    const minSlider = $("minSize") || $("minRegion") || $("slider") ||
      [...document.querySelectorAll("input[type='range']")].find((r) => r.id !== "cmpSlider");
    let minSizeVal = $("minSizeVal") || $("minSizeValue");
    if (!minSizeVal) {
      const lab = [...document.querySelectorAll("label, div, p")].find((l) => /minimum region size/i.test(l.textContent) && l.querySelector("b, strong"));
      if (lab) minSizeVal = lab.querySelector("b, strong");
    }
    const cOriginal = $("cOriginal") || document.createElement("canvas");
    const cOverlay = $("cOverlay") || document.createElement("canvas");
    const resultsEl = $("results") || (cOriginal.closest ? cOriginal.closest("section") : null);

    console.log("[MRI] dropZone:", dropZone, "| fileInput:", fileInput, "| analyzeBtn:", analyzeBtn, "| slider:", minSlider);
    if (!dropZone) console.error("[MRI] Drop zone not found. Add id=\"dropZone\" to it.");
    if (!analyzeBtn) console.error("[MRI] Analyze button not found. Add id=\"analyzeBtn\" to it.");

    // ---------- FILE PICKING ----------
    let currentImg = null;

    on(dropZone, "click", (e) => {
      if (e.target === fileInput) return;
      if (e.target.closest && e.target.closest("label")) return;   // label already opens the picker
      fileInput.click();
    });
    on(fileInput, "change", () => {
      if (fileInput.files && fileInput.files[0]) loadFile(fileInput.files[0]);
    });
    ["dragenter", "dragover"].forEach((ev) =>
      on(dropZone, ev, (e) => { e.preventDefault(); dropZone.classList.add("drag"); }));
    ["dragleave", "drop"].forEach((ev) =>
      on(dropZone, ev, (e) => { e.preventDefault(); dropZone.classList.remove("drag"); }));
    on(dropZone, "drop", (e) => {
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) loadFile(f);
    });

    function loadFile(file) {
      if (!/^image\/(jpeg|png|bmp)$/.test(file.type)) {
        alert("Please choose a JPG, PNG or BMP image. (Convert TIF to JPG first.)");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          currentImg = img;
          if (analyzeBtn) analyzeBtn.disabled = false;
          if (dropZone) {
            const hint = [...dropZone.querySelectorAll("p, small, span, div")].reverse().find((n) => !n.children.length && n.textContent.trim());
            if (hint) hint.textContent = "Loaded: " + file.name + " (click to change)";
          }
        };
        img.onerror = () => alert("Could not read that image.");
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }

    // ---------- SLIDER LABEL ----------
    const updateSliderLabel = () => {
      if (minSlider && minSizeVal) minSizeVal.textContent = parseFloat(minSlider.value).toFixed(1) + "%";
    };
    on(minSlider, "input", updateSliderLabel);
    updateSliderLabel();

    // ---------- SCANNING ANIMATION ----------
    const scanStatus = $("scanStatus"), scanFill = $("scanFill"), scanText = $("scanText");
    const scanSteps = ["Preparing image...", "Locating brain area...", "Removing skull edges...",
      "Searching bright regions...", "Measuring region size..."];
    let scanTimer = null;

    function startScan() {
      return new Promise((resolve) => {
        if (dropZone) dropZone.classList.add("scanning");
        if (scanStatus) scanStatus.hidden = false;
        if (scanText) scanText.textContent = scanSteps[0];
        const total = 1600, start = performance.now();
        scanTimer = setInterval(() => {
          const t = Math.min((performance.now() - start) / total, 1);
          if (scanFill) scanFill.style.width = t * 100 + "%";
          if (scanText) scanText.textContent = scanSteps[Math.min(Math.floor(t * scanSteps.length), scanSteps.length - 1)];
          if (t >= 1) { clearInterval(scanTimer); scanTimer = null; resolve(); }
        }, 40);
      });
    }
    function stopScan() {
      if (scanTimer) { clearInterval(scanTimer); scanTimer = null; }
      if (dropZone) dropZone.classList.remove("scanning");
      if (scanStatus) scanStatus.hidden = true;
      if (scanFill) scanFill.style.width = "0%";
    }

    // ---------- RESULT EXTRAS ----------
    function countUp(el, to, decimals, suffix) {
      if (!el) return;
      const start = performance.now(), dur = 900;
      function step(now) {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = (to * eased).toFixed(decimals) + suffix;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    const cmp = $("cmp"), cmpSlider = $("cmpSlider");
    const setCmp = (v) => { if (cmp) cmp.style.setProperty("--pos", v + "%"); };
    on(cmpSlider, "input", () => setCmp(cmpSlider.value));

    function afterRender(out) {
      countUp($("statRatio"), out.ratio * 100, 2, "%");
      if ($("statBrain")) $("statBrain").textContent = out.ok ? "Detected" : "Not found";
      const resultEl = $("statResult");
      if (resultEl) {
        resultEl.textContent = out.tumor ? "Tumor-like" : "Clear";
        resultEl.className = "stat-value " + (out.tumor ? "bad-text" : "good-text");
      }
      const b = $("cmpBefore"), a = $("cmpAfter");
      if (b) { b.width = cOriginal.width; b.height = cOriginal.height; b.getContext("2d").drawImage(cOriginal, 0, 0); }
      if (a) { a.width = cOverlay.width; a.height = cOverlay.height; a.getContext("2d").drawImage(cOverlay, 0, 0); }
      if (cmpSlider) cmpSlider.value = 50;
      setCmp(50);
    }

    on($("downloadBtn"), "click", () => {
      const a = document.createElement("a");
      a.download = "tumor-result.png";
      a.href = cOverlay.toDataURL("image/png");
      a.click();
    });
    on($("rescanBtn"), "click", () => {
      const d = $("detect");
      if (d) d.scrollIntoView({ behavior: "smooth" });
      fileInput.click();
    });

    // ---------- ANALYZE ----------
    on(analyzeBtn, "click", async () => {
      if (!currentImg) { fileInput.click(); return; }
      analyzeBtn.disabled = true;
      try {
        await startScan();
        const out = analyze(currentImg, minSlider ? parseFloat(minSlider.value) : 1);
        stopScan();
        if (resultsEl) {
          resultsEl.hidden = false;
          resultsEl.classList.add("visible");
          resultsEl.scrollIntoView({ behavior: "smooth" });
        }
        afterRender(out);
      } catch (err) {
        console.error(err);
        stopScan();
        alert("Something went wrong while analyzing the image. See the console for details.");
      } finally {
        analyzeBtn.disabled = false;
      }
    });

    function analyze(img, minPct) {
      const maxSide = 512;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      [cOriginal, cOverlay].forEach((c) => { c.width = w; c.height = h; });

      const octx = cOriginal.getContext("2d");
      octx.drawImage(img, 0, 0, w, h);
      const px = octx.getImageData(0, 0, w, h).data;
      const n = w * h;

      const gray = new Uint8Array(n);
      for (let i = 0; i < n; i++) gray[i] = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) | 0;

      let mask = new Uint8Array(n);
      const t = otsu(gray);
      for (let i = 0; i < n; i++) mask[i] = gray[i] > t ? 1 : 0;
      mask = largestComponent(mask, w, h);
      mask = fillHoles(mask, w, h);

      const r = Math.max(3, Math.round(Math.min(w, h) * 0.04));
      const inner = erode(mask, w, h, r);
      let brainArea = 0;
      for (let i = 0; i < n; i++) if (inner[i]) brainArea++;

      const ctx = cOverlay.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      if (brainArea <= n * 0.02) return { ok: false, tumor: false, ratio: 0 };

      let sum = 0, sum2 = 0;
      for (let i = 0; i < n; i++) if (inner[i]) { sum += gray[i]; sum2 += gray[i] * gray[i]; }
      const mean = sum / brainArea;
      const std = Math.sqrt(Math.max(0, sum2 / brainArea - mean * mean));
      const cut = mean + 1.5 * std;

      const bright = new Uint8Array(n);
      for (let i = 0; i < n; i++) bright[i] = inner[i] && gray[i] > cut ? 1 : 0;

      const minArea = (minPct / 100) * brainArea;
      const regions = findRegions(bright, w, h).filter((reg) => reg.length >= minArea);

      const ov = ctx.getImageData(0, 0, w, h);
      let tumorPixels = 0;
      regions.forEach((reg) => {
        tumorPixels += reg.length;
        for (const idx of reg) {
          ov.data[idx * 4] = Math.round(ov.data[idx * 4] * 0.4 + 255 * 0.6);
          ov.data[idx * 4 + 1] = Math.round(ov.data[idx * 4 + 1] * 0.4);
          ov.data[idx * 4 + 2] = Math.round(ov.data[idx * 4 + 2] * 0.4);
        }
      });
      ctx.putImageData(ov, 0, 0);
      return { ok: true, tumor: regions.length > 0, ratio: tumorPixels / brainArea };
    }

    // ---------- IMAGE HELPERS ----------
    function otsu(gray) {
      const hist = new Array(256).fill(0);
      for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
      const total = gray.length;
      let sumAll = 0;
      for (let i = 0; i < 256; i++) sumAll += i * hist[i];
      let sumB = 0, wB = 0, best = 0, thr = 0;
      for (let i = 0; i < 256; i++) {
        wB += hist[i];
        if (!wB) continue;
        const wF = total - wB;
        if (!wF) break;
        sumB += i * hist[i];
        const mB = sumB / wB, mF = (sumAll - sumB) / wF;
        const between = wB * wF * (mB - mF) * (mB - mF);
        if (between > best) { best = between; thr = i; }
      }
      return thr;
    }
    function findRegions(bin, w, h) {
      const seen = new Uint8Array(bin.length), regions = [], stack = [];
      for (let s = 0; s < bin.length; s++) {
        if (!bin[s] || seen[s]) continue;
        const reg = [];
        stack.push(s); seen[s] = 1;
        while (stack.length) {
          const p = stack.pop();
          reg.push(p);
          const x = p % w, y = (p / w) | 0;
          if (x > 0 && bin[p - 1] && !seen[p - 1]) { seen[p - 1] = 1; stack.push(p - 1); }
          if (x < w - 1 && bin[p + 1] && !seen[p + 1]) { seen[p + 1] = 1; stack.push(p + 1); }
          if (y > 0 && bin[p - w] && !seen[p - w]) { seen[p - w] = 1; stack.push(p - w); }
          if (y < h - 1 && bin[p + w] && !seen[p + w]) { seen[p + w] = 1; stack.push(p + w); }
        }
        regions.push(reg);
      }
      return regions;
    }
    function largestComponent(bin, w, h) {
      const regions = findRegions(bin, w, h), out = new Uint8Array(bin.length);
      if (!regions.length) return out;
      let big = regions[0];
      for (const r of regions) if (r.length > big.length) big = r;
      for (const i of big) out[i] = 1;
      return out;
    }
    function fillHoles(bin, w, h) {
      const bg = new Uint8Array(bin.length), stack = [];
      const push = (i) => { if (!bin[i] && !bg[i]) { bg[i] = 1; stack.push(i); } };
      for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
      for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
      while (stack.length) {
        const p = stack.pop(), x = p % w, y = (p / w) | 0;
        if (x > 0) push(p - 1);
        if (x < w - 1) push(p + 1);
        if (y > 0) push(p - w);
        if (y < h - 1) push(p + w);
      }
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bg[i] ? 0 : 1;
      return out;
    }
    function erode(bin, w, h, r) {
      const tmp = new Uint8Array(bin.length), out = new Uint8Array(bin.length);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let keep = 1;
        for (let k = -r; k <= r && keep; k++) {
          const xx = x + k;
          if (xx < 0 || xx >= w || !bin[y * w + xx]) keep = 0;
        }
        tmp[y * w + x] = keep;
      }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let keep = 1;
        for (let k = -r; k <= r && keep; k++) {
          const yy = y + k;
          if (yy < 0 || yy >= h || !tmp[yy * w + x]) keep = 0;
        }
        out[y * w + x] = keep;
      }
      return out;
    }
  }

  // Run after the page exists, even if the script tag is in <head>
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
/* ===== TEAM PROFILE POPUP (paste at the very bottom of script.js) ===== */
(function () {
  // ---------- FILL IN THE DETAILS (between the quotes) ----------
  // Leave a field as "" (or [] for hobbies) to hide it.
  var TEAM = [
    { name: "Vinayak K Raikar", role: "Idea Creator",
      classYear: "", university: "", work: "Came up with the project idea", hobbies: [] },
    { name: "Koushik S Naik", role: "Solution Finder",
      classYear: "", university: "", work: "Found the solution approach for the project", hobbies: [] },
    { name: "Gangaram G Gurav", role: "Prompt Expert",
      classYear: "", university: "", work: "Wrote and refined the AI prompts", hobbies: [] },
    { name: "Sanjay P P", role: "Website Maker",
      classYear: "", university: "", work: "Built the website", hobbies: [] },
    { name: "U Karthik", role: "Website Launcher",
      classYear: "", university: "", work: "Launched the website", hobbies: [] }
  ];
  // examples:  classYear: "3rd Year, CSE"   university: "Your University"   hobbies: ["Cricket", "Music"]
  // The order must match the order of the photos on the page.

  function norm(s) { return (s || "").toLowerCase().replace(/[^a-z]/g, ""); }
  var keys = TEAM.map(function (m) { return norm(m.name); });
  var overlay = null, current = 0;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function q(sel) { return overlay.querySelector(sel); }

  function toast(text, color) {
    var t = el("div", "", text);
    t.style.cssText = "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483647;" +
      "padding:10px 16px;border-radius:10px;font:14px/1.4 Segoe UI,Arial,sans-serif;color:#fff;max-width:90vw;" +
      "box-shadow:0 6px 24px rgba(0,0,0,.5);background:" + color;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 7000);
  }

  // ---------- styles ----------
  var style = document.createElement("style");
  style.textContent =
    ".tm-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(5,8,18,.78);backdrop-filter:blur(6px)}" +
    ".tm-overlay[hidden]{display:none}" +
    ".tm-box{position:relative;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;padding:32px 28px 22px;border-radius:22px;background:linear-gradient(160deg,#1a2140,#10152b);border:1px solid rgba(255,255,255,.14);box-shadow:0 25px 60px rgba(0,0,0,.55);color:#e8ecf5;font-family:'Segoe UI',system-ui,Arial,sans-serif}" +
    ".tm-close{position:absolute;top:12px;right:14px;width:36px;height:36px;border:none;border-radius:50%;font-size:24px;line-height:1;color:#e8ecf5;background:rgba(255,255,255,.1);cursor:pointer}" +
    ".tm-close:hover{background:#ff5d6c}" +
    ".tm-head{text-align:center;margin-bottom:18px}" +
    ".tm-photo{position:relative;width:130px;height:130px;margin:0 auto 14px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#6c8cff,#9b6cff);border:3px solid #6c8cff}" +
    ".tm-initial{font-size:48px;font-weight:700;color:#fff}" +
    ".tm-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}" +
    ".tm-img[hidden]{display:none}" +
    ".tm-name{font-size:24px;margin:0}" +
    ".tm-role{display:inline-block;margin:8px 0 0;padding:4px 14px;border-radius:999px;font-size:13px;color:#8fa6ff;background:rgba(108,140,255,.14);border:1px solid rgba(108,140,255,.4)}" +
    ".tm-role[hidden]{display:none}" +
    ".tm-body{display:grid;gap:12px}" +
    ".tm-row{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:11px 14px;border-radius:12px;background:rgba(255,255,255,.06)}" +
    ".tm-label{color:#9aa4bd;font-size:14px;flex-shrink:0}" +
    ".tm-value{text-align:right;font-weight:600;font-size:14px}" +
    ".tm-chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}" +
    ".tm-chip{padding:5px 12px;border-radius:999px;font-size:13px;background:rgba(155,108,255,.16);border:1px solid rgba(155,108,255,.45)}" +
    ".tm-empty{text-align:center;color:#9aa4bd}" +
    ".tm-nav{display:flex;align-items:center;justify-content:space-between;margin-top:22px;padding-top:16px;border-top:1px solid rgba(255,255,255,.12)}" +
    ".tm-count{color:#9aa4bd;font-size:13px}" +
    ".tm-btn{padding:8px 14px;border:1px solid rgba(255,255,255,.14);border-radius:10px;font-size:14px;color:#e8ecf5;background:rgba(255,255,255,.07);cursor:pointer}" +
    ".tm-btn:hover{border-color:#6c8cff;background:rgba(108,140,255,.18)}" +
    ".tm-pointer{cursor:pointer !important}" +
    "@media(max-width:480px){.tm-box{padding:28px 18px 18px}.tm-row{flex-direction:column;align-items:flex-start;gap:4px}.tm-value{text-align:left}.tm-chips{justify-content:flex-start}}";
  document.head.appendChild(style);

  // ---------- find the team photos (in page order) ----------
  function teamImages() {
    var section = document.getElementById("team");
    if (!section) {
      var hs = document.querySelectorAll("h1,h2,h3,h4");
      for (var i = 0; i < hs.length; i++) {
        if (/team\s*members/i.test(hs[i].textContent)) {
          section = hs[i].closest("section") || hs[i].parentElement;
          break;
        }
      }
    }
    if (!section) return [];
    var all = section.querySelectorAll("img"), out = [];
    for (var j = 0; j < all.length; j++) {
      if (!overlay || !overlay.contains(all[j])) out.push(all[j]);
    }
    return out;
  }

  // ---------- find a member by the name written on the card ----------
  function hitsIn(text) {
    var t = norm(text), hits = [];
    keys.forEach(function (k, i) { if (k && t.indexOf(k) !== -1) hits.push(i); });
    return hits;
  }
  function findCard(node) {
    var best = null, e = node, depth = 0;
    while (e && e !== document.body && e !== document.documentElement && depth < 10) {
      var hits = hitsIn(e.textContent);
      if (hits.length === 1) best = { el: e, idx: hits[0] };
      else if (hits.length > 1) break;
      e = e.parentElement;
      depth++;
    }
    return best;
  }

  // ---------- which member was clicked? ----------
  function resolveIndex(e) {
    var imgs = teamImages();
    var stack = (e.detail === 0 || !document.elementsFromPoint)
      ? [e.target]
      : document.elementsFromPoint(e.clientX, e.clientY);
    for (var s = 0; s < stack.length; s++) {
      var node = stack[s];
      if (node === document.documentElement || node === document.body) continue;
      if (imgs.length === TEAM.length) {
        var k = imgs.indexOf(node);
        if (k !== -1) return k;
      }
      var hit = findCard(node);
      if (hit) return hit.idx;
    }
    return -1;
  }

  // ---------- popup ----------
  function build() {
    overlay = el("div", "tm-overlay");
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="tm-box" role="dialog" aria-modal="true">' +
        '<button class="tm-close" aria-label="Close">&times;</button>' +
        '<div class="tm-head">' +
          '<div class="tm-photo"><span class="tm-initial"></span><img class="tm-img" alt=""></div>' +
          '<h3 class="tm-name"></h3><p class="tm-role"></p>' +
        '</div>' +
        '<div class="tm-body"></div>' +
        '<div class="tm-nav">' +
          '<button class="tm-btn tm-prev">&larr; Previous</button>' +
          '<span class="tm-count"></span>' +
          '<button class="tm-btn tm-next">Next &rarr;</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    q(".tm-close").addEventListener("click", closePopup);
    q(".tm-prev").addEventListener("click", function () { step(-1); });
    q(".tm-next").addEventListener("click", function () { step(1); });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closePopup(); });
  }

  function fill(i) {
    current = i;
    var m = TEAM[i];
    var imgs = teamImages();
    var src = (imgs.length === TEAM.length && imgs[i]) ? imgs[i].currentSrc || imgs[i].src : "";

    q(".tm-name").textContent = m.name;
    var role = q(".tm-role");
    role.textContent = m.role || "";
    role.hidden = !m.role;
    q(".tm-initial").textContent = m.name.charAt(0).toUpperCase();

    var pic = q(".tm-img");
    if (src) { pic.src = src; pic.hidden = false; } else { pic.hidden = true; }

    var body = q(".tm-body");
    body.innerHTML = "";
    var shown = 0;

    [["Class", m.classYear], ["University", m.university], ["Work", m.work]].forEach(function (pair) {
      if (!pair[1]) return;
      var row = el("div", "tm-row");
      row.appendChild(el("span", "tm-label", pair[0]));
      row.appendChild(el("span", "tm-value", pair[1]));
      body.appendChild(row);
      shown++;
    });

    if (m.hobbies && m.hobbies.length) {
      var hrow = el("div", "tm-row");
      hrow.appendChild(el("span", "tm-label", "Hobbies"));
      var chips = el("div", "tm-chips");
      m.hobbies.forEach(function (h) { chips.appendChild(el("span", "tm-chip", h)); });
      hrow.appendChild(chips);
      body.appendChild(hrow);
      shown++;
    }
    if (!shown) body.appendChild(el("p", "tm-empty", "Details coming soon."));
    q(".tm-count").textContent = (i + 1) + " / " + TEAM.length;
  }

  function openPopup(i) {
    fill(i);
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closePopup() {
    overlay.hidden = true;
    document.body.style.overflow = "";
  }
  function step(d) { fill((current + d + TEAM.length) % TEAM.length); }

  // ---------- start ----------
  function decorate() {
    teamImages().forEach(function (img) { img.classList.add("tm-pointer"); });
  }

  function init() {
    build();
    decorate();
    setTimeout(decorate, 800);

    // Capture phase: runs before any other click code on the page
    document.addEventListener("click", function (e) {
      if (overlay.contains(e.target)) return;
      var idx = resolveIndex(e);
      if (idx < 0) return;
      e.preventDefault();
      e.stopPropagation();
      openPopup(idx);
    }, true);

    document.addEventListener("keydown", function (e) {
      if (overlay.hidden) return;
      if (e.key === "Escape") closePopup();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });

    function report() {
      var n = teamImages().length;
      if (n === TEAM.length) toast("Team popup ready: " + n + " photos found. Click a photo or name!", "#0a7d3b");
      else toast("Team popup ready, but found " + n + " photos in the team section (expected " + TEAM.length + "). Names may still work.", "#b26a00");
    }
    if (document.readyState === "complete") report();
    else window.addEventListener("load", report);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
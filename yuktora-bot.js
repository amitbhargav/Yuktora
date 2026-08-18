/* ═══════════════════════════════════════════════════════════════════
   YUKTORA INTELLIGENCE — full-screen guide overlay
   One script, included on every page. Auto-detects which page it's
   running on and adapts:
     - Marketing pages (/, /pricing, /signin, /blog, /404) → full
       "what's slowing you down" onboarding + sales-guide flow.
     - App (/app) → logged-in users aren't prospects anymore, so no
       auto-popup. Launcher opens straight into a product-help guide
       instead, same full-screen visual treatment.
   Anchor links (#features, #how-it-works) and the feature-card
   flash-scroll only exist on the homepage — everywhere else they
   resolve to "/#features" etc. so they still work.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const YB_IS_HOME = path === '/' || path === '/index' || path === '/index.html';
  const YB_IS_APP = /\/app(\.html)?$/.test(path);

  /* ── content config (marketing flow) ── */
  const YB_PAIN = {
    rejected: { label: "😕 Not sure why I keep getting rejected", card: 'rejected', ic: '🧠', title: 'Rejection Analyser',
      blurb: 'See exactly why you were filtered out.',
      reply: "That's exactly what Rejection Analyser is built for — it explains why you were filtered out: missing keywords, weak bullets, or a straight-up role mismatch. No more guessing." },
    fit: { label: "🤔 Don't know if I'm even a fit", card: 'fit', ic: '🎯', title: 'AI Match Scoring',
      blurb: '0–100 match score, gaps included.',
      reply: "That's the first thing Yuktora tells you. Paste the JD and get a 0–100 match score with the exact gaps and ATS keywords you're missing — before you spend an evening tailoring a resume for a role you were never going to land." },
    blind: { label: "📋 Applying blindly, losing track of everything", card: 'blind', ic: '📊', title: 'Application Tracker',
      blurb: 'Every application, one dashboard.',
      reply: "That's what the Application Tracker fixes — every application, every status, every platform, in one dashboard. Stop losing track of what you sent where." }
  };
  const YB_GEO = {
    india: { label: "🇮🇳 Mostly India", reply: "Good to know — Yuktora tracks Naukri, LinkedIn India and direct applications side by side, so nothing gets mixed up." },
    intl: { label: "🌍 Mostly international", reply: "Then keep an eye on the sponsorship hints — Yuktora flags roles that mention visa sponsorship right in the match score." },
    both: { label: "🌐 Both", reply: "Smart. Yuktora keeps India and international roles in separate views so they don't blur into one messy list." }
  };
  const YB_TRACK = {
    sheet: { label: "📊 A spreadsheet", reply: "You'll like this then — one dashboard instead of duplicate tabs and formulas that break every time you add a row." },
    notes: { label: "📝 Sticky notes & memory", reply: "Honestly, most people start there. The tracker replaces that with real status history per application — nothing relies on memory." },
    none: { label: "🤷 Nothing, tbh", reply: "No judgment — that's exactly the gap the tracker exists to close." }
  };
  const YB_FAQ = [
    { k: ['price', 'pricing', 'cost', 'free', 'paid'], a: "Free forever tier, no signup needed to try it. Paid plans unlock more — check the Pricing page in the nav for exact numbers." },
    { k: ['safe', 'privacy', 'data', 'secure', 'security'], a: "Your data's encrypted and synced via Supabase, tied to your verified identity through Magic Link sign-in. Row-level security means only you can see your own data." },
    { k: ['auto apply', 'autoapply', 'scrape', 'scraping', 'bot apply'], a: "No auto-applying and no scraping — ever. You stay in full control of every application; Yuktora just helps you tailor and track them." },
    { k: ['password', 'sign in', 'signin', 'login', 'magic link'], a: "No password needed — it's Magic Link sign-in. Enter your email, click the link, you're in. Works across all your devices." },
    { k: ['naukri', 'linkedin', 'indeed', 'platform', 'job board'], a: "Works with LinkedIn, Naukri, Indeed and most job boards — just paste the JD from wherever you found it." },
    { k: ['how it works', 'how does', 'work'], a: "Paste a JD → AI scores your match 0–100 and flags gaps → generate tailored resume bullets → log it in the tracker. Under 60 seconds end to end." },
    { k: ['contact', 'support', 'help', 'reach', 'email'], a: "Fastest route is amitbhargav.sunny@gmail.com — link's in the footer under Company → Contact Us." },
    { k: ['upgrade', 'pro', 'lifetime'], a: "You can upgrade from inside the app — head to Pricing (in the nav) or your account menu once signed in." },
    { k: ['tailor', 'resume', 'bullet'], a: "Resume Tailor rewrites your bullets for a specific JD in Conservative / Balanced / Aggressive modes — ATS-ready in seconds." },
    { k: ['delete', 'wipe', 'erase', 'remove my data'], a: "Yes — there's a \"Clear all data\" option in the app that removes both your local and cloud-stored data for your account." }
  ];
  const YB_FAQ_DEFAULT = "Don't have a canned answer for that one — try asking about pricing, data safety, how matching works, or which job boards it supports. Or just hit Start Free and see for yourself.";

  let ybPainPick = null;
  let ybMsgCount = 0;

  /* ── page-aware link helpers ── */
  function ybHome(hash) { return YB_IS_HOME ? hash : '/' + hash; }

  /* ── animated avatar: speaking pulses the equalizer, ring breathes/glows idle ── */
  let ybSpeakTimer = null;
  function ybSpeakStart() {
    const ring = document.getElementById('ybRing');
    if (ring) ring.classList.add('yb-speaking');
  }
  function ybSpeakStop() {
    const ring = document.getElementById('ybRing');
    if (ring) ring.classList.remove('yb-speaking');
  }

  function ybTranscript() { return document.getElementById('ybTranscript'); }

  /* ── open / close ── */
  function ybOpen(startFn) {
    const overlay = document.getElementById('ybOverlay');
    ybTranscript().innerHTML = '';
    ybMsgCount = 0;
    overlay.classList.remove('closing');
    overlay.classList.add('on');
    startFn();
  }
  function ybClose() {
    const overlay = document.getElementById('ybOverlay');
    overlay.classList.add('closing');
    setTimeout(() => { overlay.classList.remove('on', 'closing'); }, 350);
    localStorage.setItem('yuktora_bot_seen', '1');
  }

  /* ── chat primitives, styled as the full-screen transcript ── */
  function ybScrollDown() {
    const inner = document.querySelector('.yb-overlay-inner');
    if (inner) inner.scrollTop = inner.scrollHeight;
  }
  function ybDowngradePrevious() {
    // fade the previous "current" message down to a small trail line
    const cur = ybTranscript().querySelector('.yb-tmsg.sub:last-of-type');
    if (cur) cur.classList.replace('sub', 'faded');
  }
  function ybBotMsg(text, cb, opts) {
    opts = opts || {};
    const body = ybTranscript();
    const typing = document.createElement('div');
    typing.className = 'yb-typing2';
    typing.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(typing);
    ybScrollDown();
    setTimeout(() => {
      typing.remove();
      ybDowngradePrevious();
      const isHeadline = ybMsgCount === 0;
      const m = document.createElement('div');
      m.className = 'yb-tmsg ' + (isHeadline ? 'headline' : 'sub');
      body.appendChild(m);
      ybMsgCount++;
      ybSpeakStart();
      let i = 0;
      const iv = setInterval(() => {
        m.textContent = text.slice(0, i++);
        ybScrollDown();
        if (i > text.length) {
          clearInterval(iv);
          ybSpeakStop();
          if (isHeadline) {
            const cursor = document.createElement('span');
            cursor.className = 'yb-cursor';
            cursor.textContent = '|';
            m.appendChild(cursor);
          }
          if (cb) cb();
        }
      }, opts.speed || 12);
    }, 450 + Math.random() * 300);
  }
  function ybUserPick(text) {
    const body = ybTranscript();
    const m = document.createElement('div');
    m.className = 'yb-tmsg user-pick';
    m.textContent = text;
    body.appendChild(m);
    ybScrollDown();
  }
  function ybPills(entries, onPick) {
    const body = ybTranscript();
    const row = document.createElement('div');
    row.className = 'yb-pills';
    entries.forEach(([key, obj]) => {
      const b = document.createElement('button');
      b.className = 'yb-pill';
      b.textContent = obj.label;
      b.onclick = () => {
        row.querySelectorAll('button').forEach(x => x.disabled = true);
        ybUserPick(obj.label);
        onPick(key, obj);
      };
      row.appendChild(b);
    });
    body.appendChild(row);
    ybScrollDown();
  }
  /* cards: [{ic,title,blurb,wide,primary,action}] — action runs, then overlay closes */
  function ybCardGrid(cards) {
    const body = ybTranscript();
    const grid = document.createElement('div');
    grid.className = 'yb-pcards';
    cards.forEach(c => {
      const el = document.createElement('button');
      el.className = 'yb-pcard' + (c.wide ? ' wide' : '') + (c.primary ? ' primary' : '');
      el.innerHTML = '<span class="yb-pcard-ic">' + c.ic + '</span>' +
        '<span><span class="yb-pcard-title">' + c.title + '</span><br><span class="yb-pcard-blurb">' + c.blurb + '</span></span>';
      el.onclick = () => { c.action(); ybClose(); };
      grid.appendChild(el);
    });
    body.appendChild(grid);
    ybScrollDown();
  }
  function ybGoToFeature(key) {
    return () => {
      if (!YB_IS_HOME) { setTimeout(() => { window.location.href = '/#features'; }, 200); return; }
      setTimeout(() => {
        const card = document.querySelector('.feat[data-feat="' + key + '"]');
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('feat-flash');
          setTimeout(() => card.classList.remove('feat-flash'), 1800);
        }
      }, 350);
    };
  }
  function ybGoToAnchor(id) {
    return () => {
      if (!YB_IS_HOME) { setTimeout(() => { window.location.href = ybHome(id); }, 200); return; }
      setTimeout(() => {
        const el = document.querySelector(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
    };
  }
  function ybGoToUrl(url) {
    return () => setTimeout(() => { window.location.href = url; }, 200);
  }

  /* ── conversation: marketing flow (homepage, pricing, signin, blog, 404) ── */
  function ybStart() {
    ybBotMsg("Hi! I'm Yuktora Intelligence 👋", () => {
      ybAskPain();
    });
  }
  function ybAskPain() {
    ybBotMsg("So — what's slowing your job search down right now?", () => {
      const entries = Object.entries(YB_PAIN);
      entries.push(['explore', { label: '👀 Just exploring' }]);
      ybPills(entries, (key, obj) => {
        if (key === 'explore') {
          ybBotMsg("Take your time! Here's everywhere you can go:", () => {
            ybCardGrid([
              { ic: '🎯', title: 'Features', blurb: 'All 6, one scroll away.', action: ybGoToAnchor('#features') },
              { ic: '📋', title: 'How it works', blurb: 'JD to tailored app, 4 steps.', action: ybGoToAnchor('#how-it-works') },
              { ic: '💳', title: 'Pricing', blurb: 'Free tier + paid plans.', action: ybGoToUrl('/pricing') },
              { ic: '🚀', title: 'Start Free', blurb: 'Magic link, no password.', wide: true, primary: true, action: ybGoToUrl('/app') }
            ]);
          });
          return;
        }
        ybPainPick = key;
        ybBotMsg(obj.reply, () => ybAskGeo());
      });
    });
  }
  function ybAskGeo() {
    ybBotMsg("Quick follow-up — India, international, or both?", () => {
      ybPills(Object.entries(YB_GEO), (key, obj) => {
        ybBotMsg(obj.reply, () => ybAskTrack());
      });
    });
  }
  function ybAskTrack() {
    ybBotMsg("Last one — how are you tracking applications right now?", () => {
      ybPills(Object.entries(YB_TRACK), (key, obj) => {
        ybBotMsg(obj.reply, () => ybWrapUp());
      });
    });
  }
  function ybWrapUp() {
    const feat = YB_PAIN[ybPainPick];
    ybBotMsg("Alright, here's my read — start here:", () => {
      ybCardGrid([
        { ic: feat.ic, title: feat.title, blurb: feat.blurb, primary: true, action: ybGoToFeature(feat.card) },
        { ic: '📋', title: 'How it works', blurb: 'The full flow, 4 steps.', action: ybGoToAnchor('#how-it-works') },
        { ic: '🚀', title: 'Start Free', blurb: 'Magic link, no password.', wide: true, action: ybGoToUrl('/app') }
      ]);
      ybBotMsg("Other questions — pricing, data safety, whatever — just type below, I'm still here.");
    });
  }

  /* ── conversation: in-app help flow (app.html — already-signed-in users) ── */
  const YB_APP_HELP = {
    score: { label: '🎯 How does match scoring work?', reply: "Paste a JD in the Analyse tab — Claude scores it 0–100 against your profile and flags missing keywords or ATS gaps. Higher score = worth your time." },
    tailor: { label: '✦ How do I tailor my resume?', reply: "Open a scored JD and hit Tailor — pick Conservative, Balanced, or Aggressive, and it rewrites your bullets to match that specific role." },
    track: { label: '📊 How do I track applications?', reply: "Every job you analyse can be logged to the Tracker with a status (Applied, Interview, Rejected, etc.) — one dashboard, filterable by platform." },
    upgrade: { label: '💳 How do I upgrade to Pro?', reply: "Head to the Pricing page from the nav, or your account menu — Pro and Lifetime plans are billed securely via Razorpay." }
  };
  function ybStartApp() {
    ybBotMsg("Hey! 👋 Need a hand with anything?", () => {
      ybPills(Object.entries(YB_APP_HELP), (key, obj) => {
        ybBotMsg(obj.reply, () => {
          ybBotMsg("Anything else — just type below.");
        });
      });
    });
  }

  /* ── free-text FAQ (shared) ── */
  function ybAnswer(q) {
    const s = q.toLowerCase();
    for (const row of YB_FAQ) { if (row.k.some(k => s.includes(k))) return row.a; }
    return YB_FAQ_DEFAULT;
  }
  function ybSend() {
    const input = document.getElementById('ybInput');
    const q = input.value.trim();
    if (!q) return;
    ybUserPick(q);
    input.value = '';
    ybBotMsg(ybAnswer(q));
  }

  /* ── boot ── */
  window.ybReopen = function () {
    ybOpen(YB_IS_APP ? ybStartApp : ybStart);
  };
  window.ybClose = ybClose;
  window.ybSend = ybSend;

  (function initYB() {
    if (YB_IS_APP) {
      // Logged-in users aren't prospects — never auto-popup, launcher only.
      return;
    }
    if (!localStorage.getItem('yuktora_bot_seen')) {
      setTimeout(() => ybOpen(ybStart), 500);
    }
  })();
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const o = document.getElementById('ybOverlay');
      if (o && o.classList.contains('on')) ybClose();
    }
  });
})();

    // =====================================================
    // SUPABASE — Feedback Valmorel
    // Projekt: feedback-valmorel (yhymncieopgmqsmdybsl)
    // =====================================================
    const SUPABASE_URL      = 'https://yhymncieopgmqsmdybsl.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloeW1uY2llb3BnbXFzbWR5YnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MzY2MjEsImV4cCI6MjA5MDAxMjYyMX0.jndDg_XmvE3BSQPVsFyDMuAuh9Q6_HHM8p-qE4LHECw';
    const supabaseClient    = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // =====================================================
    // TEAM MAP — Ausbilder per Gruppe
    // Source of truth: update here only, never duplicate
    // =====================================================
    const TEAM_MAP = {
      '1':    ['Kilian', 'Claudia'],
      '2':    ['Kilian', 'Claudia'],
      '3':    ['Arno', 'Batti'],
      '4':    ['Arno', 'Batti'],
      '5':    ['Michael', 'Annika'],
      '6':    ['Michael', 'Annika'],
      '7':    ['Tanne', 'Pablo'],
      '8':    ['Tanne', 'Pablo'],
      'Snowboard': ['Adam', 'Kami']
    };

    // =====================================================
    // QUESTION LABELS — admin dashboard display
    // =====================================================
    const QUESTION_LABELS = {
      'S1-01': 'Ausbildungsort',
      'S1-02': 'Kosten / Preis-Leistung',
      'S1-03': 'SkiBo Tours',
      'S3-01': 'Organisation des Lehrgangs',
      'S3-02': 'Zeitliche Belastung',
      'S2-01': 'Situatives und demonstratives K\u00f6nnen',
      'S2-02': 'Eigene Lehrkompetenz / Lehr\u00fcbungen',
      'S2-04': 'Einsteigermethodik',
      'S2-05': 'Videoanalysen',
      'S2-06': 'Schnee-Event',
      'S2-07': 'Versch\u00fcttetensuche / Risikomanagement',
      'S4-01': 'Pr\u00fcfung Organisation',
      'S4-02': 'Pr\u00fcfungsanforderungen',
      'S4-03': 'Klarheit der Pr\u00fcfungsanforderungen',
      'S5-01': 'H\u00fcttenabend',
      'S5-02': 'Apr\u00e8s-Ski',
      'S5-03': 'Soziales Miteinander'
    };

    // =====================================================
    // SECTION LABELS — admin freitext display
    // =====================================================
    const SECTION_LABELS = {
      'S1': 'S1 \u2014 Rahmenbedingungen',
      'S3': 'S3 \u2014 Organisation',
      'S2': 'S2 \u2014 Ausbildung',
      'S4': 'S4 \u2014 Pr\u00fcfung',
      'S5': 'S5 \u2014 Soziales',
      'allgemein': 'Allgemeines Feedback'
    };

    // =====================================================
    // FORM STATE
    // =====================================================
    let selectedGroup = null;
    let selectedUni = null;
    const formData = {}; // keyed by data-question ID, value 1-5

    // =====================================================
    // WIZARD STATE
    // =====================================================
    let currentStep = 0;
    const totalSteps = 7;

    const sectionNames = [
      'Start',
      'S1 \u2014 Rahmenbedingungen',
      'S3 \u2014 Organisation',
      'S2 \u2014 Ausbildung',
      'S4 \u2014 Pr\u00fcfung',
      'S5 \u2014 Soziales',
      'S6 \u2014 Ausbilder*innen \u0026 Abschluss'
    ];

    // =====================================================
    // SHOW STEP
    // =====================================================
    function showStep(n, direction) {
      // Clamp
      if (n < 0) n = 0;
      if (n >= totalSteps) n = totalSteps - 1;
      currentStep = n;

      // Hide all steps, show active with slide animation
      document.querySelectorAll('.step').forEach(function(el) {
        el.classList.remove('active', 'step-enter', 'step-enter-back');
      });
      var target = document.querySelector('[data-step="' + n + '"]');
      if (target) {
        target.classList.add('active');
        if (direction === 'back') {
          target.classList.add('step-enter-back');
        } else if (direction === 'forward') {
          target.classList.add('step-enter');
        }
      }

      // Update progress fill via CSS variable
      var progressPercent = (n / (totalSteps - 1)) * 100;
      document.getElementById('progressFill').style.setProperty('--progress', progressPercent);
      document.getElementById('progressFill').style.width = progressPercent + '%';

      // Update counter: show current step as 1-indexed
      document.getElementById('progressCounter').textContent = (n + 1) + ' / ' + totalSteps;

      // Update section name
      document.getElementById('progressSectionName').textContent = sectionNames[n] || '';
    }

    // =====================================================
    // NAVIGATION
    // =====================================================
    function validateStep(n) {
      var stepEl = document.querySelector('[data-step="' + n + '"]');
      if (!stepEl) return true;

      if (n === 0) {
        var uniSection = document.getElementById('uniGrid') && document.getElementById('uniGrid').closest('.form-section');
        var groupSection = document.getElementById('groupGrid') && document.getElementById('groupGrid').closest('.form-section');
        if (uniSection) uniSection.classList.toggle('required-missing', !selectedUni);
        if (groupSection) groupSection.classList.toggle('required-missing', !selectedGroup);
        var ok = !!(selectedUni && selectedGroup);
        var hint = document.getElementById('step0Error');
        if (hint) hint.classList.toggle('visible', !ok);
        if (!ok) {
          var first = stepEl.querySelector('.required-missing');
          if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return ok;
      }

      // Steps 1–5: all rating questions required
      var questions = stepEl.querySelectorAll('.form-section[data-question]');
      if (!questions.length) return true;
      var allRated = true;
      questions.forEach(function(sec) {
        var rated = formData[sec.dataset.question] !== undefined;
        sec.classList.toggle('required-missing', !rated);
        if (!rated) allRated = false;
      });
      if (!allRated) {
        var firstMissing = stepEl.querySelector('.required-missing');
        if (firstMissing) firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return allRated;
    }

    function nextStep() {
      if (currentStep >= totalSteps - 1) return;
      if (!validateStep(currentStep)) return;
      showStep(currentStep + 1, 'forward');
      window.scrollTo(0, 0);
    }

    function prevStep() {
      if (currentStep > 0) {
        showStep(currentStep - 1, 'back');
        window.scrollTo(0, 0);
      }
    }

    // =====================================================
    // GROUP SELECTOR
    // =====================================================
    document.addEventListener('DOMContentLoaded', function() {
      var grid = document.getElementById('groupGrid');
      if (grid) {
        grid.addEventListener('click', function(e) {
          var card = e.target.closest('.card');
          if (!card) return;
          grid.querySelectorAll('.card').forEach(function(c) { c.classList.remove('selected'); });
          card.classList.add('selected');
          selectedGroup = card.dataset.group;
          var groupSec = grid.closest('.form-section');
          if (groupSec) groupSec.classList.remove('required-missing');
          renderAusbilder(selectedGroup);
          updateSubmitState();
        });
      }

      var uniGrid = document.getElementById('uniGrid');
      if (uniGrid) {
        uniGrid.addEventListener('click', function(e) {
          var card = e.target.closest('.uni-card');
          if (!card) return;
          uniGrid.querySelectorAll('.uni-card').forEach(function(c) { c.classList.remove('selected'); });
          card.classList.add('selected');
          selectedUni = card.dataset.uni;
          var uniSec = uniGrid.closest('.form-section');
          if (uniSec) uniSec.classList.remove('required-missing');
          var hint = document.getElementById('step0Error');
          if (hint && selectedGroup) hint.classList.remove('visible');
        });
      }
    });

    // =====================================================
    // FREITEXT REVEAL LOGIC
    // =====================================================
    function checkSectionFreitext(stepEl) {
      var stepNum = stepEl.dataset.step;
      var freitextCard = stepEl.querySelector('[data-freitext="' + stepNum + '"]');
      if (!freitextCard) return;

      var shouldShow = false;
      var sections = stepEl.querySelectorAll('.form-section[data-question]');
      sections.forEach(function(sec) {
        var qId = sec.dataset.question;
        var rating = formData[qId];
        if (rating === undefined) return;

        if (qId === 'S4-02') {
          // Bipolar scale: trigger at extremes (1-2 or 4-5), not at 3
          if (rating <= 2 || rating >= 4) shouldShow = true;
        } else {
          // Standard: trigger at 1 or 2 only
          if (rating <= 2) shouldShow = true;
        }
      });

      freitextCard.style.display = shouldShow ? 'block' : 'none';
    }

    // =====================================================
    // SUBMIT GATE
    // =====================================================
    function updateSubmitState() {
      var btn = document.getElementById('submitBtn');
      if (!btn) return;

      // Gate 1: group and uni must be selected
      if (!selectedGroup || !selectedUni) {
        btn.disabled = true;
        return;
      }

      // Gate 2: all Ausbilder textareas must be filled
      var ausbilderTextareas = document.querySelectorAll('.ausbilder-textarea');
      var allFilled = true;
      ausbilderTextareas.forEach(function(ta) {
        if (!ta.value.trim()) allFilled = false;
      });

      btn.disabled = !allFilled;
    }

    // =====================================================
    // AUSBILDER RENDERING
    // =====================================================
    function renderAusbilder(group) {
      var container = document.getElementById('ausbilderContainer');
      if (!container) return;

      var ausbilder = group ? TEAM_MAP[group] : null;
      if (!ausbilder) {
        container.innerHTML =
          '<div class="form-section">' +
          '<p style="color:var(--text-muted);font-style:italic;font-size:0.9rem;">' +
          'Nach Auswahl deiner Gruppe erscheinen hier die Ausbilder*innen zur Bewertung.' +
          '</p></div>';
        return;
      }

      var html = '';
      ausbilder.forEach(function(name, i) {
        html +=
          '<div class="form-section ausbilder-card">' +
          '<label class="field-label">' + name + ' <span class="req">*</span></label>' +
          '<textarea rows="3" ' +
            'class="ausbilder-textarea" ' +
            'data-ausbilder="' + i + '" ' +
            'placeholder="Dein Feedback zu ' + name + ' (Pflichtfeld)&#x2026;" ' +
            'required>' +
          '</textarea>' +
          '</div>';
      });
      container.innerHTML = html;

      // Attach input listeners for submit gate
      container.querySelectorAll('.ausbilder-textarea').forEach(function(ta) {
        ta.addEventListener('input', updateSubmitState);
      });

      updateSubmitState();
    }

    // =====================================================
    // RATING TILES
    // =====================================================
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('.rating-grid').forEach(function(grid) {
        grid.addEventListener('click', function(e) {
          var tile = e.target.closest('.rating-tile');
          if (!tile) return;
          var section = grid.closest('.form-section');
          var questionId = section ? section.dataset.question : null;
          var value = parseInt(tile.textContent.trim(), 10);
          // Deselect all tiles in this grid
          grid.querySelectorAll('.rating-tile').forEach(function(t) {
            t.classList.remove('selected');
          });
          // Select clicked tile
          tile.classList.add('selected');
          // Track in formData
          if (questionId) formData[questionId] = value;
          // Clear required-missing on this section
          if (section) section.classList.remove('required-missing');
          // Per-question freitext (S2: show on ≤2, hide+clear on >2)
          var perQ = section && section.querySelector('.per-q-freitext');
          if (perQ) {
            perQ.style.display = (value <= 2) ? 'block' : 'none';
            if (value > 2) { var ta = perQ.querySelector('textarea'); if (ta) ta.value = ''; }
          }
          // Trigger section freitext check for the containing step
          var stepEl = grid.closest('.step');
          if (stepEl) checkSectionFreitext(stepEl);
        });
      });
    });

    // =====================================================
    // SUBMIT HANDLER
    // =====================================================
    async function submitFeedback() {
      var btn = document.getElementById('submitBtn');
      var errorEl = document.getElementById('submitError');

      // --- Loading state ---
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span>Wird gesendet\u2026';

      // Hide any previous error
      if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
      }

      // --- Assemble payload ---
      // Ratings: copy formData (already keyed by question ID, values 1-5)
      var ratings = {};
      Object.keys(formData).forEach(function(k) { ratings[k] = formData[k]; });

      // Freitexte per section (only non-empty values)
      var freitexte = {};
      var sectionMap = { '1': 'S1', '2': 'S3', '3': 'S2', '4': 'S4', '5': 'S5' };
      document.querySelectorAll('[data-freitext-input]').forEach(function(ta) {
        var val = ta.value.trim();
        if (val) {
          var stepKey = ta.dataset.freitextInput;
          var sectionId = sectionMap[stepKey] || stepKey;
          freitexte[sectionId] = val;
        }
      });

      // Per-Frage-Freitexte S2
      document.querySelectorAll('[data-freitext-q]').forEach(function(ta) {
        var val = ta.value.trim();
        if (val) freitexte[ta.dataset.freitextQ] = val;
      });

      // Allgemeines Freitext (step 6, no data-freitext-input attribute)
      var allgemeinesEl = document.querySelector('[data-step="6"] textarea:not(.ausbilder-textarea)');
      if (allgemeinesEl && allgemeinesEl.value.trim()) {
        freitexte['allgemein'] = allgemeinesEl.value.trim();
      }

      // Ausbilder feedback: named object using TEAM_MAP
      var ausbilder = {};
      var names = selectedGroup ? TEAM_MAP[selectedGroup] : [];
      document.querySelectorAll('.ausbilder-textarea').forEach(function(ta) {
        var idx = parseInt(ta.dataset.ausbilder, 10);
        var name = names && names[idx] ? names[idx] : ('Ausbilder*in ' + (idx + 1));
        var val = ta.value.trim();
        if (val) ausbilder[name] = val;
      });

      // Name (optional)
      var nameEl = document.querySelector('[data-step="0"] input[type=text]');
      var nameVal = nameEl ? nameEl.value.trim() : '';

      // Group display value: TEAM_MAP keys use plain numbers ("1"-"8", "SB 1", "SB 2")
      // selectedGroup holds this raw key; display as "Gruppe N" for 1-8, keep "SB N" as-is
      var groupDisplay = selectedGroup
        ? (/^\d+$/.test(selectedGroup) ? 'Gruppe ' + selectedGroup : selectedGroup)
        : '';

      var payload = {
        timestamp: new Date().toISOString(),
        group: groupDisplay,
        uni: selectedUni || ''
      };
      if (nameVal) payload.name = nameVal;
      payload.ratings = ratings;
      if (Object.keys(freitexte).length) payload.freitexte = freitexte;
      payload.ausbilder = ausbilder;

      // --- Supabase INSERT (atomic, kein Race Condition) ---
      try {
        var _insert = await supabaseClient.from('feedbacks').insert({ data: payload });
        if (_insert.error) throw new Error(_insert.error.message);

        // --- Success: show confirmation screen ---
        var confirmEl = document.getElementById('confirmationScreen');
        if (confirmEl) {
          document.querySelector('main').style.display = 'none';
          confirmEl.style.display = 'flex';
        }

      } catch (err) {
        // --- Error state ---
        btn.disabled = false;
        btn.textContent = 'Absenden';
        if (errorEl) {
          errorEl.textContent = 'Fehler beim Senden. Bitte versuche es erneut.';
          errorEl.style.display = 'block';
        }
      }
    }

    // =====================================================
    // ADMIN — data layer, compute, render
    // =====================================================
    async function initAdmin() {
      var mainEl = document.querySelector('main');
      var confirmEl = document.getElementById('confirmationScreen');
      var adminEl = document.getElementById('adminDashboard');
      var progressBarEl = document.getElementById('progressBar');
      if (mainEl) mainEl.style.display = 'none';
      if (confirmEl) confirmEl.style.display = 'none';
      if (progressBarEl) progressBarEl.style.display = 'none';
      if (adminEl) adminEl.style.display = 'block';

      adminEl.innerHTML = '<p style="padding:1rem;color:var(--text-muted)">Daten werden geladen\u2026</p>';

      try {
        var _ref = await supabaseClient
          .from('feedbacks')
          .select('data, created_at')
          .order('created_at', { ascending: true });
        if (_ref.error) throw new Error(_ref.error.message);
        var submissions = (_ref.data || []).map(function(r) { return r.data; });
        var adminData = computeAdminData(submissions);
        renderAdminDashboard(adminData, adminEl);
      } catch (err) {
        adminEl.innerHTML = '<p style="padding:1rem;color:red">Fehler beim Laden: ' + err.message + '</p>';
      }
    }

    function sortGroups(keys) {
      return keys.sort(function(a, b) {
        var aIsNum = /^Gruppe \d+$/.test(a);
        var bIsNum = /^Gruppe \d+$/.test(b);
        if (aIsNum && bIsNum) return parseInt(a.replace('Gruppe ', '')) - parseInt(b.replace('Gruppe ', ''));
        if (aIsNum) return -1;
        if (bIsNum) return 1;
        return a.localeCompare(b);
      });
    }

    function computeAdminData(submissions) {
      var total = submissions.length;

      // Group counts
      var groupCounts = {};
      submissions.forEach(function(s) {
        var g = s.group || 'Unbekannt';
        groupCounts[g] = (groupCounts[g] || 0) + 1;
      });

      // Per-question averages (global)
      var qSums = {}, qCounts = {};
      submissions.forEach(function(s) {
        if (!s.ratings) return;
        Object.keys(s.ratings).forEach(function(qId) {
          var v = s.ratings[qId];
          if (typeof v === 'number') {
            qSums[qId] = (qSums[qId] || 0) + v;
            qCounts[qId] = (qCounts[qId] || 0) + 1;
          }
        });
      });
      var qAverages = {};
      Object.keys(QUESTION_LABELS).forEach(function(qId) {
        qAverages[qId] = qCounts[qId] ? qSums[qId] / qCounts[qId] : null;
      });

      // Per-group per-question averages
      var gqSums = {}, gqCounts = {};
      submissions.forEach(function(s) {
        var g = s.group || 'Unbekannt';
        if (!gqSums[g]) { gqSums[g] = {}; gqCounts[g] = {}; }
        if (!s.ratings) return;
        Object.keys(s.ratings).forEach(function(qId) {
          var v = s.ratings[qId];
          if (typeof v === 'number') {
            gqSums[g][qId] = (gqSums[g][qId] || 0) + v;
            gqCounts[g][qId] = (gqCounts[g][qId] || 0) + 1;
          }
        });
      });
      var groupAverages = {};
      Object.keys(gqSums).forEach(function(g) {
        groupAverages[g] = {};
        Object.keys(QUESTION_LABELS).forEach(function(qId) {
          groupAverages[g][qId] = gqCounts[g][qId] ? gqSums[g][qId] / gqCounts[g][qId] : null;
        });
      });

      // Freitexte per section
      var freitexteBySection = {};
      submissions.forEach(function(s) {
        if (!s.freitexte) return;
        Object.keys(s.freitexte).forEach(function(key) {
          var text = (s.freitexte[key] || '').trim();
          if (!text) return;
          if (!freitexteBySection[key]) freitexteBySection[key] = [];
          freitexteBySection[key].push({ text: text, group: s.group || '' });
        });
      });

      // Ausbilder feedback
      var ausbilderFeedback = {};
      submissions.forEach(function(s) {
        if (!s.ausbilder) return;
        Object.keys(s.ausbilder).forEach(function(name) {
          var text = (s.ausbilder[name] || '').trim();
          if (!text) return;
          if (!ausbilderFeedback[name]) ausbilderFeedback[name] = [];
          ausbilderFeedback[name].push({ text: text, group: s.group || '' });
        });
      });

      return { total: total, groupCounts: groupCounts, qAverages: qAverages,
               groupAverages: groupAverages, freitexteBySection: freitexteBySection,
               ausbilderFeedback: ausbilderFeedback, submissions: submissions };
    }

    function renderAdminDashboard(adminData, adminEl) {
      var allAusbilder = [];
      Object.values(TEAM_MAP).forEach(function(arr) {
        arr.forEach(function(name) { if (allAusbilder.indexOf(name) === -1) allAusbilder.push(name); });
      });
      allAusbilder.sort();

      // Section → questions mapping (single source of truth for both Übersicht and Fragen)
      var SECTIONS = [
        { key: 'S1', label: 'Rahmen',        keys: ['S1-01','S1-02','S1-03'] },
        { key: 'S2', label: 'Ausbildung',    keys: ['S2-01','S2-02','S2-04','S2-05','S2-06','S2-07'] },
        { key: 'S3', label: 'Organisation',  keys: ['S3-01','S3-02'] },
        { key: 'S4', label: 'Pr\u00fcfung', keys: ['S4-01','S4-02','S4-03'] },
        { key: 'S5', label: 'Soziales',      keys: ['S5-01','S5-02','S5-03'] }
      ];

      var html = '';

      // Top bar
      html += '<div class="admin-topbar">';
      html += '<div><div class="admin-topbar-title">Admin</div>';
      html += '<div class="admin-topbar-meta">' + adminData.total + ' Teilnehmer*innen</div></div>';
      html += '<button id="exportBtn" class="btn-export" disabled>Excel</button>';
      html += '</div>';

      // Tab bar — Übersicht first
      html += '<div class="admin-tabs">';
      html += '<button class="admin-tab active" data-tab="overview">\u00dcbersicht</button>';
      html += '<button class="admin-tab" data-tab="ausbilder">Ausbilder*innen</button>';
      html += '<button class="admin-tab" data-tab="questions">Details</button>';
      html += '</div>';

      // ---- Panel 1: Ausbilder ----
      html += '<div class="admin-panel" id="panel-ausbilder">';
      html += '<p class="admin-panel-label">Ausbilder*in ausw\u00e4hlen</p>';
      html += '<div class="admin-name-grid">';
      allAusbilder.forEach(function(name) {
        var count = adminData.ausbilderFeedback[name] ? adminData.ausbilderFeedback[name].length : 0;
        html += '<button class="admin-name-pill" data-name="' + name + '">';
        html += '<span>' + name + '</span>';
        html += '<span class="admin-name-badge">' + count + '</span>';
        html += '</button>';
      });
      html += '</div>';
      html += '<div id="ausbilderFeedbackPanel">';
      html += '<p style="color:var(--text-muted);font-size:0.9rem;">Ausbilder*in ausw\u00e4hlen.</p>';
      html += '</div>';
      html += '</div>';

      // ---- Panel 2: Übersicht (default active) ----
      // KPI: Ø gesamt
      var allQVals = Object.keys(adminData.qAverages).map(function(k) { return adminData.qAverages[k]; }).filter(function(v) { return v !== null; });
      var gesamtAvg = allQVals.length ? allQVals.reduce(function(a,b){return a+b;},0) / allQVals.length : null;
      var numGruppen = Object.keys(adminData.groupCounts).length;

      html += '<div class="admin-panel active" id="panel-overview">';

      // KPI-Strip
      html += '<div class="admin-kpi-strip">';
      html += '<div class="admin-kpi-card"><div class="admin-kpi-value">' + adminData.total + '</div><div class="admin-kpi-label">Teilnehmer*innen</div></div>';
      html += '<div class="admin-kpi-card"><div class="admin-kpi-value">' + (gesamtAvg !== null ? gesamtAvg.toFixed(1) : '\u2014') + '</div><div class="admin-kpi-label">\u00d8 Gesamt</div></div>';
      html += '<div class="admin-kpi-card"><div class="admin-kpi-value">' + numGruppen + '</div><div class="admin-kpi-label">Gruppen</div></div>';
      html += '</div>';

      // Sektionsschnitte als Balken
      html += '<p class="admin-panel-label">Sektionsschnitte</p>';
      html += '<div class="admin-sec-list">';
      SECTIONS.forEach(function(sec) {
        var vals = sec.keys.map(function(k) { return adminData.qAverages[k]; }).filter(function(v) { return v !== null; });
        var avg = vals.length ? vals.reduce(function(a,b){return a+b;},0) / vals.length : null;
        var barW = avg !== null ? (avg / 6 * 100).toFixed(1) : 0;
        html += '<div class="admin-sec-row">';
        html += '<span class="admin-sec-label">' + sec.label + '</span>';
        html += '<div class="admin-sec-bar-track"><div class="admin-sec-bar-fill" style="width:' + barW + '%"></div></div>';
        html += '<span class="admin-sec-avg">' + (avg !== null ? avg.toFixed(1) : '\u2014') + '</span>';
        html += '</div>';
      });
      html += '</div>';

      // Gruppenvergleich
      html += '<p class="admin-panel-label">Gruppenvergleich</p>';
      html += '<div class="admin-group-list">';
      sortGroups(Object.keys(adminData.groupAverages)).forEach(function(g) {
        var gVals = Object.values(adminData.groupAverages[g]).filter(function(v) { return v !== null; });
        var gAvg = gVals.length ? gVals.reduce(function(a,b){return a+b;},0) / gVals.length : null;
        var barW = gAvg !== null ? (gAvg / 6 * 100).toFixed(1) : 0;
        html += '<div class="admin-group-row">';
        html += '<span class="admin-group-name">' + g + '</span>';
        html += '<span class="admin-group-n">n=' + (adminData.groupCounts[g] || 0) + '</span>';
        html += '<div class="admin-group-bar-track"><div class="admin-group-bar-fill" style="width:' + barW + '%"></div></div>';
        html += '<span class="admin-group-avg">' + (gAvg !== null ? gAvg.toFixed(1) : '\u2014') + '</span>';
        html += '</div>';
      });
      html += '</div>';

      // Allgemeine Freitext-Karten
      var allgFT = adminData.freitexteBySection['allgemein'] || [];
      if (allgFT.length) {
        html += '<p class="admin-panel-label">Allgemeines Feedback</p>';
        allgFT.forEach(function(entry) {
          html += '<div class="admin-freitext-card"><p class="admin-freitext-text">' + entry.text + '</p><p class="admin-freitext-meta">' + entry.group + '</p></div>';
        });
      }

      html += '</div>';

      // ---- Panel 3: Fragen ----
      html += '<div class="admin-panel" id="panel-questions">';
      // Section filter pills
      html += '<div class="admin-pill-grid">';
      html += '<button class="admin-pill active" data-section="alle">Alle</button>';
      SECTIONS.forEach(function(sec) {
        html += '<button class="admin-pill" data-section="' + sec.key + '">' + sec.label + '</button>';
      });
      html += '</div>';
      // Question rows — grouped by section, each tagged with data-section
      html += '<div class="admin-q-list" id="questionList">';
      SECTIONS.forEach(function(sec) {
        sec.keys.forEach(function(qId) {
          var avg = adminData.qAverages[qId];
          var barW = avg ? (avg / 5 * 100).toFixed(1) : 0;
          html += '<div class="admin-q-row" data-section="' + sec.key + '">';
          html += '<span class="admin-q-label">' + QUESTION_LABELS[qId] + '</span>';
          html += '<div class="admin-q-bar-track"><div class="admin-q-bar-fill" style="width:' + barW + '%"></div></div>';
          html += '<span class="admin-q-avg">' + (avg !== null ? avg.toFixed(1) : '\u2014') + '</span>';
          html += '</div>';
        });
      });
      html += '</div>';
      html += '</div>';

      adminEl.innerHTML = html;
      window.lastAdminData = adminData;

      // Tab switching
      adminEl.querySelectorAll('.admin-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          adminEl.querySelectorAll('.admin-tab').forEach(function(t) { t.classList.remove('active'); });
          adminEl.querySelectorAll('.admin-panel').forEach(function(p) { p.classList.remove('active'); });
          tab.classList.add('active');
          document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
        });
      });

      // Ausbilder name pills
      adminEl.querySelectorAll('.admin-name-pill').forEach(function(pill) {
        pill.addEventListener('click', function() {
          adminEl.querySelectorAll('.admin-name-pill').forEach(function(p) { p.classList.remove('active'); });
          pill.classList.add('active');
          var name = pill.dataset.name;
          var panel = document.getElementById('ausbilderFeedbackPanel');
          var entries = adminData.ausbilderFeedback[name] || [];
          if (!entries.length) {
            panel.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">Noch kein Feedback f\u00fcr ' + name + '.</p>';
            return;
          }
          var h = '';
          entries.forEach(function(entry) {
            h += '<div class="admin-freitext-card"><p class="admin-freitext-text">' + entry.text + '</p><p class="admin-freitext-meta">' + entry.group + '</p></div>';
          });
          panel.innerHTML = h;
        });
      });

      // Section filter pills (Fragen tab)
      adminEl.querySelectorAll('.admin-pill[data-section]').forEach(function(pill) {
        pill.addEventListener('click', function() {
          adminEl.querySelectorAll('.admin-pill[data-section]').forEach(function(p) { p.classList.remove('active'); });
          pill.classList.add('active');
          var sec = pill.dataset.section;
          adminEl.querySelectorAll('#questionList .admin-q-row').forEach(function(row) {
            row.style.display = (sec === 'alle' || row.dataset.section === sec) ? '' : 'none';
          });
        });
      });

      // Export button
      var exportBtn = document.getElementById('exportBtn');
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.addEventListener('click', function() { exportToExcel(window.lastAdminData); });
      }
    }

    function exportToExcel(adminData) {
      // All unique Ausbilder (consistent column order)
      var allAusbilder = [];
      Object.values(TEAM_MAP).forEach(function(arr) {
        arr.forEach(function(name) { if (allAusbilder.indexOf(name) === -1) allAusbilder.push(name); });
      });
      allAusbilder.sort();

      var qKeys = Object.keys(QUESTION_LABELS);

      // ---- Sheet 1: Einzelantworten ----
      var headerRow = ['Timestamp', 'Gruppe', 'Hochschule', 'Name']
        .concat(qKeys.map(function(k) { return k + ' ' + QUESTION_LABELS[k]; }))
        .concat(['S1 Freitext', 'S3 Freitext',
                 'S2-01 Freitext', 'S2-02 Freitext', 'S2-04 Freitext',
                 'S2-05 Freitext', 'S2-06 Freitext', 'S2-07 Freitext',
                 'S4 Freitext', 'S5 Freitext', 'Allgemeines Freitext'])
        .concat(allAusbilder.map(function(n) { return 'Ausbilder*in: ' + n; }));

      var dataRows = adminData.submissions.map(function(s) {
        var ratings = qKeys.map(function(q) { return s.ratings ? (s.ratings[q] || '') : ''; });
        var freitexte = ['S1', 'S3', 'S2-01', 'S2-02', 'S2-04', 'S2-05', 'S2-06', 'S2-07', 'S4', 'S5', 'allgemein'].map(function(k) {
          return s.freitexte ? (s.freitexte[k] || '') : '';
        });
        var ausbilderCols = allAusbilder.map(function(n) { return s.ausbilder ? (s.ausbilder[n] || '') : ''; });
        return [s.timestamp, s.group, s.uni || '', s.name || ''].concat(ratings).concat(freitexte).concat(ausbilderCols);
      });
      var sheet1 = XLSX.utils.aoa_to_sheet([headerRow].concat(dataRows));

      // ---- Sheet 2: Zusammenfassung ----
      var partAHeader = ['Frage-ID', 'Frage', '\u00d8 gesamt'];
      var partARows = qKeys.map(function(qId) {
        var avg = adminData.qAverages[qId];
        return [qId, QUESTION_LABELS[qId], avg !== null ? +avg.toFixed(2) : ''];
      });
      var blankRow = [''];
      var partBHeader = ['Gruppe', '\u00d8 gesamt', 'N Teilnehmer*innen'];
      var sortedGroups = sortGroups(Object.keys(adminData.groupAverages));
      var partBRows = sortedGroups.map(function(g) {
        var qVals = Object.values(adminData.groupAverages[g]).filter(function(v) { return v !== null; });
        var overallAvg = qVals.length ? (qVals.reduce(function(a, b) { return a + b; }, 0) / qVals.length) : null;
        return [g, overallAvg !== null ? +overallAvg.toFixed(2) : '', adminData.groupCounts[g] || 0];
      });
      var sheet2 = XLSX.utils.aoa_to_sheet([partAHeader].concat(partARows).concat([blankRow]).concat([partBHeader]).concat(partBRows));

      // ---- Sheet 3: Ausbilder-Feedback ----
      var sheet3Rows = [['Ausbilder*in', 'Gruppe', 'Feedback']];
      allAusbilder.forEach(function(name) {
        (adminData.ausbilderFeedback[name] || []).forEach(function(entry) {
          sheet3Rows.push([name, entry.group, entry.text]);
        });
      });
      var sheet3 = XLSX.utils.aoa_to_sheet(sheet3Rows);

      // ---- Sheet 4: Gruppenvergleich (Kreuztabelle) ----
      var exportSECTIONS = [
        { key: 'S1', label: 'S1 Rahmen',        keys: ['S1-01','S1-02','S1-03'] },
        { key: 'S2', label: 'S2 Ausbildung',    keys: ['S2-01','S2-02','S2-04','S2-05','S2-06','S2-07'] },
        { key: 'S3', label: 'S3 Organisation',  keys: ['S3-01','S3-02'] },
        { key: 'S4', label: 'S4 Pr\u00fcfung',  keys: ['S4-01','S4-02','S4-03'] },
        { key: 'S5', label: 'S5 Soziales',      keys: ['S5-01','S5-02','S5-03'] }
      ];
      var sheet4Header = ['Gruppe', 'N', '\u00d8 gesamt'].concat(exportSECTIONS.map(function(s) { return s.label; }));
      var sheet4Rows = sortGroups(Object.keys(adminData.groupAverages)).map(function(g) {
        var gVals = Object.values(adminData.groupAverages[g]).filter(function(v) { return v !== null; });
        var gAvg = gVals.length ? gVals.reduce(function(a,b){return a+b;},0) / gVals.length : null;
        var secAvgs = exportSECTIONS.map(function(sec) {
          var sVals = sec.keys.map(function(k) { return adminData.groupAverages[g][k]; }).filter(function(v) { return v !== null; });
          return sVals.length ? +(sVals.reduce(function(a,b){return a+b;},0) / sVals.length).toFixed(2) : '';
        });
        return [g, adminData.groupCounts[g] || 0, gAvg !== null ? +gAvg.toFixed(2) : ''].concat(secAvgs);
      });
      var sheet4 = XLSX.utils.aoa_to_sheet([sheet4Header].concat(sheet4Rows));

      // ---- Assemble workbook ----
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet1, 'Einzelantworten');
      XLSX.utils.book_append_sheet(wb, sheet2, 'Zusammenfassung');
      XLSX.utils.book_append_sheet(wb, sheet3, 'Ausbilder-Feedback');
      XLSX.utils.book_append_sheet(wb, sheet4, 'Gruppenvergleich');
      XLSX.writeFile(wb, 'Lehrgangskritik-Valmorel-Export.xlsx');
    }

    // =====================================================
    // INIT
    // =====================================================
    document.addEventListener('DOMContentLoaded', function() {
      var urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('admin') === 'true') {
        initAdmin();
        return;
      }

      showStep(0);
      renderAusbilder(null);
      updateSubmitState();

      // Attach submit handler
      var submitBtn = document.getElementById('submitBtn');
      if (submitBtn) {
        submitBtn.addEventListener('click', submitFeedback);
      }
    });

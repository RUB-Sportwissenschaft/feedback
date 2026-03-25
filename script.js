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
      'rating_skibo_service':     'Reiseveranstalter',
      'rating_prep_info':         'Vorab-Informationen',
      'rating_costs':             'Kosten / Preis-Leistung',
      'rating_location':          'Ausbildungsort',
      'rating_driving_skills':    'Fahrerisches K\u00f6nnen',
      'rating_teaching_skills':   'Lehrkompetenz',
      'rating_methodology':       'Einsteigermethodik',
      'rating_video_analysis':    'Videoanalysen',
      'rating_lvs_training':      'Versch\u00fcttetensuche',
      'rating_theory':            'Theorie-Inhalte',
      'rating_snow_event':        'Schnee-Event',
      'rating_organisation':      'Lehrgangs-Organisation',
      'rating_workload':          'Zeitliche Belastung',
      'rating_group_split':       'Gruppeneinteilung',
      'rating_exam_org':          'Pr\u00fcfungs-Organisation',
      'rating_exam_difficulty':   'Pr\u00fcfungsanforderungen',
      'rating_exam_clarity':      'Klarheit der Kriterien',
      'rating_hut_evening':       'H\u00fcttenabend',
      'rating_apres_ski':         'Apr\u00e8s-Ski',
      'rating_social_atmosphere': 'Soziales Miteinander'
    };

    // =====================================================
    // SECTION LABELS — admin freitext display
    // =====================================================
    const SECTION_LABELS = {
      'S1': 'S1 \u2014 Vorbereitung & Rahmen',
      'S2': 'S2 \u2014 Kern-Ausbildung',
      'S3': 'S3 \u2014 Spezialthemen & Sicherheit',
      'S4': 'S4 \u2014 Organisation vor Ort',
      'S5': 'S5 \u2014 Pr\u00fcfung',
      'S6': 'S6 \u2014 Soziales & Miteinander',
      'feedback_instructor': 'Ausbilder-Feedback',
      'feedback_general':    'Allgemeines Feedback'
    };

    // =====================================================
    // SECTIONS — Section → Question-Keys Mapping
    // =====================================================
    const SECTIONS = [
      { key: 'S1', label: 'Vorbereitung', keys: ['rating_skibo_service','rating_prep_info','rating_costs','rating_location'] },
      { key: 'S2', label: 'Praxis',       keys: ['rating_driving_skills','rating_teaching_skills','rating_methodology','rating_video_analysis'] },
      { key: 'S3', label: 'Themen',       keys: ['rating_lvs_training','rating_theory','rating_snow_event'] },
      { key: 'S4', label: 'Ablauf',       keys: ['rating_organisation','rating_workload','rating_group_split'] },
      { key: 'S5', label: 'Pr\u00fcfung', keys: ['rating_exam_org','rating_exam_difficulty','rating_exam_clarity'] },
      { key: 'S6', label: 'Soziales',     keys: ['rating_hut_evening','rating_apres_ski','rating_social_atmosphere'] }
    ];

    // =====================================================
    // FORM STATE
    // =====================================================
    let selectedGroup = null;
    let selectedUni = null;
    const formData = {}; // keyed by data-question ID, value 1-5

    // Active Chart.js instance for trainer radar (destroyed on re-render)
    var activeTrainerChart = null;

    // =====================================================
    // WIZARD STATE
    // =====================================================
    let currentStep = 0;
    const totalSteps = 8;

    const sectionNames = [
      'Start',
      'S1 \u2014 Vorbereitung',
      'S2 \u2014 Praxis',
      'S3 \u2014 Themen',
      'S4 \u2014 Ablauf',
      'S5 \u2014 Pr\u00fcfung',
      'S6 \u2014 Soziales',
      'S7 \u2014 Abschluss'
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
    const BIPOLAR_IDS = ['rating_costs', 'rating_workload', 'rating_exam_difficulty'];

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

        if (BIPOLAR_IDS.indexOf(qId) !== -1) {
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

      // Gate 2: Ausbilder-Feedback textarea must be filled
      var instructorTextarea = document.getElementById('instructorFeedback');
      var allFilled = instructorTextarea ? instructorTextarea.value.trim().length > 0 : false;

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
          '<label class="field-label">Ausbilder-Feedback <span class="req">*</span></label>' +
          '<p style="color:var(--text-muted);font-style:italic;font-size:0.9rem;">' +
          'Nach Auswahl deiner Gruppe erscheinen hier die Ausbilder*innen zur Bewertung.' +
          '</p></div>';
        return;
      }

      var names = ausbilder.join(' & ');
      var html =
        '<div class="form-section">' +
        '<label class="field-label">Ausbilder-Feedback: ' + names + ' <span class="req">*</span></label>' +
        '<p class="question-subtitle">Wie bewertest du die fachliche Betreuung?</p>' +
        '<textarea rows="4" id="instructorFeedback" ' +
          'placeholder="Dein Feedback zu ' + names + ' (Pflichtfeld)\u2026" ' +
          'required></textarea>' +
        '</div>';
      container.innerHTML = html;

      // Attach input listener for submit gate
      container.querySelectorAll('textarea').forEach(function(ta) {
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
      var sectionMap = { '1': 'S1', '2': 'S2', '3': 'S3', '4': 'S4', '5': 'S5', '6': 'S6' };
      document.querySelectorAll('[data-freitext-input]').forEach(function(ta) {
        var val = ta.value.trim();
        if (val) {
          var stepKey = ta.dataset.freitextInput;
          var sectionId = sectionMap[stepKey] || stepKey;
          freitexte[sectionId] = val;
        }
      });

      // Ausbilder-Feedback (Pflicht)
      var instructorEl = document.getElementById('instructorFeedback');
      if (instructorEl && instructorEl.value.trim()) {
        freitexte['feedback_instructor'] = instructorEl.value.trim();
      }

      // Allgemeines Feedback (optional)
      var generalEl = document.getElementById('feedbackGeneral');
      if (generalEl && generalEl.value.trim()) {
        freitexte['feedback_general'] = generalEl.value.trim();
      }

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

    // =====================================================
    // STOPWORDS (DE) — for tag cloud
    // =====================================================
    const STOPWORDS_DE = new Set([
      'der','die','das','ein','eine','und','ist','ich','hat','war','in','im','an','am',
      'mit','von','zu','zum','zur','auf','f\u00fcr','bei','es','sie','wir','du','er',
      'sein','auch','als','aber','wie','oder','wenn','dass','sehr','gut','nicht','noch',
      'mehr','so','da','mir','uns','dem','den','des','einer','eines','waren','haben',
      'hatte','wird','werden','wurde','worden','kann','doch','mal','aus','durch','nach',
      '\u00fcber','vor','unter','alle','alles','man','sich','mich','dich','ihr','ihn',
      'ihm','habe','bist','sind','euch','ihnen','diese','dieser','dieses','diesen',
      'diesem','jeder','jede','kein','keine','keiner','viel','viele','wenig','beim',
      'weil','aber','dann','also','hier','dort','schon','immer','jetzt','eine','einen',
      'etwas','wurde','haben','hatte','muss','kann','konnte','sollte','w\u00e4re',
      'h\u00e4tte','gibt','gab','beim','ohne','selbst','immer','schon','halt','leider',
      'finde','fand','habe','wurde','wurden','wird','denn','mal','war','war','wir'
    ]);

    // Compute per-section averages for all groups a trainer is assigned to
    function computeTrainerSectionAverages(trainerName, submissions) {
      var trainerGroups = [];
      Object.keys(TEAM_MAP).forEach(function(key) {
        if (TEAM_MAP[key].indexOf(trainerName) !== -1) {
          trainerGroups.push(/^\d+$/.test(key) ? 'Gruppe ' + key : key);
        }
      });
      var secSums = {}, secCounts = {};
      SECTIONS.forEach(function(sec) { secSums[sec.key] = 0; secCounts[sec.key] = 0; });
      submissions.forEach(function(s) {
        if (!s.group || trainerGroups.indexOf(s.group) === -1) return;
        if (!s.ratings) return;
        SECTIONS.forEach(function(sec) {
          sec.keys.forEach(function(qId) {
            var v = s.ratings[qId];
            if (typeof v === 'number') { secSums[sec.key] += v; secCounts[sec.key]++; }
          });
        });
      });
      return SECTIONS.map(function(sec) {
        return secCounts[sec.key] ? +(secSums[sec.key] / secCounts[sec.key]).toFixed(2) : null;
      });
    }

    // Word frequency count for tag cloud
    function computeWordFrequencies(freitexteBySection) {
      var freq = {};
      Object.keys(freitexteBySection).forEach(function(key) {
        freitexteBySection[key].forEach(function(entry) {
          var words = entry.text.toLowerCase()
            .replace(/[^a-z\u00e4\u00f6\u00fc\u00df\s]/g, ' ')
            .split(/\s+/)
            .filter(function(w) { return w.length > 3 && !STOPWORDS_DE.has(w); });
          words.forEach(function(w) { freq[w] = (freq[w] || 0) + 1; });
        });
      });
      return freq;
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
        // Count submissions from this trainer's groups
        var trainerGroups = [];
        Object.keys(TEAM_MAP).forEach(function(key) {
          if (TEAM_MAP[key].indexOf(name) !== -1)
            trainerGroups.push(/^\d+$/.test(key) ? 'Gruppe ' + key : key);
        });
        var count = adminData.submissions.filter(function(s) { return trainerGroups.indexOf(s.group) !== -1; }).length;
        html += '<button class="admin-name-pill" data-name="' + name + '">';
        html += '<span>' + name + '</span>';
        html += '<span class="admin-name-badge">' + count + '</span>';
        html += '</button>';
      });
      html += '</div>';
      html += '<div class="admin-chart-wrap" id="trainerChartWrap" style="display:none;">';
      html += '<canvas id="trainerRadarChart" height="220"></canvas>';
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

      // Sektionsschnitte als Chart.js Bar/Line
      html += '<p class="admin-panel-label">Sektionsschnitte</p>';
      html += '<div class="admin-chart-wrap"><canvas id="sectionChart" height="220"></canvas></div>';

      // Gruppenvergleich (HTML-Balken, Skala 1-5)
      html += '<p class="admin-panel-label">Gruppenvergleich</p>';
      html += '<div class="admin-group-list">';
      sortGroups(Object.keys(adminData.groupAverages)).forEach(function(g) {
        var gVals = Object.values(adminData.groupAverages[g]).filter(function(v) { return v !== null; });
        var gAvg = gVals.length ? gVals.reduce(function(a,b){return a+b;},0) / gVals.length : null;
        var barW = gAvg !== null ? ((gAvg - 1) / 4 * 100).toFixed(1) : 0;
        html += '<div class="admin-group-row">';
        html += '<span class="admin-group-name">' + g + '</span>';
        html += '<span class="admin-group-n">n=' + (adminData.groupCounts[g] || 0) + '</span>';
        html += '<div class="admin-group-bar-track"><div class="admin-group-bar-fill" style="width:' + barW + '%"></div></div>';
        html += '<span class="admin-group-avg">' + (gAvg !== null ? gAvg.toFixed(1) : '\u2014') + '</span>';
        html += '</div>';
      });
      html += '</div>';

      // Tag-Cloud aus Freitexten
      var wordFreqs = computeWordFrequencies(adminData.freitexteBySection);
      var topWords = Object.keys(wordFreqs).sort(function(a,b){return wordFreqs[b]-wordFreqs[a];}).slice(0,30);
      if (topWords.length) {
        var maxFreq = wordFreqs[topWords[0]];
        html += '<p class="admin-panel-label">H\u00e4ufige Begriffe</p>';
        html += '<div class="admin-tag-cloud">';
        topWords.forEach(function(w) {
          var size = (0.78 + (wordFreqs[w] / maxFreq) * 0.72).toFixed(2);
          html += '<span class="admin-tag" style="font-size:' + size + 'rem;">' + w + '</span>';
        });
        html += '</div>';
      }

      // Allgemeines Feedback-Karten
      var allgFT = adminData.freitexteBySection['feedback_general'] || [];
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

      // ---- Section Chart (Bar + Line) ----
      var secChartEl = document.getElementById('sectionChart');
      if (secChartEl && window.Chart) {
        var secLabels = SECTIONS.map(function(s) { return s.label; });
        var secAvgVals = SECTIONS.map(function(sec) {
          var vals = sec.keys.map(function(k) { return adminData.qAverages[k]; }).filter(function(v) { return v !== null; });
          return vals.length ? +(vals.reduce(function(a,b){return a+b;},0) / vals.length).toFixed(2) : null;
        });
        var validSecVals = secAvgVals.filter(function(v) { return v !== null; });
        var overallAvg = validSecVals.length ? +(validSecVals.reduce(function(a,b){return a+b;},0) / validSecVals.length).toFixed(2) : 3;
        new window.Chart(secChartEl, {
          data: {
            labels: secLabels,
            datasets: [
              { type: 'bar', label: 'Ø Sektion', data: secAvgVals,
                backgroundColor: 'rgba(0,53,96,0.75)', borderColor: '#003560',
                borderWidth: 1, borderRadius: 4 },
              { type: 'line', label: 'Ø gesamt', data: secAvgVals.map(function(){ return overallAvg; }),
                borderColor: '#EC633A', borderWidth: 2, borderDash: [5,4],
                pointRadius: 0, fill: false, tension: 0 }
            ]
          },
          options: {
            scales: { y: { min: 1, max: 5, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } },
            responsive: true, maintainAspectRatio: false
          }
        });
      }

      // Tab switching
      adminEl.querySelectorAll('.admin-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          adminEl.querySelectorAll('.admin-tab').forEach(function(t) { t.classList.remove('active'); });
          adminEl.querySelectorAll('.admin-panel').forEach(function(p) { p.classList.remove('active'); });
          tab.classList.add('active');
          document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
        });
      });

      // Ausbilder name pills + Radar Chart
      adminEl.querySelectorAll('.admin-name-pill').forEach(function(pill) {
        pill.addEventListener('click', function() {
          adminEl.querySelectorAll('.admin-name-pill').forEach(function(p) { p.classList.remove('active'); });
          pill.classList.add('active');
          var name = pill.dataset.name;

          // Radar chart
          var radarCanvas = document.getElementById('trainerRadarChart');
          var chartWrap = document.getElementById('trainerChartWrap');
          if (activeTrainerChart) { activeTrainerChart.destroy(); activeTrainerChart = null; }
          if (radarCanvas && chartWrap && window.Chart) {
            var avgs = computeTrainerSectionAverages(name, adminData.submissions);
            var hasData = avgs.some(function(v) { return v !== null; });
            if (hasData) {
              chartWrap.style.display = 'block';
              activeTrainerChart = new window.Chart(radarCanvas, {
                type: 'radar',
                data: {
                  labels: SECTIONS.map(function(s) { return s.label; }),
                  datasets: [{ label: name, data: avgs.map(function(v){ return v || 0; }),
                    backgroundColor: 'rgba(236,99,58,0.18)', borderColor: '#EC633A',
                    borderWidth: 2, pointBackgroundColor: '#EC633A', pointRadius: 3 }]
                },
                options: {
                  scales: { r: { min: 1, max: 5, ticks: { stepSize: 1 },
                    pointLabels: { font: { size: 10 } } } },
                  plugins: { legend: { display: false } },
                  responsive: true, maintainAspectRatio: false
                }
              });
            } else { chartWrap.style.display = 'none'; }
          }

          // Feedback cards (from feedback_instructor, filtered by trainer's groups)
          var trainerGroups = [];
          Object.keys(TEAM_MAP).forEach(function(key) {
            if (TEAM_MAP[key].indexOf(name) !== -1)
              trainerGroups.push(/^\d+$/.test(key) ? 'Gruppe ' + key : key);
          });
          var panel = document.getElementById('ausbilderFeedbackPanel');
          var entries = (adminData.freitexteBySection['feedback_instructor'] || [])
            .filter(function(e) { return trainerGroups.indexOf(e.group) !== -1; });
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
      var qKeys = Object.keys(QUESTION_LABELS);
      var sortedGroups = sortGroups(Object.keys(adminData.groupAverages));

      // Freitext-Schlüssel für Sheet 1
      var freitextKeys = ['S1','S2','S3','S4','S5','S6','feedback_instructor','feedback_general'];
      var freitextLabels = {
        'S1': 'S1 Freitext', 'S2': 'S2 Freitext', 'S3': 'S3 Freitext',
        'S4': 'S4 Freitext', 'S5': 'S5 Freitext', 'S6': 'S6 Freitext',
        'feedback_instructor': 'Ausbilder-Feedback', 'feedback_general': 'Allgemeines Feedback'
      };

      // ---- Sheet 1: Einzelantworten ----
      var headerRow = ['Timestamp', 'Gruppe', 'Hochschule', 'Name']
        .concat(qKeys.map(function(k) { return QUESTION_LABELS[k]; }))
        .concat(freitextKeys.map(function(k) { return freitextLabels[k]; }));

      var dataRows = adminData.submissions.map(function(s) {
        var ratings = qKeys.map(function(q) { return s.ratings ? (s.ratings[q] || '') : ''; });
        var freitexte = freitextKeys.map(function(k) { return s.freitexte ? (s.freitexte[k] || '') : ''; });
        return [s.timestamp, s.group || '', s.uni || '', s.name || ''].concat(ratings).concat(freitexte);
      });
      var sheet1 = XLSX.utils.aoa_to_sheet([headerRow].concat(dataRows));

      // ---- Sheet 2: Zusammenfassung ----
      var partAHeader = ['Frage', 'ID', '\u00d8 gesamt'];
      var partARows = qKeys.map(function(qId) {
        var avg = adminData.qAverages[qId];
        return [QUESTION_LABELS[qId], qId, avg !== null ? +avg.toFixed(2) : ''];
      });
      var blankRow = [''];
      var partBHeader = ['Gruppe', '\u00d8 gesamt', 'N'];
      var partBRows = sortedGroups.map(function(g) {
        var qVals = Object.values(adminData.groupAverages[g]).filter(function(v) { return v !== null; });
        var overallAvg = qVals.length ? qVals.reduce(function(a,b){return a+b;},0) / qVals.length : null;
        return [g, overallAvg !== null ? +overallAvg.toFixed(2) : '', adminData.groupCounts[g] || 0];
      });
      var sheet2 = XLSX.utils.aoa_to_sheet([partAHeader].concat(partARows).concat([blankRow]).concat([partBHeader]).concat(partBRows));

      // ---- Sheet 3: Ausbilder-Feedback ----
      var sheet3Rows = [['Gruppe', 'Feedback']];
      (adminData.freitexteBySection['feedback_instructor'] || []).forEach(function(entry) {
        sheet3Rows.push([entry.group, entry.text]);
      });
      var sheet3 = XLSX.utils.aoa_to_sheet(sheet3Rows);

      // ---- Sheet 4: Gruppenvergleich (Kreuztabelle) + Totals ----
      var sheet4Header = ['Gruppe', 'N', '\u00d8 gesamt'].concat(SECTIONS.map(function(s) { return s.label; }));
      var sheet4DataRows = sortedGroups.map(function(g) {
        var gVals = Object.values(adminData.groupAverages[g]).filter(function(v) { return v !== null; });
        var gAvg = gVals.length ? gVals.reduce(function(a,b){return a+b;},0) / gVals.length : null;
        var secAvgs = SECTIONS.map(function(sec) {
          var sVals = sec.keys.map(function(k) { return adminData.groupAverages[g][k]; }).filter(function(v) { return v !== null; });
          return sVals.length ? +(sVals.reduce(function(a,b){return a+b;},0) / sVals.length).toFixed(2) : '';
        });
        return [g, adminData.groupCounts[g] || 0, gAvg !== null ? +gAvg.toFixed(2) : ''].concat(secAvgs);
      });
      // Totals row
      var totalN = adminData.total;
      var totalAvgAll = Object.keys(adminData.qAverages).map(function(k){ return adminData.qAverages[k]; }).filter(function(v){ return v !== null; });
      var totalAvg = totalAvgAll.length ? +(totalAvgAll.reduce(function(a,b){return a+b;},0) / totalAvgAll.length).toFixed(2) : '';
      var totalSecAvgs = SECTIONS.map(function(sec) {
        var vals = sec.keys.map(function(k){ return adminData.qAverages[k]; }).filter(function(v){ return v !== null; });
        return vals.length ? +(vals.reduce(function(a,b){return a+b;},0) / vals.length).toFixed(2) : '';
      });
      var totalsRow = ['\u00d8 gesamt', totalN, totalAvg].concat(totalSecAvgs);
      var sheet4 = XLSX.utils.aoa_to_sheet([sheet4Header].concat(sheet4DataRows).concat([totalsRow]));

      // ---- Sheet 5: Alle Freitexte ----
      var sheet5Rows = [['Sektion', 'Gruppe', 'Text']];
      Object.keys(adminData.freitexteBySection).forEach(function(key) {
        var label = (SECTION_LABELS[key] || key);
        (adminData.freitexteBySection[key] || []).forEach(function(entry) {
          sheet5Rows.push([label, entry.group, entry.text]);
        });
      });
      var sheet5 = XLSX.utils.aoa_to_sheet(sheet5Rows);

      // ---- Assemble workbook ----
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet1, 'Einzelantworten');
      XLSX.utils.book_append_sheet(wb, sheet2, 'Zusammenfassung');
      XLSX.utils.book_append_sheet(wb, sheet3, 'Ausbilder-Feedback');
      XLSX.utils.book_append_sheet(wb, sheet4, 'Gruppenvergleich');
      XLSX.utils.book_append_sheet(wb, sheet5, 'Freitexte');
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

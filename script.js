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

    // Alle Ausbilder-Namen, sortiert (aus TEAM_MAP abgeleitet)
    const ALL_AUSBILDER = (function() {
      var list = [];
      Object.values(TEAM_MAP).forEach(function(arr) {
        arr.forEach(function(n) { if (list.indexOf(n) === -1) list.push(n); });
      });
      return list.sort();
    })();

    // --- QUESTION LABELS — admin dashboard display ---
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

    // --- SECTION LABELS — admin freitext display ---
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

    // --- SECTIONS — Section → Question-Keys Mapping ---
    const SECTIONS = [
      { key: 'S1', label: 'Vorbereitung', keys: ['rating_skibo_service','rating_prep_info','rating_costs','rating_location'] },
      { key: 'S2', label: 'Praxis',       keys: ['rating_driving_skills','rating_teaching_skills','rating_methodology','rating_video_analysis'] },
      { key: 'S3', label: 'Themen',       keys: ['rating_lvs_training','rating_theory','rating_snow_event'] },
      { key: 'S4', label: 'Ablauf',       keys: ['rating_organisation','rating_workload','rating_group_split'] },
      { key: 'S5', label: 'Pr\u00fcfung', keys: ['rating_exam_org','rating_exam_difficulty','rating_exam_clarity'] },
      { key: 'S6', label: 'Soziales',     keys: ['rating_hut_evening','rating_apres_ski','rating_social_atmosphere'] }
    ];

    // --- AUSBILDER-RELEVANT QUESTIONS — shown in trainer radar + bar list ---
    const AUSBILDER_QUESTIONS = [
      'rating_driving_skills',
      'rating_teaching_skills',
      'rating_video_analysis',
      'rating_lvs_training',
      'rating_organisation',
      'rating_workload',
      'rating_exam_org',
      'rating_exam_difficulty',
      'rating_exam_clarity'
    ];
    const AUSBILDER_Q_SHORT = {
      'rating_driving_skills':  'Fahren',
      'rating_teaching_skills': 'Lehren',
      'rating_video_analysis':  'Video',
      'rating_lvs_training':    'LVS',
      'rating_organisation':    'Organis.',
      'rating_workload':        'Belastung',
      'rating_exam_org':        'Pr\u00fcf.-Org.',
      'rating_exam_difficulty': 'Anford.',
      'rating_exam_clarity':    'Kriterien'
    };

    // --- FORM STATE ---
    let selectedGroup = null;
    let selectedUni = null;
    const formData = {}; // keyed by data-question ID, value 1-5

    // Active Chart.js instance for trainer radar (destroyed on re-render)
    var activeTrainerChart = null;

    // --- WIZARD STATE ---
    let currentStep = 0;
    const totalSteps = 8;

    const sectionNames = [
      'Start',
      'S1 \u2014 Reise & Ausbildungsort',
      'S2 \u2014 Praktische Ausbildung',
      'S3 \u2014 Lehrgangsthemen',
      'S4 \u2014 Ablauf & Organisation',
      'S5 \u2014 Pr\u00fcfung',
      'S6 \u2014 Soziales Miteinander',
      'S7 \u2014 Ausbilder*innen & Abschluss'
    ];
    const STEP_ICONS = ['\uD83D\uDC4B', '\uD83D\uDDFA\uFE0F', '\u26F7\uFE0F', '\uD83C\uDFD4\uFE0F', '\uD83D\uDCCB', '\uD83D\uDCDD', '\uD83E\uDD1D', '\uD83D\uDC65'];
    const TILE_EMOJIS = { 1: '\uD83D\uDE1E', 2: '\uD83D\uDE15', 3: '\uD83D\uDE10', 4: '\uD83D\uDE42', 5: '\uD83D\uDE00' };

    // --- SHOW STEP ---
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
      document.getElementById('progressSectionName').textContent = (STEP_ICONS[n] ? STEP_ICONS[n] + ' ' : '') + (sectionNames[n] || '');
    }

    // --- NAVIGATION ---
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

    // --- GROUP SELECTOR ---
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

    // --- FREITEXT REVEAL LOGIC ---
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
        if (rating <= 2) shouldShow = true;
      });

      freitextCard.style.display = shouldShow ? 'block' : 'none';
    }

    // --- SUBMIT GATE ---
    function updateSubmitState() {
      var btn = document.getElementById('submitBtn');
      if (!btn) return;

      // Gate 1: group and uni must be selected
      if (!selectedGroup || !selectedUni) {
        btn.disabled = true;
        return;
      }

      // Gate 2: alle Ausbilder-Textareas müssen ausgefüllt sein
      var ausbilderTextareas = document.querySelectorAll('.ausbilder-textarea');
      var allFilled = ausbilderTextareas.length > 0;
      ausbilderTextareas.forEach(function(ta) {
        if (!ta.value.trim()) allFilled = false;
      });

      btn.disabled = !allFilled;
    }

    // --- AUSBILDER RENDERING ---
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

      var html = '';
      ausbilder.forEach(function(name) {
        html +=
          '<div class="form-section">' +
          '<label class="field-label">' + name + ' <span class="req">*</span></label>' +
          '<p class="question-subtitle">Wie bewertest du die fachliche Betreuung durch ' + name + '?</p>' +
          '<textarea rows="3" ' +
            'class="ausbilder-textarea" ' +
            'data-ausbilder-name="' + name + '" ' +
            'placeholder="Dein Feedback zu ' + name + ' (Pflichtfeld)\u2026" ' +
            'required></textarea>' +
          '</div>';
      });
      container.innerHTML = html;

      // Attach input listeners for submit gate
      container.querySelectorAll('.ausbilder-textarea').forEach(function(ta) {
        ta.addEventListener('input', updateSubmitState);
      });

      updateSubmitState();
    }

    // --- RATING TILES — number init ---
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('.rating-tile').forEach(function(tile, i) {
        var val = i % 5 + 1; // tiles appear in groups of 5
        tile.dataset.val = val;
        tile.innerHTML = '<span style="font-size:1.25rem;font-weight:700;line-height:1;">' + val + '</span>';
      });
    });

    // --- RATING TILES ---
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('.rating-grid').forEach(function(grid) {
        grid.addEventListener('click', function(e) {
          var tile = e.target.closest('.rating-tile');
          if (!tile) return;
          var section = grid.closest('.form-section');
          var questionId = section ? section.dataset.question : null;
          var value = parseInt(tile.dataset.val, 10);
          // Deselect all tiles in this grid
          grid.querySelectorAll('.rating-tile').forEach(function(t) {
            t.classList.remove('selected-1','selected-2','selected-3','selected-4','selected-5');
          });
          // Select clicked tile
          tile.classList.add('selected-' + value);
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

    // --- SUBMIT HANDLER ---
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

      // Ausbilder-Feedback (individuell, Pflicht)
      var ausbilder = {};
      document.querySelectorAll('.ausbilder-textarea').forEach(function(ta) {
        var name = ta.dataset.ausbilderName;
        var val = ta.value.trim();
        if (name && val) ausbilder[name] = val;
      });

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
      if (Object.keys(ausbilder).length) payload.ausbilder = ausbilder;

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

    // --- INIT ---
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

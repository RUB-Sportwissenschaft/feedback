    // --- ADMIN — data layer, compute, render ---
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

    // --- STOPWORDS (DE) — for tag cloud ---
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

    // Compute per-question averages (ausbilder-relevant) for a trainer's groups
    function computeTrainerQuestionAverages(trainerName, submissions) {
      var trainerGroups = [];
      Object.keys(TEAM_MAP).forEach(function(key) {
        if (TEAM_MAP[key].indexOf(trainerName) !== -1)
          trainerGroups.push(/^\d+$/.test(key) ? 'Gruppe ' + key : key);
      });
      var qSums = {}, qCounts = {};
      AUSBILDER_QUESTIONS.forEach(function(qId) { qSums[qId] = 0; qCounts[qId] = 0; });
      submissions.forEach(function(s) {
        if (!s.group || trainerGroups.indexOf(s.group) === -1) return;
        if (!s.ratings) return;
        AUSBILDER_QUESTIONS.forEach(function(qId) {
          var v = s.ratings[qId];
          if (typeof v === 'number') { qSums[qId] += v; qCounts[qId]++; }
        });
      });
      return AUSBILDER_QUESTIONS.map(function(qId) {
        return qCounts[qId] ? +(qSums[qId] / qCounts[qId]).toFixed(2) : null;
      });
    }

    // Render trainer bar list (9 ausbilder-relevant questions, vs. global avg)
    function renderTrainerBarList(avgs, adminData, container) {
      var h = '<p class="admin-panel-label" style="margin-top:1rem;">Einzelfragen</p>';
      AUSBILDER_QUESTIONS.forEach(function(qId, i) {
        var val = avgs[i];
        var globalVal = adminData.qAverages[qId];
        if (val === null) return;
        var barW   = (val / 5 * 100).toFixed(1);
        var globalW = globalVal !== null ? (globalVal / 5 * 100).toFixed(1) : null;
        var diff   = globalVal !== null ? +(val - globalVal).toFixed(1) : null;
        var barColor  = diff === null ? 'var(--blau)' : (diff > 0.1 ? '#2e7d32' : diff < -0.1 ? '#c62828' : 'var(--blau)');
        var diffColor = diff === null ? '' : (diff > 0.1 ? '#2e7d32' : diff < -0.1 ? '#c62828' : 'var(--text-muted)');
        var diffStr   = diff === null ? '' : (diff > 0 ? '+' : '') + diff.toFixed(1);
        h += '<div class="admin-q-row">';
        h += '<span class="admin-q-label">' + QUESTION_LABELS[qId] + '</span>';
        h += '<div class="admin-q-bar-track" style="width:80px;position:relative;">';
        h += '<div class="admin-q-bar-fill" style="width:' + barW + '%;background:' + barColor + ';"></div>';
        if (globalW !== null) h += '<div style="position:absolute;top:0;left:' + globalW + '%;width:2px;height:100%;background:rgba(0,53,96,0.45);"></div>';
        h += '</div>';
        h += '<span class="admin-q-avg">' + val.toFixed(1) + '</span>';
        if (diff !== null) h += '<span style="font-size:0.74rem;color:' + diffColor + ';min-width:2.4rem;text-align:right;">' + diffStr + '</span>';
        h += '</div>';
      });
      container.innerHTML = h;
    }

    // Render group detail view
    function renderGroupDetail(group, adminData, container) {
      var groupKey = group.replace('Gruppe ', '');
      var ausbilder = TEAM_MAP[groupKey] || [];
      var n = adminData.groupCounts[group] || 0;
      var h = '';

      // Info strip
      h += '<div class="admin-kpi-strip" style="margin-top:1rem;">';
      h += '<div class="admin-kpi-card"><div class="admin-kpi-value">' + n + '</div><div class="admin-kpi-label">Antworten</div></div>';
      ausbilder.forEach(function(name) {
        h += '<div class="admin-kpi-card"><div class="admin-kpi-value" style="font-size:1rem;">' + name + '</div><div class="admin-kpi-label">Ausbilder*in</div></div>';
      });
      h += '</div>';

      // All questions by section, group avg vs global avg
      SECTIONS.forEach(function(sec) {
        h += '<p class="admin-panel-label">' + sec.label + '</p>';
        sec.keys.forEach(function(qId) {
          var gAvg = adminData.groupAverages[group] ? adminData.groupAverages[group][qId] : null;
          var glAvg = adminData.qAverages[qId];
          var barW   = gAvg !== null ? (gAvg / 5 * 100).toFixed(1) : 0;
          var globalW = glAvg !== null ? (glAvg / 5 * 100).toFixed(1) : null;
          var diff   = (gAvg !== null && glAvg !== null) ? +(gAvg - glAvg).toFixed(1) : null;
          var barColor  = diff === null ? 'var(--orange)' : (diff > 0.1 ? '#2e7d32' : diff < -0.1 ? '#c62828' : 'var(--orange)');
          var diffColor = diff === null ? '' : (diff > 0.1 ? '#2e7d32' : diff < -0.1 ? '#c62828' : 'var(--text-muted)');
          var diffStr   = diff === null ? '' : (diff > 0 ? '+' : '') + diff.toFixed(1);
          h += '<div class="admin-q-row">';
          h += '<span class="admin-q-label">' + QUESTION_LABELS[qId] + '</span>';
          h += '<div class="admin-q-bar-track" style="width:80px;position:relative;">';
          h += '<div class="admin-q-bar-fill" style="width:' + barW + '%;background:' + barColor + ';"></div>';
          if (globalW !== null) h += '<div style="position:absolute;top:0;left:' + globalW + '%;width:2px;height:100%;background:rgba(0,53,96,0.45);"></div>';
          h += '</div>';
          h += '<span class="admin-q-avg">' + (gAvg !== null ? gAvg.toFixed(1) : '\u2014') + '</span>';
          if (diff !== null) h += '<span style="font-size:0.74rem;color:' + diffColor + ';min-width:2.4rem;text-align:right;">' + diffStr + '</span>';
          h += '</div>';
        });
      });

      // Freitexte der Gruppe
      var hasFreitext = false;
      Object.keys(adminData.freitexteBySection).forEach(function(key) {
        var entries = (adminData.freitexteBySection[key] || []).filter(function(e) { return e.group === group; });
        if (!entries.length) return;
        if (!hasFreitext) { h += '<p class="admin-panel-label">Freitexte</p>'; hasFreitext = true; }
        h += '<p style="font-size:0.78rem;color:var(--text-muted);margin:0.5rem 0 0.25rem;">' + (SECTION_LABELS[key] || key) + '</p>';
        entries.forEach(function(e) {
          h += '<div class="admin-freitext-card"><p class="admin-freitext-text">' + e.text + '</p></div>';
        });
      });
      // Ausbilder-Feedback dieser Gruppe
      ausbilder.forEach(function(name) {
        var entries = (adminData.ausbilderFeedback[name] || []).filter(function(e) { return e.group === group; });
        if (!entries.length) return;
        if (!hasFreitext) { h += '<p class="admin-panel-label">Freitexte</p>'; hasFreitext = true; }
        h += '<p style="font-size:0.78rem;color:var(--text-muted);margin:0.5rem 0 0.25rem;">Feedback an ' + name + '</p>';
        entries.forEach(function(e) {
          h += '<div class="admin-freitext-card"><p class="admin-freitext-text">' + e.text + '</p></div>';
        });
      });

      container.innerHTML = h;
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

      // Uni counts
      var uniCounts = {};
      submissions.forEach(function(s) {
        var u = s.uni || 'Unbekannt';
        uniCounts[u] = (uniCounts[u] || 0) + 1;
      });

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

      return { total: total, uniCounts: uniCounts, groupCounts: groupCounts, qAverages: qAverages,
               groupAverages: groupAverages, freitexteBySection: freitexteBySection,
               ausbilderFeedback: ausbilderFeedback, submissions: submissions };
    }

    function renderAdminDashboard(adminData, adminEl) {
      var allAusbilder = ALL_AUSBILDER;

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
      html += '<button class="admin-tab" data-tab="gruppen">Gruppen</button>';
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
      html += '<canvas id="trainerRadarChart" height="260"></canvas>';
      html += '</div>';
      html += '<div id="trainerBarList"></div>';
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
      var uniSub = Object.keys(adminData.uniCounts).sort().map(function(u) {
        return adminData.uniCounts[u] + '\u00a0' + u;
      }).join(' \u00b7 ');
      html += '<div class="admin-kpi-card"><div class="admin-kpi-value">' + adminData.total + '</div><div class="admin-kpi-label">Teilnehmer*innen</div>' + (uniSub ? '<div class="admin-kpi-sub">' + uniSub + '</div>' : '') + '</div>';
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

      // ---- Panel 3: Gruppen ----
      html += '<div class="admin-panel" id="panel-gruppen">';
      html += '<p class="admin-panel-label">Gruppe ausw\u00e4hlen</p>';
      html += '<div class="admin-name-grid" style="grid-template-columns:repeat(3,1fr);">';
      sortGroups(Object.keys(adminData.groupAverages)).forEach(function(g) {
        var n = adminData.groupCounts[g] || 0;
        html += '<button class="admin-name-pill" data-group="' + g + '">';
        html += '<span>' + g + '</span>';
        html += '<span class="admin-name-badge">' + n + '</span>';
        html += '</button>';
      });
      html += '</div>';
      html += '<div id="groupDetailArea"><p style="color:var(--text-muted);font-size:0.9rem;padding:0.75rem 0;">Gruppe ausw\u00e4hlen.</p></div>';
      html += '</div>';

      // ---- Panel 4: Fragen ----
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
        // Freitexte dieser Sektion (nur vorhanden wenn Rating ≤ 2)
        var secTexts = adminData.freitexteBySection[sec.key] || [];
        if (secTexts.length) {
          html += '<div class="admin-freitext-section-header" data-section="' + sec.key + '">';
          html += 'Kritische R\u00fcckmeldungen (' + secTexts.length + ')';
          html += '</div>';
          secTexts.forEach(function(entry) {
            html += '<div class="admin-freitext-card" data-section="' + sec.key + '">';
            html += '<p class="admin-freitext-text">' + entry.text + '</p>';
            html += '<p class="admin-freitext-meta">' + entry.group + '</p>';
            html += '</div>';
          });
        }
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

          // Radar chart — 9 ausbilder-relevante Einzelfragen
          var radarCanvas = document.getElementById('trainerRadarChart');
          var chartWrap = document.getElementById('trainerChartWrap');
          if (activeTrainerChart) { activeTrainerChart.destroy(); activeTrainerChart = null; }
          var avgs = computeTrainerQuestionAverages(name, adminData.submissions);
          var globalAvgs = AUSBILDER_QUESTIONS.map(function(qId) {
            var v = adminData.qAverages[qId];
            return v !== null ? +v.toFixed(2) : 0;
          });
          var hasData = avgs.some(function(v) { return v !== null; });
          if (radarCanvas && chartWrap && window.Chart && hasData) {
            chartWrap.style.display = 'block';
            activeTrainerChart = new window.Chart(radarCanvas, {
              type: 'radar',
              data: {
                labels: AUSBILDER_QUESTIONS.map(function(qId) { return AUSBILDER_Q_SHORT[qId]; }),
                datasets: [
                  { label: name, data: avgs.map(function(v){ return v !== null ? v : 0; }),
                    backgroundColor: 'rgba(236,99,58,0.15)', borderColor: '#EC633A',
                    borderWidth: 2, pointBackgroundColor: '#EC633A', pointRadius: 4 },
                  { label: '\u00d8 Gesamt', data: globalAvgs,
                    backgroundColor: 'rgba(0,83,149,0.08)', borderColor: 'rgba(0,83,149,0.5)',
                    borderWidth: 1.5, borderDash: [5,3], pointBackgroundColor: 'rgba(0,83,149,0.5)', pointRadius: 3 }
                ]
              },
              options: {
                scales: { r: { min: 1, max: 5, ticks: { stepSize: 1 },
                  pointLabels: { font: { size: 11 } } } },
                plugins: { legend: { display: true, labels: { font: { size: 11 }, boxWidth: 20 } } },
                responsive: true, maintainAspectRatio: false
              }
            });
          } else if (chartWrap) { chartWrap.style.display = 'none'; }

          // Bar list
          var barListEl = document.getElementById('trainerBarList');
          if (barListEl) renderTrainerBarList(avgs, adminData, barListEl);

          // Feedback cards — individuell per Ausbilder (neues Format)
          var panel = document.getElementById('ausbilderFeedbackPanel');
          var entries = adminData.ausbilderFeedback[name] || [];
          // Fallback: altes kombiniertes Format (feedback_instructor), gefiltert nach Gruppe
          if (!entries.length) {
            var trainerGroups = [];
            Object.keys(TEAM_MAP).forEach(function(key) {
              if (TEAM_MAP[key].indexOf(name) !== -1)
                trainerGroups.push(/^\d+$/.test(key) ? 'Gruppe ' + key : key);
            });
            entries = (adminData.freitexteBySection['feedback_instructor'] || [])
              .filter(function(e) { return trainerGroups.indexOf(e.group) !== -1; });
          }
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

      // Group pills (Gruppen tab)
      adminEl.querySelectorAll('.admin-name-pill[data-group]').forEach(function(pill) {
        pill.addEventListener('click', function() {
          adminEl.querySelectorAll('.admin-name-pill[data-group]').forEach(function(p) { p.classList.remove('active'); });
          pill.classList.add('active');
          var container = document.getElementById('groupDetailArea');
          if (container) renderGroupDetail(pill.dataset.group, adminData, container);
        });
      });

      // Section filter pills (Fragen tab)
      adminEl.querySelectorAll('.admin-pill[data-section]').forEach(function(pill) {
        pill.addEventListener('click', function() {
          adminEl.querySelectorAll('.admin-pill[data-section]').forEach(function(p) { p.classList.remove('active'); });
          pill.classList.add('active');
          var sec = pill.dataset.section;
          adminEl.querySelectorAll('#questionList [data-section]').forEach(function(row) {
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
      var freitextKeys = ['S1','S2','S3','S4','S5','S6','feedback_general'];
      var freitextLabels = {
        'S1': 'S1 Freitext', 'S2': 'S2 Freitext', 'S3': 'S3 Freitext',
        'S4': 'S4 Freitext', 'S5': 'S5 Freitext', 'S6': 'S6 Freitext',
        'feedback_general': 'Allgemeines Feedback'
      };

      // Alle Ausbilder-Namen für separate Spalten
      var allAusbilderNames = ALL_AUSBILDER;

      // ---- Sheet 1: Einzelantworten ----
      var headerRow = ['Timestamp', 'Gruppe', 'Hochschule', 'Name']
        .concat(qKeys.map(function(k) { return QUESTION_LABELS[k]; }))
        .concat(freitextKeys.map(function(k) { return freitextLabels[k]; }))
        .concat(allAusbilderNames.map(function(n) { return 'Feedback: ' + n; }));

      var dataRows = adminData.submissions.map(function(s) {
        var ratings = qKeys.map(function(q) { return s.ratings ? (s.ratings[q] || '') : ''; });
        var freitexte = freitextKeys.map(function(k) { return s.freitexte ? (s.freitexte[k] || '') : ''; });
        var ausbilderCols = allAusbilderNames.map(function(n) {
          if (s.ausbilder && s.ausbilder[n]) return s.ausbilder[n];
          return '';
        });
        return [s.timestamp, s.group || '', s.uni || '', s.name || ''].concat(ratings).concat(freitexte).concat(ausbilderCols);
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

      // ---- Sheet 3: Ausbilder-Feedback (individuell) ----
      var sheet3Rows = [['Ausbilder*in', 'Gruppe', 'Feedback']];
      allAusbilderNames.forEach(function(name) {
        (adminData.ausbilderFeedback[name] || []).forEach(function(entry) {
          sheet3Rows.push([name, entry.group, entry.text]);
        });
      });
      // Fallback: altes kombiniertes Format
      (adminData.freitexteBySection['feedback_instructor'] || []).forEach(function(entry) {
        sheet3Rows.push(['(kombiniert)', entry.group, entry.text]);
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

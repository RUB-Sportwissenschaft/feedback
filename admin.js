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
        var results = await Promise.all([
          supabaseClient.from('feedbacks').select('data, created_at').order('created_at', { ascending: true }),
          fetch('summary.html').then(function(r) { return r.ok ? r.text() : ''; }).catch(function() { return ''; })
        ]);
        if (results[0].error) throw new Error(results[0].error.message);
        var submissions = (results[0].data || []).map(function(r) { return r.data; });
        var adminData = computeAdminData(submissions);
        renderAdminDashboard(adminData, adminEl, results[1]);
      } catch (err) {
        adminEl.innerHTML = '<p style="padding:1rem;color:red">Fehler beim Laden: ' + err.message + '</p>';
      }
    }

    // --- BIPOLAR helpers ---
    // rating_workload: 1=zu hoch, 3=angemessen, 5=zu gering
    // rating_exam_difficulty: 1=zu leicht, 3=genau richtig, 5=zu schwierig
    var BIPOLAR_KEYS = { 'rating_workload': true, 'rating_exam_difficulty': true };

    // Bar width: 100% at ideal (3), 0% at extremes (1 or 5)
    function bipBarW(val) { return ((1 - Math.abs(val - 3) / 2) * 100).toFixed(1); }

    // Bar color based on proximity to 3
    function bipBarColor(val, fallback) {
      var d = Math.abs(val - 3);
      return d <= 0.3 ? '#2e7d32' : d >= 0.8 ? '#c62828' : (fallback || 'var(--blau)');
    }

    // Diff color for bipolar: positive diff = trainer's group closer to 3 = better
    function bipDiff(val, globalVal) {
      return globalVal !== null ? +(Math.abs(globalVal - 3) - Math.abs(val - 3)).toFixed(1) : null;
    }

    // Radar transform: 5 at ideal (3), 1 at extremes
    function bipRadarVal(val) { return Math.max(1, 5 - Math.abs(val - 3) * 2); }

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

    // Shared bar row renderer — used by trainer bar list + group detail
    function renderBarRow(qId, val, globalVal, fallback) {
      if (val === null) return '';
      var bp = BIPOLAR_KEYS[qId];
      var barW  = bp ? bipBarW(val) : (val / 5 * 100).toFixed(1);
      var globW = globalVal !== null ? (bp ? bipBarW(globalVal) : (globalVal / 5 * 100).toFixed(1)) : null;
      var diff  = bp ? bipDiff(val, globalVal) : (globalVal !== null ? +(val - globalVal).toFixed(1) : null);
      var bc    = bp ? bipBarColor(val, fallback) : (diff === null ? fallback : (diff > 0.1 ? '#2e7d32' : diff < -0.1 ? '#c62828' : fallback));
      var dc    = diff === null ? '' : (diff > 0.1 ? '#2e7d32' : diff < -0.1 ? '#c62828' : 'var(--text-muted)');
      var ds    = diff === null ? '' : (diff > 0 ? '+' : '') + diff.toFixed(1);
      var tip   = QUESTION_TOOLTIPS[qId] ? '<button class="admin-q-info" data-tip="' + QUESTION_TOOLTIPS[qId] + '">?</button>' : '';
      var h = '<div class="admin-q-row">';
      h += '<span class="admin-q-label">' + QUESTION_LABELS[qId] + tip + '</span>';
      h += '<div class="admin-q-bar-track" style="width:80px;position:relative;">';
      h += '<div class="admin-q-bar-fill" style="width:' + barW + '%;background:' + bc + ';"></div>';
      if (globW !== null) h += '<div style="position:absolute;top:0;left:' + globW + '%;width:2px;height:100%;background:rgba(0,53,96,0.45);"></div>';
      h += '</div>';
      h += '<span class="admin-q-avg">' + val.toFixed(1) + '</span>';
      if (diff !== null) h += '<span style="font-size:0.74rem;color:' + dc + ';min-width:2.4rem;text-align:right;">' + ds + '</span>';
      h += '</div>';
      return h;
    }

    // Render trainer bar list (9 ausbilder-relevant questions, vs. global avg)
    function renderTrainerBarList(avgs, adminData, container) {
      var h = '<p class="admin-panel-label" style="margin-top:1rem;">Einzelfragen</p>';
      AUSBILDER_QUESTIONS.forEach(function(qId, i) {
        h += renderBarRow(qId, avgs[i], adminData.qAverages[qId], 'var(--blau)');
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
          h += renderBarRow(qId, gAvg, adminData.qAverages[qId], 'var(--orange)');
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

    function renderAdminDashboard(adminData, adminEl, summaryHTML) {
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

      // Zusammenfassung & Interpretation
      html += '<p class="admin-panel-label">Zusammenfassung &amp; Interpretation</p>';
      html += '<div class="admin-summary">' + (summaryHTML || '') + '</div>';

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
      var allgCount = (adminData.freitexteBySection['feedback_general'] || []).length;
      if (allgCount) html += '<button class="admin-pill" data-section="allg">Allg. Feedback <span class="admin-name-badge" style="margin-left:4px;">' + allgCount + '</span></button>';
      html += '</div>';
      // Question rows — grouped by section, each tagged with data-section
      html += '<div class="admin-q-list" id="questionList">';
      SECTIONS.forEach(function(sec) {
        sec.keys.forEach(function(qId) {
          var avg = adminData.qAverages[qId];
          var bipolar = BIPOLAR_KEYS[qId];
          var barW = avg ? (bipolar ? bipBarW(avg) : (avg / 5 * 100).toFixed(1)) : 0;
          var barColor = bipolar ? bipBarColor(avg, 'var(--blau)') : 'var(--blau)';
          html += '<div class="admin-q-row" data-section="' + sec.key + '">';
          html += '<span class="admin-q-label">' + QUESTION_LABELS[qId] + (QUESTION_TOOLTIPS[qId] ? '<button class="admin-q-info" data-tip="' + QUESTION_TOOLTIPS[qId] + '">?</button>' : '') + '</span>';
          html += '<div class="admin-q-bar-track"><div class="admin-q-bar-fill" style="width:' + barW + '%;background:' + barColor + '"></div></div>';
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

      // Allgemeines Feedback am Ende des Details-Tabs
      var allgFT = adminData.freitexteBySection['feedback_general'] || [];
      if (allgFT.length) {
        html += '<div id="allgFeedbackBlock" style="display:none;">';
        html += '<p class="admin-panel-label" style="margin-top:1.25rem;">Allgemeines Feedback</p>';
        allgFT.forEach(function(entry) {
          html += '<div class="admin-freitext-card" data-section="allg"><p class="admin-freitext-text">' + entry.text + '</p><p class="admin-freitext-meta">' + entry.group + '</p></div>';
        });
        html += '</div>';
      }
      html += '</div>';

      adminEl.innerHTML = html;
      window.lastAdminData = adminData;

      // ---- ⓘ Tooltip-Bubble ----
      var oldBubble = document.querySelector('.admin-tip-bubble');
      if (oldBubble) oldBubble.remove();
      var tipBubble = document.createElement('div');
      tipBubble.className = 'admin-tip-bubble';
      document.body.appendChild(tipBubble);
      var pinnedBtn = null;

      adminEl.addEventListener('click', function(e) {
        var btn = e.target.closest('.admin-q-info');
        if (btn) {
          e.stopPropagation();
          if (pinnedBtn === btn) {
            tipBubble.classList.remove('active');
            pinnedBtn = null;
          } else {
            showTip(btn);
            pinnedBtn = btn;
          }
        } else {
          tipBubble.classList.remove('active');
          pinnedBtn = null;
        }
      });

      adminEl.addEventListener('mouseover', function(e) {
        var btn = e.target.closest('.admin-q-info');
        if (btn && !pinnedBtn) showTip(btn);
      });
      adminEl.addEventListener('mouseout', function(e) {
        if (!pinnedBtn && e.target.closest && e.target.closest('.admin-q-info')) {
          tipBubble.classList.remove('active');
        }
      });
      document.addEventListener('click', function() {
        tipBubble.classList.remove('active');
        pinnedBtn = null;
      }, { capture: false });

      function showTip(btn) {
        tipBubble.textContent = btn.dataset.tip;
        var r = btn.getBoundingClientRect();
        var sy = window.scrollY || document.documentElement.scrollTop;
        var left = Math.max(8, Math.min(r.left + window.scrollX, window.innerWidth - 280 - 8));
        tipBubble.style.top = (r.bottom + sy + 6) + 'px';
        tipBubble.style.left = left + 'px';
        tipBubble.classList.add('active');
      }

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
            if (v === null) return 0;
            return BIPOLAR_KEYS[qId] ? +bipRadarVal(v).toFixed(2) : +v.toFixed(2);
          });
          var hasData = avgs.some(function(v) { return v !== null; });
          if (radarCanvas && chartWrap && window.Chart && hasData) {
            chartWrap.style.display = 'block';
            activeTrainerChart = new window.Chart(radarCanvas, {
              type: 'radar',
              data: {
                labels: AUSBILDER_QUESTIONS.map(function(qId) { return AUSBILDER_Q_SHORT[qId]; }),
                datasets: [
                  { label: name, data: avgs.map(function(v, i){
                      if (v === null) return 0;
                      var qId = AUSBILDER_QUESTIONS[i];
                      return BIPOLAR_KEYS[qId] ? +bipRadarVal(v).toFixed(2) : v;
                    }),
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
                plugins: {
                  legend: { display: true, labels: { font: { size: 11 }, boxWidth: 20 } },
                  tooltip: { callbacks: { title: function(items) {
                    var qId = AUSBILDER_QUESTIONS[items[0].dataIndex];
                    return QUESTION_TOOLTIPS[qId] || QUESTION_LABELS[qId];
                  }}}
                },
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
          var qList = document.getElementById('questionList');
          var allgBlock = document.getElementById('allgFeedbackBlock');
          if (sec === 'allg') {
            if (qList) qList.style.display = 'none';
            if (allgBlock) allgBlock.style.display = '';
          } else {
            if (qList) qList.style.display = '';
            if (allgBlock) allgBlock.style.display = sec === 'alle' ? '' : 'none';
            adminEl.querySelectorAll('#questionList [data-section]').forEach(function(row) {
              row.style.display = (sec === 'alle' || row.dataset.section === sec) ? '' : 'none';
            });
          }
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

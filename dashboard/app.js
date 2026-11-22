// Token Launch Radar dashboard: renders window.RADAR with no network.
// Sortable board, filters, and a detail view per protocol. Hash state so a
// view can be linked: #detail=<slug>, #cat=<category>, #chain=<chain>,
// #q=<text>, #watch=1.
(function () {
  var R = window.RADAR;
  if (!R) { document.body.innerHTML = '<p>No radar data.</p>'; return; }
  function $(id) { return document.getElementById(id); }
  function money(n) {
    if (n === null || n === undefined) return '—';
    if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
  }
  function pct(v) {
    if (v === null || v === undefined) return '—';
    var s = (v > 0 ? '+' : '') + v.toFixed(2) + '%';
    return '<span class="' + (v > 0 ? 'pos' : v < 0 ? 'neg' : '') + '">' + s + '</span>';
  }
  function age(v) {
    if (v === null || v === undefined) return '—';
    if (v >= 365) return (v / 365).toFixed(1) + 'y';
    return v + 'd';
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Header stats.
  var total = R.rows.reduce(function (a, r) { return a + r.implied_value_usd; }, 0);
  var top = R.rows[0];
  $('stats').innerHTML =
    '<div><dt>Board rows</dt><dd>' + R.board_size + '</dd></div>' +
    '<div><dt>Watchlist</dt><dd>' + R.watchlist_size + '</dd></div>' +
    '<div><dt>Early finds</dt><dd>' + R.early_size + '</dd></div>' +
    '<div><dt>Total implied</dt><dd>' + money(total) + '</dd></div>' +
    '<div><dt>Top pick</dt><dd>' + esc(top ? top.name : '—') + '</dd></div>';
  $('asof').textContent = R.as_of;
  $('src').textContent = R.source;
  $('mver').textContent = R.model_version;

  // Comparables table.
  $('comps').querySelector('tbody').innerHTML = R.comps.map(function (c) {
    return '<tr><td>' + esc(c.category) + '</td><td class="num">' + c.sample + '</td>' +
      '<td class="num">' + c.median_multiple.toFixed(3) + '×</td>' +
      '<td class="num">' + c.used_multiple.toFixed(3) + '×</td></tr>';
  }).join('') + '<tr><td>Global (all live tokens)</td><td class="num">—</td><td class="num">' +
    R.global_multiple.toFixed(3) + '×</td><td class="num">' + R.global_multiple.toFixed(3) + '×</td></tr>';

  // Filter options.
  var cats = [], chains = [];
  R.rows.forEach(function (r) {
    if (r.category && cats.indexOf(r.category) < 0) cats.push(r.category);
    r.chains.forEach(function (c) { if (chains.indexOf(c) < 0) chains.push(c); });
  });
  cats.sort(); chains.sort();
  cats.forEach(function (c) { $('cat').appendChild(new Option(c, c)); });
  chains.forEach(function (c) { $('chain').appendChild(new Option(c, c)); });

  var sortKey = 'rank', sortAsc = true;
  function visibleRows() {
    var q = $('q').value.trim().toLowerCase();
    var cat = $('cat').value, chain = $('chain').value, w = $('watch').checked;
    var rows = R.rows.filter(function (r) {
      if (w && !r.is_watchlist) return false;
      if (cat && r.category !== cat) return false;
      if (chain && r.chains.indexOf(chain) < 0) return false;
      if (q && (r.name.toLowerCase().indexOf(q) < 0 && r.slug.indexOf(q) < 0)) return false;
      return true;
    });
    var dir = sortAsc ? 1 : -1;
    rows.sort(function (a, b) {
      var av = a[sortKey], bv = b[sortKey];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === 'string') return dir * av.localeCompare(bv);
      return dir * (av - bv);
    });
    return rows;
  }
  function renderBoard() {
    var rows = visibleRows();
    $('board').querySelector('tbody').innerHTML = rows.map(function (r) {
      return '<tr data-slug="' + esc(r.slug) + '">' +
        '<td class="num">' + r.rank + '</td>' +
        '<td><strong>' + esc(r.name) + '</strong> <span class="slug">' + esc(r.slug) + '</span>' +
        (r.is_watchlist ? '<span class="tag">watchlist</span>' : '') + '</td>' +
        '<td>' + esc(r.category || '—') + '</td>' +
        '<td>' + esc(r.chains.slice(0, 2).join(', ')) + (r.chains.length > 2 ? ' +' + (r.chains.length - 2) : '') + '</td>' +
        '<td class="num">' + money(r.tvl_usd) + '</td>' +
        '<td class="num">' + pct(r.change_7d) + '</td>' +
        '<td class="num">' + age(r.age_days) + '</td>' +
        '<td class="num">' + r.category_multiple.toFixed(2) + '×</td>' +
        '<td class="num"><strong>' + money(r.implied_value_usd) + '</strong></td></tr>';
    }).join('');
    $('count').textContent = rows.length + ' of ' + R.rows.length + ' rows';
    document.querySelectorAll('#board tbody tr').forEach(function (tr) {
      tr.addEventListener('click', function () { showDetail(tr.getAttribute('data-slug')); });
    });
  }
  document.querySelectorAll('#board thead th').forEach(function (th) {
    th.addEventListener('click', function () {
      var k = th.getAttribute('data-sort');
      if (sortKey === k) { sortAsc = !sortAsc; } else { sortKey = k; sortAsc = k === 'rank'; }
      document.querySelectorAll('#board thead th').forEach(function (x) { x.classList.remove('sorted', 'asc'); });
      th.classList.add('sorted');
      if (sortAsc) th.classList.add('asc');
      renderBoard();
    });
  });
  ['q', 'cat', 'chain', 'watch'].forEach(function (id) {
    $(id).addEventListener('input', renderBoard);
    $(id).addEventListener('change', renderBoard);
  });

  // Detail view.
  function showDetail(slug) {
    var r = null;
    for (var i = 0; i < R.rows.length; i++) if (R.rows[i].slug === slug) { r = R.rows[i]; break; }
    if (!r) return;
    $('detail').hidden = false;
    $('d-name').textContent = '#' + r.rank + ' — ' + r.name;
    var base = r.category_multiple * Math.pow(r.tvl_usd, R.model.tvl_exponent) * Math.pow(R.model.tvl_scale, 1 - R.model.tvl_exponent);
    $('d-facts').innerHTML =
      '<div><dt>Implied value</dt><dd>' + money(r.implied_value_usd) + '</dd></div>' +
      '<div><dt>TVL</dt><dd>' + money(r.tvl_usd) + '</dd></div>' +
      '<div><dt>7-day change</dt><dd>' + (r.change_7d === null ? '—' : (r.change_7d > 0 ? '+' : '') + r.change_7d.toFixed(2) + '%') + '</dd></div>' +
      '<div><dt>Age</dt><dd>' + age(r.age_days) + '</dd></div>' +
      '<div><dt>Category</dt><dd>' + esc(r.category || '—') + '</dd></div>' +
      '<div><dt>Chains</dt><dd>' + esc(r.chains.join(', ')) + '</dd></div>';
    $('d-model').querySelector('tbody').innerHTML =
      '<tr><td>Category multiple (' + esc(r.category || 'uncategorised') + ' comps)</td><td class="num">' + r.category_multiple.toFixed(3) + '×</td><td class="num">median live mcap/TVL</td></tr>' +
      '<tr><td>Size base — TVL^0.85, sublinear</td><td class="num">' + money(Math.round(base)) + '</td><td class="num">multiple × TVL^0.85 × 1M^0.15</td></tr>' +
      '<tr><td>Growth multiplier (7d ' + (r.change_7d === null ? 'n/a' : r.change_7d.toFixed(1) + '%') + ')</td><td class="num">' + r.growth_multiplier.toFixed(3) + '×</td><td class="num">1 + 0.6 × clamped growth</td></tr>' +
      '<tr><td>Maturity multiplier (' + age(r.age_days) + ' with no token)</td><td class="num">' + r.maturity_multiplier.toFixed(3) + '×</td><td class="num">0.70 + 0.30 × (1 − e^(−age/365))</td></tr>' +
      '<tr><td><strong>Implied value</strong></td><td class="num"><strong>' + money(r.implied_value_usd) + '</strong></td><td class="num">base × growth × maturity</td></tr>';
    $('d-farm').innerHTML = r.farm_steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    document.querySelectorAll('#board tbody tr').forEach(function (tr) {
      tr.classList.toggle('active', tr.getAttribute('data-slug') === slug);
    });
    if ($('detail').scrollIntoView) $('detail').scrollIntoView({ block: 'nearest' });
  }
  $('d-close').addEventListener('click', function () { $('detail').hidden = true; });

  // Live tokens, kept apart.
  $('live').querySelector('tbody').innerHTML = R.live.map(function (p) {
    return '<tr><td><strong>' + esc(p.name) + '</strong> <span class="slug">' + esc(p.slug) + '</span></td>' +
      '<td>' + esc(p.category || '—') + '</td><td>' + esc(p.chains.slice(0, 2).join(', ')) + '</td>' +
      '<td class="num">' + money(p.tvl_usd) + '</td><td class="num">' + money(p.mcap_usd) + '</td>' +
      '<td class="num">' + pct(p.change_7d) + '</td></tr>';
  }).join('');

  // Hash state: #detail=<slug>, #cat=..., #chain=..., #q=..., #watch=1.
  var h = new URLSearchParams(location.hash.slice(1));
  if (h.get('cat')) $('cat').value = h.get('cat');
  if (h.get('chain')) $('chain').value = h.get('chain');
  if (h.get('q')) $('q').value = h.get('q');
  if (h.get('watch')) $('watch').checked = true;
  renderBoard();
  if (h.get('detail')) showDetail(h.get('detail'));
})();

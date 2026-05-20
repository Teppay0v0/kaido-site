/* ============================================================
   KAIDO Map (Leaflet + CartoDB Voyager + Sepia filter)
   ============================================================
   APIキー不要。OpenStreetMap / CARTO の無料タイルを使用し、
   CSSフィルタで Snazzy Maps "Vintage" 風の暖色セピアに着色。
   ▼ 緯度経度はここのみ:
   ============================================================ */
const KAIDO_LATLNG    = { lat: 43.07010, lng: 141.34640 }; // 北7条西7丁目2-16
const SAPPORO_STATION = { lat: 43.06860, lng: 141.35070 }; // JR 札幌駅（向き確認用）

function loadCss(href){
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = href;
  document.head.appendChild(l);
}
function loadScript(src){
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

(async function(){
  const el = document.getElementById('kaidoMap');
  if(!el) return;

  loadCss('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
  try {
    await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
  } catch(e){
    // CDN取得失敗時のみ自家製SVGへフォールバック
    el.innerHTML =
      '<img src="assets/images/access-map.svg" ' +
      'alt="開土 KAIDO アクセスマップ" ' +
      'style="display:block;width:100%;height:100%;object-fit:cover;"/>';
    return;
  }

  // ホテルと札幌駅の中間を中心、両方が画面に収まるようズーム控えめ
  const map = L.map(el, {
    center: [
      (KAIDO_LATLNG.lat + SAPPORO_STATION.lat) / 2,
      (KAIDO_LATLNG.lng + SAPPORO_STATION.lng) / 2
    ],
    zoom: 15,
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: false,    // ページスクロールを優先
    dragging: true,
    doubleClickZoom: true,
    boxZoom: false,
    keyboard: false
  });

  // CartoDB Voyager: 建物・道路・ラベルが揃った詳細ベース
  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
        '&copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      className: 'kaido-tiles'   // CSSでブランド色化（コントラスト維持）
    }
  ).addTo(map);

  // ホテルマーカー：maroonドット＋白縁（メイン）
  L.circleMarker([KAIDO_LATLNG.lat, KAIDO_LATLNG.lng], {
    radius: 10,
    color: '#ffffff',
    weight: 3,
    fillColor: '#904848',
    fillOpacity: 1
  })
  .bindTooltip('開土 KAIDO', {
    permanent: true, direction: 'top', offset: [0, -10],
    className: 'kaido-tip'
  })
  .addTo(map);

  // 札幌駅マーカー（位置関係の手がかり・控えめ）
  L.circleMarker([SAPPORO_STATION.lat, SAPPORO_STATION.lng], {
    radius: 6,
    color: '#904848',
    weight: 2,
    fillColor: '#fbf9f4',
    fillOpacity: 1
  })
  .bindTooltip('JR 札幌駅', {
    permanent: true, direction: 'bottom', offset: [0, 8],
    className: 'kaido-tip kaido-tip--sub'
  })
  .addTo(map);
})();

/* ============================================================
   KAIDO Map (Leaflet + CartoDB Voyager + Sepia filter)
   ============================================================
   APIキー不要。OpenStreetMap / CARTO の無料タイルを使用し、
   CSSフィルタで Snazzy Maps "Vintage" 風の暖色セピアに着色。
   ▼ 緯度経度はここのみ:
   ============================================================ */
const KAIDO_LATLNG = { lat: 43.07440, lng: 141.34410 }; // 北7条西7丁目2-16（仮）

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

  const map = L.map(el, {
    center: [KAIDO_LATLNG.lat, KAIDO_LATLNG.lng],
    zoom: 16,
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: false,    // ページスクロールを優先
    dragging: true,
    doubleClickZoom: true,
    boxZoom: false,
    keyboard: false
  });

  // CartoDB Voyager（無料・APIキー不要・軽量で控えめな配色）
  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
        '&copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      className: 'kaido-tiles'    // CSSで Vintage 風セピアに着色
    }
  ).addTo(map);

  // ホテルマーカー：maroonドット＋白縁
  L.circleMarker([KAIDO_LATLNG.lat, KAIDO_LATLNG.lng], {
    radius: 9,
    color: '#ffffff',
    weight: 3,
    fillColor: '#904848',
    fillOpacity: 1
  })
  .bindTooltip('開土 KAIDO', {
    permanent: true, direction: 'top', offset: [0, -8],
    className: 'kaido-tip'
  })
  .addTo(map);
})();

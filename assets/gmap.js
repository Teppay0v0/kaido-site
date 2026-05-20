/* ============================================================
   KAIDO Map (MapLibre GL JS + OpenFreeMap vector tiles)
   ============================================================
   APIキー不要・無料・ベクター描画なので
   「建物」「道路」「水」「ラベル」など要素ごとに個別配色できます。
   ============================================================ */
const KAIDO_LATLNG    = { lat: 43.07010, lng: 141.34640 }; // 北7条西7丁目2-16
const SAPPORO_STATION = { lat: 43.06860, lng: 141.35070 }; // JR 札幌駅

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

  loadCss('https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css');
  try {
    await loadScript('https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js');
  } catch(e){
    el.innerHTML =
      '<img src="assets/images/access-map.svg" alt="開土 KAIDO アクセスマップ" ' +
      'style="display:block;width:100%;height:100%;object-fit:cover;"/>';
    return;
  }

  const center = [
    (KAIDO_LATLNG.lng + SAPPORO_STATION.lng) / 2,
    (KAIDO_LATLNG.lat + SAPPORO_STATION.lat) / 2
  ];

  const map = new maplibregl.Map({
    container: el,
    style: 'https://tiles.openfreemap.org/styles/positron',  // デフォルト配色そのまま
    center,
    zoom: 16,                       // もう一段階ズームインしたデフォルトビュー
    attributionControl: true,
    cooperativeGestures: true
  });
  map.scrollZoom.disable();
  map.addControl(new maplibregl.NavigationControl({ showCompass:false }), 'top-left');

  map.on('load', () => {
    // ホテルマーカー (maroon ドット + 常時ラベル)
    const k = document.createElement('div');
    k.className = 'kaido-marker';
    new maplibregl.Marker({ element: k, anchor:'bottom' })
      .setLngLat([KAIDO_LATLNG.lng, KAIDO_LATLNG.lat])
      .setPopup(new maplibregl.Popup({
        closeButton:false, closeOnClick:false, offset:14, className:'kaido-pop-wrap'
      }).setHTML('<span class="kaido-pop">開土 KAIDO</span>'))
      .addTo(map)
      .togglePopup();

    // 札幌駅マーカー
    const s = document.createElement('div');
    s.className = 'kaido-marker kaido-marker--sub';
    new maplibregl.Marker({ element: s, anchor:'bottom' })
      .setLngLat([SAPPORO_STATION.lng, SAPPORO_STATION.lat])
      .setPopup(new maplibregl.Popup({
        closeButton:false, closeOnClick:false, offset:10, className:'kaido-pop-wrap'
      }).setHTML('<span class="kaido-pop kaido-pop--sub">JR 札幌駅</span>'))
      .addTo(map)
      .togglePopup();
  });
})();

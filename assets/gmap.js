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
    style: 'https://tiles.openfreemap.org/styles/positron',
    center,
    zoom: 14.6,
    attributionControl: true,
    cooperativeGestures: true   // 2本指でズーム＝ページスクロールを阻害しない
  });
  map.scrollZoom.disable();
  map.addControl(new maplibregl.NavigationControl({ showCompass:false }), 'top-left');

  /* ブランドカラー */
  const COL = {
    bg:        '#fbf9f4',
    land:      '#f4ecde',
    park:      '#e2d9c2',
    water:     '#cfdadb',
    building:  '#e6d2bb',
    bld_line:  '#b89c80',
    road_hi:   '#c8a070',
    road:      '#ffffff',
    road_case: '#cdb39a',
    label:     '#7a5a5a',
    label_str: '#fbf9f4'
  };

  map.on('load', () => {
    // 各レイヤーを種類別に再着色（layer id は openfreemap positron 仕様に合わせて寛容に判定）
    map.getStyle().layers.forEach(l => {
      const id = l.id;
      const src = l['source-layer'] || '';
      try {
        if (l.type === 'background') {
          map.setPaintProperty(id, 'background-color', COL.bg);
        }
        else if (l.type === 'fill') {
          if (/water|ocean|sea/.test(src) || /water/.test(id)) {
            map.setPaintProperty(id, 'fill-color', COL.water);
          } else if (/building/.test(src) || /building/.test(id)) {
            map.setPaintProperty(id, 'fill-color', COL.building);
            try { map.setPaintProperty(id, 'fill-outline-color', COL.bld_line); } catch(e){}
          } else if (/park|wood|grass|forest|landcover/.test(src + id)) {
            map.setPaintProperty(id, 'fill-color', COL.park);
          } else if (/landuse|landcover|residential/.test(src + id)) {
            map.setPaintProperty(id, 'fill-color', COL.land);
          }
        }
        else if (l.type === 'line') {
          if (/transportation|road|highway|street/.test(src + id)) {
            if (/highway|motorway|trunk|primary/.test(id)) {
              map.setPaintProperty(id, 'line-color', COL.road_hi);
            } else if (/_case|_outline|casing/.test(id)) {
              map.setPaintProperty(id, 'line-color', COL.road_case);
            } else {
              map.setPaintProperty(id, 'line-color', COL.road);
            }
          } else if (/water/.test(src + id)) {
            map.setPaintProperty(id, 'line-color', COL.water);
          } else if (/admin|boundary/.test(src + id)) {
            map.setPaintProperty(id, 'line-color', '#c8b3a0');
          }
        }
        else if (l.type === 'symbol') {
          try { map.setPaintProperty(id, 'text-color', COL.label); } catch(e){}
          try { map.setPaintProperty(id, 'text-halo-color', COL.label_str); } catch(e){}
          try { map.setPaintProperty(id, 'text-halo-width', 1.4); } catch(e){}
          // POIアイコン非表示
          if (/poi/.test(id) || /poi/.test(src)) {
            try { map.setLayoutProperty(id, 'visibility', 'none'); } catch(e){}
          }
        }
      } catch(e) { /* レイヤーに該当プロパティが無い場合は無視 */ }
    });

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

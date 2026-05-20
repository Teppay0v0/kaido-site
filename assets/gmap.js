/* ============================================================
   KAIDO Google Maps (custom-styled)
   ============================================================
   ▼ 設定箇所はこの2行のみ:
     1) KAIDO_GMAP_KEY  …… Google Maps JavaScript API キーを貼る
     2) KAIDO_LATLNG    …… 必要なら正確な緯度経度に差し替え
   キーが空のあいだは、用意済みのカスタムSVGマップを自動でフォールバック
   表示します。キーを入れた瞬間にGoogleマップ(カスタムスタイル)へ切替。
   ============================================================ */
const KAIDO_GMAP_KEY = ''; // ← ここに API キーを貼る
const KAIDO_LATLNG   = { lat: 43.07440, lng: 141.34410 }; // 北7条西7丁目2-16（仮）

/* エディトリアル・スタイル：クリーム地に maroon #904848 アクセント。
   POIラベルや交通標識を絞り、地形/道路/水域を柔らかく統一。 */
const KAIDO_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#f8f4ec" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7a5a5a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#fbf9f4" }, { weight: 2 }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },

  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#d4c4ba" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },

  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#f3ece0" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#ece2d2" }] },

  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#ebe1d1" }] },
  { featureType: "poi", elementType: "labels.text", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#dfd4c0" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },

  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e9dccb" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#fdf8ec" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f3e8d0" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#d4c4b0" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },

  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#c8b6a8" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#b39888" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#904848" }] },

  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dccdc0" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#a08878" }] }
];

/* Googleからのコールバック。<script> の callback=initKaidoMap で呼ばれる。 */
function initKaidoMap(){
  const el = document.getElementById('kaidoMap');
  if(!el || typeof google === 'undefined' || !google.maps) return;
  const map = new google.maps.Map(el, {
    center: KAIDO_LATLNG,
    zoom: 16,
    styles: KAIDO_MAP_STYLES,
    disableDefaultUI: true,
    zoomControl: true,
    gestureHandling: 'cooperative',
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    backgroundColor: '#fbf9f4'
  });
  // 中心点(ホテル)に maroon ドット＋白縁マーカー
  new google.maps.Marker({
    position: KAIDO_LATLNG,
    map,
    title: '開土 KAIDO',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#904848',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3
    }
  });
}

/* ローダ：キー未設定なら自家製SVGを差し込み（破綻させない） */
(function(){
  const slot = document.getElementById('kaidoMap');
  if(!slot) return;
  if(!KAIDO_GMAP_KEY){
    slot.innerHTML =
      '<img src="assets/images/access-map.svg" ' +
      'alt="開土 KAIDO アクセスマップ" ' +
      'style="display:block;width:100%;height:100%;object-fit:cover;"/>';
    return;
  }
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://maps.googleapis.com/maps/api/js?key=' +
          encodeURIComponent(KAIDO_GMAP_KEY) + '&callback=initKaidoMap';
  document.head.appendChild(s);
})();

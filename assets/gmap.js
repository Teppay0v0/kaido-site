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

/* Snazzy Maps "Vintage" (by antoine heitzmann)
   https://snazzymaps.com/style/265633/vintage
   タン/クリーム(#b39443・#f5f5f5)＋淡いティール水域の暖色セピア。 */
const KAIDO_MAP_STYLES = [
  { featureType: "all", elementType: "geometry", stylers: [{ color: "#f5f5f5" }, { weight: 1 }] },
  { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "all", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.land_parcel", elementType: "geometry", stylers: [{ color: "#b39443" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#b39443" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#b39443" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#71c0c9" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] }
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

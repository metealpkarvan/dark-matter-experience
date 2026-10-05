# Dark Matter — Sonsuz Olasılık

Apple TV'nin Dark Matter dizisi için Türkçe, bağımsız ve ticari olmayan bir hayran deneyimi. Referans: https://www.explorethesilo.com/

## GitHub ve Vercel

Kaynak depo: https://github.com/metealpkarvan/dark-matter-experience

Vercel projesi `dark-matter-experience`, statik çıktı klasörü `dist`. Framework ve kurulum/derleme komutları gerekmez. `main` dalına gönderilen değişiklikler bağlı Vercel projesinde otomatik yayımlanır. Yerel Vercel kimlik bilgileri ve ortam dosyaları depoya eklenmez.

## Yerel kullanım

`dist` klasörünü bir web sunucusuyla servis edin. Örneğin proje klasöründe:

```sh
python3 -m http.server 4173 --directory dist
```

Tarayıcıdan http://localhost:4173 adresini açın. ES modülleri nedeniyle HTML dosyasına çift tıklayarak açmak yerine HTTP sunucusu kullanın.

## Deneyim ve fare kontrolleri

- Tekerleği aşağı/yukarı kaydırarak kamera rotasında ileri/geri gidin. Dikey sürükleme de rotayı ilerletir. Yana sürükleyerek etrafa bakın; bakış bıraktığınız yönde kalır, sonraki kaydırmada rotaya yumuşakça döner. Klavye gerekmez.
- Laboratuvar → Kutu’nun açılan kapısı → koridor → kül, kar, su, ütopik Chicago → Jason’ın özgün dünyası ve Dessen ailesinin evi.
- “Jason’ın evi” üst menü bağlantısı doğrudan evin dışına götürür. Kaydırma veya devam düğmesi ile antre, salon, sanat köşesi, yemek alanı ve mutfağa girilir.
- Kapılar menüsü evrenlere animasyonlu hızlı geçiş sağlar. Hareket sırasında kaydırmak geçişi iptal edip kontrolü size verir.
- Telefonda dikey sürükleyerek ilerleyin, yana sürükleyerek bakın. Yatay/dikey hareket ayrımı doğal tek parmakla gezinme sağlar.
- Gerçek 3D modeller, ağır kapılar, metal yüzeyler, hava/parçacık efektleri ve hareketli dalgalar. Kutu’nun içinde koridorun canlı 3D önizlemesi görünür.
- Hikâye, altı ana karakter, iki sezonun resmi bölüm arşivi ve iki resmi fragman.
- İsteğe bağlı, tarayıcıda üretilen atmosfer sesi; ses otomatik başlamaz. Hareket azaltma tercihi desteklenir.
- “Sahne referansı” özgün Apple/MPC/FOLKS karelerini açar. Referans fotoğrafları üç boyutlu dış dünyanın yerine kullanılmaz.
- WebMCP: görünür fare rotası, evren seçimi ve arşiv eylemleriyle aynı doğrulanan araçlar. Desteklemeyen tarayıcılar normal çalışır.

## İçerik kaynakları

Bilgi kontrol tarihi: 5 Ekim 2026. İkinci sezonun altı yayımlanmış bölümü ile resmen duyurulan 7. bölümü gösterilir; kalan bölüm adları uydurulmamıştır. Görseller genel dizi tanıtım kareleridir, her bölümün birebir sahne temsili değildir.

- Apple TV Press: https://www.apple.com/tv-pr/originals/dark-matter/
- Bölümler ve görseller: https://www.apple.com/tv-pr/originals/dark-matter/episodes-images/
- 2. sezon duyurusu: https://images.apple.com/tv-pr/news/2026/07/apple-tvs-sci-fi-thriller-dark-matter-takes-over-san-diego-comic-cons-hall-h-to-unveil-season-two-trailer/
- Kaynak roman: https://blakecrouch.com/books/dark-matter/

Dizi ve görseller ilgili hak sahiplerine aittir. Görseller Apple basın arşivinin kişisel/editoryal ve ticari olmayan kullanım koşulları altında kullanılmıştır. Proje Apple, Sony Pictures Television veya Blake Crouch ile bağlantılı değildir. 3D mekânlar resmî set çizimleri ve sahnelerden yeniden modellenmiştir; dizinin özgün 3D varlıkları değildir. MPC ve FOLKS referans kareleri kendi kaynaklarıyla gösterilir; hakları ilgili sahiplerinde kalır. Three.js MIT; Barlow Condensed ve DM Sans OFL lisansları paket içinde yer alır.

## Mekân araştırması

- Patricio Farrell, ADG Perspective, Kasım–Aralık 2024, basılı s.64–71: https://digital.copcomm.com/i/1529668-november-december-2024/65
- Görüntü yönetmenleri / ICG: https://www.icg600.com/news-articles/news/divergent
- MPC, Ash World, Water World ve World 26: https://www.mpcvfx.com/en/filmography/dark-matter/
- FOLKS, kar dünyası ve ütopik Chicago: https://beforesandafters.com/2024/08/05/inside-the-intricate-worlds-of-dark-matter/

Kutu’nun yaklaşık 3,86 m dış genişliği, 4,04 m yüksekliği ve 3,05 × 3,05 m iç mekânı final set çizimlerinden referans alınmıştır. Laboratuvarın soğuk çalışma ışığı, eğimli gözlem pencereleri, alt giriş bloğu ve sarı şeridi; koridorun gizli çelik yeşili ışığı ve ağır kapıları resmi fotoğraflara dayanır. Kül ve kar dünyası S1E4, su dünyası S1E5, World 26 S1E7 referanslarıdır.

Üç boyutlu modeller `dist/assets/*-city.json` dosyalarında ObjectLoader biçiminde yer alır. Model kaynak kodu ve doğrulama betiği `models/` içindedir. Mekân ve bakış kontrolleri `dist/experience.js`, fareyle ilerleyen kamera rotası `dist/tour.js` tarafından yönetilir.

## Dessen ailesinin evi

Patricio Farrell’ın ADG makalesinde yayımlanan Jason1 set fotoğrafları: https://digital.copcomm.com/i/1529668-november-december-2024/69

Koyu ahşap fretwork ve merdiven, sıcak döşeme, hardal kanepe/yeşil koltuk, turuncu perdeler, lacivert Shaker mutfak dolapları, pirinç detaylar, ahşap tezgâhlı ada, sarı sarkıtlar ve aile notları modelin referanslarıdır. Oda bağlantıları ve ölçüler keşif için yeniden kurulmuştur; yayımlanmamış bir kanonik kat planı iddiası yoktur. Sanat köşesi özgün bir düzenlemedir. Evin dış cephesi ikincil sahne referansından modellenmiştir. Tam kaynak ayrımı HOME-SOURCES.json içindedir.

Ev modeli: dist/assets/home-world.json. Kaynak: models/generate-home.mjs. Geometri doğrulama: models/validate-home.mjs. Kamera rotası: dist/tour.js.

// Global değişkenler YouTube oynatıcıları ve durumu takip etmek için
let backgroundPlayer;
let happierPlayer;
let dynamicPlayers = {}; // Dinamik eklenen şarkıların oynatıcılarını {playerId: playerInstance} şeklinde tutar
let currentlyPlayingPlayer = null; // Şu an hangi oynatıcının çaldığını takip et (YT.Player instance)
let songs = []; // Şarkı listesini [{title, description, videoId}, ...] şeklinde tutacak dizi

const backgroundVideoId = 'hyj4JFSErrw'; // Arka plan müziği video ID'si (Örnek: Lo-fi Girl)
const happierVideoId = '5GJWxDKyk3A';   // Happier Than Ever video ID'si

// --- YouTube IFrame Player API Hazırlık Fonksiyonu ---
// Bu fonksiyon API script'i yüklendiğinde otomatik olarak çağrılır
function onYouTubeIframeAPIReady() {
    console.log("YouTube API Hazır.");
    const musicToggle = document.getElementById('music-toggle');

    // 1. Arka Plan Oynatıcısını Oluştur
    try {
        backgroundPlayer = new YT.Player('background-player', {
            height: '0', // Görünmez
            width: '0',
            videoId: backgroundVideoId,
            playerVars: {
                'playsinline': 1,    // Mobil cihazlarda tam ekran olmadan oynatma
                'autoplay': 0,       // Otomatik başlatma (genelde engellenir, kullanıcı başlatmalı)
                'controls': 0,       // YouTube kontrollerini gizle
                'loop': 1,           // Döngüye al (playlist ile birlikte çalışır)
                'playlist': backgroundVideoId // Döngü için video ID'sini tekrar playlist olarak vermek gerekir
            },
            events: {
                'onReady': onBackgroundPlayerReady, // Oynatıcı hazır olduğunda
                'onStateChange': onPlayerStateChange // Oynatıcı durumu değiştiğinde
            }
        });
    } catch (e) {
        console.error("Arka plan oynatıcı oluşturulamadı:", e);
        if(musicToggle) musicToggle.textContent = "Müzik Hatası";
    }

    // 2. Happier Than Ever Oynatıcısını Oluştur
    try {
        happierPlayer = new YT.Player('happier-than-ever-player', {
            height: '0',
            width: '0',
            videoId: happierVideoId,
            playerVars: { 'playsinline': 1, 'controls': 0 },
            events: {
                'onStateChange': onPlayerStateChange
            }
        });
    } catch (e) {
        console.error("Happier Than Ever oynatıcı oluşturulamadı:", e);
    }

    // 3. Kayıtlı Dinamik Şarkıları Yükle ve Oynatıcılarını Oluştur
    // Bu fonksiyon içinde her şarkı için YT.Player instance'ı oluşturulur.
    loadSongs();

    // 4. Event Listener'ları Kurulumu (Oynatıcıların başlatılmasından sonra)
    setupEventListeners();
}

// --- Oynatıcı Hazır ve Durum Değişikliği Olayları ---
function onBackgroundPlayerReady(event) {
    // Oynatıcı hazır olduğunda, sesi biraz kısabiliriz ve butonu aktif edebiliriz
    event.target.setVolume(40); // Sesi %40 yapalım (isteğe bağlı)
    console.log("Arka plan oynatıcı hazır ve sesi ayarlandı.");
    const musicToggle = document.getElementById('music-toggle');
    if (musicToggle) {
        musicToggle.disabled = false; // Butonu etkinleştir
        musicToggle.textContent = "Arka Plan Müziğini Başlat"; // Başlangıç metni
    }
}

function onPlayerStateChange(event) {
    const changedPlayer = event.target;
    const playerState = event.data;

    // Bir video OYNATILIYOR durumuna geçtiğinde (YT.PlayerState.PLAYING = 1)
    if (playerState === YT.PlayerState.PLAYING) {
        console.log("Bir oynatıcı çalmaya başladı.");
        // Eğer çalan oynatıcı şu an aktif olandan farklıysa, öncekini durdur
        if (currentlyPlayingPlayer && currentlyPlayingPlayer !== changedPlayer) {
            console.log("Başka bir oynatıcı çalıyordu, durduruluyor.");
            // Arka plan müziği çalıyorsa ve başka bir şarkı başladıysa, arka planı durdur
            if (currentlyPlayingPlayer === backgroundPlayer && changedPlayer !== backgroundPlayer) {
                pauseBackgroundMusic(false); // Buton yazısını değiştirme (opsiyonel)
            }
            // Başka bir şarkı çalıyorsa ve yeni şarkı (veya arka plan) başladıysa, eskisini durdur
            else if (currentlyPlayingPlayer !== backgroundPlayer) {
                 currentlyPlayingPlayer.pauseVideo();
            }
        }
         // Şu an çalan oynatıcıyı güncelle
        currentlyPlayingPlayer = changedPlayer;

        // Eğer başlayan arka plan ise, butonu güncelle
        if (currentlyPlayingPlayer === backgroundPlayer) {
             const musicToggle = document.getElementById('music-toggle');
             if (musicToggle) musicToggle.textContent = "Arka Plan Müziğini Durdur";
        }

    }
    // Bir video DURAKLATILDIĞINDA (YT.PlayerState.PAUSED = 2) veya BİTTİĞİNDE (YT.PlayerState.ENDED = 0)
    else if (playerState === YT.PlayerState.PAUSED || playerState === YT.PlayerState.ENDED) {
        // Eğer duraklatılan/biten video şu an aktif olan ise, aktif oynatıcıyı sıfırla
        if (currentlyPlayingPlayer === changedPlayer) {
            console.log("Aktif oynatıcı durdu/bitti.");
             // Eğer duran arka plan ise butonu güncelle
            if(changedPlayer === backgroundPlayer) {
                const musicToggle = document.getElementById('music-toggle');
                if (musicToggle) musicToggle.textContent = "Arka Plan Müziğini Başlat";
                 // Loop çalışmazsa diye bittiğinde tekrar sıraya almayı deneyebiliriz (genelde playlist yeterli)
                 // if(playerState === YT.PlayerState.ENDED) {
                 //     backgroundPlayer.playVideo(); // Tekrar başlatmayı dene
                 // }
            }
            currentlyPlayingPlayer = null; // Artık aktif bir oynatıcı yok (bu duraklatma için önemli)
        }
    }
}

// --- Yardımcı Fonksiyonlar ---

// YouTube URL'sinden Video ID'sini çıkaran fonksiyon
function getYoutubeId(url) {
    if (!url) return null;
    let ID = '';
    // URL'yi normalize et ve ID'yi bulmaya çalış
    url = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    if (url[2] !== undefined) {
        ID = url[2].split(/[^0-9a-z_\-]/i);
        ID = ID[0];
    } else {
        // Eğer yukarıdaki desenler uymazsa, URL'nin kendisi ID olabilir mi diye bak
        ID = url && url[0].length === 11 ? url[0] : null;
    }
    // YouTube ID'leri genellikle 11 karakterlidir
    return ID && ID.length === 11 ? ID : null;
}


// Arka plan müziğini durdurma ve butonu güncelleme
function pauseBackgroundMusic(updateButtonText = true) {
    if (backgroundPlayer && typeof backgroundPlayer.pauseVideo === 'function') {
        backgroundPlayer.pauseVideo();
        if (updateButtonText) {
            const musicToggle = document.getElementById('music-toggle');
            if (musicToggle) musicToggle.textContent = "Arka Plan Müziğini Başlat";
        }
        if (currentlyPlayingPlayer === backgroundPlayer) {
            currentlyPlayingPlayer = null;
        }
        console.log("Arka plan müziği durduruldu.");
    }
}

// Şarkı elementini (HTML) ve oynatıcısını (JS) oluşturan fonksiyon
function createSongElement(song, isInitialLoad = false) {
    const container = document.getElementById('dynamic-songs-container');
    if (!container || !song || !song.videoId) {
        console.warn("Şarkı elementi oluşturulamadı, eksik bilgi:", song);
        return;
    };

    // Benzersiz ID'ler oluştur (sayfa yenilense bile tutarlı olması için videoId kullan)
    const elementId = `song-${song.videoId}`;
    const playerId = `player-${song.videoId}`;

    // Eğer bu ID ile bir element zaten varsa ekleme (sayfa yenilenince dublike olmasın)
    if (document.getElementById(elementId)) {
        console.log(`Element zaten var: ${elementId}`);
        // Oynatıcısı yoksa oluşturmayı dene (nadiren gerekir)
        if (!dynamicPlayers[playerId] && typeof YT !== 'undefined') {
             createDynamicPlayerInstance(playerId, song.videoId);
        }
        return;
    }

    // 1. Oynatıcı için div oluştur (görünmez alana)
    const playerDiv = document.createElement('div');
    playerDiv.id = playerId;
    const playerContainer = document.getElementById('player-container');
    if(playerContainer) playerContainer.appendChild(playerDiv);

    // 2. Şarkı kutucuğunu (HTML) oluştur
    const songElement = document.createElement('div');
    songElement.classList.add('music-player', 'clickable-song');
    songElement.id = elementId;
    songElement.dataset.youtubeid = song.videoId; // Video ID'sini sakla
    songElement.dataset.playerid = playerId;     // Player ID'sini sakla

    songElement.innerHTML = `
        <p>${song.title || 'Başlıksız Şarkı'}</p>
        <p class="song-note">${song.description || ''}</p>
        <button class="remove-song-button" data-videoid="${song.videoId}" style="float: right; margin-top: -35px; background: #5a5370; border: none; color: #ccc; padding: 3px 7px; border-radius: 4px; cursor: pointer; font-size: 0.8em;">Sil</button>
    `;

    // Tıklama olayını ekle
    songElement.addEventListener('click', (event) => {
        // Silme butonuna tıklandıysa oynatmayı tetikleme
        if (event.target.classList.contains('remove-song-button')) {
            return;
        }
        playDynamicSong(playerId, song.videoId);
    });

     // Silme Butonu Olayı
    const removeButton = songElement.querySelector('.remove-song-button');
    if(removeButton) {
        removeButton.addEventListener('click', () => {
            removeSong(song.videoId);
        });
    }

    container.appendChild(songElement);

    // 3. YouTube Oynatıcısını (YT.Player instance) Oluştur
    // API hazırsa hemen oluştur, değilse API hazır olduğunda oluşturulacak
    if (typeof YT !== 'undefined' && YT.Player) {
        createDynamicPlayerInstance(playerId, song.videoId);
    } else {
        console.log(`API henüz hazır değil, oynatıcı (${playerId}) daha sonra oluşturulacak.`);
        // API hazır olduğunda loadSongs tekrar çağrılabilir veya bu fonksiyon çağrılabilir.
        // Genellikle loadSongs'un APIReady içinde çağrılması yeterlidir.
    }
}

// Dinamik oynatıcı instance'ını oluşturan ayrı fonksiyon
function createDynamicPlayerInstance(playerId, videoId) {
     if (dynamicPlayers[playerId]) {
         console.log(`Oynatıcı zaten mevcut: ${playerId}`);
         return; // Zaten varsa tekrar oluşturma
     }
     try {
        dynamicPlayers[playerId] = new YT.Player(playerId, {
            height: '0',
            width: '0',
            videoId: videoId,
            playerVars: { 'playsinline': 1, 'controls': 0 },
            events: {
                'onStateChange': onPlayerStateChange
            }
        });
        console.log(`Dinamik oynatıcı oluşturuldu ve eklendi: ${playerId}`);
    } catch(e) {
        console.error(`Oynatıcı oluşturulamadı (${playerId}):`, e);
        // Hata durumunda ilgili HTML elementini de kaldırabiliriz.
        const songElement = document.getElementById(`song-${videoId}`);
        if (songElement) songElement.remove();
    }
}

// Dinamik şarkıyı oynatma fonksiyonu
function playDynamicSong(playerId, videoId) {
    const player = dynamicPlayers[playerId];
    if (player && typeof player.playVideo === 'function') {
        console.log(`Oynatılıyor: ${playerId} - ${videoId}`);

        // Diğerlerini durdur (arka plan dahil)
        if (currentlyPlayingPlayer && currentlyPlayingPlayer !== player) {
             // Eğer arka plan çalıyorsa özel fonksiyonu kullan
             if(currentlyPlayingPlayer === backgroundPlayer) {
                pauseBackgroundMusic(false); // Buton yazısını değiştirme
             } else {
                currentlyPlayingPlayer.pauseVideo(); // Diğer şarkıyı durdur
             }
        }

        // Şarkıyı çal
        player.playVideo();
        currentlyPlayingPlayer = player; // Şu an çalanı güncelle (onStateChange de yapar ama burada da yapalım)
    } else {
        console.error(`Oynatıcı bulunamadı veya geçerli değil: ${playerId}`);
        // Oynatıcı yoksa oluşturmayı deneyebiliriz (eğer API geç yüklenmişse)
        if (typeof YT !== 'undefined' && YT.Player && !player) {
             console.log(`Oynatıcı (${playerId}) yoktu, oluşturuluyor...`);
             createDynamicPlayerInstance(playerId, videoId);
             // Kısa bir süre sonra tekrar oynatmayı dene
             setTimeout(() => playDynamicSong(playerId, videoId), 500);
        } else {
            alert("Şarkı oynatıcısı yüklenemedi. Sayfayı yenileyip tekrar deneyebilirsin.");
        }
    }
}

// Şarkıyı listeden ve ekrandan silme fonksiyonu
function removeSong(videoId) {
    console.log(`Şarkı siliniyor: ${videoId}`);
    // 1. songs dizisinden kaldır
    songs = songs.filter(song => song.videoId !== videoId);

    // 2. localStorage'ı güncelle
    saveSongs();

    // 3. Ekrandaki HTML elementini kaldır
    const songElement = document.getElementById(`song-${videoId}`);
    if (songElement) {
        songElement.remove();
    }

    // 4. Oynatıcı instance'ını ve div'ini kaldır
    const playerId = `player-${videoId}`;
    if (dynamicPlayers[playerId]) {
        if (typeof dynamicPlayers[playerId].destroy === 'function') {
            dynamicPlayers[playerId].destroy(); // Oynatıcıyı temizle
        }
        delete dynamicPlayers[playerId]; // Nesneden kaldır
    }
    const playerDiv = document.getElementById(playerId);
    if (playerDiv) {
        playerDiv.remove();
    }
    console.log(`Şarkı (${videoId}) başarıyla silindi.`);
}


// --- localStorage İşlemleri ---
function saveSongs() {
    try {
        localStorage.setItem('ceydaSongs', JSON.stringify(songs));
        console.log("Şarkılar localStorage'a kaydedildi.");
    } catch (e) {
        console.error("localStorage'a kaydederken hata:", e);
        // alert("Tarayıcı ayarlarınız nedeniyle şarkılar kaydedilemedi.");
    }
}

function loadSongs() {
    try {
        const storedSongs = localStorage.getItem('ceydaSongs');
        if (storedSongs) {
            songs = JSON.parse(storedSongs);
            console.log("localStorage'dan şarkılar yüklendi:", songs);

            // Temiz bir başlangıç için konteyneri boşalt (isteğe bağlı, dublike engelleme varsa gerekmeyebilir)
             const container = document.getElementById('dynamic-songs-container');
            // if(container) container.innerHTML = ''; // Yeniden oluşturma için temizle

            // Her şarkı için elementi ve oynatıcıyı oluştur/kontrol et
            songs.forEach(song => {
                 if (song && song.videoId) {
                     createSongElement(song, true); // Elementi oluştur/kontrol et
                 } else {
                     console.warn("localStorage'dan geçersiz şarkı verisi geldi:", song);
                 }
            });
        } else {
            songs = []; // Eğer kayıt yoksa boş diziyle başla
            console.log("Kaydedilmiş şarkı bulunamadı.");
        }
    } catch (e) {
        console.error("localStorage'dan yüklerken hata:", e);
        songs = []; // Hata durumunda sıfırla
        localStorage.removeItem('ceydaSongs'); // Bozuk veriyi temizle
    }
}


// --- Event Listener Kurulumu ---
// Bu fonksiyon onYouTubeIframeAPIReady içinde çağrılacak
function setupEventListeners() {
    console.log("Event Listener'lar kuruluyor.");
    const hugButton = document.getElementById('hug-button');
    const hugMessage = document.getElementById('hug-message');
    const catImage = document.getElementById('cat-image');
    const musicToggle = document.getElementById('music-toggle');
    const happierSongElement = document.getElementById('song-happier');
    const addSongSection = document.getElementById('add-song-section');
    const toggleAddFormButton = document.getElementById('toggle-add-form-button');
    const saveSongButton = document.getElementById('save-song-button');

    // Sanal Sarılma
    if (hugButton && hugMessage && catImage) {
        hugButton.addEventListener('click', () => {
            const messages = [ /*...*/ ]; // Mesajları ekle
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            hugMessage.textContent = randomMessage;
            hugMessage.classList.add('visible');
            catImage.style.transform = 'scale(1.1)';
            setTimeout(() => catImage.style.transform = 'scale(1)', 200);
             // Mesajı bir süre sonra kaldırmak istersen:
             setTimeout(() => hugMessage.classList.remove('visible'), 5000);
        });
    } else { console.error("Sarılma butonu elementleri bulunamadı."); }

    // Arka Plan Müziği Aç/Kapa
    if (musicToggle) {
         // Başlangıçta butonu devre dışı bırak, API hazır olunca aktifleşecek
        musicToggle.disabled = true;
        musicToggle.textContent = "Müzik Yükleniyor...";

        musicToggle.addEventListener('click', () => {
             if (!backgroundPlayer || typeof backgroundPlayer.getPlayerState !== 'function') {
                 console.error("Arka plan oynatıcı henüz hazır değil veya geçerli değil.");
                 alert("Müzik oynatıcı henüz hazır değil, lütfen biraz bekleyin.");
                 return;
             }

            const playerState = backgroundPlayer.getPlayerState();
            if (playerState === YT.PlayerState.PLAYING) {
                pauseBackgroundMusic(); // Durdurma fonksiyonunu kullan
            } else {
                 // Diğerlerini durdur
                 if (currentlyPlayingPlayer && currentlyPlayingPlayer !== backgroundPlayer) {
                    currentlyPlayingPlayer.pauseVideo();
                 }
                console.log("Arka plan müziği başlatılıyor...");
                backgroundPlayer.playVideo();
                // Buton yazısı onStateChange içinde güncellenecek
            }
        });
    } else { console.error("Müzik toggle butonu bulunamadı."); }


    // Happier Than Ever Tıklama
    if (happierSongElement) {
        happierSongElement.addEventListener('click', () => {
             if (!happierPlayer || typeof happierPlayer.playVideo !== 'function') {
                  console.error("Happier Than Ever oynatıcı hazır değil.");
                  alert("Şarkı oynatıcı yüklenemedi, sayfayı yenileyin.");
                  return;
             }
            console.log("Happier Than Ever çalınıyor...");
            if (currentlyPlayingPlayer && currentlyPlayingPlayer !== happierPlayer) {
                if(currentlyPlayingPlayer === backgroundPlayer) {
                   pauseBackgroundMusic(false); // Arka planı durdur (buton yazısı değişmesin)
                } else {
                   currentlyPlayingPlayer.pauseVideo(); // Diğer şarkıyı durdur
                }
            }
            happierPlayer.playVideo();
            // currentlyPlayingPlayer = happierPlayer; // StateChange halledecek
        });
    } else { console.error("Happier Than Ever elementi bulunamadı."); }

    // Şarkı Ekleme Formu Göster/Gizle
    if (toggleAddFormButton && addSongSection) {
        toggleAddFormButton.addEventListener('click', () => {
            const isVisible = addSongSection.style.display === 'block';
            addSongSection.style.display = isVisible ? 'none' : 'block';
             // Buton yazısını da değiştirebiliriz
             toggleAddFormButton.textContent = isVisible ? 'Şarkı Ekleme Alanını Aç' : 'Şarkı Ekleme Alanını Kapa';
        });
    } else { console.error("Şarkı ekleme formu toggle butonu veya bölümü bulunamadı."); }

    // Yeni Şarkı Kaydetme
    if (saveSongButton) {
        saveSongButton.addEventListener('click', () => {
            const titleInput = document.getElementById('new-song-title');
            const descInput = document.getElementById('new-song-desc');
            const linkInput = document.getElementById('new-song-link');

            const title = titleInput.value.trim();
            const description = descInput.value.trim();
            const link = linkInput.value.trim();
            const videoId = getYoutubeId(link);

            if (title && description && videoId) {
                 // Aynı şarkı zaten var mı diye kontrol et
                 if (songs.some(s => s.videoId === videoId)) {
                     alert("Bu şarkı zaten eklenmiş!");
                     return;
                 }
                const newSong = { title, description, videoId };
                songs.push(newSong);
                saveSongs(); // localStorage'a kaydet
                createSongElement(newSong); // Ekrana ekle ve oynatıcıyı oluştur

                // Formu temizle
                titleInput.value = '';
                descInput.value = '';
                linkInput.value = '';

                alert(`"${title}" şarkısı eklendi!`);

            } else if (!videoId) {
                 alert("Geçerli bir YouTube linki bulunamadı. Linki kontrol edin (örn: https://www.youtube.com/watch?v=....).");
            }
             else {
                alert("Lütfen şarkı adı, açıklama ve geçerli bir YouTube linki girin.");
            }
        });
    } else { console.error("Şarkı kaydet butonu bulunamadı."); }

}

// --- Başlangıç ---
// Kodun çalışması YouTube API'sinin `onYouTubeIframeAPIReady` fonksiyonunu çağırmasına bağlı.
// Bu yüzden eski DOMContentLoaded sarmalayıcısı yerine her şey API hazır olduğunda başlıyor.
console.log("Script yüklendi, YouTube API bekleniyor...");

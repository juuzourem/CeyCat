// --- Global Değişkenler ---
let backgroundPlayer;
let happierPlayer;
let dynamicPlayers = {}; // Dinamik şarkıların oynatıcıları: { playerId: playerInstance }
let currentlyPlayingPlayer = null; // Şu an çalan YT.Player instance'ı
let songs = []; // Kayıtlı şarkılar: [{ title, description, videoId }]

const backgroundVideoId = 'hyj4JFSErrw'; // Arka plan video ID'si
const happierVideoId = '5GJWxDKyk3A';   // Happier Than Ever video ID'si

// --- YouTube IFrame Player API Hazırlık ---
// API yüklendiğinde otomatik çağrılır
function onYouTubeIframeAPIReady() {
    console.log("YouTube API Hazır.");
    try {
        // 1. Arka Plan Oynatıcısını Oluştur
        backgroundPlayer = new YT.Player('background-player', {
            height: '0', width: '0', videoId: backgroundVideoId,
            playerVars: { 'playsinline': 1, 'loop': 1, 'playlist': backgroundVideoId }, // loop için playlist gerekli
            events: { 'onReady': onBackgroundPlayerReady, 'onStateChange': onPlayerStateChange }
        });

        // 2. Happier Than Ever Oynatıcısını Oluştur
        happierPlayer = new YT.Player('happier-than-ever-player', {
            height: '0', width: '0', videoId: happierVideoId,
            playerVars: { 'playsinline': 1 },
            events: { 'onStateChange': onPlayerStateChange }
        });

    } catch (e) {
        console.error("Ana oynatıcılar oluşturulurken hata:", e);
        alert("Müzik oynatıcıları yüklenirken bir sorun oluştu. Sayfayı yenilemeyi deneyin.");
        // Hata durumunda müzik butonunu bilgilendirici yap
        const musicToggle = document.getElementById('music-toggle');
        if (musicToggle) {
            musicToggle.textContent = "Hata!";
            musicToggle.disabled = true;
        }
        return; // API hatası varsa devam etme
    }

    // 3. Kayıtlı Dinamik Şarkıları Yükle (Bu fonksiyon içinde oynatıcılar oluşturulur)
    loadSongs();
}

// --- Oynatıcı Hazır ve Durum Değişikliği Olayları ---
function onBackgroundPlayerReady(event) {
    console.log("Arka plan oynatıcı hazır.");
    event.target.setVolume(40); // Başlangıç sesi
    // Arka plan oynatıcı hazır olunca diğer event listenerları kurabiliriz
    setupEventListeners();
}

function onPlayerStateChange(event) {
    const changedPlayer = event.target;
    const playerState = event.data;
    const playerId = findPlayerId(changedPlayer); // Yardımcı fonksiyonla ID al
    console.log(`State Değişti: ${playerId}, Durum: ${playerState}`);

    // Bir video çalmaya başladığında (PLAYING = 1)
    if (playerState == YT.PlayerState.PLAYING) {
        console.log(`Oynatılıyor: ${playerId}`);
        // Eğer farklı bir oynatıcı çalmaya başladıysa, öncekini durdur
        if (currentlyPlayingPlayer && currentlyPlayingPlayer !== changedPlayer) {
            const previousPlayerId = findPlayerId(currentlyPlayingPlayer);
            console.log(`Önceki oynatıcı (${previousPlayerId}) durduruluyor.`);
            // Arka plan çalıyorsa özel fonksiyonla durdur (buton için)
            if(currentlyPlayingPlayer === backgroundPlayer) {
                pauseBackgroundMusic(false); // Buton yazısını hemen değiştirme
            } else {
                currentlyPlayingPlayer.pauseVideo();
            }
        }
        // Şu an çalan oynatıcıyı güncelle
        currentlyPlayingPlayer = changedPlayer;
        // Butonları ve durumu güncelle
        updateMusicToggleButton(changedPlayer === backgroundPlayer);

    }
    // Bir video duraklatıldığında veya bittiğinde (PAUSED = 2, ENDED = 0)
    else if (playerState == YT.PlayerState.PAUSED || playerState == YT.PlayerState.ENDED) {
        console.log(`Durdu/Bitti: ${playerId}`);
        // Eğer duran/biten oynatıcı şu an aktif olarak işaretli olan ise, aktif oynatıcıyı temizle
        // (Başka bir şarkı başlatıldığında zaten temizleniyor, bu manuel durdurma/bitme için)
        if (currentlyPlayingPlayer === changedPlayer) {
            currentlyPlayingPlayer = null;
            console.log("Aktif oynatıcı temizlendi.");
            // Eğer duran/biten arka plan müziği ise, butonu güncelle
            if (changedPlayer === backgroundPlayer) {
                 updateMusicToggleButton(false); // Durdu durumuna getir
            }
        }
    }
    // Arka plan video bittiğinde (loop çalışmazsa diye)
    if (playerState == YT.PlayerState.ENDED && changedPlayer === backgroundPlayer) {
        console.log("Arka plan video bitti (loop bekleniyordu).");
        updateMusicToggleButton(false); // Butonu 'Başlat' yap
        currentlyPlayingPlayer = null;
    }
}

// --- Yardımcı Fonksiyonlar ---

// YouTube URL'sinden Video ID'sini çıkarır
function getYoutubeId(url) {
    if (!url) return null;
    let ID = '';
    url = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    if (url[2] !== undefined) {
        ID = url[2].split(/[^0-9a-z_\-]/i);
        ID = ID[0];
    } else {
        ID = url; // Sadece ID girilmiş olabilir
    }
    // YouTube ID'leri genellikle 11 karakterlidir, bunu kontrol edelim
    return ID && /^[a-zA-Z0-9_-]{11}$/.test(ID) ? ID : null;
}


// Belirli bir şarkıyı oynatır, diğerlerini durdurur
function playSpecificSong(playerInstance, playerName) {
     if (!playerInstance || typeof playerInstance.playVideo !== 'function') {
        console.error(`${playerName} oynatıcı bulunamadı veya hazır değil!`);
        alert(`${playerName} şarkısı şu an çalınamıyor. Lütfen biraz bekleyip tekrar deneyin.`);
        return;
    }
    console.log(`${playerName} çalma isteği...`);

    // Mevcut olanı durdur (kendisi değilse)
    if (currentlyPlayingPlayer && currentlyPlayingPlayer !== playerInstance) {
        const previousPlayerId = findPlayerId(currentlyPlayingPlayer);
        console.log(`Önceki oynatıcı (${previousPlayerId}) durduruluyor.`);
        if(currentlyPlayingPlayer === backgroundPlayer) {
           pauseBackgroundMusic(true); // Butonu da güncelle
        } else {
           currentlyPlayingPlayer.pauseVideo();
        }
        currentlyPlayingPlayer = null; // Önceki oynatıcıyı temizle
    } else if (currentlyPlayingPlayer === playerInstance) {
        // Eğer zaten bu çalıyorsa, tekrar tıklanınca durdur
         console.log(`${playerName} zaten çalıyordu, durduruluyor.`);
         playerInstance.pauseVideo();
         // currentlyPlayingPlayer = null; // State change halledecek
         // updateMusicToggleButton(false); // State change halledecek (eğer arka plan ise)
        return;
    }

    // İstenen şarkıyı oynat
    console.log(`${playerName} oynatılıyor.`);
    playerInstance.seekTo(0); // Başa sar
    playerInstance.playVideo();
    // `currentlyPlayingPlayer` state change içinde ayarlanacak
}

// Arka plan müziğini durdurur
function pauseBackgroundMusic(updateButtonText = true) {
    if (backgroundPlayer && typeof backgroundPlayer.pauseVideo === 'function') {
        backgroundPlayer.pauseVideo();
        if (updateButtonText) {
             updateMusicToggleButton(false); // Durdu durumuna getir
        }
        // Eğer aktif oynatıcı arka plan ise temizle (state change'den önce)
        if (currentlyPlayingPlayer === backgroundPlayer) {
            currentlyPlayingPlayer = null;
        }
        console.log("Arka plan müziği durduruldu.");
    }
}

// Sabit müzik butonunu günceller (Görünüm ve Class)
function updateMusicToggleButton(isPlaying) {
    const musicToggle = document.getElementById('music-toggle');
    if (musicToggle) {
        musicToggle.disabled = false; // Artık hazır, etkinleştir
        if (isPlaying) {
            musicToggle.textContent = "Müziği Durdur";
            musicToggle.classList.add('playing');
        } else {
            musicToggle.textContent = "Müziği Başlat";
            musicToggle.classList.remove('playing');
        }
    }
}

// Player instance'ından ID'sini bulur (Debug ve kontrol için)
function findPlayerId(playerInstance) {
    if (playerInstance === backgroundPlayer) return 'background-player';
    if (playerInstance === happierPlayer) return 'happier-than-ever-player';
    for (const id in dynamicPlayers) {
        if (dynamicPlayers[id] === playerInstance) return id;
    }
    return 'unknown-player';
}


// --- Şarkı Ekleme ve Listeleme ---

// Yeni şarkı elementini ve oynatıcısını oluşturur
function createSongElement(song) {
    const container = document.getElementById('dynamic-songs-container');
    if (!container || !song || !song.videoId) {
        console.error("Şarkı elementi oluşturulamadı: Geçersiz veri veya konteyner yok.", song);
        return;
    }

    // Zaten ekli mi diye kontrol et (aynı video ID'li)
    if (document.querySelector(`.clickable-song[data-youtubeid="${song.videoId}"]`)) {
        console.warn(`Şarkı zaten ekli: ${song.title} (${song.videoId})`);
        return; // Eğer zaten varsa tekrar ekleme
    }

    const uniqueSuffix = Date.now(); // ID'lerin benzersiz olmasını garantile
    const songElementId = `song-${song.videoId}-${uniqueSuffix}`;
    const playerId = `player-${song.videoId}-${uniqueSuffix}`;

    // 1. Oynatıcı için div oluştur ve görünmez alana ekle
    const playerDiv = document.createElement('div');
    playerDiv.id = playerId;
    document.getElementById('player-container').appendChild(playerDiv);

    // 2. Şarkı kutucuğunu oluştur
    const songElement = document.createElement('div');
    songElement.classList.add('music-player', 'clickable-song');
    songElement.id = songElementId;
    songElement.dataset.youtubeid = song.videoId;
    songElement.dataset.playerid = playerId; // Player ID'sini de sakla
    songElement.setAttribute('data-aos', 'fade-up'); // Animasyon ekle

    songElement.innerHTML = `
        <p>${song.title || 'Başlıksız Şarkı'}</p>
        <p class="song-note">${song.description || ''}</p>
    `;

    // 3. Tıklama olayını ekle
    songElement.addEventListener('click', () => {
        playSpecificSong(dynamicPlayers[playerId], `Dinamik Şarkı (${song.title || song.videoId})`);
    });

    container.appendChild(songElement);
    AOS.refresh(); // Yeni eklenen eleman için AOS'u yenile

    // 4. YouTube Oynatıcısını Oluştur
     try {
        dynamicPlayers[playerId] = new YT.Player(playerId, {
            height: '0', width: '0', videoId: song.videoId,
            playerVars: { 'playsinline': 1 },
            events: { 'onStateChange': onPlayerStateChange }
        });
        console.log(`Dinamik oynatıcı oluşturuldu: ${playerId} - ${song.title}`);
    } catch(e) {
        console.error(`Oynatıcı oluşturulamadı (${playerId}):`, e);
        // Hata durumunda eklenen DOM elemanlarını geri al
        container.removeChild(songElement);
        document.getElementById('player-container').removeChild(playerDiv);
        // Kullanıcıya bilgi verilebilir
        alert(`"${song.title}" şarkısı için oynatıcı oluşturulamadı. Lütfen tekrar deneyin veya linki kontrol edin.`);
        // Hatalı şarkıyı 'songs' dizisinden ve localStorage'dan da silmek mantıklı olabilir.
        songs = songs.filter(s => s.videoId !== song.videoId);
        saveSongs();
    }
}

// --- localStorage İşlemleri ---
function saveSongs() {
    try {
        localStorage.setItem('ceydaSongs', JSON.stringify(songs));
        console.log("Şarkılar kaydedildi:", songs);
    } catch (e) {
        console.error("localStorage'a kaydederken hata:", e);
        // Kullanıcıya bilgi verilebilir, örn. tarayıcı ayarları vs.
    }
}

function loadSongs() {
    try {
        const storedSongs = localStorage.getItem('ceydaSongs');
        if (storedSongs) {
            songs = JSON.parse(storedSongs);
            console.log("Şarkılar yüklendi:", songs);
            const container = document.getElementById('dynamic-songs-container');
            if(container) container.innerHTML = ''; // Başlangıçta temizle
            // Her şarkı için elementi ve oynatıcıyı oluştur
            songs.forEach(song => {
                if (song && song.videoId) {
                    createSongElement(song); // Bu fonksiyon oynatıcıyı da oluşturur
                } else {
                    console.warn("localStorage'dan geçersiz şarkı verisi okundu:", song);
                }
            });
        } else {
            songs = []; // Kayıt yoksa boş dizi
        }
    } catch (e) {
        console.error("localStorage'dan yüklerken hata:", e);
        songs = []; // Hata durumunda sıfırla
        localStorage.removeItem('ceydaSongs'); // Bozuk veriyi temizle
    }
}


// --- Modal Pencere İşlevleri ---
function setupModal() {
    const modal = document.getElementById('add-song-modal');
    const openModalButton = document.getElementById('open-add-song-modal-button');
    const closeModalButton = document.querySelector('.close-modal-button');
    const addSongForm = document.getElementById('add-song-form');

    function openModal() {
        if (modal) modal.style.display = 'block';
    }
    function closeModal() {
        if (modal) modal.style.display = 'none';
        if (addSongForm) addSongForm.reset(); // Kapatırken formu temizle
    }

    if (openModalButton) openModalButton.addEventListener('click', openModal);
    if (closeModalButton) closeModalButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => { if (event.target == modal) closeModal(); });

    // Form gönderme
    if (addSongForm) {
        addSongForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const title = document.getElementById('new-song-title').value.trim();
            const description = document.getElementById('new-song-desc').value.trim();
            const link = document.getElementById('new-song-link').value.trim();
            const videoId = getYoutubeId(link);

            if (title && description && videoId) {
                if (songs.some(s => s.videoId === videoId)) {
                    alert("Bu şarkı zaten ekli!");
                    return;
                }
                const newSong = { title, description, videoId };
                songs.push(newSong);
                saveSongs();
                createSongElement(newSong); // Ekrana ekle
                closeModal();
            } else if (!videoId) {
                alert("Lütfen geçerli bir YouTube video linki girin.");
            } else {
                alert("Lütfen tüm alanları doldurun.");
            }
        });
    }
}


// --- Genel Event Listener Kurulumu ---
// Bu fonksiyon onBackgroundPlayerReady içinde çağrılır
function setupEventListeners() {
    console.log("Event Listener'lar kuruluyor.");

    // Sanal Sarılma
    const hugButton = document.getElementById('hug-button');
    const hugMessage = document.getElementById('hug-message');
    const catImage = document.getElementById('cat-image');
    if (hugButton && hugMessage && catImage) {
        hugButton.addEventListener('click', () => {
            const messages = [
                "İstanbul'dan Eskişehir'e sımsıcak bir kardeş sarılması gönderildi! 🤗💜",
                "Mesafeler olsa da sevgim hep seninle Ablamm! Kocaman sarıldım!",
                "Şu an yanında olamasam da tüm gücümle sana sarılıyorum! ✨",
                "Unutma, yalnız değilsin! Bu da benden sana güç veren bir sarılma!",
                "Bu kedi sarılması sana Behlül'den! 🐾❤️"
            ];
            hugMessage.textContent = messages[Math.floor(Math.random() * messages.length)];
            hugMessage.classList.add('visible');
            catImage.classList.add('hugged');
            setTimeout(() => catImage.classList.remove('hugged'), 500);
            // Mesaj bir süre sonra kaybolabilir
             setTimeout(() => hugMessage.classList.remove('visible'), 5000);
        });
    }

    // Arka Plan Müziği Butonu
    const musicToggle = document.getElementById('music-toggle');
    if (musicToggle && backgroundPlayer) {
        musicToggle.addEventListener('click', () => {
            playSpecificSong(backgroundPlayer, "Arka Plan Müziği"); // Oynatma/Durdurma mantığı burada
        });
        // Başlangıç durumunu ayarla (onBackgroundPlayerReady'de zaten etkinleştirildi)
        updateMusicToggleButton(false); // Başlangıçta duruyor
    }

    // Happier Than Ever Tıklama
    const happierSongElement = document.getElementById('song-happier');
    if (happierSongElement && happierPlayer) {
        happierSongElement.addEventListener('click', () => {
            playSpecificSong(happierPlayer, "Happier Than Ever");
        });
    }

    // Kayıtlı şarkılar için tıklama olayları (loadSongs -> createSongElement içinde eklendi)

    // Modal Pencere kurulumu
    setupModal();

    // AOS Animasyon Kütüphanesini Başlat
    AOS.init({
        duration: 800, // Animasyon süresi (ms)
        once: true,    // Sadece bir kere çalışsın
        offset: 50,    // Ne kadar görünür olunca başlasın (px)
        easing: 'ease-out-cubic', // Yumuşak geçiş
    });

    console.log("Event Listener kurulumu tamamlandı.");
}

// --- Başlangıç ---
// YouTube API yüklendiğinde `onYouTubeIframeAPIReady` otomatik olarak çağrılır.
// Diğer tüm işlemler oradan tetiklenir.

document.addEventListener('DOMContentLoaded', () => {
    const hugButton = document.getElementById('hug-button');
    const hugMessage = document.getElementById('hug-message');
    const catImage = document.getElementById('cat-image'); // Kedi resmini de alalım

    // Sanal Sarılma Butonu İşlevi
    if (hugButton && hugMessage && catImage) {
        hugButton.addEventListener('click', () => {
            // Farklı sarılma mesajları
            const messages = [
                "İstanbul'dan Eskişehir'e sımsıcak bir kardeş sarılması gönderildi! 🤗💜",
                "Mesafeler olsa da sevgim hep seninle Ablamm! Kocaman sarıldım!",
                "Şu an yanında olamasam da tüm gücümle sana sarılıyorum! ✨",
                "Unutma, yalnız değilsin! Bu da benden sana güç veren bir sarılma!",
                "Bu kedi sarılması sana Behlül'den! 🐾❤️"
            ];
            // Rastgele bir mesaj seç
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];

            hugMessage.textContent = randomMessage;
            hugMessage.classList.add('visible'); // Mesajı görünür yap (CSS ile animasyonlu)

            // Küçük bir efekt: Kediye tıklandığında hafifçe büyüsün
            catImage.style.transform = 'scale(1.1)';
            setTimeout(() => {
                catImage.style.transform = 'scale(1)';
            }, 200); // 0.2 saniye sonra normale dönsün

            // Mesaj bir süre sonra kaybolabilir (isteğe bağlı)
            // setTimeout(() => {
            //     hugMessage.classList.remove('visible');
            // }, 4000); // 4 saniye sonra kaybolsun
        });
    }

    // Arka Plan Müziği Kontrolü
    const musicToggle = document.getElementById('music-toggle');
    const backgroundMusic = document.getElementById('background-music');

    if (musicToggle && backgroundMusic) {
        let isPlaying = false;
        // Önemli Not: Çoğu tarayıcı, kullanıcı etkileşimi olmadan otomatik müzik çalmayı engeller.
        // Bu yüzden ilk tıklamada başlatmak en iyisidir.
        musicToggle.addEventListener('click', () => {
            if (isPlaying) {
                backgroundMusic.pause();
                musicToggle.textContent = "Müziği Başlat";
            } else {
                // Kullanıcı etkileşimi olduğu için çalma olasılığı daha yüksek
                backgroundMusic.play().catch(error => {
                    console.error("Müzik çalınamadı:", error);
                    // Kullanıcıya bir uyarı gösterebilirsin
                    alert("Tarayıcı ayarları nedeniyle müzik otomatik başlatılamadı. Lütfen tekrar deneyin.");
                });
                musicToggle.textContent = "Müziği Durdur";
            }
            isPlaying = !isPlaying;
        });

        // Şarkı bittiğinde buton yazısını güncelle (loop aktif olduğu için aslında bitmez ama önlem)
         backgroundMusic.addEventListener('ended', () => {
             isPlaying = false;
             musicToggle.textContent = "Müziği Başlat";
         });

         // Sayfa yüklenirken müziğin çalmadığını varsayalım
         musicToggle.textContent = "Müziği Başlat";

    } else {
        // Eğer müzik elemanları yoksa butonu gizle
        if (musicToggle) musicToggle.style.display = 'none';
    }

    // --- İSTEĞE BAĞLI: p5.js ile Parçacık Efekti ---
    // Eğer p5.js kullanmaya karar verirsen aşağıdaki yorum satırlarını kaldırıp
    // HTML'de p5.js scriptlerini ve #canvas-container div'ini eklemelisin.

    /*
    let particles = [];

    function setup() {
        let canvas = createCanvas(windowWidth, windowHeight);
        // Canvas'ı HTML'deki div içine yerleştir
        let canvasContainer = select('#canvas-container');
        if (canvasContainer) {
            canvas.parent('canvas-container');
        } else {
            console.error('#canvas-container bulunamadı!');
        }

        // Başlangıç parçacıklarını oluştur
        for (let i = 0; i < 50; i++) { // Parçacık sayısı
            particles.push(new Particle());
        }
    }

    function draw() {
        clear(); // Arka planı temizle (yoksa iz kalır) - Şeffaf yapar
        // background(44, 42, 58, 10); // Hafif opak arka plan istersen

        for (let p of particles) {
            p.update();
            p.show();
        }
    }

    function windowResized() {
        resizeCanvas(windowWidth, windowHeight);
    }

    // Parçacık Sınıfı
    class Particle {
        constructor() {
            this.pos = createVector(random(width), random(height));
            this.vel = createVector(random(-0.5, 0.5), random(-0.5, 0.5)); // Yavaş hareket
            this.size = random(2, 5);
            this.color = color(random(180, 220), random(160, 200), random(200, 240), random(100, 200)); // Mor/Mavi tonları, yarı şeffaf
        }

        update() {
            this.pos.add(this.vel);
            this.edges();
        }

        show() {
            noStroke();
            fill(this.color);
            ellipse(this.pos.x, this.pos.y, this.size);
        }

        // Kenarlardan geri dönme
        edges() {
            if (this.pos.x < 0 || this.pos.x > width) {
                this.vel.x *= -1;
            }
            if (this.pos.y < 0 || this.pos.y > height) {
                this.vel.y *= -1;
            }
        }
    }

    // p5.js'i sadece DOM yüklendiğinde başlat
    if (typeof setup === 'function' && typeof draw === 'function') {
        // p5.js kütüphanesinin global scope'ta olduğunu varsayıyoruz
         // Bu satır genellikle p5 kütüphanesi tarafından otomatik halledilir ama emin olmak için.
         // Eğer instance mode kullanırsan farklı bir yapı gerekir.
    }
    */

}); // DOMContentLoaded Sonu
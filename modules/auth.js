// modules/auth.js

export function initAuth() {
    const loginScreen = document.getElementById('login-screen');
    const formLogin = document.getElementById('form-login');
    const gizliMenuBtn = document.getElementById('nav-bildirimler'); // Gizli butonumuz

    const aktifKullanici = sessionStorage.getItem('diyetTakibimAuth');

    // Eğer yetkili biri zaten giriş yapmışsa
    if (aktifKullanici === 'dytbeyza_onayli' || aktifKullanici === 'kadir_admin_onayli') {
        if (loginScreen) loginScreen.style.display = 'none';
        
        // Eğer giren KADİR ise, gizli kırmızı butonu ortaya çıkar!
        if (aktifKullanici === 'kadir_admin_onayli' && gizliMenuBtn) {
            gizliMenuBtn.classList.remove('hidden');
            gizliMenuBtn.classList.add('flex');
        }
    } else {
        if (loginScreen) {
            loginScreen.style.display = 'flex';
            loginScreen.style.opacity = '1';
        }
    }

    if (formLogin) {
        formLogin.onsubmit = (e) => {
            e.preventDefault();
            const u = document.getElementById('login-user').value;
            const p = document.getElementById('login-pass').value;

            // 1. NORMAL GİRİŞ (DYT. BEYZA)
            if (u === 'dytbeyza' && p === 'dytbeyzayılmaz00') {
                sessionStorage.setItem('diyetTakibimAuth', 'dytbeyza_onayli');
                if (window.showToast) window.showToast('Giriş Başarılı! Hoş Geldiniz Dyt. Beyza', 'success');
                loginScreen.style.opacity = '0';
                setTimeout(() => { loginScreen.style.display = 'none'; }, 500);
            } 
            // 2. GİZLİ PATRON GİRİŞİ (KADİR)
            else if (u === 'kadir' && p === 'patron123') {
                sessionStorage.setItem('diyetTakibimAuth', 'kadir_admin_onayli');
                if (window.showToast) window.showToast('God Mode Aktif! Hoş Geldin Patron.', 'success');
                
                if (gizliMenuBtn) {
                    gizliMenuBtn.classList.remove('hidden');
                    gizliMenuBtn.classList.add('flex');
                }
                
                loginScreen.style.opacity = '0';
                setTimeout(() => { loginScreen.style.display = 'none'; }, 500);
            } 
            else {
                if (window.showToast) window.showToast('Hatalı kullanıcı adı veya şifre!', 'error');
            }
        };
    }
}

window.cikisYap = function() {
    sessionStorage.removeItem('diyetTakibimAuth');
    window.location.reload(); 
};
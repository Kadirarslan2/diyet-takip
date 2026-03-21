// modules/auth.js

export function initAuth() {
    const loginScreen = document.getElementById('login-screen');
    const formLogin = document.getElementById('form-login');

    // 1. Tarayıcı hafızasında onay mühürü var mı kontrol et
    if (localStorage.getItem('diyetTakibimAuth') === 'dytbeyza_onayli') {
        // Varsa giriş ekranını tamamen gizle
        if (loginScreen) {
            loginScreen.style.display = 'none';
        }
    } else {
        // Yoksa giriş ekranını kilitli tut
        if (loginScreen) {
            loginScreen.style.display = 'flex';
            loginScreen.style.opacity = '1';
        }
    }

    // 2. Giriş formuna tıklandığında
    if (formLogin) {
        formLogin.onsubmit = (e) => {
            e.preventDefault();
            const u = document.getElementById('login-user').value;
            const p = document.getElementById('login-pass').value;

            // Şifre ve Kullanıcı Adı Kontrolü
            if (u === 'dytbeyza' && p === 'dytbeyzayılmaz00') {
                localStorage.setItem('diyetTakibimAuth', 'dytbeyza_onayli');
                
                if(window.showToast) window.showToast('Giriş Başarılı! Hoş Geldiniz Dyt. Beyza', 'success');
                
                // Ekranı yumuşakça kaybet
                loginScreen.style.opacity = '0';
                setTimeout(() => { 
                    loginScreen.style.display = 'none'; 
                }, 500);
            } else {
                if(window.showToast) window.showToast('Hatalı kullanıcı adı veya şifre!', 'error');
            }
        };
    }
}

// Menüye Çıkış Yap butonu eklersen bu çalışır
window.cikisYap = function() {
    localStorage.removeItem('diyetTakibimAuth');
    window.location.reload(); 
};
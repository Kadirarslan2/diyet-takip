// modules/auth.js

export function initAuth() {
    const loginScreen = document.getElementById('login-screen');
    const formLogin = document.getElementById('form-login');

    // MÜKEMMEL ÇÖZÜM: sessionStorage! 
    // F5 yapınca şifre sormaz, ama sekmeyi/tarayıcıyı kapatınca anında unutur ve kilitler.
    if (sessionStorage.getItem('diyetTakibimAuth') === 'dytbeyza_onayli') {
        if(loginScreen) loginScreen.style.display = 'none';
    } else {
        if(loginScreen) {
            loginScreen.style.display = 'flex';
            loginScreen.style.opacity = '1';
        }
    }

    if(formLogin) {
        formLogin.onsubmit = (e) => {
            e.preventDefault();
            const u = document.getElementById('login-user').value;
            const p = document.getElementById('login-pass').value;

            if (u === 'dytbeyza' && p === 'dytbeyzayılmaz00') {
                // Şifre doğruysa sekme kapanana kadar geçici hafızaya al
                sessionStorage.setItem('diyetTakibimAuth', 'dytbeyza_onayli');
                
                if(window.showToast) window.showToast('Giriş Başarılı! Hoş Geldiniz Dyt. Beyza', 'success');
                
                loginScreen.style.opacity = '0';
                setTimeout(() => { loginScreen.style.display = 'none'; }, 500);
            } else {
                if(window.showToast) window.showToast('Hatalı kullanıcı adı veya şifre!', 'error');
            }
        };
    }
}

// Çıkış Yap butonuna basılınca hafızayı sil ve login ekranına düş
window.cikisYap = function() {
    sessionStorage.removeItem('diyetTakibimAuth');
    window.location.reload(); 
};
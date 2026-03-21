// modules/auth.js

export function initAuth() {
    const loginScreen = document.getElementById('login-screen');
    const formLogin = document.getElementById('form-login');

    // KESİN ÇÖZÜM: localStorage yerine sessionStorage kullanıldı. 
    // Sekme veya tarayıcı kapanınca şifre unutulur, tekrar sorar!
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
                sessionStorage.setItem('diyetTakibimAuth', 'dytbeyza_onayli');
                window.showToast('Giriş Başarılı! Hoş Geldiniz Dyt. Beyza', 'success');
                loginScreen.style.opacity = '0';
                setTimeout(() => { loginScreen.style.display = 'none'; }, 500);
            } else {
                window.showToast('Hatalı kullanıcı adı veya şifre!', 'error');
            }
        };
    }
}

window.cikisYap = function() {
    sessionStorage.removeItem('diyetTakibimAuth');
    window.location.reload(); 
};
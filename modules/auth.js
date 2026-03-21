// modules/auth.js

export function initAuth() {
    const loginScreen = document.getElementById('login-screen');
    const formLogin = document.getElementById('form-login');

    // SİSTEM HER YENİLENDİĞİNDE VEYA AÇILDIĞINDA DİREKT KİLİTLİ BAŞLAR
    // Hiçbir hafıza kontrolü yok, kaçış yok!
    if(loginScreen) {
        loginScreen.style.display = 'flex';
        loginScreen.style.opacity = '1';
    }

    if(formLogin) {
        formLogin.onsubmit = (e) => {
            e.preventDefault();
            const u = document.getElementById('login-user').value;
            const p = document.getElementById('login-pass').value;

            if (u === 'dytbeyza' && p === 'dytbeyzayılmaz00') {
                // Şifre doğruysa sadece anlık olarak ekranı gizle, hiçbir yere kaydetme
                if(window.showToast) window.showToast('Giriş Başarılı! Hoş Geldiniz Dyt. Beyza', 'success');
                
                loginScreen.style.opacity = '0';
                setTimeout(() => { loginScreen.style.display = 'none'; }, 500);
            } else {
                if(window.showToast) window.showToast('Hatalı kullanıcı adı veya şifre!', 'error');
            }
        };
    }
}

// Çıkış Yap butonuna basılınca sayfayı yenilemek yeterli, zaten anında şifre soracak
window.cikisYap = function() {
    window.location.reload(); 
};
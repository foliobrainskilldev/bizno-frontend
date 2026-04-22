document.getElementById('share-url-btn')?.addEventListener('click', async () => {
    const urlDesk = document.getElementById('nav-public-store-desk');
    if (urlDesk && urlDesk.href && navigator.share) {
        try {
            await navigator.share({
                title: 'Minha Loja Bizno',
                text: 'Confira o nosso catálogo digital!',
                url: urlDesk.href
            });
        } catch (err) {}
    } else {
        showToast("A partilha direta não é suportada neste navegador. Use copiar.", "error");
    }
});
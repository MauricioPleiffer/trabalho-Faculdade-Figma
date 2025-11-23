// ============================================
// MÓDULO DE LOGIN E AUTENTICAÇÃO
// ============================================

let usuarioLogado = null;

// Abrir modal de login
function abrirLogin() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'block';
}

// Fechar modal de login
function fecharLogin() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
}

// Fazer logout do usuário
function fazerLogout() {
    usuarioLogado = null;
    localStorage.removeItem('usuarioLogado');
    sessionStorage.removeItem('usuarioLogado');
    atualizarBotao();
    fecharLogin();
    console.log('Logout realizado com sucesso');
}

// Atualizar aparência do botão de login/logout
function atualizarBotao() {
    var b = document.getElementById('loginBtn');
    if (!b) return;
    if (usuarioLogado) {
        b.textContent = 'Olá, ' + usuarioLogado.nome;
        b.style.backgroundColor = '#28a745';
    } else {
        b.textContent = 'Login';
        b.style.backgroundColor = '';
    }
}

// ============================================
// MÓDULO DE CARRINHO
// ============================================

let cart = [];
let addedItems = new Set();

function carregarCarrinho() {
    const raw = localStorage.getItem('laveja_cart');
    if (raw) {
        try {
            cart = JSON.parse(raw);
            addedItems.clear();
            cart.forEach(item => addedItems.add(item.id));
        } catch (e) {
            console.error('Erro ao carregar carrinho:', e);
            cart = [];
        }
    }
}

function salvarCarrinho() {
    localStorage.setItem('laveja_cart', JSON.stringify(cart));
}

function atualizarCarrinho() {
    const cartItemsEl = document.getElementById('cartItems');
    const cartEmptyEl = document.getElementById('cartEmpty');
    const cartTotalEl = document.getElementById('cartTotal');
    const cartActionsEl = document.getElementById('cartActions');

    if (!cart || cart.length === 0) {
        if (cartItemsEl) {
            cartItemsEl.innerHTML = '';
            cartItemsEl.style.display = 'none';
        }
        if (cartTotalEl) {
            cartTotalEl.innerHTML = '';
            cartTotalEl.style.display = 'none';
        }
        if (cartEmptyEl) cartEmptyEl.style.display = 'block';
        if (cartActionsEl) cartActionsEl.style.display = 'none';
        return;
    }

    // Se houver itens, renderiza normalmente
    if (cartEmptyEl) cartEmptyEl.style.display = 'none';
    if (cartItemsEl) {
        cartItemsEl.innerHTML = '';
        let total = 0;
        cart.forEach(item => {
            const li = document.createElement('li');
            li.className = 'cart-item';
            li.innerHTML = `
                <span class="name">${item.name || item.nome}</span>
                <span class="price">R$ ${(item.price || item.preco).toFixed(2).replace('.', ',')}</span>
            `;
            cartItemsEl.appendChild(li);
            total += (item.price || item.preco);
        });
        cartItemsEl.style.display = 'block';
        if (cartTotalEl) {
            cartTotalEl.innerHTML = `
                <span class="name"><b>TOTAL</b></span>
                <span class="price" style="color: #28a745; font-weight: bold;">R$ ${total.toFixed(2).replace('.', ',')}</span>
            `;
            cartTotalEl.style.display = 'block';
        }
    }
    if (cartActionsEl) cartActionsEl.style.display = 'flex';
}

// ---------------------------
// Limpar carrinho: tentar API e garantir limpeza local (substitua clear button handler)
// ---------------------------
document.addEventListener('DOMContentLoaded', function() {
    // ...existing initialization code above ...

    const clearBtn = document.getElementById('clearCart');
    if (clearBtn) {
        clearBtn.onclick = function() {
            if (!confirm('Deseja limpar o carrinho?')) return;

            // primeiro tenta limpar no servidor (se a rota existir)
            fetch('/api/limpar_carrinho', { method: 'POST' })
                .then(res => {
                    // mesmo que falhe em servidor, seguimos para limpar local
                    cart = [];
                    addedItems.clear();
                    salvarCarrinho();
                    atualizarCarrinho();
                    renderCart();

                    // restaurar botões (index/catalogo)
                    document.querySelectorAll('.botao, .solicitarBtn').forEach(btn => {
                        if (btn.textContent.includes('Adicionado')) {
                            btn.textContent = btn.classList.contains('botao-secundario') ? 'Contato' : 'Solicitar';
                            btn.style.backgroundColor = '';
                            btn.style.cursor = 'pointer';
                            btn.style.pointerEvents = 'auto';
                        }
                    });
                })
                .catch(() => {
                    // fallback: limpar local
                    cart = [];
                    addedItems.clear();
                    salvarCarrinho();
                    atualizarCarrinho();
                    renderCart();
                });
        };
    }

    // ...existing initialization code below ...
});

window.lavejaAddToCart = function(id, name, price) {
    if (addedItems.has(id)) {
        alert(`O item "${name}" já foi adicionado ao carrinho!`);
        return;
    }

    addedItems.add(id);
    const p = Number(price) || 0;
    cart.push({ id: id, name: name, price: p });

    salvarCarrinho();
    atualizarCarrinho();
    renderCart(); // atualiza UI do carrinho se estiver na página

    const buttons = document.querySelectorAll('.botao, .solicitarBtn');
    buttons.forEach(btn => {
        const onclick = btn.getAttribute('onclick') || '';
        const dataId = btn.dataset.itemId;
        if (onclick.includes(`lavejaAddToCart(${id},`) || dataId == String(id)) {
            btn.textContent = 'Adicionado ✓';
            btn.style.backgroundColor = '#4CAF50';
            btn.style.cursor = 'not-allowed';
            btn.style.pointerEvents = 'none';
        }
    });
};

// Remover item
function removeFromCart(id) {
    const idx = cart.findIndex(i => i.id == id);
    if (idx === -1) return;
    cart.splice(idx, 1);
    addedItems.delete(Number(id));
    salvarCarrinho();
    atualizarCarrinho();
    renderCart();

    // restaurar botão no catálogo/index
    const buttons = document.querySelectorAll('.botao, .solicitarBtn');
    buttons.forEach(btn => {
        const onclick = btn.getAttribute('onclick') || '';
        const dataId = btn.dataset.itemId;
        if (onclick.includes(`lavejaAddToCart(${id},`) || dataId == String(id)) {
            btn.textContent = btn.classList.contains('botao-secundario') ? 'Contato' : 'Solicitar';
            btn.style.backgroundColor = '';
            btn.style.cursor = 'pointer';
            btn.style.pointerEvents = 'auto';
        }
    });
}

// ============================================
// FUNCIONALIDADE ADICIONAL: PROTEGER BOTÕES DA INDEX
// ============================================
function attachRequireLoginBehavior() {
    // inclui o link do catálogo (é <a class="botao-login">) além dos demais botões
    const selectors = [
        '#btnSolicitar',
        '.botao-principal',
        '.botao-secundario',
        '.solicitarBtn',
        '.botao-whatsapp',
        'a.botao-login'
    ];

    const elems = document.querySelectorAll(selectors.join(','));
    elems.forEach(el => {
        if (el.__loginHandlerAttached) return;
        el.__loginHandlerAttached = true;

        el.addEventListener('click', function(e) {
            // não interferir com o botão de login (é <button id="loginBtn">)
            if (el.id === 'loginBtn') return;

            if (usuarioLogado) {
                // usuário logado: segue o link normalmente se houver href válido
                const href = el.getAttribute && el.getAttribute('href');
                if (href && href !== '#' && !href.startsWith('javascript:')) {
                    // permite comportamento padrão (seguir link)
                    return;
                }
                // caso não tenha href, redireciona para catálogo
                window.location.href = '/catalogo';
                return;
            }

            // usuário NÃO logado: abre modal de login e impede navegação
            e.preventDefault();
            abrirLogin();
        }, { passive: false });
    });
}

// ============================================
// INICIALIZAÇÃO DO DOCUMENTO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Página carregada');
    
    // Carregar usuários
    inicializarUsuarios();
    
    // Carregar estado do login
    if (!usuarioLogado && localStorage.getItem('usuarioLogado')) {
        usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    }
    if (!usuarioLogado && sessionStorage.getItem('usuarioLogado')) {
        usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    }
    
    atualizarBotao();
    carregarCarrinho();
    atualizarCarrinho();

    // Evento do botão de login/logout - usando delegação de evento
    document.addEventListener('click', function(e) {
        if (e.target.id === 'loginBtn' || e.target.closest('#loginBtn')) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Botão clicado. Usuário logado:', usuarioLogado);
            
            if (usuarioLogado) {
                // Se está logado, fazer logout
                if (confirm('Deseja sair?')) {
                    fazerLogout();
                }
            } else {
                // Se não está logado, abrir modal de login
                abrirLogin();
            }
        }
    });

    // Evento do botão de limpar carrinho
    document.addEventListener('click', function(e) {
        if (e.target.id === 'clearCart' || e.target.closest('#clearCart')) {
            e.preventDefault();
            if (confirm('Limpar carrinho?')) {
                limparCarrinho();
            }
        }
    });

    // Evento do botão de finalizar compra
    var checkoutBtn = document.getElementById('checkout');
    if (checkoutBtn) {
        checkoutBtn.onclick = finalizarCompra;
    }

    // depois de sincronizar com o servidor, atacha comportamento aos botões
    // (usar pequeno timeout para garantir que sincronizarComServidor já atualizou usuarioLogado)
    setTimeout(attachRequireLoginBehavior, 150);

    // depois de carregar carrinho e sincronizar:
    // garantir que cart já foi carregado por carregarCarrinho()
    renderCart();
});

console.log('Script carregado com sucesso!');

function limparCarrinho() {
    cart = [];
    addedItems.clear();
    salvarCarrinho();
    atualizarCarrinho();
}

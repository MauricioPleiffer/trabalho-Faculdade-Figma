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
    
    fetch('/logout', { method: 'GET' })
        .then(() => {
            atualizarBotao();
            window.location.href = '/';
        })
        .catch(err => {
            console.error('Erro ao fazer logout:', err);
            atualizarBotao();
            window.location.href = '/';
        });
}

// Atualizar aparência do botão de login/logout
function atualizarBotao() {
    const btn = document.getElementById('loginBtn');
    if (!btn) return;
    
    console.log('Atualizando botão. Usuário logado:', usuarioLogado);
    
    if (usuarioLogado) {
        btn.textContent = 'LOGOUT';
        btn.style.backgroundColor = '#dc3545';
        btn.style.color = 'white';
        btn.classList.add('logout-mode');
        btn.classList.remove('login-mode');
        btn.title = 'Clique para sair da sua conta';
    } else {
        btn.textContent = 'LOGIN';
        btn.style.backgroundColor = '';
        btn.style.color = '';
        btn.classList.add('login-mode');
        btn.classList.remove('logout-mode');
        btn.title = 'Clique para fazer login';
    }
}

// Sincronizar com o servidor
async function sincronizarComServidor() {
    try {
        const response = await fetch('/api/usuario-info');
        const data = await response.json();
        
        console.log('Sincronização com servidor:', data);
        
        if (data.logado && data.usuario) {
            usuarioLogado = data.usuario;
            sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
        } else {
            usuarioLogado = null;
            sessionStorage.removeItem('usuarioLogado');
            localStorage.removeItem('usuarioLogado');
        }
        
        atualizarBotao();
    } catch (err) {
        console.error('Erro ao sincronizar com servidor:', err);
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
    const cartCountEl = document.getElementById('cartCount');
    
    if (cartCountEl) cartCountEl.textContent = cart.length;
}

// ---------------------------
// Renderizar / gerenciar carrinho na UI (substitua a função existente)
// ---------------------------
function renderCart() {
    const cartItemsEl = document.getElementById('cartItems');
    const cartEmptyEl = document.getElementById('cartEmpty');
    const cartActions = document.getElementById('cartActions');
    const totalValueEl = document.getElementById('totalValue');
    const cartTotalWrapper = document.getElementById('cartTotal');
    const cartCountEl = document.getElementById('cartCount');

    if (cartCountEl) cartCountEl.textContent = cart.length;
    if (!cartItemsEl) return; // não está na página de carrinho

    // limpar lista
    cartItemsEl.innerHTML = '';

    if (!cart || cart.length === 0) {
        if (cartEmptyEl) cartEmptyEl.style.display = 'block';
        if (cartItemsEl) cartItemsEl.style.display = 'none';
        if (cartActions) cartActions.style.display = 'none';
        if (cartTotalWrapper) cartTotalWrapper.style.display = 'none';
        if (totalValueEl) totalValueEl.textContent = 'R$ 0,00';
        return;
    }

    if (cartEmptyEl) cartEmptyEl.style.display = 'none';
    cartItemsEl.style.display = 'block';
    if (cartActions) cartActions.style.display = 'flex';
    if (cartTotalWrapper) cartTotalWrapper.style.display = 'flex';

    // popular lista e calcular total
    let total = 0;
    cart.forEach(item => {
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.dataset.id = item.id;

        const nameDiv = document.createElement('div');
        nameDiv.className = 'cart-item-name';
        nameDiv.textContent = item.name;

        const priceDiv = document.createElement('div');
        priceDiv.className = 'cart-item-price';
        priceDiv.textContent = (Number(item.price) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const removeBtn = document.createElement('button');
        removeBtn.className = 'cart-item-remove';
        removeBtn.textContent = 'Remover';
        removeBtn.onclick = function() { removeFromCart(item.id); };

        li.appendChild(nameDiv);
        li.appendChild(priceDiv);
        li.appendChild(removeBtn);

        cartItemsEl.appendChild(li);

        total += Number(item.price) || 0;
    });

    if (totalValueEl) totalValueEl.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
    console.log('DOMContentLoaded disparado');
    
    carregarCarrinho();
    atualizarCarrinho();

    // Sincronizar com o servidor primeiro
    sincronizarComServidor();

    // ============================================
    // EVENT LISTENERS - LOGIN
    // ============================================

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.onclick = function() {
            console.log('Botão clicado. usuarioLogado:', usuarioLogado);
            
            if (usuarioLogado) {
                // Se está logado, fazer logout
                if (confirm('Deseja fazer logout?')) {
                    fazerLogout();
                }
            } else {
                // Se não está logado, abrir modal de login
                abrirLogin();
            }
        };
    }

    const closeLogin = document.querySelector('.close');
    if (closeLogin) closeLogin.onclick = fecharLogin;

    // Fechar modal clicando fora dele
    const modal = document.getElementById('loginModal');
    if (modal) {
        window.onclick = function(event) {
            if (event.target === modal) {
                fecharLogin();
            }
        };
    }

    const formLogin = document.getElementById('loginForm');
    if (formLogin) {
        formLogin.onsubmit = async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const senha = document.getElementById('senha').value;
            const lembrar = document.getElementById('lembrar') ? document.getElementById('lembrar').checked : false;

            if (!email || !senha) {
                alert('Por favor, preencha email e senha');
                return;
            }

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });

                const result = await response.json();
                
                if (result.ok) {
                    usuarioLogado = result.usuario;
                    
                    console.log('Login bem-sucedido:', usuarioLogado);
                    
                    // Salvar na sessão do navegador (sempre)
                    sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
                    
                    // Se marcou "Lembrar", salvar também no localStorage
                    if (lembrar) {
                        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
                    }
                    
                    alert(result.msg);
                    fecharLogin();
                    atualizarBotao();
                    formLogin.reset();
                    
                    // Recarregar página após 500ms
                    setTimeout(() => window.location.reload(), 500);
                } else {
                    alert(result.msg || 'Erro ao fazer login');
                }
            } catch (err) {
                alert('Erro de conexão: ' + err);
            }
        };
    }

    // ============================================
    // EVENT LISTENERS - CADASTRO E REDES SOCIAIS
    // ============================================

    const cadastroLink = document.getElementById('cadastroLink');
    if (cadastroLink) {
        cadastroLink.onclick = function(e) {
            e.preventDefault();
            window.location.href = '/cadastro';
        };
    }

    const socialGoogle = document.querySelector('.botao-social.google');
    if (socialGoogle) {
        socialGoogle.onclick = function(e) {
            e.preventDefault();
            window.location.href = '/auth/google/login';
        };
    }

    const socialFb = document.querySelector('.botao-social.facebook');
    if (socialFb) {
        socialFb.onclick = function(e) {
            e.preventDefault();
            alert('Login com Facebook não implementado aqui.');
        };
    }

    // ============================================
    // EVENT LISTENERS - CARRINHO
    // ============================================

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

    const checkoutBtn = document.getElementById('checkout');
    if (checkoutBtn) {
        checkoutBtn.onclick = function() {
            if (cart.length === 0) {
                alert('Carrinho vazio!');
                return;
            }

            if (!usuarioLogado) {
                alert('Faça login antes de finalizar a compra!');
                abrirLogin();
                return;
            }

            fetch('/finalizar_compra', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cart: cart })
            })
            .then(response => response.json())
            .then(data => {
                if (data.sucesso) {
                    alert(data.mensagem);
                    cart = [];
                    addedItems.clear();
                    salvarCarrinho();
                    atualizarCarrinho();
                } else {
                    alert('Erro ao finalizar compra: ' + (data.mensagem || 'Erro desconhecido'));
                }
            })
            .catch(err => alert('Erro de conexão: ' + err));
        };
    }

    // depois de sincronizar com o servidor, atacha comportamento aos botões
    // (usar pequeno timeout para garantir que sincronizarComServidor já atualizou usuarioLogado)
    setTimeout(attachRequireLoginBehavior, 150);

    // depois de carregar carrinho e sincronizar:
    // garantir que cart já foi carregado por carregarCarrinho()
    renderCart();
});

console.log('Script carregado com sucesso!');

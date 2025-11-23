// ============================================
// MÓDULO DE LOGIN
// ============================================

let usuarios = [];
let usuarioLogado = null;

function inicializarUsuarios() {
    if (localStorage.getItem('usuarios')) {
        usuarios = JSON.parse(localStorage.getItem('usuarios'));
    }
    if (localStorage.getItem('usuarioLogado')) {
        usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    }
    if (usuarios.length === 0) {
        usuarios.push({ id: 1, nome: 'João Silva', email: 'joao@teste.com', senha: '123456' });
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
    }
}

function abrirLogin() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'block';
}

function fecharLogin() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
}

function fazerLogin(email, senha, lembrar) {
    const user = usuarios.find(u => u.email === email && u.senha === senha);
    if (!user) return false;

    usuarioLogado = user;
    const storage = lembrar ? localStorage : sessionStorage;
    storage.setItem('usuarioLogado', JSON.stringify(user));
    return true;
}

function fazerLogout() {
    usuarioLogado = null;
    localStorage.removeItem('usuarioLogado');
    sessionStorage.removeItem('usuarioLogado');
    atualizarBotao();
}

function atualizarBotao() {
    const btn = document.getElementById('loginBtn');
    if (!btn) return;

    if (usuarioLogado) {
        btn.textContent = 'Olá, ' + usuarioLogado.nome;
        btn.style.backgroundColor = '#28a745';
    } else {
        btn.textContent = 'Login';
        btn.style.backgroundColor = '';
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
        } catch {
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
    const cartActionsEl = document.getElementById('cartActions');
    const cartCountEl = document.getElementById('cartCount');

    if (cartCountEl) cartCountEl.textContent = cart.length;

    if (cart.length === 0) {
        if (cartItemsEl) cartItemsEl.style.display = 'none';
        if (cartActionsEl) cartActionsEl.style.display = 'none';
        if (cartEmptyEl) cartEmptyEl.style.display = 'block';
        return;
    }

    if (cartEmptyEl) cartEmptyEl.style.display = 'none';

    if (cartItemsEl) {
        cartItemsEl.innerHTML = '';
        let total = 0;

        cart.forEach(item => {
            const li = document.createElement('li');
            li.className = 'cart-item';

            li.innerHTML = `
                <span class="name">${item.name}</span>
                <span class="price">R$ ${(item.price).toFixed(2).replace('.', ',')}</span>
            `;

            cartItemsEl.appendChild(li);
            total += item.price;
        });

        cartItemsEl.style.display = 'block';
    }

    if (cartActionsEl) cartActionsEl.style.display = 'flex';
}

window.lavejaAddToCart = function(id, name, price) {
    if (addedItems.has(id)) {
        alert(`O item "${name}" já foi adicionado.`);
        return;
    }

    addedItems.add(id);
    cart.push({ id, name, price: Number(price) || 0 });

    salvarCarrinho();
    atualizarCarrinho();

    const buttons = document.querySelectorAll('.botao');
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick')?.includes(`lavejaAddToCart(${id},`)) {
            btn.textContent = 'Adicionado ✓';
            btn.style.backgroundColor = '#4CAF50';
            btn.style.cursor = 'not-allowed';
            btn.style.pointerEvents = 'none';
        }
    });
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    inicializarUsuarios();
    carregarCarrinho();
    atualizarCarrinho();

    // Restaurar usuário
    if (!usuarioLogado && sessionStorage.getItem('usuarioLogado')) {
        usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    }
    atualizarBotao();

    // LOGIN
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.onclick = function() {
            usuarioLogado
                ? (confirm('Deseja sair?') && fazerLogout())
                : abrirLogin();
        };
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const senha = document.getElementById('senha').value;
            const lembrar = document.getElementById('lembrar')?.checked;

            if (fazerLogin(email, senha, lembrar)) {
                fecharLogin();
                atualizarBotao();
                loginForm.reset();
            } else {
                alert('Email ou senha errados.');
            }
        };
    }

    // CARRINHO
    const clearBtn = document.getElementById('clearCart');
    if (clearBtn) {
        clearBtn.onclick = function() {
            if (!confirm('Limpar carrinho?')) return;

            cart = [];
            addedItems.clear();
            salvarCarrinho();
            atualizarCarrinho();

            fetch('/auth/limpar_carrinho');

            document.querySelectorAll('.botao').forEach(btn => {
                if (btn.textContent.includes('Adicionado')) {
                    btn.textContent = 'Solicitar';
                    btn.style.backgroundColor = '';
                    btn.style.cursor = 'pointer';
                    btn.style.pointerEvents = 'auto';
                }
            });
        };
    }

    const checkoutBtn = document.getElementById('checkout');
    if (checkoutBtn) {
        checkoutBtn.onclick = function() {
            if (cart.length === 0) return alert('Carrinho vazio!');

            fetch('/finalizar_compra', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cart })
            })
            .then(res => res.json())
            .then(data => {
                if (!data.sucesso) {
                    alert("Erro: " + data.mensagem);
                    return;
                }

                alert(data.mensagem);
                cart = [];
                addedItems.clear();
                salvarCarrinho();
                atualizarCarrinho();

                document.querySelectorAll('.botao').forEach(btn => {
                    if (btn.textContent.includes('Adicionado')) {
                        btn.textContent = 'Solicitar';
                        btn.style.backgroundColor = '';
                        btn.style.cursor = 'pointer';
                        btn.style.pointerEvents = 'auto';
                    }
                });
            });
        };
    }
});

console.log("Script carregado e otimizado!");
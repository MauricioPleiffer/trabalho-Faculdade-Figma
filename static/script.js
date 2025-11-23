// ============================================
// MÓDULO DE LOGIN
// ============================================

let usuarios = [];
let usuarioLogado = null;

// Inicializar dados de usuários no localStorage
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

// Fazer login do usuário
function fazerLogin(email, senha, lembrar) {
    for (let i = 0; i < usuarios.length; i++) {
        if (usuarios[i].email === email && usuarios[i].senha === senha) {
            usuarioLogado = usuarios[i];
            if (lembrar) {
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            } else {
                sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            }
            return true;
        }
    }
    return false;
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

// Atualizar aparência do botão de login
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

// Carregar carrinho do localStorage
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
    } else {
        cart = [];
    }
    console.log('Carrinho carregado:', cart);
}

// Salvar carrinho no localStorage
function salvarCarrinho() {
    localStorage.setItem('laveja_cart', JSON.stringify(cart));
    console.log('Carrinho salvo:', cart);
}

// Atualizar interface do carrinho
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

// Função global para adicionar ao carrinho
window.lavejaAddToCart = function(id, name, price) {
    console.log(`=== ADICIONANDO AO CARRINHO ===`);
    console.log(`ID: ${id}, Nome: ${name}, Preço: ${price}`);
    
    if (addedItems.has(id)) {
        alert(`O item "${name}" já foi adicionado ao carrinho! Cada item pode ser adicionado apenas uma vez.`);
        return;
    }

    addedItems.add(id);
    const p = Number(price) || 0;
    cart.push({ id: id, name: name, price: p });
    
    console.log('Carrinho após adição:', cart);
    
    salvarCarrinho();
    atualizarCarrinho();

    // Feedback visual no botão
    const buttons = document.querySelectorAll('.botao');
    buttons.forEach(btn => {
        const onclick = btn.getAttribute('onclick');
        if (onclick && onclick.includes(`lavejaAddToCart(${id},`)) {
            btn.textContent = 'Adicionado ✓';
            btn.style.backgroundColor = '#4CAF50';
            btn.style.cursor = 'not-allowed';
            btn.style.pointerEvents = 'none';
        }
    });

    console.log(`Item "${name}" adicionado com sucesso!`);
};

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
});

console.log('Script carregado com sucesso!');

function limparCarrinho() {
    cart = [];
    addedItems.clear();
    salvarCarrinho();
    atualizarCarrinho();
}

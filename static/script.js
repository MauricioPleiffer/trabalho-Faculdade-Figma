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
}

// Atualizar aparência do botão de login
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
    console.log('Atualizando carrinho... Itens:', cart.length);
    
    const cartCountEl = document.getElementById('cartCount');
    const cartItemsEl = document.getElementById('cartItems');
    const cartEmptyEl = document.getElementById('cartEmpty');
    const cartActionsEl = document.getElementById('cartActions');
    
    if (cartCountEl) {
        cartCountEl.textContent = cart.length;
        console.log('Badge atualizado para:', cart.length);
    }
    
    if (cart.length === 0) {
        if (cartItemsEl) cartItemsEl.style.display = 'none';
        if (cartActionsEl) cartActionsEl.style.display = 'none';
        if (cartEmptyEl) {
            cartEmptyEl.style.display = 'block';
            cartEmptyEl.textContent = 'Seu carrinho está vazio.';
        }
    } else {
        if (cartEmptyEl) cartEmptyEl.style.display = 'none';
        
        if (cartItemsEl) {
            cartItemsEl.innerHTML = '';
            let total = 0;
            
            cart.forEach(function(item) {
                const li = document.createElement('li');
                li.className = 'cart-item';
                
                const left = document.createElement('div');
                left.className = 'name';
                left.textContent = item.name;
                
                const right = document.createElement('div');
                right.className = 'price';
                const priceNum = Number(item.price) || 0;
                right.textContent = 'R$ ' + priceNum.toFixed(2).replace('.', ',');
                
                li.appendChild(left);
                li.appendChild(right);
                cartItemsEl.appendChild(li);
                
                total += priceNum;
            });
            
            // Adicionar linha de total
            const totalLi = document.createElement('li');
            totalLi.className = 'cart-item-total';
            totalLi.style.borderTop = '2px solid #ddd';
            totalLi.style.paddingTop = '10px';
            totalLi.style.marginTop = '10px';
            totalLi.style.fontWeight = 'bold';
            
            const totalLeft = document.createElement('div');
            totalLeft.className = 'name';
            totalLeft.textContent = 'TOTAL';
            
            const totalRight = document.createElement('div');
            totalRight.className = 'price';
            totalRight.style.color = '#28a745';
            totalRight.style.fontSize = '1.2em';
            totalRight.textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
            
            totalLi.appendChild(totalLeft);
            totalLi.appendChild(totalRight);
            cartItemsEl.appendChild(totalLi);
            
            cartItemsEl.style.display = 'block';
            console.log('Carrinho renderizado. Total:', total);
        }
        if (cartActionsEl) cartActionsEl.style.display = 'flex';
    }
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
    console.log('=== DOCUMENTO CARREGADO ===');
    
    // Inicializar sistemas
    inicializarUsuarios();
    carregarCarrinho();
    atualizarCarrinho();

    // Restaurar usuário logado se estava em sessionStorage
    if (!usuarioLogado && sessionStorage.getItem('usuarioLogado')) {
        usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    }
    atualizarBotao();

    // ============================================
    // EVENT LISTENERS - LOGIN
    // ============================================

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.onclick = function() {
            if (usuarioLogado) {
                if (confirm('Deseja sair?')) {
                    fazerLogout();
                }
            } else {
                abrirLogin();
            }
        };
    }

    const closeLogin = document.querySelector('.close');
    if (closeLogin) {
        closeLogin.onclick = fecharLogin;
    }

    const formLogin = document.getElementById('loginForm');
    if (formLogin) {
        formLogin.onsubmit = function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const senha = document.getElementById('senha').value;
            const lembrar = document.getElementById('lembrar') && document.getElementById('lembrar').checked;

            if (fazerLogin(email, senha, lembrar)) {
                alert('Login ok!');
                fecharLogin();
                atualizarBotao();
                formLogin.reset();
            } else {
                alert('Email ou senha errados.');
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
            alert('Cadastro temporariamente desativado. Entre em contato se precisar.');
        };
    }

    const socialGoogle = document.querySelector('.botao-social.google');
    if (socialGoogle) {
        socialGoogle.onclick = function() {
            window.location.href = '/google_login';
        };
    }

    const socialFb = document.querySelector('.botao-social.facebook');
    if (socialFb) {
        socialFb.onclick = function() {
            alert('Login com Facebook não implementado aqui.');
        };
    }

    // ============================================
    // EVENT LISTENERS - CARRINHO
    // ============================================

    const clearBtn = document.getElementById('clearCart');
    if (clearBtn) {
        clearBtn.onclick = function() {
            if (confirm('Limpar carrinho?')) {
                cart = [];
                addedItems.clear();
                salvarCarrinho();
                atualizarCarrinho();
                
                // Restaurar botões para "Solicitar"
                document.querySelectorAll('.botao').forEach(btn => {
                    if (btn.textContent.includes('Adicionado')) {
                        btn.textContent = 'Solicitar';
                        btn.style.backgroundColor = '';
                        btn.style.cursor = 'pointer';
                        btn.style.pointerEvents = 'auto';
                    }
                });
            }
        };
    }

    const checkoutBtn = document.getElementById('checkout');
    if (checkoutBtn) {
        checkoutBtn.onclick = function() {
            if (cart.length === 0) {
                alert('Carrinho vazio!');
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
                    
                    // Restaurar botões para "Solicitar"
                    document.querySelectorAll('.botao').forEach(btn => {
                        if (btn.textContent.includes('Adicionado')) {
                            btn.textContent = 'Solicitar';
                            btn.style.backgroundColor = '';
                            btn.style.cursor = 'pointer';
                            btn.style.pointerEvents = 'auto';
                        }
                    });
                } else {
                    alert('Erro ao finalizar compra: ' + (data.mensagem || 'Erro desconhecido'));
                }
            })
            .catch(err => alert('Erro de conexão: ' + err));
        };
    }
});

console.log('Script carregado com sucesso!');

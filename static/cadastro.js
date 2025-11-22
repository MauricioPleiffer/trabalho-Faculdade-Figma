<<<<<<< HEAD
// Variáveis/globais iniciais (evita erros se não definidas em outro script)
var usuarioLogado = null;
var usuarios = []; // pode ser preenchido pelo servidor se necessário

// Funções auxiliares mínimas usadas no arquivo (se você tiver implementações melhores, mantenha-as)
function abrirLogin() {
    var modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'block';
}
function fecharLogin() {
    var modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
}
function atualizarBotao() {
    var loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;
    if (usuarioLogado) {
        loginBtn.textContent = 'SAIR';
    } else {
        loginBtn.textContent = 'LOGIN';
    }
}
function fazerLogout() {
    usuarioLogado = null;
    localStorage.removeItem('usuarioLogado');
    sessionStorage.removeItem('usuarioLogado');
    atualizarBotao();
    fecharLogin();
}

// Função de autenticação local (mantive a lógica existente)
function fazerLogin(email, senha, lembrar){
    for ( var i=0;i<usuarios.length;i++){
        if(usuarios[i].email===email && usuarios[i].senha===senha){
            usuarioLogado = usuarios[i];
            if(lembrar){
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            } else {
                sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            }
            return true;
        }
    }
    return false;
}

window.addEventListener('load', function () {
    if (!usuarioLogado && sessionStorage.getItem('usuarioLogado')) {
        usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    }
    if (!usuarioLogado && localStorage.getItem('usuarioLogado')) {
        usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    }
    atualizarBotao();

    var loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.onclick = function () {
        if (usuarioLogado) {
            if (confirm('Deseja sair?')) {
                fazerLogout();
            }
        } else {
            abrirLogin();
        }
    };

    var closeLogin = document.querySelector('.close'); if (closeLogin) closeLogin.onclick = fecharLogin;

    var formLogin = document.getElementById('loginForm');
    if (formLogin) formLogin.onsubmit = function (e) {
        e.preventDefault();
        var email = document.getElementById('email').value.trim();
        var senha = document.getElementById('senha').value;
        var lembrar = document.getElementById('lembrar') && document.getElementById('lembrar').checked;
        if (fazerLogin(email, senha, lembrar)) {
            alert('Login ok!');
            fecharLogin();
            atualizarBotao();
            formLogin.reset();
        } else {
            alert('Email ou senha errados.');
        }
    };

    var cadastroLink = document.getElementById('cadastroLink');
    if (cadastroLink) {
        cadastroLink.onclick = function (e) {
            e.preventDefault();
            window.location.href = '/cadastro';
        };
    }

    var socialGoogle = document.querySelector('.botao-social.google');
    if (socialGoogle) {
        socialGoogle.onclick = function () {
            // Endpoint do Flask-Dance que inicia o OAuth
            window.location.href = '/auth/google/login';
        };
    }
    var socialFb = document.querySelector('.botao-social.facebook'); if (socialFb) socialFb.onclick = function () { alert('Login com Facebook não implementado aqui.'); };

    var servicosLink = document.querySelector('a[href="#servicos"]'); if (servicosLink) servicosLink.onclick = function (e) { if (!usuarioLogado) { e.preventDefault(); abrirLogin(); } };

    var serviceAnchors = document.querySelectorAll('a.botao-principal, a.botao, a.botao-secundario');
    for (var i = 0; i < serviceAnchors.length; i++) { (function (el) { if (el && el.tagName && el.tagName.toLowerCase() === 'a') { el.onclick = function (e) { if (!usuarioLogado) { e.preventDefault(); abrirLogin(); } }; } })(serviceAnchors[i]); }
});

// --- Carrinho simples (persistido em localStorage) ---
(function () {
    var cart = [];
    var cartCountEl = document.getElementById('cartCount');
    var cartItemsEl = document.getElementById('cartItems');
    var cartEmptyEl = document.getElementById('cartEmpty');
    var cartActionsEl = document.getElementById('cartActions');
    var clearBtn = document.getElementById('clearCart');
    var checkoutBtn = document.getElementById('checkout');

    function save() { localStorage.setItem('laveja_cart', JSON.stringify(cart)); }
    function load() { var raw = localStorage.getItem('laveja_cart'); if (raw) cart = JSON.parse(raw); else cart = []; }

    function updateUI() {
        if (!cartCountEl) return;
        cartCountEl.textContent = cart.length;
        if (cart.length === 0) {
            if (cartItemsEl) cartItemsEl.style.display = 'none';
            if (cartActionsEl) cartActionsEl.style.display = 'none';
            if (cartEmptyEl) { cartEmptyEl.style.display = 'block'; cartEmptyEl.textContent = 'Seu carrinho está vazio.'; }
        } else {
            if (cartItemsEl) {
                cartItemsEl.innerHTML = '';
                cart.forEach(function (it, idx) {
                    var li = document.createElement('li');
                    li.className = 'cart-item';
                    var left = document.createElement('div'); left.className = 'name'; left.textContent = it.name;
                    var right = document.createElement('div'); right.className = 'price';
                    var priceNum = Number(it.price) || 0;
                    right.textContent = 'R$ ' + priceNum.toFixed(2).replace('.', ',');
                    li.appendChild(left); li.appendChild(right); cartItemsEl.appendChild(li);
                });
                cartItemsEl.style.display = 'block';
            }
            if (cartActionsEl) cartActionsEl.style.display = 'flex';
            if (cartEmptyEl) cartEmptyEl.style.display = 'none';
        }
    }

    function addItem(item) { cart.push(item); save(); updateUI(); }
    function clearCart() { cart = []; save(); updateUI(); }

    function scapeHtml(str) {
        return String(str).replace(/[&<>"'`=\/]/g, function (s) {
            return ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": "&#39;",
                "/": "&#47;",
                "=": "&#61;",
                "`": "&#96;"
            }[s]);
        });
    }

    function adicionar(servico_id) {
        fetch('/adicionar_ao_carrinho', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'servico_id=' + encodeURIComponent(servico_id)
        })
            .then(response => response.json())
            .then(data => {
                if (data.sucesso) {
                    const carrinhoDiv = document.getElementById('carrinho');
                    if (carrinhoDiv) {
                        carrinhoDiv.innerHTML = `
                        <p>${data.nome} - R$ ${Number(data.preco).toFixed(2)}</p>
                        <p><strong>Total: R$ ${Number(data.total).toFixed(2)}</strong></p>
                    `;
                    }
                } else {
                    alert('Erro: ' + (data.mensagem || 'Não foi possível adicionar o serviço'));
                }
            })
            .catch(err => {
                console.error('Erro ao adicionar:', err);
                alert('Erro de conexão ao adicionar ao carrinho.');
            });
    }

    window.lavejaAddToCart = function (id, name, price) {
        var p = Number(price) || 0;
        cart = [{ id: id, name: name, price: p }];
        save();
        updateUI();
        alert('Serviço solicitado: ' + name + ' — R$ ' + p.toFixed(2).replace('.', ','));
    };

    if (clearBtn) clearBtn.onclick = function () { if (confirm('Limpar carrinho?')) clearCart(); };
    if (checkoutBtn) checkoutBtn.onclick = function () {
        if (cart.length === 0) { alert('Carrinho vazio!'); return; }
        fetch('/finalizar_compra', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart: cart })
        })
            .then(response => response.json())
            .then(data => {
                if (data.sucesso) {
                    alert(data.mensagem);
                    clearCart();
                } else {
                    alert('Erro ao finalizar compra: ' + (data.mensagem || 'Erro desconhecido'));
                }
            })
            .catch(err => alert('Erro de conexão: ' + err));
    };

    load(); updateUI();
})();

document.addEventListener('DOMContentLoaded', function () {
=======
document.addEventListener('DOMContentLoaded', function () {

>>>>>>> aeb327df08837789047bc6b8d8419220165be5a1
    const form = document.getElementById('form-cadastro');
    const senha = document.getElementById('senha');
    const confirmar = document.getElementById('confirmar_senha');
    const mensagem = document.getElementById('mensagem-erro');
    const nome = document.getElementById('nome');
    const sobrenome = document.getElementById('sobrenome');
    const cpf = document.getElementById('cpf');
    const telefone = document.getElementById('telefone');
    const email = document.getElementById('email');

<<<<<<< HEAD
=======
    
>>>>>>> aeb327df08837789047bc6b8d8419220165be5a1
    function mascaraCPF() {
        let valor = this.value.replace(/\D/g, '');
        valor = valor.substring(0, 11);
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
        valor = valor.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
        this.value = valor;
    }

    function mascaraTelefone() {
        let valor = this.value.replace(/\D/g, '');
        valor = valor.substring(0, 11);
        valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');

        if (valor.length > 10) {
            valor = valor.replace(/(\(\d{2}\) )(\d{5})(\d{4})/, '$1$2-$3');
        } else {
            valor = valor.replace(/(\(\d{2}\) )(\d{4})(\d{4})/, '$1$2-$3');
        }
        this.value = valor;
    }

    function validarSenhas() {
        if (senha.value && confirmar.value && senha.value !== confirmar.value) {
            mensagem.textContent = 'As senhas não coincidem!';
            mensagem.style.color = 'red';
            return false;
        }
<<<<<<< HEAD
        if (senha.value === confirmar.value && senha.value) {
=======
        if (senha.value === confirmar.value) {
>>>>>>> aeb327df08837789047bc6b8d8419220165be5a1
            mensagem.textContent = '';
        }
        return true;
    }

<<<<<<< HEAD
=======
   
    async function hashSHA256(text) {
        if (!text) return '';
        const enc = new TextEncoder();
        const data = enc.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

   
>>>>>>> aeb327df08837789047bc6b8d8419220165be5a1
    cpf.addEventListener('input', mascaraCPF);
    telefone.addEventListener('input', mascaraTelefone);
    senha.addEventListener('input', validarSenhas);
    confirmar.addEventListener('input', validarSenhas);

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        mensagem.textContent = '';
        mensagem.style.color = 'red';

<<<<<<< HEAD
        const emailValue = email.value.toLowerCase();
        const typosComuns = [
            '@gmail.co', '@gmail.cm',
            '@hotmail.co', '@hotmail.cm',
            '@outlook.co', '@outlook.cm',
            '@yahoo.co', '@yahoo.cm'
        ];

        let emailComErro = false;
        for (const erro of typosComuns) {
            if (emailValue.endsWith(erro)) {
                emailComErro = true;
                break;
            }
        }

        if (emailComErro) {
            mensagem.textContent = 'Seu e-mail parece ter um erro de digitação (ex: ".co" em vez de ".com"). Por favor, corrija.';
            email.focus();
            return;
        }

        if (!validarSenhas()) {
            senha.focus();
            return;
        }

        const cpfDigits = cpf.value.replace(/\D/g, '');
        if (cpfDigits.length !== 11) {
            mensagem.textContent = 'CPF incompleto. Deve conter 11 dígitos.';
            cpf.focus();
            return;
        }

        const telDigits = telefone.value.replace(/\D/g, '');
        if (telDigits.length < 10) {
            mensagem.textContent = 'Telefone incompleto. Deve conter 10 ou 11 dígitos.';
            telefone.focus();
            return;
        }

        // Enviar para o servidor
        try {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: nome.value.trim(),
                    sobrenome: sobrenome.value.trim(),
                    email: emailValue,
                    cpf: cpfDigits,
                    telefone: telDigits,
                    senha: senha.value
                })
            });

            const result = await response.json();

            if (result.ok) {
                mensagem.textContent = 'Cadastro realizado com sucesso!';
                mensagem.style.color = 'green';
                form.reset();

                setTimeout(() => {
                    window.location.href = "/";
                }, 1500);
            } else {
                mensagem.textContent = result.msg || 'Erro ao cadastrar';
                mensagem.style.color = 'red';
            }
        } catch (err) {
            mensagem.textContent = 'Erro de conexão: ' + err;
            mensagem.style.color = 'red';
        }
    });
});
=======
    // Validações de email
    const emailValue = email.value.toLowerCase();
    const typosComuns = [
        '@gmail.co', '@gmail.cm',
        '@hotmail.co', '@hotmail.cm',
        '@outlook.co', '@outlook.cm',
        '@yahoo.co', '@yahoo.cm'
    ];

    let emailComErro = false;
    for (const erro of typosComuns) {
        if (emailValue.endsWith(erro)) {
            emailComErro = true;
            break;
        }
    }

    if (emailComErro) {
        mensagem.textContent = 'Seu e-mail parece ter um erro de digitação (ex: ".co" em vez de ".com"). Por favor, corrija.';
        email.focus(); 
        return;
    }

    if (!validarSenhas()) {
        senha.focus();
        return;
    }

    const cpfDigits = cpf.value.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
        mensagem.textContent = 'CPF incompleto. Deve conter 11 dígitos.';
        cpf.focus();
        return;
    }

    const telDigits = telefone.value.replace(/\D/g, '');
    if (telDigits.length < 10) {
        mensagem.textContent = 'Telefone incompleto. Deve conter 10 ou 11 dígitos.';
        telefone.focus();
        return;
    }

    // ENVIAR PARA O BACKEND FLASK
    try {
        const resp = await fetch('/auth/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: emailValue,
                senha: senha.value
            })
        });

        const data = await resp.json();
        
        if (data.ok) {
            form.reset();
            mensagem.textContent = 'Cadastro realizado com sucesso! Redirecionando...';
            mensagem.style.color = 'green';
            
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            mensagem.textContent = data.msg || 'Erro ao cadastrar.';
            mensagem.style.color = 'red';
        }
    } catch (err) {
        console.error(err);
        mensagem.textContent = 'Erro de conexão ao cadastrar.';
        mensagem.style.color = 'red';
    }
    });
});
>>>>>>> aeb327df08837789047bc6b8d8419220165be5a1

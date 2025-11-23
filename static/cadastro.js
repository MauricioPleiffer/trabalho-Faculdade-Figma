document.addEventListener('DOMContentLoaded', function () {

    const form = document.getElementById('form-cadastro');
    const senha = document.getElementById('senha');
    const confirmar = document.getElementById('confirmar_senha');
    const mensagem = document.getElementById('mensagem-erro');
    const nome = document.getElementById('nome');
    const sobrenome = document.getElementById('sobrenome');
    const cpf = document.getElementById('cpf');
    const telefone = document.getElementById('telefone');
    const email = document.getElementById('email');

    
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
        if (senha.value === confirmar.value) {
            mensagem.textContent = '';
        }
        return true;
    }

   
    async function hashSHA256(text) {
        if (!text) return '';
        const enc = new TextEncoder();
        const data = enc.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

   
    cpf.addEventListener('input', mascaraCPF);
    telefone.addEventListener('input', mascaraTelefone);
    senha.addEventListener('input', validarSenhas);
    confirmar.addEventListener('input', validarSenhas);

    form.addEventListener('submit', async function (e) {
        
        e.preventDefault(); 

        mensagem.textContent = '';
        mensagem.style.color = 'red';

      
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
        
       
        const cadastros = JSON.parse(localStorage.getItem('cadastros') || '[]');
        if (cadastros.some(c => c.email === emailValue)) {
            mensagem.textContent = 'Este e-mail já foi cadastrado.';
            email.focus();
            return;
        }

        
        const senhaHash = await hashSHA256(senha.value);

        
        cadastros.push({ 
            nome: nome.value.trim(),
            sobrenome: sobrenome.value.trim(),
            email: emailValue,
            cpf: cpfDigits, 
            telefone: telDigits,
            senhaHash: senhaHash, 
            criadoEm: new Date().toISOString() 
        });
        localStorage.setItem('cadastros', JSON.stringify(cadastros));

        
     form.reset();
mensagem.textContent = 'Cadastro realizado com sucesso!';
mensagem.style.color = 'green';

setTimeout(() => {
    window.location.href = "/";   // <- AQUI acontece o redirecionamento
}, 1500);
    });

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.onclick = async function () {
            const username = prompt("Digite seu nome de usuário:");
            const senha = prompt("Digite sua senha:");

            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, senha })
            });

            const result = await response.json();
            if (result.ok) {
                alert(result.msg);
                window.location.reload(); // Recarrega a página para refletir o login
            } else {
                alert(result.msg);
            }
        };
    }
});
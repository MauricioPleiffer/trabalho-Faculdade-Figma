from flask import Blueprint, request, jsonify, render_template, session, redirect, url_for
import json, hashlib, os

# Criar o Blueprint para cadastro
cadastro_bp = Blueprint('cadastro', __name__, template_folder='../templates', url_prefix='/auth')

USERS_FILE = 'usuarios.json'

# -----------------------------
# Funções auxiliares
# -----------------------------
def carregar_usuarios():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return {}
    return {}

def salvar_usuarios(usuarios):
    with open(USERS_FILE, 'w') as f:
        json.dump(usuarios, f, indent=4)

def hash_senha(senha):
    return hashlib.sha256(senha.encode()).hexdigest()

# -----------------------------
# Rotas do Blueprint
# -----------------------------

@cadastro_bp.route('/cadastro', methods=['POST'])
def cadastro():
    data = request.get_json()
    username = data.get('username')
    senha = data.get('senha')

    if not username or not senha:
        return jsonify({'ok': False, 'msg': 'Preencha todos os campos.'})

    usuarios = carregar_usuarios()

    if username in usuarios:
        return jsonify({'ok': False, 'msg': 'Usuário já existe.'})

    usuarios[username] = hash_senha(senha)
    salvar_usuarios(usuarios)

    # Login automático após cadastro
    session['usuario'] = {
        "nome": username,
        "email": username,
        "tipo_login": "local"
    }

    return jsonify({'ok': True, 'msg': 'Cadastro realizado com sucesso!'})

@cadastro_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    senha = data.get('senha')

    usuarios = carregar_usuarios()

    if username not in usuarios:
        return jsonify({'ok': False, 'msg': 'Usuário não encontrado.'})

    if usuarios[username] == hash_senha(senha):
        session['usuario'] = {
            "nome": username,
            "email": username,
            "tipo_login": "local"
        }
        return jsonify({'ok': True, 'msg': 'Login bem-sucedido!'})
    else:
        return jsonify({'ok': False, 'msg': 'Senha incorreta.'})

@cadastro_bp.route('/usuario')
def usuario_logado():
    if 'usuario' in session:
        return jsonify({'ok': True, 'usuario': session['usuario']})
    return jsonify({'ok': False, 'usuario': None})

@cadastro_bp.route('/logout', methods=['POST'])
def logout():
    session.pop('usuario', None)
    return jsonify({'ok': True, 'msg': 'Logout realizado com sucesso.'})


import os
import json
import hashlib
from flask import Blueprint, request, jsonify, render_template, session, redirect, url_for
import json, hashlib, os

# Criar o Blueprint para cadastro
cadastro_bp = Blueprint('cadastro', __name__, template_folder='../templates', url_prefix='/auth')

USERS_FILE = os.path.join(os.path.dirname(__file__), 'usuarios.json')

def carregar_usuarios():
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return []
    return []

def salvar_usuarios(usuarios):
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(usuarios, f, ensure_ascii=False, indent=2)

def hash_senha(senha):
    return hashlib.sha256(senha.encode()).hexdigest()

@cadastro_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    nome = data.get('nome')
    email = data.get('email')
    senha = data.get('senha')
    if not nome or not email or not senha:
        return jsonify({'ok': False, 'msg': 'Dados incompletos'}), 400
    users = carregar_usuarios()
    if any(u.get('email') == email for u in users):
        return jsonify({'ok': False, 'msg': 'Email já cadastrado'}), 400
    users.append({
        'nome': nome,
        'email': email,
        'senhaHash': hash_senha(senha),
        'criadoEm': datetime.utcnow().isoformat()
    })
    salvar_usuarios(users)
    return jsonify({'ok': True})

@cadastro_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    senha = data.get('senha')
    if not email or not senha:
        return jsonify({'ok': False, 'msg': 'Dados incompletos'}), 400
    users = carregar_usuarios()
    hashed = hash_senha(senha)
    user = next((u for u in users if u.get('email') == email and u.get('senhaHash') == hashed), None)
    if not user:
        return jsonify({'ok': False, 'msg': 'Credenciais inválidas'}), 401
    session['usuario'] = {'nome': user.get('nome'), 'email': user.get('email'), 'tipo_login': 'email'}
    return jsonify({'ok': True})

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


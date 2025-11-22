import os
import json
import hashlib
from flask import Blueprint, request, jsonify, render_template, session, redirect, url_for
from datetime import datetime
from flask_dance.contrib.google import make_google_blueprint, google

# Criar o Blueprint para cadastro
cadastro_bp = Blueprint('cadastro', __name__, template_folder='../templates', url_prefix='/auth')

USERS_FILE = 'usuarios.json'

def carregar_usuarios():
    """Carrega usuários do arquivo JSON"""
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return []
    return []

def salvar_usuarios(usuarios):
    """Salva usuários no arquivo JSON"""
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(usuarios, f, ensure_ascii=False, indent=2)

def hash_senha(senha):
    """Gera hash SHA256 da senha"""
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
        'senha': hash_senha(senha),
        'criado_em': datetime.utcnow().isoformat()
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
    user = next((u for u in users if u.get('email') == email and u.get('senha') == hashed), None)
    if not user:
        return jsonify({'ok': False, 'msg': 'Credenciais inválidas'}), 401
    session['usuario'] = {'nome': user.get('nome'), 'email': user.get('email'), 'tipo_login': 'local'}
    return jsonify({'ok': True})

# LOGIN COM GOOGLE (Flask-Dance)
# Permitir HTTP local (apenas para desenvolvimento)
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '96734921781-vpg8c994qchlccki3qm84o6522v0b586.apps.googleusercontent.com')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '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')

# blueprint do Flask-Dance — não usa url_prefix aqui; será registrado em app.py com o prefix desejado
google_bp = make_google_blueprint(
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    scope=[
        "openid",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email"
    ],
    redirect_to="google_callback"  # nome da rota em app.py que será chamada após autorização
)

# 'google' (importado) é o proxy que app.py usará para obter userinfo

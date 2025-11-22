import os
import json
import hashlib
from flask import Blueprint, request, jsonify, render_template, session, redirect, url_for
from datetime import datetime
from flask_dance.contrib.google import make_google_blueprint, google

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

# LOGIN COM GOOGLE (Flask-Dance)
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # apenas para desenvolvimento local

GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')

# não coloque client_secret fixo no repo; use variáveis de ambiente
if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    google_bp = make_google_blueprint(
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        scope=[
            "openid",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email"
        ],
        redirect_to="google_callback"
    )
else:
    # deixar google_bp ausente quando credenciais não estiverem definidas
    google_bp = None

# expor objeto proxy 'google' do flask-dance (importado acima) para app.py usar

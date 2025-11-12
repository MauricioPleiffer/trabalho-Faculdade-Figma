from flask import Blueprint, request, jsonify, render_template, session, redirect, url_for
import json, hashlib, os
from flask_dance.contrib.google import make_google_blueprint, google
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

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

# ---------------------------
# LOGIN COM GOOGLE (Flask-Dance)
# ---------------------------

# Permitir HTTP local (apenas para testes)
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

# Variáveis de ambiente para segurança
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '96734921781-vpg8c994qchlccki3qm84o6522v0b586.apps.googleusercontent.com')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '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')

google_bp = make_google_blueprint(
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    redirect_to="google_login"  # nome da rota abaixo
)

@google_bp.route("/google_login")
def google_login():
    if not google.authorized:
        return redirect(url_for("google.login"))
    
    resp = google.get("/oauth2/v2/userinfo")
    if not resp.ok:
        return "Erro ao acessar informações do Google", 400

    user_info = resp.json()
    session['usuario'] = {
        "nome": user_info["name"],
        "email": user_info["email"],
        "foto": user_info.get("picture"),
        "tipo_login": "google"
    }
    return redirect(url_for("index"))


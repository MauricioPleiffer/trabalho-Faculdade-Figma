import os
from flask_dance.contrib.google import make_google_blueprint, google
from flask import jsonify

# Caminhos para templates e arquivos estáticos
template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'templates'))
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'static'))

app = Flask(__name__,
            template_folder=template_dir,
            static_folder=static_dir,
            static_url_path='/static')

app.secret_key = 'tenis123'

# Registro dos blueprints existentes
app.register_blueprint(cadastro.cadastro_bp)
app.register_blueprint(carrinho.carrinho_bp)

# ---------------------------
# LOGIN COM GOOGLE (Flask-Dance)
# ---------------------------

# Permitir HTTP local (apenas para testes)
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

google_bp = make_google_blueprint(
    client_id="96734921781-vpg8c994qchlccki3qm84o6522v0b586.apps.googleusercontent.com",
    client_secret="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",
    scope=[
        "openid",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email"
    ],
    redirect_to="google_login"  # NOME DA ROTA, NÃO URL!
)
app.register_blueprint(google_bp, url_prefix="/login")

@app.route("/google_login")
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

# Registrar blueprint do Google: preferir cadastro.google_bp se presente
if hasattr(cadastro, 'google_bp'):
    try:
        app.register_blueprint(cadastro.google_bp, url_prefix="/auth/google")
    except Exception:
        pass
else:
    # Cria blueprint local usando variáveis de ambiente (não inclua secrets no repo)
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
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
        app.register_blueprint(google_bp, url_prefix="/auth/google")

servicos = [    
    {"id": 1, "nome": "Lavar e Secar", "preco": 28.00},
    {"id": 2, "nome": "Lavar a Seco", "preco": 44.00},
    {"id": 3, "nome": "Roupas Delicadas", "preco": 50.00},
    {"id": 4, "nome": "10 kg", "preco": 65.00},
    {"id": 5, "nome": "20 kg", "preco": 129.00},
    {"id": 6, "nome": "30 kg", "preco": 195.00}
]

@app.route('/')
def index():
    usuario = session.get('usuario')
    return render_template('index.html', usuario=usuario)

@app.route('/catalogo')
def catalogo():
    if os.path.exists(os.path.join(template_dir, 'catalogo.html')):
        return render_template('catalogo.html', servicos=servicos)
    return redirect(url_for('index'))

@app.route('/carrinho')
def carrinho():
    return render_template('carrinho.html')

@app.route('/')
def index():
    carrinho_atual = session.get('carrinho', [])
    total = sum(item['preco'] for item in carrinho_atual)
    usuario = session.get('usuario')
    return render_template('index.html',
                           servicos=servicos,
                           carrinho=carrinho_atual,
                           total=total,
                           usuario=usuario)

@app.route('/cadastro')
def cadastro_page():
    return render_template('cadastro.html')

# ---------------------------
# LOGOUT
# ---------------------------

@app.route("/auth/logout", methods=["POST"])
def logout():
    session.pop('usuario', None)
    return jsonify({"ok": True})

# ---------------------------

if __name__ == '__main__':
    app.run(debug=True)

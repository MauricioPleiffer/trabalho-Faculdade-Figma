import os
from flask import Flask, render_template, session, redirect, url_for, request, jsonify
from flask_dance.contrib.google import make_google_blueprint, google

# importe seus módulos locais
import carrinho
import cadastro

# Caminhos para templates e arquivos estáticos
template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'templates'))
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'static'))

app = Flask(__name__,
            template_folder=template_dir,
            static_folder=static_dir,
            static_url_path='/static')

app.secret_key = os.environ.get('FLASK_SECRET', 'tenis123')

# Registrar blueprints existentes
# cadastro.cadastro_bp deve ter url_prefix='/auth' conforme projeto
app.register_blueprint(carrinho.carrinho_bp)
app.register_blueprint(cadastro.cadastro_bp)

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
def view_carrinho():
    return render_template('index.html', carrinho=session.get('carrinho', []), total=sum(item.get('preco',0) for item in session.get('carrinho', [])))

@app.route('/cadastro')
def view_cadastro():
    if os.path.exists(os.path.join(template_dir, 'cadastro.html')):
        return render_template('cadastro.html')
    return redirect(url_for('index'))

# Rota chamada após autorização do Google (redirect_to="google_callback")
@app.route("/auth/google_callback")
def google_callback():
    # provider pode vir do módulo cadastro (cadastro.google) ou do import 'google'
    provider = getattr(cadastro, 'google', None) or globals().get('google')
    if not provider or not provider.authorized:
        return redirect(url_for("google.login"))

    resp = provider.get("/oauth2/v2/userinfo")
    if not resp or not resp.ok:
        return "Erro ao acessar informações do Google", 400

    user_info = resp.json()
    session['usuario'] = {
        "nome": user_info.get("name") or user_info.get("email"),
        "email": user_info.get("email"),
        "foto": user_info.get("picture"),
        "tipo_login": "google"
    }
    return redirect(url_for("index"))

@app.route('/logout', methods=['GET', 'POST'])
def logout():
    session.pop('usuario', None)
    # tentar limpar token do Flask-Dance se presente
    try:
        provider = getattr(cadastro, 'google', None) or globals().get('google')
        if provider and getattr(provider, 'token', None):
            provider.token = None
    except Exception:
        pass
    return redirect(url_for('index'))

@app.route('/api/usuario-info', methods=['GET'])
def usuario_info():
    return jsonify(session.get('usuario') or {})

if __name__ == '__main__':
    app.run(debug=True)

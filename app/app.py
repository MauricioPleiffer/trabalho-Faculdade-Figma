from flask import Flask, render_template, session, redirect, url_for
import cadastro
import carrinho
import os
from flask_dance.contrib.google import make_google_blueprint, google

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

# ---------------------------
# ROTA PRINCIPAL
# ---------------------------

servicos = [
    {"id": 1, "nome": "Lavagem Simples", "preco": 15.00},
    {"id": 2, "nome": "Lavagem + Passadoria", "preco": 25.00},
    {"id": 3, "nome": "Roupas Delicadas", "preco": 50.00},
    {"id": 4, "nome": "10 kg", "preco": 65.00},
    {"id": 5, "nome": "20 kg", "preco": 129.00},
    {"id": 6, "nome": "30 kg", "preco": 195.00},
]

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

@app.route('/carrinho')
def carrinho_page():
    carrinho_atual = session.get('carrinho', [])
    total = sum(item['preco'] for item in carrinho_atual)
    usuario = session.get('usuario')
    return render_template('carrinho.html',
                           carrinho=carrinho_atual,
                           total=total,
                           usuario=usuario)

@app.route('/catalogo')
def catalogo_page():
    return render_template('catalogo.html')



# ---------------------------
# LOGOUT
# ---------------------------

@app.route("/logout")
def logout():
    session.pop('usuario', None)
    return redirect(url_for('index'))

# ---------------------------

if __name__ == '__main__':
    app.run(debug=True)

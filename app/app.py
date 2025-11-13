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
    redirect_to="google_login"  # nome da rota abaixo
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


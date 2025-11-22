import os
from flask import Flask, render_template, session, redirect, url_for, request, jsonify

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

# Registro dos blueprints existentes
app.register_blueprint(carrinho.carrinho_bp)        # /auth prefix is inside carrinho blueprint if defined
app.register_blueprint(cadastro.cadastro_bp)        # cadastro_bp uses url_prefix='/auth'

# Registrar o blueprint do Flask-Dance para Google em /auth/google
# Isso fará com que os endpoints sejam: /auth/google/login e /auth/google/authorized
app.register_blueprint(cadastro.google_bp, url_prefix="/auth/google")

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
    return render_template('catalogo.html', servicos=servicos) if os.path.exists(os.path.join(template_dir, 'catalogo.html')) else redirect(url_for('index'))

@app.route('/carrinho')
def view_carrinho():
    return render_template('index.html', carrinho=session.get('carrinho', []), total=sum(item.get('preco',0) for item in session.get('carrinho', [])))

@app.route('/cadastro')
def view_cadastro():
    return render_template('cadastro.html') if os.path.exists(os.path.join(template_dir, 'cadastro.html')) else redirect(url_for('index'))

# Rota chamada após autorização do Google (redirect_to="google_callback" em cadastro.google_bp)
@app.route("/auth/google_callback")
def google_callback():
    # Se não autorizado, iniciar o fluxo OAuth (redireciona para /auth/google/login)
    if not cadastro.google.authorized:
        return redirect(url_for("google.login"))

    resp = cadastro.google.get("/oauth2/v2/userinfo")
    if not resp or not resp.ok:
        return "Erro ao acessar informações do Google", 400

    user_info = resp.json()
    # Armazenar dados do usuário na sessão
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
    # tentar limpar token do Flask-Dance
    try:
        if getattr(cadastro.google, 'token', None):
            cadastro.google.token = None
    except Exception:
        pass
    return redirect(url_for('index'))

@app.route('/api/usuario-info', methods=['GET'])
def usuario_info():
    return jsonify(session.get('usuario') or {})

if __name__ == '__main__':
    app.run(debug=True)


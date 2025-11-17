from flask import Flask, render_template, session, redirect, url_for
import cadastro
import carrinho
import os


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
app.register_blueprint(cadastro.google_bp, url_prefix="/login")


# ---------------------------
# ROTA PRINCIPAL
# ---------------------------

servicos = [    
    {"id": 1, "nome": "Lavar e Secar", "preco": 28.00} ,
    {"id": 2, "nome": "Lavar a Seco", "preco": 44.00},
    {"id": 3, "nome": "Roupas Delicadas", "preco": 50.00},
    {"id": 4, "nome": "10 kg", "preco": 65.00},
    {"id": 5, "nome": "20 kg", "preco": 129.00},
    {"id": 6, "nome": "30 kg", "preco": 195.00}
]


@app.route('/catalogo')
def catalogo():
    return render_template('catalogo.html')

@app.route('/carrinho')
def carrinho():
    return render_template('carrinho.html')

@app.route('/')
def index():
    carrinho_atual = session.get('carrinho', [])
    total = sum(item['preco'] for item in carrinho_atual)
    usuario = session.get('usuario')
    return render_template('index.html',
                           carrinho=carrinho_atual,
                           total=total,
                           usuario=usuario)


if __name__ == '__main__':
    app.run(debug=True)


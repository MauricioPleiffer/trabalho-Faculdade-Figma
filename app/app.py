from flask import Flask, render_template
from flask import session
import cadastro
import carrinho
import os

# Configurar o caminho para templates e arquivos estáticos
template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'templates'))
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'static'))

app = Flask(__name__, 
           template_folder=template_dir,
           static_folder=static_dir,
           static_url_path='/static')

app.secret_key = 'tenis123'

app.register_blueprint(cadastro.cadastro_bp)
app.register_blueprint(carrinho.carrinho_bp)

servicos = [
    {"id": 1, "nome": "Lavagem Simples", "preco": 15.00} ,
    {"id": 2, "nome": "Lavagem + Passadoria", "preco": 25.00},
]


@app.route('/')
def index():
    carrinho = session.get('carrinho', [])
    total = sum(item['preco'] for item in carrinho)
    return render_template('index.html', servicos = servicos, carrinho = carrinho, total = total)


if __name__ == '__main__':
    app.run(debug=True)

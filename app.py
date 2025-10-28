from flask import Flask, redirect, render_template
from flask import url_for
from flask import session

app = Flask(__name__)

app.secret_key = 'tenis123'

servicos = [
    {"id": 1, "nome": "Lavagem Simples", "preco": 15.00} ,
    {"id": 2, "nome": "Lavagem + Passadoria", "preco": 25.00},
    {"id": 3, "nome": "Serviço Completo", "preco": 0}
]



@app.route('/')
def index():
    return render_template('index.html', servicos=servicos)

@app.route('/adicionar_ao_carrinho/<int:servico_id>')
def adiciona_ao_carrinho(servico_id):
        if 'cart' not in session:
            session['cart'] = []

        servico = next((s for s in servicos if s['id'] == servico_id), None)
        if servico:
            session['cart'].append(servico)
            session.modified = True
    
        return redirect(url_for('ver_carrinho'))


@app.route('/carrinho')
def ver_carrinho():
    carrinho = session.get('cart', [])
    total = sum(item['preco'] for item in carrinho)
    return render_template('index.html', carrinho=carrinho, total=total)


@app.route('/limpar_carrinho')
def limpar_carrinho():
    session.pop('cart', None)
    return redirect(url_for('ver_carrinho'))



if __name__ == '__main__':
    app.run(debug=True)

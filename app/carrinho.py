from flask import Blueprint, jsonify, redirect, render_template, request
from flask import url_for
from flask import session

carrinho_bp = Blueprint('carrinho', __name__, template_folder='../templates', url_prefix='/auth')



servicos = [    
    {"id": 1, "nome": "Lavagem Simples", "preco": 15.00} ,
    {"id": 2, "nome": "Lavagem + Passadoria", "preco": 25.00},
]



@carrinho_bp.route('/adicionar_ao_carrinho', methods=['POST'])
def adicionar_ao_carrinho():
    # Recebe um POST form-encoded com 'servico_id' e adiciona o serviço à sessão
    try:
        servico_id = int(request.form['servico_id'])
    except Exception:
        return jsonify({'sucesso': False, 'mensagem': 'ID de serviço inválido'}), 400

    servico = next((s for s in servicos if s['id'] == servico_id), None)
    if servico:
        carrinho = session.get('carrinho', [])
        carrinho.append(servico)
        session['carrinho'] = carrinho
        total = sum(item['preco'] for item in carrinho)
        return jsonify({'sucesso': True, 'nome': servico['nome'], 'preco': servico['preco'], 'total': total})
    return jsonify({'sucesso': False, 'mensagem': 'Serviço não encontrado'}), 404


@carrinho_bp.route('/carrinho')
def ver_carrinho():
    # Usar a mesma chave 'carrinho' que é usada ao adicionar
    carrinho = session.get('carrinho', [])
    total = sum(item['preco'] for item in carrinho)
    return render_template('index.html', carrinho=carrinho, total=total)


@carrinho_bp.route('/limpar_carrinho')
def limpar_carrinho():
    # Remover a chave correta da sessão
    session.pop('carrinho', None)
    return redirect(url_for('ver_carrinho'))

@carrinho_bp.route('/finalizar_compra', methods=['POST'])   
def finalizar_compra():
    data = request.get_json()
    if not data or 'cart' not in data:
         return jsonify({'sucesso': False, 'mensagem': 'Carrinho vazio'}), 400
    # Aceitar preço numérico vindo do cliente (float) ou string com 'R$'
    def parse_price(item):
        p = item.get('price') if isinstance(item, dict) else None
        if p is None:
            return 0.0
        try:
            return float(p)
        except Exception:
            try:
                return float(str(p).replace('R$', '').replace(',', '.').strip())
            except Exception:
                return 0.0

    total = sum(parse_price(item) for item in data['cart'])
    print("itens comprados:", data['cart'])
    print("Total:", total)

    return jsonify({'sucesso': True, 'mensagem': f'Compra finalizada! Total: R$ {total:.2f}'})
    

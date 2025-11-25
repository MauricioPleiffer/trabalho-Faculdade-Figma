from flask import Blueprint, render_template, request, redirect, url_for, session

pagamento_bp = Blueprint(
    'pagamento',
    __name__,
    template_folder='../templates',
    static_folder='../static'
)


@pagamento_bp.route('/pagamento', methods=['GET', 'POST'])
def pagamento_page():
    if request.method == 'POST':
        dados = request.form.to_dict()
        session['dados_pagamento'] = dados

        print("Dados recebidos:", dados)  # Debug

        return redirect(url_for('index', status='sucesso'))

    return render_template('pagamento.html')

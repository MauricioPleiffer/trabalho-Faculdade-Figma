document.querySelector('input[name="cep"]').addEventListener('input', function (e) {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 5) {
        e.target.value = v.substring(0, 5) + '-' + v.substring(5, 8);
    } else {
        e.target.value = v;
    }
});

document.querySelector('input[name="numcart"]').addEventListener('input', function (e) {
    let v = e.target.value.replace(/\D/g, "").slice(0, 16);
    e.target.value = v.replace(/(\d{4})(?=\d)/g, "$1 ");
});

document.querySelector('input[name="codseg"]').addEventListener('input', function (e) {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 3);
});

document.querySelector('input[name="mesven"]').addEventListener('input', function (e) {
    let v = e.target.value.replace(/\D/g, "").slice(0, 2);
    e.target.value = v;
});

document.querySelector('input[name="anoven"]').addEventListener('input', function (e) {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
});

document.querySelectorAll("input[required]").forEach(input => {
    input.addEventListener("invalid", function () {
        input.setCustomValidity("Preencha este campo corretamente.");
    });
    input.addEventListener("input", function () {
        input.setCustomValidity("");
    });
});

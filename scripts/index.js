// Configuração dos Listeners presentes na página index.html.
document.addEventListener('DOMContentLoaded', () => {

    // Função do evento de clique para o botão de login.
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }    
});

// Função para realizar o login
async function login(event) {
    event.preventDefault(); // Prevenir o comportamento padrão do formulário

    const inputUser = document.getElementById('username');
    const inputPass = document.getElementById('password');

    const username = inputUser.value;
    const password = inputPass.value;
    
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Limpa os campos de login antes de redirecionar.
            inputUser.value = "";
            inputPass.value = "";
            // Login bem-sucedido, redirecionar para /files
            window.location.href = '/files';
        } else {
            // Falha no login, mostrar alerta com a mensagem
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Erro ao tentar fazer login:', error);
        alert('Ocorreu um erro ao tentar fazer login.');
    });
}
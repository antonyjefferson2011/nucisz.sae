// Configuração Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBzqQmGpMz-7AYM7_Mpt2owpmf6BXjW1yk",
    authDomain: "nucisz.firebaseapp.com",
    projectId: "nucisz",
    storageBucket: "nucisz.firebasestorage.app",
    messagingSenderId: "90824519141",
    appId: "1:90824519141:web:8ec5d6686c07cbbf94930c",
    measurementId: "G-BZ4S7Q3NM2"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Configuração ImgBB
const IMGBB_API_KEY = '86427cccd2a94fb42a0754ffd7f19e79';

// Estado global
let currentUser = null;
let isAdmin = false;

// Elementos DOM
const loadingScreen = document.getElementById('loadingScreen');
const authModal = document.getElementById('authModal');
const adminPanel = document.getElementById('adminPanel');
const mainContent = document.getElementById('mainContent');

// ============= AUTENTICAÇÃO =============

// Mostrar/Esconder modal
document.getElementById('btnLogin').addEventListener('click', () => {
    authModal.classList.add('active');
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
});

document.querySelector('.close-modal').addEventListener('click', () => {
    authModal.classList.remove('active');
});

// Alternar entre login e registro
document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
});

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;

    try {
        await auth.signInWithEmailAndPassword(email, senha);
        authModal.classList.remove('active');
        alert('✅ Login realizado com sucesso!');
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
});

// Registro
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const senha = document.getElementById('registerSenha').value;
    const adminCode = document.getElementById('adminCode').value;

    // Código secreto para admin (altere para o que quiser)
    const SECRET_ADMIN_CODE = 'nucisz2024admin';

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
        
        // Salvar dados do usuário
        await db.collection('usuarios').doc(userCredential.user.uid).set({
            email: email,
            isAdmin: adminCode === SECRET_ADMIN_CODE,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        authModal.classList.remove('active');
        alert('✅ Conta criada com sucesso!');
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
});

// Logout
document.getElementById('btnLogout').addEventListener('click', async () => {
    await auth.signOut();
    adminPanel.style.display = 'none';
    mainContent.style.display = 'block';
});

// Monitorar estado de autenticação
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    
    if (user) {
        document.getElementById('btnLogin').style.display = 'none';
        document.getElementById('btnLogout').style.display = 'block';
        
        // Verificar se é admin
        const userDoc = await db.collection('usuarios').doc(user.uid).get();
        isAdmin = userDoc.exists && userDoc.data().isAdmin;
        
        if (isAdmin) {
            carregarPainelAdmin();
        }
    } else {
        document.getElementById('btnLogin').style.display = 'block';
        document.getElementById('btnLogout').style.display = 'none';
        isAdmin = false;
        adminPanel.style.display = 'none';
        mainContent.style.display = 'block';
    }
});

// ============= PAINEL ADMIN =============

function carregarPainelAdmin() {
    carregarDadosParaEdicao();
}

document.getElementById('closeAdmin').addEventListener('click', () => {
    adminPanel.style.display = 'none';
    mainContent.style.display = 'block';
});

// Tabs do admin
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// Carregar dados para edição
async function carregarDadosParaEdicao() {
    try {
        // Home
        const homeDoc = await db.collection('conteudo').doc('home').get();
        if (homeDoc.exists) {
            document.getElementById('editBannerTitulo').value = homeDoc.data().titulo || '';
            document.getElementById('editBannerSubtitulo').value = homeDoc.data().subtitulo || '';
        }

        // Sobre
        const sobreDoc = await db.collection('conteudo').doc('sobre').get();
        if (sobreDoc.exists) {
            document.getElementById('editMissao').value = sobreDoc.data().missao || '';
            document.getElementById('editVisao').value = sobreDoc.data().visao || '';
            document.getElementById('editValores').value = sobreDoc.data().valores || '';
        }

        // História
        const historiaDoc = await db.collection('conteudo').doc('historia').get();
        if (historiaDoc.exists) {
            document.getElementById('editHistoriaTitulo').value = historiaDoc.data().titulo || '';
            document.getElementById('editHistoriaTexto').value = historiaDoc.data().texto || '';
            document.getElementById('editHistoriaDestaque').value = historiaDoc.data().destaque || '';
        }

        // Carregar listas
        carregarListaProdutosAdmin();
        carregarListaEquipeAdmin();
        carregarListaPraticasAdmin();
        
        adminPanel.style.display = 'block';
        mainContent.style.display = 'none';
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// Salvar seções
async function salvarSecao(secao) {
    try {
        let dados = {};
        
        switch(secao) {
            case 'home':
                dados = {
                    titulo: document.getElementById('editBannerTitulo').value,
                    subtitulo: document.getElementById('editBannerSubtitulo').value
                };
                break;
            case 'sobre':
                dados = {
                    missao: document.getElementById('editMissao').value,
                    visao: document.getElementById('editVisao').value,
                    valores: document.getElementById('editValores').value
                };
                break;
            case 'historia':
                dados = {
                    titulo: document.getElementById('editHistoriaTitulo').value,
                    texto: document.getElementById('editHistoriaTexto').value,
                    destaque: document.getElementById('editHistoriaDestaque').value
                };
                break;
        }

        await db.collection('conteudo').doc(secao).set(dados, { merge: true });
        alert('✅ Alterações salvas com sucesso!');
        carregarConteudoSite(); // Atualizar site
    } catch (error) {
        alert('❌ Erro ao salvar: ' + error.message);
    }
}

// Gerenciar Produtos
async function carregarListaProdutosAdmin() {
    const container = document.getElementById('listaProdutosAdmin');
    const snapshot = await db.collection('produtos').get();
    
    container.innerHTML = snapshot.docs.map(doc => `
        <div class="card" style="margin-bottom:1rem;">
            <h4>${doc.data().nome}</h4>
            <p>${doc.data().descricao}</p>
            <p><strong>R$ ${doc.data().preco}</strong></p>
            <button onclick="removerItem('produtos', '${doc.id}')" class="btn-auth" style="background:red;color:white;">Remover</button>
        </div>
    `).join('');
}

async function adicionarProduto() {
    const nome = prompt('Nome do produto:');
    const descricao = prompt('Descrição:');
    const preco = prompt('Preço (R$):');
    
    if (nome && descricao

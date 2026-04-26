// Configuração Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBzqQmGpMz-7AYM7_Mpt2owpmf6BXjW1yk",
    authDomain: "nucisz.firebaseapp.com",
    projectId: "nucisz",
    storageBucket: "nucisz.firebasestorage.app",
    messagingSenderId: "90824519141",
    appId: "1:90824519141:web:8ec5d6686c07cbbf94930c"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const IMGBB_API_KEY = '86427cccd2a94fb42a0754ffd7f19e79';
const SECRET_ADMIN_CODE = 'nucisz2024admin';

let currentUser = null;
let isAdmin = false;

// ============= INICIAR SITE (SEM TRAVAS) =============
document.addEventListener('DOMContentLoaded', function() {
    // Site carrega direto, sem loading infinito
    carregarConteudoSite();
    configurarEventos();
    verificarAuthState();
});

function configurarEventos() {
    // Menu mobile
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('navLinks').classList.toggle('ativo');
    });

    // Fechar menu
    document.querySelectorAll('.nav-links a:not(.nav-auth a)').forEach(link => {
        link.addEventListener('click', () => {
            document.getElementById('navLinks').classList.remove('ativo');
        });
    });

    // Modal Login
    document.getElementById('btnLogin').addEventListener('click', () => {
        document.getElementById('authModal').classList.add('active');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    });

    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('authModal').classList.remove('active');
    });

    // Alternar formulários
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
        try {
            await auth.signInWithEmailAndPassword(
                document.getElementById('loginEmail').value,
                document.getElementById('loginSenha').value
            );
            document.getElementById('authModal').classList.remove('active');
        } catch (error) {
            alert('❌ ' + error.message);
        }
    });

    // Registro
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(
                document.getElementById('registerEmail').value,
                document.getElementById('registerSenha').value
            );
            
            const adminCode = document.getElementById('adminCode').value;
            await db.collection('usuarios').doc(userCredential.user.uid).set({
                email: document.getElementById('registerEmail').value,
                isAdmin: adminCode === SECRET_ADMIN_CODE,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            document.getElementById('authModal').classList.remove('active');
            alert('✅ Conta criada! Faça login novamente para acessar.');
            await auth.signOut();
        } catch (error) {
            alert('❌ ' + error.message);
        }
    });

    // Logout
    document.getElementById('btnLogout').addEventListener('click', async () => {
        await auth.signOut();
    });

    // Botão Admin
    document.getElementById('btnAdminPanel').addEventListener('click', async () => {
        await carregarDadosAdmin();
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('mainContent').style.display = 'none';
    });

    // Fechar admin
    document.getElementById('closeAdmin').addEventListener('click', () => {
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
    });

    // Tabs admin
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // Contato
    document.getElementById('formContato').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await db.collection('mensagens').add({
                nome: document.getElementById('contatoNome').value,
                email: document.getElementById('contatoEmail').value,
                mensagem: document.getElementById('contatoMensagem').value,
                data: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('✅ Mensagem enviada!');
            document.getElementById('formContato').reset();
        } catch (error) {
            alert('❌ Erro: ' + error.message);
        }
    });

    // Scroll suave
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const destino = document.querySelector(this.getAttribute('href'));
            if (destino) {
                destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Animação scroll
    window.addEventListener('scroll', animarScroll);
    animarScroll();
}

// ============= AUTENTICAÇÃO =============
function verificarAuthState() {
    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        
        if (user) {
            document.getElementById('btnLogin').style.display = 'none';
            document.getElementById('btnLogout').style.display = 'inline-block';
            
            try {
                const userDoc = await db.collection('usuarios').doc(user.uid).get();
                isAdmin = userDoc.exists && userDoc.data().isAdmin;
                
                if (isAdmin) {
                    document.getElementById('btnAdminPanel').style.display = 'inline-block';
                } else {
                    document.getElementById('btnAdminPanel').style.display = 'none';
                }
            } catch (error) {
                isAdmin = false;
                document.getElementById('btnAdminPanel').style.display = 'none';
            }
        } else {
            document.getElementById('btnLogin').style.display = 'inline-block';
            document.getElementById('btnLogout').style.display = 'none';
            document.getElementById('btnAdminPanel').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
        }
    });
}

// ============= CARREGAR CONTEÚDO DO SITE =============
async function carregarConteudoSite() {
    try {
        // Banner
        const homeDoc = await db.collection('conteudo').doc('home').get();
        if (homeDoc.exists) {
            document.getElementById('bannerTitulo').textContent = homeDoc.data().titulo;
            document.getElementById('bannerSubtitulo').textContent = homeDoc.data().subtitulo;
        }

        // Sobre
        const sobreDoc = await db.collection('conteudo').doc('sobre').get();
        const dadosSobre = sobreDoc.exists ? sobreDoc.data() : {
            missao: 'Promover o desenvolvimento sustentável através da valorização do babaçu.',
            visao: 'Ser referência em negócios sustentáveis que unem tradição e inovação.',
            valores: 'Sustentabilidade, respeito às tradições, empoderamento feminino.'
        };
        
        document.getElementById('gridSobre').innerHTML = `
            <div class="card animar"><div class="card-icone">🎯</div><h3>Missão</h3><p>${dadosSobre.missao}</p></div>
            <div class="card animar"><div class="card-icone">👁️</div><h3>Visão</h3><p>${dadosSobre.visao}</p></div>
            <div class="card animar"><div class="card-icone">💚</div><h3>Valores</h3><p>${dadosSobre.valores}</p></div>
        `;

        // História
        const historiaDoc = await db.collection('conteudo').doc('historia').get();
        const dadosHistoria = historiaDoc.exists ? historiaDoc.data() : {
            titulo: 'As Guardiãs do Babaçu',
            texto: 'As quebradeiras de coco babaçu são mulheres guerreiras que mantêm viva a tradição.',
            destaque: 'Mais de 300 mil famílias dependem do babaçu.'
        };
        
        document.getElementById('historiaTitulo').textContent = dadosHistoria.titulo;
        document.getElementById('historiaConteudo').innerHTML = `
            <div class="historia-imagem animar"><span style="font-size:5rem;">👩‍🌾🌴</span></div>
            <div class="historia-texto animar">
                <p>${dadosHistoria.texto}</p>
                <div class="destaque"><h3>🌍 Impacto</h3><p>${dadosHistoria.destaque}</p></div>
            </div>
        `;

        // Produtos
        const prodSnapshot = await db.collection('produtos').get();
        document.getElementById('gridProdutos').innerHTML = prodSnapshot.empty ? 
            '<p style="text-align:center;">Produtos em breve!</p>' :
            prodSnapshot.docs.map(doc => `
                <div class="produto-card animar">
                    <div class="produto-imagem">${doc.data().icone || '🌿'}</div>
                    <div class="produto-info">
                        <h3>${doc.data().nome}</h3>
                        <p>${doc.data().descricao}</p>
                        <div class="produto-preco">R$ ${doc.data().preco}</div>
                    </div>
                </div>
            `).join('');

        // Equipe
        const eqSnapshot = await db.collection('equipe').get();
        document.getElementById('gridEquipe').innerHTML = eqSnapshot.empty ?
            '<p style="text-align:center;">Equipe em construção!</p>' :
            eqSnapshot.docs.map(doc => `
                <div class="equipe-card animar">
                    <img src="${doc.data().foto || 'https://via.placeholder.com/300'}" class="equipe-foto">
                    <div class="equipe-info">
                        <h3>${doc.data().nome}</h3>
                        <p class="equipe-funcao">${doc.data().funcao}</p>
                    </div>
                </div>
            `).join('');

        // Sustentabilidade
        const sustSnapshot = await db.collection('sustentabilidade').get();
        document.getElementById('gridSustentabilidade').innerHTML = sustSnapshot.empty ?
            '<p style="text-align:center;">Práticas em breve!</p>' :
            sustSnapshot.docs.map(doc => `
                <div class="card sustentabilidade-card animar">
                    <div style="font-size:3rem;">${doc.data().icone || '🌿'}</div>
                    <h3>${doc.data().titulo}</h3>
                    <p>${doc.data().descricao}</p>
                </div>
            `).join('');

        setTimeout(animarScroll, 100);
    } catch (error) {
        console.error('Erro:', error);
    }
}

// ============= PAINEL ADMIN =============
async function carregarDadosAdmin() {
    try {
        const homeDoc = await db.collection('conteudo').doc('home').get();
        if (homeDoc.exists) {
            document.getElementById('editBannerTitulo').value = homeDoc.data().titulo || '';
            document.getElementById('editBannerSubtitulo').value = homeDoc.data().subtitulo || '';
        }

        const sobreDoc = await db.collection('conteudo').doc('sobre').get();
        if (sobreDoc.exists) {
            document.getElementById('editMissao').value = sobreDoc.data().missao || '';
            document.getElementById('editVisao').value = sobreDoc.data().visao || '';
            document.getElementById('editValores').value = sobreDoc.data().valores || '';
        }

        const historiaDoc = await db.collection('conteudo').doc('historia').get();
        if (historiaDoc.exists) {
            document.getElementById('editHistoriaTitulo').value = historiaDoc.data().titulo || '';
            document.getElementById('editHistoriaTexto').value = historiaDoc.data().texto || '';
            document.getElementById('editHistoriaDestaque').value = historiaDoc.data().destaque || '';
        }

        await carregarListasAdmin();
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function carregarListasAdmin() {
    // Produtos
    const prodSnapshot = await db.collection('produtos').get();
    document.getElementById('listaProdutosAdmin').innerHTML = prodSnapshot.docs.map(doc => `
        <div class="card" style="margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center;">
            <div><strong>${doc.data().nome}</strong> - R$ ${doc.data().preco}</div>
            <button onclick="removerItem('produtos','${doc.id}')" style="background:red;color:white;border:none;padding:0.3rem 0.8rem;border-radius:5px;cursor:pointer;">✕</button>
        </div>
    `).join('');

    // Equipe
    const eqSnapshot = await db.collection('equipe').get();
    document.getElementById('listaEquipeAdmin').innerHTML = eqSnapshot.docs.map(doc => `
        <div class="card" style="margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center;">
            <div><strong>${doc.data().nome}</strong> - ${doc.data().funcao}</div>
            <button onclick="removerItem('equipe','${doc.id}')" style="background:red;color:white;border:none;padding:0.3rem 0.8rem;border-radius:5px;cursor:pointer;">✕</button>
        </div>
    `).join('');

    // Práticas
    const sustSnapshot = await db.collection('sustentabilidade').get();
    document.getElementById('listaPraticasAdmin').innerHTML = sustSnapshot.docs.map(doc => `
        <div class="card" style="margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center;">
            <div>${doc.data().icone} <strong>${doc.data().titulo}</strong></div>
            <button onclick="removerItem('sustentabilidade','${doc.id}')" style="background:red;color:white;border:none;padding:0.3rem 0.8rem;border-radius:5px;cursor:pointer;">✕</button>
        </div>
    `).join('');
}

async function salvarSecao(secao) {
    try {
        let dados = {};
        if (secao === 'home') {
            dados.titulo = document.getElementById('editBannerTitulo').value;
            dados.subtitulo = document.getElementById('editBannerSubtitulo').value;
        } else if (secao === 'sobre') {
            dados.missao = document.getElementById('editMissao').value;
            dados.visao = document.getElementById('editVisao').value;
            dados.valores = document.getElementById('editValores').value;
        } else if (secao === 'historia') {
            dados.titulo = document.getElementById('editHistoriaTitulo').value;
            dados.texto = document.getElementById('editHistoriaTexto').value;
            dados.destaque = document.getElementById('editHistoriaDestaque').value;
        }
        
        await db.collection('conteudo').doc(secao).set(dados, { merge: true });
        alert('✅ Salvo!');
        carregarConteudoSite();
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
}

async function adicionarProduto() {
    const nome = prompt('Nome:');
    const descricao = prompt('Descrição:');
    const preco = prompt('Preço:');
    if (nome && descricao && preco) {
        await db.collection('produtos').add({ nome, descricao, preco, icone: '🌿' });
        await carregarListasAdmin();
        carregarConteudoSite();
    }
}

async function adicionarMembro() {
    const nome = document.getElementById('novoMembroNome').value;
    const funcao = document.getElementById('novoMembroFuncao').value;
    if (!nome || !funcao) return alert('Preencha todos os campos!');
    
    let fotoUrl = 'https://via.placeholder.com/300';
    const fotoFile = document.getElementById('novoMembroFoto').files[0];
    
    if (fotoFile) {
        const formData = new FormData();
        formData.append('image', fotoFile);
        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) fotoUrl = data.data.url;
        } catch(e) {}
    }
    
    await db.collection('equipe').add({ nome, funcao, foto: fotoUrl });
    document.getElementById('novoMembroNome').value = '';
    document.getElementById('novoMembroFuncao').value = '';
    await carregarListasAdmin();
    carregarConteudoSite();
    alert('✅ Membro adicionado!');
}

async function adicionarPratica() {
    const titulo = prompt('Título:');
    const descricao = prompt('Descrição:');
    if (titulo && descricao) {
        await db.collection('sustentabilidade').add({ titulo, descricao, icone: '🌿' });
        await carregarListasAdmin();
        carregarConteudoSite();
    }
}

async function removerItem(colecao, id) {
    if (confirm('Remover?')) {
        await db.collection(colecao).doc(id).delete();
        await carregarListasAdmin();
        carregarConteudoSite();
    }
}

// Animação
function animarScroll() {
    document.querySelectorAll('.animar').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.85) {
            el.classList.add('visivel');
        }
    });
}
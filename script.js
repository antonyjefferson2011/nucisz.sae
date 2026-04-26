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

// ============= INICIALIZAÇÃO =============
document.addEventListener('DOMContentLoaded', function() {
    // Esconder loading após 2 segundos ou quando Firebase carregar
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
    }, 2000);
    
    // Iniciar carregamento do conteúdo
    carregarConteudoSite();
    configurarEventListeners();
});

function configurarEventListeners() {
    // Menu mobile
    document.getElementById('menuToggle').addEventListener('click', function() {
        document.getElementById('navLinks').classList.toggle('ativo');
    });

    // Fechar menu ao clicar em link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            document.getElementById('navLinks').classList.remove('ativo');
        });
    });

    // Modal de autenticação
    document.getElementById('btnLogin').addEventListener('click', () => {
        document.getElementById('authModal').classList.add('active');
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    });

    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('authModal').classList.remove('active');
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
            document.getElementById('authModal').classList.remove('active');
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

        const SECRET_ADMIN_CODE = 'nucisz2024admin';

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
            
            await db.collection('usuarios').doc(userCredential.user.uid).set({
                email: email,
                isAdmin: adminCode === SECRET_ADMIN_CODE,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            document.getElementById('authModal').classList.remove('active');
            alert('✅ Conta criada com sucesso!');
        } catch (error) {
            alert('❌ Erro: ' + error.message);
        }
    });

    // Logout
    document.getElementById('btnLogout').addEventListener('click', async () => {
        await auth.signOut();
    });

    // Fechar painel admin
    document.getElementById('closeAdmin').addEventListener('click', () => {
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
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

    // Formulário de contato
    document.getElementById('formContato').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const dados = {
            nome: document.getElementById('contatoNome').value,
            email: document.getElementById('contatoEmail').value,
            mensagem: document.getElementById('contatoMensagem').value,
            data: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('mensagens').add(dados);
            alert('✅ Mensagem enviada com sucesso! Entraremos em contato em breve.');
            document.getElementById('formContato').reset();
        } catch (error) {
            alert('❌ Erro ao enviar mensagem: ' + error.message);
        }
    });

    // Animação ao scroll
    window.addEventListener('scroll', animarAoScroll);
    animarAoScroll();
}

// ============= AUTENTICAÇÃO =============
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    
    if (user) {
        document.getElementById('btnLogin').style.display = 'none';
        document.getElementById('btnLogout').style.display = 'block';
        
        // Verificar se é admin
        try {
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            isAdmin = userDoc.exists && userDoc.data().isAdmin;
            
            if (isAdmin) {
                await carregarPainelAdmin();
            }
        } catch (error) {
            console.error('Erro ao verificar admin:', error);
            isAdmin = false;
        }
    } else {
        document.getElementById('btnLogin').style.display = 'block';
        document.getElementById('btnLogout').style.display = 'none';
        isAdmin = false;
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
    }
});

// ============= CARREGAR CONTEÚDO DO SITE =============
async function carregarConteudoSite() {
    try {
        // Carregar Home
        const homeDoc = await db.collection('conteudo').doc('home').get();
        if (homeDoc.exists) {
            document.getElementById('bannerTitulo').textContent = homeDoc.data().titulo || '🌿 Preservando Tradições, Cultivando o Futuro';
            document.getElementById('bannerSubtitulo').textContent = homeDoc.data().subtitulo || 'Transformamos a riqueza do babaçu em desenvolvimento sustentável';
        } else {
            // Criar documento padrão se não existir
            await db.collection('conteudo').doc('home').set({
                titulo: '🌿 Preservando Tradições, Cultivando o Futuro',
                subtitulo: 'Transformamos a riqueza do babaçu em desenvolvimento sustentável'
            });
        }

        // Carregar Sobre
        const sobreDoc = await db.collection('conteudo').doc('sobre').get();
        const gridSobre = document.getElementById('gridSobre');
        
        const dadosSobre = sobreDoc.exists ? sobreDoc.data() : {
            missao: 'Promover o desenvolvimento sustentável através da valorização do babaçu e das comunidades tradicionais.',
            visao: 'Ser referência em negócios sustentáveis que unem tradição, inovação e respeito à natureza.',
            valores: 'Sustentabilidade, respeito às tradições, empoderamento feminino, comércio justo e preservação da biodiversidade.'
        };
        
        if (!sobreDoc.exists) {
            await db.collection('conteudo').doc('sobre').set(dadosSobre);
        }

        gridSobre.innerHTML = `
            <div class="card animar">
                <div class="card-icone">🎯</div>
                <h3>Missão</h3>
                <p>${dadosSobre.missao}</p>
            </div>
            <div class="card animar">
                <div class="card-icone">👁️</div>
                <h3>Visão</h3>
                <p>${dadosSobre.visao}</p>
            </div>
            <div class="card animar">
                <div class="card-icone">💚</div>
                <h3>Valores</h3>
                <p>${dadosSobre.valores}</p>
            </div>
        `;

        // Carregar História
        const historiaDoc = await db.collection('conteudo').doc('historia').get();
        const dadosHistoria = historiaDoc.exists ? historiaDoc.data() : {
            titulo: 'As Guardiãs do Babaçu',
            texto: 'As quebradeiras de coco babaçu são mulheres guerreiras que há gerações mantêm viva a tradição de extrair o óleo e os subprodutos do babaçu.',
            destaque: 'Mais de 300 mil famílias dependem do babaçu. As quebradeiras protegem as palmeiras do desmatamento.'
        };

        if (!historiaDoc.exists) {
            await db.collection('conteudo').doc('historia').set(dadosHistoria);
        }

        document.getElementById('historiaTitulo').textContent = dadosHistoria.titulo;
        document.getElementById('historiaConteudo').innerHTML = `
            <div class="historia-imagem animar">
                <span style="font-size: 5rem;">👩‍🌾🌴</span>
                <p style="margin-top: 1rem; font-style: italic;">"Mulheres que transformam coco em dignidade"</p>
            </div>
            <div class="historia-texto animar">
                <p>${dadosHistoria.texto}</p>
                <div class="destaque">
                    <h3>🌍 Impacto Social e Ambiental</h3>
                    <p>${dadosHistoria.destaque}</p>
                </div>
                <p>O trabalho das quebradeiras vai além da economia: é um ato de resistência cultural, empoderamento feminino e conservação ambiental.</p>
            </div>
        `;

        // Carregar Produtos
        await carregarProdutos();

        // Carregar Equipe
        await carregarEquipe();

        // Carregar Sustentabilidade
        await carregarSustentabilidade();

        // Animar elementos visíveis
        setTimeout(animarAoScroll, 100);
        
    } catch (error) {
        console.error('Erro ao carregar conteúdo:', error);
        // Garantir que loading some mesmo com erro
        document.getElementById('loadingScreen').classList.add('hidden');
    }
}

async function carregarProdutos() {
    const gridProdutos = document.getElementById('gridProdutos');
    
    try {
        const snapshot = await db.collection('produtos').get();
        
        if (snapshot.empty) {
            // Criar produtos padrão
            const produtosPadrao = [
                { nome: 'Óleo de Babaçu Virgem', descricao: 'Extraído artesanalmente, rico em ácido láurico.', preco: '45,00', icone: '🥥' },
                { nome: 'Sabonete Natural', descricao: 'Hidratante e biodegradável.', preco: '18,00', icone: '🧼' },
                { nome: 'Artesanato Sustentável', descricao: 'Peças únicas feitas com fibras e cascas.', preco: '35,00', icone: '🧺' },
                { nome: 'Creme Hidratante', descricao: 'Com manteiga de babaçu e óleos essenciais.', preco: '52,00', icone: '💆‍♀️' }
            ];
            
            for (const prod of produtosPadrao) {
                await db.collection('produtos').add(prod);
            }
            
            // Recarregar
            const novoSnapshot = await db.collection('produtos').get();
            renderizarProdutos(novoSnapshot.docs);
        } else {
            renderizarProdutos(snapshot.docs);
        }
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        gridProdutos.innerHTML = '<p>Erro ao carregar produtos.</p>';
    }
}

function renderizarProdutos(docs) {
    const gridProdutos = document.getElementById('gridProdutos');
    
    gridProdutos.innerHTML = docs.map(doc => {
        const data = doc.data();
        return `
            <div class="produto-card animar">
                <div class="produto-imagem">${data.icone || '🌿'}</div>
                <div class="produto-info">
                    <h3>${data.nome}</h3>
                    <p>${data.descricao}</p>
                    <div class="produto-preco">R$ ${data.preco}</div>
                </div>
            </div>
        `;
    }).join('');
}

async function carregarEquipe() {
    const gridEquipe = document.getElementById('gridEquipe');
    
    try {
        const snapshot = await db.collection('equipe').get();
        
        if (snapshot.empty) {
            gridEquipe.innerHTML = '<p style="text-align:center;">Equipe em construção. Em breve apresentaremos nossos membros!</p>';
        } else {
            gridEquipe.innerHTML = snapshot.docs.map(doc => {
                const data = doc.data();
                return `
                    <div class="equipe-card animar">
                        <img src="${data.foto || 'https://via.placeholder.com/300'}" alt="${data.nome}" class="equipe-foto">
                        <div class="equipe-info">
                            <h3>${data.nome}</h3>
                            <p class="equipe-funcao">${data.funcao}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar equipe:', error);
        gridEquipe.innerHTML = '<p>Erro ao carregar equipe.</p>';
    }
}

async function carregarSustentabilidade() {
    const gridSustentabilidade = document.getElementById('gridSustentabilidade');
    
    try {
        const snapshot = await db.collection('sustentabilidade').get();
        
        if (snapshot.empty) {
            const praticasPadrao = [
                { titulo: 'Extrativismo Sustentável', descricao: 'Coleta que preserva as palmeiras.', icone: '🌱' },
                { titulo: 'Economia Circular', descricao: 'Aproveitamento total do coco.', icone: '♻️' },
                { titulo: 'Comércio Justo', descricao: 'Remuneração digna para comunidades.', icone: '👩‍👩‍👧‍👦' },
                { titulo: 'Preservação Florestal', descricao: 'Conservação de babaçuais nativos.', icone: '🌳' }
            ];
            
            for (const pratica of praticasPadrao) {
                await db.collection('sustentabilidade').add(pratica);
            }
            
            const novoSnapshot = await db.collection('sustentabilidade').get();
            renderizarSustentabilidade(novoSnapshot.docs);
        } else {
            renderizarSustentabilidade(snapshot.docs);
        }
    } catch (error) {
        console.error('Erro ao carregar sustentabilidade:', error);
        gridSustentabilidade.innerHTML = '<p>Erro ao carregar dados.</p>';
    }
}

function renderizarSustentabilidade(docs) {
    const gridSustentabilidade = document.getElementById('gridSustentabilidade');
    
    gridSustentabilidade.innerHTML = docs.map(doc => {
        const data = doc.data();
        return `
            <div class="card sustentabilidade-card animar">
                <div class="sustentabilidade-icone" style="font-size:3rem;">${data.icone || '🌿'}</div>
                <h3>${data.titulo}</h3>
                <p>${data.descricao}</p>
            </div>
        `;
    }).join('');
}

// ============= PAINEL ADMIN =============
async function carregarPainelAdmin() {
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

        // Listas
        await carregarListaProdutosAdmin();
        await carregarListaEquipeAdmin();
        await carregarListaPraticasAdmin();
        
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('mainContent').style.display = 'none';
    } catch (error) {
        console.error('Erro ao carregar painel admin:', error);
    }
}

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
        await carregarConteudoSite();
    } catch (error) {
        alert('❌ Erro ao salvar: ' + error.message);
    }
}

async function carregarListaProdutosAdmin() {
    const container = document.getElementById('listaProdutosAdmin');
    try {
        const snapshot = await db.collection('produtos').get();
        
        container.innerHTML = snapshot.docs.map(doc => `
            <div class="card" style="margin-bottom:1rem;">
                <h4>${doc.data().nome}</h4>
                <p>${doc.data().descricao}</p>
                <p><strong>R$ ${doc.data().preco}</strong></p>
                <button onclick="removerItem('produtos', '${doc.id}')" style="background:red;color:white;border:none;padding:0.5rem 1rem;border-radius:5px;cursor:pointer;">Remover</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function adicionarProduto() {
    const nome = prompt('Nome do produto:');
    const descricao = prompt('Descrição:');
    const preco = prompt('Preço (R$):');
    const icone = prompt('Emoji/Ícone (ex: 🥥):');
    
    if (nome && descricao && preco) {
        try {
            await db.collection('produtos').add({
                nome,
                descricao,
                preco,
                icone: icone || '🌿'
            });
            await carregarListaProdutosAdmin();
            await carregarConteudoSite();
            alert('✅ Produto adicionado!');
        } catch (error) {
            alert('❌ Erro: ' + error.message);
        }
    }
}

async function carregarListaEquipeAdmin() {
    const container = document.getElementById('listaEquipeAdmin');
    try {
        const snapshot = await db.collection('equipe').get();
        
        container.innerHTML = snapshot.docs.map(doc => `
            <div class="card" style="margin-bottom:1rem;display:flex;align-items:center;gap:1rem;">
                <img src="${doc.data().foto || 'https://via.placeholder.com/50'}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">
                <div style="flex:1;">
                    <h4>${doc.data().nome}</h4>
                    <p>${doc.data().funcao}</p>
                </div>
                <button onclick="removerItem('equipe', '${doc.id}')" style="background:red;color:white;border:none;padding:0.5rem 1rem;border-radius:5px;cursor:pointer;">Remover</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function adicionarMembro() {
    const nome = document.getElementById('novoMembroNome').value;
    const funcao = document.getElementById('novoMembroFuncao').value;
    const fotoFile = document.getElementById('novoMembroFoto').files[0];
    
    if (!nome || !funcao) {
        alert('Preencha nome e função!');
        return;
    }
    
    let fotoUrl = 'https://via.placeholder.com/300';
    
    if (fotoFile) {
        try {
            fotoUrl = await uploadImagem(fotoFile);
        } catch (error) {
            console.error('Erro upload:', error);
            alert('Erro ao fazer upload da foto. Usando placeholder.');
        }
    }
    
    try {
        await db.collection('equipe').add({
            nome,
            funcao,
            foto: fotoUrl
        });
        
        document.getElementById('novoMembroNome').value = '';
        document.getElementById('novoMembroFuncao').value = '';
        document.getElementById('novoMembroFoto').value = '';
        
        await carregarListaEquipeAdmin();
        await carregarConteudoSite();
        alert('✅ Membro adicionado!');
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
}

async function carregarListaPraticasAdmin() {
    const container = document.getElementById('listaPraticasAdmin');
    try {
        const snapshot = await db.collection('sustentabilidade').get();
        
        container.innerHTML = snapshot.docs.map(doc => `
            <div class="card" style="margin-bottom:1rem;">
                <h4>${doc.data().icone} ${doc.data().titulo}</h4>
                <p>${doc.data().descricao}</p>
                <button onclick="removerItem('sustentabilidade', '${doc.id}')" style="background:red;color:white;border:none;padding:0.5rem 1rem;border-radius:5px;cursor:pointer;">Remover</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function adicionarPratica() {
    const titulo = prompt('Título da prática:');
    const descricao = prompt('Descrição:');
    const icone = prompt('Emoji (ex: 🌱):');
    
    if (titulo && descricao) {
        try {
            await db.collection('sustentabilidade').add({
                titulo,
                descricao,
                icone: icone || '🌿'
            });
            await carregarListaPraticasAdmin();
            await carregarConteudoSite();
            alert('✅ Prática adicionada!');
        } catch (error) {
            alert('❌ Erro: ' + error.message);
        }
    }
}

async function removerItem(colecao, id) {
    if (confirm('Tem certeza que deseja remover?')) {
        try {
            await db.collection(colecao).doc(id).delete();
            await carregarPainelAdmin();
            await carregarConteudoSite();
            alert('✅ Item removido!');
        } catch (error) {
            alert('❌ Erro: ' + error.message);
        }
    }
}

// ============= UPLOAD DE IMAGEM =============
async function uploadImagem(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
        return data.data.url;
    } else {
        throw new Error('Falha no upload');
    }
}

// ============= ANIMAÇÕES =============
function animarAoScroll() {
    const elementos = document.querySelectorAll('.animar');
    
    elementos.forEach(elemento => {
        const posicaoTopo = elemento.getBoundingClientRect().top;
        const alturaTela = window.innerHeight;
        
        if (posicaoTopo < alturaTela * 0.85) {
            elemento.classList.add('visivel');
        }
    });
}

// ============= SCROLL SUAVE =============
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const destino = document.querySelector(this.getAttribute('href'));
        if (destino) {
            destino.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
# OndeTá?  🐾

O **OndeTá?** é uma plataforma projetada para conectar pessoas em prol do resgate e localização de animais perdidos (através de um feed interativo e geolocalização em tempo real). Este repositório é a versão responsiva do OndeTá?, feita para a disciplina de Programação para Dispositivos Móveis e Sem Fio. O foco é o uso no celular, com três funcionalidades: cadastro e login, publicação de relatos e feed de postagens. 
>
> Site publicado: https://achmnzz.github.io/OndeTa-responsivo/

<br />

## Tecnologias e Ferramentas

### **Back-end**
* **Linguagem:** Python
* **Banco de Dados:** PostgreSQL
* **ORM:** SQLAlchemy (Acesso a dados)
* **Validação e Serialização::** Marshmallow

### **Front-end (Web)**
* **Framework:** React + Vite
* **Estilização:** CSS puro, mobile-first (um arquivo de estilo por tela/componente)
* **Estado Global:** Context API
* **Endereços:** Nominatim (OpenStreetMap), para converter localização em endereço

<br />

##  Estrutura do Projeto

### Root

```bash
OndeTa/
├── frontend/     # Aplicação Web (React)
├── backend/      # API REST (Python)
├── docs/         # Diagramas e documentação técnica
└── README.md
```

<details><summary><strong>Front-end (Web)</strong></summary>

```bash
frontend/
├── public/              # manifesto web e ícones (tela inicial do celular)
├── src/
│   ├── assets/          # logotipo (WebP)
│   ├── components/      # componentes reutilizáveis
│   │   ├── LocationPicker/  # escolha do local (GPS ou endereço digitado)
│   │   │   ├── index.jsx
│   │   │   └── styles.css
│   │   └── Navbar/          # cabeçalho + barra de abas inferior no celular
│   │       ├── index.jsx
│   │       └── styles.css
│   │
│   ├── pages/           # páginas da aplicação (index.jsx + styles.css)
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── Feed/        # feed e "Minhas postagens"
│   │   ├── CreatePost/  # criar e editar postagem
│   │   ├── PostDetail/
│   │   └── Profile/
│   │
│   ├── hooks/           # lógica reutilizável
│   │   ├── useAuth.js
│   │   └── useSlowHint.js   # aviso de servidor "acordando"
│   │
│   ├── context/         # estado global (sessão)
│   │   ├── AuthContext.jsx
│   │   └── auth-context.js
│   │
│   ├── services/        # comunicação com APIs
│   │   ├── api.js           # API do OndeTa? (axios)
│   │   ├── apiErrors.js     # mensagens de erro
│   │   └── geocoding.js     # Nominatim: endereço <-> coordenadas
│   │
│   ├── utils/           # helpers
│   │   └── compressImage.js # compressão de fotos antes do envio
│   │
│   ├── routes/          # configuração de rotas
│   │   └── AppRoutes.jsx
│   │
│   ├── index.css        # base global (variáveis, toque, foco)
│   ├── App.jsx
│   └── main.jsx
│
├── index.html
├── package.json
└── vite.config.js
```
</details>

<details><summary><strong>Back-end</strong></summary>

```bash
backend/
├── app/
│   ├── routes/              # endpoints
│   │   └── ...
│   ├── controllers/         # interface HTTP
│   │   └── ...
│   ├── services/            # regras de negócio
│   │   └── ...
│   ├── repositories/        # acesso ao banco
│   │   └── ...
│   ├── models/              # ORM (SQLAlchemy)
│   │   └── ...
│   ├── schemas/             # validação (marshmallow)
│   │   └── ...
│   ├── utils/               # compressão de imagens
│   │   └── ...              # acesso a storage
│   ├── __init__.py
│   ├── config.py
│   └── extensions.py        # db, jwt, etc
│
├── migrations/              # alembic
├── Dockerfile               # imagem usada no Render
├── run.py
├── requirements.txt
└── .env
```
</details>
<br />

## Como Executar

### **Backend**
```bash
cd backend

pip install -r requirements.txt

python run.py
```
### **Frontend**
```bash
cd frontend

npm install

npm run dev
```

<br />

---

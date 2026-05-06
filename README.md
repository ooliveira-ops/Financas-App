# 💰 Finanças Filipe

App pessoal de controle financeiro — receitas, despesas, assinaturas e resumo mensal.

Feito em **React + Vite + Tailwind**, com **PWA** (instalável no celular) e dados salvos no navegador (localStorage).

---

## 🚀 OPÇÃO 1 — Rodar localmente no seu computador

### Pré-requisitos
- **Node.js** instalado (versão 18 ou superior). Baixe em: https://nodejs.org

### Passo a passo

1. **Abra o terminal** dentro da pasta do projeto.

2. **Instale as dependências** (só na primeira vez):
   ```bash
   npm install
   ```
   *(demora 1-2 minutos)*

3. **Inicie o app**:
   ```bash
   npm run dev
   ```

4. Abra o navegador no endereço que aparecer (geralmente `http://localhost:5173`).

5. Pra parar: aperte `Ctrl+C` no terminal.

---

## 🌐 OPÇÃO 2 — Hospedar online grátis (Vercel)

Assim você terá um link tipo `financas-filipe.vercel.app` que funciona em qualquer lugar.

### Método mais fácil: pelo site (sem terminal)

1. Crie uma conta grátis em **https://vercel.com** (pode entrar com GitHub, Google ou e-mail).

2. **Compacte a pasta do projeto inteira em um .zip** (clique direito → "Compactar"). 
   ⚠️ Importante: NÃO inclua a pasta `node_modules` se ela existir.

3. Vá em **Vercel → Add New → Project → Import**.

4. Procure a opção **"Deploy without Git"** ou simplesmente arraste o `.zip` na tela inicial.

5. Aguarde uns 1-2 minutos. Pronto! Vai aparecer o link do seu app.

### Método com GitHub (recomendado para atualizações futuras)

1. Crie conta em https://github.com (se não tiver).
2. Crie um repositório novo (pode ser privado).
3. Suba os arquivos do projeto pra esse repositório.
4. Em https://vercel.com → **Add New → Project** → escolha o repositório.
5. Vercel detecta automático que é Vite, é só clicar em **Deploy**.

Toda vez que você mudar algo e enviar pro GitHub, o site atualiza sozinho.

---

## 🌐 OPÇÃO 2b — Hospedar no Netlify (alternativa ao Vercel)

1. Crie conta em https://netlify.com.
2. Vá em **Sites → Add new site → Deploy manually**.
3. Arraste a pasta `dist/` que aparece após rodar `npm run build`.
4. Pronto! Você terá um link `financas-filipe.netlify.app`.

---

## 📱 OPÇÃO 3 — Instalar como app no celular (PWA)

Depois de hospedar online (Opção 2), você pode instalar como app de verdade:

### No Android (Chrome)
1. Abra o link do seu site no Chrome.
2. Use o app por uns segundos.
3. Vai aparecer um banner "Adicionar à tela inicial" — toque.
4. Se não aparecer: menu (3 pontinhos) → **Adicionar à tela inicial** ou **Instalar app**.
5. Pronto! Aparece o ícone na tela inicial e abre em tela cheia, sem barra do navegador.

### No iPhone (Safari)
1. Abra o link no **Safari** (precisa ser Safari, não Chrome).
2. Toque no botão de **compartilhar** (quadrado com seta pra cima).
3. Role pra baixo → **Adicionar à Tela de Início**.
4. Toque em **Adicionar**.
5. O ícone aparece na tela inicial como um app normal.

---

## 💾 Sobre os dados

- Tudo é salvo no **localStorage do navegador** (não vai pra nuvem).
- Os dados ficam no aparelho/navegador onde você os digitou.
- Se limpar o cache do navegador, perde os dados.
- Se quiser ter os dados em vários dispositivos, seria preciso adicionar um backend — me avise se quiser fazer isso depois.

---

## 🛠️ Estrutura do projeto

```
financas-filipe/
├── public/              # ícones e assets estáticos
├── src/
│   ├── App.jsx          # código principal do app
│   ├── main.jsx         # entry point
│   └── index.css        # estilos base
├── index.html
├── package.json         # dependências
├── vite.config.js       # config Vite + PWA
├── tailwind.config.js
├── vercel.json          # config Vercel
└── netlify.toml         # config Netlify
```

---

## 🎨 Recursos do app

- Frase motivacional muda diariamente
- Resumo automático do mês anterior aparece todo dia 5
- Gráfico de pizza por categoria
- Categorias customizáveis (cor + ícone)
- Alerta visual pra assinaturas vencendo em ≤3 dias
- Tema escuro premium
- Totalmente responsivo (mobile e desktop)

---

Created by **Filipe Oliveira** 💛

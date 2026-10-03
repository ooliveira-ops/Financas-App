# check=skip=SecretsUsedInArgOrEnv
# A anon key do Supabase é pública por desenho (vai no JS servido ao navegador;
# quem protege os dados é o RLS), então passá-la por ARG não expõe segredo.

# Build a partir da raiz do repositório:
#   docker build -f deploy/docker/Dockerfile -t financas .

# Stage 1 — Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

# O Vite embute as VITE_* no bundle durante o build, e o .dockerignore barra o
# .env.local: sem estes --build-arg a imagem sobe e o app abre em branco.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_WHATSAPP_NUMERO

COPY . .
RUN npm run build

# Stage 2 — Serve
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Mundial en Vivo

Web para seguir partidos, tabla por grupos y noticias automaticas del Mundial 2026.

## Abrir localmente

La web usa un proxy Node para consumir football-data.org sin exponer el token en el navegador.

```bash
export FOOTBALL_DATA_TOKEN="pega_tu_token_aqui"
npm start
```

Luego abre:

```text
http://localhost:5173
```

## Publicar para que sea consumible

Opcion recomendada: Render o Railway, porque esta web necesita un servidor Node.

Variables necesarias:

```text
FOOTBALL_DATA_TOKEN=tu_token_de_football_data
```

Comandos de despliegue:

```text
Build command: npm install
Start command: npm start
```

No subas el token en `config.js`. En produccion debe vivir como variable de entorno.

<iframe width="768" height="432" src="https://miro.com/app/live-embed/uXjVIo83pAE=/?embedMode=view_only_without_ui&moveToViewport=-2167,-1117,4398,2098&embedId=799500446367" frameborder="0" scrolling="no" allow="fullscreen; clipboard-read; clipboard-write" allowfullscreen></iframe>

# Run project as production (ignore docker compose override for dev)

`docker compose -f docker-compose.yml up --build`

# Run project as dev (watch html and ts files)

In the fronted folder:
`npm run dev`

In the root folder (finde the compose dev file in Transcendance repo)
`docker compose -f docker-compose.dev.yml up`

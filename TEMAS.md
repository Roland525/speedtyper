# Aizstāvēšanas tēmas

Šis fails palīdz sagatavoties projekta aizstāvēšanai. Te ir īsi paskaidrots, kuras teorijas tēmas ir redzamas projektā, kur tās parādīt kodā un ko teikt, ja tēma projektā netiek izmantota.

## Projekta īss apraksts

Typing King ir tīmekļa lietotne drukāšanas ātruma trenēšanai.

Lietotājs var:

- izvēlēties spēles laiku: 15, 30, 60 vai 120 sekundes;
- izvēlēties valodu: EN, RU vai LV;
- rakstīt tekstu un redzēt WPM, precizitāti un kļūdas;
- reģistrēties un pieslēgties;
- saglabāt rezultātu datubāzē;
- apskatīt līderu tabulu.

Projekta daļas:

- `frontend/` - React lietotāja saskarne;
- `backend/` - FastAPI serveris un REST API;
- `docker-compose.yml` - lokāla PostgreSQL datubāze Docker konteinerā.

## Programmēšanas tehnoloģijas

### Funkcionālās un nefunkcionālās prasības

Ir projektā.

Funkcionālās prasības nosaka, ko sistēma dara:

- lietotājs var spēlēt typing test;
- lietotājs var reģistrēties;
- lietotājs var pieslēgties;
- sistēma aprēķina WPM, precizitāti un kļūdas;
- sistēma saglabā rezultātus;
- sistēma rāda līderu tabulu.

Nefunkcionālās prasības nosaka, kā sistēma darbojas:

- parole tiek glabāta hash veidā, nevis kā parasts teksts;
- datubāzes vaicājumi tiek veidoti ar SQLAlchemy ORM;
- frontend un backend ir atdalīti;
- backend pārbauda ievades datus ar Pydantic;
- datubāze darbojas atsevišķā Docker konteinerā.

Kur rādīt:

- `frontend/src/App.jsx` - spēles loģika;
- `backend/main.py` - API endpoints;
- `backend/auth.py` - paroles hash un JWT;
- `backend/schemas.py` - datu validācija.

### SDLC

Ir iespējams izskaidrot pēc projekta izstrādes soļiem.

SDLC posmi šajā projektā:

- analīze - tika noteikts, ka vajag typing test, lietotājus un leaderboard;
- dizains - tika izvēlēta frontend/backend/datubāzes struktūra;
- izstrāde - tika izveidots React frontend un FastAPI backend;
- testēšana - pārbaudīts `npm run lint`, `npm run build`, API var pārbaudīt ar `/docs`;
- ieviešana - lokāli projekts tiek palaists ar Docker, backend un frontend;
- uzturēšana - kodu var labot un papildināt, izmantojot Git.

### Programmatūras prasību specifikācijas struktūra

Daļēji ir projektā.

Pilns SRS dokuments nav atsevišķi rakstīts, bet tā saturu var izskaidrot pēc projekta:

- ievads - Typing King mērķis;
- sistēmas apraksts - frontend, backend, datubāze;
- funkcionālās prasības - spēle, login, rezultāti, leaderboard;
- nefunkcionālās prasības - drošība, validācija, datubāze, Docker;
- lietotāju lomas - viesis un reģistrēts lietotājs.

### Programmatūras prasību specifikācijas analīze

Ir iespējams izskaidrot.

Prasības ir pārbaudāmas:

- ja lietotājs pabeidz spēli, rezultāts tiek aprēķināts;
- ja lietotājs nav pieslēdzies, rezultāts netiek saglabāts;
- ja lietotājs ir pieslēdzies, rezultāts tiek saglabāts;
- leaderboard rāda rezultātus pēc izvēlētā laika un valodas.

### Programmatūras arhitektūras patterni

Ir projektā.

Projekts ir sadalīts slāņos:

- frontend slānis - lietotāja saskarne;
- API slānis - FastAPI endpoints;
- datu slānis - SQLAlchemy modeļi un PostgreSQL.

Kur rādīt:

- `frontend/src/api.js` - frontend sazinās ar backend;
- `backend/main.py` - backend API;
- `backend/models.py` - datubāzes modeļi.

### Arhitektūras paraugi

Ir daļēji.

Šis projekts nav mikroservisu sistēma. Tas ir mazs client-server projekts:

- frontend ir klients;
- backend ir serveris;
- datubāze glabā datus.

Var teikt, ka tas ir vienkāršs monolīts backend pusē un atsevišķs frontend. MVC nav realizēts pilnīgi klasiskā veidā, bet ir līdzīga doma:

- Model - `backend/models.py`;
- Controller - `backend/main.py`;
- View - `frontend/src/App.jsx`.

### Git - ievads

Ir projektā.

Git tiek izmantots versiju kontrolei. Ar Git var redzēt, kādi faili mainīti, saglabāt commit un atgriezties pie iepriekšējām versijām.

Noderīgas komandas:

```powershell
git status
git add .
git commit -m "message"
```

### Git - iekšējā struktūra

Var izskaidrot teorētiski.

Git glabā:

- commit - konkrēts projekta stāvoklis;
- branch - atsevišķa izstrādes līnija;
- blob - faila saturs;
- tree - mapju un failu struktūra commit brīdī.

Projektā tas nav redzams kā parasts kods, jo tā ir Git iekšējā darbība.

### Gitflow un GitHub Flow

Var izskaidrot teorētiski.

Šim mazajam projektam pietiek ar vienkāršu GitHub Flow:

- ir galvenais branch;
- izmaiņas var taisīt atsevišķā branch;
- pēc pārbaudes tās apvieno ar galveno branch.

Gitflow ir sarežģītāks, jo izmanto vairāk branch: `develop`, `feature`, `release`, `hotfix`.

### Git reset/revert

Var izskaidrot teorētiski.

- `git reset` pārvieto branch uz citu commit un var noņemt izmaiņas;
- `git revert` izveido jaunu commit, kas atceļ vecā commit izmaiņas.

Aizstāvēšanā drošāk teikt, ka koplietotā projektā labāk lietot `revert`, jo tas neslēpj vēsturi.

### API

Ir projektā.

API ir veids, kā frontend sazinās ar backend. Frontend izmanto `fetch`, lai sūtītu pieprasījumus uz backend.

Kur rādīt:

- `frontend/src/api.js`;
- `backend/main.py`.

### SQLAlchemy

Ir projektā.

SQLAlchemy tiek izmantots kā ORM, lai Python kodā strādātu ar datubāzi caur objektiem, nevis rakstītu visu SQL ar roku.

Kur rādīt:

- `backend/db.py` - savienojums ar datubāzi;
- `backend/models.py` - tabulu apraksts;
- `backend/main.py` - vaicājumi ar `select`.

### Konteinerizācijas rīki - Docker

Ir projektā.

Docker tiek izmantots PostgreSQL datubāzei. Tas nozīmē, ka datubāzi var palaist vienādi uz dažādiem datoriem.

Kur rādīt:

- `docker-compose.yml`.

Komanda:

```powershell
docker compose up -d
```

### REST API

Ir projektā.

Backend izmanto REST pieeju un HTTP metodes:

- `GET /health` - pārbauda serveri;
- `POST /api/auth/register` - reģistrācija;
- `POST /api/auth/login` - pieslēgšanās;
- `GET /api/users/me` - pašreizējais lietotājs;
- `POST /api/results` - rezultāta saglabāšana;
- `GET /api/leaderboard` - līderu tabula.

Kur rādīt:

- `backend/main.py`;
- `http://127.0.0.1:8000/docs`.

### Programmatūras izstrādes pārvaldīšanas rīki

Projektā nav speciāla rīka kā Jira vai Trello.

Var teikt:

- mazam mācību projektam pietika ar Git un dokumentāciju;
- lielākā projektā varētu izmantot Jira, Trello vai GitHub Issues uzdevumu plānošanai.

### Ārējie API

Projektā netiek izmantots ārējs API.

Var teikt:

- projekts izmanto savu REST API;
- ārēju servisu API, piemēram, Google vai maksājumu API, šeit nav;
- tas samazina sarežģītību un atkarību no citiem servisiem.

### DNS tunelis

Projektā netiek izmantots.

Var teikt:

- DNS tunelis ir atsevišķa tīkla tēma;
- šajā projektā lokālais frontend sazinās ar lokālo backend caur HTTP;
- DNS tunelis nav vajadzīgs typing test lietotnei.

### DNS tuneļa konteinerizācija

Projektā netiek izmantots.

Var teikt:

- Docker šeit tiek izmantots tikai PostgreSQL datubāzei;
- DNS tuneļa konteiners nav nepieciešams.

### CI/CD

Projektā nav CI/CD pipeline faila.

Var teikt:

- lokāli tiek pārbaudīts `npm run lint` un `npm run build`;
- lielākā projektā to varētu automatizēt ar GitHub Actions;
- CI pārbaudītu kodu pēc katra commit;
- CD automātiski izvietotu projektu serverī.

### Pipelines

Projektā nav atsevišķas pipeline konfigurācijas.

Var teikt:

- pipeline būtu automātisku soļu ķēde: install, lint, build, test, deploy;
- šajā projektā šos soļus var palaist manuāli.

### Git secrets

Projektā netiek izmantots `git-secrets` rīks.

Tomēr ir pareiza doma:

- `.env` faili ir ignorēti ar `.gitignore`;
- piemēra konfigurācija ir `.env.example`;
- reālās paroles un `SECRET_KEY` nedrīkst likt publiskā Git repozitorijā.

Kur rādīt:

- `.gitignore`;
- `backend/.env.example`;
- `frontend/.env.example`.

## Datu bāzu programmēšana

### SQL sintakse

Ir netieši.

SQL netiek rakstīts kā raw SQL teksts, bet SQLAlchemy ģenerē SQL vaicājumus. Piemēram, Python kodā:

```python
select(User).where(User.username == data.username)
```

Tas atbilst SQL idejai:

```sql
SELECT * FROM users WHERE username = ...
```

Kur rādīt:

- `backend/main.py`.

### SQL pamati

Ir projektā.

Projektā ir:

- tabulas `users` un `results`;
- ierakstu pievienošana ar `db.add`;
- datu saglabāšana ar `db.commit`;
- datu atlase ar `select`;
- filtrēšana ar `where`;
- kārtošana ar `order_by`.

### Tabulas pievienošana (joins)

Ir projektā.

Leaderboard savieno `users` un `results`, lai parādītu lietotājvārdu kopā ar rezultātu.

Kur rādīt:

- `backend/main.py`, funkcija `leaderboard`;
- tur ir `.join(Result, Result.user_id == User.id)`.

### Datu bāzes normalizācija

Ir projektā.

Dati ir sadalīti divās tabulās:

- `users` glabā lietotāja informāciju;
- `results` glabā spēļu rezultātus.

Rezultātu tabulā nav atkārtoti glabāts lietotājvārds vai e-pasts. Tur ir tikai `user_id`, kas norāda uz lietotāju. Tas samazina datu dublēšanos.

### DB normālās formas

Ir iespējams izskaidrot.

Projektā ir vienkārša normalizēta struktūra:

- 1NF - katrā laukā ir viena vērtība;
- 2NF - dati ir atkarīgi no tabulas primārās atslēgas;
- 3NF - lietotāja dati nav dublēti rezultātu tabulā.

Kur rādīt:

- `backend/models.py`.

### Indeksi un identifikatori

Ir projektā.

Identifikatori:

- `User.id`;
- `Result.id`;
- `Result.user_id`.

Indeksi:

- `username` un `email` ir unikāli un indeksēti;
- `user_id` ir indeksēts;
- leaderboard ir atsevišķs indekss pēc `mode_seconds`, `language`, `wpm`, `accuracy`, `created_at`.

Kur rādīt:

- `backend/models.py`.

### Transakcijas izolācijas līmenis

Ir projektā.

Datubāzes izolācijas līmenis ir konfigurējams:

```python
DB_ISOLATION_LEVEL = os.getenv("DB_ISOLATION_LEVEL", "READ COMMITTED")
```

Kur rādīt:

- `backend/db.py`.

Var teikt, ka `READ COMMITTED` nozīmē, ka transakcija redz tikai apstiprinātus datus.

### ACID principi

Ir projektā.

ACID var izskaidrot ar `db.commit()` un `db.rollback()`:

- Atomicity - izmaiņas tiek saglabātas pilnībā vai netiek saglabātas;
- Consistency - datubāzes ierobežojumi palīdz saglabāt pareizus datus;
- Isolation - izolācijas līmenis kontrolē transakciju ietekmi;
- Durability - pēc `commit` dati paliek PostgreSQL datubāzē.

Kur rādīt:

- `backend/db.py`;
- `backend/main.py`.

### Upsert

Projektā netiek izmantots.

Var teikt:

- reģistrācijā nav upsert;
- sistēma vispirms pārbauda, vai lietotājs jau eksistē;
- ja eksistē, atgriež kļūdu `409`;
- ja neeksistē, izveido jaunu lietotāju.

Kur rādīt:

- `backend/main.py`, funkcija `register`.

### SQL injekcijas

Ir apskatāms projektā.

Projektā SQL injection risks ir mazāks, jo:

- netiek salīmēti SQL vaicājumi ar string konkatenāciju;
- tiek izmantots SQLAlchemy ORM;
- ievades dati tiek validēti ar Pydantic;
- leaderboard parametri tiek pārbaudīti ar `validate_game_params`.

Kur rādīt:

- `backend/main.py`;
- `backend/schemas.py`.

### SQL vaicājumu integrācija Python kodā

Ir projektā.

Python kodā tiek izmantots SQLAlchemy:

- `select(User)`;
- `select(User.username, Result.wpm, Result.accuracy, Result.created_at)`;
- `db.add(...)`;
- `db.commit()`;
- `db.refresh(...)`.

Kur rādīt:

- `backend/main.py`.

### Datu drošība datubāzes kontekstā

Ir daļēji.

Projektā ir:

- paroles netiek glabātas plain text, tās tiek hashotas ar bcrypt;
- autentifikācijai tiek izmantots JWT;
- reālie noslēpumi jāglabā `.env`, nevis kodā;
- datiem ir validācija ar Pydantic;
- datubāzē ir `unique`, `foreign key` un `check` ierobežojumi.

Projektā nav:

- datubāzes šifrēšanas;
- automātisku backup;
- lietotāju lomu sistēmas datubāzes līmenī.

Kur rādīt:

- `backend/auth.py`;
- `backend/models.py`;
- `backend/.env.example`.

### ORM

Ir projektā.

ORM sasaista Python klases ar datubāzes tabulām.

Piemērs:

- klase `User` atbilst tabulai `users`;
- klase `Result` atbilst tabulai `results`.

Kur rādīt:

- `backend/models.py`.

### SQL PL

Projektā netiek izmantots.

Var teikt:

- SQL PL ir procedurāla loģika datubāzē;
- šajā projektā biznesa loģika atrodas backend Python kodā;
- tāpēc SQL PL nebija nepieciešams.

### SQL PL - algoritmu realizācija

Projektā netiek izmantots.

Var teikt:

- algoritmi, piemēram, WPM un accuracy aprēķins, ir frontend pusē;
- datubāze šeit galvenokārt glabā un atlasa datus.

Kur rādīt:

- `frontend/src/App.jsx`, funkcija `calculateStats`.

### PL SQL - procedūras, funkcijas un triggeri

Projektā netiek izmantots.

Var teikt:

- procedūras, funkcijas un triggeri būtu vajadzīgi sarežģītākai datubāzes loģikai;
- šajā projektā pietiek ar FastAPI endpoints un SQLAlchemy ORM;
- automātiska darbība datubāzē netiek veikta ar triggeriem.

## Īss stāstījums aizstāvēšanai

Var teikt šādi:

> Mans projekts ir Typing King - tīmekļa lietotne drukāšanas ātruma trenēšanai. Frontend ir veidots ar React un Vite, backend ar Python FastAPI, bet datubāze ir PostgreSQL Docker konteinerā. Lietotājs var spēlēt typing test, reģistrēties, pieslēgties un saglabāt rezultātu. Backend nodrošina REST API, bet datubāzes darbam izmanto SQLAlchemy ORM. Dati ir normalizēti divās galvenajās tabulās: users un results. Drošībai paroles tiek hashotas, bet aizsargātie endpoints izmanto JWT token.

## Tēmas, kuras projektā tiešām ir vissvarīgākās

Ja aizstāvēšanā ir maz laika, vispirms runā par šīm:

- REST API;
- SQLAlchemy un ORM;
- Docker;
- datubāzes normalizācija;
- indexes un foreign key;
- SQL injection aizsardzība;
- JWT un password hashing;
- functional/non-functional requirements;
- SDLC;
- client-server arhitektūra.

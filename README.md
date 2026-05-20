Rolands Timonovs, Artemijs Stanko

Tīmekļa lietotne “Typing King” ir paredzēta lietotāja drukāšanas ātruma un precizitātes trenēšanai.

Lietotnē ir iespējams izvēlēties spēles režīmu (15, 30, 60 vai 120 sekundes) un valodu (EN, RU, LV). Spēles laikā lietotājs ievada parādīto tekstu, bet pēc spēles tiek aprēķināti un parādīti rezultāti:

WPM (vārdi minūtē),
precizitāte (%),
kļūdu skaits,
kopējais ievadīto simbolu skaits,
pareizi ievadīto simbolu skaits.

Reģistrētiem lietotājiem rezultāti tiek automātiski saglabāti datubāzē pēc katras spēles. Lietotnē ir pieejama publiska līderu tabula, kurā redzami labākie rezultāti pēc izvēlētā režīma un valodas.

Izmantotais tehnoloģiju steks
Frontend daļa:

React

JavaScript

CSS

Backend daļa:

Python + FastAPI - servera un REST API izstrādei

JWT autentifikācija - lietotāju autorizācijai

SQLAlchemy - darbam ar datubāzi

Pydantic - datu validācijai

Datu bāze:

PostgreSQL - lietotāju un rezultātu glabāšanai (palaista caur Docker Compose)

Backend realizācija

Projektā tiek izmantots atsevišķs backend serveris, jo:

ir nepieciešama lietotāju reģistrācija un autorizācija;

rezultāti jāsaglabā drošā datubāzē;

jānodrošina līderu tabula;

dati nedrīkst būt atkarīgi tikai no pārlūkprogrammas LocalStorage.

Backend nodrošina REST API, ar kuru frontend daļa sazinās, izmantojot HTTP pieprasījumus.

Galvenie API endpoints

Autentifikācija:

POST /api/auth/register - lietotāja reģistrācija

POST /api/auth/login - lietotāja pieteikšanās

Lietotāja dati:

GET /api/users/me - pašreizējā lietotāja profils

Spēle un rezultāti:

GET /api/game/config - pieejamie režīmi un valodas

POST /api/results - spēles rezultāta saglabāšana

Līderu tabula:

GET /api/leaderboard - labāko rezultātu saraksts pēc režīma un valodas

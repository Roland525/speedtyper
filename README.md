Rolands Timonovs, Artemijs Stanko
Tiks izstrādāta tīmekļa lietotne “Typing King”, kas paredzēta lietotāja drukāšanas ātruma un precizitātes trenēšanai. Lietotne darbosies līdzīgi kā Monkeytype / Typing Monkey, bet ar paplašinātu funkcionalitāti un lietotāju kontiem.

Lietotnē būs iespējams izvēlēties dažādus spēles režīmus (30, 60 un 120 sekundes) un valodu (EN, RU, LV). Spēles laikā lietotājs ievada parādīto tekstu, bet pēc spēles tiek aprēķināti un parādīti rezultāti:

WPM (vārdi minūtē),

precizitāte (%),

kļūdu skaits,

kopējais ievadīto simbolu skaits,

pareizi ievadīto simbolu skaits.

Reģistrētiem lietotājiem visi rezultāti tiek saglabāti datubāzē, lai viņi varētu apskatīt savu progresu, statistiku un labākos sasniegumus. Lietotnē būs pieejama arī publiska līderu tabula, kurā redzami labākie rezultāti pēc izvēlētā režīma un valodas.

Lietotnes saskarne būs moderna un adaptīva, ar iespēju pārslēgties starp tumšo un gaišo tēmu. Lietotne darbosies kā Single Page Application (SPA), kur frontend un backend ir atdalīti.

Izmantotais tehnoloģiju steks

Frontend daļa:

React + Vite — lietotāja saskarnes izstrādei

JavaScript — lietotnes loģikai

CSS / Tailwind CSS — dizainam un adaptivitātei

Chart.js / Recharts — statistikas grafiku attēlošanai

Backend daļa:

Python + FastAPI — servera un REST API izstrādei

JWT autentifikācija — lietotāju autorizācijai

SQLAlchemy — darbam ar datubāzi

Datu bāze:

PostgreSQL — lietotāju, rezultātu un spēles datu glabāšanai

Backend realizācija

Atšķirībā no vienkāršām client-side lietotnēm, projektā tiks izmantots atsevišķs backend serveris, jo:

ir nepieciešama lietotāju reģistrācija un autorizācija;

rezultāti jāsaglabā drošā datubāzē;

jānodrošina līderu tabula un statistika;

dati nedrīkst būt atkarīgi tikai no pārlūkprogrammas LocalStorage.

Backend nodrošinās REST API, ar kuru frontend daļa sazināsies, izmantojot HTTP pieprasījumus.

Galvenie API galapunkti (endpoints)

Autentifikācija:

POST /api/auth/register — lietotāja reģistrācija

POST /api/auth/login — lietotāja pieteikšanās

POST /api/auth/logout — izrakstīšanās no sistēmas

Lietotāja dati:

GET /api/users/me — pašreizējā lietotāja profils

GET /api/users/me/stats — lietotāja statistika

Spēle un rezultāti:

GET /api/game/config — pieejamie režīmi un valodas

GET /api/wordsets/random — nejaušs teksts drukāšanas testam

POST /api/results — spēles rezultāta saglabāšana

GET /api/results/my — lietotāja rezultātu vēsture

Līderu tabula:

GET /api/leaderboard — labāko rezultātu saraksts

1. Rolands Timonovs, Artemijs Staņko
2. Tiks izstrādāta tīmekļa lietotne “Typing Speed Game”, kas paredzēta lietotāja drukāšanas ātruma un precizitātes trenēšanai.
Lietotne ļaus izvēlēties dažādus spēles režīmus (30, 60 un 120 sekundes), valodu (EN, RU, LV), kā arī pēc spēles parādīs rezultātus:
WPM (vārdi minūtē)
precizitāti (%)
kļūdu skaitu
kopējo ievadīto simbolu daudzumu
Rezultāti tiks saglabāti lokāli pārlūkprogrammā, lai lietotājs varētu redzēt savu progresu un statistiku.
Lietotnei būs moderna, adaptīva saskarne ar tumšo un gaišo tēmu.
3. Stack: 
React + Vite — lietotāja saskarnes izstrādei
JavaScript — lietotnes loģikai
CSS / Tailwind — dizainam un adaptivitātei
LocalStorage — datu saglabāšanai pārlūkā
Chart.js vai Recharts — statistikas grafikiem

Backend realizācija:
Šajā projektā atsevišķs servera backend netiks izmantots, jo:
lietotne ir mācību tipa un darbojas lokāli
visi dati (rezultāti, iestatījumi, vēsture) tiek glabāti LocalStorage
tas vienkāršo izstrādi un ļauj pilnībā fokusēties uz frontend funkcionalitāti React vidē
Tādējādi aplikācija darbojas kā client-side SPA (Single Page Application) bez ārēja servera.

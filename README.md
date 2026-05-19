# Estario

Estario este o platforma MVP pentru anunturi imobiliare, construita ca proiect de disertatie. Aplicatia permite vizitatorilor sa caute anunturi aprobate, utilizatorilor autentificati sa publice si sa administreze propriile anunturi, iar administratorilor sa modereze publicarea acestora.

Interfata este in limba romana si urmareste un flux simplu: utilizatorul trimite un anunt, administratorul il aproba sau il respinge, iar doar anunturile aprobate devin vizibile public.

## Tehnologii

- Frontend: React, Vite, React Router, Axios, Leaflet, lucide-react
- Backend: Node.js, Express, Prisma, PostgreSQL
- Autentificare: JWT si bcrypt
- Validare: Zod
- Upload imagini: Multer
- Harti: Leaflet cu OpenStreetMap
- Grafice admin: AG Charts
- AI optional: Gemini sau OpenAI pentru cautare, descrieri si verificare calitate

## Functionalitati

- Marketplace public cu anunturi aprobate
- Filtrare, sortare, cautare asistata de AI si paginare pentru anunturi
- Harta marketplace cu filtrare dupa zona vizibila si puncte de interes
- Pagina de detalii cu galerie foto, informatii, descriere, pret pe mp, formular de contact si harta
- Puncte din apropiere pentru detalii anunt: transport, magazine, scoli si spitale
- Inregistrare, autentificare si deconectare
- Profil utilizator cu telefon, descriere si avatar
- Creare anunt cu imagini inainte de trimiterea spre aprobare
- Editor de localizare cu cautare adresa si selectie pe harta
- Generator de descriere pentru anunturi, cu fallback local si suport AI optional
- Verificare calitate anunt cu reguli locale si suport AI optional
- Editare, stergere, incarcare/stergere imagini si reordonare/selectie cover pentru propriile anunturi
- Statusuri pentru anunturi: `In asteptare`, `Aprobat`, `Respins`
- Motiv de respingere pentru moderare si retrimitere dupa editare
- Flux de moderare pentru admin
- Dashboard admin cu statistici si grafice
- Anunturile respinse trebuie editate de proprietar inainte de a reveni in lista de aprobare
- Favorite pentru utilizatori autentificati
- Comparare anunturi
- Cautari salvate pentru utilizatori autentificati
- Mesaje de contact, inbox si conversatii intre cumparator si proprietar
- Notificari pentru aprobare/respingere anunturi si mesaje noi
- Profil public proprietar cu anunturile aprobate
- Atribute avansate: balcon, parcare, mobilare, incalzire, stare imobil si clasa energetica
- Layout responsive pentru desktop si mobile

## Structura

```text
client/   aplicatia React
server/   API-ul Express, Prisma si upload-urile locale
```

## Cerinte Locale

- Node.js
- npm
- PostgreSQL
- O baza de date PostgreSQL locala, de exemplu `estario`

Pe Windows, daca PowerShell blocheaza `npm.ps1`, foloseste `npm.cmd`.

## Configurare Backend

```bash
cd server
npm install
copy .env.example .env
```

Actualizeaza `server/.env` cu datele locale:

```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/estario?schema=public"
PORT=5000
CLIENT_URL="http://localhost:5173"
JWT_SECRET="change-this-secret"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4.1-mini"
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.0-flash"
```

Cheile AI sunt optionale. Fara ele, cautarea interpretata, generatorul de descriere si verificarea calitatii folosesc reguli locale/fallback-uri deterministe.

Ruleaza migrarea si seed-ul:

```bash
npm run prisma:migrate
npm run prisma:seed
```

Porneste API-ul:

```bash
npm run dev
```

API-ul ruleaza implicit la:

```text
http://localhost:5000
```

## Configurare Frontend

```bash
cd client
npm install
npm run dev
```

Aplicatia ruleaza implicit la:

```text
http://127.0.0.1:5173
```

## Conturi Demo

```text
Admin:
email: admin@example.com
password: Admin123!

User:
email: user@example.com
password: User123!
```

Toti utilizatorii demo normali folosesc parola:

```text
User123!
```

Utilizatori demo disponibili:

```text
user@example.com
ioana@example.com
mihai.dumitrescu@example.com
elena.stan@example.com
radu.marinescu@example.com
ana.georgescu@example.com
vlad.enache@example.com
diana.pavel@example.com
cristian.neagu@example.com
bianca.tudor@example.com
sorin.matei@example.com
irina.dobre@example.com
alex.munteanu@example.com
raluca.oprea@example.com
florin.ilie@example.com
oana.petrescu@example.com
george.rusu@example.com
laura.nita@example.com
adrian.barbu@example.com
simona.badea@example.com
tudor.preda@example.com
mara.voicu@example.com
```

## Rute API Principale

Autentificare:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
PUT  /api/auth/profile
POST /api/auth/profile/avatar
```

Anunturi:

```text
GET    /api/listings
GET    /api/listings/:id
GET    /api/my-listings
GET    /api/my-listings/analytics
POST   /api/listings
POST   /api/listings/interpret-search
POST   /api/listings/generate-description
POST   /api/listings/quality-check
PUT    /api/listings/:id
DELETE /api/listings/:id
POST   /api/listings/:id/images
PATCH  /api/listings/:id/images/order
DELETE /api/listings/:id/images/:imageId
```

Favorite:

```text
GET    /api/favorites
POST   /api/favorites/:listingId
DELETE /api/favorites/:listingId
```

Mesaje:

```text
POST /api/listings/:id/messages
GET  /api/my-listings/:id/messages
GET  /api/messages/inbox
GET  /api/messages/conversations
GET  /api/messages/unread-count
GET  /api/messages/conversations/:id
POST /api/messages/conversations/:id/messages
```

Notificari:

```text
GET   /api/notifications
GET   /api/notifications/unread-count
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

Cautari salvate:

```text
GET    /api/saved-searches
POST   /api/saved-searches
PUT    /api/saved-searches/:id
DELETE /api/saved-searches/:id
```

Proprietari si puncte de interes:

```text
GET /api/owners/:id
GET /api/points-of-interest
```

Administrare:

```text
GET   /api/admin/analytics
GET   /api/admin/listings/pending
GET   /api/admin/listings/rejected
PATCH /api/admin/listings/:id/approve
PATCH /api/admin/listings/:id/reject
```

## Fluxuri De Testare Manuala

### Browsing Public

Cont: fara autentificare.

1. Deschide `http://127.0.0.1:5173`.
2. Verifica lista de anunturi aprobate.
3. Foloseste filtrele si sortarea.
4. Scrie o cautare in `Cauta cu AI`, de exemplu `apartament de inchiriat in Bucuresti, 2 camere, sub 700 EUR`.
5. Verifica aplicarea filtrelor.
6. Muta harta si confirma ca lista se restrange la anunturile vizibile.
7. Activeaza punctele de interes si incarca POI-uri.
8. Deschide un anunt.
9. Verifica galeria, detaliile, pretul pe mp, descrierea, harta si sectiunea `In apropiere`.

### Creare Anunt Cu Imagini

Cont:

```text
user@example.com
User123!
```

1. Autentifica-te ca utilizator normal.
2. Mergi la `Adauga anunt`.
3. Completeaza formularul si foloseste cautarea pe harta pentru coordonate.
4. Ruleaza verificarea calitatii si, optional, genereaza descrierea.
5. Selecteaza una sau mai multe imagini.
6. Trimite anuntul.
7. Verifica redirectarea catre `Anunturile mele`.
8. Confirma ca anuntul apare cu status `In asteptare`.

### Moderare Admin

Cont:

```text
admin@example.com
Admin123!
```

1. Autentifica-te ca admin.
2. Mergi la `Administrare`.
3. Deschide statisticile din pagina de administrare.
4. Revino la lista de moderare si deschide un anunt `In asteptare`.
5. Aproba sau respinge direct din pagina de detalii.
6. Daca respingi, completeaza motivul respingerii.
7. Daca aprobi, verifica aparitia anuntului in marketplace.
8. Daca respingi, verifica mutarea lui in lista `Respinse`.

### Flux Respins Si Retrimis

Conturi:

```text
Admin: admin@example.com / Admin123!
User:  user@example.com / User123!
```

1. Adminul respinge un anunt in asteptare.
2. Utilizatorul se autentifica si merge la `Anunturile mele`.
3. Utilizatorul editeaza anuntul respins.
4. Dupa salvare, anuntul revine la status `In asteptare`.
5. Adminul il vede din nou in lista de pending si il poate aproba.

### Favorite

Cont:

```text
user@example.com
User123!
```

1. Autentifica-te ca utilizator normal.
2. Deschide un anunt aprobat care nu iti apartine.
3. Apasa `Adauga la favorite`.
4. Mergi la `Favorite`.
5. Verifica aparitia anuntului.
6. Apasa `Elimina din favorite` si confirma disparitia lui.

### Cautari Salvate Si Comparare

Cont:

```text
user@example.com
User123!
```

1. Autentifica-te ca utilizator normal.
2. Aplica filtre in marketplace.
3. Apasa `Salveaza cautarea` si alege un nume.
4. Reincarca pagina si confirma ca filtrul salvat ramane disponibil.
5. Adauga 2-4 anunturi la comparare.
6. Deschide `/compare` si verifica tabelul de comparatie.

### Mesaje Si Conversatii

Cont:

```text
user@example.com
User123!
```

1. Autentifica-te ca utilizator normal.
2. Deschide un anunt aprobat care nu iti apartine.
3. Trimite un mesaj catre proprietar.
4. Autentifica-te ca proprietarul anuntului.
5. Deschide `Mesaje`.
6. Verifica aparitia conversatiei si raspunde.
7. Confirma ca mesajele necitite se actualizeaza in navigatie.

### Profil Proprietar Si Profil Utilizator

Cont:

```text
user@example.com
User123!
```

1. Autentifica-te si deschide profilul din coltul de navigatie.
2. Actualizeaza telefonul, descrierea sau avatarul.
3. Deschide un anunt public si apasa pe proprietar.
4. Confirma ca profilul public nu expune emailul, dar listeaza anunturile aprobate.

## Screenshots

Adauga capturi pentru prezentarea finala:

- Marketplace
- Detalii anunt
- Formular creare anunt
- Anunturile mele
- Administrare
- Statistici admin
- Favorite
- Mesaje si conversatii
- Comparare anunturi
- Profil proprietar

## Note Pentru Disertatie

Proiectul demonstreaza separarea responsabilitatilor intre frontend si backend printr-un API REST. Backend-ul foloseste straturi clare pentru rute, controllere, servicii, middleware, validatori si Prisma, iar frontend-ul foloseste pagini, componente, context de autentificare si module API separate.

Modelarea relationala include utilizatori, anunturi, imagini, favorite, mesaje, conversatii, notificari, cautari salvate si puncte de interes. Moderarea prin rolul `ADMIN` sustine fluxul principal al aplicatiei: utilizatorii propun anunturi, iar administratorii controleaza ce devine vizibil public.

Aplicatia foloseste functionalitati AI in mod controlat: cautarea in limbaj natural transforma intentia utilizatorului in filtre editabile, verificarea calitatii ofera recomandari pentru proprietar, iar generatorul de descriere propune text care poate fi revizuit inainte de salvare. Deciziile importante, precum publicarea sau respingerea anunturilor, raman sub control uman.

Aplicatia poate fi extinsa ulterior cu conturi de agentie, promovari platite, alerte pentru cautari salvate, raportare anunturi, detectie duplicate, recomandari personalizate, geocodare reala si stocare imagini in cloud.

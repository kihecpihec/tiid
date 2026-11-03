# Povezani. — Vaja 3

Interaktivna Next.js aplikacija za analizo uporabe interneta in družbenih omrežij v Sloveniji. Vsa koda in podatki so v `Vaja3/odprti-podatki`; Vaja1 in Vaja2 nista potrebni za izvajanje.

## Zagon

Potrebujete Node.js 20.9+ in npm (projekt uporablja `package-lock.json`).

```sh
cd Vaja3/odprti-podatki
npm ci
npm run dev
```

Odprite http://localhost:3000. Za produkcijo: `npm run build` in `npm start`. Preverjanja: `npm test`, `npm run typecheck`, `npm run lint`.

## Podatki in parser

Vir je originalna priložena datoteka `data/internet-slovenija.px` (2974206S, SURS), brez predhodne pretvorbe v JSON, baze ali ločene zaledne storitve. Bajti so dekodirani kot **Windows-1250**, skladno z `CODEPAGE` v datoteki.

- `lib/px/tokenize.ts`: tokenizacija celotnih izjav, zaključevanje s podpičjem zunaj narekovajev, seznami in sosednji besedilni segmenti; ohranjeni jezik in argumenti ključnih besed.
- `lib/px/metadata.ts`: privzeti slovenski metapodatki, dimenzije iz STUB + HEADING, pari CODES/VALUES po položaju, opombe kategorij in celic. Angleški metapodatki so ohranjeni ločeno, ne dodajajo dimenzij.
- `lib/px/parser.ts`: označen `server-only`; preslikava kartezičnega produkta dimenzij v tipizirane zapise, zadnja dimenzija se spreminja najhitreje. Preveri točno število celic (v priloženi datoteki 12 × 82 × 3 × 4 = 11.808).
- `lib/analysis.ts`: izpeljava prikazov v brskalniku in medletnih razlik brez agregiranja prekrivajočih dejavnosti ali seštevanja skupnih in delnih skupin.

Parser podpira ravno letno štiridimenzionalno tabelo tega nabora (LETO, NAMEN UPORABE INTERNETA, SPOL, IZOBRAZBA); velikosti in kategorije pridobi iz metapodatkov. Pri manjkajočih metapodatkih, neujemajočih seznamih, neveljavnih koordinatah opomb, nepričakovanih podatkovnih tokenih in podprtosti presegajočih strukturnih različicah vrne jasno napako. Ne gre za splošen parser vseh različic standarda PC-Axis. Hierarhije, več tabel in drugačni nabori dimenzij niso podprti.

## Dinamično nalaganje in namestitev

Ob prvem prikazu odjemalec zahteva `GET /api/data` z `cache: 'no-store'`. Route Handler v Node.js runtime pokliče Next.js `connection()`, nato asinhrono prebere in razčleni datoteko ob **vsaki zahtevi**. Ne uporablja trajnega predpomnilnika; odgovor ima `Cache-Control`, `CDN-Cache-Control` in `Vercel-CDN-Cache-Control: no-store`. Filtri in izračuni nato delujejo v brskalniku. Gumb »Osveži iz datoteke« zahteva nov odčitek in ponastavi filtre.

`outputFileTracingIncludes` v `next.config.ts` vključuje `data/**/*.px` za `/api/data`; nastavljen je tudi `output: 'standalone'`. Skripta `postbuild` samodejno kopira `public` in `.next/static` v standalone mapo; `npm start` zažene njen `server.js`. Celotno `.next/standalone` mapo je mogoče prenesti na Node.js strežnik, skladno z [Next.js navodili za standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output). Statični izvoz ne podpira branja PX na zahtevo.

Osvežitev ponovno prebere **razpoložljivo lokalno datoteko**; ne prenese novejših podatkov SURS. Za nove podatke zamenjajte PX v strežniški namestitvi oziroma ponovno namestite aplikacijo z novo datoteko. Datum posodobitve je iz metapodatka LAST-UPDATED, ne datum prenosa.

Med začetnim nalaganjem in osvežitvijo komponenta `DashboardSkeleton` prikaže ASCII nadomestne oblike filtrov, povzetkov, grafov in tabele z uporabo [ascii-reveal](https://github.com/quanhoangindex/ascii-reveal). Ko odgovor prispe, `AsciiReveal` razkrije besedilo in vrednosti; filtri in interaktivni grafi ostanejo zunaj animacije. Barve sledijo temi aplikacije, učinek upošteva `prefers-reduced-motion`, bralniki zaslona pa dobijo besedilno stanje nalaganja. Vrstice nadomestne tabele so statične, da ne dodajajo animacij med čakanjem.

## Grafi in omejitve analize

Uporabljene so dejanske komponente **Bklit UI**, nameščene kot izvorna koda s `npx shadcn add @bklit/line-chart @bklit/bar-chart`, skladno z [uradnimi navodili za namestitev](https://bklit.com/docs/installation), [LineChart API](https://bklit.com/docs/components/line-chart) in [BarChart API](https://bklit.com/docs/components/bar-chart). Izvorne komponente so v `components/charts`. V `line.tsx` je dodan `defined` predicate za manjkajoče vrednosti; aplikacija izključi animirano interpolacijo črte in uporablja linearne odseke. Tako null ni narisan kot ničla in ne premosti vrzeli. Tabela zagotavlja tudi dostopen besedilni prikaz grafov.

Privzeti izbor je STAT810 (družbeni mediji), če vsebuje veljavne podatke; sledita STAT999 in STAT815. Dostopnih je vseh 82 kategorij, tudi STAT2 (prebivalstvo) in STAT25 (uporaba interneta v zadnjih treh mesecih).

- Začetni prikaz: število posameznikov. Delež uporablja **STAT2 za isto leto, spol in izobrazbo**, ne samo uporabnikov interneta; manjkajoča ali ničelna osnova pomeni manjkajoč delež.
- `0` ostane ničla. `..` postane `null` z ohranjeno oznako; tudi `.`, `...`, `:` in v viru deklarirani DATASYMBOL so ločene manjkajoče oznake, brez izmišljenega pomena. Neznani tokeni so napaka.
- Dejavnosti se prekrivajo, zato se ne seštevajo. Primerjava skupin izključi skupno kategorijo in ohrani drugi izbrani demografski filter.
- Povzetek se nanaša na zadnje veljavno leto **v izbranem obdobju**; medletna sprememba zahteva veljavno vrednost v neposredno prejšnjem koledarskem letu. Razlike deležev so v odstotnih točkah.
- Metodologija, populacija in razpoložljivost se lahko med leti razlikujejo. Prazne celice niso dokaz, da dejavnosti ni bilo. Podatki niso vzročna analiza.
- Izvorne opombe so prikazane kot besedilo z odstranjenimi HTML oznakami, nikoli z `dangerouslySetInnerHTML`. Oznake celic (npr. M) in oznake njihovih osnov STAT2 ostanejo vidne, brez ugibanja o pomenu.

Testi uporabljajo originalno binarno datoteko in majhne besedilne primere za kodiranje, večvrstične izjave, ločila v narekovajih, jezike, vrstni red celic, opombe, ničle, manjkajoče vrednosti, napačne strukture in odrezan DATA. Dodatni testi preverijo imenovalce in zaporednost medletnih razlik.

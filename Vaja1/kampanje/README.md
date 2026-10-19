# Uspešnost vsebinskih kampanj na družbenih omrežjih

Program prebere tri XML datoteke (avtorji, kampanje, objave), jih poveže prek ID-jev,
izračuna engagement rate (ER) za vsako objavo in izpiše filtriran seznam.
Rezultat shrani v `filtrirano.json` in `filtrirano.xml`.

ER = (všečki + komentarji + deljenja) / ogledi \* 100

## Podatki (mapa `data/`)

- `avtorji.xml` – 12 avtorjev (id, ime, mesto, sledilci, email)
- `kampanje.xml` – 12 kampanj (id, naziv, znamka, začetek, konec, proračun, status)
- `objave.xml` – 27 objav (id, idKampanje, idAvtorja, platforma, datum, ogledi, všečki, komentarji, deljenja, opis)

Povezave: `objava.idKampanje` -> `kampanja.id`, `objava.idAvtorja` -> `avtor.id`.

Nekateri podatki namenoma manjkajo (prazen `<konec>`, izpuščen `<email>` ali `<opis>`).
Program jih prebere kot prazen niz.

## Zagon

Potrebuje samo Python 3.9+, dodatnih knjižnic ni.

```
python main.py                                  # vse objave
python main.py --platforma TikTok               # samo TikTok
python main.py --kampanja 6                     # kampanja Black Friday
python main.py --po-datumu 2024-12-31           # objave po datumu
python main.py --min-ogledi 20000 --min-er 8    # kombinacija filtrov
python main.py --znamka "Aktivna Dolina" --mesto Koper
```

Razpoložljivi filtri: `--platforma`, `--kampanja`, `--znamka`, `--mesto`,
`--po-datumu`, `--min-ogledi`, `--min-er`. Filtri se združujejo (logični IN).
Rezultati so urejeni po ER padajoče.

## Izhod

Primer: `python main.py --platforma TikTok --min-er 8` izpiše tabelo v konzolo
in ustvari `filtrirano.json` / `filtrirano.xml`.

import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup


VIR = "https://www.socialmediatoday.com/"
OMEJITEV = 20
IZHOD = Path(__file__).parent / "data" / "novice.json"


def main():
    zahteva = Request(VIR, headers={"User-Agent": "TIID-student-parser/1.0"})
    with urlopen(zahteva, timeout=30) as odgovor:
        dokument = BeautifulSoup(odgovor.read(), "html.parser")

    novice = []
    for kartica in dokument.select("li.feed__item"):
        naslov = kartica.select_one(".feed__title a[href]")
        if naslov is None: 
            continue

        povezava = urljoin(VIR, naslov["href"])
        povzetek = kartica.select_one(".feed__description")
        novice.append({
            "id": povezava.rstrip("/").split("/")[-1],
            "naslov": naslov.get_text(" ", strip=True),
            "povzetek": povzetek.get_text(" ", strip=True) if povzetek else "",
            "povezava": povezava,
            "vir": "Social Media Today",
        })
        if len(novice) == OMEJITEV:
            break

    if not novice:
        raise ValueError("Ni najdenih novic. Preverite strukturo spletne strani.")

    podatki = {
        "vir": VIR,
        "zajetoOb": datetime.now(timezone.utc).isoformat(),
        "steviloNovic": len(novice),
        "novice": novice,
    }
    IZHOD.parent.mkdir(parents=True, exist_ok=True)
    with IZHOD.open("w", encoding="utf-8") as datoteka:
        json.dump(podatki, datoteka, ensure_ascii=False, indent=2)
        datoteka.write("\n")

    print(f"Shranjenih {len(novice)} novic v {IZHOD}")


if __name__ == "__main__":
    main()

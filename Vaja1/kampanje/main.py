import argparse
import json
import xml.etree.ElementTree as ET
from dataclasses import dataclass, asdict, fields
from datetime import date


@dataclass
class Avtor:
    id: int
    ime: str
    mesto: str
    sledilci: int
    email: str


@dataclass
class Kampanja:
    id: int
    naziv: str
    znamka: str
    zacetek: str
    konec: str
    proracun: int
    status: str


@dataclass
class Objava:
    id: int
    idKampanje: int
    idAvtorja: int
    platforma: str
    datum: str
    ogledi: int
    vsecki: int
    komentarji: int
    deljenja: int
    opis: str


def preberi(pot, razred):
    # vsak element v xml-ju postane en objekt, manjkajoca polja so "" oz. 0
    sez = []
    for el in ET.parse(pot).getroot():
        vr = {"id": int(el.get("id"))}
        for f in fields(razred):
            if f.name != "id":
                t = (el.findtext(f.name) or "").strip()
                vr[f.name] = int(t or 0) if f.type is int else t
        sez.append(razred(**vr))
    return sez


def zdruzi(objave, kampanje, avtorji):
    kamp = {k.id: k for k in kampanje}
    avt = {a.id: a for a in avtorji}
    rez = []
    for o in objave:
        k = kamp.get(o.idKampanje)
        a = avt.get(o.idAvtorja)
        if k is None or a is None:
            print("opozorilo: objava", o.id, "ima neveljaven id, preskocim")
            continue
        er = round((o.vsecki + o.komentarji + o.deljenja) / o.ogledi * 100, 2) if o.ogledi else 0
        rez.append({**asdict(o), "kampanja": k.naziv, "znamka": k.znamka,
                    "avtor": a.ime, "mesto": a.mesto, "er": er})
    return rez


def filtriraj(zapisi, args):
    rez = []
    for z in zapisi:
        if args.platforma and z["platforma"].lower() != args.platforma.lower():
            continue
        if args.kampanja and z["idKampanje"] != args.kampanja:
            continue
        if args.znamka and z["znamka"].lower() != args.znamka.lower():
            continue
        if args.mesto and z["mesto"].lower() != args.mesto.lower():
            continue
        if args.po_datumu and z["datum"] <= args.po_datumu:
            continue
        if z["ogledi"] < (args.min_ogledi or 0) or z["er"] < (args.min_er or 0):
            continue
        rez.append(z)
    return rez


def izpisi(zapisi):
    if not zapisi:
        print("Ni zadetkov.")
        return
    print(f"{'ID':<4}{'Kampanja':<20}{'Avtor':<17}{'Platforma':<11}{'Datum':<12}{'Ogledi':>8}{'ER %':>7}")
    print("-" * 79)
    for z in zapisi:
        print(f"{z['id']:<4}{z['kampanja']:<20}{z['avtor']:<17}{z['platforma']:<11}"
              f"{z['datum']:<12}{z['ogledi']:>8}{z['er']:>7}")
    print("-" * 79)
    skupaj = sum(z["ogledi"] for z in zapisi)
    povp = sum(z["er"] for z in zapisi) / len(zapisi)
    print(f"Zadetkov: {len(zapisi)}, skupaj ogledov: {skupaj}, povprecni ER: {povp:.2f} %")


def v_json(zapisi, pot):
    with open(pot, "w", encoding="utf-8") as f:
        json.dump(zapisi, f, ensure_ascii=False, indent=2)


def v_xml(zapisi, pot):
    root = ET.Element("objave")
    for z in zapisi:
        o = ET.SubElement(root, "objava", id=str(z["id"]))
        for kljuc, vr in z.items():
            if kljuc != "id":
                ET.SubElement(o, kljuc).text = str(vr)
    ET.indent(root)
    ET.ElementTree(root).write(pot, encoding="utf-8", xml_declaration=True)


def main():
    p = argparse.ArgumentParser(description="Uspesnost vsebinskih kampanj na druzbenih omrezjih")
    p.add_argument("--platforma", help="npr. Instagram, TikTok, YouTube, Facebook")
    p.add_argument("--kampanja", type=int, help="id kampanje")
    p.add_argument("--znamka", help="ime znamke")
    p.add_argument("--mesto", help="mesto avtorja")
    p.add_argument("--po-datumu", help="objave po datumu (YYYY-MM-DD)")
    p.add_argument("--min-ogledi", type=int, help="najmanjse stevilo ogledov")
    p.add_argument("--min-er", type=float, help="najmanjsi engagement rate v %%")
    args = p.parse_args()

    if args.po_datumu:
        try:
            date.fromisoformat(args.po_datumu)
        except ValueError:
            p.error("datum mora biti v obliki YYYY-MM-DD")

    avtorji = preberi("data/avtorji.xml", Avtor)
    kampanje = preberi("data/kampanje.xml", Kampanja)
    objave = preberi("data/objave.xml", Objava)
    print(f"Prebrano: {len(avtorji)} avtorjev, {len(kampanje)} kampanj, {len(objave)} objav\n")

    zapisi = zdruzi(objave, kampanje, avtorji)
    rez = filtriraj(zapisi, args)
    rez.sort(key=lambda z: z["er"], reverse=True)

    izpisi(rez)
    v_json(rez, "filtrirano.json")
    v_xml(rez, "filtrirano.xml")
    print("Shranjeno v filtrirano.json in filtrirano.xml")


main()

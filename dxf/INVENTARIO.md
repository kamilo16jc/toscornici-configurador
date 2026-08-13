# Cosa c'e' nei disegni, e cosa manca

Estratto da `disegni.zip` (ufficio tecnico) e ordinato come il
configuratore: una cartella per ogni cosa che il configuratore sa
scegliere.

| cartella | DXF | a cosa serve |
|---|---|---|
| `porte/` | 290 | tavole dei modelli — 30 hanno le tre viste vere |
| `porte-storico/` | 24 | archivio, mappe d'insieme |
| `coprifili/` | 23+18 | le sezioni dei coprifili |
| `bugne/` | 5 | i profili del pannello |
| `sezioni-massello/` | 5 | **le finiture del riquadro, tipo 1..4** |
| `telai/` | 2 | `TELAIO STD` e `TELAIO STD BATTENTE 29` |
| `incisioni/` | 10 | pantografature |
| `cerniere/` | 2 | nodi anuba e a scomparsa |

## I nomi non sono quelli del listino

Nello zip i modelli si chiamano col nome TECNICO — `BASE_HT789`,
`MOD-200`, `TL_UI_200-1TAB`, `TAMBURATO...` — non col nome commerciale
del configuratore (Siena, Roma, Liverpool). Di quarantaquattro modelli a
catalogo, uno solo si riconosce dal nome: COUNTRY.
Quindi la corrispondenza non si puo' dedurre dai file: la deve dire la
fabbrica, oppure si riconosce confrontando la geometria dell'alzato con
le foto dei quarantaquattro. La seconda strada e' fattibile -- il numero
e le proporzioni dei riquadri bastano quasi sempre -- ma va confermata.

## Trenta tavole hanno gia' quello che serve

Trenta DXF contengono sia SEZ-A che SEZ-B, cioe' sono complete come la
BASE_HT789 da cui e' nata la Siena. Fra queste `MOD-200`, `MOD.POTENZA`,
`MOD.UBC_BASE`, `MOD.50 LISTELLARE`, i quattro `TL_UI_200-nTAB` e i
`TL_[10]`, `TL_[11]`, `TL_[16]`.

## Due cose che risolvono domande aperte

`sezioni-massello/SEZIONE TIPO 1..4.dxf` sono le finiture del riquadro:
il tipo 2 e il tipo 3 li avevamo DISEGNATI NOI sul catalogo perche' i
DXF non c'erano. Adesso ci sono, e c'e' pure un tipo 4 che il
configuratore non offre.

`coprifili/SCORN_COPRIFILO-CS4_47X86_SIGNORINI.dxf` e' il profilo 47x86
che avevo segnalato come «nel listino non esiste». Non esiste davvero:
e' un CS4 fatto per un cliente, Signorini. Mistero chiuso.

## Coprifili nuovi rispetto ai diciotto che avevamo

`INCOLL-COPRIFILO-100-SAGOMATO_22,5X100`, `SCORN-COPRIFILO-BOMBATO_27X69`,
`SCORN-COPRIFILO-LISCIO_10X90`, `_10x69`, `_22X69_2018`,
`SCORN-CS-205_89X32`, `SCORN-CS204_32X90`, `SCORN-CS207_32X70_2018`.
Dei quattro che mancavano al configuratore — listellare 22x90, massello
22x70 e 22x90, Novecento CAP1 42x110 — nessuno si riconosce con
certezza: vanno chiesti per nome.

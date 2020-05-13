<h1 align="center">
  Taskline
</h1>

<h4 align="center">
  Aufgaben, Tafeln und Notizen für die Kommandozeile
</h4>

<div align="center">
  <img alt="Boards" width="70%" src="../media/header-boards.png"/>
</div>

<div align="center">
  <a href="https://travis-ci.org/perryrh0dan/taskline">
    <img alt="Build Status" src="https://travis-ci.org/perryrh0dan/taskline.svg?branch=master" />
  </a>
  <a href="https://gitter.im/taskline/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge">
    <img alt="Build Status" src="https://badges.gitter.im/taskline/community.svg" />
  </a>
  <a href="https://www.npmjs.com/package/@perryrh0dan/taskline">
    <img alt="Weekly NPM Downloads" src="https://img.shields.io/npm/dm/@perryrh0dan/taskline" />
  </a>
  <a href="https://snapcraft.io/taskline">
    <img alt="taskline" src="https://snapcraft.io/taskline/badge.svg" />
  </a>
</div>

## Beschreibung

Durch die Verwendung einer einfachen und minimalen Syntax, die eine flache Lernkurve erfordert, können Sie mit Taskline Ihre Aufgaben und Notizen von Ihrem Terminal aus auf mehreren Tafeln effektiv verwalten. Alle Daten werden atomar in den Speicher geschrieben, um Verfälschungen zu vermeiden. Im Moment gibt es zwei Speichermodule. Das lokaler Speicher-Modul, in dem Ihre daten niemals für andere freigegeben werden, oder das Firestore-Modul, in dem Ihre Daten in Ihrer Firestore-Datenbank gespeichert werden und mit all Ihren Geräten synchronisiert werden können. Gelöschte Objekte werden automatisch archiviert und können jederzeit eingesehen oder wiederhergestellt werden.

Besuche die [contributing guidelines](https://github.com/perryrh0dan/taskline/blob/master/contributing.md#translating-documentation) um mehr zu erfahren, wie du diese Anleitung in eine andere Sprache übersetzen kannst.

Besuche mich auf [Gitter](https://gitter.im/taskline/community?source=orgpage) or [Twitter](https://twitter.com/perryrh0dan1) um Deine gedanken zu dem Projekt zu teilen.

## Highlights

### Original

* Aufgaben und Notizen zu Tafeln einordnen
* Tafel- und Zeitleistenansicht
* Prioritäten und Favoritenmechanismus
* Einträge suchen und filtern
* Einträge archivieren und wiederherstellen
* schlank & schnell
* Daten werden atomar an den Speicherort geschrieben
* Speicherort konfigurierbar
* Prozessübersicht
* Einfache und minimalistische Nutzungssyntax
* Aktualisierungsbenachrichtung
* Konfigurierbar durch `~/.taskline.json` 
* Daten sind als JSON gespeichert in `~/.taskline/storage` 

### Neu

* Modularer Datenspeicher
* Firestore-Modul, um Daten in google firestore zu speichern 
* Aufgaben über alle Geräte mit firestore synchronisieren.
* Meow durch commander.js ausgetauscht
* Fälligkeitsdatum
* Loadingspinner wird angezeigt während Netzwerkanfragen
* Neue Filterattribute für Listen

Die herausragenden Eigenschaften als Tafelansicht: [taskline board](https://raw.githubusercontent.com/perryrh0dan/taskline/master/media/highlights.png).

## Inhalt

* [Beschreibung](#beschreibung)
* [Highlights](#highlights)
* [Installation](#installation)
* [Nutzung](#nutzung)
* [Ansichten](#ansichten)
* [Konfiguration](#konfiguration)
* [Vor dem Flug](#vor-dem-flug)
* [Flughandbuch](#flughandbuch)
* [Entwicklung](#entwicklung)
* [Verwandt](#verwandt)
* [Team](#team)
* [Lizenz](#lizenz)

## Installation

### Yarn

``` bash
yarn global add @perryrh0dan/taskline
```

### NPM

``` bash
npm install --global @perryrh0dan/taskline
```

### Snapcraft

```bash
snap install taskline
snap alias taskline tl # set alias
```

**Anmerkung:** Wegen der strikten Trennung in snap-Apps befinden sich die Konfigurationsdateien unter [`$SNAP_USER_DATA`](https://docs.snapcraft.io/reference/env) Umgebungsvariable anstatt in `$HOME` .
## Nutzung

``` 
$ tl --help
Anwendung: tl [options] [command]


Aufgaben, Tafeln & Notizen in der Kommandozeilenumgebung

Optionen:
  -V, --version                   Versionsinformationen ausgeben
  -h, --help                      Informationen zur Verwendung anzeigen

Commands:
  archive|a                       Archivierte Elemente anzeigen
  begin|b <ids>                   Aufgabe starten/pausieren
  check|c <ids>                   Aufgabe als erledigt/ unerledigt markieren
  clear                           Alle erledigten Aufgaben löschen
  copy|y <ids>                    Beschreibung zur Zwischenablage hinzufügen
  delete|d <ids>                  Eintrag löschen
  due <ids> <dueDate>             Fälligkeitsdatum einer Aufgabe setzen/löschen
  edit|e <id> <description>       Eintragsbeschreibung bearbeiten
  find|f <terms>                  Eintrag suchen
  list|l <terms>                  Eintrag nach Attributen suchen
  move|m <ids> <board>            Zwischen Tafeln verschieben
  note|n [options] <description>  Notiz erstellen
  priority|p <id> <priority>      Aufgabenpriorität bearbeiten
  restore|r <ids>                 Eintrag vom Archiv wiederherstellen
  star|s <ids>                    Eintrag hervorheben/Hervorhebung entfernen
  task|t [options] <description>  Aufgabe erstellen
  timeline|i                      Als Timeline darstellen
```

# Ansichten

### Tafelansicht

Der Aufruf von taskline ohne Parameter zeigt alle gespeicherten Elemente - gruppiert in den zugehörigen Tafeln.
 
<div align="center">
  <img alt="Boards" width="70%" src="../media/header-boards.png"/>
</div>

### Zeitleistenansicht

Um die Elemente in einer Zeitleistenansicht anzuzeigen kann der Parameter
 `--timeline` / `-i` 
verwendet werden. Die Elemente werden dann in der Reihenfolge der Erstellung angezeigt.

<div align="center">
  <img alt="Timeline View" width="70%" src="../media/timeline.png"/>
</div>

## Konfiguration
Um Taskline zu konfigurieren, reicht es aus, die Datei  `~/.taskline.json` gemäß Deinen Vorstellungen anzupassen. 
Um zu den Standardwerten zurückzukommen, lösche einfach die Konfigurationsdatei aus Deinem home-Verzeichnis.

Das folgende Beispiel zeigt alle möglichen Optionen und deren Standardwerte.


``` json
{
  "tasklineDirectory": "~",
  "displayCompleteTasks": true,
  "displayProgressOverview": true,
  "storageModule": "local",
  "firestoreConfig": {
        "type": "",
        "project_id": "",
        "private_key_id": "",
        "private_key": "",
        "client_email": "",
        "client_id": "",
        "auth_uri": "",
        "token_uri": "",
        "auth_provider_x509_cert_url": "",
        "client_x509_cert_url": "",
      },
  "dateformat": "dd.mm.yyyy"
}
```

### Im Detail

##### `tasklineDirectory` 

* Typ: `String` 
* Standardwert: `~` 
Pfad im Dateisystem, an der sich der Speicherplatz befindet, zum Beispiel `/home/username/the-cloud` oder `~/the-cloud` 

Wird diese Option ausgelassen, ist der Speicherort `~` und die Einstellungen in `~/.taskline/` .

##### `displayCompleteTasks` 

* Typ: `Boolean` 
* Standardwert: `true` 

Als erledigt markierte Aufgaben anzeigen.

##### `displayProgressOverview` 

* Typ: `Boolean` 
* Standardwert: `true` 

Prozessübersicht unterhalb der Leistenansicht und der Tafelansicht anzeigen

##### `storageModule` 

* Typ: `Enum` 
* Standardwert: `local` 
* mögliche Werte: `local` , `firestore` 

Speicherort wählen. Derzeit gibt es zwei Module `local` und `firestore` . 
Für das Modul firestore wird die firestoreConfig benötigt.

##### `firestoreConfig` 

* Typ: `Google Dienstkontoschlüssel` 
* Standardwert: `Empty` 

Konfiguration des firestore-Moduls.

##### `dateformat` 

* Typ: `String` 
* Standardwert: `dd.mm.yyyy` 

Format des Fälligkeitsdatums.

## Vor dem Flug

Wenn Du den lokalen Speicher zu nutzen, ist keine weitere Konfiguration notwendig. wenn du das firestore-Modul nutzen möchtest, folge diesen Schritten:

### Firestore vorbereiten

1. Erzeuge ein neues Projekt auf der google cloud Plattform.
2. Erzeuge einen neuen Service Account für das Projekt.
3. Lade die authorization.json-Datei herunter und übertrage die Zeilen in die entspreichenden Zeilen die taskline-Konfiguration.

oder folge diesem [Handbuch](https://cloud.google.com/docs/authentication/production#providing_credentials_to_your_application).
## Flughandbuch

Im folgenden ist eine kurze Übersicht mit einem Beispielsatz zur Anwendung von taskline. 
Im Falle, dass Du einen Fehler gefunden hast oder ein Beispiel nicht deutlich genug ist, oder weiter verbessert werden soll, eröffne ein Ticket [Ticket](https://github.com/perryrh0dan/taskline/issues/new/choose) oder [pull request](https://github.com/perryrh0dan/taskline/compare).

### Task erstellen

Um eine neue Aufgabe zu erstellen, benutze das `task` / `t` Kommando mit der Beschreibung der Aufgabe direkt im Anschluss.

``` 
$ tl t "Verbesserte Beschreibung"
```

### Notiz erstellen

Um eine neue Notiz zu erstellen benutze das `note` / `n` Kommando mit dem Notizentext direkt dahinter.

``` 
$ tl n "Mergesort worse-case O(nlogn)"
```

### Tafel erstellen

Tafeln werden automatisch initialisert, wenn eine neue Aufgabe oder Notiz erstellt wird.
Um eine neue Tafel zu erstellen, benutze die  `--board` / `-b` Option, gefolgt von der Liste der Tafeln, 
nach der Beschriftung der zu erzeugenden Notiz oder der Aufgabe. 
Als Folge wird ein neuer Eintrag in allen angegeben Tafeln erstellt.
Als Standard werden alle Einträge ohne Tafel-Option der Tafel  `My Board` hinzugefügt.

``` 
$ tl t "Die Mitwirkendendokumentationen überarbeiten" -b coding,docs
```

### Aufgabe abhaken

Um eine Aufgabe als fertig/unfertig zu markieren, kann das mit dem `check` / `c` Kommando, gefolgt von den Aufgaben-ids. 
Beachte, dass die Option den `complete`-Status umkehren, ein abgeschlossener Status wird als "wartend" markiert, einer als "wartend" wird als abgeschlossen markiert.  
Doppelte ids werden herausgefiltert.

``` 
$ tl c 1,3
```

### Task anfangen
Um eine Aufgabe zu starten oder zu pausieren, benutz das `begin` / `b` Kommando, gefolgt von den ids. 
Die Funktion dieser Option ist die gleiche wie beim abhaken ( `check` ).

``` 
$ tl b 2,3
```

### Eintrag favorisieren

Um einen Eintrag als Favorit zu markieren, benutze das `star` / `s` Kommando, gefolgt von den Nummern der Einträge. 
Die Funktion dieser Option ist die gleiche wie beim abhaken ( `check` ).

``` 
$ tl s 1,2,3
```

### Eintrag-Beschreibung kopieren

Um eine Beschreibung eines Eintrages in die Zwischenablage zu kopieren, benutze die `copy` / `y`  Option, gefolgt von den Nummern der Einträge. 
Beachte, dass die Option einen Zeilenumbruch nach jedem Eintrag hinzufügt.

``` 
$ tl y 1,2,3
```

### Tafeln anzeigen
Wird Taskline ohne Parameter aufgerufen, werden alle gespeicherten Einträge nach Tafeln sortiert angezeigt.

``` 
$ tl
```

### Zeitleiste anzeigen
Um alle Einträge in einer Zeitleistenansicht darzustellen, also basierend auf ihren Erstellungsdatumkann das  `timeline` / `i` Kommando benutzt werden.

``` 
$ tl i
```

### Priorität setzen
Um die Priorität eines Eintrages während des Hinzufügens zu setzen, benutze die  `-p` -Option, gefolgt con der Priorität. 
Die Priorität kann eine Integerzahl des Wertes  `1` , `2` oder `3` sein. 
Bitte beachte, dass alle Aufgaben ohne gesetzte Prioriät mit `1` erstellt werden.


* `1` - Normale Priorität
* `2` - Mittlere Priorität
* `3` - Hohe Priorität

``` 
$ tl t "Erledige Ticket `#42` " -b coding -p 3
```
Um die Priorität einer Aufgabe nach der Erstellung zu erhöhen, benutze das `priority` / `p` Kommando mit der id des Zieleintrags und einem Integer des Wertes `1` , `2` oder `3` .

``` 
$ tl p 1,2,23 2
```

### Frist setzen
Um eine Befristung während der Erstelllung zu setzen, benutze die `-d` Option, gefolgt von dem Fälligkeitsdatum. 
Das Fälligkeitsdatum muss im Format angegeben werden, dass in der Konfigurationsdatei unter Datumsformat (dateformat) vorgegeben ist. Der Standardwert ist `dd.mm.yyyy` .
Bitte beachte, dass Aufgaben ohne diese Option ohne Fälligkeitsdatum erstellt werden.

``` 
$ tl t "Rätsel lösen" -b coding -d 23.08.2019
```
Um das Fälligkeitsdatum nach der Erstellung zu ändern, benutze das `due` Kommando mit der id des Eintrages und einem Datum.
Das `due` Kommando hat keine kürzere Variante.

``` 
$ tl due 1,2,23 15.09.2019
```
Die Anzahl der Resttage vor dem Fälligkeitsdatum wird anstelle des Alters direkt rechts neben der Beschreibung angezeigt.

### Eintrag verschieben

Um einen Eintrag zu einem oder mehreren Tafeln zu verschieben, bentutze das `move` / `m` Kommando, gefolgt von den Nummern der Einträge und den Namen der Tafeln.
Die Standardtafel `My board` wird durch den Namen `myboard` erreicht.

``` 
$ tl m 1,2 myboard,reviews
```

### Eintrag löschen

Um einen eintrag zu löschen, benutze das `delete` / `d` Kommando, gefolgt von der Nummer/den Nummern der Einträge. 
Beachte, dass gelöschte Einträge automatisch archiviert werden, und sie jederzeit eingesehen oder wiederhergestellt werden können. Doppelte Nummern werden automatisch herausgefiltert.


``` 
$ tl d 1,2
```

### Alle fertigen Aufgaben löschen

Um alle fertigen Aufgaben auf einmal zu löschen, benutze das `clear` Kommando. 
Beachte auch hier, dass gelöschte Einträge automatisch archiviert werden, und jederzeit eingesehen oder wiederhergestellt werden können.
Um Fehler durch versehentliches Löschen zu vermeiden, gibt es keine kürzere Variante des `clear` Kommandos.

``` 
$ tl clear
```

### Archiv anzeigen
Um alle Einträge im Archiv anzuzeigen, benutze das `archive` / `a` Kommando. 
Beachte, dass alle archivierten Einträge in der Zeitlesitenansicht angezeigt werden -sortiert nach dem Erstellungsdatum.

``` 
$ tl a
```

### Einträge wiederherstellen
Um Einträge wiederherzustellen, benutze das `restore` / `r` Kommando, gefolgt von den Nummern der Zieleinträge. 
Beachte, dass die Nummern aller archivierten Einträge gesehen werden können mit der `archive` / `a` Option. Doppelte Nummern werden herausgelesen.

``` 
$ tl r 1,2
```

### Einträge nach Attributen filtern

Um eine Liste von Einträgen nach einem speziellen Attribut zu filtern, benutze das `list` / `l` Kommando, gefolgt von den gewünschten Attributen. 
Tafelnamen und Eintragseigenschaften können als gültige Attribute angesehen werden.
Um zum Beispiel alle Listeneinträge anzuzeigen, die zur Standardtafel `myboard` gehören und unerledigt sind, kann folgender Befehl verwendet werden: 

``` 
$ tl l myboard,pending
```
Die im Standard unterstützten Listenattribute -zusammen mit deren Aliases sind die folgenden: 

* `myboard` - Einträge, die zu `My board` gehören 
* `task` , `tasks` , `todo` - Einträge, die Aufgaben sind.
* `note` , `notes` - Einträge, die Notizen sind.
* `pending` , `unchecked` , `incomplete` - Unerledigte Aufgaben.
* `progress` , `started` , `begun` - Aufgaben, die in Bearbeitung sind.
* `done` , `checked` , `complete` - Erledigte Aufgaben.
* `star` , `starred` - Hervorgeboene Einträge.
* `default` , `medium` , `high` - Einträge mit der gewählten Wichtigkeit/Priorität.

### Nach Einträgen suchen
Um einen oder mehrere Einträge zu suchen, benutze das `find` / `f` Kommando, gefolgt von der Suchabfrage.

``` 
$ tl f documentation
```

## Entwicklung

Um mehr zu erfahren, wie Du bei dem Projekt mithelfen kannst, lese bitte die [Anleitung zur Mithilfe (englisch)](https://github.com/perryrh0dan/taskline/blob/master/contributing.md).

* Forke das Repository und klone es auf Deine Maschine
* Gehe zum Projektordner des lokalen Forks: `cd taskline`
* Installiere die Projektabhängigkeiten: `npm install` oder `yarn install` 
* Lint den Code nach Fehlern: `npm test` oder `yarn test` 

## Verwandte Themen

* [signale](https://github.com/klaussinani/signale) - Sehr gut anpassbares Datensammlungswerkzeug

## Team

* Thomas Pöhlmann [(@perryrh0dan)](https://github.com/perryrh0dan)

## Lizenz

[MIT](https://github.com/perryrh0dan/taskline/blob/master/license.md)


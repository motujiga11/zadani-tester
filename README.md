# Cypress E2E testy – FakturaOnline

Tento repozitář obsahuje automatizované end-to-end testy pro webovou aplikaci [FakturaOnline](https://fakturaonline.cz), vytvořené v nástroji [Cypress](https://www.cypress.io/).

Testy pokrývají klíčové akce, jako je přihlášení, vytváření a vyhledávání kontaktů, vystavení faktury, ověření údajů a mazání záznamů. Systém podporuje běh napříč třemi jazykově a funkčně odlišnými doménami:

- `cz`: https://dev.fakturaonline.cz
- `sk`: https://dev.fakturaonline.sk
- `com`: https://dev.invoiceonline.com

---

## Obsah

- [Hlavní funkce a přínosy](#hlavní-funkce-a-přínosy)
- [Jak spustit testy](#jak-spustit-testy)
- [Doménové přepínání a přihlášení](#doménové-přepínání-a-přihlášení)
- [Stabilní selektory](#stabilní-selektory)
- [Mazání dat po testech (after hook)](#mazání-dat-po-testech-after-hook)
- [Zachycené chyby v aplikaci](#zachycené-chyby-v-aplikaci)
- [Doporučení k dalšímu rozšíření](#doporučení-k-dalšímu-rozšíření)
- [Odpověď na zadání](#odpověď-na-zadání)

---

## Hlavní funkce a přínosy

### Podpora více domén

Celý framework je navržen pro běh proti různým doménám (`cz`, `sk`, `com`) pomocí přepínatelného prostředí (`currentDomain`) v `cypress.env.json`.

### Oddělení testovací logiky

Testy využívají **Page Object Pattern** (`ContactsPage`, `ContactDetailPage`, `LoginPage`), utility (`cleanupUtils`, `invoiceUtils`, `contactSearchUtils`, `loginMessages`, `paths`) a přehlednou strukturu kódu.

### Reálná data v JSON formátu

Testovací data jsou uložena ve `contacts.json`, `translations.json`, což umožňuje oddělení testovací logiky od vstupních dat.

### Různá přihlášení

Login testy zvládají obě varianty přihlášení – přímé i se zprostředkujícím krokem „Přihlásit se do mého účtu“.

### Robustní validace

Notifikace po akcích jsou částečně nepředvídatelné – někdy obsahují jméno kontaktu, jindy ne. Ošetřeno validací pouze části textu, např.:

```js
cy.contains(contactDeletedMessagePart, { timeout: 10000 }).should('be.visible');
```

### Podpora různých měn a DPH sazeb

Testy počítají s rozdíly mezi doménami – CZ má 21 %, SK 20 %, COM 23 %, v různých měnách a formátech (Kč, €, $).

---

## Jak spustit testy

> **Poznámka k předpokladům:** Pro zajištění konzistentního chování testů během tohoto cvičení se předpokládá, že testovací účty pro každou doménu (cz, com, sk) nemají žádné existující kontakty ani faktury před spuštěním testů. Tento stav muze byt zajištěn v globálním `before` hooku. V reálném světě by měl být každý test plně izolovaný a spustitelný paralelně bez závislosti na předchozím stavu.
>

### 1. Instalace

```bash
npm install
```

### 2. Konfigurace přihlašovacích údajů

Vytvořte soubor `cypress.env.json` ve rootu projektu. Jeho podoba:

```json
{
  "users": {
    "cz": {
      "email": "your-cz-email@example.com",
      "password": "your-password"
    },
    "com": {
      "email": "your-com-email@example.com",
      "password": "your-password"
    },
    "sk": {
      "email": "your-sk-email@example.com",
      "password": "your-password"
    }
  },
  "currentDomain": "cz"
}
```

> **Upozornění:** Přihlašovací údaje byly sdíleny soukromě pouze pro účely zadání. V reálných projektech mají být načítány z CI/CD a uloženy jako tajné proměnné – nikoliv přímo v repozitáři.

### 3. Spuštění testů

```bash
npx cypress open       # Interaktivní režim
npx cypress run        # Headless režim
```

---

## Doménové přepínání a přihlášení

K navigaci se používá vlastní příkaz `visitOnDomain`, který je univerzální a flexibilní:

```js
Cypress.Commands.add('visitOnDomain', (path, domainCode = Cypress.env('currentDomain')) => {
  const domainMap = {
    cz: 'https://dev.fakturaonline.cz',
    sk: 'https://dev.fakturaonline.sk',
    com: 'https://dev.invoiceonline.com'
  };
  const url = domainMap[domainCode] + path;
  cy.visit(url);
});
```

Tento přístup je výhodnější než mít tři separátní příkazy jako `visitCz`, `visitCom`, `visitSk` – je čistší, přehlednější a snadno rozšiřitelný.

---

## Stabilní selektory

Aplikace nepoužívá konzistentní `data-test` nebo `data-cy` selektory. Proto bylo nutné použít různé alternativy:

- `data-analytics-id`
- `.el-table__row`, `.el-autocomplete`, `.form-actions`
- Kontextové `.contains().parents('tr')` nebo `.within()`
- `.icon-trash-alt` a další ikonové selektory

Tyto selektory byly pečlivě zvoleny s ohledem na stabilitu a minimalizaci výpadků.

---

## Mazání dat po testech (after hook)

Na konci testovací sady (`after`) se testovací data uklidí (faktury i kontakty). 

> **Známý problém:** Mazání kontaktů pro doménu `sk` občas selhává – test nedokáže najít potřebný selektor nebo notifikaci. V doménách `cz` a `com` testy fungují správně.
> Pokud bude zbytek řešení dostatečný, rád se tomuto problému následně věnuji a opravím ho.

- Pokud existuje faktura, je smazána
- Kontakty jsou smazány – maximálně 2 (bez nutnosti ručního zásahu)

Validace po mazání čeká na příslušnou notifikaci.

---

## Známé chyby v aplikaci

### 1. SK: Záporný počet faktur

Scénář: Vytvořím kontakt → vytvořím fakturu bez přiřazeného kontaktu → přiřadím kontakt → smažu fakturu → v seznamu kontaktů má kontakt fakturaCount = -1.

### 2. CZ: Kontakt zůstává v UI po smazání

Přestože notifikace informuje o úspěšném smazání, kontakt se nadále zobrazuje. Po reloadu zmizí. Test byl upraven tak, aby neselhal, ale ideálně by měl selhat a upozornit na chybu.

---

## Doporučení k dalšímu rozšíření

- Spouštět testy proti prostředím `DEV`, `QA`, `STAGE`, `PROD` pomocí další proměnné v `cypress.env.json`
- Na produkci spouštět pouze „Smoke“ testy (označit je tagem nebo názvem)
- Logovat test ID do test management systému (např. TestRail, Xray)
- Používat CI (např. GitHub Actions) pro paralelní běh a reporting

---

### Další poznámky

- Použití `beforeEach` místo `before` záměrně demonstruje způsob, jakým by měly být testy nezávislé a spustitelné paralelně. I když by se zde mohl použít `before`, bylo cílem ukázat správný styl.
- Některé části logiky (např. selekce kontaktu ve faktuře) bylo nutné přepsat v závislosti na doméně, protože nebylo možné pokrýt stejným flow.
- Výběr konstant, jako je DPH sazba, měnový formát nebo lokalizace hlášek, byl abstrahován do objektu `vatMap`, čímž je kód přehlednější a lépe škálovatelný.

---

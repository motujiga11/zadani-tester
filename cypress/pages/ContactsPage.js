import { getContactsPagePath } from '../utils/paths';

class ContactsPage {
  // Selectors for elements on the contacts list page
  elements = {
    addContactButton: () => cy.get('button[data-analytics-id="contactsTable.buttons.addContact"]'),
    searchInput: () => cy.get('input[name="search"]'),
    contactRowByName: (name) => cy.get('tr.el-table__row').contains('[data-test="name_column"]', name).parents('tr'),
    nameHeader: () => cy.get('th[data-test="name_column"]')
  };

  visit() {
    const domain = Cypress.env('currentDomain');
    cy.visitOnDomain(getContactsPagePath(domain));
  }

  createContact(contact) {
    this.elements.addContactButton().click();

    const domain = Cypress.env('currentDomain');
    const isCz = domain === 'cz';

    const nameSelector = domain === 'com'
      ? 'input#invoice_attributes_name.el-input__inner'
      : 'input[name="invoice_attributes_name"]';

    cy.get(nameSelector).should('exist').should('be.visible').clear().type(contact.name);

    if (isCz) {
      // Autocomplete flow for .cz
      cy.get('.autocomplete-item').first().click();

      cy.get('input[name="company_number"]').should('have.value', contact.companyNumber);
      cy.get('i.icon-ares-ok').should('be.visible');
      cy.get('input[name="tax_number"]').should('have.value', contact.taxNumber);
      cy.get('input[type="tel"]').should('have.value', contact.phone);
      cy.get('input[name="email"]').should('have.value', contact.email);
      cy.get('input[name="web"]').should('have.value', contact.web || '');
      cy.get('input[name="street"]').should('have.value', contact.street);
      cy.get('input[name="city"]').should('have.value', contact.city);
      cy.get('input[name="postcode"]').should('have.value', contact.postcode);
      cy.get('input[name="contact_address_country_code"]').should('have.value', contact.country);
      cy.get('.vti__country-code').should('contain', contact.countryCode);
    } else {
      // Manual typing for .com and .sk
      cy.get('input[name="company_number"]').clear().type(contact.companyNumber);
      cy.get('input[name="tax_number"]').clear().type(contact.taxNumber);
      cy.get('input[name="street"]').clear().type(contact.street);
      cy.get('input[name="city"]').clear().type(contact.city);
    }

    cy.get('button[data-analytics-id="contacts.buttons.save"]').click();
  }

  searchFor(query) {
    this.elements.searchInput().clear();
    if (query) {
      this.elements.searchInput().type(query);
    }
  }

  clearSearch() {
    this.elements.searchInput().clear().type(' ');
  }

  sortByName() {
    cy.intercept('POST', '**/graphql').as('graphqlSort');
    this.elements.nameHeader().first().click();
    cy.wait('@graphqlSort');
  }

  verifySortedByNameAsc() {
    cy.get('tbody tr.el-table__row').then($rows => {
      const names = [...$rows].map(row =>
        row.querySelector('td[data-test="name_column"] span')?.innerText.trim().replace(/\s+/g, ' ') || ''
      ).filter(name => name);

      const sorted = [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      cy.log('Extracted names:', JSON.stringify(names));
      cy.log('Expected sorted names:', JSON.stringify(sorted));
      expect(names).to.deep.equal(sorted);
    });
  }

  verifySortedByNameDesc() {
    cy.get('tbody tr.el-table__row').then($rows => {
      const names = [...$rows].map(row =>
        row.querySelector('td[data-test="name_column"] span')?.innerText.trim().replace(/\s+/g, ' ') || ''
      ).filter(name => name);

      const sortedDesc = [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })).reverse();
      cy.log('Extracted names:', JSON.stringify(names));
      cy.log('Expected sorted names (desc):', JSON.stringify(sortedDesc));
      expect(names).to.deep.equal(sortedDesc);
    });
  }

  openContactDetail(name) {
    this.elements.contactRowByName(name).find('a').first().click();
  }

  verifyContactVisible(name, expected) {
    const row = this.elements.contactRowByName(name);
    row.should('exist').within(() => {
      cy.get('[data-test="name_column"]').should('contain', expected.name);
      cy.get('[data-test="company_number_column"]').should('contain', expected.companyNumber);
      cy.get('[data-test="email_column"] .cell').invoke('text').should(text => {
        expect(text.trim()).to.eq(expected.email);
      });
      cy.get('[data-test="phone_column"] .cell').invoke('text').should(text => {
        expect(text.trim()).to.eq(expected.phone);
      });
      cy.get('[data-test="invoices_count_column"]').should('contain', expected.invoicesCount);

      cy.get('button[data-analytics-id="icon-invoice-new"]').should('exist');
      cy.get('button[data-analytics-id="icon-expense"]').should('exist');
      cy.get('button[data-analytics-id="icon-pen"]').should('exist');
      cy.get('button[data-analytics-id="icon-trash-alt"]').should('exist');
    });
  }

  startInvoiceCreation() {
    cy.get('a[data-analytics-id="button.createInvoice"]')
      .contains('Vystavit fakturu')
      .click();
  }

  verifyInvoiceTotals(vatRate, price) {
    const formatCurrency = (val) => `${val.toFixed(2).replace('.', ',')} Kč`;
    const expectedNet = formatCurrency(price);
    const vatDecimal = vatRate / 100;
    const dph = price * vatDecimal;
    const totalWithDph = price + dph;

    cy.get('.vat-rate-select input').invoke('val').then(vat => {
      if (vat.includes(`${vatRate}`)) {
        cy.contains('Celkem bez DPH').siblings('td').should('contain', expectedNet);

        if (vatRate > 0) {
          cy.contains(`DPH ${vatRate} %`).siblings('td')
            .should('contain', formatCurrency(dph));
        }

        cy.contains('Celkem s DPH').siblings('td')
          .should('contain', formatCurrency(totalWithDph));
      }
    });

    cy.get('.invoice-line__column--total input')
      .should('have.value', formatCurrency(totalWithDph));
  }
}

export default new ContactsPage();

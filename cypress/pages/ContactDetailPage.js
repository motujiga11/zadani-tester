class ContactDetailPage {
  elements = {
    editButton: () => cy.get('button[data-analytics-id="icon-pen"]'),
    newInvoiceButton: () => cy.get('a[data-analytics-id="button.createInvoice"]'),
    invoiceListItems: () => cy.get('[data-test="invoice-list-item"]'),
    invoiceCount: () => cy.get('[data-test="invoice-count"]'),
    invoiceSum: () => cy.get('[data-test="invoice-sum"]')
  };

  editContact(newData) {
    const domain = Cypress.env('currentDomain');
    const isCz = domain === 'cz';

    if (newData.name) {
      const nameSelector = domain === 'com'
        ? 'input#invoice_attributes_name.el-input__inner'
        : 'input[name="invoice_attributes_name"]';

      cy.get(nameSelector)
        .should('be.visible')
        .focus()
        .type('{selectall}{backspace}')
        .invoke('val')
        .then(val => {
          if (val && val.trim() !== '') {
            cy.get(nameSelector).focus().type('{selectall}{backspace}');
          }
        })
        .then(() => {
          cy.get(nameSelector).invoke('val').should('eq', '');
        });

      this.typeSlowly(nameSelector, newData.name, 70);

      if (isCz) {
        cy.get('.autocomplete-item').first().click();
        cy.get('input[name="company_number"]').should('have.value', '27604977'); // hardcoded value but can be pulled from the contacts.json
        cy.get('i.icon-ares-ok').should('be.visible');
        cy.get('input[name="tax_number"]').should('have.value', 'CZ27604977');
        cy.get('.vti__country-code').should('contain', '+420');
        cy.get('input[type="tel"]').should('have.value', '');
        cy.get('input[name="email"]').should('have.value', '');
        cy.get('input[name="web"]').should('have.value', '');
        cy.get('input[name="street"]').should('have.value', 'Stroupežnického 3191/17, Smíchov');
        cy.get('input[name="city"]').should('have.value', 'Praha');
        cy.get('input[name="postcode"]').should('have.value', '15000');
        cy.get('input[name="contact_address_country_code"]').should('have.value', 'Česká republika');
      } else {
        cy.get('input[name="company_number"]').clear().type('27604977');
        cy.get('input[name="tax_number"]').clear().type('CZ27604977');
        cy.get('input[name="street"]').clear().type('Stroupežnického 3191/17, Smíchov');
        cy.get('input[name="city"]').clear().type('Praha');
        cy.get('input[name="postcode"]').clear().type('15000');
      }
    }

    cy.get('button[data-analytics-id="contacts.buttons.save"]').click();
  }

  typeSlowly(selector, text, delay = 100) {
    cy.get(selector).should('be.visible').then($el => {
      const chars = text.split('');
      function typeChar(index) {
        if (index < chars.length) {
          cy.wrap($el).type(chars[index], { delay }).then(() => {
            typeChar(index + 1);
          });
        }
      }
      cy.wait(delay);
      typeChar(0);
    });
  }

  startInvoiceCreation() {
    this.elements.newInvoiceButton().click();
  }

  fillInvoiceForm({ buyerName, price, vatLabel }) {
    const domain = Cypress.env('currentDomain');

    if (domain !== 'sk' && domain !== 'com') {
      cy.get('input[name="buyer_company_name"]').click();
      cy.get('.el-select-dropdown__item').contains(buyerName).click();
    }

    cy.get('.el-autocomplete > .el-textarea > .el-textarea__inner')
      .scrollIntoView()
      .type('TEST');

    cy.get('.invoice-line__column--price input').type(`${price}`);
    cy.get('.vat-rate-select .el-input__inner').click();
    cy.get('.el-select-dropdown__item').contains(vatLabel).click();
  }

  verifyInvoiceSummary({ expectedTotalRegex }) {
    cy.get('.table-invoice-summary > :nth-child(5) > :nth-child(2)')
      .should('be.visible')
      .invoke('text')
      .should('match', expectedTotalRegex);
  }

  saveInvoice() {
    cy.get('.form-actions > :nth-child(2) > .is-no-border').click();
  }

  navigateToInvoiceList() {
    cy.get('button.el-button--text.el-button--navbar')
      .contains(/Faktury|Invoices|Faktúry/i)
      .click();
  }

  verifyInvoiceInList({ buyerName, expectedTotalRegex, invoiceLabel, draftLabel }) {
    cy.contains('tr.el-table__row.row-state-proposal td', buyerName)
      .parents('tr')
      .within(() => {
        cy.get('[data-test="buyer_name_column"]').should('contain', buyerName);
        cy.get('[data-test="total_float_column"]').invoke('text').should('match', expectedTotalRegex);
        cy.get('[data-test="kind_column"]').should('contain', invoiceLabel);
        cy.get('[data-test="state_column"]').should('contain', draftLabel);
      });
  }
}

export default new ContactDetailPage();
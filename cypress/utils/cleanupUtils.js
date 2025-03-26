export function deleteInvoicesIfPresent({ confirmText, invoiceDeletedNotification }) {
    cy.get('button[data-analytics-id="icon-trash-alt"]').then($buttons => {
        if ($buttons.length > 0) {
            cy.get('button[data-analytics-id="icon-trash-alt"]').first().click({ force: true });
            cy.get('button[data-analytics-id="confirmButtonTitle"]').contains(confirmText).click();
            cy.contains(invoiceDeletedNotification, { timeout: 10000 }).should('not.exist');
        }
    });
}

export function deleteVisibleContacts({ confirmText, contactDeletedMessagePart }) {
    cy.get('.navigation__item').contains(/Kontakty|Contacts/i).click();
  
    // Wait for the contacts table or header to be visible before proceeding
    cy.get('h1, .el-table', { timeout: 10000 }).should('be.visible');
  
    const deleteNextContact = () => {
      cy.get('body').then($body => {
        const $trashButtons = $body.find('button[data-analytics-id="icon-trash-alt"]');
        if ($trashButtons.length === 0) {
          cy.log('No more contacts to delete');
          cy.get('tr.el-table__row').should('not.exist');
          return;
        }
  
        cy.wrap($trashButtons[0]).scrollIntoView().click({ force: true });
  
        cy.get('button[data-analytics-id="confirmButtonTitle"]', { timeout: 5000 })
          .contains(confirmText)
          .should('be.visible')
          .click({ force: true });
  
        cy.contains(contactDeletedMessagePart, { timeout: 10000 }).should('exist');
  
        cy.wait(300); // Give UI a moment to refresh
        deleteNextContact();
      });
    };
  
    deleteNextContact();
  }

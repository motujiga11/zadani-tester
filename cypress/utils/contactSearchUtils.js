export function verifyNoSearchResults(domain, keyword) {
    if (domain === 'cz') {
      cy.contains('Pro výraz:')
        .should('be.visible')
        .invoke('text')
        .should('match', new RegExp(`Pro výraz:\s*${keyword}\s*nebyly nalezeny žádné odpovídající kontakty\.`));
    } else if (domain === 'com') {
      cy.get('p.text--lg.text-center')
        .should('contain.text', 'No matching contacts found for:')
        .and('contain.text', keyword);
    } else if (domain === 'sk') {
      cy.get('p.text--lg.text-center')
        .should('be.visible')
        .invoke('text')
        .should('match', new RegExp(`Pre výraz:\s*${keyword}\s*sa nenašli žiadni zodpovedajúci kontakty\.`));
    }
  
    cy.get('@graphql').its('response.body.data.contacts.collection').should('have.length', 0);
  }
  
  export function verifyGoogleContactFromGraphQL(response, expected) {
    const contact = response.body.data.contacts.collection[0];
    expect(contact.name).to.eq(expected.name);
    expect(contact.companyNumber).to.eq(expected.companyNumber);
    expect(contact.city).to.eq(expected.city);
    expect(contact.postcode).to.eq(expected.postcode);
  }
  


  // Cypress.Commands.add('visitOnDomain', (args, domain = Cypress.env('currentDomain')) => {
  //   const customVisitCommand = `visit${domain.charAt(0).toUpperCase()}${domain.slice(1)}`;
  //   cy[customVisitCommand](args);
  // });

  // Cypress.Commands.add('visitCz', (args) => {
  //   cy.visit(`https://dev.fakturaonline.cz${args}`);
  // });

  // Cypress.Commands.add('visitCom', (args) => {
  //   cy.visit(`https://dev.invoiceonline.com${args}`);
  // });

  // Cypress.Commands.add('visitSk', (args) => {
  //   cy.visit(`https://dev.fakturaonline.sk${args}`);
  // });

Cypress.Commands.add('visitOnDomain', (path, domainCode = Cypress.env('currentDomain')) => {
  const domainMap = {
    cz: 'https://dev.fakturaonline.cz',
    sk: 'https://dev.fakturaonline.sk',
    com: 'https://dev.invoiceonline.com'
  };
  const url = domainMap[domainCode] + path;
  cy.visit(url);
});

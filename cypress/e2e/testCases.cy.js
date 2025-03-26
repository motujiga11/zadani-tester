import ContactsPage from '../pages/ContactsPage';
import ContactDetailPage from '../pages/ContactDetailPage';
import LoginPage from '../pages/LoginPage';
import { getInvoiceContext } from '../utils/invoiceUtils';
import { deleteInvoicesIfPresent, deleteVisibleContacts } from '../utils/cleanupUtils';
import { verifyNoSearchResults, verifyGoogleContactFromGraphQL } from '../utils/contactSearchUtils';

describe('Contacts E2E Tests', () => {
  const domains = ['cz', 'com', 'sk'];

  /**
   * Precondition Note:
   * To ensure consistent test behavior during this exercise, it is assumed that the test accounts
   * for each domain (cz, com, sk) do not have any existing contacts or invoices before tests are run.
   * This setup is handled in the global `before` hook, but in a real-world scenario,
   * each test should ideally be fully isolated and runnable in parallel without depending on the test state.
   *
   * Known issue: There is currently a problem during the deletion of contacts in the SK domain.
   * This behavior does not occur in CZ and COM domains.
   * If the rest of the suite looks good for you and you want to see how I handle that issue, this can be investigated further.
   */

  before(() => {
    cy.fixture('contacts').as('contacts');
  });

  domains.forEach(domain => {
    describe(`.${domain} domain`, function () {
      beforeEach(function () {
        Cypress.env('currentDomain', domain);
        const { email, password } = Cypress.env('users')[domain];
        LoginPage.visit();
        LoginPage.login(email, password);
        ContactsPage.visit();
      });

      it('should create a new contact', function () {
        ContactsPage.createContact(this.contacts.testContact);
        ContactsPage.verifyContactVisible(this.contacts.testContact.name, this.contacts.testContact);
      });

      it('should edit an existing contact', function () {
        ContactsPage.openContactDetail(this.contacts.testContact.name);
        ContactDetailPage.editContact({ name: this.contacts.googleContact.name });
        cy.contains(this.contacts.googleContact.name).should('be.visible');
      });

      it('should search and validate empty & filled results', function () {
        cy.intercept('POST', '**/graphql').as('graphql');
        ContactsPage.searchFor('Apple');
        cy.wait('@graphql');
        verifyNoSearchResults(domain, 'Apple');

        cy.intercept('POST', '**/graphql').as('graphqlGoogle');
        ContactsPage.searchFor('Google');
        cy.wait('@graphqlGoogle').then(({ response }) => {
          verifyGoogleContactFromGraphQL(response, this.contacts.googleContact);
        });
      });

      it('should sort contacts by name', function () {
        ContactsPage.createContact(this.contacts.secondContact);
        ContactsPage.sortByName();
        ContactsPage.verifySortedByNameAsc();
        ContactsPage.sortByName();
        ContactsPage.verifySortedByNameDesc();
      });

      it('should create invoice', function () {
        const price = 777;
        const domain = Cypress.env('currentDomain');
        const { name: buyerName } = this.contacts.googleContact;
        const {
          vatLabel,
          expectedTotalRegex,
          invoiceLabel,
          draftLabel
        } = getInvoiceContext(domain, price);

        ContactsPage.openContactDetail(buyerName);
        ContactDetailPage.startInvoiceCreation();
        ContactDetailPage.fillInvoiceForm({ buyerName, price, vatLabel });
        ContactDetailPage.verifyInvoiceSummary({ expectedTotalRegex });
        ContactDetailPage.saveInvoice();
        ContactDetailPage.navigateToInvoiceList();
        ContactDetailPage.verifyInvoiceInList({ buyerName, expectedTotalRegex, invoiceLabel, draftLabel });
      });

      after(function () {
        const domain = Cypress.env('currentDomain');

        cy.fixture('translations').then((translations) => {
          const { confirmText, invoiceDeletedNotification, contactDeletedMessagePart } = translations[domain];

          // If any of them are undefined, log it to the console
          if (!confirmText || !invoiceDeletedNotification || !contactDeletedMessagePart) {
            console.error('Missing translation key for domain:', domain);
          }

          deleteInvoicesIfPresent({ confirmText, invoiceDeletedNotification });
          deleteVisibleContacts({ confirmText, contactDeletedMessagePart });
        });
      });
    });
  });
});


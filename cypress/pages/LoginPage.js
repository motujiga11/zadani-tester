import { getLoginSuccessMessage } from '../utils/loginMessages';

class LoginPage {
  elements = {
    // Step 1: Initial login button on homepage
    initialLoginButton: () => cy.get('button[data-analytics-id="header.login"]'),

    // Step 2: Optional intermediate button
    loginToMyAccountButton: () => cy.get('button[data-analytics-id="signIn.v2.login"]'),

    // Step 3: Email and password fields
    emailInput: () => cy.get('input[type="email"][name="email"]'),
    passwordInput: () => cy.get('input[type="password"][name="password"]'),

    // Step 4: Final login button
    finalLoginButton: () => cy.get('button[data-analytics-id="button.login"]')
  };

  visit() {
    cy.visitOnDomain('/'); // Navigate to homepage (based on currentDomain)
  }

  login(email, password) {
    // Step 1: Click the initial login button
    this.elements.initialLoginButton().should('be.visible').click();

    // Step 2: Click intermediate button if needed
    cy.get('body').then($body => {
      if ($body.find('input[type="password"][name="password"]').length === 0) {
        this.elements.loginToMyAccountButton().should('be.visible').click();
      }
    });

    // Step 3: Fill in email and password
    this.elements.emailInput().should('be.visible').clear().type(email);
    this.elements.passwordInput().should('be.visible').clear().type(password);

    // Step 4: Click the final login button
    this.elements.finalLoginButton().should('be.visible').click();

    // Step 5: Wait for success message in alert box
    const domain = Cypress.env('currentDomain');
    const successMessage = getLoginSuccessMessage(domain);
    cy.get('.el-alert').should('contain', successMessage);
  }
}

export default new LoginPage();
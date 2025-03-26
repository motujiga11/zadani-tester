export const getLoginSuccessMessage = (domain) => {
    switch (domain) {
        case 'cz':
            return 'Přihlášení proběhlo úspěšně. Nyní můžete nerušeně vystavovat faktury!';
        case 'com':
            return 'You logged in successfully. Now you are free to issue invoices!';
        case 'sk':
            return 'Prihlásenie prebehlo úspešne. Teraz môžete nerušene vystavovať faktúry!';
        default:
            throw new Error(`Unknown domain: ${domain}`);
    }
};

export function getContactsPagePath(domain) {
    const map = {
      cz: '/kontakty',
      sk: '/kontakty',
      com: '/contacts'
    };
  
    return map[domain] || '/kontakty'; // fallback to CZ if not matched
  }
  
// Redirect to HTTPS if not in development
const isProduction = location.hostname.toLowerCase().endsWith('jaredcodes.com');
if (isProduction && location.protocol !== 'https:') {
  location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
}

// Open resume menu item in newtab
document.querySelectorAll('a[href="/assets/jared-johnson-resume.pdf"]').forEach(el => el.target="newtab");

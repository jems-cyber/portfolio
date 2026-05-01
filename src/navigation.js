export const headerData = {
  links: [
    // Simple, flat links. No massive dropdown menus.
    { text: 'About me', href: '/#about' },
    { text: 'My skills', href: '/#features' },
    { text: 'Projects', href: '/#projects' },
    { text: 'Contact me' , href: '/#contact' }
  ],
  actions: [
    // The button on the far right of the header
    { text: 'GitHub', href: 'https://github.com/jems-cyber', target: '_blank' }
  ],
};

export const footerData = {
  // A clean, simple footer instead of the massive 4-column mega-footer
  links: [],
  secondaryLinks: [
    { text: 'Terms', href: '/terms' },
    { text: 'Privacy Policy', href: '/privacy' },
  ],
  socialLinks: [
    { ariaLabel: 'X', icon: 'tabler:brand-x', href: '#' },
    { ariaLabel: 'LinkedIn', icon: 'tabler:brand-linkedin', href: '#' },
    { ariaLabel: 'Github', icon: 'tabler:brand-github', href: 'https://github.com/jems-cyber' },
  ],
  footNote: `
    Made by Jeremy Ramesh · Built with AstroWind.
  `,
};

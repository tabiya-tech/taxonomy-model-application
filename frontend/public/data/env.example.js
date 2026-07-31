window.tabiyaConfig = {
  BACKEND_URL: btoa("https://foo.bar/api/"),
  LOCALES_URL: btoa("https://foo.bar/api"),
  AUTH_URL: btoa("https://auth.foo.bar"),
  COGNITO_CLIENT_ID: btoa(""),
  COGNITO_CLIENT_SECRET: btoa(""),
  LOGO_URL: btoa("/logo.svg"),
  NAVBAR_LOGOS: btoa(JSON.stringify([{ src: "/logo.svg", alt: "Tabiya", height: 30 }])),
  PARTNER_LOGOS: btoa(""),
  FRONTEND_THEME_CSS_VARIABLES: btoa(
    JSON.stringify({
      "brand-primary": "0 33 71",
      "brand-primary-light": "64 89 117",
      "brand-primary-dark": "0 25 53",
      "brand-primary-contrast-text": "255 255 255",
      "brand-secondary": "38 94 167",
      "brand-secondary-light": "92 134 189",
      "brand-secondary-dark": "29 71 125",
      "brand-secondary-contrast-text": "255 255 255",
      "text-primary": "0 33 71",
      "text-secondary": "67 71 78",
      "text-accent": "38 94 167",
      "font-heading": '"IBM Plex Mono", monospace',
      "font-body": '"Inter", sans-serif',
    })
  ),
  FRONTEND_BROWSER_TAB_TITLE: btoa(""),
  FRONTEND_FAVICON_URL: btoa(""),
  FRONTEND_APP_ICON_URL: btoa(""),
  FRONTEND_LANDING_COPY: btoa(
    JSON.stringify({
      eyebrow: { text: "Inclusive Livelihoods Taxonomy", color: "#1D6023" },
      heading: "Every form of work builds skills. We make them visible.",
      description: "An open taxonomy of occupations and skills covering the seen economy of formal work, based on ESCO, and the unseen economy of care and informal work, based on ICATUS. Localized for the labour markets where our partners operate.",
      ctaCaption: "Start exploring opens the latest Base taxonomy · browse for country versions, CSV download and API access.",
      readMoreLink: {
        text: "Read what the taxonomy is and how it was conceived",
        url: "https://docs.tabiya.org/our-tech-stack/inclusive-livelihoods-taxonomy",
      },
    })
  ),
  FRONTEND_LANDING_STATS: btoa(
    JSON.stringify([
      { value: "3,000+", description: "occupations across the seen and unseen economy" },
      { value: "13,000+", description: "skills and competencies, cross-linked to occupations" },
      { value: "4", description: "taxonomies: Base (EN·ES), South Africa, Kenya, Zambia" },
    ])
  ),
  FRONTEND_API_DOCS: btoa(
    JSON.stringify({
      apiBaseUrl: "https://foo.bar",
      exampleModel: { id: "mdl_base_2f9a", label: "Base (Tabiya ESCO 1.1.1), v2.0.0" },
      credentialsUrl: "https://foo.bar#credentials-and-authentication",
      guide: {
        url: "https://foo.bar/open-taxonomy-platform-api",
      },
    })
  ),
};

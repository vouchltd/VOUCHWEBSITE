// One place for the values that show up across the site.
// Edit here, then rebuild. Pages reference these as {{token}}.
const price = 25;
const minLocations = 5;

export default {
  // Canonical host. The old site redirected vouchsocal.com to www, so we match that.
  url: 'https://www.vouchsocal.com',
  email: 'vouchsocal@gmail.com',
  // Pilot form posts here. Same Formspree form the old audit form used.
  formspree: 'https://formspree.io/f/mrewovza',
  // Pricing. Change the number here and every page updates.
  price,
  minLocations,
  minMonthly: price * minLocations, // shown on the pricing page
  price10: price * 10, // worked example on the pricing page
  pilotDays: '30',
  pilotLocations: '3 to 5',
};

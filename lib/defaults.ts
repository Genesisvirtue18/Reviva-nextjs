import type { SiteSettings } from './types';

/*
 * The header/footer content exactly as it was on the static site. Used until
 * a "Site Settings" document exists in Sanity, and as the import seed for it.
 */
export const defaultSettings: SiteSettings = {
  logo: '/assets/images/Reviva_logo_.webp',
  logoAlt: 'Reviva Skin & Surgery Clinic',
  callDisplay: '78274 48711',
  callTel: '+917827448711',
  bookUrl: '/contact.html',
  nav: [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about.html' },
    {
      label: 'Treatments',
      columns: [
        {
          title: 'Signature',
          description: 'Our most requested non-surgical lifting protocols.',
          feature: true,
          links: [
            { label: 'Non-Surgical Face Lift (HIFU)', href: '/hifu-face-lift.html' },
            { label: 'RF Face Tightening', href: '/rf-face-tightening.html' },
            { label: 'Thread Lift', href: '/thread-lift.html' },
          ],
        },
        {
          title: 'Laser',
          links: [
            { label: 'Laser Hair Reduction', href: '/laser-hair-reduction.html' },
            { label: 'Laser for Pigmentation', href: '/laser-for-pigmentation.html' },
            { label: 'Birth Mark Removal', href: '/birth-mark.html' },
            { label: 'Tattoo Removal', href: '/tattoo.html' },
            { label: 'Stretch Marks', href: '/stretch-marks.html' },
            { label: 'Acne Scars', href: '/acne-scars.html' },
            { label: 'Freckles', href: '/freckles.html' },
            { label: 'Mole / Wart / Skin Tag', href: '/skin-tag.html' },
          ],
        },
        {
          title: 'Skin',
          links: [
            { label: 'Acne', href: '/acne-treatment.html' },
            { label: 'Melasma', href: '/melasma-treatment.html' },
            { label: 'Pigmentation', href: '/pigmentation-treatment.html' },
            { label: 'Dark Circles', href: '/dark-circles-treatment.html' },
            { label: 'Dark Lips', href: '/dark-lips-treatment.html' },
            { label: 'Body Polishing', href: '/body-polishing.html' },
            { label: 'Skin Brightening', href: '/skin-brightening.html' },
            { label: 'Eyebrows Microblading', href: '/eyebrows-microblading.html' },
          ],
        },
        {
          title: 'Hair',
          links: [
            { label: 'GFC Therapy', href: '/gfc-therapy.html' },
            { label: 'DUTEXOME Mesotherapy', href: '/dutexome-mesotherapy.html' },
            { label: 'Growth Factors Mesotherapy', href: '/growth-factors-mesotherapy.html' },
            { label: 'Hair Transplant', href: '/hair-transplant.html' },
            { label: 'Alopecia Treatment', href: '/alopecia-treatment.html' },
            { label: 'Female Hair Thinning', href: '/female-hair-thinning.html' },
          ],
        },
        {
          title: 'Medi Facials',
          links: [
            { label: 'Hydrafacial', href: '/hydra-facial.html' },
            { label: 'Oxygeneo Facial', href: '/oxygeneo-facial.html' },
            { label: 'Fire & Ice Facial', href: '/Fire-and-ice-facial.html' },
            { label: 'PRX Plus Treatment', href: '/prx-plus-treatment.html' },
            { label: 'Lumiere Glow Ritual', href: '/lumiere-glow-ritual.html' },
            { label: 'Reviva Glow Infusion', href: '/reviva-glow-infusion.html' },
          ],
        },
        {
          title: 'Injectables',
          links: [
            { label: 'Under Eye Fillers', href: '/under-eye-fillers.html' },
            { label: 'Jawline Enhancement', href: '/jawline-enhancement.html' },
            { label: 'Face Lift with Fillers', href: '/face-lift-fillers.html' },
            { label: 'Cheek Enhancement', href: '/cheek-enhancement.html' },
            { label: 'Lip Fillers', href: '/lip-fillers.html' },
            { label: 'Non-Surgical Rhinoplasty', href: '/non-surgical-rhinoplasty.html' },
            { label: 'Double Chin Reduction', href: '/double-chin-reduction.html' },
            { label: 'Neck Lines', href: '/neck-lines-treatment.html' },
            { label: 'Wrinkle Reduction', href: '/wrinkle-reduction.html' },
          ],
        },
        {
          title: 'Dermatosurgery',
          links: [
            { label: 'Xanthelasma Removal', href: '/xanthelasma-removal.html' },
            { label: 'Earlobe Repair', href: '/earlobe-repair.html' },
            { label: 'Scar Excision', href: '/scar-excision.html' },
          ],
        },
      ],
    },
    { label: 'Results', href: '/gallery.html' },
    { label: 'Reviews', href: '/reviews.html' },
    { label: 'Blog', href: '/blogs.html' },
    { label: 'Contact', href: '/contact.html' },
  ],
  footerBlurb:
    'Premium dermatology, cosmetology and aesthetic surgery in Raj Nagar Extension,\n          Ghaziabad and Sector 76, Noida — where science meets skin.',
  social: { facebook: '#', instagram: '#', youtube: '#', x: '#' },
  footerTreatments: [
    { label: 'Non-Surgical Face Lift', href: '/hifu-face-lift.html' },
    { label: 'Laser Hair Reduction', href: '/laser-hair-reduction.html' },
    { label: 'Acne Treatment', href: '/acne-treatment.html' },
    { label: 'Pigmentation', href: '/pigmentation-treatment.html' },
    { label: 'Hair Transplant', href: '/hair-transplant.html' },
    { label: 'Fillers & Injectables', href: '/under-eye-fillers.html' },
    { label: 'Medi Facials', href: '/medi-facials.html' },
    { label: 'View All Treatments', href: '/treatment.html' },
  ],
  footerClinic: [
    { label: 'About Us', href: '/about.html' },
    { label: 'Results Gallery', href: '/gallery.html' },
    { label: 'Patient Reviews', href: '/reviews.html' },
    { label: 'Blog', href: '/blogs.html' },
    { label: 'Ghaziabad Clinic', href: '/ghaziabad.html' },
    { label: 'Noida Clinic', href: '/noida.html' },
    { label: 'Contact', href: '/contact.html' },
  ],
  locations: [
    {
      name: 'Ghaziabad',
      address: 'Quantum Homes, Raj Nagar Extension, Ghaziabad, Uttar Pradesh 201017',
      phoneDisplay: '+91 78274 48711',
      phoneTel: '+917827448711',
    },
    {
      name: 'Noida',
      address: 'Amrapali Silicon City, Gate No.-4, Sector-76, Noida',
      phoneDisplay: '+91 85958 56844',
      phoneTel: '+918595856844',
    },
  ],
  email: 'revivaskinandsurgery@gmail.com',
  hours: 'Mon–Sat: 11:00 AM – 1:00 PM, 5:00 PM – 7:30 PM',
  legal: [
    { label: 'Privacy Policy', href: '/privacy.html' },
    { label: 'Cookie Policy', href: '/cookie.html' },
    { label: 'No Refund Policy', href: '/norefundpolicy.html' },
    { label: 'Patient Data Protection', href: '/patientdata.html' },
    { label: 'Treatment Disclaimer', href: '/treatmentdisclaimer.html' },
    { label: 'Site Map', href: '/sitemap.html' },
  ],
};
